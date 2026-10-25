const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Number of bcrypt salt rounds (10 is the industry-standard balance of security and speed)
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

/**
 * Hash a plain-text password with bcrypt.
 * @param {string} plainPassword - The password the user typed.
 * @returns {Promise<string>} The bcrypt hash to store in the database.
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * @param {string} plainPassword - The password the user typed.
 * @param {string} hash - The bcrypt hash stored in the database.
 * @returns {Promise<boolean>} true if they match, false otherwise.
 */
async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generate a signed JWT for a user.
 * The token payload contains only the minimum needed fields:
 *   - id: the user's UUID
 *   - role: USER or ADMIN (for RBAC middleware checks)
 *
 * @param {object} user - Prisma User object (or subset with id and role).
 * @returns {string} Signed JWT string.
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

/**
 * Verify and decode a JWT string.
 * Throws JsonWebTokenError or TokenExpiredError if the token is invalid.
 *
 * @param {string} token - The JWT string from the Authorization header.
 * @returns {object} Decoded payload { id, role, iat, exp }
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
