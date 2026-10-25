const { verifyToken } = require('../utils/authUtils');
const prisma = require('../prisma/client');

/**
 * Authentication Middleware
 *
 * How it works (step by step — viva explanation):
 * 1. Reads the Authorization header from the request.
 * 2. Extracts the JWT token (format: "Bearer <token>").
 * 3. Verifies the token signature using JWT_SECRET.
 * 4. Fetches the user from the database to confirm they still exist and are active.
 * 5. Attaches the user object to req.user so route handlers can access it.
 * 6. Calls next() to pass control to the route handler.
 *
 * If anything fails, responds with 401 Unauthorized.
 */
async function authMiddleware(req, res, next) {
  // Step 1: Read the Authorization header
  const authHeader = req.headers['authorization'];

  // Step 2: Check it exists and has the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  // Step 3: Extract the token string (everything after "Bearer ")
  const token = authHeader.split(' ')[1];

  // Step 4: Verify the token — this will throw if expired or tampered with
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  // Step 5: Fetch user from database to verify they still exist and are active
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        currency: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Step 6: Attach user to request object for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware DB error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication check failed. Please try again.',
    });
  }
}

module.exports = authMiddleware;
