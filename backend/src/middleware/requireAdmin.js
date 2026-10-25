/**
 * Admin Role Guard Middleware (requireAdmin)
 *
 * This middleware is the SECOND layer of RBAC (Role-Based Access Control).
 * It must always be used AFTER authMiddleware, which populates req.user.
 *
 * How it works (viva explanation):
 * 1. authMiddleware already verified the token and attached req.user.
 * 2. This middleware checks if that user's role is "ADMIN".
 * 3. If yes → call next() to allow access to the admin route.
 * 4. If no → respond with 403 Forbidden (not 401, because they ARE authenticated,
 *    they just don't have permission).
 *
 * Usage in routes:
 *   router.get('/admin/users', authMiddleware, requireAdmin, handler)
 */
function requireAdmin(req, res, next) {
  // req.user is set by authMiddleware. If it somehow doesn't exist, deny access.
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated.',
    });
  }

  // Check the role — must be exactly 'ADMIN'
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator access required.',
    });
  }

  // User is an admin — allow the request through
  next();
}

module.exports = requireAdmin;
