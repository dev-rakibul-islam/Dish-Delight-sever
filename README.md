# 🍽️ Dish Delight - Server

A robust Express.js backend API server for the Dish Delight restaurant management platform. Handles authentication, product management, and data persistence with MongoDB.

## 📋 Project Description

**Dish Delight Server** is a RESTful API that powers the Dish Delight application, providing:

- **User Authentication** - Secure registration and login with JWT tokens
- **OAuth Integration** - Support for social authentication providers (Google, etc.)
- **Product Management** - Create, read, update, and delete food items
- **User Authorization** - Role-based access control for protected routes
- **Data Persistence** - MongoDB database for reliable data storage
- **CORS Support** - Configured for multiple client origins
- **Security** - Password hashing with bcrypt, JWT token verification

Built with industry-standard technologies including Express.js, MongoDB, JWT, and bcrypt for production-ready reliability.

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** 14.0 or higher
- **npm** or **yarn** package manager
- **MongoDB Atlas** account or local MongoDB instance
- **Git** for version control

### Installation Steps

1. **Clone the repository:**

```bash
git clone <repository-url>
cd dishdelight-server
```

2. **Install dependencies:**

```bash
npm install
# or
yarn install
```

3. **Environment Variables**
   Create a `.env` file in the root directory with the following configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_USER=your_mongodb_user
DB_PASSWORD=your_mongodb_password
DB_NAME=dishdelight

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
INTERNAL_API_KEY=dev-internal-key

# Client Origins
CLIENT_ORIGIN=http://localhost:3000,https://dishdelight-client.vercel.app
```

4. **Run the development server:**

```bash
npm run dev
# or
yarn dev
```

5. **Server will start on:**
   `http://localhost:5000`

### Build for Production

```bash
npm start
# or
yarn start
```

### Deployment

Deploy to Vercel:

```bash
vercel --prod
```

## 📍 API Routes Summary

### Public Routes (No Authentication Required)

#### Health & Info

| Method | Route     | Description                         |
| ------ | --------- | ----------------------------------- |
| `GET`  | `/`       | Server info and available endpoints |
| `GET`  | `/health` | Health check endpoint               |

#### Items/Products

| Method | Route        | Description               | Query Params                 |
| ------ | ------------ | ------------------------- | ---------------------------- |
| `GET`  | `/items`     | Get all public items      | `?search=text&category=name` |
| `GET`  | `/items/:id` | Get specific item details | -                            |

#### Authentication

| Method | Route            | Description       | Body                        |
| ------ | ---------------- | ----------------- | --------------------------- |
| `POST` | `/auth/register` | Register new user | `{ name, email, password }` |
| `POST` | `/auth/login`    | Login user        | `{ email, password }`       |
| `POST` | `/auth/oauth`    | OAuth sync/login  | `{ email, name, provider }` |

### Protected Routes (Authentication Required)

All protected routes require an `Authorization: Bearer <token>` header.

#### User Items

| Method | Route         | Description                    |
| ------ | ------------- | ------------------------------ |
| `GET`  | `/items/mine` | Get authenticated user's items |
| `GET`  | `/products`   | Get user's products            |

#### Product Management

| Method   | Route           | Description        | Body                                                                                      |
| -------- | --------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `POST`   | `/products`     | Create new product | `{ name, summary, description, category, price, image?, priority?, availableDate? }`      |
| `PUT`    | `/products/:id` | Update product     | `{ name?, summary?, description?, category?, price?, image?, priority?, availableDate? }` |
| `DELETE` | `/products/:id` | Delete product     | -                                                                                         |

#### Legacy Routes (Also Supported)

| Method   | Route        | Description                 |
| -------- | ------------ | --------------------------- |
| `POST`   | `/items`     | Create new item (alternate) |
| `DELETE` | `/items/:id` | Delete item (alternate)     |

## 🔐 Authentication

### JWT Token Structure

```javascript
{
  sub: "user_id",           // Subject (User ID)
  email: "user@email.com",  // User email
  role: "user",             // User role
  iat: 1234567890,          // Issued at
  exp: 1234567890           // Expiration (7 days)
}
```

### Authentication Flow

1. **Register**

   ```bash
   POST /auth/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "securepassword"
   }
   ```

2. **Login**

   ```bash
   POST /auth/login
   {
     "email": "john@example.com",
     "password": "securepassword"
   }
   ```

3. **Use Token**
   ```bash
   GET /products
   Authorization: Bearer <token>
   ```

### OAuth Integration

```bash
POST /auth/oauth
X-Internal-Key: dev-internal-key
{
  "email": "user@gmail.com",
  "name": "User Name",
  "provider": "google"
}
```

## 📦 Request/Response Examples

### Create Product

**Request:**

```bash
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Grilled Salmon",
  "summary": "Fresh Atlantic salmon with herbs",
  "description": "Premium grilled salmon served with seasonal vegetables and lemon butter sauce",
  "category": "Main Course",
  "price": 29.99,
  "image": "https://example.com/salmon.jpg",
  "priority": "high",
  "availableDate": "2025-01-15"
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Grilled Salmon",
  "summary": "Fresh Atlantic salmon with herbs",
  "description": "Premium grilled salmon served with seasonal vegetables and lemon butter sauce",
  "category": "Main Course",
  "price": 29.99,
  "image": "https://example.com/salmon.jpg",
  "priority": "high",
  "availableDate": "2025-01-15T00:00:00.000Z",
  "ownerId": "507f1f77bcf86cd799439010",
  "ownerEmail": "chef@dishdelight.com",
  "createdAt": "2025-01-10T14:30:00.000Z"
}
```

### Get Items with Filters

```bash
GET /items?search=salmon&category=Main%20Course
```

### Update Product

```bash
PUT /products/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 31.99,
  "priority": "medium"
}
```

## 🛡️ Security Features

- **Password Hashing** - Bcrypt with salt rounds for secure password storage
- **JWT Tokens** - Stateless authentication with 7-day expiration
- **CORS Protection** - Whitelist-based origin validation
- **Input Validation** - Request body validation for all endpoints
- **Error Handling** - Secure error messages without exposing internal details
- **Authorization** - Users can only modify their own products
- **Rate Limiting Ready** - Architecture supports adding rate limiting middleware

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  role: String, // "user", "admin"
  provider: String, // "credentials", "google", etc.
  createdAt: Date,
  updatedAt: Date
}
```

### Food Items Collection

```javascript
{
  _id: ObjectId,
  name: String,
  summary: String,
  description: String,
  image: String (URL),
  category: String,
  price: Number,
  priority: String, // "low", "medium", "high"
  availableDate: Date,
  ownerId: ObjectId,
  userId: ObjectId, // Alternative to ownerId
  ownerEmail: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 Environment Variables

| Variable           | Description            | Default                 | Required    |
| ------------------ | ---------------------- | ----------------------- | ----------- |
| `PORT`             | Server port            | 5000                    | No          |
| `NODE_ENV`         | Environment mode       | development             | No          |
| `DB_USER`          | MongoDB user           | -                       | Yes         |
| `DB_PASSWORD`      | MongoDB password       | -                       | Yes         |
| `DB_NAME`          | Database name          | dishdelight             | No          |
| `JWT_SECRET`       | JWT signing secret     | dev-secret              | Yes\*       |
| `INTERNAL_API_KEY` | OAuth internal key     | dev-internal-key        | No          |
| `CLIENT_ORIGIN`    | Allowed client origins | -                       | No          |
| `MONGODB_URI`      | Full MongoDB URI       | Constructed from DB\_\* | Alternative |

\*Should be changed in production

## 📁 Project Structure

```
dishdelight-server/
├── index.js                 # Main server file
├── package.json             # Dependencies
├── .env                     # Environment variables (not in git)
├── .env.local              # Local environment overrides
├── .gitignore              # Git ignore rules
├── vercel.json             # Vercel deployment config
├── .vercel/                # Vercel deployment artifacts
└── README.md               # This file
```

## 🎯 Key Features

- ✅ **Express.js Server** - Lightweight and performant
- 🔐 **Secure Authentication** - JWT + Bcrypt
- 🌍 **CORS Enabled** - Multiple origin support
- 📦 **MongoDB Integration** - Document-based database
- 🔄 **CRUD Operations** - Full product management
- 👤 **User Authorization** - Ownership-based access control
- 🚀 **Production Ready** - Error handling, validation, security
- 🔗 **OAuth Support** - Social login integration
- 📝 **Structured Logging** - Console error tracking
- 🛡️ **Input Validation** - Type and format checking

## 🚀 Getting Started Tips

1. **First Run?** Start with health check: `GET /health`
2. **Register User?** Use `/auth/register` to create account
3. **Get Token?** Login via `/auth/login` to receive JWT
4. **Create Products?** Use token in `Authorization` header
5. **Search Products?** Use `/items?search=text&category=type`
6. **Debug Issues?** Check server console for detailed error logs

## 📚 Documentation

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Documentation](https://jwt.io/introduction)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

## 🧪 Testing

Test endpoints using:

- **Postman** - Import and run requests
- **cURL** - Command line testing
- **REST Client** - VS Code extension

Example cURL command:

```bash
curl -X GET http://localhost:5000/health
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📝 License

This project is part of the Dish Delight restaurant management platform.

## 👨‍💻 Author

**Dish Delight Development Team**

- Repository: [dev-rakibul-islam](https://github.com/dev-rakibul-islam)

## 🔄 Related Projects

- **Client** - [Dish Delight Client](./../../dishdelight-client)

---

**For server stability and performance monitoring, consider implementing:**

- Request logging middleware
- Rate limiting
- Caching layer (Redis)
- Database indexing optimization
- Error tracking (Sentry, etc.)

**Happy Coding! Build delicious experiences with Dish Delight! 🍽️✨**
