#!/bin/bash
# Test signup-with-OTP (curl). Backend default: localhost:3002, Auth: localhost:8080.
#
# Prereqs: Auth at :8080, backend at :3002. Backend .env: AUTH_SERVICE_URL=http://localhost:8080/api/v1/auth, ORGANIZATION_ID.
#
# Usage:
#   ./scripts/test-signup-otp.sh                     # via backend (3002)
#   USE_AUTH_DIRECT=1 ./scripts/test-signup-otp.sh   # via auth only (8080)
#   OTP=123456 ./scripts/test-signup-otp.sh          # verify with code from email

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3002/api}"
AUTH_URL="${AUTH_URL:-http://localhost:8080/api/v1/auth}"
USE_AUTH_DIRECT="${USE_AUTH_DIRECT:-0}"
ORG_HEADER="${ORG_HEADER:-X-Organization-Identifier: evenly}"
EMAIL="${EMAIL:-ravi@connxn.ai}"
NAME="${NAME:-Ravi}"
PHONE="${PHONE:-+14155552671}"

echo "Target: $([ "$USE_AUTH_DIRECT" = "1" ] && echo "$AUTH_URL" || echo "$BACKEND_URL")"
echo "Email: $EMAIL | Name: $NAME | Phone: $PHONE"
echo ""

# Step 1: Request signup OTP
echo "=== 1) Request signup OTP ==="
if [ "$USE_AUTH_DIRECT" = "1" ]; then
  RESP=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$AUTH_URL/signup/otp" \
    -H "Content-Type: application/json" \
    -H "$ORG_HEADER" \
    -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"phoneNumber\":\"$PHONE\"}")
else
  RESP=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$BACKEND_URL/auth/signup/otp" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"phoneNumber\":\"$PHONE\"}")
fi

HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
echo "HTTP $HTTP_CODE"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
  echo "Request OTP failed. Fix and retry before verifying."
  exit 1
fi

# Step 2: Verify OTP (if OTP provided)
OTP="${OTP:-$1}"
if [ -n "$OTP" ]; then
  echo "=== 2) Verify signup OTP (code: $OTP) ==="
  if [ "$USE_AUTH_DIRECT" = "1" ]; then
    RESP2=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$AUTH_URL/signup/verify-otp" \
      -H "Content-Type: application/json" \
      -H "$ORG_HEADER" \
      -d "{\"email\":\"$EMAIL\",\"otp\":\"$OTP\"}")
  else
    RESP2=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$BACKEND_URL/auth/signup/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"otp\":\"$OTP\"}")
  fi
  HTTP_CODE2=$(echo "$RESP2" | tail -n1)
  BODY2=$(echo "$RESP2" | sed '$d')
  echo "HTTP $HTTP_CODE2"
  echo "$BODY2" | jq . 2>/dev/null || echo "$BODY2"
else
  echo "=== 2) Verify OTP ==="
  echo "Check your email for the 6-digit code, then run:"
  echo "  OTP=XXXXXX $0"
  echo "  or: $0 XXXXXX"
fi
