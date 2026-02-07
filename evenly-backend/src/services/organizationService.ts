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
      // Remove '/auth' from URL since organizations endpoint is at /api/v1/organizations not /api/v1/auth/organizations
      const baseUrl = this.authServiceUrl.replace(/\/auth$/, '');
      const response = await axios.get(
        `${baseUrl}/organizations/${orgId}`,
        {
          headers: {
            Cookie: `sso_token=${ssoToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      if (response.status === 200 && response.data.success) {
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
        return existingOrgs[0].id;
      }

      // Fetch from auth service
      const authOrg = await this.fetchOrganizationFromAuthService(
        authServiceOrgId,
        ssoToken
      );

      if (!authOrg) {
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
      // Create local membership record if role is provided
      if (authOrg.role) {
        await db.insert(organizationMembers).values({
          organizationId: newOrg.id,
          userId: userId,
          role: authOrg.role as 'owner' | 'admin' | 'member' | 'guest',
          status: 'active',
        }).onConflictDoNothing();
      }

      return newOrg.id;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Sync organization from data (already have the organization data from login response)
   */
  static async syncOrganizationFromData(
    orgData: {
      id: string;
      name: string;
      displayName?: string;
      domainIdentifier?: string;
      role?: string;
    },
    userId: string
  ): Promise<string | null> {
    try {
      // Check if org already exists in local DB
      const existingOrgs = await db
        .select()
        .from(organizations)
        .where(eq(organizations.authServiceOrgId, orgData.id))
        .limit(1);

      if (existingOrgs.length > 0) {
        // Make sure membership exists
        if (orgData.role) {
          await db.insert(organizationMembers).values({
            organizationId: existingOrgs[0].id,
            userId: userId,
            role: orgData.role as 'owner' | 'admin' | 'member' | 'guest',
            status: 'active',
          }).onConflictDoNothing();
        }
        return existingOrgs[0].id;
      }

      // Create local organization record using the data we already have
      const [newOrg] = await db
        .insert(organizations)
        .values({
          authServiceOrgId: orgData.id,
          name: orgData.name,
          slug: orgData.domainIdentifier || orgData.name.toLowerCase().replace(/\s+/g, '-'),
          displayName: orgData.displayName || orgData.name,
          logo: null,
          plan: 'free',
          maxMembers: 10,
          createdBy: userId,
        })
        .returning();
      // Create local membership record
      if (orgData.role) {
        await db.insert(organizationMembers).values({
          organizationId: newOrg.id,
          userId: userId,
          role: orgData.role as 'owner' | 'admin' | 'member' | 'guest',
          status: 'active',
        }).onConflictDoNothing();
      }

      return newOrg.id;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Get local organization ID for the Evenly app (hardcoded org).
   * Use when request.organizationId is missing so controllers never see "Organization ID is required".
   */
  static async getDefaultLocalOrganizationId(userId: string): Promise<string | null> {
    const authServiceOrgId = config.auth.evenlyOrganizationId || '';
    if (!authServiceOrgId) return null;
    const localOrg = await this.getOrganizationByAuthServiceId(authServiceOrgId);
    if (localOrg) return localOrg.id;
    return await this.ensureOrganizationExistsForAuthServiceId(authServiceOrgId, userId);
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

  /**
   * Ensure organization exists in local DB for the given auth-service org id, and user is a member.
   * Used as fallback when sync from auth service fails (e.g. mobile token). Creates minimal org if missing.
   * Returns local organization id or null.
   */
  static async ensureOrganizationExistsForAuthServiceId(
    authServiceOrgId: string,
    userId: string
  ): Promise<string | null> {
    try {
      let localOrg = await this.getOrganizationByAuthServiceId(authServiceOrgId);
      if (localOrg) {
        const isMember = await this.isMember(localOrg.id, userId);
        if (!isMember) {
          await db.insert(organizationMembers).values({
            organizationId: localOrg.id,
            userId,
            role: 'member',
            status: 'active',
          }).onConflictDoNothing();
        }
        return localOrg.id;
      }
      const slug = `org-${authServiceOrgId}`.slice(0, 255);
      const [newOrg] = await db
        .insert(organizations)
        .values({
          authServiceOrgId,
          name: 'Default',
          slug,
          displayName: 'Default',
          plan: 'free',
          maxMembers: 10,
          createdBy: userId,
        })
        .returning();
      await db.insert(organizationMembers).values({
        organizationId: newOrg.id,
        userId,
        role: 'owner',
        status: 'active',
      }).onConflictDoNothing();
      return newOrg.id;
    } catch (error: any) {
      return null;
    }
  }
}
