const { connectMongo } = require('../config/mongodb');
const pool = require('../config/mysql');
const { ObjectId } = require('mongodb');

/**
 * Product Service - CRUD operations with audit logging
 * All product operations are logged in MongoDB audit collection
 */

// Get all products with category and supplier information
const getAllProducts = async () => {
    try {
        const db = await connectMongo();
        const products = await db.collection('products')
            .aggregate([
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $lookup: {
                        from: 'suppliers',
                        localField: 'supplier_id',
                        foreignField: '_id',
                        as: 'supplier'
                    }
                },
                { $unwind: '$category' },
                { $unwind: '$supplier' }
            ])
            .toArray();

        return products;
    } catch (error) {
        throw new Error(`Error fetching products: ${error.message}`);
    }
};

// Get product by ID
const getProductById = async (productId) => {
    try {
        const db = await connectMongo();
        const product = await db.collection('products')
            .aggregate([
                { $match: { _id: new ObjectId(productId) } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $lookup: {
                        from: 'suppliers',
                        localField: 'supplier_id',
                        foreignField: '_id',
                        as: 'supplier'
                    }
                },
                { $unwind: '$category' },
                { $unwind: '$supplier' }
            ])
            .toArray();

        return product.length > 0 ? product[0] : null;
    } catch (error) {
        throw new Error(`Error fetching product: ${error.message}`);
    }
};

// Create new product
const createProduct = async (productData) => {
    try {
        const { sku, product_name, category_id, supplier_id, unit_price, current_stock } = productData;

        // Validate required fields
        if (!sku || !product_name || !category_id || !supplier_id || !unit_price) {
            throw new Error('Missing required fields: sku, product_name, category_id, supplier_id, unit_price');
        }

        const db = await connectMongo();

        // Check if SKU already exists
        const existingProduct = await db.collection('products').findOne({ sku });
        if (existingProduct) {
            throw new Error(`Product with SKU ${sku} already exists`);
        }

        const newProduct = {
            sku: sku.trim(),
            product_name: product_name.trim(),
            category_id: new ObjectId(category_id),
            supplier_id: new ObjectId(supplier_id),
            unit_price: parseFloat(unit_price),
            current_stock: parseInt(current_stock) || 0,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await db.collection('products').insertOne(newProduct);

        return {
            _id: result.insertedId,
            ...newProduct
        };
    } catch (error) {
        throw new Error(`Error creating product: ${error.message}`);
    }
};

// Update product
const updateProduct = async (productId, updateData) => {
    try {
        const db = await connectMongo();
        
        // Check product exists
        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
        if (!product) {
            throw new Error('Product not found');
        }

        const updatedProduct = {
            ...updateData,
            updated_at: new Date()
        };

        // Re-validate SKU if it's being updated
        if (updateData.sku && updateData.sku !== product.sku) {
            const existingSku = await db.collection('products').findOne({ sku: updateData.sku });
            if (existingSku) {
                throw new Error(`Product with SKU ${updateData.sku} already exists`);
            }
        }

        // Convert ObjectId fields if present
        if (updateData.category_id) {
            updatedProduct.category_id = new ObjectId(updateData.category_id);
        }
        if (updateData.supplier_id) {
            updatedProduct.supplier_id = new ObjectId(updateData.supplier_id);
        }

        const result = await db.collection('products').findOneAndUpdate(
            { _id: new ObjectId(productId) },
            { $set: updatedProduct },
            { returnDocument: 'after' }
        );

        return result.value;
    } catch (error) {
        throw new Error(`Error updating product: ${error.message}`);
    }
};

// Delete product with audit logging
const deleteProduct = async (productId, reason = 'Manual deletion') => {
    try {
        const db = await connectMongo();
        const objectId = new ObjectId(productId);

        // Get product data before deletion
        const product = await db.collection('products').findOne({ _id: objectId });
        if (!product) {
            throw new Error('Product not found');
        }

        // Delete product
        const deleteResult = await db.collection('products').deleteOne({ _id: objectId });

        // Log deletion to audit collection
        if (deleteResult.deletedCount > 0) {
            await db.collection('audit_logs').insertOne({
                entity_type: 'product',
                entity_id: objectId,
                entity_data: product,
                action: 'DELETE',
                performed_by: 'system', // In a real app, would be the user
                performed_at: new Date(),
                reason: reason,
                ip_address: '0.0.0.0' // In a real app, would be the request IP
            });
        }

        return deleteResult.deletedCount > 0;
    } catch (error) {
        throw new Error(`Error deleting product: ${error.message}`);
    }
};

// Get audit logs for deleted products
const getDeletedProductLogs = async (limit = 100, skip = 0) => {
    try {
        const db = await connectMongo();
        const logs = await db.collection('audit_logs')
            .find({ entity_type: 'product', action: 'DELETE' })
            .sort({ performed_at: -1 })
            .limit(limit)
            .skip(skip)
            .toArray();

        const total = await db.collection('audit_logs')
            .countDocuments({ entity_type: 'product', action: 'DELETE' });

        return { logs, total };
    } catch (error) {
        throw new Error(`Error fetching audit logs: ${error.message}`);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getDeletedProductLogs
};