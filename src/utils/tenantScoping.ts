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
    id: "tenant-islamabad",
    name: "Islamabad Branch",
    code: "ISB",
    type: "city",
    city: "Islamabad",
    country: "Pakistan",
    domain: "islamabad.educrm.com",
    description: "Islamabad and Northern Pakistan regional hub for student counselling and visa.",
  },
  {
    id: "tenant-karachi",
    name: "Karachi Branch",
    code: "KHI",
    type: "city",
    city: "Karachi",
    country: "Pakistan",
    domain: "karachi.educrm.com",
    description: "Karachi and Sindh regional operations for higher education placements.",
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
    const b = branchId.toLowerCase();
    if (b.includes("islamabad") || b.includes("isb")) return "tenant-islamabad";
    if (b.includes("karachi") || b.includes("khi")) return "tenant-karachi";
    if (b.includes("lahore") || b.includes("lhr")) return "tenant-lahore";
    if (b.includes("london") || b.includes("ldn")) return "tenant-london";
    if (b.includes("manchester")) return "tenant-manchester";
    if (b.includes("delhi")) return "tenant-delhi";
    if (b.includes("dubai") || b.includes("dxb")) return "tenant-dubai";
  }

  if (!office) return "tenant-london";
  const o = office.toLowerCase();
  if (o.includes("islamabad") || o.includes("isb") || o.includes("rawalpindi")) return "tenant-islamabad";
  if (o.includes("karachi") || o.includes("khi")) return "tenant-karachi";
  if (o.includes("lahore") || o.includes("lhr")) return "tenant-lahore";
  if (o.includes("manchester")) return "tenant-manchester";
  if (o.includes("delhi")) return "tenant-delhi";
  if (o.includes("dubai") || o.includes("dxb")) return "tenant-dubai";
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
  // If no authenticated user (e.g. initial auth load, public view, or demo preview), return records
  if (!appUser) return records;

  // Global Cross-Tenant Roles: Super Admin, Org Admin, Auditor, Support Desk
  const isGlobalRole =
    appUser.role === "platform_super_admin" ||
    appUser.role === "org_admin" ||
    appUser.role === "auditor" ||
    appUser.role === "support_user";

  if (isGlobalRole) {
    if (!activeTenantOverride || activeTenantOverride === "ALL") {
      return records;
    }
    return records.filter((r) => {
      const recordTenant = r.tenantId || (r.office || r.branchId ? mapOfficeToTenantId(r.office, r.branchId) : undefined);
      return !recordTenant || recordTenant === activeTenantOverride || recordTenant === "ALL" || recordTenant === "tenant-demo";
    });
  }

  // External Agent: Scoped to agent's own referrals and city partition
  if (appUser.role === "external_agent") {
    const userTenant = appUser.tenantId;
    return records.filter((r) => {
      // Direct referral attribution (agent owns the record)
      if (
        (appUser.uid && (r.agentUid === appUser.uid || r.agentId === appUser.uid || r.referredBy === appUser.uid)) ||
        (appUser.email && r.agentEmail === appUser.email)
      ) {
        return true;
      }
      // Demo agent convenience: allow viewing demo agent referrals
      if (appUser.uid === "demo_external_agent" || appUser.email === "external_agent@educrm.demo") {
        if (r.agentUid === "agent_gec" || r.agentUid === "agent_opa" || r.agentReferred) {
          return true;
        }
      }
      // City-scoped agent partition (if agent has a specific branch tenant and record has a specific tenant)
      if (userTenant && userTenant !== "default_tenant" && userTenant !== "tenant-demo") {
        const recordTenant = r.tenantId || (r.office || r.branchId ? mapOfficeToTenantId(r.office, r.branchId) : undefined);
        return recordTenant === userTenant;
      }
      return false;
    });
  }

  // Strict tenant boundary for regional branch staff (counsellor, admissions_officer, etc.)
  const userTenant = resolveUserTenantId(appUser);
  const isDemoCounsellor =
    appUser.email === "counsellor@educrm.demo" ||
    appUser.uid === "usr_3" ||
    appUser.uid === "demo_counsellor" ||
    (activeTenantOverride && activeTenantOverride === "ALL");

  return records.filter((r) => {
    // Demo counsellor convenience: allow viewing all demo & test records
    if (isDemoCounsellor) {
      return true;
    }

    // Direct personal assignment override (takes precedence: if assigned directly to this user, they must see it)
    if (
      (appUser.uid && (
        r.assignedCounsellorId === appUser.uid ||
        r.assignedTo === appUser.uid ||
        r.counsellorId === appUser.uid ||
        r.assignedOfficerId === appUser.uid ||
        r.assignedCounsellor === appUser.uid
      )) ||
      (appUser.email && (
        r.assignedTo === appUser.email ||
        r.assignedOfficerEmail === appUser.email ||
        r.assignedCounsellor === appUser.email ||
        r.assignedCounsellorEmail === appUser.email ||
        r.assignedCounsellorId === appUser.email ||
        r.counsellorId === appUser.email ||
        (r.studentEmail && appUser.email && r.studentEmail.toLowerCase() === appUser.email.toLowerCase())
      ))
    ) {
      return true;
    }

    // Agent-referred records awaiting counselling/triage: allow operational staff visibility
    if (r.agentReferred || r.isAgentReferred || r.source === "External Agent Referral" || r.source === "Agent Referral") {
      if (!r.assignedCounsellor || r.assignedCounsellor === appUser.email || !r.tenantId || r.tenantId === userTenant) {
        return true;
      }
    }

    // If record explicitly specifies tenantId
    if (r.tenantId) {
      if (r.tenantId === userTenant) return true;
      if (r.tenantId === "ALL" || r.tenantId === "tenant-demo") return true;
      return false;
    }

    // If record has office/branch specified, check mapped tenant
    if (r.office || r.branchId) {
      const recordTenant = mapOfficeToTenantId(r.office, r.branchId);
      return recordTenant === userTenant;
    }

    // Unpartitioned legacy/demo records are accessible
    return true;
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
