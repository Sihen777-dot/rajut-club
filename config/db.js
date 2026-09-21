// backend/config/db.js
// Versi PostgreSQL (Supabase) — kompatibel dengan style mysql2

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // wajib untuk Supabase
  },
});

// Tes koneksi saat server start
pool
  .query("SELECT NOW()")
  .then(() => console.log("✅ PostgreSQL (Supabase) connected"))
  .catch((err) => {
    console.error("❌ Gagal konek ke Supabase:", err.message);
    console.error("   Cek DATABASE_URL di file .env");
  });

/**
 * Wrapper mirip mysql2
 * - Otomatis ubah ? menjadi $1, $2, $3 ...
 * - Hasil SELECT → array rows
 * - Hasil INSERT/UPDATE/DELETE → object mirip mysql2 (insertId, affectedRows)
 */
function query(sql, params, callback) {
  // Support pemanggilan: query(sql, callback) tanpa params
  if (typeof params === "function") {
    callback = params;
    params = [];
  }
  if (!params) params = [];

  // Ganti ? menjadi $1, $2, ...
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);

  pool
    .query(pgSql, params)
    .then((result) => {
      const isSelect = /^\s*SELECT/i.test(sql);
      const isInsert = /^\s*INSERT/i.test(sql);

      let response;

      if (isSelect) {
        // SELECT → kembalikan array rows (seperti mysql2)
        response = result.rows;
      } else {
        // INSERT / UPDATE / DELETE → object mirip mysql2
        response = {
          rows: result.rows,
          rowCount: result.rowCount,
          affectedRows: result.rowCount,
          // insertId dari RETURNING (kalau ada)
          insertId:
            result.rows[0]?.id ??
            result.rows[0]?.id_produk ??
            result.rows[0]?.id_artikel ??
            null,
        };
      }

      if (callback) callback(null, response);
    })
    .catch((err) => {
      console.error("DB Error:", err.message);
      if (callback) callback(err);
    });
}

module.exports = {
  query,
  pool,
};
