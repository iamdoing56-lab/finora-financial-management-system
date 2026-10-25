const prisma = require('../prisma/client');
const { Prisma } = require('@prisma/client');

/**
 * Accounts Controller
 * Implements account creation, balance calculation, ledger updates, and soft-delete archiving.
 */

/**
 * GET /api/accounts
 * Fetch all accounts for the authenticated user with real-time computed balances.
 */
async function getAccounts(req, res, next) {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    const where = {
      userId,
    };

    // By default return ACTIVE accounts unless requested otherwise
    if (status && status !== 'ALL') {
      where.status = status;
    } else if (!status) {
      where.status = 'ACTIVE';
    }

    if (type && type !== 'ALL') {
      where.type = type.toUpperCase();
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 1,
          include: {
            category: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format account data with float-converted balance and latest activity
    const formattedAccounts = accounts.map((acc) => {
      const balanceNum = parseFloat(acc.balance.toString());
      const lastTx = acc.transactions[0] || null;

      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: balanceNum,
        currency: acc.currency,
        status: acc.status,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
        transactionCount: acc._count.transactions,
        lastTransaction: lastTx
          ? {
              id: lastTx.id,
              amount: parseFloat(lastTx.amount.toString()),
              type: lastTx.type,
              date: lastTx.date,
              notes: lastTx.notes,
              categoryName: lastTx.category?.name || 'Uncategorized',
            }
          : null,
      };
    });

    // Summary calculation for KPI cards
    let totalBalance = 0;
    let bankSavingsBalance = 0;
    let availableCredit = 0;
    let cashWallets = 0;

    formattedAccounts.forEach((acc) => {
      if (acc.status === 'ACTIVE') {
        totalBalance += acc.balance;
        if (acc.type === 'BANK' || acc.type === 'SAVINGS') {
          bankSavingsBalance += acc.balance;
        } else if (acc.type === 'CREDIT_CARD') {
          // Available credit / credit balance
          availableCredit += acc.balance;
        } else if (acc.type === 'CASH' || acc.type === 'OTHER') {
          cashWallets += acc.balance;
        }
      }
    });

    return res.status(200).json({
      success: true,
      accounts: formattedAccounts,
      summary: {
        totalBalance,
        bankSavingsBalance,
        availableCredit,
        cashWallets,
        activeAccountsCount: formattedAccounts.filter((a) => a.status === 'ACTIVE').length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/accounts/:id
 * Fetch single account details with recent transactions and ledger statistics.
 */
async function getAccountById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 20,
          include: {
            category: { select: { id: true, name: true, color: true, type: true } },
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Compute monthly inflows and outflows for this account
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        accountId: id,
        userId,
        date: { gte: startOfMonth },
      },
    });

    let currentMonthInflow = 0;
    let currentMonthOutflow = 0;

    monthlyTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount.toString());
      if (tx.type === 'INCOME') {
        currentMonthInflow += amt;
      } else {
        currentMonthOutflow += amt;
      }
    });

    const balanceNum = parseFloat(account.balance.toString());

    return res.status(200).json({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: balanceNum,
        currency: account.currency,
        status: account.status,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        transactionCount: account._count.transactions,
        currentMonthInflow,
        currentMonthOutflow,
        recentTransactions: account.transactions.map((tx) => ({
          id: tx.id,
          amount: parseFloat(tx.amount.toString()),
          type: tx.type,
          date: tx.date,
          notes: tx.notes,
          category: tx.category,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/accounts
 * Create a new account. If initialBalance > 0, automatically log opening balance transaction.
 */
async function createAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, type, initialBalance, currency } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Account name and type are required',
      });
    }

    const validTypes = ['CASH', 'BANK', 'CREDIT_CARD', 'SAVINGS', 'OTHER'];
    const normalizedType = type.toUpperCase();
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account type. Allowed: ${validTypes.join(', ')}`,
      });
    }

    const initialAmount = initialBalance ? Math.max(0, parseFloat(initialBalance)) : 0;
    const userCurrency = currency || req.user.currency || '₹';

    // Execute in a transaction to ensure atomic opening balance creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the account
      const newAccount = await tx.account.create({
        data: {
          userId,
          name: name.trim(),
          type: normalizedType,
          balance: new Prisma.Decimal(initialAmount),
          currency: userCurrency,
          status: 'ACTIVE',
        },
      });

      // 2. If initial balance > 0, log opening balance transaction
      if (initialAmount > 0) {
        // Find or create default "Other" or "Opening Balance" income category
        let otherCategory = await tx.category.findFirst({
          where: {
            OR: [
              { name: 'Other', type: 'INCOME' },
              { name: 'Salary', type: 'INCOME' },
              { isDefault: true, type: 'INCOME' },
            ],
          },
        });

        // Fallback: create category if not found
        if (!otherCategory) {
          otherCategory = await tx.category.create({
            data: {
              name: 'Other',
              type: 'INCOME',
              color: '#3361ff',
              isDefault: true,
            },
          });
        }

        await tx.transaction.create({
          data: {
            userId,
            accountId: newAccount.id,
            categoryId: otherCategory.id,
            amount: new Prisma.Decimal(initialAmount),
            type: 'INCOME',
            notes: 'Opening Balance',
            date: new Date(),
          },
        });
      }

      return newAccount;
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      account: {
        id: result.id,
        name: result.name,
        type: result.type,
        balance: parseFloat(result.balance.toString()),
        currency: result.currency,
        status: result.status,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/accounts/:id
 * Update account name, type, or currency.
 */
async function updateAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, type, currency } = req.body;

    const existingAccount = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (type) {
      const validTypes = ['CASH', 'BANK', 'CREDIT_CARD', 'SAVINGS', 'OTHER'];
      const normalizedType = type.toUpperCase();
      if (!validTypes.includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid account type. Allowed: ${validTypes.join(', ')}`,
        });
      }
      updateData.type = normalizedType;
    }
    if (currency) updateData.currency = currency.trim();

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        type: updatedAccount.type,
        balance: parseFloat(updatedAccount.balance.toString()),
        currency: updatedAccount.currency,
        status: updatedAccount.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/accounts/:id
 * Soft-delete (archive) the account to preserve historical transactions and ledger integrity.
 */
async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existingAccount = await prisma.account.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Soft-delete archiving: keeps historical transactions intact for ledger history
    const archivedAccount = await prisma.account.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return res.status(200).json({
      success: true,
      message: 'Account archived successfully. Historical records preserved.',
      account: {
        id: archivedAccount.id,
        name: archivedAccount.name,
        status: archivedAccount.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
};
