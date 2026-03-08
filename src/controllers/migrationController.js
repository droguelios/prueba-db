const { importFromCSV } = require('../services/migrationService');
const path = require('path');

/**
 * Migration Controller - Handle data import from CSV files
 */

// Import data from CSV file
const importCSVController = async (req, res) => {
    try {
        // Get CSV file path from request body or use default
        let csvPath = req.body?.file_path || path.join(__dirname, '../../docs/sample_data.csv');

        console.log(`📥 Starting migration from: ${csvPath}`);

        const result = await importFromCSV(csvPath);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.statistics,
            errors: result.errors
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    importCSVController
};