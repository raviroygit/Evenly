#!/bin/bash

# Deploy evenly-backend to Google Cloud Run with Email Secrets
# This script ensures all email configuration is properly set from Secret Manager

set -e

PROJECT_ID="nextgen-ai-dev"
REGION="us-central1"
SERVICE_NAME="evenly-backend"

echo "🚀 Deploying Evenly Backend to Google Cloud Run"
echo "================================================"
echo ""

echo "📦 Building and deploying service..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="HOST=0.0.0.0" \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="AUTH_SERVICE_URL=https://nxgenaidev-auth-api-374738393915.us-central1.run.app/api/v1/auth" \
  --set-env-vars="JWT_EXPIRES_IN=7d" \
  --set-env-vars="CORS_ORIGIN=http://localhost:3000" \
  --set-env-vars="CORS_ORIGIN1=https://evenlysplit.nxtgenaidev.com" \
  --set-env-vars="RATE_LIMIT_MAX=10000" \
  --set-env-vars="RATE_LIMIT_TIME_WINDOW=60000" \
  --set-env-vars="APP_BASE_URL=https://evenly-backend-374738393915.us-central1.run.app/api/v1" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=nextgen-ai-dev" \
  --set-env-vars="REGION=us-central1" \
  --set-env-vars="SERVICE_NAME=evenly-backend" \
  --set-env-vars="BASE_URL=https://evenly-backend-374738393915.us-central1.run.app" \
  --set-env-vars="DOMAIN=https://evenly-backend-374738393915.us-central1.run.app" \
  --set-env-vars="ORIGIN1=http://localhost:3000" \
  --set-env-vars="ORIGIN2=https://www.evenly.app" \
  --update-secrets="EVENLY_DATABASE_URL=EVENLY_DATABASE_URL:latest" \
  --update-secrets="AUTH_SERVICE_API_KEY=AUTH_SERVICE_API_KEY:latest" \
  --update-secrets="JWT_SECRET=JWT_SECRET:latest" \
  --update-secrets="EMAIL_HOST=EMAIL_HOST:latest" \
  --update-secrets="EMAIL_PORT=EMAIL_PORT:latest" \
  --update-secrets="EMAIL_SECURE=EMAIL_SECURE:latest" \
  --update-secrets="EMAIL_USER=EMAIL_USER:latest" \
  --update-secrets="EMAIL_PASS=EMAIL_PASS:latest" \
  --update-secrets="SUPPORT_EMAIL=SUPPORT_EMAIL:latest" \
  --update-secrets="CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest" \
  --update-secrets="CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest" \
  --update-secrets="CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📧 Email configuration (from Secret Manager):"
echo "  - EMAIL_HOST: smtp.zoho.in"
echo "  - EMAIL_PORT: 465"
echo "  - EMAIL_SECURE: true"
echo "  - EMAIL_USER: no-reply@nxtgenaidev.com"
echo "  - EMAIL_PASS: ******** (secret)"
echo "  - SUPPORT_EMAIL: ravi140398@gmail.com"
echo ""
echo "🔗 Service URL: https://evenly-backend-374738393915.us-central1.run.app"
echo ""
echo "🧪 Test invitation emails:"
echo "  1. Login to mobile app"
echo "  2. Create/open a group"
echo "  3. Send invitation to test email"
echo "  4. Check logs: gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --limit=50"
echo ""
echo "✅ Done! Invitation emails should now work in production."
