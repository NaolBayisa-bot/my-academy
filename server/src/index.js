require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Fail fast: the app must never run in production with a missing or placeholder
// JWT secret. The compose file requires JWT_SECRET, this guard is a second line
// of defense for any other deployment path.
const DEFAULT_JWT_SECRET = 'change_me_in_production';
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET)
) {
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: JWT_SECRET must be set to a strong, non-default value in production.'
  );
  process.exit(1);
}

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const postRoutes = require('./routes/postRoutes');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', lessonRoutes);
app.use('/api', moduleRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api', progressRoutes);
app.use('/api/posts', postRoutes);

// Centralized error handler — registered LAST, after all routes/middleware,
// so it catches every error thrown by async handlers or passed via next(err)
// and returns a consistent JSON shape: { error: "message" }.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Give Postgres a brief window to accept connections on startup.
// A tiny startup race can occur if the DB service isn't fully ready; retrying
// turns that into a non-event instead of a one-shot failure that silently
// skips schema sync.
const RETRY_DELAY_MS = 2000;
const MAX_ATTEMPTS = 15;

const waitForDb = async () => {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        console.warn(
          `DB not ready (attempt ${attempt}/${MAX_ATTEMPTS}): ${error.message}. Retrying in ${RETRY_DELAY_MS}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  console.error('Unable to connect to the database:', lastError?.message);
};

const startServer = async () => {
  // Test the database connection (with a bounded retry for cold starts)
  await waitForDb();

  // No sequelize.sync() here: the schema is owned by migrations. Ensure the
  // latest schema is applied by running `npm run db:migrate` (from server/)
  // before starting the app, e.g. in CI/CD or the container entrypoint.
  // eslint-disable-next-line no-console
  console.log('Schema is managed by migrations (npm run db:migrate). Skipping runtime sync.');

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
