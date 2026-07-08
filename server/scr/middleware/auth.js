/**
 * Auth Middleware — Simplified Header-Based Identity
 *
 * In a real production system, this middleware would:
 * 1. Extract and verify a JWT token from the Authorization header
 * 2. Validate the token signature against a secret/public key
 * 3. Decode the token to extract tenantId, userId, roles, permissions
 * 4. Check token expiration and refresh if needed
 * 5. Optionally validate the user exists in the user database
 *
 * For this exercise, we trust the X-Tenant-Id and X-User-Id headers
 * directly, treating them as the identity source. This is NOT secure
 * for production use — it's a stand-in for real JWT-based auth.
 */
function authMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id'];
  const userId = req.headers['x-user-id'];

  if (!tenantId || !userId) {
    return res.status(401).json({
      error: 'Missing required headers: X-Tenant-Id and X-User-Id',
    });
  }

  // Attach identity to request object for downstream use
  req.tenantId = tenantId;
  req.userId = userId;

  next();
}

module.exports = authMiddleware;
