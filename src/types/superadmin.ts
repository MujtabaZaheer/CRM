export type TenantStatus = "Active" | "Suspended" | "Trial" | "Cancelled";
export type SubscriptionTier = "Starter" | "Professional" | "Enterprise" | "Custom";

export interface TenantOrganization {
  id: string;
  name: string;
  domain: string;
  adminEmail: string;
  tier: SubscriptionTier;
  status: TenantStatus;
  userCount: number;
  studentCount: number;
  createdAt: number;
  expiresAt: number;
}

export interface SubscriptionPlan {
  id: string;
  name: SubscriptionTier;
  monthlyPriceUSD: number;
  maxUsers: number;
  maxStudents: number;
  features: string[];
}

export interface SystemHealthMetric {
  serviceName: string;
  status: "Operational" | "Degraded" | "Outage";
  latencyMs: number;
  uptimePercent: number;
  lastChecked: number;
}

export interface GlobalSetting {
  id: string;
  maintenanceMode: boolean;
  allowPublicRegistration: boolean;
  enforceMFA: boolean;
  defaultTimezone: string;
  defaultCurrency: string;
  systemNotice?: string;
  updatedAt: number;
}
