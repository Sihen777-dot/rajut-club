// backend/server.js — API + static portfolio + toko (satu domain)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("./config/db");

const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

const app = express();

// root project = parent of backend/
const ROOT = path.join(__dirname, "..");
const TOKO_DIST = path.join(ROOT, "toko-src", "dist");
const TOKO_DIST_ALT = path.join(ROOT, "toko");

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);

// Health check API
app.get("/api/health", (req, res) => {
  res.json({ message: "Rajut Club API ok", status: "ok" });
});

// Serve built toko (React) at /toko
const tokoPath = fs.existsSync(TOKO_DIST) ? TOKO_DIST : TOKO_DIST_ALT;
if (fs.existsSync(tokoPath)) {
  app.use("/toko", express.static(tokoPath));
  app.get("/toko/*", (req, res) => {
    res.sendFile(path.join(tokoPath, "index.html"));
  });
} else {
  app.get("/toko", (req, res) => {
    res.status(503).send(
      "<h2>Toko belum di-build</h2><p>Jalankan: <code>cd toko-src && npm install && npm run build</code></p>"
    );
  });
}

// Portfolio + CV di root folder
app.use(express.static(ROOT));

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error middleware:", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Ukuran file maksimal 5MB" });
  }
  if (err.message && /jpeg|png|webp|gambar|upload|file|Format/i.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: err.message || "Terjadi kesalahan server" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on https://rajut.mahpawon.my.id:${PORT}`);
});