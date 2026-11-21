const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const { streamCsvReport } = require('../utils/csvGenerator');
const { streamPdfReport } = require('../utils/pdfGenerator');

// ─── Helper ────────────────────────────────────────────────────────────────

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

// ─── GET /api/reports/dashboard ────────────────────────────────────────────
/**
 * Aggregates all dashboard KPIs, 6-month trend, category spending breakdown,
 * recent transactions, and budget alerts for the authenticated user.
 */
async function getDashboardSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-based

    // ── 1. Total Balance ──────────────────────────────────────────────────
    const accounts = await prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { id: true, name: true, type: true, balance: true },
    });

    const totalBalance = accounts.reduce(
      (sum, a) => sum + parseFloat(a.balance),
      0
    );

    // ── 2. Monthly Income & Expenses (current month) ───────────────────────
    const { start: monthStart, end: monthEnd } = getMonthRange(currentYear, currentMonth);

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'INCOME',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const monthlyIncome = parseFloat(incomeAgg._sum.amount || 0);
    const monthlyExpenses = parseFloat(expenseAgg._sum.amount || 0);
    const netSavings = monthlyIncome - monthlyExpenses;

    // ── 3. 6-Month Trend ───────────────────────────────────────────────────
    const sixMonthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const { start, end } = getMonthRange(yr, mo);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      sixMonthTrend.push({
        year: yr,
        month: mo,
        monthLabel: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        income: parseFloat(inc._sum.amount || 0),
        expense: parseFloat(exp._sum.amount || 0),
      });
    }

    // ── 4. Category Spending Breakdown (current month, EXPENSE only) ────────
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const totalExpenseAmount = monthlyExpenses || 1;
    let categoryBreakdown = [];

    if (expensesByCategory.length > 0) {
      const categoryIds = expensesByCategory
        .filter((e) => e.categoryId)
        .map((e) => e.categoryId);

      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, color: true },
      });

      const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

      categoryBreakdown = expensesByCategory.map((e) => {
        const cat = catMap[e.categoryId];
        const amount = parseFloat(e._sum.amount || 0);
        return {
          categoryId: e.categoryId,
          name: cat ? cat.name : 'Uncategorized',
          color: cat ? cat.color : '#747687',
          amount,
          percentage: totalExpenseAmount > 0
            ? parseFloat(((amount / totalExpenseAmount) * 100).toFixed(1))
            : 0,
        };
      });
    }

    // ── 5. Recent Transactions (last 8) ─────────────────────────────────────
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 8,
      include: {
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true, type: true } },
      },
    });

    // ── 6. Budget Alerts (budgets at ≥70% of monthly limit) ─────────────────
    const budgets = await prisma.budget.findMany({
      where: { userId, year: currentYear, month: currentMonth },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    const budgetAlerts = [];
    for (const budget of budgets) {
      const spentAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });
      const spent = parseFloat(spentAgg._sum.amount || 0);
      const limit = parseFloat(budget.monthlyLimit || 0);
      if (limit <= 0) continue;
      const percentage = parseFloat(((spent / limit) * 100).toFixed(1));
      if (percentage >= 70) {
        budgetAlerts.push({
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.category?.name || 'Unknown',
          categoryColor: budget.category?.color || '#747687',
          spent,
          limit,
          percentage,
          status: percentage >= 100 ? 'EXCEEDED' : percentage >= 90 ? 'NEAR_LIMIT' : 'WARNING',
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        netSavings,
        accountCount: accounts.length,
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: parseFloat(a.balance),
        })),
        sixMonthTrend,
        categoryBreakdown,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          notes: t.notes,
          date: t.date,
          category: t.category,
          account: t.account,
        })),
        budgetAlerts,
        generatedAt: now.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/reports/summary ───────────────────────────────────────────────
/**
 * T051: Financial Summary & Trend Analytics
 * Supports filtering by startDate, endDate, accountId, categoryId.
 */
async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const { startDate, endDate, accountId, categoryId } = req.query;

    const now = new Date();
    // Default to last 6 months if not specified
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const whereClause = {
      userId,
      date: { gte: start, lte: end },
    };

    if (accountId) whereClause.accountId = accountId;
    if (categoryId) whereClause.categoryId = categoryId;

    // 1. Inflow and Outflow Aggregates
    const [incomeAgg, expenseAgg, totalCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...whereClause, type: 'INCOME' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        where: { ...whereClause, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    const totalIncome = parseFloat(incomeAgg._sum.amount || 0);
    const totalExpenses = parseFloat(expenseAgg._sum.amount || 0);
    const netSavings = parseFloat((totalIncome - totalExpenses).toFixed(2));
    const savingsRate = totalIncome > 0
      ? parseFloat(((netSavings / totalIncome) * 100).toFixed(1))
      : 0;

    // Days in range for avg daily burn
    const diffTime = Math.abs(end - start);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const avgDailyBurn = parseFloat((totalExpenses / diffDays).toFixed(2));

    // 2. Category Spending Breakdown (Expenses)
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...whereClause, type: 'EXPENSE' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    let categoryBreakdown = [];
    let topCategory = null;

    if (expensesByCategory.length > 0) {
      const catIds = expensesByCategory.filter((e) => e.categoryId).map((e) => e.categoryId);
      const categories = await prisma.category.findMany({
        where: { id: { in: catIds } },
        select: { id: true, name: true, color: true, type: true },
      });
      const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

      categoryBreakdown = expensesByCategory.map((e) => {
        const cat = catMap[e.categoryId];
        const amt = parseFloat(e._sum.amount || 0);
        return {
          category: cat ? cat.name : 'Uncategorized',
          name: cat ? cat.name : 'Uncategorized',
          amount: amt,
          percentage: totalExpenses > 0 ? parseFloat(((amt / totalExpenses) * 100).toFixed(1)) : 0,
          color: cat ? cat.color : '#747687',
          type: 'EXPENSE',
        };
      });

      if (categoryBreakdown.length > 0) {
        topCategory = categoryBreakdown[0];
      }
    }

    // 3. Monthly Trends (Bi-monthly or Month-by-month trajectory)
    const monthlyTrends = [];
    const trendStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const trendEnd = new Date(end.getFullYear(), end.getMonth(), 1);

    const cursor = new Date(trendStart);
    while (cursor <= trendEnd) {
      const yr = cursor.getFullYear();
      const mo = cursor.getMonth() + 1;
      const { start: mStart, end: mEnd } = getMonthRange(yr, mo);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            date: { gte: mStart, lte: mEnd },
            ...(accountId && { accountId }),
            ...(categoryId && { categoryId }),
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: mStart, lte: mEnd },
            ...(accountId && { accountId }),
            ...(categoryId && { categoryId }),
          },
          _sum: { amount: true },
        }),
      ]);

      const incAmt = parseFloat(inc._sum.amount || 0);
      const expAmt = parseFloat(exp._sum.amount || 0);

      monthlyTrends.push({
        year: yr,
        month: mo,
        monthLabel: cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        monthName: cursor.toLocaleDateString('en-IN', { month: 'short' }),
        income: incAmt,
        expenses: expAmt,
        savings: parseFloat((incAmt - expAmt).toFixed(2)),
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    // 4. Itemized Transactions matching filter (for report tables)
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true, currency: true } },
      },
    });

    res.json({
      success: true,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      avgDailyBurn,
      topCategory,
      totalCount,
      categoryBreakdown,
      monthlyTrends,
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date,
        type: t.type,
        amount: parseFloat(t.amount),
        notes: t.notes,
        isRecurring: t.isRecurring,
        category: t.category,
        account: t.account,
      })),
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/reports/export ────────────────────────────────────────────────
/**
 * T051: Stream CSV or PDF Report
 * Query: format ('csv' | 'pdf'), startDate, endDate, accountId, categoryId
 */
async function exportReport(req, res, next) {
  try {
    const userId = req.user.id;
    const { format = 'csv', startDate, endDate, accountId, categoryId } = req.query;

    const now = new Date();
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const whereClause = {
      userId,
      date: { gte: start, lte: end },
    };
    if (accountId) whereClause.accountId = accountId;
    if (categoryId) whereClause.categoryId = categoryId;

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true, currency: true } },
      },
    });

    if (format.toLowerCase() === 'pdf') {
      // Aggregate summary metrics for PDF
      const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: { ...whereClause, type: 'INCOME' },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { ...whereClause, type: 'EXPENSE' },
          _sum: { amount: true },
        }),
      ]);

      const totalIncome = parseFloat(incomeAgg._sum.amount || 0);
      const totalExpenses = parseFloat(expenseAgg._sum.amount || 0);
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0
        ? parseFloat(((netSavings / totalIncome) * 100).toFixed(1))
        : 0;

      // Category breakdown for PDF
      const expensesByCategory = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { ...whereClause, type: 'EXPENSE' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      });

      let categoryBreakdown = [];
      if (expensesByCategory.length > 0) {
        const catIds = expensesByCategory.filter((e) => e.categoryId).map((e) => e.categoryId);
        const categories = await prisma.category.findMany({
          where: { id: { in: catIds } },
          select: { id: true, name: true, color: true },
        });
        const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

        categoryBreakdown = expensesByCategory.map((e) => {
          const cat = catMap[e.categoryId];
          const amt = parseFloat(e._sum.amount || 0);
          return {
            category: cat ? cat.name : 'Uncategorized',
            amount: amt,
            percentage: totalExpenses > 0 ? parseFloat(((amt / totalExpenses) * 100).toFixed(1)) : 0,
            type: 'EXPENSE',
          };
        });
      }

      return streamPdfReport(
        {
          summary: {
            totalIncome,
            totalExpenses,
            netSavings,
            savingsRate,
            categoryBreakdown,
          },
          transactions,
          user: req.user,
          dateRange: { startDate: start, endDate: end },
        },
        res
      );
    }

    // Default: CSV export
    return streamCsvReport(transactions, res, {
      user: req.user,
      dateRange: { startDate: start, endDate: end },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary,
  getSummary,
  exportReport,
};
