const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-service',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'bloguser',
  password: process.env.DB_PASSWORD || 'changeme',
  database: process.env.DB_NAME || 'blogdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

async function checkDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { pool, checkDbConnection };
