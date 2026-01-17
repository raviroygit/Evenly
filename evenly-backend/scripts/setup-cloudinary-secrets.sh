#!/bin/bash

# Create Cloudinary secrets in Google Cloud Secret Manager
# Run this once to set up the secrets

echo "Creating Cloudinary secrets in Google Cloud Secret Manager..."

# Set your project ID
PROJECT_ID="nextgen-ai-dev"

# Create secrets from .env file
echo "codelength" | gcloud secrets create CLOUDINARY_CLOUD_NAME \
  --project=$PROJECT_ID \
  --data-file=- \
  --replication-policy="automatic" \
  2>/dev/null || echo "CLOUDINARY_CLOUD_NAME already exists, updating..."

echo "983787797957675" | gcloud secrets create CLOUDINARY_API_KEY \
  --project=$PROJECT_ID \
  --data-file=- \
  --replication-policy="automatic" \
  2>/dev/null || echo "CLOUDINARY_API_KEY already exists, updating..."

echo "BAh8q7a6EfVuEEeuMVQmShnJQvI" | gcloud secrets create CLOUDINARY_API_SECRET \
  --project=$PROJECT_ID \
  --data-file=- \
  --replication-policy="automatic" \
  2>/dev/null || echo "CLOUDINARY_API_SECRET already exists, updating..."

# If secrets exist, update them with new versions
echo "codelength" | gcloud secrets versions add CLOUDINARY_CLOUD_NAME --project=$PROJECT_ID --data-file=- || true
echo "983787797957675" | gcloud secrets versions add CLOUDINARY_API_KEY --project=$PROJECT_ID --data-file=- || true
echo "BAh8q7a6EfVuEEeuMVQmShnJQvI" | gcloud secrets versions add CLOUDINARY_API_SECRET --project=$PROJECT_ID --data-file=- || true

echo "✅ Cloudinary secrets created/updated successfully!"
echo ""
echo "Verify with:"
echo "gcloud secrets list --project=$PROJECT_ID --filter='name:CLOUDINARY'"
