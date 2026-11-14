const prisma = require('../prisma/client');
const { Prisma } = require('@prisma/client');

/**
 * Transactions Controller
 * Implements transaction logging, multi-faceted filtering, searching,
 * pagination, and atomic balance updates with ledger consistency.
 */

/**
 * GET /api/transactions
 * Retrieve transactions with search, date range, category, account, and type filters.
 */
async function getTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      startDate,
      endDate,
      categoryId,
      accountId,
      type,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma where filter
    const where = {
      userId,
    };

    if (type && ['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (accountId && accountId !== 'all') {
      where.accountId = accountId;
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // Include full day of endDate
        const end = new Date(endDate);
        if (!endDate.includes('T')) {
          end.setHours(23, 59, 59, 999);
        }
        where.date.lte = end;
      }
    }

    // Keyword search in notes or category name
    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { notes: { contains: query, mode: 'insensitive' } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
        { account: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Determine sorting
    let orderBy = {};
    if (sortBy === 'amount') {
      orderBy = { amount: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' };
    } else {
      orderBy = { date: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' };
    }

    // Query paginated transactions and total count in parallel
    const [transactions, totalCount, aggregateStats] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
              isDefault: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
      // Calculate overall stats for filtered criteria
      prisma.transaction.findMany({
        where,
        select: {
          amount: true,
          type: true,
        },
      }),
    ]);

    // Calculate summary numbers
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalVolume = 0;

    aggregateStats.forEach((t) => {
      const amt = parseFloat(t.amount.toString());
      totalVolume += amt;
      if (t.type === 'INCOME') {
        totalInflow += amt;
      } else if (t.type === 'EXPENSE') {
        totalOutflow += amt;
      }
    });

    const avgTicketSize = aggregateStats.length > 0
      ? totalVolume / aggregateStats.length
      : 0;

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      amount: parseFloat(t.amount.toString()),
      type: t.type,
      date: t.date,
      notes: t.notes,
      isRecurring: t.isRecurring,
      createdAt: t.createdAt,
      account: t.account
        ? {
            id: t.account.id,
            name: t.account.name,
            type: t.account.type,
            currency: t.account.currency,
          }
        : null,
      category: t.category
        ? {
            id: t.category.id,
            name: t.category.name,
            color: t.category.color,
            type: t.category.type,
            isDefault: t.category.isDefault,
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
      summary: {
        totalVolume,
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow,
        totalCount,
        avgTicketSize,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/transactions/:id
 * Retrieve a single transaction by ID.
 */
async function getTransactionById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        account: {
          select: { id: true, name: true, type: true, currency: true },
        },
        category: {
          select: { id: true, name: true, color: true, type: true, isDefault: true },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: parseFloat(transaction.amount.toString()),
        type: transaction.type,
        date: transaction.date,
        notes: transaction.notes,
        isRecurring: transaction.isRecurring,
        createdAt: transaction.createdAt,
        account: transaction.account,
        category: transaction.category,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/transactions
 * Create a new transaction and update the associated account balance atomically.
 */
async function createTransaction(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      accountId,
      categoryId,
      amount,
      type,
      date,
      notes,
      isRecurring = false,
    } = req.body;

    // Validation
    if (!accountId || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Account and Category are required',
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than 0',
      });
    }

    if (!type || !['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be INCOME or EXPENSE',
      });
    }

    const normalizedType = type.toUpperCase();
    const transactionDate = date ? new Date(date) : new Date();

    // Verify account exists, belongs to user, and is active
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId, status: 'ACTIVE' },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Active account not found or access denied',
      });
    }

    // Verify category exists
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { isDefault: true }, { userId: null }],
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Execute atomic balance update and transaction insert
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create transaction record
      const createdTx = await tx.transaction.create({
        data: {
          userId,
          accountId,
          categoryId,
          amount: new Prisma.Decimal(numericAmount.toFixed(2)),
          type: normalizedType,
          date: transactionDate,
          notes: notes ? notes.trim() : null,
          isRecurring: Boolean(isRecurring),
        },
        include: {
          account: {
            select: { id: true, name: true, type: true, currency: true },
          },
          category: {
            select: { id: true, name: true, color: true, type: true },
          },
        },
      });

      // 2. Adjust account balance atomically
      const balanceDelta = normalizedType === 'INCOME' ? numericAmount : -numericAmount;
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: new Prisma.Decimal(balanceDelta.toFixed(2)),
          },
        },
      });

      return {
        transaction: createdTx,
        newBalance: parseFloat(updatedAccount.balance.toString()),
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      transaction: {
        id: result.transaction.id,
        amount: parseFloat(result.transaction.amount.toString()),
        type: result.transaction.type,
        date: result.transaction.date,
        notes: result.transaction.notes,
        isRecurring: result.transaction.isRecurring,
        createdAt: result.transaction.createdAt,
        account: result.transaction.account,
        category: result.transaction.category,
      },
      updatedAccountBalance: result.newBalance,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/transactions/:id
 * Update an existing transaction and adjust impacted account balances atomically.
 */
async function updateTransaction(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      accountId,
      categoryId,
      amount,
      type,
      date,
      notes,
      isRecurring,
    } = req.body;

    const existingTx = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTx) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const oldAmount = parseFloat(existingTx.amount.toString());
    const oldType = existingTx.type;
    const oldAccountId = existingTx.accountId;

    const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than 0',
      });
    }

    const newType = type ? type.toUpperCase() : oldType;
    if (!['INCOME', 'EXPENSE'].includes(newType)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be INCOME or EXPENSE',
      });
    }

    const newAccountId = accountId || oldAccountId;
    const newCategoryId = categoryId || existingTx.categoryId;

    // Verify account and category exist
    const [targetAccount, targetCategory] = await Promise.all([
      prisma.account.findFirst({ where: { id: newAccountId, userId } }),
      prisma.category.findFirst({
        where: {
          id: newCategoryId,
          OR: [{ userId }, { isDefault: true }, { userId: null }],
        },
      }),
    ]);

    if (!targetAccount) {
      return res.status(404).json({
        success: false,
        message: 'Target account not found',
      });
    }

    if (!targetCategory) {
      return res.status(404).json({
        success: false,
        message: 'Target category not found',
      });
    }

    // Atomic ledger rebalancing
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // 1. Revert old transaction impact on old account
      const revertOldDelta = oldType === 'INCOME' ? -oldAmount : oldAmount;
      await tx.account.update({
        where: { id: oldAccountId },
        data: {
          balance: {
            increment: new Prisma.Decimal(revertOldDelta.toFixed(2)),
          },
        },
      });

      // 2. Apply new transaction impact on new account
      const applyNewDelta = newType === 'INCOME' ? newAmount : -newAmount;
      await tx.account.update({
        where: { id: newAccountId },
        data: {
          balance: {
            increment: new Prisma.Decimal(applyNewDelta.toFixed(2)),
          },
        },
      });

      // 3. Update transaction row
      const updateData = {
        accountId: newAccountId,
        categoryId: newCategoryId,
        amount: new Prisma.Decimal(newAmount.toFixed(2)),
        type: newType,
      };

      if (date) {
        updateData.date = new Date(date);
      }
      if (notes !== undefined) {
        updateData.notes = notes ? notes.trim() : null;
      }
      if (isRecurring !== undefined) {
        updateData.isRecurring = Boolean(isRecurring);
      }

      return tx.transaction.update({
        where: { id },
        data: updateData,
        include: {
          account: {
            select: { id: true, name: true, type: true, currency: true },
          },
          category: {
            select: { id: true, name: true, color: true, type: true },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: {
        id: updatedTransaction.id,
        amount: parseFloat(updatedTransaction.amount.toString()),
        type: updatedTransaction.type,
        date: updatedTransaction.date,
        notes: updatedTransaction.notes,
        isRecurring: updatedTransaction.isRecurring,
        createdAt: updatedTransaction.createdAt,
        account: updatedTransaction.account,
        category: updatedTransaction.category,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/transactions/:id
 * Delete a transaction and reverse its balance impact on the account.
 */
async function deleteTransaction(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existingTx = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTx) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const txAmount = parseFloat(existingTx.amount.toString());
    const txType = existingTx.type;
    const accountId = existingTx.accountId;

    // Atomically revert balance impact and delete transaction
    await prisma.$transaction(async (tx) => {
      // Revert: If INCOME, decrement balance; if EXPENSE, increment balance
      const revertDelta = txType === 'INCOME' ? -txAmount : txAmount;
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: new Prisma.Decimal(revertDelta.toFixed(2)),
          },
        },
      });

      await tx.transaction.delete({
        where: { id },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted and account balance updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
