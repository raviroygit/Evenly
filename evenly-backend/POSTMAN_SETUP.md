# Postman Setup for Evenly Backend API

## 🔐 Authentication with SSO Token

The Evenly Backend API uses **cookie-based authentication** with `sso_token`, not Bearer token authentication.

## 📋 Method 1: Using Cookies Tab (Recommended)

### Step-by-Step:

1. **Open Postman** and create a new request

2. **Set the Request URL:**
   ```
   GET http://localhost:3002/api/khata/summary
   ```

3. **Go to the "Cookies" tab** (below the URL bar)

4. **Click "Add Cookie"** or manually add:
   - **Name:** `sso_token`
   - **Value:** `3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e`
   - **Domain:** `localhost` (or your server domain)
   - **Path:** `/`

5. **Send the request**

### Visual Guide:
```
┌─────────────────────────────────────────┐
│ GET http://localhost:3002/api/khata/... │
├─────────────────────────────────────────┤
│ Params │ Authorization │ Headers │ Body │ Cookies │ Tests │
│        │               │         │      │   ✓     │       │
└─────────────────────────────────────────┘

Cookies Tab:
┌─────────────────────────────────────────┐
│ Name        │ Value                     │
├─────────────────────────────────────────┤
│ sso_token   │ 3a2ab77166b160254d7908... │
└─────────────────────────────────────────┘
```

## 📋 Method 2: Using Headers Tab

If the Cookies tab doesn't work, you can manually set the Cookie header:

1. **Go to the "Headers" tab**

2. **Add a new header:**
   - **Key:** `Cookie`
   - **Value:** `sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e`

3. **Send the request**

### Example Header:
```
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
```

## 📋 Method 3: Using Postman Environment Variables

For easier management across multiple requests:

1. **Create/Edit Environment:**
   - Click the eye icon (👁️) in the top right
   - Click "Add" or select existing environment
   - Add variable:
     - **Variable:** `sso_token`
     - **Initial Value:** `3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e`
     - **Current Value:** (same as initial)

2. **Use in Cookies:**
   - In Cookies tab, set value to: `{{sso_token}}`

3. **Or use in Headers:**
   - In Headers tab, set Cookie header value to: `sso_token={{sso_token}}`

## 🧪 Testing Khata API Endpoints

### Example Requests:

#### 1. Get Financial Summary
```
GET http://localhost:3002/api/khata/summary
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
```

#### 2. Get All Customers
```
GET http://localhost:3002/api/khata/customers
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
```

#### 3. Create Customer
```
POST http://localhost:3002/api/khata/customers
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
Content-Type: application/json

Body (raw JSON):
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "notes": "Test customer"
}
```

#### 4. Get Customer By ID
```
GET http://localhost:3002/api/khata/customers/{customerId}
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
```

#### 5. Update Customer
```
PUT http://localhost:3002/api/khata/customers/{customerId}
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
Content-Type: application/json

Body (raw JSON):
{
  "name": "John Updated",
  "phone": "+9876543210"
}
```

#### 6. Create Transaction (You Gave)
```
POST http://localhost:3002/api/khata/transactions
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
Content-Type: application/json

Body (raw JSON):
{
  "customerId": "customer-uuid-here",
  "type": "give",
  "amount": "1000.00",
  "currency": "INR",
  "description": "Payment for services"
}
```

#### 7. Create Transaction (You Got)
```
POST http://localhost:3002/api/khata/transactions
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
Content-Type: application/json

Body (raw JSON):
{
  "customerId": "customer-uuid-here",
  "type": "get",
  "amount": "500.00",
  "currency": "INR",
  "description": "Received payment"
}
```

#### 8. Get Customer Transactions
```
GET http://localhost:3002/api/khata/customers/{customerId}/transactions
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
```

#### 9. Delete Customer
```
DELETE http://localhost:3002/api/khata/customers/{customerId}
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
```

## ⚠️ Common Mistakes

### ❌ Wrong: Using Authorization Header
```
Authorization: Bearer 3a2ab77166b160254d7908a3ca517243...
```
This will NOT work! The API expects cookies, not Bearer tokens.

### ✅ Correct: Using Cookie Header
```
Cookie: sso_token=3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e
```

## 🔍 Verifying Authentication

If authentication is working, you should:
- ✅ Get 200 status codes (or 201 for POST)
- ✅ Receive JSON responses with data
- ❌ NOT get 401 Unauthorized errors

If you get 401 errors:
- Check that the cookie is set correctly
- Verify the token value is correct (including the `%3A` encoding)
- Make sure you're using `Cookie` header, not `Authorization`

## 📦 Import Postman Collection

You can also create a Postman Collection with all endpoints pre-configured. Here's a basic structure:

```json
{
  "info": {
    "name": "Evenly Backend - Khata API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3002",
      "type": "string"
    },
    {
      "key": "sso_token",
      "value": "3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Get Financial Summary",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Cookie",
            "value": "sso_token={{sso_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/khata/summary",
          "host": ["{{base_url}}"],
          "path": ["api", "khata", "summary"]
        }
      }
    }
  ]
}
```

## 🎯 Quick Setup Checklist

- [ ] Postman installed
- [ ] Server running on `http://localhost:3002`
- [ ] SSO token copied: `3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e`
- [ ] Cookie set in Postman (Cookies tab or Headers tab)
- [ ] Test request sent successfully

## 💡 Pro Tips

1. **Use Environment Variables**: Store `sso_token` and `base_url` in Postman environment for easy switching
2. **Save Requests**: Save frequently used requests in a collection
3. **Use Pre-request Scripts**: Automatically set cookies for all requests in a collection
4. **Check Response**: Always check the response status and body to verify authentication worked

