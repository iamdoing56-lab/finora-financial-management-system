import client from './client';

/**
 * Categories API Service
 * Interacts with /api/categories REST endpoints.
 */

export const categoriesApi = {
  /**
   * Fetch all categories (system defaults + user custom) with monthly stats.
   * @param {{ type?: string, origin?: string }} [params]
   * @returns {Promise<{ success: boolean, categories: Array, summary: object }>}
   */
  async getCategories(params = {}) {
    const response = await client.get('/categories', { params });
    return response.data;
  },

  /**
   * Create a new custom category.
   * @param {{ name: string, type: 'INCOME' | 'EXPENSE', color?: string, monthlyLimit?: number }} data
   * @returns {Promise<{ success: boolean, message: string, category: object }>}
   */
  async createCategory(data) {
    const response = await client.post('/categories', data);
    return response.data;
  },

  /**
   * Update a custom category.
   * @param {string} id
   * @param {{ name?: string, color?: string }} data
   * @returns {Promise<{ success: boolean, message: string, category: object }>}
   */
  async updateCategory(id, data) {
    const response = await client.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete a custom category with fallback reassignment of linked transactions to 'Other'.
   * @param {string} id
   * @returns {Promise<{ success: boolean, message: string, details: object }>}
   */
  async deleteCategory(id) {
    const response = await client.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoriesApi;
