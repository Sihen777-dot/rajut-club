require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("./config/db");

const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

const app = express();

const ROOT = path.join(__dirname, "..");
const FRONTEND_DIST = path.join(ROOT, "frontend", "dist");

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

app.get("/api/health", (req, res) => {
  res.json({ message: "Rajut Club API ok", status: "ok" });
});

// Frontend React (hasil build)
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));

  // SPA fallback — tanpa "*" (aman untuk Express 5)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    const indexFile = path.join(FRONTEND_DIST, "index.html");
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }
    return res.status(404).send("index.html tidak ditemukan di frontend/dist");
  });
} else {
  app.get("/", (req, res) => {
    res.status(503).send(`
      <h2>Frontend belum di-build</h2>
      <pre>
cd frontend
npm install
npm run build
      </pre>
      <p>Lalu restart: npm run dev</p>
    `);
  });
}

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: err.message || "Terjadi kesalahan server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server: http://localhost:" + PORT);
  if (!fs.existsSync(FRONTEND_DIST)) {
    console.log("WARNING: cd frontend && npm run build dulu");
  }
});