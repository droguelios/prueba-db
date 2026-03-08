const express = require('express');
const {
    getSupplierAnalysisController,
    getCustomerHistoryController,
    getTopProductsController,
    getTransactionAnalyticsController
} = require('../controllers/analyticontrollers');

const router = express.Router();

// GET /analytics/suppliers - Supplier analysis (most products sold, inventory value)
router.get('/suppliers', getSupplierAnalysisController);

// GET /analytics/customers - Customer purchase history
router.get('/customers', getCustomerHistoryController);

// GET /analytics/products - Top products by category
router.get('/products', getTopProductsController);

// GET /analytics/transactions - General transaction analytics
router.get('/transactions', getTransactionAnalyticsController);

module.exports = router;
