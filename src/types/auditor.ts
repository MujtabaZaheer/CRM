export interface ComplianceCheck {
  id: string;
  entityType: "Student" | "Application" | "Document" | "Financial";
  entityId: string;
  entityName: string;
  checkTitle: string;
  passed: boolean;
  notes?: string;
  checkedBy: string;
  checkedAt: number;
}

export interface SystemActivityLog {
  id: string;
  action: string;
  actorEmail: string;
  actorRole?: string;
  module: string;
  details: string;
  targetId?: string;
  timestamp: number;
}

export interface DataIntegrityMetric {
  totalAuditEvents: number;
  criticalSecurityEvents: number;
  compliancePassRate: number;
  totalEntitiesAudited: number;
}

export interface AuditorFilters {
  searchQuery: string;
  moduleFilter: string;
  actorFilter: string;
  dateRange: "All" | "Today" | "7 Days" | "30 Days";
}
