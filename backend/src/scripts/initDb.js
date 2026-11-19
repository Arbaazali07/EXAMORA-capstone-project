// backend/src/scripts/initDb.js
// Automated MySQL Schema, Views, and Performance Indexes Initialization

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function initDatabase() {
  console.log('--- Initializing EXAMORA MySQL Database Schema ---');

  const connectionConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  };

  let connection;
  try {
    console.log(`Connecting to MySQL Server at ${connectionConfig.host}:${connectionConfig.port} as '${connectionConfig.user}'...`);
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected successfully!');

    // 1. Create database
    console.log('Creating database examora_db if not exists...');
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS examora_db
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;
    `);
    await connection.changeUser({ database: 'examora_db' });

    // 2. Read and execute schema.sql
    console.log('Executing database/schema.sql...');
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✓ Schema tables created successfully.');

    // 3. Read and execute views.sql
    console.log('Executing database/views.sql...');
    const viewsPath = path.join(__dirname, '../../../database/views.sql');
    const viewsSql = fs.readFileSync(viewsPath, 'utf8');
    await connection.query(viewsSql);
    console.log('✓ Database views created successfully.');

    // 4. Read and execute indexes.sql
    console.log('Executing database/indexes.sql...');
    const indexesPath = path.join(__dirname, '../../../database/indexes.sql');
    const indexesSql = fs.readFileSync(indexesPath, 'utf8');
    await connection.query(indexesSql);
    console.log('✓ Performance indexes created successfully.');

    // Verify created tables and views
    const [tables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const [views] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");

    console.log(`\nInitialization Complete!`);
    console.log(`Base Tables created (${tables.length}):`, tables.map(t => Object.values(t)[0]).join(', '));
    console.log(`Views created (${views.length}):`, views.map(v => Object.values(v)[0]).join(', '));

  } catch (error) {
    console.error('Database Initialization Failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n[Hint]: Check DB_PASSWORD in backend/.env to match your local MySQL root password.');
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();

