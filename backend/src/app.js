const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.get("/", (req, res, next) => {
  const indexPath = path.join(__dirname, "../../frontend/index.html");
  res.sendFile(indexPath, (error) => {
    if (error) {
      next();
    }
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Image must be 2MB or smaller."
      : error.message;

    return res.status(400).json({
      success: false,
      message
    });
  }

  return next(error);
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
