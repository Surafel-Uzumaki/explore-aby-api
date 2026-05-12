const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Prefer DATABASE_URL if available (public connection)
const dbConfig = process.env.DATABASE_URL
  ? { uri: process.env.DATABASE_URL }
  : {
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT || 3306,
    };

const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

console.log(
  '✅ Database pool created with:',
  process.env.DATABASE_URL ? 'DATABASE_URL' : 'individual vars',
);

module.exports = promisePool;
