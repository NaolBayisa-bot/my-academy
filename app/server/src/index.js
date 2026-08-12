require('dotenv').config();
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const { sequelize } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);

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
