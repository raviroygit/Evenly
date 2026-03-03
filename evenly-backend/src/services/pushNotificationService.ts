import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk';
import { eq, and, inArray, count } from 'drizzle-orm';
import { db, deviceTokens, users } from '../db';

const expo = new Expo();

/**
 * Register (upsert) an Expo push token for a user.
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: string
): Promise<void> {
  try {
    if (!Expo.isExpoPushToken(token)) {
      console.warn('[PushNotification] Invalid Expo push token:', token);
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
 * Get all active push tokens for a list of user IDs.
 */
async function getActiveTokensForUsers(userIds: string[]): Promise<{ userId: string; token: string }[]> {
  if (userIds.length === 0) return [];
  try {
    const tokens = await db
      .select({ userId: deviceTokens.userId, token: deviceTokens.token })
      .from(deviceTokens)
      .where(and(inArray(deviceTokens.userId, userIds), eq(deviceTokens.isActive, true)));
    return tokens;
  } catch (error) {
    console.error('[PushNotification] getActiveTokensForUsers error:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Core send function: sends push notifications to a set of users.
 * Automatically deactivates tokens that return DeviceNotRegistered.
 */
async function sendPushNotifications(
  userIds: string[],
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  try {
    const tokens = await getActiveTokensForUsers(userIds);
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default' as const,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      }));

    if (messages.length === 0) return;

    // Send in chunks (Expo SDK handles batching)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (chunkError) {
        console.error('[PushNotification] Chunk send error:', chunkError instanceof Error ? chunkError.message : chunkError);
      }
    }

    // Check for errors and deactivate invalid tokens
    const receiptIds: ExpoPushReceiptId[] = [];
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'error') {
        if (ticket.details?.error === 'DeviceNotRegistered') {
          // Deactivate this token
          const tokenInfo = tokens[i];
          if (tokenInfo) {
            await unregisterPushToken(tokenInfo.userId, tokenInfo.token);
          }
        }
        console.error('[PushNotification] Ticket error:', ticket.message, ticket.details?.error);
      } else if (ticket.status === 'ok' && ticket.id) {
        receiptIds.push(ticket.id);
      }
    }

    // Check receipts after a delay (fire-and-forget)
    if (receiptIds.length > 0) {
      setTimeout(() => checkReceipts(receiptIds, tokens).catch(() => {}), 15000);
    }
  } catch (error) {
    console.error('[PushNotification] sendPushNotifications error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Check push notification receipts and deactivate stale tokens.
 */
async function checkReceipts(
  receiptIds: ExpoPushReceiptId[],
  tokens: { userId: string; token: string }[]
): Promise<void> {
  try {
    const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptChunks) {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const receiptId in receipts) {
        const receipt = receipts[receiptId];
        if (receipt.status === 'error') {
          if (receipt.details?.error === 'DeviceNotRegistered') {
            // Find and deactivate the token — best-effort match
            // Receipt IDs don't directly map back to tokens, so we log it
            console.warn('[PushNotification] DeviceNotRegistered receipt:', receiptId);
          }
          console.error('[PushNotification] Receipt error:', receipt.message, receipt.details?.error);
        }
      }
    }
  } catch (error) {
    console.error('[PushNotification] checkReceipts error:', error instanceof Error ? error.message : error);
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
  imageUrl?: string
): Promise<{ sent: number }> {
  try {
    const allTokens = await db
      .select({ userId: deviceTokens.userId, token: deviceTokens.token })
      .from(deviceTokens)
      .where(eq(deviceTokens.isActive, true));

    if (allTokens.length === 0) return { sent: 0 };

    const messages: ExpoPushMessage[] = allTokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default' as const,
        title,
        body,
        data: { type: 'broadcast', screen: 'home' },
        ...(imageUrl ? { richContent: { image: imageUrl } } : {}),
      }));

    if (messages.length === 0) return { sent: 0 };

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        // Deactivate invalid tokens
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            const tokenInfo = allTokens[i];
            if (tokenInfo) {
              await unregisterPushToken(tokenInfo.userId, tokenInfo.token);
            }
          }
        }
      } catch (chunkError) {
        console.error('[PushNotification] Broadcast chunk error:', chunkError instanceof Error ? chunkError.message : chunkError);
      }
    }

    return { sent: messages.length };
  } catch (error) {
    console.error('[PushNotification] sendBroadcastPush error:', error instanceof Error ? error.message : error);
    return { sent: 0 };
  }
}
