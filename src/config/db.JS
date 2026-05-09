const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config(); // reads the .env file

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456', // your password
  database: 'explore_abyssinia',
  waitForConnections: true,
  connectionLimit: 10,
});

const promisePool = pool.promise();

module.exports = promisePool; // we will use this to talk to database
