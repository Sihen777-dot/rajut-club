// backend/models/artikelModel.js
// Model untuk tabel artikel — PostgreSQL (Supabase)

const db = require("../config/db");

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

const insertArtikel = (artikel) => {
  const { judul, ringkasan, isi, gambar } = artikel;

  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO artikel (judul, ringkasan, isi, gambar)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
      [judul, ringkasan, isi, gambar],
      (err, result) => {
        if (err) return reject(err);
        const id = result.insertId ?? result[0]?.id ?? result.rows?.[0]?.id;
        resolve(id);
      }
    );
  });
};

const updateArtikel = (id, artikel) => {
  const { judul, ringkasan, isi, gambar } = artikel;

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE artikel SET judul = ?, ringkasan = ?, isi = ?, gambar = ?
       WHERE id = ?`,
      [judul, ringkasan, isi, gambar, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows ?? result.rowCount ?? 0);
      }
    );
  });
};

const deleteArtikel = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM artikel WHERE id = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows ?? result.rowCount ?? 0);
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
