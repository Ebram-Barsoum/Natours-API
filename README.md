# 🌍 Natours API

A feature-rich RESTful API for a tour booking platform built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**. It supports full tour management, user authentication, reviews, payments via Stripe, and more.

---

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Architecture](#-architecture)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)
- [Scripts](#-scripts)

---

## 📖 Project Description

Natours is a backend API for a nature tour booking platform. Users can browse available tours, read and write reviews, and book tours via Stripe payments. Admins and guides have elevated access to manage tours, users, and bookings. The API follows RESTful conventions and is built with a layered, modular architecture in TypeScript.

---

## 🛠️ Tech Stack

| Category           | Technology                                     |
| ------------------ | ---------------------------------------------- |
| **Runtime**        | Node.js                                        |
| **Language**       | TypeScript 5                                   |
| **Framework**      | Express 5                                      |
| **Database**       | MongoDB (via Mongoose 8)                       |
| **Authentication** | JSON Web Tokens (JWT) + bcryptjs               |
| **Payments**       | Stripe                                         |
| **File Uploads**   | Multer + Sharp (image processing)              |
| **Email**          | Nodemailer (Mailtrap for dev)                  |
| **Validation**     | Joi + custom middleware                        |
| **Security**       | Helmet, CORS, express-mongo-sanitize, xss, hpp |
| **Rate Limiting**  | express-rate-limit                             |
| **Logging**        | Morgan                                         |
| **Compression**    | compression                                    |
| **Bundler**        | tsx (dev), tsc (prod)                          |

---

## ✨ Features

### 🔐 Authentication & Authorization

- User sign-up and login with JWT-based authentication
- Password hashing with `bcryptjs`
- Forgot password / reset password via email token
- Role-based access control: `user`, `guide`, `lead-guide`, `admin`
- Authenticated password update endpoint

### 🗺️ Tour Management

- Full CRUD for tours (admin & lead-guide only)
- Modular PATCH endpoints for updating specific tour sections (guides, images, locations, schedule, status)
- Alias endpoint for recommended tours
- Aggregation pipeline for tour statistics (`/stats`)
- Monthly plan view by year (`/monthly-plan`)
- Geospatial queries: tours within a radius and distance calculations
- Image uploads (cover + multiple images) with automatic resizing via Sharp
- Soft-delete plugin for Mongoose models

### ⭐ Reviews

- Users can create, update, and delete their own reviews per tour
- Admins can view all reviews for a tour
- Ownership validation — only the review author can modify it
- Reviews are nested under tours (`/api/v1/tours/:tourId/reviews`)

### 💳 Bookings & Payments

- Stripe Checkout session creation for tour bookings
- Stripe webhook handler for post-payment booking confirmation
- Users can view their own bookings
- Admins can view, update, and delete all bookings
- Admin can view a specific user's bookings

### 🛡️ Security

- HTTP security headers via Helmet
- NoSQL injection prevention via `express-mongo-sanitize`
- XSS sanitization via custom middleware using `xss`
- Rate limiting (100 requests / hour per IP on `/api`)
- CORS enabled for all origins
- Proxy trust configured for Railway deployment

### ⚙️ Performance & Reliability

- Response compression with `compression`
- Graceful shutdown on `SIGTERM`
- Global uncaught exception and unhandled rejection handlers
- Static file serving from `public/` directory

---

## 🏗️ Architecture

```
natours/
├── src/
│   ├── index.ts              # Entry point — DB connection & server bootstrap
│   ├── app.ts                # Express app setup — middleware & route mounting
│   │
│   ├── configs/
│   │   ├── db.ts             # MongoDB connection logic
│   │   ├── multer.ts         # File uploader factory (disk/memory, single/array/mix)
│   │   └── nodemailer.ts     # Nodemailer transporter (Mailtrap SMTP)
│   │
│   ├── controllers/          # Route handler functions (business logic layer)
│   │   ├── auth.controller.ts
│   │   ├── tours.controller.ts
│   │   ├── users.controller.ts
│   │   ├── reviews.controller.ts
│   │   ├── booking.controller.ts
│   │   └── error.controller.ts
│   │
│   ├── routes/               # Express routers
│   │   ├── auth.routes.ts
│   │   ├── tours.routes.ts
│   │   ├── users.routes.ts
│   │   ├── reviews.routes.ts
│   │   └── booking.routes.ts
│   │
│   ├── models/               # Mongoose schemas & models
│   │   ├── tour.model.ts
│   │   ├── user.model.ts
│   │   ├── review.model.ts
│   │   ├── booking.model.ts
│   │   └── plugins/
│   │       └── softDelete.plugin.ts
│   │
│   ├── middlewares/          # Reusable Express middleware
│   │   ├── auth.middleware.ts       # protect, restrictTo
│   │   ├── tours.middleware.ts      # image upload & resize
│   │   ├── users.middleware.ts      # avatar upload & resize
│   │   ├── validation.middlewares.ts
│   │   ├── rate-limitter.middleware.ts
│   │   └── xss.middleware.ts
│   │
│   ├── schemas/              # Joi validation schemas
│   │   ├── tours.schemas.ts
│   │   ├── users.schema.ts
│   │   └── review.schemas.ts
│   │
│   ├── services/             # Reusable service helpers (e.g. email)
│   │
│   ├── utils/                # Utility classes and helpers
│   │   └── appError.ts
│   │
│   └── dev-data/             # Seed scripts & sample data
│       └── data/
│           └── initialize-collection-in-db.ts
│
├── public/                   # Static files served by Express
├── dist/                     # Compiled JS output  (after build)
├── .env.example              # Environment variable template
├── tsconfig.json
└── package.json
```

### Request Flow

```
Client Request
    │
    ▼
Express App (app.ts)
    │
    ├── Global Middleware (CORS, Helmet, Rate Limiting, Body Parsing,
    │                      Sanitization, XSS, Compression)
    │
    ▼
Router (routes/)
    │
    ├── Middleware Chain (auth.middleware → validation.middlewares → ...)
    │
    ▼
Controller (controllers/)
    │
    ▼
Mongoose Model (models/)
    │
    ▼
MongoDB Atlas
```

---

## 📡 API Endpoints

### Auth — `/api/v1/auth`

| Method  | Endpoint                      | Access  | Description                  |
| ------- | ----------------------------- | ------- | ---------------------------- |
| `POST`  | `/signup`                     | Public  | Register a new user          |
| `POST`  | `/login`                      | Public  | Login and get JWT            |
| `POST`  | `/forgot-password`            | Public  | Request password reset email |
| `PATCH` | `/reset-password/:resetToken` | Public  | Reset password via token     |
| `PATCH` | `/update-password`            | 🔒 User | Change current password      |

### Tours — `/api/v1/tours`

| Method   | Endpoint                                                 | Access        | Description                 |
| -------- | -------------------------------------------------------- | ------------- | --------------------------- |
| `GET`    | `/`                                                      | Public        | Get all tours               |
| `GET`    | `/:tourId`                                               | Public        | Get a single tour           |
| `GET`    | `/stats`                                                 | Public        | Get tour statistics         |
| `GET`    | `/recommended`                                           | Public        | Get top 5 recommended tours |
| `GET`    | `/tours-within/distance/:dist/center/:latlng/unit/:unit` | Public        | Get tours within a radius   |
| `GET`    | `/distances/:latlng/unit/:unit`                          | Public        | Get distances to all tours  |
| `GET`    | `/monthly-plan`                                          | 🔒 Guide+     | Monthly tour plan by year   |
| `POST`   | `/`                                                      | 🔒 Admin/Lead | Create a new tour           |
| `PATCH`  | `/:tourId`                                               | 🔒 Admin/Lead | Update tour core fields     |
| `PATCH`  | `/:tourId/guides`                                        | 🔒 Admin/Lead | Update tour guides          |
| `PATCH`  | `/:tourId/images`                                        | 🔒 Admin/Lead | Upload & update tour images |
| `PATCH`  | `/:tourId/locations`                                     | 🔒 Admin/Lead | Update tour locations       |
| `PATCH`  | `/:tourId/schedule`                                      | 🔒 Admin/Lead | Update tour schedule        |
| `PATCH`  | `/:tourId/status`                                        | 🔒 Admin/Lead | Update tour status          |
| `DELETE` | `/:tourId`                                               | 🔒 Admin/Lead | Delete a tour               |

### Reviews — `/api/v1/tours/:tourId/reviews`

| Method   | Endpoint     | Access  | Description                |
| -------- | ------------ | ------- | -------------------------- |
| `GET`    | `/`          | Public  | Get all reviews for a tour |
| `POST`   | `/`          | 🔒 User | Create a review for a tour |
| `PUT`    | `/:reviewId` | 🔒 User | Update own review          |
| `DELETE` | `/:reviewId` | 🔒 User | Delete own review          |

### Users — `/api/v1/users`

| Method   | Endpoint            | Access   | Description                 |
| -------- | ------------------- | -------- | --------------------------- |
| `GET`    | `/me`               | 🔒 User  | Get my profile              |
| `PATCH`  | `/update-me`        | 🔒 User  | Update my profile & avatar  |
| `DELETE` | `/delete-me`        | 🔒 User  | Soft-delete my account      |
| `GET`    | `/`                 | 🔒 Admin | Get all users               |
| `GET`    | `/:userId/bookings` | 🔒 Admin | Get all bookings for a user |

### Bookings — `/api/v1/bookings`

| Method   | Endpoint                    | Access        | Description                    |
| -------- | --------------------------- | ------------- | ------------------------------ |
| `POST`   | `/checkout-session/:tourId` | 🔒 User       | Create Stripe checkout session |
| `GET`    | `/mine`                     | 🔒 User       | Get my bookings                |
| `GET`    | `/`                         | 🔒 Admin/Lead | Get all bookings               |
| `PATCH`  | `/:bookingId`               | 🔒 Admin/Lead | Update a booking               |
| `DELETE` | `/:bookingId`               | 🔒 Admin/Lead | Delete a booking               |

### Stripe Webhook — `POST /checkout-webhook`

Receives Stripe events to confirm bookings after successful payment. Requires the raw request body.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Environment
NODE_ENV=development
BASE_URL=http://localhost:3001
PORT=3001

# Database
DATABSE_NAME=natours
DATABSE_PASSWORD=your_mongo_password
DATABASE_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/natours

# JWT
JWT_SECRET=your_jwt_secret_at_least_32_chars
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
BCRYPT_SALT_ROUNDS=12

# Email (Mailtrap for development)
MAILTRAP_USERNAME=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🚀 Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB instance)
- [Stripe](https://stripe.com/) account (for payment features)
- [Mailtrap](https://mailtrap.io/) account (for email in development)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ebram-Barsoum/Natours-API.git
   cd Natours-API
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Fill in all required values in .env
   ```

4. **(Optional) Seed the database**

   ```bash
   # Import sample tours, users, and reviews
   npm run import:tours
   npm run import:users
   npm run import:reviews
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`.

---

## 📜 Scripts

| Script                   | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `npm run dev`            | Start dev server with hot-reload via `tsx watch` |
| `npm run build`          | Compile TypeScript to `dist/` for production     |
| `npm run start`          | Run the compiled production build                |
| `npm run start:prod`     | Run production build with `NODE_ENV=production`  |
| `npm run import:tours`   | Seed the database with sample tour data          |
| `npm run delete:tours`   | Delete all tour data from the database           |
| `npm run import:users`   | Seed the database with sample user data          |
| `npm run delete:users`   | Delete all user data from the database           |
| `npm run import:reviews` | Seed the database with sample review data        |
| `npm run delete:reviews` | Delete all review data from the database         |
