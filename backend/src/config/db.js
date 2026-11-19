// backend/src/config/db.js
// MySQL 8.0+ Connection Pool Module using mysql2/promise

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'examora_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 25,
  queueLimit: 0,
  multipleStatements: true,
  timezone: '+00:00',
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

// Helper function for direct queries
async function query(sql, params = []) {
  try {
    const [results, fields] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('MySQL Query Error:', error.message, '\nSQL:', sql);
    throw error;
  }
}

// Helper to get dedicated connection from pool (for transactions)
async function getConnection() {
  return await pool.getConnection();
}

// Function to test connectivity
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT VERSION() AS version, DATABASE() AS current_db');
    connection.release();
    return {
      connected: true,
      version: rows[0].version,
      database: rows[0].current_db,
      host: dbConfig.host,
      user: dbConfig.user
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      code: error.code,
      host: dbConfig.host,
      user: dbConfig.user
    };
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
  dbConfig
};

