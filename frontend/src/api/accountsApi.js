import client from './client';

/**
 * Accounts API Service
 * Interacts with /api/accounts REST endpoints.
 */

export const accountsApi = {
  /**
   * Fetch all user accounts with computed summary metrics.
   * @param {{ status?: string, type?: string }} [params]
   * @returns {Promise<{ success: boolean, accounts: Array, summary: object }>}
   */
  async getAccounts(params = {}) {
    const response = await client.get('/accounts', { params });
    return response.data;
  },

  /**
   * Fetch a single account's details, recent transactions, and monthly inflow/outflow.
   * @param {string} id
   * @returns {Promise<{ success: boolean, account: object }>}
   */
  async getAccountById(id) {
    const response = await client.get(`/accounts/${id}`);
    return response.data;
  },

  /**
   * Create a new financial account.
   * @param {{ name: string, type: string, initialBalance?: number, currency?: string }} data
   * @returns {Promise<{ success: boolean, message: string, account: object }>}
   */
  async createAccount(data) {
    const response = await client.post('/accounts', data);
    return response.data;
  },

  /**
   * Update an existing account.
   * @param {string} id
   * @param {{ name?: string, type?: string, currency?: string }} data
   * @returns {Promise<{ success: boolean, message: string, account: object }>}
   */
  async updateAccount(id, data) {
    const response = await client.put(`/accounts/${id}`, data);
    return response.data;
  },

  /**
   * Soft-delete (archive) an account.
   * @param {string} id
   * @returns {Promise<{ success: boolean, message: string, account: object }>}
   */
  async deleteAccount(id) {
    const response = await client.delete(`/accounts/${id}`);
    return response.data;
  },
};

export default accountsApi;
