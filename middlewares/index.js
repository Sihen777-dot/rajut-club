// backend/middlewares/index.js
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa" });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    next();
  };
};

const uploadDir = path.join(__dirname, "..", "uploads", "images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Format gambar tidak didukung (hanya jpeg, png, webp)"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

/** Terima field: gambar | foto | file | image */
const middlewareUploadGambar = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

const sendHasilUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Tidak ada file yang diupload. Field: gambar / foto" });
  }

  const filePath = `/uploads/images/${req.file.filename}`;

  return res.status(200).json({
    message: "Upload berhasil",
    path: filePath,
    filename: req.file.filename,
    gambar: filePath,
    foto: filePath,
  });
};

module.exports = {
  authenticate,
  requireRole,
  middlewareUploadGambar,
  sendHasilUpload,
};
