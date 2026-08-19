const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

// Sign a JWT containing the user's id and role.
const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

// Strip sensitive fields from a user instance before sending it in a response.
const serializeUser = (user) => {
  const { password_hash, ...publicFields } = user.toJSON();
  return publicFields;
};

// POST /api/auth/register
// Creates a new student user and returns the user (without password_hash)
// along with a signed JWT.
exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role: 'student',
      category_id: null,
    });

    const token = generateToken(user);

    return res.status(201).json({
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    // Delegate to the centralized error handler in
    // src/middleware/errorHandler.js. Sequelize unique-constraint
    // violations are mapped to 409 there (e.g. "Email already in use.").
    next(error);
  }
};

// POST /api/auth/login
// Verifies credentials and returns a signed JWT plus the user info
// (without password_hash).
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    // Delegate to the centralized error handler in
    // src/middleware/errorHandler.js.
    next(error);
  }
};

// GET /api/auth/me — protected route that returns the authenticated user.
// Relies on req.user being attached by the `authenticate` middleware.
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      user: serializeUser(user),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
