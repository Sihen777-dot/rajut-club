// backend/models/usersModel.js
// Model untuk tabel users — PostgreSQL (Supabase)

const db = require("../config/db");

const createUser = (user) => {
  const {
    nama_d, nama_b, kelamin, lahir, alamat, phone,
    email, role, uname, passwd, foto,
  } = user;

  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO users
        (nama_d, nama_b, kelamin, lahir, alamat, phone, email, role, uname, passwd, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [nama_d, nama_b, kelamin, lahir, alamat, phone, email, role, uname, passwd, foto],
      (err, result) => {
        if (err) return reject(err);
        const id = result.insertId ?? result[0]?.id ?? result.rows?.[0]?.id;
        resolve(id);
      }
    );
  });
};

const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });
  });
};

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

const findPasswdHashById = (id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT passwd FROM users WHERE id = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] ? rows[0].passwd : null);
    });
  });
};

const updateUserProfile = (id, user) => {
  const { nama_d, nama_b, kelamin, lahir, alamat, phone, email, uname, foto } = user;

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE users SET
        nama_d = ?, nama_b = ?, kelamin = ?, lahir = ?, alamat = ?,
        phone = ?, email = ?, uname = ?, foto = ?
       WHERE id = ?`,
      [nama_d, nama_b, kelamin, lahir, alamat, phone, email, uname, foto, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows ?? result.rowCount ?? 0);
      }
    );
  });
};

const updatePasswd = (id, hashedPasswd) => {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE users SET passwd = ? WHERE id = ?",
      [hashedPasswd, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows ?? result.rowCount ?? 0);
      }
    );
  });
};

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

const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows ?? result.rowCount ?? 0);
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
