require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const connectDB = require('../config/db');

const products = [
  // 1. Furniture - matches assignment screenshot
  {
    name: 'Study Table',
    sku: 'FURN-TB-012',
    category: 'Furniture',
    price: 3999,
    quantity: 2,
    reorderLevel: 4,
    supplier: 'IKEA India'
  },
  // 2. Stationery - matches assignment screenshot
  {
    name: 'Gel Pen Pack of 15',
    sku: 'STNY-PN-713',
    category: 'Stationery',
    price: 120,
    quantity: 40,
    reorderLevel: 20,
    supplier: 'Cello Pens'
  },
  // 3. Electronics 1 - matches summary aggregations (avgPrice: 5635.5, stockValue: 343994)
  {
    name: 'Smart 4K Action Camera',
    sku: 'ELEC-CAM-101',
    category: 'Electronics',
    price: 8650,
    quantity: 9,
    reorderLevel: 5,
    supplier: 'Sony Corp'
  },
  // 4. Electronics 2 (low-stock)
  {
    name: 'Noise Cancelling Headphones',
    sku: 'ELEC-HP-202',
    category: 'Electronics',
    price: 7000,
    quantity: 3,
    reorderLevel: 5,
    supplier: 'Bose India'
  },
  // 5. Electronics 3 (low-stock)
  {
    name: 'Mechanical Gaming Keyboard',
    sku: 'ELEC-KB-303',
    category: 'Electronics',
    price: 4000,
    quantity: 2,
    reorderLevel: 5,
    supplier: 'Logitech'
  },
  // 6. Electronics 4
  {
    name: 'True Wireless Earbuds',
    sku: 'ELEC-EB-404',
    category: 'Electronics',
    price: 2892,
    quantity: 82,
    reorderLevel: 20,
    supplier: 'Boat Lifestyle'
  },
  // 7. Apparel 1 - matches summary aggregations (avgPrice: 1399, stockValue: 75522)
  {
    name: 'Casual Cotton T-Shirt',
    sku: 'APP-TSH-501',
    category: 'Apparel',
    price: 799,
    quantity: 67,
    reorderLevel: 25,
    supplier: 'Zara India'
  },
  // 8. Apparel 2 (low-stock)
  {
    name: 'Slim Fit Denim Jeans',
    sku: 'APP-JNS-502',
    category: 'Apparel',
    price: 1999,
    quantity: 11,
    reorderLevel: 15,
    supplier: "Levi's"
  },
  // 9. Furniture 2
  {
    name: 'Ergonomic Office Chair',
    sku: 'FURN-CHR-014',
    category: 'Furniture',
    price: 7499,
    quantity: 15,
    reorderLevel: 5,
    supplier: 'Featherlite'
  },
  // 10. Stationery 2
  {
    name: 'A4 Spiral Notebook 5-Pack',
    sku: 'STNY-NB-714',
    category: 'Stationery',
    price: 350,
    quantity: 50,
    reorderLevel: 15,
    supplier: 'Classmate'
  },
  // 11. Home & Kitchen
  {
    name: 'Insulated Stainless Steel Bottle',
    sku: 'HOME-BTL-801',
    category: 'Home & Kitchen',
    price: 899,
    quantity: 30,
    reorderLevel: 10,
    supplier: 'Milton'
  },
  // 12. Sports & Fitness
  {
    name: 'Anti-Slip Yoga Mat',
    sku: 'SPRT-YGA-901',
    category: 'Sports & Fitness',
    price: 1299,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Decathlon'
  }
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing product collection.');

    // Insert initial catalog
    const createdProducts = await Product.insertMany(products);
    console.log(`Successfully seeded ${createdProducts.length} products into MongoDB!`);

    process.exit(0);
  } catch (error) {
    console.error(`Error during database seeding: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
