const express = require('express');
const productRoutes = require('./routes/productRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Assignment 3: Inventory and Data Management System API',
    endpoints: {
      getAllProducts: 'GET /api/products',
      createProduct: 'POST /api/products',
      getProductById: 'GET /api/products/:id',
      updateProduct: 'PUT /api/products/:id',
      updateStock: 'PATCH /api/products/:id/stock',
      deleteProduct: 'DELETE /api/products/:id',
      lowStockReport: 'GET /api/products/low-stock',
      categorySummary: 'GET /api/products/summary'
    }
  });
});

// API Routes
app.use('/api/products', productRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
