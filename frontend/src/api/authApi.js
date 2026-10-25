import client from './client';

/**
 * Authentication API Service
 * Handles user sign-in, account registration, fetching profile, and updating profile settings.
 */

export const authApi = {
  /**
   * Log into Finora
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ success: boolean, token: string, user: object }>}
   */
  async login(credentials) {
    const response = await client.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new Finora account
   * @param {{ name: string, email: string, password: string, confirmPassword?: string }} userData
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  async register(userData) {
    const response = await client.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Fetch current authenticated user's profile
   * @returns {Promise<{ success: boolean, user: object }>}
   */
  async getMe() {
    const response = await client.get('/auth/me');
    return response.data;
  },

  /**
   * Update authenticated user's profile and preferences (name, currency, password)
   * @param {{ name?: string, currency?: string, currentPassword?: string, newPassword?: string }} profileData
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  async updateProfile(profileData) {
    const response = await client.put('/auth/profile', profileData);
    return response.data;
  },
};

export default authApi;
