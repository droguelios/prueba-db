const express = require('express');
const { importCSVController } = require('../controllers/migrationController');

const router = express.Router();

// POST /migration/import - Import data from CSV file
router.post('/import', importCSVController);

module.exports = router;