const express = require('express');
const router = express.Router();
const budgetsController = require('../controllers/budgetsController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Budgets REST Routes (/api/budgets)
 * All budget routes require an authenticated user session.
 */

router.use(authMiddleware);

// GET /api/budgets — List all budgets with calculated monthly spent and tiers
router.get('/', budgetsController.getBudgets);

// GET /api/budgets/:id — Single budget detail
router.get('/:id', budgetsController.getBudgetById);

// POST /api/budgets — Create or upsert a monthly budget
router.post('/', budgetsController.createBudget);

// PUT /api/budgets/:id — Update a monthly budget limit
router.put('/:id', budgetsController.updateBudget);

// DELETE /api/budgets/:id — Delete a budget
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router;
