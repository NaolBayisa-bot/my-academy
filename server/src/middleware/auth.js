const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware that reads the JWT from the `Authorization: Bearer <token>`
// header, verifies it, and attaches the decoded payload ({ id, role }) to
// `req.user`. Returns 401 when the token is missing or invalid.
//
// It also rejects suspended accounts: the JWT payload only carries { id, role }
// (no status), so the current user row is loaded to check the `status` flag.
// A suspended user gets 403 at this checkpoint (and at login), so a live token
// from before a suspension is not allowed through.
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.substring(7); // length of 'Bearer ' === 7

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been suspended. Contact an administrator.',
      });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware factory: passes only when `req.user.role` is among the
// `allowedRoles`. Otherwise returns 403. Intended to be used after
// `authenticate` (which sets `req.user`).
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role.' });
    }
    next();
  };
};
