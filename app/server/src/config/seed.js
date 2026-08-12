require('dotenv').config();
const { sequelize, Category } = require('../models');

const categories = [
  { name: 'Development' },
  { name: 'Cybersecurity' },
  { name: 'Networking' },
  { name: 'Creative Works' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync();
    console.log('Database synced.');

    for (const cat of categories) {
      const [record, created] = await Category.findOrCreate({
        where: { name: cat.name },
        defaults: { name: cat.name },
      });
      if (created) {
        console.log(`Created category: ${cat.name} (id: ${record.id})`);
      } else {
        console.log(`Category already exists: ${cat.name} (id: ${record.id})`);
      }
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

seed();