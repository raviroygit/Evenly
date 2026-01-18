#!/bin/bash

# Quick update to add email secrets to evenly-backend Cloud Run service
# This doesn't redeploy the code, just updates the environment variables

set -e

PROJECT_ID="nextgen-ai-dev"
REGION="us-central1"
SERVICE_NAME="evenly-backend"

echo "🔄 Updating evenly-backend email configuration..."
echo ""

echo "📧 Setting email environment variables from Secret Manager..."
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --update-secrets="EMAIL_HOST=EMAIL_HOST:latest,EMAIL_PORT=EMAIL_PORT:latest,EMAIL_SECURE=EMAIL_SECURE:latest,EMAIL_USER=EMAIL_USER:latest,EMAIL_PASS=EMAIL_PASS:latest,SUPPORT_EMAIL=SUPPORT_EMAIL:latest"

echo ""
echo "✅ Email configuration updated!"
echo ""
echo "📧 Email settings (from Secret Manager):"
echo "  - EMAIL_HOST: smtp.zoho.in"
echo "  - EMAIL_PORT: 465"
echo "  - EMAIL_SECURE: true"
echo "  - EMAIL_USER: no-reply@nxtgenaidev.com"
echo "  - EMAIL_PASS: ******** (secret)"
echo "  - SUPPORT_EMAIL: ravi140398@gmail.com"
echo ""
echo "🔄 Service is restarting with new configuration..."
echo ""
echo "🧪 Test invitation emails in a few seconds:"
echo "  1. Login to mobile app"
echo "  2. Send a group invitation"
echo "  3. Check if email arrives"
echo ""
echo "📋 View logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --limit=50"
echo ""
echo "✅ Done!"
