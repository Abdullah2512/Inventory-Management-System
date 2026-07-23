# 📦 Inventory Management System

A Full Stack Inventory Management System built using **Node.js**, **Express.js**, **Supabase (PostgreSQL)**, and **Vanilla JavaScript**. The application provides secure authentication, inventory management, product image uploads, and a modern responsive dashboard.

---

# ✨ Features

## 🔐 Authentication
- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Secure Password Hashing

## 📦 Product Management
- Add Products
- View Products
- Edit Products
- Delete Products
- Product Image Upload
- Image Preview
- Inventory Quantity Management

## 📊 Dashboard
- Total Products
- Total Stock
- Total Inventory Value
- Low Stock Products
- Out of Stock Products
- Real-time Statistics

## 🔍 Search & Filtering
- Product Search
- Category Filtering
- Sorting
- Pagination

## 📁 File Upload
- Multipart FormData
- Multer Image Upload
- Image Validation
- Secure File Storage

## 🎨 User Interface
- Responsive Design
- Modern Dashboard
- Clean Product Management
- Dynamic Data Rendering

---

# 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (ES6)

### Backend
- Node.js
- Express.js

### Database
- Supabase (PostgreSQL)

### Authentication
- JWT
- bcryptjs

### File Upload
- Multer

---

# 📂 Project Structure

```text
Inventory-Management-System/
│
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── assets/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── products.html
│
└── README.md
```

---


# 📡 API Endpoints

## Authentication

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |

## Products

| Method | Endpoint |
|--------|----------|
| GET | `/api/products` |
| GET | `/api/products/:id` |
| POST | `/api/products` |
| PUT | `/api/products/:id` |
| DELETE | `/api/products/:id` |
| GET | `/api/products/categories` |

---

# 🚀 Completed Features

- ✅ User Authentication
- ✅ JWT Authorization
- ✅ Product CRUD Operations
- ✅ Image Upload & Preview
- ✅ Search & Filtering
- ✅ Sorting
- ✅ Pagination
- ✅ Dashboard Analytics
- ✅ Responsive UI
- ✅ Secure File Upload
- ✅ Relational Database Integration


# 📄 License

This project was developed for educational purposes as part of a Full Stack Development internship at @SYNEXUS TECHNOLOGIES.
