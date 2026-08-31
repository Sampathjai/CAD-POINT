const jwt = require('jsonwebtoken');
const { normalizeRole, hasPermission } = require('../config/permissions');

function authenticate(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.user = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowedRoles = roles.map(r => normalizeRole(r));

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role ${req.user.role} does not have permission for this resource.`
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
