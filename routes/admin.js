// backend/routes/admin.js
// Semua route admin, wajib login + role admin

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, requireRole, middlewareUploadGambar, sendHasilUpload } = require("../middlewares");

// Terapkan authenticate + requireRole("admin") untuk SEMUA route di file ini
router.use(authenticate, requireRole("admin"));

// Profil admin
router.get("/me", adminController.getMyProfile);
router.put("/me", adminController.updateMyProfile);

// Statistik dashboard admin
router.get("/stats", adminController.getStats);

// Kelola pembeli
router.get("/pembeli", adminController.listPembeli);
router.get("/pembeli/:id", adminController.getPembeliById);
router.post("/pembeli", adminController.createPembeli);
router.put("/pembeli/:id", adminController.updatePembeli);
router.delete("/pembeli/:id", adminController.deletePembeli);

// CRUD produk
router.get("/produk", adminController.listProduk);
router.get("/produk/:id", adminController.getProdukById);
router.post("/produk", adminController.createProduk);
router.put("/produk/:id", adminController.updateProduk);
router.delete("/produk/:id", adminController.deleteProduk);

// Kelola pembelian (tanpa insert, insert dilakukan pembeli)
router.get("/pembelian", adminController.listPembelian);
router.get("/pembelian/:id", adminController.getPembelianById);
router.put("/pembelian/:id", adminController.updatePembelian);
router.delete("/pembelian/:id", adminController.deletePembelian);

// CRUD artikel
router.get("/artikel", adminController.listArtikel);
router.get("/artikel/:id", adminController.getArtikelById);
router.post("/artikel", adminController.createArtikel);
router.put("/artikel/:id", adminController.updateArtikel);
router.delete("/artikel/:id", adminController.deleteArtikel);

// Upload gambar: multer proses file dulu, lalu kirim response path-nya
router.post("/upload-gambar", middlewareUploadGambar, sendHasilUpload);

module.exports = router;