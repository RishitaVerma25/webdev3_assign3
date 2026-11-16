const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getLowStockReport,
  getCategorySummary,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct
} = require('../controllers/productController');

// Routes mounted at /api/products
router.route('/')
  .post(createProduct)
  .get(getProducts);

// Specific report/aggregation endpoints must come before :id
router.get('/low-stock', getLowStockReport);
router.get('/summary', getCategorySummary);

// Parameterized product routes
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// Stock adjustment endpoint
router.patch('/:id/stock', updateStock);

module.exports = router;
