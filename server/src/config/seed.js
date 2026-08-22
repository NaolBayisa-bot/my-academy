require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, Category, User } = require('../models');

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

    // Ensure a single super admin user exists.
    const existingAdmin = await User.findOne({ where: { role: 'super_admin' } });
    if (existingAdmin) {
      console.log(
        `Super admin already exists: ${existingAdmin.email} (id: ${existingAdmin.id})`
      );
    } else {
      const email = process.env.SUPER_ADMIN_EMAIL;
      const password = process.env.SUPER_ADMIN_PASSWORD;

      if (!email || !password) {
        throw new Error(
          'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in the .env file to seed a super admin.'
        );
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const admin = await User.create({
        name: 'Super Admin',
        email,
        password_hash: hashedPassword,
        role: 'super_admin',
      });
      console.log(`Created super admin user: ${admin.email} (id: ${admin.id})`);
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

seed();