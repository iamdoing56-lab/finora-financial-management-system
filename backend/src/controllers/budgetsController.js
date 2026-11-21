const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Calculates budget status and tier:
 *  - NORMAL:   < 70%  (Green)
 *  - WARNING:  70% - 100% (Yellow / Amber)
 *  - EXCEEDED: > 100% (Red)
 */
function calculateTier(spent, limit) {
  const numericLimit = parseFloat(limit) || 0;
  const numericSpent = parseFloat(spent) || 0;

  if (numericLimit <= 0) {
    return {
      percentage: 0,
      status: 'NORMAL',
      remaining: 0,
      overage: numericSpent,
    };
  }

  const percentage = parseFloat(((numericSpent / numericLimit) * 100).toFixed(1));
  let status = 'NORMAL';
  if (percentage > 100) {
    status = 'EXCEEDED';
  } else if (percentage >= 70) {
    status = 'WARNING';
  }

  const remaining = Math.max(0, parseFloat((numericLimit - numericSpent).toFixed(2)));
  const overage = Math.max(0, parseFloat((numericSpent - numericLimit).toFixed(2)));

  return { percentage, status, remaining, overage };
}

/**
 * T048: Check for budget overage / threshold crossing and create notifications.
 * Called when a budget is created/updated or when an expense transaction is logged.
 */
async function checkBudgetOverage(userId, categoryId, dateOrMonth, optionalYear) {
  try {
    let month, year;
    if (dateOrMonth instanceof Date || typeof dateOrMonth === 'string' && isNaN(dateOrMonth)) {
      const d = new Date(dateOrMonth);
      month = d.getMonth() + 1;
      year = d.getFullYear();
    } else {
      month = parseInt(dateOrMonth, 10);
      year = parseInt(optionalYear, 10) || new Date().getFullYear();
    }

    if (!userId || !categoryId || !month || !year) return null;

    const budget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month,
          year,
        },
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    if (!budget) return null;

    const { start, end } = getMonthRange(year, month);
    const spentAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    const spent = parseFloat(spentAgg._sum.amount || 0);
    const limit = parseFloat(budget.monthlyLimit);
    const { percentage, status } = calculateTier(spent, limit);

    if (status === 'EXCEEDED') {
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId,
          alertType: 'BUDGET_ALERT',
          title: 'Budget Exceeded Alert',
          message: { contains: budget.category.name },
          createdAt: { gte: start, lte: end },
        },
      });

      if (!existingNotif) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Budget Exceeded Alert',
            message: `You have exceeded your monthly budget for ${budget.category.name} by ₹${(spent - limit).toFixed(2)} (${percentage}% used).`,
            alertType: 'BUDGET_ALERT',
          },
        });
      }
    } else if (status === 'WARNING') {
      const existingWarning = await prisma.notification.findFirst({
        where: {
          userId,
          alertType: 'BUDGET_ALERT',
          title: 'Budget Warning Alert',
          message: { contains: budget.category.name },
          createdAt: { gte: start, lte: end },
        },
      });

      if (!existingWarning) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Budget Warning Alert',
            message: `You have reached ${percentage}% of your monthly budget for ${budget.category.name}.`,
            alertType: 'BUDGET_ALERT',
          },
        });
      }
    }

    return { spent, limit, percentage, status };
  } catch (err) {
    console.error('Error checking budget overage:', err.message);
    return null;
  }
}

// ─── Controller Methods ──────────────────────────────────────────────────────

/**
 * GET /api/budgets
 * Query: month (1-12), year (e.g. 2026)
 */
async function getBudgets(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const { start, end } = getMonthRange(year, month);

    // 1. Fetch user's budgets for this month/year
    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Calculate spent per budget category from actual transactions
    let totalMonthlyLimit = 0;
    let totalSpent = 0;
    let normalCount = 0;
    let warningCount = 0;
    let exceededCount = 0;

    const enrichedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const [spentAgg, countAgg] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId,
              categoryId: b.categoryId,
              type: 'EXPENSE',
              date: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: {
              userId,
              categoryId: b.categoryId,
              type: 'EXPENSE',
              date: { gte: start, lte: end },
            },
          }),
        ]);

        const spent = parseFloat(spentAgg._sum.amount || 0);
        const limit = parseFloat(b.monthlyLimit);
        const { percentage, status, remaining, overage } = calculateTier(spent, limit);

        totalMonthlyLimit += limit;
        totalSpent += spent;

        if (status === 'NORMAL') normalCount++;
        else if (status === 'WARNING') warningCount++;
        else if (status === 'EXCEEDED') exceededCount++;

        return {
          id: b.id,
          categoryId: b.categoryId,
          category: b.category,
          monthlyLimit: limit,
          spent,
          percentage,
          status,
          remaining,
          overage,
          transactionCount: countAgg,
          month: b.month,
          year: b.year,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      })
    );

    // 3. Overall monthly summary calculations
    const totalRemaining = Math.max(0, parseFloat((totalMonthlyLimit - totalSpent).toFixed(2)));
    const totalOverage = Math.max(0, parseFloat((totalSpent - totalMonthlyLimit).toFixed(2)));
    const burnRate = totalMonthlyLimit > 0
      ? parseFloat(((totalSpent / totalMonthlyLimit) * 100).toFixed(1))
      : 0;

    // Days remaining in the selected month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const currentDay = isCurrentMonth ? now.getDate() : 1;
    const daysLeft = isCurrentMonth ? Math.max(1, lastDayOfMonth - currentDay) : lastDayOfMonth;
    const dailySafeSpend = daysLeft > 0 ? parseFloat((totalRemaining / daysLeft).toFixed(2)) : 0;

    const healthScore = enrichedBudgets.length > 0
      ? Math.max(0, Math.round(100 - (exceededCount * 30 + warningCount * 15)))
      : 100;

    res.json({
      success: true,
      budgets: enrichedBudgets,
      summary: {
        totalMonthlyLimit: parseFloat(totalMonthlyLimit.toFixed(2)),
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalRemaining,
        totalOverage,
        burnRate,
        healthScore,
        counts: {
          total: enrichedBudgets.length,
          normal: normalCount,
          warning: warningCount,
          exceeded: exceededCount,
        },
        daysLeft,
        dailySafeSpend,
        month,
        year,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/budgets/:id
 */
async function getBudgetById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const { start, end } = getMonthRange(budget.year, budget.month);
    const spentAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    const spent = parseFloat(spentAgg._sum.amount || 0);
    const limit = parseFloat(budget.monthlyLimit);
    const tier = calculateTier(spent, limit);

    res.json({
      success: true,
      budget: {
        ...budget,
        monthlyLimit: limit,
        spent,
        ...tier,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/budgets
 * Body: { categoryId, monthlyLimit, month, year }
 */
async function createBudget(req, res, next) {
  try {
    const userId = req.user.id;
    const { categoryId, monthlyLimit, month, year } = req.body;

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const numericLimit = parseFloat(monthlyLimit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monthly limit must be a positive number greater than 0',
      });
    }

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({ success: false, message: 'Month must be between 1 and 12' });
    }

    // Verify category exists and is accessible by user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { userId: null }, { isDefault: true }],
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Upsert budget (update limit if already exists for this category/month/year)
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month: targetMonth,
          year: targetYear,
        },
      },
      update: {
        monthlyLimit: new Prisma.Decimal(numericLimit.toFixed(2)),
      },
      create: {
        userId,
        categoryId,
        monthlyLimit: new Prisma.Decimal(numericLimit.toFixed(2)),
        month: targetMonth,
        year: targetYear,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    // Check for overage & create alerts if needed (T048)
    const overageResult = await checkBudgetOverage(userId, categoryId, targetMonth, targetYear);

    const spent = overageResult ? overageResult.spent : 0;
    const tier = calculateTier(spent, numericLimit);

    res.status(201).json({
      success: true,
      budget: {
        id: budget.id,
        categoryId: budget.categoryId,
        category: budget.category,
        monthlyLimit: numericLimit,
        spent,
        ...tier,
        month: budget.month,
        year: budget.year,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/budgets/:id
 * Body: { monthlyLimit, month, year }
 */
async function updateBudget(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { monthlyLimit, month, year } = req.body;

    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    if (!existingBudget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const updateData = {};
    if (monthlyLimit !== undefined) {
      const numericLimit = parseFloat(monthlyLimit);
      if (isNaN(numericLimit) || numericLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monthly limit must be a positive number greater than 0',
        });
      }
      updateData.monthlyLimit = new Prisma.Decimal(numericLimit.toFixed(2));
    }

    if (month !== undefined) {
      const targetMonth = parseInt(month, 10);
      if (targetMonth < 1 || targetMonth > 12) {
        return res.status(400).json({ success: false, message: 'Month must be between 1 and 12' });
      }
      updateData.month = targetMonth;
    }

    if (year !== undefined) {
      updateData.year = parseInt(year, 10);
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    const targetMonth = updated.month;
    const targetYear = updated.year;
    const overageResult = await checkBudgetOverage(userId, updated.categoryId, targetMonth, targetYear);

    const spent = overageResult ? overageResult.spent : 0;
    const tier = calculateTier(spent, parseFloat(updated.monthlyLimit));

    res.json({
      success: true,
      budget: {
        id: updated.id,
        categoryId: updated.categoryId,
        category: updated.category,
        monthlyLimit: parseFloat(updated.monthlyLimit),
        spent,
        ...tier,
        month: updated.month,
        year: updated.year,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/budgets/:id
 */
async function deleteBudget(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existingBudget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  checkBudgetOverage,
  calculateTier,
};
