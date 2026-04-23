import crypto from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db, userApiKeys, type UserApiKey } from '../db';

// Prefix lets the auth middleware identify these tokens without decoding anything.
export const API_KEY_PREFIX = 'evn_';

function generateKey(): string {
  return `${API_KEY_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
}

export class ApiKeyService {
  /**
   * Return the user's active API key, minting one if none exists.
   * Callers pass the local Postgres users.id (not the auth service id).
   */
  static async ensureKey(userId: string): Promise<string> {
    const existing = await db
      .select()
      .from(userApiKeys)
      .where(and(eq(userApiKeys.userId, userId), isNull(userApiKeys.revokedAt)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].key;
    }

    const key = generateKey();
    await db.insert(userApiKeys).values({ userId, key });
    return key;
  }

  /**
   * Resolve a presented API key to its owning user id.
   * Returns null for unknown or revoked keys.
   */
  static async findUserIdByKey(key: string): Promise<string | null> {
    const rows = await db
      .select()
      .from(userApiKeys)
      .where(and(eq(userApiKeys.key, key), isNull(userApiKeys.revokedAt)))
      .limit(1);

    return rows.length > 0 ? rows[0].userId : null;
  }

  /**
   * Revoke every active key for a user — invoked on explicit logout so a
   * stolen/compromised device can be cut off by signing out from elsewhere.
   */
  static async revokeAllForUser(userId: string): Promise<void> {
    await db
      .update(userApiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(userApiKeys.userId, userId), isNull(userApiKeys.revokedAt)));
  }

  static looksLikeApiKey(token: string | null | undefined): token is string {
    return typeof token === 'string' && token.startsWith(API_KEY_PREFIX);
  }

  static _generate(): string {
    return generateKey();
  }

  static _toDisplay(record: UserApiKey): { id: string; createdAt: Date; revokedAt: Date | null } {
    return { id: record.id, createdAt: record.createdAt, revokedAt: record.revokedAt };
  }
}
