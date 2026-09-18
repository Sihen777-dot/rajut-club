// backend/models/artikelModel.js
// Model untuk tabel artikel — hanya query database

const db = require("../config/db");

// Ambil semua artikel
const findAllArtikel = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM artikel ORDER BY created_at DESC", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const findArtikelById = (id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM artikel WHERE id = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });
  });
};

// Tambah artikel baru, kembalikan insertId
const insertArtikel = (artikel) => {
  const { judul, ringkasan, isi, gambar } = artikel;

  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO artikel (judul, ringkasan, isi, gambar)
       VALUES (?, ?, ?, ?)`,
      [judul, ringkasan, isi, gambar],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
};

// Update artikel berdasarkan id
const updateArtikel = (id, artikel) => {
  const { judul, ringkasan, isi, gambar } = artikel;

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE artikel SET judul = ?, ringkasan = ?, isi = ?, gambar = ?
       WHERE id = ?`,
      [judul, ringkasan, isi, gambar, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Hapus artikel berdasarkan id
const deleteArtikel = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM artikel WHERE id = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows);
    });
  });
};

module.exports = {
  findAllArtikel,
  findArtikelById,
  insertArtikel,
  updateArtikel,
  deleteArtikel,
};