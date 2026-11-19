// backend/src/scripts/seedDb.js
// Automated Population of Sample Data from database/seed.sql

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedDatabase() {
  console.log('--- Seeding EXAMORA MySQL Database with Realistic Capstone Data ---');

  const connectionConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'examora_db',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  };

  let connection;
  try {
    console.log(`Connecting to ${connectionConfig.database} as '${connectionConfig.user}'...`);
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected!');

    const seedPath = path.join(__dirname, '../../../database/seed.sql');
    console.log(`Reading seed script from ${seedPath}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed queries...');
    await connection.query(seedSql);
    console.log('✓ Seed data populated successfully.');

    // Print summary counts
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [teacherCount] = await connection.query('SELECT COUNT(*) as count FROM teachers');
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
    const [courseCount] = await connection.query('SELECT COUNT(*) as count FROM courses');
    const [examCount] = await connection.query('SELECT COUNT(*) as count FROM exams');
    const [qCount] = await connection.query('SELECT COUNT(*) as count FROM questions');
    const [attCount] = await connection.query('SELECT COUNT(*) as count FROM attempts');
    const [resCount] = await connection.query('SELECT COUNT(*) as count FROM results');

    console.log('\n=======================================================');
    console.log('  EXAMORA SEED DATA SUMMARY:');
    console.log(`  - Users: ${userCount[0].count} (1 Admin, 10 Teachers, 50 Students)`);
    console.log(`  - Teachers: ${teacherCount[0].count}`);
    console.log(`  - Students: ${studentCount[0].count}`);
    console.log(`  - Courses: ${courseCount[0].count}`);
    console.log(`  - Examinations: ${examCount[0].count}`);
    console.log(`  - Questions: ${qCount[0].count}`);
    console.log(`  - Student Attempts: ${attCount[0].count}`);
    console.log(`  - Evaluated Results: ${resCount[0].count}`);
    console.log('=======================================================');

  } catch (error) {
    console.error('Seeding Failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedDatabase();

