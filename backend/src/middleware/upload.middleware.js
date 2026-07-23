const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "image";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }

  const error = new Error("Invalid image type. Only JPG, PNG, and WEBP images are allowed.");
  error.status = 400;
  return cb(error);
};

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
});
