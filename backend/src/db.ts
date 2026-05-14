import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DB_URL) {
  throw new Error("Переменная окружения DB_URL не задана!");
}

const dbUrl = new URL(process.env.DB_URL);

export const pool = mysql.createPool({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1), // slice(1) убирает начальный слэш (/) из пути
  port: parseInt(dbUrl.port, 10) || 3306, // порт из URL или стандартный MySQL порт
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});