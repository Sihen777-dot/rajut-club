// backend/models/produkModel.js
// Model untuk tabel produk — hanya query database

const db = require("../config/db");

// Ambil semua produk
const findAllProduk = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM produk ORDER BY created_at DESC", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Ambil satu produk berdasarkan id_produk
const findProdukById = (id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM produk WHERE id_produk = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });
  });
};

// Tambah produk baru, kembalikan insertId
const insertProduk = (produk) => {
  const { nama_produk, deskripsi, harga, gambar, kategori } = produk;

  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO produk (nama_produk, deskripsi, harga, gambar, kategori)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_produk, deskripsi, harga, gambar, kategori],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
};

// Update produk berdasarkan id_produk
const updateProduk = (id, produk) => {
  const { nama_produk, deskripsi, harga, gambar, kategori } = produk;

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE produk SET nama_produk = ?, deskripsi = ?, harga = ?, gambar = ?, kategori = ?
       WHERE id_produk = ?`,
      [nama_produk, deskripsi, harga, gambar, kategori, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Hapus produk berdasarkan id_produk
const deleteProduk = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM produk WHERE id_produk = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows);
    });
  });
};

module.exports = {
  findAllProduk,
  findProdukById,
  insertProduk,
  updateProduk,
  deleteProduk,
};