const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Accounts REST Routes (/api/accounts)
 * All account endpoints require authenticated user session.
 */

router.use(authMiddleware);

router.get('/', accountsController.getAccounts);
router.get('/:id', accountsController.getAccountById);
router.post('/', accountsController.createAccount);
router.put('/:id', accountsController.updateAccount);
router.delete('/:id', accountsController.deleteAccount);

module.exports = router;
