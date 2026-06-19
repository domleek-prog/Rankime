const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Single-admin gate: the account whose email matches ADMIN_EMAIL.
function isAdmin(email) {
  const admin = process.env.ADMIN_EMAIL;
  return !!admin && !!email && email.toLowerCase() === admin.toLowerCase();
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req.user?.email)) return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { requireAuth, requireAdmin, isAdmin };
