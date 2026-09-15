// backend/config/db.js
require('dotenv').config();

const mysql = require('mysql2');

// Buat connection pool (bukan koneksi tunggal)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Uji koneksi sekali saat aplikasi start
db.getConnection((err, connection) => {
  if (err) {
    console.error('Gagal konek ke MySQL:', err.message);
    return;
  }
  console.log('MySQL connected');
  connection.release(); // kembalikan koneksi ke pool, jangan lupa
});

module.exports = db;