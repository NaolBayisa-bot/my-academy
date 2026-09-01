'use strict';

// sequelize-cli configuration.
//
// Loaded by sequelize-cli via `.sequelizerc`. We call `dotenv` here so the
// CLI reads `DATABASE_URL` from `server/.env` and uses the exact same
// database as the application runtime.
//
//   - use_env_variable tells sequelize-cli to pull the connection string from
//     the named environment variable (set below by dotenv).
//   - env values (development/test/production) all share the connection URI.

require('dotenv').config();

const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
