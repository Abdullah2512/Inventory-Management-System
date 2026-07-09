# Week 1 Inventory Management System

A clean Week 1 full-stack inventory management project using HTML, CSS, Bootstrap 5, Vanilla JavaScript, Node.js, Express.js, and Supabase PostgreSQL.

## Features

- Add, view, edit, and delete products
- Instant product list updates after every CRUD operation
- Frontend validation and backend validation
- Express MVC structure
- CORS configuration
- Supabase PostgreSQL connection
- Responsive Bootstrap 5 UI

No authentication, pagination, search, filtering, sorting, file uploads, or later-week features are included.

## Project Structure

```text
.
├── backend
│   ├── server.js
│   └── src
│       ├── app.js
│       ├── config
│       │   └── supabase.js
│       ├── controllers
│       │   └── product.controller.js
│       ├── middleware
│       │   └── errorHandler.js
│       ├── models
│       │   └── product.model.js
│       ├── routes
│       │   └── product.routes.js
│       └── utils
│           └── validators.js
├── database
│   └── schema.sql
├── docs
│   └── api.md
├── frontend
│   ├── assets
│   │   ├── css
│   │   │   └── styles.css
│   │   └── js
│   │       └── app.js
│   └── index.html
├── .env.example
├── package.json
└── README.md
```

## Product Fields

- `id`
- `name`
- `category`
- `price`
- `quantity`

## API Endpoints

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Full API documentation is available in `docs/api.md`.
