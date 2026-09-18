// backend/controllers/usersController.js
// Controller untuk registrasi, login, kelola profil, akses publik produk/artikel, dan pembelian milik sendiri

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usersModel = require("../models/usersModel");
const produkModel = require("../models/produkModel");
const artikelModel = require("../models/artikelModel");
const pembelianModel = require("../models/pembelianModel");

// Nilai ENUM sesuai kolom pembelian di database (schema-latihan-toko.sql)
const METODE_PEMBAYARAN_VALID = ["cash", "qris", "bayar_ditempat", "transfer_bank"];
const PENGIRIMAN_VALID = ["delivery", "Gojek", "take_away"];

// Registrasi user baru
const registerUser = async (req, res) => {
  try {
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
    } = req.body;

    // Validasi field wajib
    if (
      !nama_d || !nama_b || !kelamin || !lahir || !alamat ||
      !phone || !email || !uname || !passwd
    ) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Keamanan: public register HANYA boleh role "pembeli".
    // Admin harus dibuat manual di database atau lewat panel admin.
    if (role && role !== "pembeli") {
      return res.status(403).json({ message: "Tidak diizinkan mendaftar sebagai admin" });
    }
    const finalRole = "pembeli";

    // Cek email sudah terdaftar
    const existingEmail = await usersModel.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // Cek uname sudah terdaftar
    const existingUname = await usersModel.findUserByCredential(uname);
    if (existingUname) {
      return res.status(409).json({ message: "Username sudah dipakai" });
    }

    // Hash password
    const hashedPasswd = await bcrypt.hash(passwd, 10);

    // Simpan user baru
    const insertId = await usersModel.createUser({
      nama_d,
      nama_b,
      kelamin,
      lahir,
      alamat,
      phone,
      email,
      role: finalRole,
      uname,
      passwd: hashedPasswd,
      foto: foto || "default.png",
    });

    // Ambil data user baru tanpa passwd
    const newUser = await usersModel.findUserById(insertId);

    return res.status(201).json({
      message: "Registrasi berhasil",
      user: newUser,
    });
  } catch (error) {
    console.error("Error registerUser:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// Login user (pakai email ATAU uname)
const loginUser = async (req, res) => {
  try {
    const { credential, passwd } = req.body;

    if (!credential || !passwd) {
      return res.status(400).json({ message: "Credential dan password wajib diisi" });
    }

    // Cari user berdasarkan email/uname
    const user = await usersModel.findUserByCredential(credential);
    if (!user) {
      return res.status(401).json({ message: "Credential atau password salah" });
    }

    // Cocokkan password dengan hash di database
    const isMatch = await bcrypt.compare(passwd, user.passwd);
    if (!isMatch) {
      return res.status(401).json({ message: "Credential atau password salah" });
    }

    // Buat JWT, berlaku 1 hari
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Hilangkan passwd sebelum dikirim ke client
    const { passwd: _, ...userWithoutPasswd } = user;

    return res.status(200).json({
      message: "Login berhasil",
      token,
      user: userWithoutPasswd,
    });
  } catch (error) {
    console.error("Error loginUser:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET profil sendiri (req.user berasal dari middleware authenticate)
const getMyProfile = async (req, res) => {
  try {
    const user = await usersModel.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error getMyProfile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// PUT update profil sendiri (data diri + opsional ganti password)
const updateMyProfile = async (req, res) => {
  try {
    const existing = await usersModel.findUserById(req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "User tidak ditemukan" });
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

    // Kalau user mau ganti password, wajib isi passwd_lama dan cocok dengan hash tersimpan
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

    // Update data profil (selain password)
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

    const updatedUser = await usersModel.findUserById(req.user.id);

    return res.status(200).json({ message: "Profil berhasil diperbarui", user: updatedUser });
  } catch (error) {
    console.error("Error updateMyProfile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET semua produk (akses publik, tanpa login)
const listProduk = async (req, res) => {
  try {
    const produk = await produkModel.findAllProduk();
    return res.status(200).json({ produk });
  } catch (error) {
    console.error("Error listProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET satu produk berdasarkan id (akses publik, tanpa login)
const getProdukById = async (req, res) => {
  try {
    // Route memakai :id_produk, jadi harus ambil id_produk (bukan id)
    const { id_produk } = req.params;
    const produk = await produkModel.findProdukById(id_produk);

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    return res.status(200).json({ produk });
  } catch (error) {
    console.error("Error getProdukById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET semua artikel (akses publik, tanpa login)
const listArtikelPublik = async (req, res) => {
  try {
    const artikel = await artikelModel.findAllArtikel();
    return res.status(200).json({ artikel });
  } catch (error) {
    console.error("Error listArtikelPublik:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET satu artikel berdasarkan id (akses publik, tanpa login)
const getArtikelPublikById = async (req, res) => {
  try {
    const { id } = req.params;
    const artikel = await artikelModel.findArtikelById(id);

    if (!artikel) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    return res.status(200).json({ artikel });
  } catch (error) {
    console.error("Error getArtikelPublikById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET dashboard pembeli (statistik pembelian milik sendiri)
const getDashboard = async (req, res) => {
  try {
    const stats = await pembelianModel.getStatsByPembeliId(req.user.id);
    const toNum = (v) => (v == null ? 0 : Number(v) || 0);
    const flat = {
      total_pembelian: toNum(stats?.total_pembelian),
      total_menunggu: toNum(stats?.total_menunggu),
      total_diterima: toNum(stats?.total_diterima),
      total_selesai: toNum(stats?.total_selesai),
    };
    return res.status(200).json({ ...flat, stats: flat });
  } catch (error) {
    console.error("Error getDashboard:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// POST buat pembelian baru (id_pembeli diambil dari token, bukan dari body)
const createPembelian = async (req, res) => {
  try {
    const {
      id_produk,
      nama_pembeli,
      alamat_pembeli,
      phone_pembeli,
      metode_pembayaran,
      pengiriman,
      catatan,
      jumlah,
    } = req.body;

    if (!id_produk || !metode_pembayaran || !pengiriman) {
      return res.status(400).json({ message: "Field wajib belum lengkap" });
    }

    if (!METODE_PEMBAYARAN_VALID.includes(metode_pembayaran)) {
      return res.status(400).json({
        message: `Metode pembayaran tidak valid. Pilihan: ${METODE_PEMBAYARAN_VALID.join(", ")}`,
      });
    }

    if (!PENGIRIMAN_VALID.includes(pengiriman)) {
      return res.status(400).json({
        message: `Pengiriman tidak valid. Pilihan: ${PENGIRIMAN_VALID.join(", ")}`,
      });
    }

    const produk = await produkModel.findProdukById(id_produk);
    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const insertId = await pembelianModel.insertPembelian({
      id_pembeli: req.user.id, // dari JWT, bukan body
      id_produk,
      nama_pembeli: nama_pembeli || null,
      alamat_pembeli: alamat_pembeli || null,
      phone_pembeli: phone_pembeli || null,
      metode_pembayaran,
      pembayaran: "Belum_dibayar",
      pengiriman,
      status: "Menunggu",
      catatan: catatan || null,
      foto_bukti: null,
      jumlah: jumlah || 1,
    });

    const pembelianBaru = await pembelianModel.findPembelianById(insertId);

    return res.status(201).json({ message: "Pembelian berhasil dibuat", pembelian: pembelianBaru });
  } catch (error) {
    console.error("Error createPembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET semua pembelian milik sendiri
const listMyPembelian = async (req, res) => {
  try {
    const pembelian = await pembelianModel.findPembelianByPembeliIdWithDetail(req.user.id);
    return res.status(200).json({ pembelian });
  } catch (error) {
    console.error("Error listMyPembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// GET satu pembelian milik sendiri berdasarkan id
const getMyPembelianById = async (req, res) => {
  try {
    const { id } = req.params;
    const pembelian = await pembelianModel.findPembelianByIdAndPembeliId(id, req.user.id);

    if (!pembelian) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

    return res.status(200).json({ pembelian });
  } catch (error) {
    console.error("Error getMyPembelianById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// POST upload bukti pembayaran untuk pembelian milik sendiri
// Field form-data: "gambar" (file). Path disimpan ke kolom foto_bukti.
const uploadBuktiPembayaran = async (req, res) => {
  try {
    const { id } = req.params;

    // Pastikan pembelian milik user yang login
    const pembelian = await pembelianModel.findPembelianByIdAndPembeliId(id, req.user.id);
    if (!pembelian) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

    // File wajib ada (middleware multer sudah proses)
    if (!req.file) {
      return res.status(400).json({ message: "File bukti pembayaran wajib diupload (field: gambar)" });
    }

    const fotoPath = `/uploads/images/${req.file.filename}`;

    // Update hanya foto_bukti, data lain tetap sama
    await pembelianModel.updatePembelian(id, {
      nama_pembeli: pembelian.nama_pembeli,
      alamat_pembeli: pembelian.alamat_pembeli,
      phone_pembeli: pembelian.phone_pembeli,
      metode_pembayaran: pembelian.metode_pembayaran,
      pembayaran: pembelian.pembayaran, // admin yang mengubah status bayar setelah verifikasi
      pengiriman: pembelian.pengiriman,
      status: pembelian.status,
      catatan: pembelian.catatan,
      foto_bukti: fotoPath,
    });

    const updated = await pembelianModel.findPembelianByIdAndPembeliId(id, req.user.id);

    return res.status(200).json({
      message: "Bukti pembayaran berhasil diupload",
      pembelian: updated,
    });
  } catch (error) {
    console.error("Error uploadBuktiPembayaran:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};


// PUT update pesanan milik sendiri (bayar / konfirmasi diterima)
const updateMyPembelian = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pembelianModel.findPembelianByIdAndPembeliId(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    const { metode_pembayaran, pembayaran, status, foto_bukti, jumlah } = req.body;
    const payload = {};

    // Pembeli boleh bayar (cash/qris) → set Dibayar
    if (metode_pembayaran) {
      if (!METODE_PEMBAYARAN_VALID.includes(metode_pembayaran)) {
        return res.status(400).json({ message: "Metode pembayaran tidak valid" });
      }
      payload.metode_pembayaran = metode_pembayaran;
    }
    if (pembayaran) {
      if (!["Belum_dibayar", "Dibayar"].includes(pembayaran)) {
        return res.status(400).json({ message: "Status pembayaran tidak valid" });
      }
      payload.pembayaran = pembayaran;
    }
    // Pembeli boleh konfirmasi diterima jika sudah dibayar / sedang diproses
    if (status) {
      if (!["Menunggu", "Diterima", "Selesai"].includes(status)) {
        return res.status(400).json({ message: "Status tidak diizinkan untuk pembeli" });
      }
      payload.status = status;
    }
    if (foto_bukti != null) payload.foto_bukti = foto_bukti;
    if (jumlah != null) payload.jumlah = jumlah;

    await pembelianModel.updatePembelianByPembeli(id, req.user.id, payload);
    const updated = await pembelianModel.findPembelianByIdAndPembeliId(id, req.user.id);
    return res.status(200).json({ message: "Pesanan diperbarui", pembelian: updated });
  } catch (error) {
    console.error("Error updateMyPembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  listProduk,
  getProdukById,
  listArtikelPublik,
  getArtikelPublikById,
  getDashboard,
  createPembelian,
  listMyPembelian,
  getMyPembelianById,
  uploadBuktiPembayaran,
  updateMyPembelian,
};