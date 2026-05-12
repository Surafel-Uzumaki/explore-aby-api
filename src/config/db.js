const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Use DATABASE_URL from Railway if available, otherwise fallback to individual variables
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

console.log('✅ Database pool created successfully');

module.exports = promisePool;
