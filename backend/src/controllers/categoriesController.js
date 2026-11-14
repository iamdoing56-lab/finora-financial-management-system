const prisma = require('../prisma/client');

/**
 * Categories Controller
 * Supports system default and user custom categories,
 * category creation, updating, deletion with fallback reassignment to 'Other',
 * and monthly transaction flow aggregations.
 */

/**
 * GET /api/categories
 * Returns categories available to the user (system defaults + user custom),
 * optionally enriched with monthly flow totals and KPI summary metrics.
 */
async function getCategories(req, res, next) {
  try {
    const userId = req.user.id;
    const { type, origin } = req.query;

    const where = {
      OR: [
        { userId },
        { isDefault: true },
        { userId: null },
      ],
    };

    if (type && ['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (origin === 'system') {
      where.OR = [{ isDefault: true }, { userId: null }];
    } else if (origin === 'custom') {
      where.OR = undefined;
      where.userId = userId;
      where.isDefault = false;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    // Compute monthly flow totals for the current month per category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        amount: true,
        type: true,
        categoryId: true,
      },
    });

    // Map stats by categoryId
    const categoryStats = {};
    let totalMonthlyInflow = 0;
    let totalMonthlyOutflow = 0;

    monthlyTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount.toString());
      if (!categoryStats[tx.categoryId]) {
        categoryStats[tx.categoryId] = {
          totalAmount: 0,
          transactionCount: 0,
        };
      }
      categoryStats[tx.categoryId].totalAmount += amt;
      categoryStats[tx.categoryId].transactionCount += 1;

      if (tx.type === 'INCOME') {
        totalMonthlyInflow += amt;
      } else if (tx.type === 'EXPENSE') {
        totalMonthlyOutflow += amt;
      }
    });

    // Format category objects with monthly stats
    let largestBurnCategory = null;
    let maxExpenseAmount = 0;

    const formattedCategories = categories.map((cat) => {
      const stats = categoryStats[cat.id] || { totalAmount: 0, transactionCount: 0 };
      const isSystem = cat.isDefault || cat.userId === null;

      if (cat.type === 'EXPENSE' && stats.totalAmount > maxExpenseAmount) {
        maxExpenseAmount = stats.totalAmount;
        largestBurnCategory = {
          id: cat.id,
          name: cat.name,
          amount: stats.totalAmount,
          color: cat.color,
          sharePercentage: totalMonthlyOutflow > 0
            ? Math.round((stats.totalAmount / totalMonthlyOutflow) * 100)
            : 0,
        };
      }

      return {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        isDefault: isSystem,
        origin: isSystem ? 'system' : 'custom',
        isOwner: cat.userId === userId,
        monthlyAmount: stats.totalAmount,
        transactionCount: stats.transactionCount,
        createdAt: cat.createdAt,
      };
    });

    const expenseCount = formattedCategories.filter((c) => c.type === 'EXPENSE').length;
    const incomeCount = formattedCategories.filter((c) => c.type === 'INCOME').length;
    const customCount = formattedCategories.filter((c) => c.origin === 'custom').length;

    const summary = {
      totalCategories: formattedCategories.length,
      expenseCount,
      incomeCount,
      customCount,
      monthlyInflowTracked: totalMonthlyInflow,
      monthlyOutflowTracked: totalMonthlyOutflow,
      netSavings: totalMonthlyInflow - totalMonthlyOutflow,
      burnRatePercentage: totalMonthlyInflow > 0
        ? Math.min(100, Math.round((totalMonthlyOutflow / totalMonthlyInflow) * 100))
        : 0,
      largestBurnCategory,
    };

    return res.status(200).json({
      success: true,
      categories: formattedCategories,
      summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/categories
 * Create a new custom category for the authenticated user.
 */
async function createCategory(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, type, color, monthlyLimit } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    if (!type || !['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid classification type (INCOME or EXPENSE) is required',
      });
    }

    const trimmedName = name.trim();
    const normalizedType = type.toUpperCase();

    // Check for duplicate category name for this user or system default
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        type: normalizedType,
        OR: [
          { userId },
          { isDefault: true },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A category named "${trimmedName}" already exists for ${normalizedType.toLowerCase()}s`,
      });
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name: trimmedName,
        type: normalizedType,
        color: color || (normalizedType === 'INCOME' ? '#10B981' : '#3361FF'),
        isDefault: false,
      },
    });

    // If an optional monthly budget limit is provided for EXPENSE, create a budget record
    if (normalizedType === 'EXPENSE' && monthlyLimit && parseFloat(monthlyLimit) > 0) {
      const now = new Date();
      await prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId: category.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {
          monthlyLimit: parseFloat(monthlyLimit),
        },
        create: {
          userId,
          categoryId: category.id,
          monthlyLimit: parseFloat(monthlyLimit),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        isDefault: false,
        origin: 'custom',
        isOwner: true,
        monthlyAmount: 0,
        transactionCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/categories/:id
 * Update an existing custom category (name, color).
 * Prevents modifications to system default categories.
 */
async function updateCategory(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, color } = req.body;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Only owner can edit, system defaults cannot be edited by standard users
    if (category.userId !== userId || category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'System default categories cannot be modified',
      });
    }

    const updateData = {};
    if (name && name.trim()) {
      updateData.name = name.trim();
    }
    if (color) {
      updateData.color = color;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        color: updated.color,
        isDefault: false,
        origin: 'custom',
        isOwner: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/categories/:id
 * Implements T037: Category deletion fallback reassignment to 'Other'.
 * System defaults cannot be deleted.
 * Reassigns all linked transactions to the default 'Other' category before deletion.
 */
async function deleteCategory(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Guard: System default categories cannot be deleted
    if (category.userId !== userId || category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'System default categories cannot be deleted',
      });
    }

    // Execute atomic deletion with transaction reassignment to 'Other'
    const result = await prisma.$transaction(async (tx) => {
      // 1. Locate the default "Other" fallback category of the same type
      let fallbackCategory = await tx.category.findFirst({
        where: {
          name: 'Other',
          type: category.type,
          isDefault: true,
        },
      });

      // If no system default 'Other' exists, look for any default category or create 'Other'
      if (!fallbackCategory) {
        fallbackCategory = await tx.category.findFirst({
          where: {
            name: 'Other',
            type: category.type,
          },
        });
      }

      if (!fallbackCategory) {
        fallbackCategory = await tx.category.create({
          data: {
            name: 'Other',
            type: category.type,
            color: '#6B7280',
            isDefault: true,
          },
        });
      }

      // 2. Reassign all transactions referencing this category to the fallback 'Other' category
      const reassignedCount = await tx.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: fallbackCategory.id },
      });

      // 3. Remove any budget limits linked specifically to this category
      await tx.budget.deleteMany({
        where: { categoryId: id },
      });

      // 4. Delete the custom category
      await tx.category.delete({
        where: { id },
      });

      return {
        reassignedTransactions: reassignedCount.count,
        fallbackCategoryName: fallbackCategory.name,
        fallbackCategoryId: fallbackCategory.id,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Category deleted successfully. ${result.reassignedTransactions} linked transaction(s) were reassigned to "${result.fallbackCategoryName}".`,
      details: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
