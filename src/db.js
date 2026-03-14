import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let poolInstance = null;

export function getMysqlUrl() {
  return process.env.MYSQL_URL || '';
}

export function assertMysqlUrl() {
  const url = getMysqlUrl();
  if (!url) {
    throw new Error('MYSQL_URL não definida.');
  }
  return url;
}

export function createPool() {
  if (poolInstance) return poolInstance;

  poolInstance = mysql.createPool({
    uri: assertMysqlUrl(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  return poolInstance;
}

export const pool = new Proxy({}, {
  get(_target, prop) {
    const realPool = createPool();
    const value = realPool[prop];
    return typeof value === 'function' ? value.bind(realPool) : value;
  }
});

export async function testConnection() {
  const realPool = createPool();
  const conn = await realPool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}
