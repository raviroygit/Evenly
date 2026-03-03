import * as http2 from 'http2';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as admin from 'firebase-admin';
import { eq, and, inArray } from 'drizzle-orm';
import { db, deviceTokens } from '../db';
import { config } from '../config/config';

// ── APNs setup ──

let apnsKey: string | null = null;
let apnsJwt: string | null = null;
let apnsJwtGeneratedAt = 0;

function getApnsKey(): string {
  if (!apnsKey) {
    const keyPath = config.push.apns.keyPath;
    apnsKey = fs.readFileSync(keyPath, 'utf8');
  }
  return apnsKey;
}

/**
 * Generate (or reuse) an APNs JWT token.
 * Apple recommends refreshing no more than once every 20 minutes.
 */
function getApnsJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  // Refresh every 50 minutes (tokens valid for 60 min)
  if (apnsJwt && now - apnsJwtGeneratedAt < 3000) {
    return apnsJwt;
  }
  apnsJwt = jwt.sign({ iss: config.push.apns.teamId, iat: now }, getApnsKey(), {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: config.push.apns.keyId },
  });
  apnsJwtGeneratedAt = now;
  return apnsJwt;
}

function getApnsHost(): string {
  return config.push.apns.production
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com';
}

/**
 * Send a push notification via APNs HTTP/2.
 * Returns true if delivered, false if the token should be removed.
 */
async function sendApns(
  deviceToken: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<boolean> {
  return new Promise((resolve) => {
    const host = getApnsHost();
    const client = http2.connect(host);

    client.on('error', (err) => {
      console.error('[PushNotification] APNs connection error:', err.message);
      client.close();
      resolve(true); // Don't remove token on connection error
    });

    const apnsPayload = JSON.stringify({
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
      },
      ...(payload.data || {}),
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${getApnsJwt()}`,
      'apns-topic': config.push.apns.bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    });

    let responseData = '';
    let statusCode = 0;

    req.on('response', (headers) => {
      statusCode = headers[':status'] as number;
    });

    req.on('data', (chunk: Buffer) => {
      responseData += chunk.toString();
    });

    req.on('end', () => {
      client.close();
      if (statusCode === 200) {
        resolve(true);
      } else {
        const isInvalid = isApnsTokenInvalid(statusCode, responseData);
        if (isInvalid) {
          console.warn('[PushNotification] APNs invalid token, will deactivate:', deviceToken.substring(0, 12) + '...');
        } else {
          console.error('[PushNotification] APNs error:', statusCode, responseData);
        }
        resolve(!isInvalid);
      }
    });

    req.on('error', (err) => {
      console.error('[PushNotification] APNs request error:', err.message);
      client.close();
      resolve(true); // Don't remove token on transient errors
    });

    req.end(apnsPayload);
  });
}

function isApnsTokenInvalid(statusCode: number, responseBody: string): boolean {
  if (statusCode === 410) return true; // Unregistered
  if (statusCode === 400) {
    try {
      const parsed = JSON.parse(responseBody);
      return parsed.reason === 'BadDeviceToken';
    } catch {
      return false;
    }
  }
  return false;
}

// ── FCM setup ──

let fcmInitialized = false;

function initFcm(): void {
  if (fcmInitialized) return;
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: config.push.fcm.projectId,
  });
  fcmInitialized = true;
}

/**
 * Send a push notification via FCM v1 API.
 * Returns true if delivered, false if the token should be removed.
 */
async function sendFcm(
  deviceToken: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<boolean> {
  try {
    initFcm();
    await admin.messaging().send({
      token: deviceToken,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'default' },
      },
    });
    return true;
  } catch (error: any) {
    const code = error?.code || error?.errorInfo?.code || '';
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      console.warn('[PushNotification] FCM invalid token, will deactivate:', deviceToken.substring(0, 12) + '...');
      return false;
    }
    console.error('[PushNotification] FCM send error:', error?.message || error);
    return true; // Don't remove token on transient errors
  }
}

// ── Token management ──

/**
 * Register (upsert) a push token for a user.
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: string
): Promise<void> {
  try {
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.warn('[PushNotification] Invalid push token:', token);
      return;
    }

    // Upsert: insert or update if the (userId, token) pair already exists
    const existing = await db
      .select()
      .from(deviceTokens)
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(deviceTokens)
        .set({ isActive: true, platform, updatedAt: new Date() })
        .where(eq(deviceTokens.id, existing[0].id));
    } else {
      await db.insert(deviceTokens).values({
        userId,
        token,
        platform,
        isActive: true,
      });
    }
  } catch (error) {
    console.error('[PushNotification] registerPushToken error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Mark a push token as inactive for a user.
 */
export async function unregisterPushToken(userId: string, token: string): Promise<void> {
  try {
    await db
      .update(deviceTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)));
  } catch (error) {
    console.error('[PushNotification] unregisterPushToken error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Get all active push tokens for a list of user IDs, including platform.
 */
async function getActiveTokensForUsers(
  userIds: string[]
): Promise<{ userId: string; token: string; platform: string }[]> {
  if (userIds.length === 0) return [];
  try {
    const tokens = await db
      .select({
        userId: deviceTokens.userId,
        token: deviceTokens.token,
        platform: deviceTokens.platform,
      })
      .from(deviceTokens)
      .where(and(inArray(deviceTokens.userId, userIds), eq(deviceTokens.isActive, true)));
    return tokens;
  } catch (error) {
    console.error('[PushNotification] getActiveTokensForUsers error:', error instanceof Error ? error.message : error);
    return [];
  }
}

// ── Core send ──

/**
 * Send a single notification to the correct platform.
 * Returns false if the token is invalid and should be deactivated.
 */
async function sendToDevice(
  token: string,
  platform: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<boolean> {
  if (platform === 'ios') {
    return sendApns(token, payload);
  }
  return sendFcm(token, payload);
}

/**
 * Core send function: sends push notifications to a set of users.
 * Automatically deactivates tokens that are invalid / unregistered.
 */
async function sendPushNotifications(
  userIds: string[],
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  try {
    const tokens = await getActiveTokensForUsers(userIds);
    if (tokens.length === 0) return;

    const results = await Promise.allSettled(
      tokens.map(async (t) => {
        const ok = await sendToDevice(t.token, t.platform, payload);
        if (!ok) {
          await unregisterPushToken(t.userId, t.token);
        }
      })
    );

    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('[PushNotification] send error:', r.reason);
      }
    }
  } catch (error) {
    console.error('[PushNotification] sendPushNotifications error:', error instanceof Error ? error.message : error);
  }
}

// ── Event-specific push notification functions ──

export async function sendExpenseCreatedPush(
  recipientUserIds: string[],
  expense: { title: string; totalAmount: string; currency: string },
  addedBy: { name: string },
  group: { id: string; name: string }
): Promise<void> {
  try {
    await sendPushNotifications(recipientUserIds, {
      title: `New expense in ${group.name}`,
      body: `${addedBy.name} added "${expense.title}" (${expense.currency} ${expense.totalAmount})`,
      data: {
        type: 'expense_created',
        groupId: group.id,
        screen: 'group_detail',
      },
    });
  } catch (error) {
    console.error('[PushNotification] sendExpenseCreatedPush error:', error instanceof Error ? error.message : error);
  }
}

export async function sendExpenseUpdatedPush(
  recipientUserIds: string[],
  expense: { title: string; totalAmount: string; currency: string },
  updatedBy: { name: string },
  group: { id: string; name: string }
): Promise<void> {
  try {
    await sendPushNotifications(recipientUserIds, {
      title: `Expense updated in ${group.name}`,
      body: `${updatedBy.name} updated "${expense.title}" (${expense.currency} ${expense.totalAmount})`,
      data: {
        type: 'expense_updated',
        groupId: group.id,
        screen: 'group_detail',
      },
    });
  } catch (error) {
    console.error('[PushNotification] sendExpenseUpdatedPush error:', error instanceof Error ? error.message : error);
  }
}

export async function sendExpenseDeletedPush(
  recipientUserIds: string[],
  expense: { title: string; totalAmount: string; currency: string },
  deletedBy: { name: string },
  group: { id: string; name: string }
): Promise<void> {
  try {
    await sendPushNotifications(recipientUserIds, {
      title: `Expense deleted in ${group.name}`,
      body: `${deletedBy.name} removed "${expense.title}" (${expense.currency} ${expense.totalAmount})`,
      data: {
        type: 'expense_deleted',
        groupId: group.id,
        screen: 'group_detail',
      },
    });
  } catch (error) {
    console.error('[PushNotification] sendExpenseDeletedPush error:', error instanceof Error ? error.message : error);
  }
}

export async function sendPaymentCompletedPush(
  recipientUserIds: string[],
  fromUser: { name: string },
  toUser: { name: string },
  amount: string,
  currency: string,
  group: { id: string; name: string }
): Promise<void> {
  try {
    await sendPushNotifications(recipientUserIds, {
      title: `Payment in ${group.name}`,
      body: `${fromUser.name} paid ${toUser.name} ${currency} ${amount}`,
      data: {
        type: 'payment_completed',
        groupId: group.id,
        screen: 'group_detail',
      },
    });
  } catch (error) {
    console.error('[PushNotification] sendPaymentCompletedPush error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Broadcast a push notification to ALL users with active device tokens.
 * Returns the number of tokens sent to.
 */
export async function sendBroadcastPush(
  title: string,
  body: string,
  _imageUrl?: string
): Promise<{ sent: number }> {
  try {
    const allTokens = await db
      .select({
        userId: deviceTokens.userId,
        token: deviceTokens.token,
        platform: deviceTokens.platform,
      })
      .from(deviceTokens)
      .where(eq(deviceTokens.isActive, true));

    if (allTokens.length === 0) return { sent: 0 };

    const payload = {
      title,
      body,
      data: { type: 'broadcast', screen: 'home' },
    };

    const results = await Promise.allSettled(
      allTokens.map(async (t) => {
        const ok = await sendToDevice(t.token, t.platform, payload);
        if (!ok) {
          await unregisterPushToken(t.userId, t.token);
        }
        return ok;
      })
    );

    let sent = 0;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) sent++;
    }

    return { sent };
  } catch (error) {
    console.error('[PushNotification] sendBroadcastPush error:', error instanceof Error ? error.message : error);
    return { sent: 0 };
  }
}
