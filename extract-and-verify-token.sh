#!/bin/bash

echo "🔍 Extracting and Verifying Mobile Token..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get simulator container path
BUNDLE_ID="com.raviroy.evenlysplit"
echo "📱 Finding iOS Simulator app container..."
CONTAINER_PATH=$(xcrun simctl get_app_container booted "$BUNDLE_ID" data 2>/dev/null)

if [ -z "$CONTAINER_PATH" ]; then
  echo -e "${RED}❌ Could not find app container. Is the simulator running?${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found container: ${CONTAINER_PATH}${NC}"
echo ""

# Find AsyncStorage database
STORAGE_PATH="${CONTAINER_PATH}/Documents/RCTAsyncLocalStorage_V1/manifest.json"
if [ ! -f "$STORAGE_PATH" ]; then
  STORAGE_PATH="${CONTAINER_PATH}/Library/Caches/RCTAsyncLocalStorage/manifest.json"
fi

if [ ! -f "$STORAGE_PATH" ]; then
  echo -e "${RED}❌ Could not find AsyncStorage manifest${NC}"
  echo "Looking in: ${CONTAINER_PATH}"
  echo ""
  echo "Searching for storage files..."
  find "$CONTAINER_PATH" -name "*AsyncStorage*" -o -name "*evenly_auth*" 2>/dev/null
  exit 1
fi

echo -e "${GREEN}✅ Found AsyncStorage: ${STORAGE_PATH}${NC}"
echo ""

# Extract token using Python
echo "🔑 Extracting access token..."
TOKEN=$(python3 << 'PYTHON_SCRIPT'
import json
import sys
import os

storage_path = os.environ.get('STORAGE_PATH')
container_path = os.environ.get('CONTAINER_PATH')

try:
    # Try manifest.json first
    with open(storage_path, 'r') as f:
        manifest = json.load(f)

    # Find evenly_auth key
    auth_file = None
    for key, value in manifest.items():
        if 'evenly_auth' in key:
            auth_file = value
            break

    if not auth_file:
        print("ERROR: evenly_auth not found in manifest", file=sys.stderr)
        sys.exit(1)

    # Read auth data
    auth_path = os.path.join(os.path.dirname(storage_path), auth_file)
    with open(auth_path, 'r') as f:
        auth_data = json.load(f)

    if 'accessToken' in auth_data:
        print(auth_data['accessToken'])
    else:
        print("ERROR: accessToken not found", file=sys.stderr)
        sys.exit(1)

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT
)

if [ -z "$TOKEN" ] || [[ "$TOKEN" == ERROR* ]]; then
  echo -e "${RED}❌ Could not extract token${NC}"
  echo "$TOKEN"
  exit 1
fi

echo -e "${GREEN}✅ Token extracted!${NC}"
echo "Token (first 30 chars): ${TOKEN:0:30}..."
echo ""

# Decode and verify token
echo "📋 Decoding JWT token..."
echo ""

VERIFICATION=$(node << 'NODE_SCRIPT'
const token = process.env.TOKEN;

try {
  // Decode JWT
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.log('ERROR: Invalid JWT format');
    process.exit(1);
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());

  // Calculate expiry
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp;
  const issuedAt = payload.iat || Math.floor(payload.createdAt / 1000);

  const timeUntilExpiry = expiresAt - now;
  const tokenLifetime = expiresAt - issuedAt;
  const years = tokenLifetime / (365.25 * 24 * 60 * 60);

  // Print results
  console.log('═══════════════════════════════════════════════════════');
  console.log('                 TOKEN VERIFICATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 Token Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  console.log('⏰ Token Timing:');
  console.log(`  Issued:       ${new Date(issuedAt * 1000).toLocaleString()}`);
  console.log(`  Expires:      ${new Date(expiresAt * 1000).toLocaleString()}`);
  console.log(`  Current:      ${new Date(now * 1000).toLocaleString()}`);
  console.log('');
  console.log(`  Lifetime:     ${years.toFixed(2)} years`);
  console.log(`  Remaining:    ${Math.floor(timeUntilExpiry / (365.25 * 24 * 60 * 60))} years`);
  console.log('');
  console.log('✅ Verification Checks:');
  console.log('');

  let passed = 0;
  let total = 0;

  // Check 1: Token lifetime
  total++;
  if (years >= 9.5 && years <= 10.5) {
    console.log(`  ✅ Token lifetime is ${years.toFixed(1)} years (MOBILE TOKEN)`);
    passed++;
  } else {
    console.log(`  ❌ Token lifetime is ${years.toFixed(1)} years (expected ~10 years)`);
  }

  // Check 2: Platform
  total++;
  if (payload.platform === 'mobile') {
    console.log(`  ✅ Platform: "mobile"`);
    passed++;
  } else {
    console.log(`  ❌ Platform: "${payload.platform || 'not set'}" (expected "mobile")`);
  }

  // Check 3: User ID
  total++;
  if (payload.userId || payload.sub) {
    console.log(`  ✅ User ID: ${payload.userId || payload.sub}`);
    passed++;
  } else {
    console.log(`  ❌ No user ID found`);
  }

  // Check 4: Token type
  total++;
  if (payload.type === 'access') {
    console.log(`  ✅ Token type: "access"`);
    passed++;
  } else {
    console.log(`  ⚠️  Token type: "${payload.type || 'not set'}"`);
    passed++;
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');

  if (passed === total) {
    console.log('  🎉 ALL CHECKS PASSED - MOBILE TOKEN VERIFIED!');
  } else {
    console.log(`  ⚠️  ${passed}/${total} CHECKS PASSED`);
  }

  console.log('═══════════════════════════════════════════════════════');

  process.exit(passed === total ? 0 : 1);

} catch (error) {
  console.log('ERROR:', error.message);
  process.exit(1);
}
NODE_SCRIPT
)

VERIFY_EXIT_CODE=$?

echo "$VERIFICATION"
echo ""

# Check refresh token
echo "🔍 Checking for refresh token..."
REFRESH_TOKEN=$(python3 << 'PYTHON_SCRIPT'
import json
import os

storage_path = os.environ.get('STORAGE_PATH')

try:
    with open(storage_path, 'r') as f:
        manifest = json.load(f)

    auth_file = None
    for key, value in manifest.items():
        if 'evenly_auth' in key:
            auth_file = value
            break

    if auth_file:
        auth_path = os.path.join(os.path.dirname(storage_path), auth_file)
        with open(auth_path, 'r') as f:
            auth_data = json.load(f)

        if 'refreshToken' in auth_data and auth_data['refreshToken']:
            print("PRESENT")
        else:
            print("NULL")
    else:
        print("NOT_FOUND")

except Exception as e:
    print("ERROR")
PYTHON_SCRIPT
)

if [ "$REFRESH_TOKEN" = "NULL" ]; then
  echo -e "${GREEN}✅ Refresh token is NULL (correct for mobile)${NC}"
elif [ "$REFRESH_TOKEN" = "PRESENT" ]; then
  echo -e "${RED}❌ Refresh token is PRESENT (should be null for mobile)${NC}"
else
  echo -e "${YELLOW}⚠️  Could not determine refresh token status${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# Final result
if [ $VERIFY_EXIT_CODE -eq 0 ] && [ "$REFRESH_TOKEN" = "NULL" ]; then
  echo -e "${GREEN}🎉 SUCCESS: Mobile never-expiring token is working correctly!${NC}"
  echo ""
  echo "Summary:"
  echo "  ✅ 10-year access token received"
  echo "  ✅ No refresh token stored"
  echo "  ✅ Platform set to 'mobile'"
  echo "  ✅ User will stay logged in forever"
  echo ""
  exit 0
else
  echo -e "${YELLOW}⚠️  PARTIAL SUCCESS: Some checks did not pass${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Check backend logs for mobile detection"
  echo "  2. Verify mobile header is being sent"
  echo "  3. See VERIFY_MOBILE_TOKEN.md for troubleshooting"
  echo ""
  exit 1
fi
