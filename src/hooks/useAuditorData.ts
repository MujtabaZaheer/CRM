import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { logAuditEvent } from "../utils/auditLogger";
import {
  ComplianceCheck,
  DataIntegrityMetric,
  SystemActivityLog,
} from "../types/auditor";

export const useAuditorData = () => {
  const { appUser } = useAuth();
  const globalData = useGlobalData();

  const [logs, setLogs] = useState<SystemActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const unsubLogs = onSnapshot(
      query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(200)),
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SystemActivityLog));
        setLoadingLogs(false);
      },
      (err) => {
        console.warn("Audit logs subscription warning:", err.message);
        setLoadingLogs(false);
      }
    );

    return () => unsubLogs();
  }, []);

  const recordComplianceAudit = useCallback(
    async (entityType: ComplianceCheck["entityType"], entityId: string, entityName: string, checkTitle: string, passed: boolean, notes?: string) => {
      try {
        await logAuditEvent(
          passed ? "AUDIT_COMPLIANCE_PASSED" : "AUDIT_COMPLIANCE_FLAGGED",
          appUser?.email || "Auditor",
          "ComplianceAudit",
          `Audited ${entityType} '${entityName}' [${entityId}]: ${checkTitle} -> ${passed ? "PASSED" : "FLAGGED"}. ${notes || ""}`,
          entityId,
          appUser?.role
        );
      } catch (err: any) {
        console.error("Compliance audit record failed:", err);
      }
    },
    [appUser]
  );

  const metrics: DataIntegrityMetric = useMemo(() => {
    const totalAuditEvents = logs.length;
    const criticalSecurityEvents = logs.filter(
      (l) => l.action.includes("SECURITY") || l.action.includes("FLAGGED") || l.action.includes("FAILED")
    ).length;

    const compliancePasses = logs.filter((l) => l.action === "AUDIT_COMPLIANCE_PASSED").length;
    const complianceFlags = logs.filter((l) => l.action === "AUDIT_COMPLIANCE_FLAGGED").length;
    const totalChecked = compliancePasses + complianceFlags;
    const compliancePassRate = totalChecked > 0 ? Math.round((compliancePasses / totalChecked) * 100) : 100;

    const totalEntitiesAudited =
      globalData.leads.length +
      globalData.students.length +
      globalData.applications.length +
      globalData.documents.length;

    return {
      totalAuditEvents,
      criticalSecurityEvents,
      compliancePassRate,
      totalEntitiesAudited,
    };
  }, [logs, globalData]);

  return {
    logs,
    loadingLogs,
    metrics,
    recordComplianceAudit,
    leads: globalData.leads,
    students: globalData.students,
    applications: globalData.applications,
    documents: globalData.documents,
    tasks: globalData.tasks,
  };
};
