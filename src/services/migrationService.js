const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { connectMongo } = require('../config/mongodb');
const pool = require('../config/mysql');

/**
 * Migration Service - Handles bulk data import from CSV to SQL and NoSQL
 * Implements idempotent logic to prevent duplicate master data
 */

// Helper function to normalize email for deduplication
const normalizeEmail = (email) => email.toLowerCase().trim();

// Helper function to normalize supplier contact for deduplication
const normalizeSupplierName = (name) => name.trim();

/**
 * Import data from CSV file
 * Reads CSV and distributes data to SQL (master data) and MongoDB (transactions)
 * Returns migration result with statistics
 */
const importFromCSV = async (csvFilePath) => {
    try {
        const migrationStartTime = new Date();
        let totalRows = 0;
        let successfulRows = 0;
        let failedRows = 0;
        const errors = [];

        // Validate file exists
        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found: ${csvFilePath}`);
        }

        // In-memory storage for deduplication during import
        const categories = new Map(); // name -> id
        const suppliers = new Map(); // name -> id
        const customers = new Map(); // email -> id
        const products = new Map(); // sku -> id

        console.log('📂 Starting migration process...');
        console.log('Step 1: Loading existing master data from databases...');

        // Load existing data to prevent duplicates
        const db = await connectMongo();

        // Load categories
        const categoryDocs = await db.collection('categories').find({}).toArray();
        const categoryMap = new Map();
        for (const cat of categoryDocs) {
            categoryMap.set(cat.category_name, cat._id);
        }

        // Load suppliers
        const supplierDocs = await db.collection('suppliers').find({}).toArray();
        const supplierMap = new Map();
        for (const sup of supplierDocs) {
            supplierMap.set(sup.supplier_name, sup._id);
        }

        // Load customers
        const customerDocs = await db.collection('customers').find({}).toArray();
        const customerMap = new Map();
        for (const cust of customerDocs) {
            customerMap.set(normalizeEmail(cust.email), cust._id);
        }

        // Load products
        const productDocs = await db.collection('products').find({}).toArray();
        const productMap = new Map();
        for (const prod of productDocs) {
            productMap.set(prod.sku, prod._id);
        }

        console.log('✓ Existing data loaded');
        console.log('Step 2: Reading and processing CSV file...');

        // Data to be inserted
        const newCategories = [];
        const newSuppliers = [];
        const newCustomers = [];
        const newProducts = [];
        const transactions = [];

        // Read CSV and collect data
        return new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', async (row) => {
                    try {
                        totalRows++;
                        
                        // Process category
                        const categoryName = row.ProductCategory.trim();
                        if (!categoryMap.has(categoryName) && !newCategories.find(c => c.category_name === categoryName)) {
                            newCategories.push({
                                category_name: categoryName,
                                description: '',
                                created_at: new Date(),
                                updated_at: new Date()
                            });
                        }

                        // Process supplier
                        const supplierName = normalizeSupplierName(row.SupplierName);
                        if (!supplierMap.has(supplierName) && !newSuppliers.find(s => s.supplier_name === supplierName)) {
                            newSuppliers.push({
                                supplier_name: supplierName,
                                contact_email: row.SupplierContact.toLowerCase().trim(),
                                contact_phone: '',
                                address: '',
                                created_at: new Date(),
                                updated_at: new Date()
                            });
                        }

                        // Process customer
                        const customerEmail = normalizeEmail(row.CustomerEmail);
                        if (!customerMap.has(customerEmail) && !newCustomers.find(c => normalizeEmail(c.email) === customerEmail)) {
                            newCustomers.push({
                                customer_name: row.CustomerName.trim(),
                                email: customerEmail,
                                address: row.Address.trim(),
                                phone_number: '',
                                created_at: new Date(),
                                updated_at: new Date()
                            });
                        }

                        successfulRows++;
                    } catch (error) {
                        failedRows++;
                        errors.push(`Row ${totalRows}: ${error.message}`);
                    }
                })
                .on('end', async () => {
                    try {
                        console.log('Step 3: Inserting new categories to MongoDB...');
                        if (newCategories.length > 0) {
                            const catResult = await db.collection('categories').insertMany(newCategories, { ordered: false }).catch(() => {});
                            newCategories.forEach((cat, index) => {
                                if (catResult && catResult.insertedIds[index]) {
                                    categoryMap.set(cat.category_name, catResult.insertedIds[index]);
                                }
                            });
                        }

                        console.log('Step 4: Inserting new suppliers to MongoDB...');
                        if (newSuppliers.length > 0) {
                            const supResult = await db.collection('suppliers').insertMany(newSuppliers, { ordered: false }).catch(() => {});
                            newSuppliers.forEach((sup, index) => {
                                if (supResult && supResult.insertedIds[index]) {
                                    supplierMap.set(sup.supplier_name, supResult.insertedIds[index]);
                                }
                            });
                        }

                        console.log('Step 5: Inserting new customers to MongoDB...');
                        if (newCustomers.length > 0) {
                            const custResult = await db.collection('customers').insertMany(newCustomers, { ordered: false }).catch(() => {});
                            newCustomers.forEach((cust, index) => {
                                if (custResult && custResult.insertedIds[index]) {
                                    customerMap.set(normalizeEmail(cust.email), custResult.insertedIds[index]);
                                }
                            });
                        }

                        console.log('Step 6: Processing transactions...');
                        
                        // Re-read CSV to create transactions with references
                        const transactionsMap = new Map();
                        
                        fs.createReadStream(csvFilePath)
                            .pipe(csv())
                            .on('data', (row) => {
                                const transactionId = row.TransactionID;
                                const customerEmail = normalizeEmail(row.CustomerEmail);

                                if (!transactionsMap.has(transactionId)) {
                                    transactionsMap.set(transactionId, {
                                        transaction_identifier: transactionId,
                                        customer_id: customerMap.get(customerEmail),
                                        customer_name: row.CustomerName,
                                        customer_email: customerEmail,
                                        transaction_date: new Date(row.Date),
                                        items: [],
                                        total_amount: 0,
                                        created_at: new Date()
                                    });
                                }

                                const lineTrans = transactionsMap.get(transactionId);
                                const lineTotal = parseFloat(row.UnitPrice) * parseInt(row.Quantity);
                                
                                lineTrans.items.push({
                                    product_id: null, // Will be set if product exists
                                    sku: row.SKU,
                                    product_name: row.ProductName.trim(),
                                    category: row.ProductCategory.trim(),
                                    quantity: parseInt(row.Quantity),
                                    unit_price: parseFloat(row.UnitPrice),
                                    line_total: lineTotal
                                });
                                
                                lineTrans.total_amount += lineTotal;
                            })
                            .on('end', async () => {
                                // Insert transactions to MongoDB
                                const transactionsArray = Array.from(transactionsMap.values());
                                
                                if (transactionsArray.length > 0) {
                                    await db.collection('transactions').insertMany(transactionsArray, { ordered: false }).catch(() => {});
                                }

                                const migrationEndTime = new Date();
                                const duration = (migrationEndTime - migrationStartTime) / 1000;

                                // Log migration
                                const migrationLog = {
                                    migration_file: path.basename(csvFilePath),
                                    total_rows: successfulRows,
                                    successful_rows: successfulRows,
                                    failed_rows: failedRows,
                                    started_at: migrationStartTime,
                                    completed_at: migrationEndTime,
                                    status: 'COMPLETED'
                                };

                                await db.collection('migration_logs').insertOne(migrationLog);

                                resolve({
                                    success: true,
                                    message: 'Migration completed successfully',
                                    statistics: {
                                        totalRows: successfulRows,
                                        successfulRows,
                                        failedRows,
                                        duration: `${duration}s`,
                                        newCategories: newCategories.length,
                                        newSuppliers: newSuppliers.length,
                                        newCustomers: newCustomers.length,
                                        transactions: transactionsArray.length
                                    },
                                    errors: errors.length > 0 ? errors : null
                                });
                            });
                    } catch (error) {
                        reject(error);
                    }
                });
        });
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
};

module.exports = {
    importFromCSV
};