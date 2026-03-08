const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getDeletedProductLogs
} = require('../services/productService');

// Get all products
const getAllProductsController = async (req, res) => {
    try {
        const products = await getAllProducts();
        res.status(200).json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get product by ID
const getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create new product
const createProductController = async (req, res) => {
    try {
        const product = await createProduct(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update product
const updateProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await updateProduct(id, req.body);
        
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete product
const deleteProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const deleted = await deleteProduct(id, reason || 'Manual deletion via API');
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully and logged for audit'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get deletion audit logs
const getAuditLogsController = async (req, res) => {
    try {
        const { limit = 100, skip = 0 } = req.query;
        const { logs, total } = await getDeletedProductLogs(parseInt(limit), parseInt(skip));
        
        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllProductsController,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController,
    getAuditLogsController
};
        const productIndex = products.findIndex(p => p.id === parseInt(id));
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        products[productIndex] = { ...products[productIndex], name, price, description };
        res.json({ product: products[productIndex] });
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
;

// Eliminar un producto
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productIndex = products.findIndex(p => p.id === parseInt(id));
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        products.splice(productIndex, 1);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
