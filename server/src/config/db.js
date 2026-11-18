require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
  dialectModule: require('pg'), // helps bundling on Vercel
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  pool: { max: 5, min: 0, idle: 10000 }, // keep small for serverless

});

module.exports = sequelize;
