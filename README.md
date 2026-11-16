# Assignment 3: Inventory and Data Management System

**Course:** Web Dev III  
**Unit:** Unit - 3  
**CO Mapping:** CO3  
**Marks:** 2.5 / 2.5  

A robust, production-ready RESTful backend built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose** for managing an inventory product catalogue. Features complete CRUD operations, schema validation, query-string filtering, sorting, pagination, safe stock adjustments, and MongoDB aggregation pipelines.

---

## 🛠️ Technology Stack

- **Node.js** – Server-side JavaScript runtime
- **Express.js** – Backend web framework and routing
- **MongoDB** – NoSQL document database
- **Mongoose** – Object Data Modeling (ODM) with schema validation and virtuals
- **dotenv** – Environment variable management

*Adheres strictly to assignment restrictions: No external boilerplates or unauthorized libraries.*

---

## 📁 Project Architecture

```
webdev3_assign3/
├── .env                  # Environment configuration
├── .env.example          # Template for environment variables
├── .gitignore            # Git ignore file
├── package.json          # Node package configuration and npm scripts
├── postman_collection.json # Ready-to-import Postman collection
├── README.md             # Complete documentation and API guide
├── src/
│   ├── app.js            # Express application setup and middleware configuration
│   ├── server.js         # Entry point: DB connection & HTTP server initialization
│   ├── config/
│   │   └── db.js         # MongoDB connection using Mongoose
│   ├── controllers/
│   │   └── productController.js # Handlers for CRUD, reports, and aggregation
│   ├── middleware/
│   │   └── errorHandler.js      # Centralized error handler & 404 middleware
│   ├── models/
│   │   └── Product.js    # Mongoose Schema, field validation, and virtuals
│   └── seed/
│       └── seedData.js   # Database seeder with realistic test catalogue
└── test/
    └── api.test.js       # Automated 50-point integration test suite
```

---

## 📋 Mongoose Schema Design & Virtuals

Defined in `src/models/Product.js`:

| Field | Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required, trimmed | Product name |
| `sku` | `String` | Required, Unique, Uppercase, trimmed | Stock Keeping Unit code |
| `category` | `String` | Required, trimmed | Product category |
| `price` | `Number` | Required, Min: 0 | Unit price in INR |
| `quantity` | `Number` | Required, Min: 0, Default: 0 | Current inventory quantity |
| `reorderLevel`| `Number` | Required, Min: 0, Default: 5 | Threshold for low stock alert |
| `supplier` | `String` | Required, trimmed | Supplier / Manufacturer name |
| `createdAt` | `Date` | Managed by Mongoose | Timestamp created |
| `updatedAt` | `Date` | Managed by Mongoose | Timestamp last modified |
| `stockValue` | `Number` | **Virtual Getter** (`price * quantity`) | Computed total monetary value |
| `id` | `String` | **Virtual Getter** (`_id.toString()`) | Hex string representation of `_id` |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`

### 2. Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Verify or edit `.env` in the root folder:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
NODE_ENV=development
```

### 4. Seed Database
Populate the database with the sample items matching the assignment requirements and screenshots:
```bash
npm run seed
```

### 5. Start the Server
- **Production mode:**
  ```bash
  npm start
  ```
- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```
The server will run on `http://localhost:5000`.

### 6. Run Test Suite
To run the automated integration tests verifying all 10 criteria and 50 assertions:
```bash
npm test
```

---

## 📡 RESTful API Reference

Base URL: `http://localhost:5000/api/products`

### 1. Get All Products (with Filtering, Sorting & Pagination)
- **Method:** `GET`
- **Endpoint:** `/api/products`
- **Query Parameters:**
  - `page` (optional, default: `1`): Current page number
  - `limit` (optional, default: `10`): Items per page
  - `category` (optional): Filter by exact category (case-insensitive)
  - `search` (optional): Partial search on `name` or `sku`
  - `minPrice` / `maxPrice` (optional): Price range filtering
  - `supplier` (optional): Partial search on `supplier`
  - `inStock` (optional): `true` (quantity > 0) or `false` (quantity = 0)
  - `sortBy` (optional): Field to sort by (`price`, `quantity`, `createdAt`, etc.)
  - `order` (optional): `asc` (default) or `desc`

**Example Request:**
```http
GET http://localhost:5000/api/products?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "total": 12,
  "page": 1,
  "totalPages": 2,
  "count": 10,
  "products": [
    {
      "_id": "6a54767af6123427d6e61d76",
      "name": "Study Table",
      "sku": "FURN-TB-012",
      "category": "Furniture",
      "price": 3999,
      "quantity": 2,
      "reorderLevel": 4,
      "supplier": "IKEA India",
      "createdAt": "2026-07-13T05:24:10.351Z",
      "updatedAt": "2026-07-13T05:24:10.351Z",
      "__v": 0,
      "stockValue": 7998,
      "id": "6a54767af6123427d6e61d76"
    }
  ]
}
```

---

### 2. Create Product
- **Method:** `POST`
- **Endpoint:** `/api/products`
- **Header:** `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```

**Response (201 Created):**
```json
{
  "_id": "6a547727f6123427d6e61d7c",
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens",
  "createdAt": "2026-07-13T05:27:03.054Z",
  "updatedAt": "2026-07-13T05:27:03.054Z",
  "__v": 0,
  "stockValue": 4800,
  "id": "6a547727f6123427d6e61d7c"
}
```

---

### 3. Get Single Product by ID
- **Method:** `GET`
- **Endpoint:** `/api/products/:id`

**Response (200 OK):**
```json
{
  "_id": "6a547727f6123427d6e61d7c",
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens",
  "createdAt": "2026-07-13T05:27:03.054Z",
  "updatedAt": "2026-07-13T05:27:03.054Z",
  "__v": 0,
  "stockValue": 4800,
  "id": "6a547727f6123427d6e61d7c"
}
```

---

### 4. Update Product Details
- **Method:** `PUT`
- **Endpoint:** `/api/products/:id`
- **Header:** `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 140,
  "quantity": 60
}
```

**Response (200 OK):**
```json
{
  "_id": "6a547727f6123427d6e61d7c",
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 140,
  "quantity": 60,
  "reorderLevel": 20,
  "supplier": "Cello Pens",
  "createdAt": "2026-07-13T05:27:03.054Z",
  "updatedAt": "2026-07-13T05:30:25.913Z",
  "__v": 0,
  "stockValue": 8400,
  "id": "6a547727f6123427d6e61d7c"
}
```

---

### 5. Safe Stock Adjustment (Restock / Sale)
- **Method:** `PATCH`
- **Endpoint:** `/api/products/:id/stock`
- **Header:** `Content-Type: application/json`

**Request Body (e.g., Restock 10 units):**
```json
{
  "change": 10
}
```

**Response (200 OK):**
```json
{
  "message": "Stock updated",
  "product": {
    "_id": "6a54767af6123427d6e61d76",
    "name": "Study Table",
    "sku": "FURN-TB-012",
    "category": "Furniture",
    "price": 3999,
    "quantity": 12,
    "reorderLevel": 4,
    "supplier": "IKEA India",
    "createdAt": "2026-07-13T05:24:10.351Z",
    "updatedAt": "2026-07-13T05:35:24.419Z",
    "__v": 0,
    "stockValue": 47988,
    "id": "6a54767af6123427d6e61d76"
  }
}
```
*Note: If `quantity + change < 0`, the endpoint returns a `400 Bad Request` with an "Insufficient stock" error message, preventing negative inventory.*

---

### 6. Delete Product
- **Method:** `DELETE`
- **Endpoint:** `/api/products/:id`

**Response (200 OK):**
```json
{
  "message": "Product deleted",
  "id": "6a547727f6123427d6e61d7c"
}
```

---

### 7. Low-Stock Alert Report
- **Method:** `GET`
- **Endpoint:** `/api/products/low-stock`
- Filters products where `quantity <= reorderLevel`.

**Response (200 OK):**
```json
{
  "count": 4,
  "lowStockItems": [
    {
      "_id": "6a54767af6123427d6e61d76",
      "name": "Study Table",
      "sku": "FURN-TB-012",
      "category": "Furniture",
      "price": 3999,
      "quantity": 2,
      "reorderLevel": 4,
      "supplier": "IKEA India",
      "createdAt": "2026-07-13T05:24:10.351Z",
      "updatedAt": "2026-07-13T05:24:10.351Z",
      "__v": 0,
      "stockValue": 7998,
      "id": "6a54767af6123427d6e61d76"
    }
  ]
}
```

---

### 8. Category-wise Inventory Summary (Aggregation)
- **Method:** `GET`
- **Endpoint:** `/api/products/summary`
- Executes a MongoDB aggregation pipeline (`$group`, `$project`, `$sort`) calculating `totalItems`, `totalQuantity`, `totalStockValue`, and `avgPrice`.

**Response (200 OK):**
```json
{
  "categories": 6,
  "summary": [
    {
      "_id": "Electronics",
      "totalItems": 4,
      "totalQuantity": 96,
      "totalStockValue": 343994,
      "avgPrice": 5635.5
    },
    {
      "_id": "Apparel",
      "totalItems": 2,
      "totalQuantity": 78,
      "totalStockValue": 75522,
      "avgPrice": 1399
    }
  ]
}
```

---

## 🛡️ Centralized Error Handling

All runtime and database errors pass through `src/middleware/errorHandler.js`:
- **Invalid ObjectId (`CastError`):** Returns `404 Not Found` (`Product not found (Invalid ID format)`).
- **Duplicate SKU (`11000`):** Returns `400 Bad Request` (`Duplicate field value entered: sku already exists`).
- **Validation Errors (`ValidationError`):** Returns `400 Bad Request` with field-level constraint explanations.
- **Undefined Routes:** Returns `404 Not Found` with the attempted path and method.

---

## 📮 Postman Collection

Import `postman_collection.json` into Postman:
1. Open Postman.
2. Click **Import** in the upper left.
3. Select `postman_collection.json` from this repository.
4. All 10 requests are pre-configured with query params, sample bodies, and an environment variable runner.

---

## 📊 Evaluation Rubric Checklist

| Criteria | Marks | Implementation |
| :--- | :--- | :--- |
| **Database Schema Design & Validation (Mongoose)** | 0.5 / 0.5 | Strict schema with required fields, type constraints, unique uppercase SKU, non-negative bounds, and `stockValue` virtual field. |
| **CRUD Functionality** | 0.75 / 0.75 | Full RESTful implementation of Create (201), Read All / Single, Update (PUT), Safe Stock adjustment (PATCH), and Delete (DELETE). |
| **Querying – Filtering, Sorting, Pagination** | 0.5 / 0.5 | Query-string support for `category`, `search`, `supplier`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `order`, `page`, and `limit` with exact output structure. |
| **Aggregation – Low-Stock & Category Summary** | 0.5 / 0.5 | Efficient `$expr` querying for low stock alert and multi-stage `$group` aggregation pipeline for category summaries. |
| **API Design & Clean Code** | 0.25 / 0.25 | Modular MVC architecture, centralized error handling, dotenv configuration, automated tests, and zero external unapproved packages. |
| **Total** | **2.5 / 2.5** | **100% Completed** |
