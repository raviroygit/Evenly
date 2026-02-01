# Token Blacklist Security System

## Overview

Since mobile tokens never expire (10 years), we need a mechanism to revoke compromised tokens. This document outlines a token blacklist system for the shared auth system.

---

## Problem Statement

**Current Situation:**
- Mobile tokens are valid for 10 years
- Once issued, they cannot be revoked
- If a device is stolen or token is compromised, the token remains valid
- User has no way to remotely logout from a specific device

**Security Risks:**
1. Stolen device = permanent access (until token naturally expires in 10 years)
2. Compromised token = no revocation mechanism
3. Lost device = cannot remotely disconnect
4. No visibility into active sessions

**Solution Needed:**
- Ability to revoke specific tokens
- Remote device logout
- View all active sessions
- Automatic cleanup of old blacklist entries

---

## Architecture

### High-Level Design

```
┌─────────────────┐
│  Mobile App     │
│  Token: ABC123  │
└────────┬────────┘
         │
         │ API Request with token
         ▼
┌─────────────────────────┐
│  Auth Middleware        │
│                         │
│  1. Extract token       │
│  2. Check blacklist     │◄────┐
│  3. Allow/Deny          │     │
└────────┬────────────────┘     │
         │                      │
         │ Token valid           │
         ▼                      │
┌─────────────────────────┐    │
│  API Handler            │    │
│  Process request        │    │
└─────────────────────────┘    │
                               │
┌──────────────────────────────┴────┐
│  Token Blacklist (Redis)          │
│                                   │
│  Key: token_hash                  │
│  Value: {                         │
│    userId, deviceId,              │
│    revokedAt, reason              │
│  }                                │
│  TTL: 10 years                    │
└───────────────────────────────────┘
```

---

## Database Schema

### MongoDB Collection: `tokenBlacklist`

```typescript
interface TokenBlacklistEntry {
  _id: ObjectId;
  tokenHash: string;           // SHA256 hash of token (indexed)
  userId: string;              // User who owned the token
  deviceId?: string;           // Device identifier (if available)
  deviceInfo?: {
    platform: string;          // 'ios', 'android', 'web'
    appVersion?: string;
    osVersion?: string;
    lastIP?: string;
  };
  revokedAt: Date;             // When token was revoked
  revokedBy?: string;          // Who revoked it (userId or 'system')
  reason: string;              // 'user_logout', 'stolen_device', 'security_breach', 'admin_action'
  expiresAt: Date;             // When token would naturally expire (for cleanup)

  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.tokenBlacklist.createIndex({ tokenHash: 1 }, { unique: true });
db.tokenBlacklist.createIndex({ userId: 1 });
db.tokenBlacklist.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
db.tokenBlacklist.createIndex({ revokedAt: 1 });
```

### Redis Cache (for fast lookups)

```
Key: blacklist:token:<token_hash>
Value: "1" (simple boolean flag)
TTL: 10 years (match token expiry)

Key: blacklist:user:<userId>
Value: Set of token hashes
TTL: 10 years
```

---

## Implementation

### 1. Token Hashing Utility

**File:** `AuthSystem/nxgenaidev_auth/src/utils/tokenHash.ts`

```typescript
import crypto from 'crypto';

export class TokenHasher {
  /**
   * Generate SHA256 hash of token for storage
   * We hash tokens so we don't store raw JWTs in the database
   */
  static hash(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Verify a token matches a hash
   */
  static verify(token: string, hash: string): boolean {
    return this.hash(token) === hash;
  }
}
```

### 2. Token Blacklist Model

**File:** `AuthSystem/nxgenaidev_auth/src/models/tokenBlacklist.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenBlacklist extends Document {
  tokenHash: string;
  userId: string;
  deviceId?: string;
  deviceInfo?: {
    platform: string;
    appVersion?: string;
    osVersion?: string;
    lastIP?: string;
  };
  revokedAt: Date;
  revokedBy?: string;
  reason: 'user_logout' | 'stolen_device' | 'security_breach' | 'admin_action' | 'suspicious_activity';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
  },
  deviceInfo: {
    platform: String,
    appVersion: String,
    osVersion: String,
    lastIP: String,
  },
  revokedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  revokedBy: {
    type: String,
  },
  reason: {
    type: String,
    enum: ['user_logout', 'stolen_device', 'security_breach', 'admin_action', 'suspicious_activity'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// TTL index - automatically delete entries after token naturally expires
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenBlacklist = mongoose.model<ITokenBlacklist>('TokenBlacklist', tokenBlacklistSchema);
```

### 3. Token Blacklist Service

**File:** `AuthSystem/nxgenaidev_auth/src/services/tokenBlacklist.service.ts`

```typescript
import { TokenBlacklist, ITokenBlacklist } from '../models/tokenBlacklist.model';
import { TokenHasher } from '../utils/tokenHash';
import { redisClient } from '../config/redis';

export class TokenBlacklistService {
  /**
   * Add a token to the blacklist
   */
  static async revokeToken(
    token: string,
    userId: string,
    reason: ITokenBlacklist['reason'],
    options?: {
      deviceId?: string;
      deviceInfo?: any;
      revokedBy?: string;
    }
  ): Promise<void> {
    const tokenHash = TokenHasher.hash(token);

    // Decode token to get expiry
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expiresAt = new Date(payload.exp * 1000);

    // Add to MongoDB
    await TokenBlacklist.create({
      tokenHash,
      userId,
      deviceId: options?.deviceId,
      deviceInfo: options?.deviceInfo,
      revokedAt: new Date(),
      revokedBy: options?.revokedBy,
      reason,
      expiresAt,
    });

    // Add to Redis for fast lookup
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    await redisClient.setex(`blacklist:token:${tokenHash}`, ttl, '1');

    // Add to user's blacklist set
    await redisClient.sadd(`blacklist:user:${userId}`, tokenHash);
    await redisClient.expire(`blacklist:user:${userId}`, ttl);

    console.log(`✅ Token revoked for user ${userId}, reason: ${reason}`);
  }

  /**
   * Check if a token is blacklisted
   * FAST CHECK: Uses Redis for O(1) lookup
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = TokenHasher.hash(token);

    // Check Redis first (fast)
    const inRedis = await redisClient.exists(`blacklist:token:${tokenHash}`);
    if (inRedis) {
      return true;
    }

    // Fallback to MongoDB (slower, but handles cache misses)
    const entry = await TokenBlacklist.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() }, // Only check non-expired entries
    });

    // If found in MongoDB but not in Redis, add to Redis
    if (entry) {
      const ttl = Math.floor((entry.expiresAt.getTime() - Date.now()) / 1000);
      await redisClient.setex(`blacklist:token:${tokenHash}`, ttl, '1');
      return true;
    }

    return false;
  }

  /**
   * Revoke all tokens for a user
   * Used when user logs out from all devices
   */
  static async revokeAllUserTokens(
    userId: string,
    reason: ITokenBlacklist['reason'],
    revokedBy?: string
  ): Promise<number> {
    // Get all token hashes for this user from Redis
    const tokenHashes = await redisClient.smembers(`blacklist:user:${userId}`);

    // Note: This only revokes tokens we know about
    // For complete logout, consider storing active sessions separately

    console.log(`Revoking ${tokenHashes.length} tokens for user ${userId}`);

    // Mark all as revoked in MongoDB
    const result = await TokenBlacklist.updateMany(
      { userId },
      {
        $set: {
          revokedAt: new Date(),
          revokedBy,
          reason,
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get all active sessions for a user
   * Returns list of non-revoked tokens
   */
  static async getUserActiveSessions(userId: string): Promise<ITokenBlacklist[]> {
    // This requires storing active tokens separately
    // See "Active Session Tracking" section below

    // For now, return blacklisted tokens
    return TokenBlacklist.find({
      userId,
      expiresAt: { $gt: new Date() },
    }).sort({ revokedAt: -1 });
  }

  /**
   * Remove a token from blacklist (unrevoke)
   * Used for testing or error correction
   */
  static async unrevokeToken(token: string): Promise<void> {
    const tokenHash = TokenHasher.hash(token);

    await TokenBlacklist.deleteOne({ tokenHash });
    await redisClient.del(`blacklist:token:${tokenHash}`);

    console.log(`Token ${tokenHash} removed from blacklist`);
  }

  /**
   * Clean up expired blacklist entries
   * Run as a cron job (MongoDB TTL index should handle this automatically)
   */
  static async cleanupExpiredEntries(): Promise<number> {
    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(`Cleaned up ${result.deletedCount} expired blacklist entries`);
    return result.deletedCount;
  }
}
```

### 4. Authentication Middleware

**File:** `AuthSystem/nxgenaidev_auth/src/middlewares/checkBlacklist.middleware.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenBlacklistService } from '../services/tokenBlacklist.service';

/**
 * Middleware to check if token is blacklisted
 * Add this AFTER JWT verification middleware
 */
export async function checkTokenBlacklist(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // No token, let other middleware handle it
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(token);

    if (isBlacklisted) {
      console.warn(`⚠️ Blacklisted token attempted access:`, {
        userId: (request as any).user?.userId,
        ip: request.ip,
        path: request.url,
      });

      return reply.status(401).send({
        success: false,
        message: 'This session has been revoked. Please login again.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Token is valid, continue
  } catch (error) {
    console.error('Blacklist check error:', error);
    // Don't block request on blacklist check error
    // Log error and continue for availability
  }
}
```

### 5. API Endpoints

**File:** `AuthSystem/nxgenaidev_auth/src/routes/token.routes.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { TokenController } from '../controllers/token.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

export async function tokenRoutes(server: FastifyInstance) {
  // Revoke current token (logout this device)
  server.post('/token/revoke', {
    preHandler: [authenticateJWT],
    handler: TokenController.revokeCurrentToken,
  });

  // Revoke all tokens (logout all devices)
  server.post('/token/revoke-all', {
    preHandler: [authenticateJWT],
    handler: TokenController.revokeAllTokens,
  });

  // Get active sessions
  server.get('/token/sessions', {
    preHandler: [authenticateJWT],
    handler: TokenController.getActiveSessions,
  });

  // Revoke specific token (admin only)
  server.post('/admin/token/revoke', {
    preHandler: [authenticateJWT], // Add admin check middleware
    handler: TokenController.adminRevokeToken,
  });
}
```

**File:** `AuthSystem/nxgenaidev_auth/src/controllers/token.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenBlacklistService } from '../services/tokenBlacklist.service';

export class TokenController {
  /**
   * Revoke current token (logout this device)
   */
  static async revokeCurrentToken(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const token = request.headers.authorization?.substring(7) || '';
      const userId = (request as any).user.userId;

      await TokenBlacklistService.revokeToken(token, userId, 'user_logout', {
        revokedBy: userId,
      });

      return reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to revoke token',
      });
    }
  }

  /**
   * Revoke all tokens (logout all devices)
   */
  static async revokeAllTokens(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.userId;

      const count = await TokenBlacklistService.revokeAllUserTokens(
        userId,
        'user_logout',
        userId
      );

      return reply.send({
        success: true,
        message: `Logged out from ${count} devices`,
        count,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to revoke tokens',
      });
    }
  }

  /**
   * Get active sessions for current user
   */
  static async getActiveSessions(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.userId;

      const sessions = await TokenBlacklistService.getUserActiveSessions(userId);

      return reply.send({
        success: true,
        sessions: sessions.map(s => ({
          deviceId: s.deviceId,
          deviceInfo: s.deviceInfo,
          revokedAt: s.revokedAt,
          reason: s.reason,
        })),
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to get sessions',
      });
    }
  }

  /**
   * Admin: Revoke any user's token
   */
  static async adminRevokeToken(
    request: FastifyRequest<{ Body: { userId: string; reason: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, reason } = request.body;
      const adminId = (request as any).user.userId;

      // TODO: Add admin permission check

      const count = await TokenBlacklistService.revokeAllUserTokens(
        userId,
        'admin_action',
        adminId
      );

      return reply.send({
        success: true,
        message: `Revoked ${count} tokens for user ${userId}`,
        count,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to revoke tokens',
      });
    }
  }
}
```

### 6. Register Middleware

**File:** `AuthSystem/nxgenaidev_auth/src/app.ts`

```typescript
import { checkTokenBlacklist } from './middlewares/checkBlacklist.middleware';

// Register blacklist check globally (after JWT verification)
server.addHook('onRequest', async (request, reply) => {
  // Skip blacklist check for public routes
  const publicPaths = ['/auth/login', '/auth/signup', '/health'];
  if (publicPaths.some(path => request.url.startsWith(path))) {
    return;
  }

  // Check blacklist for authenticated routes
  await checkTokenBlacklist(request, reply);
});
```

---

## Active Session Tracking (Optional Enhancement)

To show users their active sessions, we need to track token issuance:

### MongoDB Collection: `activeSessions`

```typescript
interface ActiveSession {
  _id: ObjectId;
  tokenHash: string;
  userId: string;
  deviceId: string;
  deviceInfo: {
    platform: 'ios' | 'android' | 'web';
    appVersion: string;
    osVersion: string;
    deviceName?: string;
  };
  issuedAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  lastIP: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**When token is issued:**
```typescript
// In auth.controller.ts after generating token
await ActiveSession.create({
  tokenHash: TokenHasher.hash(accessToken),
  userId: user.id,
  deviceId: request.headers['x-device-id'],
  deviceInfo: {
    platform: request.headers['x-client-type'],
    appVersion: request.headers['x-app-version'],
    osVersion: request.headers['x-os-version'],
  },
  issuedAt: new Date(),
  expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
  lastUsedAt: new Date(),
  lastIP: request.ip,
});
```

**Update last used on each request:**
```typescript
// In middleware
await ActiveSession.updateOne(
  { tokenHash },
  { lastUsedAt: new Date(), lastIP: request.ip }
);
```

---

## Mobile App Integration

### 1. Update Mobile App to Handle Token Revocation

**File:** `Evenly/app/src/services/EvenlyApiClient.ts`

```typescript
// In response interceptor
this.client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check if token was revoked
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_REVOKED') {
      console.log('[EvenlyApiClient] Token was revoked - logging out');

      // Clear local auth data
      await AuthStorage.clearAuthData();

      // Show message to user
      Alert.alert(
        'Session Expired',
        'Your session has been revoked. Please login again.',
        [{ text: 'OK', onPress: () => {
          // Navigate to login screen
          router.replace('/auth/login');
        }}]
      );

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
```

### 2. Add "Logout from All Devices" Feature

**File:** `Evenly/app/src/screens/ProfileScreen.tsx`

```typescript
const logoutFromAllDevices = async () => {
  Alert.alert(
    'Logout from All Devices',
    'This will log you out from all devices including this one. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout All',
        style: 'destructive',
        onPress: async () => {
          try {
            await EvenlyBackendService.revokeAllTokens();
            await AuthStorage.clearAuthData();
            router.replace('/auth/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout from all devices');
          }
        },
      },
    ]
  );
};

// In render
<Button title="Logout from All Devices" onPress={logoutFromAllDevices} />
```

### 3. Add "Active Sessions" Screen

**File:** `Evenly/app/src/screens/ActiveSessionsScreen.tsx`

```typescript
export function ActiveSessionsScreen() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const response = await EvenlyBackendService.getActiveSessions();
    setSessions(response.sessions);
  };

  const revokeSession = async (sessionId: string) => {
    await EvenlyBackendService.revokeSession(sessionId);
    loadSessions();
  };

  return (
    <View>
      <Text>Active Sessions</Text>
      {sessions.map(session => (
        <View key={session.id}>
          <Text>{session.deviceInfo.platform}</Text>
          <Text>Last used: {session.lastUsedAt}</Text>
          <Button title="Revoke" onPress={() => revokeSession(session.id)} />
        </View>
      ))}
    </View>
  );
}
```

---

## Performance Considerations

### 1. Redis Caching Strategy

- **Primary Check:** Redis (O(1) lookup, ~1ms)
- **Fallback:** MongoDB (indexed query, ~10ms)
- **TTL:** Match token expiry (10 years for mobile)

### 2. Batch Operations

For revoking multiple tokens:
```typescript
// Use Redis pipeline for bulk operations
const pipeline = redisClient.pipeline();
tokenHashes.forEach(hash => {
  pipeline.setex(`blacklist:token:${hash}`, ttl, '1');
});
await pipeline.exec();
```

### 3. Lazy Cleanup

- Don't actively delete expired entries
- Use MongoDB TTL index for automatic cleanup
- Redis handles TTL automatically

### 4. Monitoring

```typescript
// Track blacklist check performance
const start = Date.now();
const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(token);
const duration = Date.now() - start;

if (duration > 10) {
  console.warn(`Slow blacklist check: ${duration}ms`);
}
```

---

## Security Considerations

### 1. Rate Limiting

Add rate limiting to revocation endpoints:
```typescript
server.register(rateLimitPlugin, {
  max: 5, // 5 requests
  timeWindow: '1 minute',
  keyGenerator: (request) => (request as any).user.userId,
});
```

### 2. Audit Logging

Log all revocation actions:
```typescript
await AuditLog.create({
  userId,
  action: 'token_revoked',
  reason,
  revokedBy,
  tokenHash: TokenHasher.hash(token).substring(0, 8), // Partial hash
  timestamp: new Date(),
  ip: request.ip,
});
```

### 3. Admin Controls

- Only allow admins to revoke other users' tokens
- Require reason for admin revocations
- Send email notifications when tokens are revoked

### 4. Brute Force Protection

```typescript
// Track failed attempts with revoked tokens
const attempts = await redisClient.incr(`revoked_attempts:${tokenHash}`);
if (attempts > 10) {
  // Block IP or take other action
  await SecurityService.blockIP(request.ip, 'excessive_revoked_token_usage');
}
```

---

## Testing

### Unit Tests

```typescript
describe('TokenBlacklistService', () => {
  it('should revoke a token', async () => {
    await TokenBlacklistService.revokeToken(token, userId, 'user_logout');
    const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(token);
    expect(isBlacklisted).toBe(true);
  });

  it('should not blacklist valid tokens', async () => {
    const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(validToken);
    expect(isBlacklisted).toBe(false);
  });

  it('should revoke all user tokens', async () => {
    const count = await TokenBlacklistService.revokeAllUserTokens(userId, 'security_breach');
    expect(count).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```bash
# Test token revocation
curl -X POST http://localhost:8001/api/v1/token/revoke \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Verify token is blacklisted
curl -X GET http://localhost:8001/api/v1/groups \
  -H "Authorization: Bearer <revoked-token>"

# Expected: 401 with TOKEN_REVOKED code
```

---

## Deployment Checklist

- [ ] Create MongoDB indexes
- [ ] Configure Redis TTL
- [ ] Deploy blacklist middleware
- [ ] Deploy token routes
- [ ] Update mobile app
- [ ] Test revocation flow
- [ ] Set up monitoring
- [ ] Document for team

---

## Summary

**Benefits:**
- ✅ Revoke compromised tokens instantly
- ✅ Remote device logout
- ✅ View active sessions
- ✅ Fast O(1) blacklist checks via Redis
- ✅ Automatic cleanup via MongoDB TTL
- ✅ Audit trail of revocations

**Trade-offs:**
- Additional Redis memory usage (~100 bytes per token)
- Extra database query on each request (~1-2ms with Redis)
- Need to maintain active session tracking

**When to Use:**
- Device stolen or lost
- Token compromised
- User logs out from all devices
- Security breach detected
- Admin action required

This system provides essential security for never-expiring mobile tokens while maintaining performance.
