const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Categories REST Routes (/api/categories)
 * All category endpoints require authenticated user session.
 */

router.use(authMiddleware);

router.get('/', categoriesController.getCategories);
router.post('/', categoriesController.createCategory);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;
