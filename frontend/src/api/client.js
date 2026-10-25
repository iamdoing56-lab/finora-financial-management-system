import axios from 'axios';

/**
 * Finora API Client
 *
 * A pre-configured Axios instance that:
 * 1. Points to the backend REST API base URL.
 * 2. Attaches the JWT token to every request automatically (request interceptor).
 * 3. Handles 401 Unauthorized responses by clearing session and redirecting to login (response interceptor).
 *
 * Usage: import client from './client'; then client.get('/accounts'), client.post('/auth/login', data), etc.
 */

// In development, Vite's proxy forwards /api → http://localhost:5000
// In production, VITE_API_BASE_URL is set to the Render backend URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Reads the JWT from localStorage and attaches it as a Bearer token.
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finora_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // If request setup fails, reject the promise
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// Handles 401 Unauthorized: token expired or invalid → clear session and redirect.
client.interceptors.response.use(
  (response) => {
    // Successful response — pass through unchanged
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is expired or invalid — clean up local session
      localStorage.removeItem('finora_token');
      localStorage.removeItem('finora_user');
      // Redirect to login page (full page redirect so React context resets)
      window.location.href = '/login';
    }
    // Re-throw so calling code (api/*.js) can handle other errors
    return Promise.reject(error);
  }
);

export default client;
