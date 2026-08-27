require('dotenv').config();
const { sequelize } = require('../models');

// One-time migration: adds the optional Lessons.content TEXT column used for
// per-lesson notes / test examples rendered below the video player.
// Safe to re-run (ADD COLUMN IF NOT EXISTS).
async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.query(`
      ALTER TABLE "Lessons"
      ADD COLUMN IF NOT EXISTS "content" TEXT
    `);
    console.log('Lessons.content column ensured.');

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

migrate();
