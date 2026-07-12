# Inventory Management System – Week 2

A full-stack Inventory Management System built with **Node.js, Express.js, Supabase, Bootstrap, and JWT Authentication**.

## 🚀 Features

### Authentication
- User Registration
- User Login
- Secure password hashing using bcrypt
- JWT Authentication
- Protected API routes
- Session persistence using localStorage
- Logout functionality
- Input validation
- Proper HTTP status codes (400, 401, 403, 409)

### Inventory Management
- Add Products
- View Products
- Update Products
- Delete Products
- Search Products
- Responsive Dashboard
- Product Statistics

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (ES6)
- Bootstrap 5

### Backend
- Node.js
- Express.js
- JWT (jsonwebtoken)
- bcryptjs
- CORS
- dotenv

### Database
- Supabase (PostgreSQL)

---

## 📂 Project Structure

```
backend/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── app.js
│
├── server.js
└── .env

frontend/
│
├── assets/
│   ├── css/
│   └── js/
│
├── index.html
├── login.html
└── register.html
```

---

## 🔐 Authentication Flow

1. User registers.
2. Password is hashed using bcrypt.
3. User logs in.
4. Server verifies credentials.
5. JWT token is generated.
6. Token is stored in localStorage.
7. Protected APIs require a valid JWT.
8. User remains logged in after refresh.
9. Logout removes the token.

---

## 📦 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register | Register User |
| POST | /api/auth/login | Login User |

### Products

| Method | Endpoint |
|---------|----------|
| GET | /api/products |
| POST | /api/products |
| PUT | /api/products/:id |
| DELETE | /api/products/:id |

---

## ⚙ Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
pnpm install
```

Create a `.env` file

```env
PORT=5001

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

Start the server

```bash
pnpm dev
```

Open

```
http://localhost:5001
```

---

## 👤 Sample Test Account

```
Email:
test@example.com

Password:
123456
```

Or create a new account using the Register page.

---

## 🔒 Security Features

- Password Hashing (bcrypt)
- JWT Authentication
- Protected Routes
- Input Validation
- Error Handling
- Secure Session Management

---

## 📸 Deliverables

- Full Stack Application
- JWT Authentication
- Protected Dashboard
- CRUD Operations
- Supabase Integration
- Responsive UI

---

## 📄 License

This project is developed for internship learning purposes.
