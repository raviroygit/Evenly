import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, users, referrals } from '../db';

export class ReferralService {
  /**
   * Get or create a referral code for a user.
   * Each user gets one permanent 8-char code stored on their users row.
   */
  static async getOrCreateReferralCode(userId: string): Promise<string> {
    // Check if user already has a referral code
    const [user] = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.referralCode) {
      return user.referralCode;
    }

    // Generate a new unique code
    const code = nanoid(8);

    await db
      .update(users)
      .set({ referralCode: code, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return code;
  }

  /**
   * Get referral statistics for a user: count + list of referred users.
   */
  static async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    referredUsers: { id: string; name: string; email: string; joinedAt: Date }[];
  }> {
    const rows = await db
      .select({
        referralId: referrals.id,
        status: referrals.status,
        referredUserId: referrals.referredUserId,
        referredName: users.name,
        referredEmail: users.email,
        completedAt: referrals.updatedAt,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredUserId, users.id))
      .where(eq(referrals.referrerId, userId));

    const totalReferrals = rows.length;
    const completedReferrals = rows.filter((r) => r.status === 'completed').length;
    const referredUsers = rows
      .filter((r) => r.status === 'completed' && r.referredUserId)
      .map((r) => ({
        id: r.referredUserId!,
        name: r.referredName || 'Unknown',
        email: r.referredEmail || '',
        joinedAt: r.completedAt,
      }));

    return { totalReferrals, completedReferrals, referredUsers };
  }

  /**
   * Apply a referral code for a newly signed-up user.
   * Creates a completed referral record linking referrer → new user.
   */
  static async applyReferralCode(
    referralCode: string,
    newUserId: string
  ): Promise<{ success: boolean; message: string }> {
    // Find the user who owns this referral code
    const [referrer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, referralCode))
      .limit(1);

    if (!referrer) {
      return { success: false, message: 'Invalid referral code' };
    }

    // Prevent self-referral
    if (referrer.id === newUserId) {
      return { success: false, message: 'You cannot use your own referral code' };
    }

    // Check if this user already used a referral code
    const [existing] = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.referredUserId, newUserId))
      .limit(1);

    if (existing) {
      return { success: false, message: 'You have already used a referral code' };
    }

    // Create the completed referral record
    await db.insert(referrals).values({
      referrerId: referrer.id,
      referralCode,
      referredUserId: newUserId,
      status: 'completed',
    });

    return { success: true, message: 'Referral code applied successfully' };
  }

  /**
   * Validate whether a referral code exists and return basic referrer info.
   */
  static async validateReferralCode(
    code: string
  ): Promise<{ valid: boolean; referrerName?: string }> {
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (!user) {
      return { valid: false };
    }

    return { valid: true, referrerName: user.name };
  }
}
