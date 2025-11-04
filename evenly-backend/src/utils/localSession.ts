import { randomBytes } from 'crypto';

type SessionRecord = {
  userId: string;
  expiresAt: number;
};

const sessions = new Map<string, SessionRecord>();

export function createSession(userId: string, ttlSeconds = 86400): string {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + ttlSeconds * 1000 });
  return token;
}

export function validateSession(token: string): { valid: boolean; userId?: string } {
  const rec = sessions.get(token);
  if (!rec) return { valid: false };
  if (Date.now() > rec.expiresAt) {
    sessions.delete(token);
    return { valid: false };
  }
  return { valid: true, userId: rec.userId };
}

export function invalidateSession(token: string) {
  sessions.delete(token);
}


