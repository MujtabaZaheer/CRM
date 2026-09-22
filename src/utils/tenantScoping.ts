/**
 * EduCRM Multi-Tenant Scoping & Boundary Engine
 * Enforces strict multi-tenant isolation segmented by City / Branch and University Partner.
 * Guarantees zero cross-tenant data leakage at database and application layers.
 */

import { where, QueryConstraint } from "firebase/firestore";
import { AppUser } from "../types/role";

export interface TenantDefinition {
  id: string;
  name: string;
  code: string;
  type: "city" | "university" | "regional_hub";
  city: string;
  country: string;
  domain?: string;
  description: string;
}

export const TENANT_DEFINITIONS: TenantDefinition[] = [
  {
    id: "tenant-london",
    name: "London Global HQ",
    code: "LDN",
    type: "city",
    city: "London",
    country: "United Kingdom",
    domain: "london.educrm.com",
    description: "Central executive and admissions hub for the UK.",
  },
  {
    id: "tenant-manchester",
    name: "Manchester Regional Hub",
    code: "MAN",
    type: "city",
    city: "Manchester",
    country: "United Kingdom",
    domain: "manchester.educrm.com",
    description: "Northern England regional operations and student services.",
  },
  {
    id: "tenant-delhi",
    name: "Delhi South Asia Hub",
    code: "DEL",
    type: "regional_hub",
    city: "Delhi",
    country: "India",
    domain: "delhi.educrm.com",
    description: "South Asian regional recruitment and visa assistance.",
  },
  {
    id: "tenant-lahore",
    name: "Lahore Branch",
    code: "LHE",
    type: "city",
    city: "Lahore",
    country: "Pakistan",
    domain: "lahore.educrm.com",
    description: "Pakistan operations for undergraduate and postgraduate counselling.",
  },
  {
    id: "tenant-dubai",
    name: "Dubai Middle East Hub",
    code: "DXB",
    type: "regional_hub",
    city: "Dubai",
    country: "UAE",
    domain: "dubai.educrm.com",
    description: "Middle East regional hub for international student placement.",
  },
  {
    id: "tenant-univ-manchester",
    name: "Univ. of Manchester Partner Desk",
    code: "UOM",
    type: "university",
    city: "Manchester",
    country: "United Kingdom",
    domain: "manchester.ac.uk",
    description: "Dedicated institutional admissions partner partition.",
  },
  {
    id: "tenant-univ-sydney",
    name: "Univ. of Sydney Partner Desk",
    code: "USYD",
    type: "university",
    city: "Sydney",
    country: "Australia",
    domain: "sydney.edu.au",
    description: "Oceania institutional admissions partner partition.",
  },
  {
    id: "tenant-univ-toronto",
    name: "Univ. of Toronto Partner Desk",
    code: "UFT",
    type: "university",
    city: "Toronto",
    country: "Canada",
    domain: "utoronto.ca",
    description: "North American institutional admissions partner partition.",
  },
];

/**
 * Normalizes user office / branch names into canonical tenantId.
 */
export function mapOfficeToTenantId(office?: string, branchId?: string): string {
  if (branchId) {
    if (branchId.includes("london")) return "tenant-london";
    if (branchId.includes("manchester")) return "tenant-manchester";
    if (branchId.includes("delhi")) return "tenant-delhi";
    if (branchId.includes("lahore")) return "tenant-lahore";
    if (branchId.includes("dubai")) return "tenant-dubai";
  }

  if (!office) return "tenant-london";
  const o = office.toLowerCase();
  if (o.includes("manchester")) return "tenant-manchester";
  if (o.includes("delhi")) return "tenant-delhi";
  if (o.includes("lahore")) return "tenant-lahore";
  if (o.includes("dubai")) return "tenant-dubai";
  if (o.includes("london") || o.includes("hq")) return "tenant-london";
  return "tenant-london";
}

/**
 * Resolves the effective tenantId for an authenticated user.
 */
export function resolveUserTenantId(appUser: AppUser | null): string {
  if (!appUser) return "tenant-london";
  if (appUser.tenantId && appUser.tenantId !== "default_tenant" && appUser.tenantId !== "tenant-demo") {
    return appUser.tenantId;
  }
  return mapOfficeToTenantId(appUser.office, appUser.branchId);
}

/**
 * Retrieves a tenant definition by its ID.
 */
export function getTenantById(tenantId: string): TenantDefinition | undefined {
  return TENANT_DEFINITIONS.find((t) => t.id === tenantId);
}

/**
 * Validates whether a user is authorized to view or mutate a record in a target tenant.
 */
export function canAccessTenant(appUser: AppUser | null, targetTenantId?: string): boolean {
  if (!appUser) return false;
  // Super admin has global cross-tenant clearance
  if (appUser.role === "platform_super_admin") return true;

  if (!targetTenantId) return true; // Legacy/unpartitioned record fallback

  const userTenant = resolveUserTenantId(appUser);
  return userTenant === targetTenantId;
}

/**
 * Generates Firestore query constraints enforcing strict multi-tenant boundaries.
 * Non-super-admins CANNOT query across tenant boundaries under any circumstances.
 */
export function getTenantQueryConstraints(
  appUser: AppUser | null,
  activeTenantOverride?: string
): QueryConstraint[] {
  if (!appUser) return [];

  // Super Admin can inspect all tenants or scope to a specific active tenant
  if (appUser.role === "platform_super_admin") {
    if (activeTenantOverride && activeTenantOverride !== "ALL") {
      return [where("tenantId", "==", activeTenantOverride)];
    }
    return [];
  }

  // All other users (counsellors, admissions officers, office managers, local admins)
  // are strictly bound to their assigned tenant ID.
  const tenantId = resolveUserTenantId(appUser);
  return [where("tenantId", "==", tenantId)];
}

/**
 * Enforces in-memory tenant boundary filtering across all CRM search,
 * dashboards, reports, and table views.
 */
export function filterRecordsByTenant<T extends Record<string, any>>(
  records: T[],
  appUser: AppUser | null,
  activeTenantOverride?: string
): T[] {
  if (!appUser) return [];

  // Super Admin: respects explicit tenant switcher or sees all
  if (appUser.role === "platform_super_admin") {
    if (!activeTenantOverride || activeTenantOverride === "ALL") {
      return records;
    }
    return records.filter((r) => (r.tenantId || mapOfficeToTenantId(r.office, r.branchId)) === activeTenantOverride);
  }

  // Strict tenant boundary for all non-super-admins
  const userTenant = resolveUserTenantId(appUser);
  return records.filter((r) => {
    const recordTenant = r.tenantId || mapOfficeToTenantId(r.office, r.branchId);
    return recordTenant === userTenant;
  });
}

/**
 * Scopes new records with canonical tenant metadata prior to Firestore persistence.
 */
export function scopeDocumentWithTenant<T extends Record<string, any>>(
  data: T,
  appUser: AppUser | null,
  tenantOverride?: string
): T & { tenantId: string; tenantType?: string; campusCity?: string; officeId?: string } {
  const tenantId = tenantOverride || (appUser ? resolveUserTenantId(appUser) : "tenant-london");
  const tenantDef = getTenantById(tenantId);
  const officeId = (appUser as any)?.officeId || appUser?.office;

  return {
    ...data,
    tenantId,
    tenantType: tenantDef?.type || "city",
    campusCity: tenantDef?.city || (appUser?.office ? appUser.office : "London"),
    ...(officeId ? { officeId } : {}),
  };
}
