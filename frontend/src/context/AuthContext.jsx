import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext — Global authentication state provider
 *
 * Provides to every component in the app:
 *   - user: the logged-in user object { id, name, email, role, currency } or null
 *   - token: the JWT string or null
 *   - login(token, user): called after a successful login/register API response
 *   - logout(): clears session and redirects to /login
 *   - isAuthenticated: boolean shorthand
 *   - isAdmin: boolean shorthand (true if role === 'ADMIN')
 *   - loading: true while checking localStorage on first mount
 *
 * How it works:
 * 1. On app start, reads from localStorage to restore session.
 * 2. login() saves the token and user to localStorage + state.
 * 3. logout() clears localStorage + state.
 * 4. The Axios client (src/api/client.js) reads the token from localStorage
 *    and attaches it to every API request automatically.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true); // true while rehydrating from localStorage

  // On first mount: rehydrate session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('finora_token');
    const storedUser  = localStorage.getItem('finora_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        // Corrupted localStorage data — clear it
        localStorage.removeItem('finora_token');
        localStorage.removeItem('finora_user');
      }
    }

    setLoading(false);
  }, []);

  /**
   * Call this after a successful login or register API response.
   * @param {string} jwtToken - The token from the API response.
   * @param {object} userData - The user object from the API response.
   */
  function login(jwtToken, userData) {
    localStorage.setItem('finora_token', jwtToken);
    localStorage.setItem('finora_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  }

  /**
   * Clears the session from state and localStorage.
   * The Axios client also handles this on 401 responses.
   */
  function logout() {
    localStorage.removeItem('finora_token');
    localStorage.removeItem('finora_user');
    setToken(null);
    setUser(null);
  }

  /**
   * Update the stored user (e.g. after changing name or currency in Settings).
   * @param {object} updatedUser - Updated fields to merge into the current user.
   */
  function updateUser(updatedUser) {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem('finora_user', JSON.stringify(merged));
    setUser(merged);
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume auth context.
 * Usage: const { user, login, logout, isAuthenticated, isAdmin } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
