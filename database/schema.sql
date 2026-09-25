-- backend/database/schema.sql
-- Skema PostgreSQL untuk Supabase, hasil konversi dari struktur MySQL
-- (rajut_club_db) yang dipakai kode di models/*.js
--
-- CARA PAKAI:
-- 1. Buka project Supabase → SQL Editor
-- 2. Paste seluruh isi file ini → Run
-- (Lewati langkah ini kalau tabel-tabel ini sudah ada di Supabase Anda)

-- Trigger generik untuk auto-update kolom updated_at setiap kali UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================== users ===========================
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  nama_d      VARCHAR(100) NOT NULL,
  nama_b      VARCHAR(100) NOT NULL,
  kelamin     VARCHAR(20)  NOT NULL,
  lahir       DATE         NOT NULL,
  alamat      TEXT         NOT NULL,
  phone       VARCHAR(30)  NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  role        VARCHAR(20)  NOT NULL DEFAULT 'pembeli' CHECK (role IN ('admin', 'pembeli')),
  uname       VARCHAR(100) NOT NULL UNIQUE,
  passwd      TEXT         NOT NULL,
  foto        VARCHAR(255) DEFAULT 'default.png',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================== produk ===========================
CREATE TABLE IF NOT EXISTS produk (
  id_produk   SERIAL PRIMARY KEY,
  nama_produk VARCHAR(150) NOT NULL,
  deskripsi   TEXT         NOT NULL,
  harga       NUMERIC(12,2) NOT NULL,
  gambar      VARCHAR(255),
  kategori    VARCHAR(30)  NOT NULL CHECK (kategori IN ('Pakaian', 'Aksesoris', 'Tas & Mainan')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_produk_updated_at ON produk;
CREATE TRIGGER trg_produk_updated_at
  BEFORE UPDATE ON produk
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================== artikel ===========================
CREATE TABLE IF NOT EXISTS artikel (
  id          SERIAL PRIMARY KEY,
  judul       VARCHAR(200) NOT NULL,
  ringkasan   TEXT         NOT NULL,
  isi         TEXT         NOT NULL,
  gambar      VARCHAR(255),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_artikel_updated_at ON artikel;
CREATE TRIGGER trg_artikel_updated_at
  BEFORE UPDATE ON artikel
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================== pembelian ===========================
CREATE TABLE IF NOT EXISTS pembelian (
  id            SERIAL PRIMARY KEY,
  id_pembeli    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id_produk     INTEGER NOT NULL REFERENCES produk(id_produk) ON DELETE CASCADE,
  nama_penerima VARCHAR(150) NOT NULL DEFAULT '',
  alamat_kirim  TEXT         NOT NULL DEFAULT '',
  no_hp         BIGINT       NOT NULL DEFAULT 0,
  metode_bayar  VARCHAR(30)  NOT NULL DEFAULT 'cash'
                CHECK (metode_bayar IN ('cash', 'transfer_bank', 'qris', 'bayar_ditempat')),
  status_bayar  VARCHAR(30)  NOT NULL DEFAULT 'Belum_dibayar'
                CHECK (status_bayar IN ('Belum_dibayar', 'Dibayar')),
  shipping      VARCHAR(30)  NOT NULL DEFAULT 'delivery'
                CHECK (shipping IN ('delivery', 'Gojek', 'take_away')),
  status        VARCHAR(30)  NOT NULL DEFAULT 'Menunggu'
                CHECK (status IN ('Menunggu', 'Diterima', 'Selesai', 'Dibatalkan')),
  catatan       TEXT,
  bukti_bayar   VARCHAR(255),
  qty           INTEGER      NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_pembelian_updated_at ON pembelian;
CREATE TRIGGER trg_pembelian_updated_at
  BEFORE UPDATE ON pembelian
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_pembelian_id_pembeli ON pembelian(id_pembeli);
CREATE INDEX IF NOT EXISTS idx_pembelian_id_produk ON pembelian(id_produk);
