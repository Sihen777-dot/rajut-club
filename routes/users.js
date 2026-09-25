// backend/routes/users.js
// Route untuk registrasi, login, akses publik produk/artikel, dan fitur khusus role pembeli

const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const { authenticate, requireRole, middlewareUploadGambar, sendHasilUpload } = require("../middlewares");

// POST /api/users/register → registrasi user/admin
router.post("/register", usersController.registerUser);

// POST /api/users/login → login user
router.post("/login", usersController.loginUser);

// GET /api/users/produk → daftar produk (tanpa login)
router.get("/produk", usersController.listProduk);

// GET /api/users/produk/:id_produk → detail produk (tanpa login)
router.get("/produk/:id_produk", usersController.getProdukById);

// GET /api/users/artikel → daftar artikel (tanpa login)
router.get("/artikel", usersController.listArtikelPublik);

// GET /api/users/artikel/:id → detail artikel (tanpa login)
router.get("/artikel/:id", usersController.getArtikelPublikById);

// GET /api/users/me → profil sendiri (wajib login + role pembeli)
router.get("/me", authenticate, requireRole("pembeli"), usersController.getMyProfile);

// PUT /api/users/me → update profil sendiri (wajib login + role pembeli)
router.put("/me", authenticate, requireRole("pembeli"), usersController.updateMyProfile);

// POST /api/users/upload-gambar → upload foto profil (wajib login + role pembeli)
router.post(
  "/upload-gambar",
  authenticate,
  requireRole("pembeli"),
  middlewareUploadGambar,
  sendHasilUpload
);

// GET /api/users/dashboard → statistik pembelian milik sendiri (wajib login + role pembeli)
router.get("/dashboard", authenticate, requireRole("pembeli"), usersController.getDashboard);

// POST /api/users/pembelian → buat pembelian baru (wajib login + role pembeli)
router.post("/pembelian", authenticate, requireRole("pembeli"), usersController.createPembelian);

// GET /api/users/pembelian → daftar pembelian milik sendiri (wajib login + role pembeli)
router.get("/pembelian", authenticate, requireRole("pembeli"), usersController.listMyPembelian);

// GET /api/users/pembelian/:id → detail pembelian milik sendiri (wajib login + role pembeli)
router.get("/pembelian/:id", authenticate, requireRole("pembeli"), usersController.getMyPembelianById);

// PUT /api/users/pembelian/:id → bayar / konfirmasi diterima
router.put("/pembelian/:id", authenticate, requireRole("pembeli"), usersController.updateMyPembelian);

// POST /api/users/pembelian/:id/bukti → upload bukti pembayaran (wajib login + role pembeli)
// Form-data field: "gambar" (jpeg/png/webp, max 5MB)
router.post(
  "/pembelian/:id/bukti",
  authenticate,
  requireRole("pembeli"),
  middlewareUploadGambar,
  usersController.uploadBuktiPembayaran
);

module.exports = router;