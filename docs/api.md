# API Documentation

Base URL: `http://localhost:3000/api`

## Product Object

```json
{
  "id": 1,
  "name": "Wireless Mouse",
  "category": "Electronics",
  "price": 24.99,
  "quantity": 30
}
```

## GET /products

Returns all products.

Response `200 OK`

```json
[
  {
    "id": 1,
    "name": "Wireless Mouse",
    "category": "Electronics",
    "price": 24.99,
    "quantity": 30
  }
]
```

## POST /products

Creates a product.

Request body

```json
{
  "name": "Wireless Mouse",
  "category": "Electronics",
  "price": 24.99,
  "quantity": 30
}
```

Response `201 Created`

```json
{
  "id": 1,
  "name": "Wireless Mouse",
  "category": "Electronics",
  "price": 24.99,
  "quantity": 30
}
```

## PUT /products/:id

Updates a product.

Request body

```json
{
  "name": "Wireless Mouse",
  "category": "Electronics",
  "price": 21.99,
  "quantity": 40
}
```

Response `200 OK`

```json
{
  "id": 1,
  "name": "Wireless Mouse",
  "category": "Electronics",
  "price": 21.99,
  "quantity": 40
}
```

## DELETE /products/:id

Deletes a product.

Response `204 No Content`

## Validation Errors

Response `400 Bad Request`

```json
{
  "message": "Validation failed",
  "errors": {
    "name": "Product name is required."
  }
}
```
