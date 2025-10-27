# Evenly Backend - Google Cloud Run Deployment

This document explains how to deploy the Evenly Backend to Google Cloud Run.

## Prerequisites

1. **Google Cloud SDK**: Install and configure gcloud CLI
2. **Project Setup**: Ensure you have access to the `nextgen-ai-dev` project
3. **APIs Enabled**: Cloud Build, Cloud Run, and Container Registry APIs
4. **Billing**: Enabled on the project

## Quick Start

1. **Set up environment variables**:
   ```bash
   cp env.cloudrun.example .env
   # Edit .env with your actual values
   ```

2. **Deploy to Cloud Run**:
   ```bash
   npm run deploy
   ```

## Manual Deployment Steps

### 1. Build TypeScript
```bash
npm run build
```

### 2. Build Docker Image
```bash
gcloud builds submit --config cloudbuild.yaml
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy evenly-backend \
  --image gcr.io/nextgen-ai-dev/evenly-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 1000 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,PORT=8080,HOST=0.0.0.0 \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest
```

## Environment Variables

### Required Secrets (use Google Cloud Secret Manager)
- `EVENLY_DATABASE_URL`: Neon database connection string
- `AUTH_SERVICE_API_KEY`: API key for auth service
- `JWT_SECRET`: JWT signing secret
- `EMAIL_PASS`: Email service password

### Environment Variables
- `NODE_ENV`: Set to `production`
- `PORT`: Set to `8080` (Cloud Run requirement)
- `HOST`: Set to `0.0.0.0` (Cloud Run requirement)
- `AUTH_SERVICE_URL`: URL of the auth service
- `CORS_ORIGIN`: Allowed CORS origins

## Service URLs

After deployment, your service will be available at:
- **API Base**: `https://evenly-backend-374738393915.us-central1.run.app`
- **Health Check**: `https://evenly-backend-374738393915.us-central1.run.app/health`
- **API Documentation**: `https://evenly-backend-374738393915.us-central1.run.app/docs`

## Configuration Files

- `Dockerfile`: Multi-stage build optimized for Cloud Run
- `cloudbuild.yaml`: Google Cloud Build configuration
- `scripts/deploy.js`: Automated deployment script
- `.gcloudignore`: Files to exclude from deployment
- `env.cloudrun.example`: Environment variables template

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Runtime Errors**: Verify environment variables and secrets
3. **Health Check Failures**: Ensure `/health` endpoint is working
4. **CORS Issues**: Update `CORS_ORIGIN` environment variable

### Logs
```bash
gcloud logs read --project=nextgen-ai-dev --service=evenly-backend
```

### Service Status
```bash
gcloud run services describe evenly-backend --region=us-central1 --project=nextgen-ai-dev
```

## Security Notes

- Secrets are managed through Google Cloud Secret Manager
- The service runs with minimal permissions
- CORS is configured for specific origins
- Rate limiting is enabled in production

## Cost Optimization

- Uses minimal resources (1 CPU, 512Mi memory)
- Scales to zero when not in use
- Optimized Docker image with multi-stage build
- Only production dependencies in final image
