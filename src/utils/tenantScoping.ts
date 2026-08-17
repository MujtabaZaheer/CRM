/**
 * EduCRM Multi-Tenant Scoping Utility
 * Enforces tenant-level data isolation across Firestore collections.
 */

import { where, QueryConstraint } from "firebase/firestore";
import { AppUser } from "../types/role";

export function getTenantQueryConstraints(appUser: AppUser | null): QueryConstraint[] {
  if (!appUser) return [];

  // Super Admin can inspect all tenants across the platform
  if (appUser.role === "platform_super_admin") return [];

  // Determine tenant identifier (tenantId or office branch)
  const tenantId = (appUser as any).tenantId || appUser.office || "default_tenant";
  return [where("tenantId", "==", tenantId)];
}

export function scopeDocumentWithTenant<T extends Record<string, any>>(data: T, appUser: AppUser | null): T & { tenantId: string; officeId?: string } {
  const tenantId = (appUser as any)?.tenantId || appUser?.office || "default_tenant";
  const officeId = (appUser as any)?.officeId || appUser?.office;
  return {
    ...data,
    tenantId,
    ...(officeId ? { officeId } : {}),
  };
}
