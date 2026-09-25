// backend/models/usersModel.js
// Model untuk tabel users — hanya query database, tidak ada logic request/response

const db = require("../config/db");

// Buat user baru, kembalikan insertId
const createUser = (user) => {
  const {
    nama_d,
    nama_b,
    kelamin,
    lahir,
    alamat,
    phone,
    email,
    role,
    uname,
    passwd,
    foto,
  } = user;

  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO users
        (nama_d, nama_b, kelamin, lahir, alamat, phone, email, role, uname, passwd, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama_d, nama_b, kelamin, lahir, alamat, phone, email, role, uname, passwd, foto],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
};

// Cari user berdasarkan email (untuk cek duplikat saat register)
const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });
  });
};

// Cari user berdasarkan email ATAU uname (untuk proses login)
const findUserByCredential = (credential) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE email = ? OR uname = ?",
      [credential, credential],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Cari user berdasarkan id, TANPA kolom passwd (aman untuk dikirim ke client)
const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT id, nama_d, nama_b, kelamin, lahir, alamat, phone, email, role, uname, foto, created_at, updated_at
       FROM users WHERE id = ?`,
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Ambil hash password berdasarkan id (dipakai saat ganti password/verifikasi)
const findPasswdHashById = (id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT passwd FROM users WHERE id = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] ? rows[0].passwd : null);
    });
  });
};

// Update profil user berdasarkan id
const updateUserProfile = (id, user) => {
  const {
    nama_d,
    nama_b,
    kelamin,
    lahir,
    alamat,
    phone,
    email,
    uname,
    foto,
  } = user;

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE users SET
        nama_d = ?, nama_b = ?, kelamin = ?, lahir = ?, alamat = ?,
        phone = ?, email = ?, uname = ?, foto = ?
       WHERE id = ?`,
      [nama_d, nama_b, kelamin, lahir, alamat, phone, email, uname, foto, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Update hash password saja (dipakai saat ganti password)
const updatePasswd = (id, hashedPasswd) => {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE users SET passwd = ? WHERE id = ?",
      [hashedPasswd, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Ambil semua user berdasarkan role (misal "pembeli"), tanpa kolom passwd
const findAllUsersByRole = (role) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT id, nama_d, nama_b, kelamin, lahir, alamat, phone, email, role, uname, foto, created_at, updated_at
       FROM users WHERE role = ?
       ORDER BY created_at DESC`,
      [role],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// Hapus user berdasarkan id
const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows);
    });
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByCredential,
  findUserById,
  findPasswdHashById,
  updateUserProfile,
  updatePasswd,
  findAllUsersByRole,
  deleteUser,
};