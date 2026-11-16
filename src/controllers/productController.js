const Product = require('../models/Product');

// @desc    Create a new product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, price, quantity, reorderLevel, supplier } = req.body;

    const product = await Product.create({
      name,
      sku,
      category,
      price,
      quantity,
      reorderLevel,
      supplier
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      supplier,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      order,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Filter by Category (case-insensitive)
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Search in product name or SKU
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by Supplier (case-insensitive substring)
    if (supplier) {
      query.supplier = { $regex: supplier, $options: 'i' };
    }

    // Filter by Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Filter by In-Stock availability
    if (inStock !== undefined) {
      if (inStock === 'true' || inStock === true) {
        query.quantity = { $gt: 0 };
      } else if (inStock === 'false' || inStock === false) {
        query.quantity = 0;
      }
    }

    // Sorting options
    let sortOptions = {};
    if (sortBy) {
      const sortDirection = order && order.toLowerCase() === 'desc' ? -1 : 1;
      sortOptions[sortBy] = sortDirection;
    } else if (sort) {
      // Handles mongoose style sort string, e.g. "-price" or "price"
      if (sort.startsWith('-')) {
        sortOptions[sort.substring(1)] = -1;
      } else {
        sortOptions[sort] = 1;
      }
    } else {
      sortOptions = { createdAt: 1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      total,
      page: pageNum,
      totalPages,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low-stock alert report (quantity <= reorderLevel)
// @route   GET /api/products/low-stock
// @access  Public
const getLowStockReport = async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    }).sort({ quantity: 1 });

    res.status(200).json({
      count: lowStockItems.length,
      lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category-wise inventory summary using MongoDB aggregation
// @route   GET /api/products/summary
// @access  Public
const getCategorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $project: {
          _id: 1,
          totalItems: 1,
          totalQuantity: 1,
          totalStockValue: 1,
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      },
      {
        $sort: { totalStockValue: -1 }
      }
    ]);

    res.status(200).json({
      categories: summary.length,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: 'after',
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Safe stock adjustment (increment/decrement)
// @route   PATCH /api/products/:id/stock
// @access  Public
const updateStock = async (req, res, next) => {
  try {
    const { change } = req.body;

    if (change === undefined || typeof change !== 'number' || isNaN(change)) {
      return res.status(400).json({
        message: 'A valid numeric "change" value is required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedQuantity = product.quantity + change;

    if (updatedQuantity < 0) {
      return res.status(400).json({
        message: `Insufficient stock. Current quantity is ${product.quantity}, cannot reduce by ${Math.abs(change)}.`
      });
    }

    product.quantity = updatedQuantity;
    await product.save();

    res.status(200).json({
      message: 'Stock updated',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      message: 'Product deleted',
      id: product._id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockReport,
  getCategorySummary,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct
};
