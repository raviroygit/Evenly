# Deployment Guide

This guide explains how to deploy the Evenly Backend to Google Cloud Run with automatic secret management.

## Overview

The deployment system automatically:
1. **Detects** sensitive environment variables from your `.env` file
2. **Creates** missing secrets in Google Cloud Secret Manager
3. **Skips** secrets that already exist (unless you want to update them)
4. **Deploys** your app to Cloud Run with all secrets attached

## Quick Start

Simply run:

```bash
npm run deploy
```

That's it! The script will automatically:
- Parse your `.env` file
- Identify sensitive variables (API keys, secrets, passwords, database URLs, etc.)
- Create missing secrets in Google Cloud Secret Manager
- Build and deploy your application

## How It Works

### 1. Automatic Secret Detection

The system automatically identifies sensitive variables based on patterns:

**Variables that become secrets:**
- Contains `SECRET` (e.g., `JWT_SECRET`, `CLOUDINARY_API_SECRET`)
- Contains `PASSWORD` or ends with `_PASS` (e.g., `EMAIL_PASS`, `DB_PASSWORD`)
- Ends with `_KEY` or contains `API_KEY` (e.g., `CLOUDINARY_API_KEY`, `AUTH_SERVICE_API_KEY`)
- Contains `TOKEN` (e.g., `REFRESH_TOKEN`, `API_TOKEN`)
- Contains `DATABASE_URL` or `DB_URL` (e.g., `EVENLY_DATABASE_URL`)
- Contains `CLOUDINARY` (e.g., `CLOUDINARY_CLOUD_NAME`)

**Variables that stay as environment variables:**
- Configuration: `PORT`, `HOST`, `NODE_ENV`, `REGION`, etc.
- URLs without credentials: `BASE_URL`, `DOMAIN`, `ORIGIN1`, etc.
- Email config: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`
- Rate limits: `RATE_LIMIT_MAX`, `RATE_LIMIT_TIME_WINDOW`
- Swagger config: `SWAGGER_HOST`, `SWAGGER_SCHEMES`
- Time settings: `JWT_EXPIRES_IN`, `REFRESH_EXPIRES_IN`

### 2. Example from Your `.env`

From your current `.env` file, these will be **secrets**:
- `EVENLY_DATABASE_URL` (contains DATABASE_URL)
- `AUTH_SERVICE_API_KEY` (contains API_KEY)
- `JWT_SECRET` (contains SECRET)
- `EMAIL_PASS` (ends with _PASS)
- `CLOUDINARY_CLOUD_NAME` (contains CLOUDINARY)
- `CLOUDINARY_API_KEY` (contains CLOUDINARY + API_KEY)
- `CLOUDINARY_API_SECRET` (contains CLOUDINARY + SECRET)

These will be **regular environment variables**:
- `PORT`, `HOST`, `NODE_ENV`
- `GOOGLE_CLOUD_PROJECT`, `REGION`, `SERVICE_NAME`
- `BASE_URL`, `DOMAIN`, `ORIGIN1`, `ORIGIN2`
- `CORS_ORIGIN`, `CORS_ORIGIN1`
- `AUTH_SERVICE_URL`
- `JWT_EXPIRES_IN`
- `RATE_LIMIT_MAX`, `RATE_LIMIT_TIME_WINDOW`
- `SWAGGER_HOST`, `SWAGGER_SCHEMES`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `SUPPORT_EMAIL`
- `APP_BASE_URL`

## Available Commands

### `npm run deploy`
**Full deployment** - Manages secrets, builds, and deploys to Cloud Run
- Creates missing secrets
- Skips existing secrets
- Builds TypeScript
- Builds Docker image
- Deploys to Cloud Run

### `npm run secrets:list`
**List secrets** - Shows which variables will be treated as secrets
```bash
npm run secrets:list
```

Output:
```
🔒 Secrets that will be used in deployment:
   - EVENLY_DATABASE_URL
   - AUTH_SERVICE_API_KEY
   - JWT_SECRET
   - EMAIL_PASS
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
```

### `npm run secrets:sync`
**Sync secrets** - Creates missing secrets (skips existing ones)
```bash
npm run secrets:sync
```

This is useful if you:
- Added new secrets to your `.env` file
- Want to create secrets without deploying

### `npm run secrets:update`
**Update secrets** - Creates AND updates existing secrets with new values
```bash
npm run secrets:update
```

Use this when:
- You changed a secret value in `.env`
- You want to force update all secrets

## Adding New Secrets

1. Add the variable to your `.env` file:
   ```env
   NEW_API_KEY=your_secret_key_here
   ```

2. Run deployment:
   ```bash
   npm run deploy
   ```

The script will automatically detect it's sensitive (because it ends with `_KEY`) and create it as a secret!

## Updating Existing Secrets

If you change a secret value in your `.env` file:

**Option 1: Just deploy** (recommended)
```bash
npm run deploy
```
This will skip the existing secret and deploy with the old value.

**Option 2: Force update the secret**
```bash
npm run secrets:update
```
Then deploy:
```bash
npm run deploy
```

## Manual Secret Management

If you prefer to manage specific secrets manually:

### View a secret in Google Cloud:
```bash
gcloud secrets describe EVENLY_DATABASE_URL --project=nextgen-ai-dev
```

### Update a specific secret:
```bash
echo -n "new_value" | gcloud secrets versions add EVENLY_DATABASE_URL \
  --project=nextgen-ai-dev \
  --data-file=-
```

### Delete a secret:
```bash
gcloud secrets delete EVENLY_DATABASE_URL --project=nextgen-ai-dev
```

### List all secrets:
```bash
gcloud secrets list --project=nextgen-ai-dev
```

## Troubleshooting

### Secret not found error
If you see:
```
Secret projects/374738393915/secrets/SOME_SECRET/versions/latest was not found
```

**Solution:**
```bash
npm run secrets:sync
npm run deploy
```

### Secret exists but needs update
```bash
npm run secrets:update
npm run deploy
```

### Want to change what's treated as a secret?

Edit `scripts/manage-secrets.js`:

**To add a new pattern** (make more variables secrets):
```javascript
const SENSITIVE_PATTERNS = [
  /SECRET/i,
  /PASSWORD/i,
  /_PASS$/i,
  /_KEY$/i,
  /API_KEY/i,
  /TOKEN/i,
  /DATABASE_URL/i,
  /DB_URL/i,
  /CLOUDINARY/i,
  /YOUR_NEW_PATTERN/i  // Add here
];
```

**To exclude a variable** (prevent it from being a secret):
```javascript
const EXCLUDE_PATTERNS = [
  /^PORT$/,
  /^HOST$/,
  // ... existing patterns
  /^YOUR_VARIABLE$/  // Add here
];
```

## Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Rotate secrets regularly** - Use `npm run secrets:update` after changing values
3. **Use different secrets per environment** - Production secrets should be different from development
4. **Review the secrets list** - Run `npm run secrets:list` to verify what's being stored

## Architecture

```
.env file
    ↓
manage-secrets.js (parses and categorizes)
    ↓
Google Cloud Secret Manager (stores sensitive data)
    ↓
deploy.js (deploys with secrets attached)
    ↓
Cloud Run (app runs with secrets as env vars)
```

## Benefits of This System

✅ **Automatic** - No manual secret creation needed
✅ **Smart** - Automatically detects sensitive variables
✅ **Safe** - Only creates missing secrets, won't overwrite unless you want
✅ **Flexible** - Easy to customize patterns
✅ **Version Controlled** - Deployment script is in git, secrets are not
✅ **Consistent** - Same process for all developers
