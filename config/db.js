// backend/config/db.js
require('dotenv').config();

const dns = require('dns');
// Fix untuk Windows: Node kadang salah pilih hasil DNS (IPv6 yang tidak
// bisa dijangkau) padahal IPv4-nya jalan. Paksa IPv4 diutamakan supaya
// koneksi ke *.pooler.supabase.com tidak ENOTFOUND.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL tidak ditemukan di .env');
}

// Supabase (dan kebanyakan Postgres hosting) wajib pakai SSL.
// rejectUnauthorized: false dipakai karena Supabase pakai sertifikat yang
// tidak selalu ada di root CA bawaan Node — aman untuk koneksi via
// connection pooler mereka.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('❌ Postgres pool error:', err.message);
});

// Tes koneksi saat server start
pool
  .query('SELECT NOW()')
  .then(() => {
    console.log('✅ Postgres (Supabase) connected');
  })
  .catch((err) => {
    console.error('❌ Gagal konek ke Postgres/Supabase:', err.message);
    console.error('   Cek: DATABASE_URL di .env sudah benar? Password sudah di-encode? Project Supabase aktif?');
  });

// --------------------------------------------------------------------------
// Shim supaya model-model yang lama (ditulis untuk mysql2, pakai placeholder
// "?" dan callback (err, rows/result)) tetap jalan tanpa diubah satu per satu.
// --------------------------------------------------------------------------

// Tabel yang primary key-nya BUKAN "id"
const CUSTOM_PK = {
  produk: 'id_produk',
};

function toPgQuery(sql) {
  // Ganti setiap "?" jadi $1, $2, $3, ... sesuai urutan
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function getInsertTable(sql) {
  const match = sql.match(/insert\s+into\s+["`]?(\w+)["`]?/i);
  return match ? match[1].toLowerCase() : null;
}

function getQueryType(sql) {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  return 'SELECT';
}

/**
 * db.query(sql, [params], callback)
 * Meniru API mysql2: callback(err, rowsOrResult)
 *  - SELECT      -> rowsOrResult = array of rows
 *  - INSERT      -> rowsOrResult = { insertId, affectedRows }
 *  - UPDATE/DELETE -> rowsOrResult = { affectedRows }
 */
function query(sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  params = params || [];

  const type = getQueryType(sql);
  let finalSql = sql;

  if (type === 'INSERT' && !/returning/i.test(sql)) {
    const table = getInsertTable(sql);
    const pk = (table && CUSTOM_PK[table]) || 'id';
    finalSql = `${sql} RETURNING ${pk}`;
  }

  const pgSql = toPgQuery(finalSql);

  pool.query(pgSql, params, (err, result) => {
    if (err) {
      if (typeof callback === 'function') return callback(err);
      return;
    }

    if (typeof callback !== 'function') return;

    if (type === 'SELECT') {
      return callback(null, result.rows);
    }
    if (type === 'INSERT') {
      const table = getInsertTable(sql);
      const pk = (table && CUSTOM_PK[table]) || 'id';
      const insertId = result.rows[0] ? result.rows[0][pk] : undefined;
      return callback(null, { insertId, affectedRows: result.rowCount });
    }
    // UPDATE / DELETE
    return callback(null, { affectedRows: result.rowCount });
  });
}

module.exports = { query, pool };
