# Hospital CRM — Enterprise Backend API

A professional, production-ready RESTful backend built with **Node.js**, **Express.js**, and **Neon Serverless PostgreSQL** using **Raw SQL (No ORM)** and **JWT Authentication**.

---

## 🏗 Architecture & Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # Neon PostgreSQL raw connection pool (pg.Pool) with SSL
│   │   └── env.js            # Centralized environment variable loader
│   ├── constants/
│   │   ├── roles.js          # RBAC Roles (ADMIN, DOCTOR, NURSE, RECEPTIONIST, BILLING)
│   │   └── httpStatus.js     # Standard HTTP status codes
│   ├── controllers/
│   │   └── auth.controller.js # HTTP request handlers for authentication
│   ├── database/
│   │   ├── init.sql          # Raw SQL schema (users, refresh_tokens, audit_logs)
│   │   ├── migrate.js        # Automatic DDL migration runner
│   │   └── seed.js           # Default admin seeder (admin@gmail.com / admin123)
│   ├── middlewares/
│   │   ├── auth.middleware.js # JWT Bearer token authentication & role authorization
│   │   ├── error.middleware.js# Global error and 404 handlers
│   │   └── validate.middleware.js # Request payload validation
│   ├── routes/
│   │   ├── auth.routes.js    # Authentication endpoint definitions
│   │   └── index.js          # API v1 router mounting
│   ├── services/
│   │   └── auth.service.js   # Core business logic & database queries (Raw SQL)
│   ├── utils/
│   │   ├── apiResponse.js    # Standardized JSend response formatter & AppError
│   │   ├── jwt.utils.js      # JWT signing & verification (Access + Refresh tokens)
│   │   └── password.utils.js # Password hashing & comparison (bcryptjs)
│   ├── app.js                # Express app setup (Helmet, CORS, Morgan, Body Parsers)
│   └── server.js             # Server bootstrap, DB health verification & graceful shutdown
├── .env                      # Environment secrets
├── .env.example              # Environment template
└── package.json
```

---

## 🔐 Default Admin Credentials

* **Email**: `admin@gmail.com`
* **Password**: `admin123`
* **Role**: `ADMIN`

---

## ⚡ Quick Start

### 1. Configure Neon Database
Add your Neon connection URL to `backend/.env`:
```env
DATABASE_URL=postgresql://neondb_owner:your_password@ep-your-host.aws.neon.tech/neondb?sslmode=require
```

### 2. Start Server
```bash
# In backend folder
npm run dev
```

* **Server Port**: `http://localhost:5000`
* **Health Check**: `http://localhost:5000/api/v1/health`

---

## 📡 Authentication API Endpoints

### 1. Login
* **Method**: `POST`
* **URL**: `/api/v1/auth/login`
* **Body**:
  ```json
  {
    "email": "admin@gmail.com",
    "password": "admin123"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "uuid-here",
        "email": "admin@gmail.com",
        "name": "System Administrator",
        "role": "ADMIN"
      },
      "tokens": {
        "accessToken": "ey...",
        "refreshToken": "ey...",
        "expiresIn": "1d"
      }
    }
  }
  ```

### 2. Get Current Profile
* **Method**: `GET`
* **URL**: `/api/v1/auth/me`
* **Headers**: `Authorization: Bearer <accessToken>`

### 3. Refresh Access Token
* **Method**: `POST`
* **URL**: `/api/v1/auth/refresh`
* **Body**:
  ```json
  {
    "refreshToken": "<refreshToken>"
  }
  ```

### 4. Logout
* **Method**: `POST`
* **URL**: `/api/v1/auth/logout`
* **Body**:
  ```json
  {
    "refreshToken": "<refreshToken>"
  }
  ```
