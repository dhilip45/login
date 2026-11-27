const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'database',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'login_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

/**
 * Verifies MySQL connectivity by executing a lightweight query.
 */
async function checkDbConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  checkDbConnection,
};
