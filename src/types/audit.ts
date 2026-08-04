export interface AuditLog {
  id: string;
  action: string; // e.g. "LEAD_CREATED", "ROLE_UPDATED", "APPLICATION_SUBMITTED"
  performedBy: string; // email/name
  performedByRole?: string;
  targetEntity: string; // e.g. "Lead", "User", "Application"
  targetId?: string;
  details: string; // human readable summary
  timestamp: number;
}
