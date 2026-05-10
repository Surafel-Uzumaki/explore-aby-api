const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'explore_abyssinia',
  waitForConnections: true,
  connectionLimit: 10,
});

const promisePool = pool.promise();

module.exports = promisePool;
