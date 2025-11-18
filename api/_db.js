// Simple MySQL pool for Vercel serverless functions
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || 'u111034987_sistemsakura';
const DB_PASSWORD = process.env.DB_PASSWORD || 'SakuraKonveksiOptimal2026-';
const DB_NAME = process.env.DB_NAME || 'u111034987_erpsakura';

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4_unicode_ci',
    });
  }
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

module.exports = { query };
