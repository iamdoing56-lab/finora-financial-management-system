import client from './client';

/**
 * Budgets API Client Service
 * Covers /api/budgets endpoints with CRUD and monthly tier aggregations.
 */
export const budgetsApi = {
  /**
   * Get all budgets with spent progress and status for given month/year
   * @param {Object} params - { month?: number, year?: number }
   */
  async getBudgets(params = {}) {
    const response = await client.get('/budgets', { params });
    return response.data;
  },

  /**
   * Get single budget by ID
   * @param {string} id
   */
  async getBudgetById(id) {
    const response = await client.get(`/budgets/${id}`);
    return response.data;
  },

  /**
   * Create or upsert a monthly budget
   * @param {Object} data - { categoryId, monthlyLimit, month, year }
   */
  async createBudget(data) {
    const response = await client.post('/budgets', data);
    return response.data;
  },

  /**
   * Update budget limit or period
   * @param {string} id
   * @param {Object} data - { monthlyLimit, month, year }
   */
  async updateBudget(id, data) {
    const response = await client.put(`/budgets/${id}`, data);
    return response.data;
  },

  /**
   * Delete budget
   * @param {string} id
   */
  async deleteBudget(id) {
    const response = await client.delete(`/budgets/${id}`);
    return response.data;
  },
};

export default budgetsApi;
