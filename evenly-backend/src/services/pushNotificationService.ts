import * as http2 from 'http2';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as admin from 'firebase-admin';
import { eq, and, inArray } from 'drizzle-orm';
import { db, deviceTokens, users } from '../db';
import { config } from '../config/config';
import { t as translate, getUserLanguage, getUserCurrencySymbol } from '../i18n/emailTranslator';
import { formatAmount } from '../utils/currency';

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

const APNS_PRODUCTION = 'https://api.push.apple.com';
const APNS_SANDBOX = 'https://api.sandbox.push.apple.com';

/**
 * Send a single APNs request to a specific host.
 * Returns { ok, badToken } where badToken means the token is invalid for this host.
 */
function sendApnsToHost(
  host: string,
  deviceToken: string,
  apnsPayload: string
): Promise<{ ok: boolean; badToken: boolean }> {
  return new Promise((resolve) => {
    const client = http2.connect(host);

    client.on('error', (err) => {
      console.error('[PushNotification] APNs connection error:', err.message);
      client.close();
      resolve({ ok: false, badToken: false });
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
        resolve({ ok: true, badToken: false });
      } else {
        const bad = isApnsTokenInvalid(statusCode, responseData);
        if (!bad) {
          console.error('[PushNotification] APNs error:', statusCode, responseData);
        }
        resolve({ ok: false, badToken: bad });
      }
    });

    req.on('error', (err) => {
      console.error('[PushNotification] APNs request error:', err.message);
      client.close();
      resolve({ ok: false, badToken: false });
    });

    req.end(apnsPayload);
  });
}

/**
 * Send a push notification via APNs HTTP/2.
 * Tries production first, falls back to sandbox if the token is rejected
 * (handles dev builds pointing at sandbox while backend runs in production).
 * Returns true if delivered, false if the token should be removed.
 */
async function sendApns(
  deviceToken: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<boolean> {
  const apnsPayload = JSON.stringify({
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: 'default',
    },
    ...(payload.data || {}),
  });

  const primary = config.push.apns.production ? APNS_PRODUCTION : APNS_SANDBOX;
  const fallback = config.push.apns.production ? APNS_SANDBOX : APNS_PRODUCTION;

  const result = await sendApnsToHost(primary, deviceToken, apnsPayload);
  if (result.ok) return true;

  // If token was rejected as invalid, try the other environment before giving up
  if (result.badToken) {
    const fallbackResult = await sendApnsToHost(fallback, deviceToken, apnsPayload);
    if (fallbackResult.ok) return true;
    // Both failed — token is truly invalid
    console.warn('[PushNotification] APNs token invalid on both prod and sandbox, will deactivate:', deviceToken.substring(0, 12) + '...');
    return false;
  }

  return true; // Transient error, don't deactivate
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

// ── Helpers for personalized push ──

/**
 * Fetch preferences (language + currency) for recipient users.
 */
async function getRecipientPreferences(
  userIds: string[]
): Promise<Map<string, { preferredLanguage: string | null; preferredCurrency: string | null }>> {
  const prefs = new Map<string, { preferredLanguage: string | null; preferredCurrency: string | null }>();
  if (userIds.length === 0) return prefs;
  try {
    const rows = await db
      .select({ id: users.id, preferredLanguage: users.preferredLanguage, preferredCurrency: users.preferredCurrency })
      .from(users)
      .where(inArray(users.id, userIds));
    for (const row of rows) {
      prefs.set(row.id, { preferredLanguage: row.preferredLanguage, preferredCurrency: row.preferredCurrency });
    }
  } catch (error) {
    console.error('[PushNotification] getRecipientPreferences error:', error instanceof Error ? error.message : error);
  }
  return prefs;
}

/**
 * Format an amount using the recipient's preferred currency.
 * Returns e.g. "₹500" or "$500" instead of "USD 500".
 */
function formatAmountForUser(
  rawAmount: string,
  userPref?: { preferredCurrency?: string | null } | null
): string {
  const symbol = getUserCurrencySymbol(userPref ?? undefined);
  const num = parseFloat(rawAmount);
  // Use Intl formatting if possible, otherwise symbol + number
  if (userPref?.preferredCurrency) {
    return formatAmount(num, userPref.preferredCurrency);
  }
  return `${symbol}${num % 1 === 0 ? num.toString() : num.toFixed(2)}`;
}

/**
 * Send personalized push notifications per recipient (respecting language + currency).
 * Falls back to English + INR if preferences are unavailable.
 */
async function sendPersonalizedPush(
  recipientUserIds: string[],
  buildPayload: (lang: string, userPref: { preferredCurrency?: string | null }) => { title: string; body: string },
  data: Record<string, string>
): Promise<void> {
  try {
    const prefs = await getRecipientPreferences(recipientUserIds);
    const tokens = await getActiveTokensForUsers(recipientUserIds);
    if (tokens.length === 0) return;

    const results = await Promise.allSettled(
      tokens.map(async (tok) => {
        const userPref = prefs.get(tok.userId) ?? { preferredLanguage: null, preferredCurrency: null };
        const lang = getUserLanguage(userPref);
        const { title, body } = buildPayload(lang, userPref);
        const ok = await sendToDevice(tok.token, tok.platform, { title, body, data });
        if (!ok) {
          await unregisterPushToken(tok.userId, tok.token);
        }
      })
    );

    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('[PushNotification] send error:', r.reason);
      }
    }
  } catch (error) {
    console.error('[PushNotification] sendPersonalizedPush error:', error instanceof Error ? error.message : error);
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
    await sendPersonalizedPush(
      recipientUserIds,
      (lang, userPref) => ({
        title: translate(lang, 'pushNotification.expenseCreatedTitle', { groupName: group.name }),
        body: translate(lang, 'pushNotification.expenseCreatedBody', {
          addedBy: addedBy.name,
          title: expense.title,
          amount: formatAmountForUser(expense.totalAmount, userPref),
        }),
      }),
      { type: 'expense_created', groupId: group.id, screen: 'group_detail' }
    );
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
    await sendPersonalizedPush(
      recipientUserIds,
      (lang, userPref) => ({
        title: translate(lang, 'pushNotification.expenseUpdatedTitle', { groupName: group.name }),
        body: translate(lang, 'pushNotification.expenseUpdatedBody', {
          updatedBy: updatedBy.name,
          title: expense.title,
          amount: formatAmountForUser(expense.totalAmount, userPref),
        }),
      }),
      { type: 'expense_updated', groupId: group.id, screen: 'group_detail' }
    );
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
    await sendPersonalizedPush(
      recipientUserIds,
      (lang, userPref) => ({
        title: translate(lang, 'pushNotification.expenseDeletedTitle', { groupName: group.name }),
        body: translate(lang, 'pushNotification.expenseDeletedBody', {
          deletedBy: deletedBy.name,
          title: expense.title,
          amount: formatAmountForUser(expense.totalAmount, userPref),
        }),
      }),
      { type: 'expense_deleted', groupId: group.id, screen: 'group_detail' }
    );
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
    await sendPersonalizedPush(
      recipientUserIds,
      (lang, userPref) => ({
        title: translate(lang, 'pushNotification.paymentTitle', { groupName: group.name }),
        body: translate(lang, 'pushNotification.paymentBody', {
          fromUser: fromUser.name,
          toUser: toUser.name,
          amount: formatAmountForUser(amount, userPref),
        }),
      }),
      { type: 'payment_completed', groupId: group.id, screen: 'group_detail' }
    );
  } catch (error) {
    console.error('[PushNotification] sendPaymentCompletedPush error:', error instanceof Error ? error.message : error);
  }
}

export async function sendKhataTransactionPush(
  customerEmail: string,
  customerName: string,
  userName: string,
  transaction: { type: 'give' | 'get'; amount: string; currency: string }
): Promise<void> {
  try {
    // Look up the customer in the users table by email to get their userId
    const [customerUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customerEmail))
      .limit(1);

    if (!customerUser) return; // Customer is not a registered user — can't send push

    await sendPersonalizedPush(
      [customerUser.id],
      (lang, userPref) => {
        const formattedAmount = formatAmountForUser(transaction.amount, userPref);
        // From customer's perspective: 'give' means user gave → customer received (got)
        // 'get' means user got → customer gave
        const typeKey = transaction.type === 'give' ? 'khataGotBody' : 'khataGaveBody';
        return {
          title: translate(lang, 'pushNotification.khataTitle', { userName }),
          body: translate(lang, `pushNotification.${typeKey}`, { userName, amount: formattedAmount }),
        };
      },
      { type: 'khata_transaction', screen: 'khata' }
    );
  } catch (error) {
    console.error('[PushNotification] sendKhataTransactionPush error:', error instanceof Error ? error.message : error);
  }
}

export async function sendKhataTransactionUpdatedPush(
  customerEmail: string,
  userName: string,
  transaction: { type: 'give' | 'get'; amount: string }
): Promise<void> {
  try {
    const [customerUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customerEmail))
      .limit(1);

    if (!customerUser) return;

    await sendPersonalizedPush(
      [customerUser.id],
      (lang, userPref) => {
        const formattedAmount = formatAmountForUser(transaction.amount, userPref);
        const typeKey = transaction.type === 'give' ? 'khataGotBody' : 'khataGaveBody';
        return {
          title: translate(lang, 'pushNotification.khataUpdatedTitle', { userName }),
          body: translate(lang, `pushNotification.${typeKey}`, { userName, amount: formattedAmount }),
        };
      },
      { type: 'khata_transaction_updated', screen: 'khata' }
    );
  } catch (error) {
    console.error('[PushNotification] sendKhataTransactionUpdatedPush error:', error instanceof Error ? error.message : error);
  }
}

export async function sendKhataTransactionDeletedPush(
  customerEmail: string,
  userName: string,
  transaction: { type: 'give' | 'get'; amount: string }
): Promise<void> {
  try {
    const [customerUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customerEmail))
      .limit(1);

    if (!customerUser) return;

    await sendPersonalizedPush(
      [customerUser.id],
      (lang, userPref) => {
        const formattedAmount = formatAmountForUser(transaction.amount, userPref);
        return {
          title: translate(lang, 'pushNotification.khataDeletedTitle', { userName }),
          body: translate(lang, 'pushNotification.khataDeletedBody', { userName, amount: formattedAmount }),
        };
      },
      { type: 'khata_transaction_deleted', screen: 'khata' }
    );
  } catch (error) {
    console.error('[PushNotification] sendKhataTransactionDeletedPush error:', error instanceof Error ? error.message : error);
  }
}

export async function sendKhataCustomerAddedPush(
  customerEmail: string,
  userName: string
): Promise<void> {
  try {
    const [customerUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customerEmail))
      .limit(1);

    if (!customerUser) return;

    await sendPersonalizedPush(
      [customerUser.id],
      (lang) => ({
        title: translate(lang, 'pushNotification.khataCustomerAddedTitle'),
        body: translate(lang, 'pushNotification.khataCustomerAddedBody', { userName }),
      }),
      { type: 'khata_customer_added', screen: 'khata' }
    );
  } catch (error) {
    console.error('[PushNotification] sendKhataCustomerAddedPush error:', error instanceof Error ? error.message : error);
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
