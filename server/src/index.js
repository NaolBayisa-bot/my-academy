require('dotenv').config();
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
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
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api', progressRoutes);
app.use('/api/posts', postRoutes);

// Centralized error handler — registered LAST, after all routes/middleware,
// so it catches every error thrown by async handlers or passed via next(err)
// and returns a consistent JSON shape: { error: "message" }.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test the database connection
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  }

  // Sync models with the database (creates tables if they don't exist yet)
  try {
    await sequelize.sync();
    console.log('Database synced.');
  } catch (error) {
    console.error('Unable to sync the database:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
