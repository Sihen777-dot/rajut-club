// backend/controllers/adminController.js
// CRUD produk + kelola user (role pembeli) + CRUD artikel + statistik & kelola pembelian + profil admin

const bcrypt = require("bcrypt");
const produkModel = require("../models/produkModel");
const usersModel = require("../models/usersModel");
const artikelModel = require("../models/artikelModel");
const pembelianModel = require("../models/pembelianModel");

// Kategori sesuai ENUM kolom produk.kategori di database
const KATEGORI_VALID = ["Makanan Utama", "Minuman", "Menu Pendamping"];

// ===================== CRUD PRODUK =====================

const listProduk = async (req, res) => {
  try {
    const produk = await produkModel.findAllProduk();
    return res.status(200).json({ produk });
  } catch (error) {
    console.error("Error listProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getProdukById = async (req, res) => {
  try {
    const { id } = req.params;
    const produk = await produkModel.findProdukById(id);

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    return res.status(200).json({ produk });
  } catch (error) {
    console.error("Error getProdukById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const createProduk = async (req, res) => {
  try {
    const { nama_produk, deskripsi, harga, gambar, kategori } = req.body;

    if (!nama_produk || !deskripsi || !harga || !kategori) {
      return res.status(400).json({ message: "Field wajib belum lengkap" });
    }

    if (!KATEGORI_VALID.includes(kategori)) {
      return res.status(400).json({
        message: `Kategori tidak valid. Pilihan: ${KATEGORI_VALID.join(", ")}`,
      });
    }

    const insertId = await produkModel.insertProduk({
      nama_produk,
      deskripsi,
      harga,
      gambar: gambar || null,
      kategori,
    });

    const produkBaru = await produkModel.findProdukById(insertId);

    return res.status(201).json({ message: "Produk berhasil ditambahkan", produk: produkBaru });
  } catch (error) {
    console.error("Error createProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updateProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_produk, deskripsi, harga, gambar, kategori } = req.body;

    const existing = await produkModel.findProdukById(id);
    if (!existing) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    if (kategori && !KATEGORI_VALID.includes(kategori)) {
      return res.status(400).json({
        message: `Kategori tidak valid. Pilihan: ${KATEGORI_VALID.join(", ")}`,
      });
    }

    await produkModel.updateProduk(id, {
      nama_produk: nama_produk ?? existing.nama_produk,
      deskripsi: deskripsi ?? existing.deskripsi,
      harga: harga ?? existing.harga,
      gambar: gambar ?? existing.gambar,
      kategori: kategori ?? existing.kategori,
    });

    const produkUpdated = await produkModel.findProdukById(id);

    return res.status(200).json({ message: "Produk berhasil diperbarui", produk: produkUpdated });
  } catch (error) {
    console.error("Error updateProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deleteProduk = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await produkModel.findProdukById(id);
    if (!existing) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    await produkModel.deleteProduk(id);

    return res.status(200).json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Error deleteProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== KELOLA PEMBELI =====================

const listPembeli = async (req, res) => {
  try {
    const pembeli = await usersModel.findAllUsersByRole("pembeli");
    return res.status(200).json({ pembeli });
  } catch (error) {
    console.error("Error listPembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getPembeliById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersModel.findUserById(id);

    if (!user || user.role !== "pembeli") {
      return res.status(404).json({ message: "Pembeli tidak ditemukan" });
    }

    return res.status(200).json({ pembeli: user });
  } catch (error) {
    console.error("Error getPembeliById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const createPembeli = async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const {
      nama_d,
      nama_b,
      kelamin,
      lahir,
      alamat,
      phone,
      email,
      uname,
      passwd,
      foto,
    } = req.body;

    if (
      !nama_d || !nama_b || !kelamin || !lahir || !alamat ||
      !phone || !email || !uname || !passwd
    ) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const existingEmail = await usersModel.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // Cek username juga (sebelumnya hanya cek email)
    const existingUname = await usersModel.findUserByCredential(uname);
    if (existingUname) {
      return res.status(409).json({ message: "Username sudah dipakai" });
    }

    const hashedPasswd = await bcrypt.hash(passwd, 10);

    const insertId = await usersModel.createUser({
      nama_d,
      nama_b,
      kelamin,
      lahir,
      alamat,
      phone,
      email,
      role: "pembeli",
      uname,
      passwd: hashedPasswd,
      foto: foto || "default.png",
    });

    const pembeliBaru = await usersModel.findUserById(insertId);

    return res.status(201).json({ message: "Pembeli berhasil ditambahkan", pembeli: pembeliBaru });
  } catch (error) {
    console.error("Error createPembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updatePembeli = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await usersModel.findUserById(id);

    if (!existing || existing.role !== "pembeli") {
      return res.status(404).json({ message: "Pembeli tidak ditemukan" });
    }

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
    } = req.body;

    // Cek email/username tidak bentrok dengan user lain
    if (email && email !== existing.email) {
      const emailTaken = await usersModel.findUserByEmail(email);
      if (emailTaken) {
        return res.status(409).json({ message: "Email sudah dipakai user lain" });
      }
    }
    if (uname && uname !== existing.uname) {
      const unameTaken = await usersModel.findUserByCredential(uname);
      if (unameTaken) {
        return res.status(409).json({ message: "Username sudah dipakai user lain" });
      }
    }

    await usersModel.updateUserProfile(id, {
      nama_d: nama_d ?? existing.nama_d,
      nama_b: nama_b ?? existing.nama_b,
      kelamin: kelamin ?? existing.kelamin,
      lahir: lahir ?? existing.lahir,
      alamat: alamat ?? existing.alamat,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      uname: uname ?? existing.uname,
      foto: foto ?? existing.foto,
    });

    const pembeliUpdated = await usersModel.findUserById(id);

    return res.status(200).json({ message: "Pembeli berhasil diperbarui", pembeli: pembeliUpdated });
  } catch (error) {
    console.error("Error updatePembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deletePembeli = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await usersModel.findUserById(id);

    if (!existing || existing.role !== "pembeli") {
      return res.status(404).json({ message: "Pembeli tidak ditemukan" });
    }

    await usersModel.deleteUser(id);

    return res.status(200).json({ message: "Pembeli berhasil dihapus" });
  } catch (error) {
    console.error("Error deletePembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== CRUD ARTIKEL =====================

const listArtikel = async (req, res) => {
  try {
    const artikel = await artikelModel.findAllArtikel();
    return res.status(200).json({ artikel });
  } catch (error) {
    console.error("Error listArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getArtikelById = async (req, res) => {
  try {
    const { id } = req.params;
    const artikel = await artikelModel.findArtikelById(id);

    if (!artikel) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    return res.status(200).json({ artikel });
  } catch (error) {
    console.error("Error getArtikelById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const createArtikel = async (req, res) => {
  try {
    const { judul, ringkasan, isi, gambar } = req.body;

    if (!judul || !ringkasan || !isi || !gambar) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const insertId = await artikelModel.insertArtikel({ judul, ringkasan, isi, gambar });
    const artikelBaru = await artikelModel.findArtikelById(insertId);

    return res.status(201).json({ message: "Artikel berhasil ditambahkan", artikel: artikelBaru });
  } catch (error) {
    console.error("Error createArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updateArtikel = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await artikelModel.findArtikelById(id);

    if (!existing) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    const { judul, ringkasan, isi, gambar } = req.body;

    await artikelModel.updateArtikel(id, {
      judul: judul ?? existing.judul,
      ringkasan: ringkasan ?? existing.ringkasan,
      isi: isi ?? existing.isi,
      gambar: gambar ?? existing.gambar,
    });

    const artikelUpdated = await artikelModel.findArtikelById(id);

    return res.status(200).json({ message: "Artikel berhasil diperbarui", artikel: artikelUpdated });
  } catch (error) {
    console.error("Error updateArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deleteArtikel = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await artikelModel.findArtikelById(id);

    if (!existing) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    await artikelModel.deleteArtikel(id);

    return res.status(200).json({ message: "Artikel berhasil dihapus" });
  } catch (error) {
    console.error("Error deleteArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== STATISTIK DASHBOARD =====================

const getStats = async (req, res) => {
  try {
    const stats = await pembelianModel.getAdminStats();
    const recent = await pembelianModel.getRecentPembelian(5);

    // Normalisasi transaksi terbaru untuk frontend
    const transaksi_terbaru = (recent || []).map((row) => ({
      id: row.id,
      nama_pembeli:
        row.nama_pembeli ||
        [row.pembeli_nama_d, row.pembeli_nama_b].filter(Boolean).join(" ") ||
        "—",
      nama_produk: row.nama_produk || "—",
      status: row.status || "—",
      pembayaran: row.pembayaran || "—",
      created_at: row.created_at,
      total: row.produk_harga || row.harga || 0,
    }));

    // Response datar + nested — frontend bisa baca keduanya
    return res.status(200).json({
      message: "OK",
      ...stats,
      transaksi_terbaru,
      stats: {
        ...stats,
        transaksi_terbaru,
      },
      recent: transaksi_terbaru,
    });
  } catch (error) {
    console.error("Error getStats:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

// ===================== KELOLA PEMBELIAN =====================

const listPembelian = async (req, res) => {
  try {
    const pembelian = await pembelianModel.findAllPembelianWithDetail();
    return res.status(200).json({ pembelian });
  } catch (error) {
    console.error("Error listPembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getPembelianById = async (req, res) => {
  try {
    const { id } = req.params;
    const pembelian = await pembelianModel.findPembelianById(id);

    if (!pembelian) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

    return res.status(200).json({ pembelian });
  } catch (error) {
    console.error("Error getPembelianById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updatePembelian = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pembelianModel.findPembelianById(id);

    if (!existing) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

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
    } = req.body;

    // Validasi ENUM agar tidak merusak data di database
    const METODE_VALID = ["cash", "qris", "bayar_ditempat", "transfer_bank"];
    const PENGIRIMAN_VALID = ["delivery", "Gojek", "take_away"];
    const PEMBAYARAN_VALID = ["Belum_dibayar", "Dibayar"];
    const STATUS_VALID = ["Menunggu", "Diterima", "Selesai", "Dibatalkan"];

    if (metode_pembayaran && !METODE_VALID.includes(metode_pembayaran)) {
      return res.status(400).json({ message: `Metode pembayaran tidak valid. Pilihan: ${METODE_VALID.join(", ")}` });
    }
    if (pengiriman && !PENGIRIMAN_VALID.includes(pengiriman)) {
      return res.status(400).json({ message: `Pengiriman tidak valid. Pilihan: ${PENGIRIMAN_VALID.join(", ")}` });
    }
    if (pembayaran && !PEMBAYARAN_VALID.includes(pembayaran)) {
      return res.status(400).json({ message: `Status pembayaran tidak valid. Pilihan: ${PEMBAYARAN_VALID.join(", ")}` });
    }
    if (status && !STATUS_VALID.includes(status)) {
      return res.status(400).json({ message: `Status tidak valid. Pilihan: ${STATUS_VALID.join(", ")}` });
    }

    await pembelianModel.updatePembelian(id, {
      nama_pembeli: nama_pembeli ?? existing.nama_pembeli,
      alamat_pembeli: alamat_pembeli ?? existing.alamat_pembeli,
      phone_pembeli: phone_pembeli ?? existing.phone_pembeli,
      metode_pembayaran: metode_pembayaran ?? existing.metode_pembayaran,
      pembayaran: pembayaran ?? existing.pembayaran,
      pengiriman: pengiriman ?? existing.pengiriman,
      status: status ?? existing.status,
      catatan: catatan ?? existing.catatan,
      foto_bukti: foto_bukti ?? existing.foto_bukti,
    });

    const pembelianUpdated = await pembelianModel.findPembelianById(id);

    return res.status(200).json({ message: "Pembelian berhasil diperbarui", pembelian: pembelianUpdated });
  } catch (error) {
    console.error("Error updatePembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deletePembelian = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pembelianModel.findPembelianById(id);

    if (!existing) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

    await pembelianModel.deletePembelian(id);

    return res.status(200).json({ message: "Pembelian berhasil dihapus" });
  } catch (error) {
    console.error("Error deletePembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== PROFIL ADMIN =====================

// GET profil admin yang sedang login (req.user berasal dari middleware authenticate)
const getMyProfile = async (req, res) => {
  try {
    const admin = await usersModel.findUserById(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    // kirim sebagai "admin" dan "user" agar normalize frontend fleksibel
    return res.status(200).json({ user: admin });
  } catch (error) {
    console.error("Error getMyProfile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// PUT update profil admin yang sedang login
const updateMyProfile = async (req, res) => {
  try {
    const existing = await usersModel.findUserById(req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

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
      passwd_lama,
      passwd_baru,
    } = req.body;

    // Cek email/username tidak bentrok dengan user lain
    if (email && email !== existing.email) {
      const emailTaken = await usersModel.findUserByEmail(email);
      if (emailTaken) {
        return res.status(409).json({ message: "Email sudah dipakai user lain" });
      }
    }
    if (uname && uname !== existing.uname) {
      const unameTaken = await usersModel.findUserByCredential(uname);
      if (unameTaken) {
        return res.status(409).json({ message: "Username sudah dipakai user lain" });
      }
    }

    // Opsional ganti password
    if (passwd_baru) {
      if (!passwd_lama) {
        return res.status(400).json({ message: "Password lama wajib diisi untuk ganti password" });
      }
      const passwdHash = await usersModel.findPasswdHashById(req.user.id);
      const isMatch = await bcrypt.compare(passwd_lama, passwdHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Password lama salah" });
      }
      const hashedPasswdBaru = await bcrypt.hash(passwd_baru, 10);
      await usersModel.updatePasswd(req.user.id, hashedPasswdBaru);
    }

    await usersModel.updateUserProfile(req.user.id, {
      nama_d: nama_d ?? existing.nama_d,
      nama_b: nama_b ?? existing.nama_b,
      kelamin: kelamin ?? existing.kelamin,
      lahir: lahir ?? existing.lahir,
      alamat: alamat ?? existing.alamat,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      uname: uname ?? existing.uname,
      foto: foto ?? existing.foto,
    });

    const updated = await usersModel.findUserById(req.user.id);

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      user: updated,
    });
  } catch (error) {
    console.error("Error updateMyProfile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

module.exports = {
  listProduk,
  getProdukById,
  createProduk,
  updateProduk,
  deleteProduk,
  listPembeli,
  getPembeliById,
  createPembeli,
  updatePembeli,
  deletePembeli,
  listArtikel,
  getArtikelById,
  createArtikel,
  updateArtikel,
  deleteArtikel,
  getStats,
  listPembelian,
  getPembelianById,
  updatePembelian,
  deletePembelian,
  getMyProfile,
  updateMyProfile,
};
