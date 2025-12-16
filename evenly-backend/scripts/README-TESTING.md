# Khata API Testing - Quick Start

## 🚀 Quick Test

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Run the test script:**
   ```bash
   npm run test:khata
   ```

That's it! The script will test all Khata API endpoints.

## 📋 What Gets Tested

The test script automatically tests:

1. ✅ Financial Summary (`GET /api/khata/summary`)
2. ✅ Get Customers (`GET /api/khata/customers`)
3. ✅ Create Customer (`POST /api/khata/customers`)
4. ✅ Get Customer By ID (`GET /api/khata/customers/:id`)
5. ✅ Update Customer (`PUT /api/khata/customers/:id`)
6. ✅ Create Transaction - You Gave (`POST /api/khata/transactions`)
7. ✅ Create Transaction - You Got (`POST /api/khata/transactions`)
8. ✅ Get Customer Transactions (`GET /api/khata/customers/:id/transactions`)
9. ✅ Get Customers with Filters (`GET /api/khata/customers?search=...`)
10. ✅ Get Customers with Sorting (`GET /api/khata/customers?sortType=...`)
11. ✅ Delete Customer (`DELETE /api/khata/customers/:id`)

## 🔧 Configuration

The test scripts are pre-configured with a default SSO token. You can override it by setting environment variables:

```bash
# Set API base URL (default: http://localhost:3002)
export API_BASE_URL=http://localhost:3002

# Override SSO token if needed (default token is already set in script)
export TEST_AUTH_TOKEN=your_sso_token_here
```

**Note:** The authentication uses `sso_token` cookie, not Bearer token. The default SSO token is already configured in the scripts.

## 📊 Expected Output

```
🚀 Starting Khata API Tests

📍 API Base URL: http://localhost:3001

ℹ️  Step 1: Authenticating...
✅ Authentication - PASSED
✅ Get Financial Summary - PASSED
✅ Get Customers - PASSED
✅ Create Customer - PASSED
...

============================================================
📊 TEST SUMMARY
============================================================
Total Tests: 12
✅ Passed: 12
❌ Failed: 0
Success Rate: 100.0%
============================================================
```

## 🛠️ Alternative Testing Methods

### Bash Script (cURL)
```bash
./scripts/test-khata-api.sh
```

### Manual Testing
See `TESTING_KHATA_API.md` for detailed cURL commands.

### Swagger UI
1. Start server: `npm run dev`
2. Open: http://localhost:3001/docs
3. Navigate to "Khata" section
4. Test endpoints interactively

## ❓ Troubleshooting

**Server not running?**
```bash
npm run dev
```

**Authentication errors?**
- Set `TEST_AUTH_TOKEN` in `.env`
- Or authenticate first via `/api/auth/login`

**Database errors?**
```bash
npm run db:push
```

For more details, see `TESTING_KHATA_API.md`

