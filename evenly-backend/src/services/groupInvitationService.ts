import { eq, and, or } from 'drizzle-orm';
import { db, groupInvitations, groups, users, groupMembers, type NewGroupInvitation, type GroupInvitation } from '../db';
import { sendGroupInvitationEmail } from './emailService';
import { NotFoundError, ValidationError, ForbiddenError, DatabaseError } from '../utils/errors';
import { nanoid } from 'nanoid';
import { config } from '../config/config';

export class GroupInvitationService {
  /**
   * Send a group invitation via email
   */
  static async sendInvitation(
    groupId: string,
    invitedBy: string,
    invitedEmail: string,
    organizationId?: string
  ): Promise<GroupInvitation> {
    try {
      // Validate group exists and belongs to organization (if specified)
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      // Validate group exists and user is a member
      const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
      if (!group.length) {
        throw new NotFoundError('Group not found');
      }

      // Check if inviter is a group member
      const memberCheck = await db
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, invitedBy),
          eq(groupMembers.isActive, true)
        ))
        .limit(1);

      if (!memberCheck.length) {
        throw new ForbiddenError('You must be a member of the group to send invitations');
      }

      // Check if user is already a member
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, invitedEmail))
        .limit(1);

      if (existingUser.length > 0) {
        const existingMember = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, existingUser[0].id),
            eq(groupMembers.isActive, true)
          ))
          .limit(1);

        if (existingMember.length > 0) {
          throw new ValidationError('User is already a member of this group');
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await db
        .select()
        .from(groupInvitations)
        .where(and(
          eq(groupInvitations.groupId, groupId),
          eq(groupInvitations.invitedEmail, invitedEmail),
          eq(groupInvitations.status, 'pending')
        ))
        .limit(1);

      if (existingInvitation.length > 0) {
        // If there's a pending invitation, resend the email using the existing invitation
        const invitation = existingInvitation[0];
        
        // Get group and inviter details for email
        const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
        const inviter = await db.select().from(users).where(eq(users.id, invitedBy)).limit(1);
        const inviterName = inviter.length > 0 ? inviter[0].name : 'Someone';
        
        // Create invitation link
        const invitationLink = `${config.app.baseUrl}/invite/${invitation.token}`;
        
        // Resend email (don't fail if email fails, but log prominently)
        let emailSent = false;
        try {
          const recipientUser = existingUser.length > 0 ? { preferredLanguage: existingUser[0].preferredLanguage ?? null } : undefined;
          await sendGroupInvitationEmail(
            invitedEmail,
            group[0].name,
            inviterName,
            invitationLink,
            existingUser.length > 0,
            invitation.token, // Pass the invitation token
            recipientUser
          );
          emailSent = true;
        } catch (emailError: any) {
          // Add email failure info to invitation object for API response
          (invitation as any).emailSent = false;
          (invitation as any).emailError = emailError.message;
        }

        // Add email status to return object
        (invitation as any).emailSent = emailSent;
        return invitation;
      }

      // Create invitation
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const newInvitation: NewGroupInvitation = {
        groupId,
        invitedBy,
        invitedEmail,
        invitedUserId: existingUser.length > 0 ? existingUser[0].id : null,
        status: 'pending',
        token,
        expiresAt,
      };

      const [createdInvitation] = await db
        .insert(groupInvitations)
        .values(newInvitation)
        .returning();

      // Get inviter details
      const inviter = await db.select().from(users).where(eq(users.id, invitedBy)).limit(1);
      const inviterName = inviter.length > 0 ? inviter[0].name : 'Someone';

      // Create invitation link
      const invitationLink = `${config.app.baseUrl}/invite/${token}`;

      // Send email (don't fail invitation creation if email fails, but log prominently)
      let emailSent = false;
      try {
        const recipientUser = existingUser.length > 0 ? { preferredLanguage: existingUser[0].preferredLanguage ?? null } : undefined;
        await sendGroupInvitationEmail(
          invitedEmail,
          group[0].name,
          inviterName,
          invitationLink,
          existingUser.length > 0,
          token, // Pass the invitation token
          recipientUser
        );
        emailSent = true;
      } catch (emailError: any) {
        // Add email failure info to invitation object for API response
        (createdInvitation as any).emailSent = false;
        (createdInvitation as any).emailError = emailError.message;
      }

      // Add email status to return object
      (createdInvitation as any).emailSent = emailSent;
      return createdInvitation;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError('Failed to send group invitation');
    }
  }

  /**
   * Get pending invitations for a user
   */
  static async getPendingInvitations(userId: string, organizationId?: string): Promise<(GroupInvitation & { group: any; inviter: any })[]> {
    try {
      // First, get the user's email to match invitations
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        return [];
      }

      const userEmail = user[0].email;
      // Build where conditions
      const whereConditions = [
        or(
          eq(groupInvitations.invitedUserId, userId), // User has signed up
          eq(groupInvitations.invitedEmail, userEmail) // User hasn't signed up yet but has email
        ),
        eq(groupInvitations.status, 'pending'),
        // Check if invitation is not expired
        // Note: This would need a proper date comparison in a real implementation
      ];

      // Add organization filter if specified
      if (organizationId) {
        whereConditions.push(eq(groups.organizationId, organizationId));
      }

      const invitations = await db
        .select({
          invitation: groupInvitations,
          group: groups,
          inviter: users,
        })
        .from(groupInvitations)
        .innerJoin(groups, eq(groupInvitations.groupId, groups.id))
        .innerJoin(users, eq(groupInvitations.invitedBy, users.id))
        .where(and(...whereConditions));
      return invitations.map(row => ({
        ...row.invitation,
        group: row.group,
        inviter: row.inviter,
      }));
    } catch (error) {
      // Return empty array instead of throwing error for better UX
      // New users or users with no data should see empty state, not error
      return [];
    }
  }

  /**
   * Accept a group invitation
   */
  static async acceptInvitation(token: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Find invitation by token
      const invitation = await db
        .select()
        .from(groupInvitations)
        .where(and(
          eq(groupInvitations.token, token),
          eq(groupInvitations.status, 'pending')
        ))
        .limit(1);

      if (!invitation.length) {
        throw new NotFoundError('Invalid or expired invitation');
      }

      const inv = invitation[0];

      // Validate group belongs to organization (if specified)
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, inv.groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      // Check if invitation is expired
      if (new Date() > inv.expiresAt) {
        throw new ValidationError('Invitation has expired');
      }

      // Check if user matches the invited user (if specified)
      if (inv.invitedUserId && inv.invitedUserId !== userId) {
        throw new ForbiddenError('This invitation is not for you');
      }

      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, inv.groupId),
          eq(groupMembers.userId, userId)
        ))
        .limit(1);

      if (existingMember.length === 0) {
        // Add user to group
        await db.insert(groupMembers).values({
          groupId: inv.groupId,
          userId: userId,
          role: 'member',
          isActive: true,
        });
      } else {
        // Update existing member to active
        await db
          .update(groupMembers)
          .set({ isActive: true })
          .where(and(
            eq(groupMembers.groupId, inv.groupId),
            eq(groupMembers.userId, userId)
          ));
      }

      // Update invitation status
      await db
        .update(groupInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
          invitedUserId: userId, // Update in case it was null
        })
        .where(eq(groupInvitations.id, inv.id));

    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError('Failed to accept invitation');
    }
  }

  /**
   * Decline a group invitation
   */
  static async declineInvitation(token: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Find invitation by token
      const invitation = await db
        .select()
        .from(groupInvitations)
        .where(and(
          eq(groupInvitations.token, token),
          eq(groupInvitations.status, 'pending')
        ))
        .limit(1);

      if (!invitation.length) {
        throw new NotFoundError('Invalid or expired invitation');
      }

      const inv = invitation[0];

      // Validate group belongs to organization (if specified)
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, inv.groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      // Check if user matches the invited user (if specified)
      if (inv.invitedUserId && inv.invitedUserId !== userId) {
        throw new ForbiddenError('This invitation is not for you');
      }

      // Update invitation status
      await db
        .update(groupInvitations)
        .set({
          status: 'declined',
          declinedAt: new Date(),
          invitedUserId: userId, // Update in case it was null
        })
        .where(eq(groupInvitations.id, inv.id));

    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError('Failed to decline invitation');
    }
  }

  /**
   * Get invitation details by token (for public invitation page)
   */
  static async getInvitationByToken(token: string, organizationId?: string): Promise<GroupInvitation & { group: any; inviter: any } | null> {
    try {
      // Build where conditions
      const whereConditions = [
        eq(groupInvitations.token, token),
        eq(groupInvitations.status, 'pending')
      ];

      // Add organization filter if specified
      if (organizationId) {
        whereConditions.push(eq(groups.organizationId, organizationId));
      }

      const result = await db
        .select({
          invitation: groupInvitations,
          group: groups,
          inviter: users,
        })
        .from(groupInvitations)
        .innerJoin(groups, eq(groupInvitations.groupId, groups.id))
        .innerJoin(users, eq(groupInvitations.invitedBy, users.id))
        .where(and(...whereConditions))
        .limit(1);

      if (!result.length) {
        return null;
      }

      const row = result[0];
      return {
        ...row.invitation,
        group: row.group,
        inviter: row.inviter,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get invitation details');
    }
  }
}
