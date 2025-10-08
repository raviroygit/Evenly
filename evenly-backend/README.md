# Evenly Backend API

A comprehensive backend API for Evenly - a Splitwise clone built with Fastify, TypeScript, PostgreSQL, and Drizzle ORM.

## 🚀 Features

### Core Splitwise Functionality
- **Group Management**: Create, join, and manage expense-sharing groups
- **Expense Splitting**: Support for equal, percentage, shares-based, and exact amount splits
- **Balance Tracking**: Real-time balance calculations and "who owes whom" tracking
- **Debt Simplification**: Minimize transactions with smart debt optimization algorithms
- **Payment Recording**: Track payments and settlements between users
- **Multi-Currency Support**: Handle different currencies per group

### Technical Features
- **Authentication Integration**: Seamless integration with existing auth service
- **Real-time Updates**: WebSocket support for live balance updates
- **Comprehensive API**: RESTful API with full Swagger documentation
- **Database Migrations**: Automated schema management with Drizzle Kit
- **Error Handling**: Robust error handling and validation
- **Rate Limiting**: Built-in rate limiting and security headers

## 🏗️ Architecture

```
src/
├── config/           # Configuration files
├── db/              # Database schema and connection
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and helpers
├── services/        # Business logic layer
├── controllers/     # Request/response handling
├── routes/          # API route definitions
├── middlewares/     # Custom middleware functions
└── server.ts        # Main server file
```

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (high-performance web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT token validation with external auth service
- **Documentation**: Swagger/OpenAPI 3.0
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Access to existing auth service

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd evenly-backend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/evenly_db

# Server Configuration
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# Auth Service Configuration
AUTH_SERVICE_URL=http://localhost:3000
AUTH_SERVICE_API_KEY=your_auth_service_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8081
```

### 3. Database Setup

#### Option 1: Quick Setup (Recommended)
```bash
# Start development server (auto-migrates database)
npm run dev
```

#### Option 2: Manual Migration
```bash
# Initialize database with all tables
npm run db:init

# Start development server
npm run dev
```

#### Option 3: Production Commands
```bash
# Run migration and start production server
npm run start:migrate
```

#### Option 4: Manual Drizzle Commands
```bash
# Generate database migrations
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or push schema directly (for development)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### 4. Start Development Server

```bash
# Start with hot reload
npm run dev

# Or build and start production
npm run build
npm start
```

The server will start on `http://localhost:3001`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI Spec**: http://localhost:3001/docs/json

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm start           # Start production server

# Database
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm test            # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🗄️ Database Schema

### Core Tables

- **users**: User information (synced from auth service)
- **groups**: Expense-sharing groups
- **group_members**: Group membership and roles
- **expenses**: Shared expenses
- **expense_splits**: How expenses are split among users
- **user_balances**: Running balances per user per group
- **payments**: Payment records and settlements
- **notifications**: User notifications
- **group_invitations**: Group invitation system

### Key Relationships

```
groups (1) ←→ (many) group_members ←→ (1) users
groups (1) ←→ (many) expenses ←→ (many) expense_splits ←→ (1) users
groups (1) ←→ (many) user_balances ←→ (1) users
groups (1) ←→ (many) payments ←→ (1) users
```

## 🔐 Authentication

The API integrates with your existing auth service:

1. **Token Validation**: All protected routes validate JWT tokens with the auth service
2. **User Sync**: Users are automatically synced from the auth service
3. **Authorization**: Group-based permissions (admin/member roles)

### Protected Routes

All API routes (except `/health`) require authentication:
```
Authorization: Bearer <jwt_token>
```

## 📊 API Endpoints

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/members` - Add member
- `GET /api/groups/:id/members` - Get members
- `DELETE /api/groups/:id/members/:userId` - Remove member

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/group/:groupId` - Get group expenses
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/categories` - Get expense categories

### Balances
- `GET /api/balances/user` - Get user's balances
- `GET /api/balances/group/:groupId` - Get group balances
- `GET /api/balances/group/:groupId/simplified-debts` - Get who owes whom
- `GET /api/balances/group/:groupId/summary` - Get balance summary

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments/user` - Get user's payments
- `GET /api/payments/group/:groupId` - Get group payments
- `PUT /api/payments/:id/status` - Update payment status
- `DELETE /api/payments/:id` - Delete payment

## 🧮 Expense Splitting Logic

### Supported Split Types

1. **Equal Split**: Divide expense equally among all members
2. **Percentage Split**: Custom percentage distribution
3. **Shares Split**: Weighted splitting (e.g., 2x, 1x, 0.5x shares)
4. **Exact Amount Split**: Specify exact amounts for each person

### Balance Calculation

- **Positive Balance**: User is owed money by others
- **Negative Balance**: User owes money to others
- **Real-time Updates**: Balances update automatically when expenses are added/modified

### Debt Simplification

The system uses a greedy algorithm to minimize the number of transactions needed to settle all debts:

```
Example:
- A owes B $50
- B owes C $30
- Simplified: A owes C $30, A owes B $20
```

## 🔄 Integration with Frontend

### API Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "pagination": { ... } // For paginated responses
}
```

### Error Handling

Errors follow this format:
```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [ ... ] // For validation errors
}
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/evenly_db
AUTH_SERVICE_URL=https://your-auth-service.com
CORS_ORIGIN=https://your-frontend.com
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### Logging

The application uses structured logging with different levels:
- **Development**: Debug level with pretty printing
- **Production**: Info level with JSON format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the code examples in the Swagger UI

---

**Built with ❤️ for the Evenly project**
