import client from './client';

/**
 * Transactions API Service
 * Interacts with /api/transactions REST endpoints.
 */

export const transactionsApi = {
  /**
   * Fetch paginated transactions with optional filters and summary stats.
   * @param {{
   *   startDate?: string,
   *   endDate?: string,
   *   categoryId?: string,
   *   accountId?: string,
   *   type?: 'INCOME' | 'EXPENSE',
   *   search?: string,
   *   page?: number,
   *   limit?: number,
   *   sortBy?: string,
   *   sortOrder?: 'asc' | 'desc'
   * }} [params]
   * @returns {Promise<{ success: boolean, transactions: Array, pagination: object, summary: object }>}
   */
  async getTransactions(params = {}) {
    const response = await client.get('/transactions', { params });
    return response.data;
  },

  /**
   * Fetch a single transaction by ID.
   * @param {string} id
   * @returns {Promise<{ success: boolean, transaction: object }>}
   */
  async getTransactionById(id) {
    const response = await client.get(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Create a new transaction with atomic account balance update.
   * @param {{
   *   accountId: string,
   *   categoryId: string,
   *   amount: number,
   *   type: 'INCOME' | 'EXPENSE',
   *   date?: string,
   *   notes?: string,
   *   isRecurring?: boolean
   * }} data
   * @returns {Promise<{ success: boolean, message: string, transaction: object, updatedAccountBalance: number }>}
   */
  async createTransaction(data) {
    const response = await client.post('/transactions', data);
    return response.data;
  },

  /**
   * Update an existing transaction with atomic ledger rebalancing.
   * @param {string} id
   * @param {{
   *   accountId?: string,
   *   categoryId?: string,
   *   amount?: number,
   *   type?: 'INCOME' | 'EXPENSE',
   *   date?: string,
   *   notes?: string,
   *   isRecurring?: boolean
   * }} data
   * @returns {Promise<{ success: boolean, message: string, transaction: object }>}
   */
  async updateTransaction(id, data) {
    const response = await client.put(`/transactions/${id}`, data);
    return response.data;
  },

  /**
   * Delete a transaction and reverse its balance impact.
   * @param {string} id
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async deleteTransaction(id) {
    const response = await client.delete(`/transactions/${id}`);
    return response.data;
  },
};

export default transactionsApi;
