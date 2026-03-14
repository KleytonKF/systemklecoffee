
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MYSQL_URL) {
  throw new Error('MYSQL_URL não definida.');
}

export const pool = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});
