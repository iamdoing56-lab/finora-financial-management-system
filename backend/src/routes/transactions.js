const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Transactions REST Routes (/api/transactions)
 * All transaction endpoints require authenticated user session.
 */

router.use(authMiddleware);

router.get('/', transactionsController.getTransactions);
router.get('/:id', transactionsController.getTransactionById);
router.post('/', transactionsController.createTransaction);
router.put('/:id', transactionsController.updateTransaction);
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router;
