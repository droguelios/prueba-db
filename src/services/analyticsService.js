const { connectMongo } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

/**
 * Analytics Service - Complex business intelligence queries
 * Implements aggregation pipelines for MongoDB
 */

// 1. Supplier Analysis - Top suppliers by quantity sold and inventory value
const getSupplierAnalysis = async () => {
    try {
        const db = await connectMongo();

        const supplierAnalysis = await db.collection('transactions')
            .aggregate([
                // Deconstruct items array
                { $unwind: '$items' },
                // Group by supplier
                {
                    $group: {
                        _id: '$items.sku', // Will be replaced with supplier lookup
                        totalQuantitySold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: '$items.line_total' }
                    }
                }
            ])
            .toArray();

        // Get supplier details with their products
        const supplierDetails = await db.collection('suppliers')
            .aggregate([
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: 'supplier_id',
                        as: 'products'
                    }
                },
                {
                    $addFields: {
                        totalProductsOffered: { $size: '$products' },
                        totalInventoryValue: {
                            $sum: {
                                $map: {
                                    input: '$products',
                                    as: 'prod',
                                    in: { $multiply: ['$$prod.unit_price', '$$prod.current_stock'] }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        supplier_name: 1,
                        contact_email: 1,
                        contact_phone: 1,
                        totalProductsOffered: 1,
                        totalInventoryValue: 1
                    }
                },
                { $sort: { totalInventoryValue: -1 } }
            ])
            .toArray();

        return supplierDetails;
    } catch (error) {
        throw new Error(`Error in supplier analysis: ${error.message}`);
    }
};

// 2. Customer Behavior - Purchase history for a specific customer
const getCustomerPurchaseHistory = async (customerEmail) => {
    try {
        const db = await connectMongo();

        // Find customer
        const customer = await db.collection('customers').findOne({ email: customerEmail });
        if (!customer) {
            throw new Error(`Customer with email ${customerEmail} not found`);
        }

        // Get all transactions for this customer
        const purchaseHistory = await db.collection('transactions')
            .aggregate([
                { 
                    $match: { 
                        customer_id: customer._id 
                    } 
                },
                {
                    $project: {
                        transaction_identifier: 1,
                        transaction_date: 1,
                        items: 1,
                        total_amount: 1
                    }
                },
                { $sort: { transaction_date: -1 } }
            ])
            .toArray();

        // Calculate summary statistics
        const summary = {
            customer_id: customer._id,
            customer_name: customer.customer_name,
            customer_email: customer.email,
            total_transactions: purchaseHistory.length,
            total_spent: purchaseHistory.reduce((sum, trans) => sum + trans.total_amount, 0),
            average_order_value: purchaseHistory.length > 0 
                ? purchaseHistory.reduce((sum, trans) => sum + trans.total_amount, 0) / purchaseHistory.length 
                : 0,
            first_purchase_date: purchaseHistory.length > 0 
                ? purchaseHistory[purchaseHistory.length - 1].transaction_date 
                : null,
            last_purchase_date: purchaseHistory.length > 0 
                ? purchaseHistory[0].transaction_date 
                : null
        };

        return {
            summary,
            transactions: purchaseHistory
        };
    } catch (error) {
        throw new Error(`Error fetching customer purchase history: ${error.message}`);
    }
};

// 3. Star Products - Top products by category by revenue
const getTopProductsByCategory = async (limit = 10) => {
    try {
        const db = await connectMongo();

        // Get all categories first
        const categories = await db.collection('categories').find({}).toArray();
        const categoryMap = new Map();
        categories.forEach(cat => categoryMap.set(cat._id.toString(), cat.category_name));

        const topProducts = await db.collection('transactions')
            .aggregate([
                // Deconstruct items
                { $unwind: '$items' },
                // Group by category and product
                {
                    $group: {
                        _id: {
                            category: '$items.category',
                            sku: '$items.sku',
                            product_name: '$items.product_name'
                        },
                        totalQuantity: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: '$items.line_total' },
                        unitPrice: { $first: '$items.unit_price' }
                    }
                },
                // Sort by revenue descending within each category
                { 
                    $sort: { 
                        '_id.category': 1,
                        totalRevenue: -1 
                    } 
                },
                // Group by category and take top items
                {
                    $group: {
                        _id: '$_id.category',
                        products: {
                            $push: {
                                sku: '$_id.sku',
                                product_name: '$_id.product_name',
                                totalQuantitySold: '$totalQuantity',
                                totalRevenue: '$totalRevenue',
                                unitPrice: '$unitPrice'
                            }
                        }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        products: { $slice: ['$products', limit] },
                        _id: 0
                    }
                },
                { $sort: { category: 1 } }
            ])
            .toArray();

        return topProducts;
    } catch (error) {
        throw new Error(`Error fetching top products by category: ${error.message}`);
    }
};

// Additional: Get transactions with detailed analytics
const getTransactionAnalytics = async (startDate = null, endDate = null) => {
    try {
        const db = await connectMongo();

        const matchStage = {};
        if (startDate || endDate) {
            matchStage.transaction_date = {};
            if (startDate) matchStage.transaction_date.$gte = new Date(startDate);
            if (endDate) matchStage.transaction_date.$lte = new Date(endDate);
        }

        const analytics = await db.collection('transactions')
            .aggregate([
                Object.keys(matchStage).length > 0 ? { $match: matchStage } : { $match: {} },
                {
                    $group: {
                        _id: null,
                        totalTransactions: { $sum: 1 },
                        totalRevenue: { $sum: '$total_amount' },
                        averageOrderValue: { $avg: '$total_amount' },
                        maxOrderValue: { $max: '$total_amount' },
                        minOrderValue: { $min: '$total_amount' }
                    }
                }
            ])
            .toArray();

        return analytics.length > 0 ? analytics[0] : {
            totalTransactions: 0,
            totalRevenue: 0,
            averageOrderValue: 0
        };
    } catch (error) {
        throw new Error(`Error fetching transaction analytics: ${error.message}`);
    }
};

module.exports = {
    getSupplierAnalysis,
    getCustomerPurchaseHistory,
    getTopProductsByCategory,
    getTransactionAnalytics
};