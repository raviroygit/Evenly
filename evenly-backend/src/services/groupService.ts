import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { db, groups, groupMembers, users, type Group, type NewGroup, type GroupMember, type NewGroupMember } from '../db';
import { UserService } from './userService';
import { NotFoundError, ForbiddenError, ConflictError, DatabaseError, ValidationError } from '../utils/errors';

export class GroupService {
  /**
   * Create a new group
   */
  static async createGroup(
    groupData: {
      name: string;
      description?: string;
      defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
    },
    createdBy: string,
    organizationId?: string
  ): Promise<Group> {
    try {
      // Validate organizationId is provided
      if (!organizationId) {
        throw new ValidationError('Organization ID is required');
      }

      // User is already synced by auth middleware, no need to sync again
      const newGroup: NewGroup = {
        name: groupData.name,
        description: groupData.description,
        currency: 'INR', // Default to INR
        defaultSplitType: groupData.defaultSplitType || 'equal',
        createdBy,
        organizationId,
      };

      const [createdGroup] = await db
        .insert(groups)
        .values(newGroup)
        .returning();

      // Add creator as admin member
      await this.addGroupMember(createdGroup.id, createdBy, 'admin', organizationId);

      return createdGroup;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to create group');
    }
  }

  /**
   * Get group by ID with members
   */
  static async getGroupById(groupId: string, organizationId?: string): Promise<Group & { members: (GroupMember & { user: any })[] } | null> {
    try {
      const conditions = [eq(groups.id, groupId)];
      if (organizationId) {
        conditions.push(eq(groups.organizationId, organizationId));
      }

      const [group] = await db
        .select()
        .from(groups)
        .where(and(...conditions))
        .limit(1);

      if (!group) {
        return null;
      }

      // Get group members with user details
      const members = await db
        .select({
          id: groupMembers.id,
          groupId: groupMembers.groupId,
          userId: groupMembers.userId,
          role: groupMembers.role,
          joinedAt: groupMembers.joinedAt,
          isActive: groupMembers.isActive,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatar: users.avatar,
          },
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(eq(groupMembers.groupId, groupId));

      return {
        ...group,
        members,
      };
    } catch (error) {
      throw new DatabaseError('Failed to fetch group');
    }
  }

  /**
   * Get groups for a user
   */
  static async getUserGroups(userId: string, organizationId?: string): Promise<(Group & { memberCount: number })[]> {
    try {
      // First, get all groups where the user is a member
      const userGroupIds = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.userId, userId),
          eq(groupMembers.isActive, true)
        ));

      if (userGroupIds.length === 0) {
        return [];
      }

      const groupIds = userGroupIds.map(g => g.groupId);

      // Then, get the groups with their actual member counts (count ALL active members in each group)
      const conditions = [inArray(groups.id, groupIds)];
      if (organizationId) {
        conditions.push(eq(groups.organizationId, organizationId));
      }

      const userGroups = await db
        .select({
          id: groups.id,
          organizationId: groups.organizationId,
          name: groups.name,
          description: groups.description,
          currency: groups.currency,
          defaultSplitType: groups.defaultSplitType,
          createdBy: groups.createdBy,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
          memberCount: count(groupMembers.id),
        })
        .from(groups)
        .leftJoin(groupMembers, and(
          eq(groups.id, groupMembers.groupId),
          eq(groupMembers.isActive, true)
        ))
        .where(and(...conditions))
        .groupBy(groups.id)
        .orderBy(desc(groups.updatedAt));
      return userGroups;
    } catch (error) {
      throw new DatabaseError('Failed to fetch user groups');
    }
  }

  /**
   * Update group
   */
  static async updateGroup(
    groupId: string,
    updateData: {
      name?: string;
      description?: string;
      currency?: string;
      defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
    },
    userId: string,
    organizationId?: string
  ): Promise<Group> {
    try {
      // Validate group belongs to organization
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

      // Check if user is admin of the group
      const isAdmin = await this.isUserGroupAdmin(groupId, userId, organizationId);
      if (!isAdmin) {
        throw new ForbiddenError('Only group admins can update group details');
      }

      const conditions = [eq(groups.id, groupId)];
      if (organizationId) {
        conditions.push(eq(groups.organizationId, organizationId));
      }

      const [updatedGroup] = await db
        .update(groups)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(...conditions))
        .returning();

      if (!updatedGroup) {
        throw new NotFoundError('Group');
      }

      return updatedGroup;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError('Failed to update group');
    }
  }

  /**
   * Delete group
   */
  static async deleteGroup(groupId: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Validate group belongs to organization
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

      // Check if user is admin of the group
      const isAdmin = await this.isUserGroupAdmin(groupId, userId, organizationId);
      if (!isAdmin) {
        throw new ForbiddenError('Only group admins can delete the group');
      }

      // Delete group - cascade will handle related expenses, splits, balances, etc.
      // The database schema has onDelete: 'cascade' for all related tables
      const conditions = [eq(groups.id, groupId)];
      if (organizationId) {
        conditions.push(eq(groups.organizationId, organizationId));
      }
      await db.delete(groups).where(and(...conditions));
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete group');
    }
  }

  /**
   * Add member to group
   */
  static async addGroupMember(
    groupId: string,
    userId: string,
    role: 'admin' | 'member' = 'member',
    organizationId?: string
  ): Promise<GroupMember> {
    try {
      // Validate group belongs to organization
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

      // User is already synced by auth middleware, no need to sync again
      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
        .limit(1);

      if (existingMember.length > 0) {
        throw new ConflictError('User is already a member of this group');
      }

      const newMember: NewGroupMember = {
        groupId,
        userId,
        role,
      };

      const [createdMember] = await db
        .insert(groupMembers)
        .values(newMember)
        .returning();

      return createdMember;
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to add group member');
    }
  }

  /**
   * Remove member from group
   */
  static async removeGroupMember(
    groupId: string,
    userId: string,
    removedBy: string,
    organizationId?: string
  ): Promise<void> {
    try {
      // Validate group belongs to organization
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

      // Check if the person removing is an admin
      const isAdmin = await this.isUserGroupAdmin(groupId, removedBy, organizationId);
      if (!isAdmin) {
        throw new ForbiddenError('Only group admins can remove members');
      }

      // Don't allow removing the last admin
      const adminCount = await db
        .select({ count: count() })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.role, 'admin')));

      if (adminCount[0].count <= 1) {
        throw new ForbiddenError('Cannot remove the last admin from the group');
      }

      await db
        .delete(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to remove group member');
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    groupId: string,
    userId: string,
    newRole: 'admin' | 'member',
    updatedBy: string,
    organizationId?: string
  ): Promise<GroupMember> {
    try {
      // Validate group belongs to organization
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

      // Check if the person updating is an admin
      const isAdmin = await this.isUserGroupAdmin(groupId, updatedBy, organizationId);
      if (!isAdmin) {
        throw new ForbiddenError('Only group admins can update member roles');
      }

      // Don't allow demoting the last admin
      if (newRole === 'member') {
        const adminCount = await db
          .select({ count: count() })
          .from(groupMembers)
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.role, 'admin')));

        if (adminCount[0].count <= 1) {
          throw new ForbiddenError('Cannot demote the last admin from the group');
        }
      }

      const [updatedMember] = await db
        .update(groupMembers)
        .set({ role: newRole })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
        .returning();

      if (!updatedMember) {
        throw new NotFoundError('Group member');
      }

      return updatedMember;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError('Failed to update member role');
    }
  }

  /**
   * Check if user is a member of the group
   */
  static async isUserGroupMember(groupId: string, userId: string, organizationId?: string): Promise<boolean> {
    try {
      // Validate group belongs to organization if provided
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          return false;
        }
      }

      const member = await db
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
          eq(groupMembers.isActive, true)
        ))
        .limit(1);
      return member.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is an admin of the group
   */
  static async isUserGroupAdmin(groupId: string, userId: string, organizationId?: string): Promise<boolean> {
    try {
      // Validate group belongs to organization if provided
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          return false;
        }
      }

      const member = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId),
            eq(groupMembers.role, 'admin')
          )
        )
        .limit(1);

      return member.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get group members
   */
  static async getGroupMembers(groupId: string, organizationId?: string): Promise<(GroupMember & { user: any })[]> {
    try {
      // Validate group belongs to organization if provided
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          return [];
        }
      }

      const members = await db
        .select({
          id: groupMembers.id,
          groupId: groupMembers.groupId,
          userId: groupMembers.userId,
          role: groupMembers.role,
          joinedAt: groupMembers.joinedAt,
          isActive: groupMembers.isActive,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatar: users.avatar,
          },
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(eq(groupMembers.groupId, groupId));

      return members;
    } catch (error) {
      throw new DatabaseError('Failed to fetch group members');
    }
  }

  /**
   * Leave group
   */
  static async leaveGroup(groupId: string, userId: string, organizationId?: string): Promise<void> {
    try {
      // Validate group belongs to organization if provided
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

      // Check if user is the last admin
      const isAdmin = await this.isUserGroupAdmin(groupId, userId, organizationId);
      if (isAdmin) {
        const adminCount = await db
          .select({ count: count() })
          .from(groupMembers)
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.role, 'admin')));

        if (adminCount[0].count <= 1) {
          throw new ForbiddenError('Cannot leave group as the last admin. Transfer admin role or delete the group.');
        }
      }

      await db
        .delete(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to leave group');
    }
  }
}
