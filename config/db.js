// backend/config/db.js
require('dotenv').config();

const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : '',
  database: process.env.DB_NAME || 'rajut_club_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Gagal konek ke MySQL:', err.message);
    console.error('   Cek: XAMPP MySQL nyala? Database rajut_club_db sudah di-import?');
    console.error('   File .env → DB_HOST/DB_USER/DB_PASS/DB_NAME');
    return;
  }
  console.log('✅ MySQL connected →', process.env.DB_NAME || 'rajut_club_db');
  connection.release();
});

module.exports = db;
