// backend/models/pembelianModel.js
// Model tabel pembelian — disesuaikan dengan skema SQL sebenarnya:
// nama_penerima, alamat_kirim, no_hp, metode_bayar, status_bayar, shipping, bukti_bayar, qty

const db = require("../config/db");

// Alias agar frontend tetap bisa pakai nama field lama
const SELECT_ALIAS = `
  p.id, p.id_pembeli, p.id_produk,
  p.nama_penerima AS nama_pembeli,
  p.alamat_kirim AS alamat_pembeli,
  p.no_hp AS phone_pembeli,
  p.metode_bayar AS metode_pembayaran,
  p.status_bayar AS pembayaran,
  p.shipping AS pengiriman,
  p.status, p.catatan,
  p.bukti_bayar AS foto_bukti,
  p.qty AS jumlah,
  p.created_at, p.updated_at
`;

// Ambil semua pembelian + detail pembeli & produk (untuk admin)
const findAllPembelianWithDetail = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT ${SELECT_ALIAS},
              u.nama_d AS pembeli_nama_d, u.nama_b AS pembeli_nama_b, u.uname AS pembeli_uname,
              pr.nama_produk, pr.harga, pr.gambar AS produk_gambar, pr.gambar AS gambar_produk,
              pr.kategori AS kategori_produk
       FROM pembelian p
       JOIN users u ON p.id_pembeli = u.id
       JOIN produk pr ON p.id_produk = pr.id_produk
       ORDER BY p.created_at DESC`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// Ambil satu pembelian berdasarkan id (tanpa filter pembeli, untuk admin)
const findPembelianById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT ${SELECT_ALIAS},
              u.nama_d AS pembeli_nama_d, u.nama_b AS pembeli_nama_b,
              pr.nama_produk, pr.harga, pr.gambar AS produk_gambar, pr.gambar AS gambar_produk,
              pr.kategori AS kategori_produk
       FROM pembelian p
       LEFT JOIN users u ON p.id_pembeli = u.id
       LEFT JOIN produk pr ON p.id_produk = pr.id_produk
       WHERE p.id = ?`,
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Update pembelian berdasarkan id (admin)
const updatePembelian = (id, data) => {
  const {
    nama_pembeli,
    alamat_pembeli,
    phone_pembeli,
    metode_pembayaran,
    pembayaran,
    pengiriman,
    status,
    catatan,
    foto_bukti,
  } = data;

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE pembelian SET
        nama_penerima = ?, alamat_kirim = ?, no_hp = ?,
        metode_bayar = ?, status_bayar = ?, shipping = ?,
        status = ?, catatan = ?, bukti_bayar = ?
       WHERE id = ?`,
      [
        nama_pembeli ?? null,
        alamat_pembeli ?? null,
        phone_pembeli ?? null,
        metode_pembayaran ?? null,
        pembayaran ?? null,
        pengiriman ?? null,
        status ?? null,
        catatan ?? null,
        foto_bukti ?? null,
        id,
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Hapus pembelian berdasarkan id
const deletePembelian = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM pembelian WHERE id = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows);
    });
  });
};

// Tambah pembelian baru — pakai nama kolom yang benar di database
const insertPembelian = (data) => {
  const {
    id_pembeli,
    id_produk,
    nama_pembeli,
    alamat_pembeli,
    phone_pembeli,
    metode_pembayaran,
    pembayaran,
    pengiriman,
    status,
    catatan,
    foto_bukti,
    jumlah,
  } = data;

  const qty = Math.max(1, parseInt(jumlah, 10) || 1);
  // no_hp di DB bertipe bigint — pastikan angka
  const noHp = String(phone_pembeli || "").replace(/\D/g, "") || "0";

  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO pembelian
        (id_pembeli, id_produk, nama_penerima, alamat_kirim, no_hp,
         metode_bayar, status_bayar, shipping, status, catatan, bukti_bayar, qty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_pembeli,
        id_produk,
        nama_pembeli || "",
        alamat_pembeli || "",
        noHp,
        metode_pembayaran || "cash",
        pembayaran || "Belum_dibayar",
        pengiriman || "delivery",
        status || "Menunggu",
        catatan || null,
        foto_bukti || null,
        qty,
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
};

/** Update pesanan milik pembeli tertentu (bayar / konfirmasi diterima) */
const updatePembelianByPembeli = (id, id_pembeli, data) => {
  const fields = [];
  const params = [];

  if (data.metode_pembayaran != null) {
    fields.push("metode_bayar = ?");
    params.push(data.metode_pembayaran);
  }
  if (data.pembayaran != null) {
    fields.push("status_bayar = ?");
    params.push(data.pembayaran);
  }
  if (data.status != null) {
    fields.push("status = ?");
    params.push(data.status);
  }
  if (data.foto_bukti != null) {
    fields.push("bukti_bayar = ?");
    params.push(data.foto_bukti);
  }
  if (data.jumlah != null) {
    fields.push("qty = ?");
    params.push(Math.max(1, parseInt(data.jumlah, 10) || 1));
  }
  if (!fields.length) {
    return Promise.resolve(0);
  }
  params.push(id, id_pembeli);
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE pembelian SET ${fields.join(", ")} WHERE id = ? AND id_pembeli = ?`,
      params,
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Ambil semua pembelian milik satu pembeli + detail produk
const findPembelianByPembeliIdWithDetail = (id_pembeli) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT ${SELECT_ALIAS},
              pr.nama_produk, pr.harga, pr.gambar AS produk_gambar, pr.gambar AS gambar_produk
       FROM pembelian p
       JOIN produk pr ON p.id_produk = pr.id_produk
       WHERE p.id_pembeli = ?
       ORDER BY p.created_at DESC`,
      [id_pembeli],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// Ambil satu pembelian, khusus milik pembeli tertentu
const findPembelianByIdAndPembeliId = (id, id_pembeli) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT ${SELECT_ALIAS} FROM pembelian p WHERE p.id = ? AND p.id_pembeli = ?`,
      [id, id_pembeli],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Statistik pembelian milik satu pembeli
const getStatsByPembeliId = (id_pembeli) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT
        COUNT(*) AS total_pembelian,
        SUM(CASE WHEN status = 'Menunggu' THEN 1 ELSE 0 END) AS total_menunggu,
        SUM(CASE WHEN status = 'Diterima' THEN 1 ELSE 0 END) AS total_diterima,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) AS total_selesai
       FROM pembelian
       WHERE id_pembeli = ?`,
      [id_pembeli],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Statistik keseluruhan untuk admin
const getAdminStats = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'pembeli') AS jumlah_pembeli,
        (SELECT COUNT(*) FROM produk) AS jumlah_produk,
        (SELECT COUNT(*) FROM artikel) AS jumlah_artikel,
        (SELECT COUNT(*) FROM pembelian) AS jumlah_transaksi,
        (SELECT COUNT(*) FROM pembelian) AS produk_terjual,
        (SELECT COALESCE(SUM(CASE WHEN status IN ('Menunggu', 'Diterima') THEN 1 ELSE 0 END), 0) FROM pembelian) AS pesanan_aktif,
        (SELECT COALESCE(SUM(CASE WHEN status_bayar = 'Belum_dibayar' THEN 1 ELSE 0 END), 0) FROM pembelian) AS belum_dibayar,
        (SELECT COALESCE(SUM(
            CASE WHEN status_bayar = 'Dibayar'
              THEN COALESCE((SELECT pr.harga * COALESCE(pembelian.qty, 1) FROM produk pr WHERE pr.id_produk = pembelian.id_produk), 0)
              ELSE 0 END
          ), 0) FROM pembelian) AS total_pendapatan
    `;
    db.query(sql, (err, rows) => {
      if (err) return reject(err);
      const row = rows[0] || {};
      const toNum = (v) => (v == null ? 0 : Number(v) || 0);
      resolve({
        jumlah_pembeli: toNum(row.jumlah_pembeli),
        jumlah_produk: toNum(row.jumlah_produk),
        jumlah_artikel: toNum(row.jumlah_artikel),
        jumlah_transaksi: toNum(row.jumlah_transaksi),
        produk_terjual: toNum(row.produk_terjual),
        pesanan_aktif: toNum(row.pesanan_aktif),
        belum_dibayar: toNum(row.belum_dibayar),
        total_pendapatan: toNum(row.total_pendapatan),
      });
    });
  });
};

// Ambil beberapa pembelian terbaru (untuk dashboard admin)
const getRecentPembelian = (limit = 5) => {
  const lim = Math.max(1, Math.min(50, parseInt(limit, 10) || 5));
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT ${SELECT_ALIAS},
              u.nama_d AS pembeli_nama_d, u.nama_b AS pembeli_nama_b,
              pr.nama_produk, pr.harga AS produk_harga
       FROM pembelian p
       LEFT JOIN users u ON p.id_pembeli = u.id
       LEFT JOIN produk pr ON p.id_produk = pr.id_produk
       ORDER BY p.created_at DESC
       LIMIT ${lim}`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
};

module.exports = {
  findAllPembelianWithDetail,
  findPembelianById,
  updatePembelian,
  deletePembelian,
  insertPembelian,
  updatePembelianByPembeli,
  findPembelianByPembeliIdWithDetail,
  findPembelianByIdAndPembeliId,
  getStatsByPembeliId,
  getAdminStats,
  getRecentPembelian,
};
