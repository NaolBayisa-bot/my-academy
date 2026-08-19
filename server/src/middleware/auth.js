const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware that reads the JWT from the `Authorization: Bearer <token>`
// header, verifies it, and attaches the decoded payload ({ id, role }) to
// `req.user`. Returns 401 when the token is missing or invalid.
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.substring(7); // length of 'Bearer ' === 7

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
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
