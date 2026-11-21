const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Reports REST Routes (/api/reports)
 * All endpoints require an authenticated user session.
 */

router.use(authMiddleware);

// GET /api/reports/dashboard — Main dashboard KPI aggregator (T039)
router.get('/dashboard', reportsController.getDashboardSummary);

// GET /api/reports/summary — General summary with optional date range & filters (T051)
router.get('/summary', reportsController.getSummary);

// GET /api/reports/export — Stream CSV or PDF report (T051)
router.get('/export', reportsController.exportReport);

module.exports = router;
