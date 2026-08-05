import React, { useState, useEffect } from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { db } from "../../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  Search, 
  UserCheck, 
  Activity, 
  Check, 
  AlertCircle
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: number;
}

export const TeamLeaderAssignApplications: React.FC = () => {
  const {
    counsellors,
    assignmentApplications,
    loading,
    assignApplication,
    bulkAssignApplications
  } = useTeamLeaderData();

  // State
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [targetCounsellor, setTargetCounsellor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const stageFilter = "All";
  const [counsellorFilter, setCounsellorFilter] = useState("All");
  const [assignmentLogs, setAssignmentLogs] = useState<AuditLog[]>([]);
  const [loadError, setLoadError] = useState("");

  // Modals
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [singleAppToAssign, setSingleAppToAssign] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch assignment logs
  useEffect(() => {
    const q = query(
      collection(db, "audit_logs"),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const logs: AuditLog[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.action === "APPLICATION_ASSIGNED") {
          logs.push({
            id: doc.id,
            action: data.action,
            user: data.performedBy || "Unknown",
            details: data.details || "Application assignment updated.",
            timestamp: data.timestamp || Date.now()
          });
        }
      });
      setAssignmentLogs(logs.slice(0, 8)); // Top 8
      setLoadError("");
    }, () => setLoadError("Assignment activity could not be loaded."));
    return () => unsub();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedApps(filteredApps.map(a => a.id));
    } else {
      setSelectedApps([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApps(prev => [...prev, id]);
    } else {
      setSelectedApps(prev => prev.filter(item => item !== id));
    }
  };

  const handleExecuteAssignment = async () => {
    if (!targetCounsellor) return;

    try {
      if (singleAppToAssign) {
        await assignApplication(singleAppToAssign, targetCounsellor);
        setSuccessMessage("Application assigned successfully!");
      } else if (selectedApps.length > 0) {
        await bulkAssignApplications(selectedApps, targetCounsellor);
        setSuccessMessage(`${selectedApps.length} applications assigned successfully!`);
      }
      
      // Reset
      setSelectedApps([]);
      setTargetCounsellor("");
      setSingleAppToAssign(null);
      setIsConfirmOpen(false);

      // Auto clear alert
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to assign application.");
    }
  };

  // Filter applications
  const filteredApps = assignmentApplications.filter((app) => {
    const name = app.studentName.toLowerCase();
    const num = app.applicationNumber.toLowerCase();
    const uni = app.universityName.toLowerCase();
    const queryStr = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(queryStr) || num.includes(queryStr) || uni.includes(queryStr);
    const matchesStage = stageFilter === "All" || app.stage === stageFilter;
    const matchesCounsellor = counsellorFilter === "All" || 
                              (counsellorFilter === "Unassigned" && !app.assignedCounsellor) ||
                              app.assignedCounsellor === counsellorFilter;
                              
    return matchesSearch && matchesStage && matchesCounsellor;
  });

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6 text-xs">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Application Assignments</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Delegate students to team counsellors, reassign files, and monitor load balancing.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 sq-badge flex items-center space-x-2 font-medium">
            <Check className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}
        {loadError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 sq-badge flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Bulk Actions Panel */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/10 p-4 sq-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sq-avatar bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[var(--text-primary)]">Bulk Assignment Engine</span>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {selectedApps.length} applications selected for assignment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <select
              value={targetCounsellor}
              onChange={(e) => setTargetCounsellor(e.target.value)}
              disabled={selectedApps.length === 0}
              className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)] disabled:opacity-50"
            >
              <option value="">-- Select Recruiter --</option>
              {counsellors.map((c) => (
                <option key={c.uid} value={c.email}>
                  {c.displayName || c.email} ({c.email.split("@")[0]})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSingleAppToAssign(null);
                setIsConfirmOpen(true);
              }}
              disabled={selectedApps.length === 0 || !targetCounsellor}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-zinc-950 font-bold sq-btn transition-colors cursor-pointer disabled:opacity-50"
            >
              Assign Selected
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main allocation Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by student or university name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none"
                />
              </div>

              <select
                value={counsellorFilter}
                onChange={(e) => setCounsellorFilter(e.target.value)}
                className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
              >
                <option value="All">All Assignments</option>
                <option value="Unassigned">Unassigned</option>
                {counsellors.map((c) => (
                  <option key={c.uid} value={c.email}>
                    {c.displayName || c.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                  <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={filteredApps.length > 0 && selectedApps.length === filteredApps.length}
                          className="rounded border-[var(--border-default)] text-emerald-500 focus:ring-emerald-500 bg-[var(--bg-input)]"
                        />
                      </th>
                      <th className="py-3 px-4">Application Details</th>
                      <th className="py-3 px-4">University / Program</th>
                      <th className="py-3 px-4">Current Recruiter</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4 text-right">Assign Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                          Loading applications...
                        </td>
                      </tr>
                    ) : filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                          No applications match current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => {
                        const isChecked = selectedApps.includes(app.id);
                        return (
                          <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleSelectOne(app.id, e.target.checked)}
                                className="rounded border-[var(--border-default)] text-emerald-500 focus:ring-emerald-500 bg-[var(--bg-input)]"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-emerald-400 block">{app.applicationNumber}</span>
                              <span className="font-bold text-[var(--text-primary)] text-sm">{app.studentName}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[var(--text-primary)]">{app.universityName}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">{app.programmeName}</div>
                            </td>
                            <td className="py-3 px-4">
                              {app.assignedCounsellor ? (
                                <span className="px-2 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] font-medium text-[var(--text-secondary)]">
                                  {app.assignedCounsellor.split("@")[0]}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 sq-badge bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 sq-pill border border-teal-500/20 bg-teal-500/10 text-teal-400 font-semibold text-[10px]">
                                {app.stage}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <select
                                value={app.assignedCounsellor || ""}
                                onChange={async (e) => {
                                  if (e.target.value) {
                                    setTargetCounsellor(e.target.value);
                                    setSingleAppToAssign(app.id);
                                    setIsConfirmOpen(true);
                                  }
                                }}
                                className="px-2.5 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-input text-[11px]"
                              >
                                <option value="">-- Change Recruiter --</option>
                                {counsellors.map((c) => (
                                  <option key={c.uid} value={c.email}>
                                    {c.displayName || c.email.split("@")[0]}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Allocation Logs Timeline */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div className="flex items-center space-x-2 border-b border-[var(--border-default)] pb-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Assignment Timeline</h3>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-96 pr-1">
              {assignmentLogs.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No allocation updates in the timeline.
                </div>
              ) : (
                assignmentLogs.map((log, i) => (
                  <div key={log.id} className="flex items-start space-x-3 relative">
                    {i !== assignmentLogs.length - 1 && (
                      <div className="absolute left-3 top-5 bottom-[-16px] w-[1px] bg-[var(--border-default)]" />
                    )}
                    <div className="w-6 h-6 sq-avatar bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)]">Allocated</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] mt-0.5 leading-relaxed">{log.details}</p>
                      <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">Agent: {log.user}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-sm sq-modal shadow-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-heading font-bold text-sm">Confirm Reallocation</h3>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Are you sure you want to assign the selected application file(s) to{" "}
                <span className="text-[var(--text-primary)] font-bold">{targetCounsellor}</span>?
              </p>
              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setSingleAppToAssign(null);
                  }}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold sq-btn hover:bg-[var(--bg-elevated)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteAssignment}
                  className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn hover:bg-emerald-400"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
export default TeamLeaderAssignApplications;
