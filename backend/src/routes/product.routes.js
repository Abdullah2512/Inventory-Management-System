const express = require("express");
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", productController.getProducts);
router.get("/categories", productController.getCategories);
router.get("/:id", productController.getProduct);
router.post("/", upload.single("image"), productController.createProduct);
router.put("/:id", upload.single("image"), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
