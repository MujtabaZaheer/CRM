import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { RoleGate } from "../components/layout/RoleGate";
import { Lead } from "../types/lead";
import { Student } from "../types/student";
import { Application } from "../types/application";
import { detectDuplicateLeads } from "../utils/dataQuality";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  AlertCircle,
  Search,
  RefreshCw,
  UserX,
  FileWarning
} from "lucide-react";

export interface QualityIssue {
  id: string;
  category: "Missing Field" | "Invalid Format" | "Duplicate Lead" | "Unassigned Application" | "Stale Data";
  severity: "High" | "Medium" | "Low";
  entityName: string;
  description: string;
  recommendation: string;
}

export const DataQualityContent: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let loaded = 0;
    const finish = () => {
      loaded += 1;
      if (loaded >= 3) setLoading(false);
    };

    const unsubLeads = onSnapshot(collection(db, "leads"), (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lead));
      finish();
    });

    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Student));
      finish();
    });

    const unsubApps = onSnapshot(collection(db, "applications"), (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application));
      finish();
    });

    return () => {
      unsubLeads();
      unsubStudents();
      unsubApps();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const detected: QualityIssue[] = [];
    let issueCount = 1;

    // 1. Detect duplicate leads
    const dupClusters = detectDuplicateLeads(
      leads.map((l) => ({
        id: l.id,
        name: l.fullName,
        email: l.email,
        phone: l.phone,
        passportNumber: l.passportNumber,
        status: l.stage,
        createdAt: l.createdAt,
      }))
    );

    dupClusters.forEach((c) => {
      detected.push({
        id: `issue-${issueCount++}`,
        category: "Duplicate Lead",
        severity: "High",
        entityName: c.masterLead.name,
        description: `Flagged ${c.duplicateLeads.length} potential duplicate record(s) matching by ${c.matchReason}`,
        recommendation: "Use the Lead Deduplication tool to merge records.",
      });
    });

    // 2. Detect leads missing phone or email
    leads.forEach((l) => {
      if (!l.email || !l.email.includes("@")) {
        detected.push({
          id: `issue-${issueCount++}`,
          category: "Invalid Format",
          severity: "High",
          entityName: l.fullName,
          description: "Missing or invalid email address format.",
          recommendation: "Update lead contact details.",
        });
      }
      if (!l.phone || l.phone.length < 5) {
        detected.push({
          id: `issue-${issueCount++}`,
          category: "Missing Field",
          severity: "Medium",
          entityName: l.fullName,
          description: "Missing phone / WhatsApp contact number.",
          recommendation: "Contact student to record phone number.",
        });
      }
    });

    // 3. Detect unassigned applications
    applications.forEach((a) => {
      if (!a.assignedCounsellor) {
        detected.push({
          id: `issue-${issueCount++}`,
          category: "Unassigned Application",
          severity: "High",
          entityName: `${a.studentName} (${a.universityName})`,
          description: "Application has no assigned counsellor.",
          recommendation: "Assign to a counsellor or team leader.",
        });
      }
    });

    // 4. Detect stale leads (>30 days in 'New' stage)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    leads.forEach((l) => {
      if (l.stage === "New" && l.createdAt < thirtyDaysAgo) {
        detected.push({
          id: `issue-${issueCount++}`,
          category: "Stale Data",
          severity: "Medium",
          entityName: l.fullName,
          description: "Lead stuck in 'New' stage for over 30 days without contact.",
          recommendation: "Re-assign or change stage to Lost/Unresponsive.",
        });
      }
    });

    setIssues(detected);
  }, [leads, students, applications, loading]);

  const filteredIssues = issues.filter((i) =>
    `${i.entityName} ${i.category} ${i.description}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Data Quality & Governance Control Center
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Automated data validation engine identifying duplicate leads, invalid emails, unassigned cases, and stale entries
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-secondary)]">Total Flagged Issues</div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">{issues.length}</div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center space-x-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-secondary)]">High Severity</div>
            <div className="text-xl font-bold text-rose-400 font-mono">
              {issues.filter((i) => i.severity === "High").length}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center space-x-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-secondary)]">Unassigned Cases</div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">
              {issues.filter((i) => i.category === "Unassigned Application").length}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center space-x-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <FileWarning className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-secondary)]">Duplicate Clusters</div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">
              {issues.filter((i) => i.category === "Duplicate Lead").length}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search quality issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 pl-9 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs"
          />
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Running data quality audit...</div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-[var(--text-primary)]">Zero Data Quality Issues Found</div>
            <p className="text-xs text-[var(--text-secondary)]">Your CRM dataset satisfies all completeness and format rules.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px] border-b border-[var(--border-default)]">
                  <th className="p-3">Entity Name</th>
                  <th className="p-3">Issue Category</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Audit Details</th>
                  <th className="p-3">Recommended Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-bold">{issue.entityName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-[10px] font-mono">
                        {issue.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          issue.severity === "High"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : issue.severity === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">{issue.description}</td>
                    <td className="p-3 text-emerald-400 font-medium">{issue.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const DataQualityPage: React.FC = () => {
  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "office_manager"]}>
      <DataQualityContent />
    </RoleGate>
  );
};
