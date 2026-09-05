const { connectDB, disconnectDB } = require('../config/db');
const { seedDatabase } = require('./seedData');

const runSeeder = async () => {
  try {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error] Seeding failed:', error);
    process.exit(1);
  }
};

runSeeder();
