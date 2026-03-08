const {
    getSupplierAnalysis,
    getCustomerPurchaseHistory,
    getTopProductsByCategory,
    getTransactionAnalytics
} = require('../services/analyticsService');

// Get supplier analysis
const getSupplierAnalysisController = async (req, res) => {
    try {
        const data = await getSupplierAnalysis();
        
        res.status(200).json({
            success: true,
            message: 'Supplier analysis retrieved successfully',
            data: data.map(supplier => ({
                supplier_name: supplier.supplier_name,
                contact_email: supplier.contact_email,
                contact_phone: supplier.contact_phone,
                products_offered: supplier.totalProductsOffered,
                total_inventory_value: supplier.totalInventoryValue.toFixed(2)
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get customer purchase history
const getCustomerHistoryController = async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Customer email is required as query parameter'
            });
        }

        const history = await getCustomerPurchaseHistory(email);
        
        res.status(200).json({
            success: true,
            message: 'Customer purchase history retrieved successfully',
            data: history
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
};

// Get top products by category
const getTopProductsController = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const data = await getTopProductsByCategory(parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'Top products by category retrieved successfully',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get general transaction analytics
const getTransactionAnalyticsController = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const data = await getTransactionAnalytics(startDate, endDate);
        
        res.status(200).json({
            success: true,
            message: 'Transaction analytics retrieved successfully',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getSupplierAnalysisController,
    getCustomerHistoryController,
    getTopProductsController,
    getTransactionAnalyticsController
};
