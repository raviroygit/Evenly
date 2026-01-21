import axios from 'axios';
import { db } from '../db';
import { organizations, organizationMembers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { config } from '../config/config';

interface AuthServiceOrganization {
  _id: string;
  name: string;
  slug: string;
  displayName?: string;
  logo?: string;
  plan: string;
  maxMembers: number;
  createdBy: string;
  role?: string;
}

export class OrganizationService {
  private static readonly authServiceUrl = config.auth.serviceUrl;

  /**
   * Fetch organization from auth service
   */
  static async fetchOrganizationFromAuthService(
    orgId: string,
    ssoToken: string
  ): Promise<AuthServiceOrganization | null> {
    try {
      console.log('🔍 OrganizationService: Fetching org from auth service:', orgId);

      const response = await axios.get(
        `${this.authServiceUrl}/organizations/${orgId}`,
        {
          headers: {
            Cookie: `sso_token=${ssoToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ OrganizationService: Organization fetched successfully');
        return {
          _id: response.data.organization.id || response.data.organization._id,
          name: response.data.organization.name,
          slug: response.data.organization.slug,
          displayName: response.data.organization.displayName,
          logo: response.data.organization.logo,
          plan: response.data.organization.plan || 'free',
          maxMembers: response.data.organization.maxMembers || 10,
          createdBy: response.data.organization.createdBy,
          role: response.data.membership?.role,
        };
      }

      return null;
    } catch (error: any) {
      console.error('❌ OrganizationService: Failed to fetch org:', error.message);
      return null;
    }
  }

  /**
   * Fetch user's organizations from auth service
   */
  static async fetchUserOrganizationsFromAuthService(
    ssoToken: string
  ): Promise<AuthServiceOrganization[]> {
    try {
      console.log('🔍 OrganizationService: Fetching user orgs from auth service');

      const response = await axios.get(
        `${this.authServiceUrl}/organizations`,
        {
          headers: {
            Cookie: `sso_token=${ssoToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ OrganizationService: Organizations fetched successfully');
        return response.data.organizations.map((org: any) => ({
          _id: org.id || org._id,
          name: org.name,
          slug: org.slug,
          displayName: org.displayName,
          logo: org.logo,
          plan: org.plan || 'free',
          maxMembers: org.maxMembers || 10,
          createdBy: org.createdBy,
          role: org.role,
        }));
      }

      return [];
    } catch (error: any) {
      console.error('❌ OrganizationService: Failed to fetch orgs:', error.message);
      return [];
    }
  }

  /**
   * Sync organization from auth service to local database
   */
  static async syncOrganizationFromAuthService(
    authServiceOrgId: string,
    ssoToken: string,
    userId: string
  ): Promise<string | null> {
    try {
      // Check if org already exists in local DB
      const existingOrgs = await db
        .select()
        .from(organizations)
        .where(eq(organizations.authServiceOrgId, authServiceOrgId))
        .limit(1);

      if (existingOrgs.length > 0) {
        console.log('✅ OrganizationService: Organization already synced');
        return existingOrgs[0].id;
      }

      // Fetch from auth service
      const authOrg = await this.fetchOrganizationFromAuthService(
        authServiceOrgId,
        ssoToken
      );

      if (!authOrg) {
        console.error('❌ OrganizationService: Failed to fetch org from auth service');
        return null;
      }

      // Create local organization record
      const [newOrg] = await db
        .insert(organizations)
        .values({
          authServiceOrgId: authOrg._id,
          name: authOrg.name,
          slug: authOrg.slug,
          displayName: authOrg.displayName,
          logo: authOrg.logo,
          plan: authOrg.plan,
          maxMembers: authOrg.maxMembers,
          createdBy: userId,
        })
        .returning();

      console.log('✅ OrganizationService: Organization synced to local DB:', newOrg.id);

      // Create local membership record if role is provided
      if (authOrg.role) {
        await db.insert(organizationMembers).values({
          organizationId: newOrg.id,
          userId: userId,
          role: authOrg.role as 'owner' | 'admin' | 'member' | 'guest',
          status: 'active',
        }).onConflictDoNothing();

        console.log('✅ OrganizationService: Membership synced to local DB');
      }

      return newOrg.id;
    } catch (error: any) {
      console.error('❌ OrganizationService: Failed to sync organization:', error.message);
      return null;
    }
  }

  /**
   * Get organization by auth service org ID
   */
  static async getOrganizationByAuthServiceId(
    authServiceOrgId: string
  ): Promise<any | null> {
    try {
      const orgs = await db
        .select()
        .from(organizations)
        .where(eq(organizations.authServiceOrgId, authServiceOrgId))
        .limit(1);

      return orgs.length > 0 ? orgs[0] : null;
    } catch (error: any) {
      console.error('❌ OrganizationService: Failed to get organization:', error.message);
      return null;
    }
  }

  /**
   * Get user's membership in organization
   */
  static async getUserMembership(
    organizationId: string,
    userId: string
  ): Promise<any | null> {
    try {
      const memberships = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.status, 'active')
          )
        )
        .limit(1);

      return memberships.length > 0 ? memberships[0] : null;
    } catch (error: any) {
      console.error('❌ OrganizationService: Failed to get membership:', error.message);
      return null;
    }
  }

  /**
   * Check if user is a member of organization
   */
  static async isMember(organizationId: string, userId: string): Promise<boolean> {
    const membership = await this.getUserMembership(organizationId, userId);
    return !!membership;
  }
}
