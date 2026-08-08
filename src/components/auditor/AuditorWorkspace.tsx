import React, { useState } from "react";
import { useAuditorData } from "../../hooks/useAuditorData";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  Filter,
  History,
  Lock,
  Search,
  ShieldCheck
} from "lucide-react";

export type AuditorSubPage =
  | "dashboard"
  | "audit-trail"
  | "compliance-inspect"
  | "system-logs"
  | "reports"
  | "notifications";

export const AuditorWorkspace: React.FC<{ page: AuditorSubPage }> = ({ page }) => {
  const auditor = useAuditorData();
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [inspectTarget, setInspectTarget] = useState<any | null>(null);
  const [notice, setNotice] = useState("");

  const filteredLogs = auditor.logs.filter((l) => {
    const matchesSearch =
      `${l.action} ${l.actorEmail} ${l.module} ${l.details}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === "All" || l.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const filteredApplications = auditor.applications.filter((a) =>
    `${a.applicationNumber} ${a.studentName} ${a.universityName} ${a.stage}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleRunComplianceAudit = async (appId: string, appName: string, passed: boolean) => {
    await auditor.recordComplianceAudit(
      "Application",
      appId,
      appName,
      "Document Verification & Mandatory Field Integrity",
      passed,
      passed ? "Compliance check verified clean." : "Discrepancy flagged for compliance team review."
    );
    setNotice(
      passed
        ? `Application ${appName} compliance PASSED & recorded to immutable log.`
        : `Application ${appName} FLAGGED for compliance investigation.`
    );
  };

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Auditor & Read-Only Portal — {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Immutable audit logs, system security monitoring, compliance verification, and read-only inspection.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Read-Only Protected Mode</span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Total Audit Events</span>
                <History className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{auditor.metrics.totalAuditEvents}</p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Security Events</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{auditor.metrics.criticalSecurityEvents}</p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Compliance Score</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{auditor.metrics.compliancePassRate}%</p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Entities Audited</span>
                <FileCheck className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{auditor.metrics.totalEntitiesAudited}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text-primary)]">Live Audit Trail Feed</h2>
              <div className="divide-y divide-[var(--border-default)]">
                {auditor.logs.slice(0, 6).map((log) => (
                  <div key={log.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400 font-mono">{log.action}</span>
                      <span className="text-[var(--text-muted)]">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{log.details}</p>
                    <div className="text-[10px] text-[var(--text-muted)]">By: {log.actorEmail} ({log.module})</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text-primary)]">Compliance Inspection Quick Audit</h2>
              <div className="divide-y divide-[var(--border-default)]">
                {auditor.applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{app.studentName}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {app.applicationNumber} • {app.universityName} ({app.stage})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunComplianceAudit(app.id, app.studentName, true)}
                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded font-bold"
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => handleRunComplianceAudit(app.id, app.studentName, false)}
                        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded font-bold"
                      >
                        Flag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL PAGE */}
      {page === "audit-trail" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by action, actor email, details..."
                className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              >
                <option value="All">All Modules</option>
                <option value="Admissions">Admissions</option>
                <option value="Finance">Finance</option>
                <option value="Support">Support</option>
                <option value="System">System</option>
              </select>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Actor / User</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Details / Audit Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{log.action}</td>
                    <td className="p-3 font-semibold text-[var(--text-primary)]">{log.actorEmail}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{log.module}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLIANCE INSPECT PAGE */}
      {page === "compliance-inspect" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter applications for read-only inspection..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Application ID</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">University</th>
                  <th className="p-3">Programme</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3 text-right">Read-Only Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-mono font-bold text-emerald-400">{app.applicationNumber}</td>
                    <td className="p-3 font-bold text-[var(--text-primary)]">{app.studentName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{app.universityName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{app.programmeName}</td>
                    <td className="p-3 font-semibold">{app.stage}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectTarget(app)}
                        className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] font-bold rounded flex items-center gap-1 ml-auto text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM LOGS PAGE */}
      {page === "system-logs" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
          <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> System Security & Access Logs
          </h2>
          <div className="font-mono text-[11px] bg-zinc-950 p-4 rounded-lg space-y-2 border border-zinc-800 max-h-96 overflow-y-auto">
            {auditor.logs.map((l) => (
              <div key={l.id} className="text-zinc-400 border-b border-zinc-900 pb-1">
                <span className="text-emerald-400">[{new Date(l.timestamp).toISOString()}]</span>{" "}
                <span className="text-amber-400">{l.action}</span> by <span className="text-teal-400">{l.actorEmail}</span> - {l.details}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS PAGE */}
      {page === "reports" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4 max-w-xl">
          <h2 className="font-bold text-base text-[var(--text-primary)]">Audit Compliance & Inspection Summary</h2>
          <p className="text-[var(--text-secondary)]">
            Export official read-only audit certificate and compliance validation record.
          </p>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Compliance Audit Report
          </button>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-sm text-[var(--text-primary)]">Compliance Flags & Security Notices</h2>
          <div className="space-y-2">
            {auditor.logs
              .filter((l) => l.action.includes("FLAGGED") || l.action.includes("SECURITY"))
              .map((l) => (
                <div key={l.id} className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg flex items-center justify-between">
                  <span>{l.details}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{new Date(l.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {inspectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <div className="w-full max-w-lg p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-default)] pb-3">
              <h2 className="font-bold text-sm text-[var(--text-primary)]">Read-Only Application Audit</h2>
              <button onClick={() => setInspectTarget(null)} className="font-bold hover:underline">
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div><strong>Application No:</strong> {inspectTarget.applicationNumber}</div>
              <div><strong>Student:</strong> {inspectTarget.studentName}</div>
              <div><strong>University:</strong> {inspectTarget.universityName}</div>
              <div><strong>Stage:</strong> {inspectTarget.stage}</div>
              <div><strong>Intake:</strong> {inspectTarget.intake}</div>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[11px]">
              🔒 All data presented in read-only immutable view. No modification allowed.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
