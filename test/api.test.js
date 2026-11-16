require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

let server;
let baseUrl;

const request = async (method, path, body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${baseUrl}${path}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

const runTests = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Start server on an ephemeral port
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running at ${baseUrl}`);

    let passed = 0;
    let failed = 0;

    const assert = (condition, description) => {
      if (condition) {
        console.log(`✅ PASS: ${description}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${description}`);
        failed++;
      }
    };

    console.log('\n--- 1. Testing GET /api/products (Pagination, Total, StockValue) ---');
    const resProducts = await request('GET', '/api/products?page=1&limit=10');
    assert(resProducts.status === 200, 'Status is 200 OK');
    assert(resProducts.data.total === 12, `Total count is 12 (got ${resProducts.data.total})`);
    assert(resProducts.data.page === 1, 'Page is 1');
    assert(resProducts.data.totalPages === 2, `Total pages is 2 (got ${resProducts.data.totalPages})`);
    assert(resProducts.data.count === 10, `Count is 10 (got ${resProducts.data.count})`);
    assert(resProducts.data.products.length === 10, 'Products array length is 10');
    const firstProduct = resProducts.data.products[0];
    assert(firstProduct.stockValue === firstProduct.price * firstProduct.quantity, 'stockValue virtual calculated correctly');
    assert(firstProduct.id === firstProduct._id, 'id virtual matches _id');

    console.log('\n--- 2. Testing GET /api/products/low-stock ---');
    const resLowStock = await request('GET', '/api/products/low-stock');
    assert(resLowStock.status === 200, 'Status is 200 OK');
    assert(resLowStock.data.count === 4, `Low stock count is 4 (got ${resLowStock.data.count})`);
    assert(Array.isArray(resLowStock.data.lowStockItems), 'lowStockItems is an array');
    const allBelowReorder = resLowStock.data.lowStockItems.every(
      item => item.quantity <= item.reorderLevel
    );
    assert(allBelowReorder, 'All returned items have quantity <= reorderLevel');

    console.log('\n--- 3. Testing GET /api/products/summary (Aggregation) ---');
    const resSummary = await request('GET', '/api/products/summary');
    assert(resSummary.status === 200, 'Status is 200 OK');
    assert(resSummary.data.categories === 6, `Categories count is 6 (got ${resSummary.data.categories})`);
    const elecCategory = resSummary.data.summary.find(s => s._id === 'Electronics');
    assert(elecCategory !== undefined, 'Electronics category exists in summary');
    if (elecCategory) {
      assert(elecCategory.totalItems === 4, `Electronics totalItems is 4 (got ${elecCategory.totalItems})`);
      assert(elecCategory.totalQuantity === 96, `Electronics totalQuantity is 96 (got ${elecCategory.totalQuantity})`);
      assert(elecCategory.totalStockValue === 343994, `Electronics totalStockValue is 343994 (got ${elecCategory.totalStockValue})`);
      assert(elecCategory.avgPrice === 5635.5, `Electronics avgPrice is 5635.5 (got ${elecCategory.avgPrice})`);
    }

    const apparelCategory = resSummary.data.summary.find(s => s._id === 'Apparel');
    assert(apparelCategory !== undefined, 'Apparel category exists in summary');
    if (apparelCategory) {
      assert(apparelCategory.totalItems === 2, `Apparel totalItems is 2 (got ${apparelCategory.totalItems})`);
      assert(apparelCategory.totalQuantity === 78, `Apparel totalQuantity is 78 (got ${apparelCategory.totalQuantity})`);
      assert(apparelCategory.totalStockValue === 75522, `Apparel totalStockValue is 75522 (got ${apparelCategory.totalStockValue})`);
      assert(apparelCategory.avgPrice === 1399, `Apparel avgPrice is 1399 (got ${apparelCategory.avgPrice})`);
    }

    console.log('\n--- 4. Testing POST /api/products (Create Product) ---');
    const newProductPayload = {
      name: 'Wireless Bluetooth Mouse',
      sku: 'ELEC-MS-999',
      category: 'Electronics',
      price: 999,
      quantity: 15,
      reorderLevel: 5,
      supplier: 'Logitech India'
    };
    const resCreate = await request('POST', '/api/products', newProductPayload);
    assert(resCreate.status === 201, `Status is 201 Created (got ${resCreate.status})`);
    assert(resCreate.data.name === 'Wireless Bluetooth Mouse', 'Created product name matches');
    assert(resCreate.data.sku === 'ELEC-MS-999', 'Created product SKU matches');
    assert(resCreate.data.stockValue === 999 * 15, `stockValue is ${999 * 15} (got ${resCreate.data.stockValue})`);
    const createdId = resCreate.data._id;

    console.log('\n--- 5. Testing GET /api/products/:id (Get Single Product) ---');
    const resGetOne = await request('GET', `/api/products/${createdId}`);
    assert(resGetOne.status === 200, 'Status is 200 OK');
    assert(resGetOne.data._id === createdId, 'Fetched product _id matches');

    console.log('\n--- 6. Testing PUT /api/products/:id (Update Product) ---');
    const resUpdate = await request('PUT', `/api/products/${createdId}`, {
      price: 1199,
      quantity: 20
    });
    assert(resUpdate.status === 200, 'Status is 200 OK');
    assert(resUpdate.data.price === 1199, 'Updated price is 1199');
    assert(resUpdate.data.quantity === 20, 'Updated quantity is 20');
    assert(resUpdate.data.stockValue === 1199 * 20, `Updated stockValue is ${1199 * 20}`);

    console.log('\n--- 7. Testing PATCH /api/products/:id/stock (Safe Stock Adjustment) ---');
    const resStockRestock = await request('PATCH', `/api/products/${createdId}/stock`, { change: 10 });
    assert(resStockRestock.status === 200, 'Status is 200 OK');
    assert(resStockRestock.data.message === 'Stock updated', 'Message is "Stock updated"');
    assert(resStockRestock.data.product.quantity === 30, `Quantity increased from 20 to 30 (got ${resStockRestock.data.product.quantity})`);

    const resStockSale = await request('PATCH', `/api/products/${createdId}/stock`, { change: -5 });
    assert(resStockSale.status === 200, 'Status is 200 OK on sale decrement');
    assert(resStockSale.data.product.quantity === 25, `Quantity decreased to 25 (got ${resStockSale.data.product.quantity})`);

    const resStockExcess = await request('PATCH', `/api/products/${createdId}/stock`, { change: -50 });
    assert(resStockExcess.status === 400, 'Status is 400 Bad Request on overdrafting stock');

    console.log('\n--- 8. Testing DELETE /api/products/:id (Delete Product) ---');
    const resDelete = await request('DELETE', `/api/products/${createdId}`);
    assert(resDelete.status === 200, 'Status is 200 OK');
    assert(resDelete.data.message === 'Product deleted', 'Message is "Product deleted"');
    assert(resDelete.data.id === createdId, 'Deleted id returned');

    const resCheckDeleted = await request('GET', `/api/products/${createdId}`);
    assert(resCheckDeleted.status === 404, 'Deleted product returns 404 Not Found');

    console.log('\n--- 9. Testing Filtering, Search & Sorting ---');
    const resFilter = await request('GET', '/api/products?category=Furniture');
    assert(resFilter.data.products.every(p => p.category === 'Furniture'), 'Category filter returns only Furniture');

    const resSearch = await request('GET', '/api/products?search=Table');
    assert(resSearch.data.products.some(p => p.name.includes('Table')), 'Search matches "Table"');

    const resSort = await request('GET', '/api/products?sortBy=price&order=desc');
    const prices = resSort.data.products.map(p => p.price);
    const isSortedDesc = prices.slice(1).every((p, i) => prices[i] >= p);
    assert(isSortedDesc, 'Products are sorted by price descending');

    console.log('\n--- 10. Testing Centralized Error Handling ---');
    const resInvalidId = await request('GET', '/api/products/invalid-object-id-123');
    assert(resInvalidId.status === 404, 'Invalid ID returns 404 Not Found');

    const resMissingFields = await request('POST', '/api/products', { name: 'Incomplete' });
    assert(resMissingFields.status === 400, 'Missing fields returns 400 Bad Request');

    const resDuplicateSku = await request('POST', '/api/products', {
      name: 'Duplicate SKU Product',
      sku: 'FURN-TB-012', // Already exists in seed data
      category: 'Furniture',
      price: 2000,
      quantity: 5,
      reorderLevel: 2,
      supplier: 'Test'
    });
    assert(resDuplicateSku.status === 400, 'Duplicate SKU returns 400 Bad Request');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTests();
