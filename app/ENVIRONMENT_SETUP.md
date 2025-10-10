# Environment Configuration Setup

This document explains how to configure environment variables for the Evenly app.

## Frontend (React Native/Expo)

### 1. Create Environment File
Copy the example environment file:
```bash
cp env.example .env
```

### 2. Update Environment Variables
Edit `.env` file with your actual values:

```env
# API URLs
EXPO_PUBLIC_AUTH_SERVICE_URL=https://nxgenaidev-auth-api-541410644975.us-central1.run.app/api/v1/auth
EXPO_PUBLIC_EVENLY_BACKEND_URL=https://your-ngrok-url.ngrok-free.app/api

# App Configuration
EXPO_PUBLIC_APP_NAME=Evenly
EXPO_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=development
```

### 3. Important Notes
- All environment variables for Expo must be prefixed with `EXPO_PUBLIC_` to be accessible in the app
- The `.env` file should be added to `.gitignore` to keep sensitive data secure
- Restart the Expo development server after changing environment variables

## Backend (Node.js/Fastify)

### 1. Create Environment File
Copy the example environment file:
```bash
cp env.example .env
```

### 2. Update Environment Variables
Edit `.env` file with your actual values:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=your_neon_database_url_here

# Auth Service
AUTH_SERVICE_URL=https://nxgenaidev-auth-api-541410644975.us-central1.run.app/api/v1/auth
AUTH_SERVICE_API_KEY=your_auth_service_api_key_here
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# App Configuration
APP_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### 3. Important Notes
- The `.env` file should be added to `.gitignore` to keep sensitive data secure
- Restart the backend server after changing environment variables
- Make sure the `APP_BASE_URL` matches your current ngrok URL

## Usage in Code

### Frontend
```typescript
import { ENV } from '../config/env';

// Use environment variables
const apiUrl = ENV.EVENLY_BACKEND_URL;
const authUrl = ENV.AUTH_SERVICE_URL;
```

### Backend
```typescript
import { config } from './config/config';

// Use environment variables
const port = config.server.port;
const dbUrl = config.database.url;
```

## Updating URLs

When you get a new ngrok URL, simply edit the `.env` files:

1. **Frontend**: Edit `evenly/.env` and update `EXPO_PUBLIC_EVENLY_BACKEND_URL`
2. **Backend**: Edit `evenly-backend/.env` and update `APP_BASE_URL`
3. **Restart** both frontend and backend servers

## Security

- Never commit `.env` files to version control
- Use different environment files for development, staging, and production
- Keep sensitive data like API keys and database URLs secure
