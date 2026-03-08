const express = require('express');
const {
    getAllProductsController,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController,
    getAuditLogsController
} = require('../controllers/productcontroller');

const router = express.Router();

// GET /products - Get all products
router.get('/', getAllProductsController);

// GET /products/audit/logs - Get deletion audit logs
router.get('/audit/logs', getAuditLogsController);

// GET /products/:id - Get product by ID
router.get('/:id', getProductByIdController);

// POST /products - Create new product
router.post('/', createProductController);

// PUT /products/:id - Update product
router.put('/:id', updateProductController);

// DELETE /products/:id - Delete product
router.delete('/:id', deleteProductController);

module.exports = router;
