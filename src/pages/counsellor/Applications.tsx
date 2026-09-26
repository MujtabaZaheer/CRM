import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { Application, ApplicationStage } from "../../types/application";
import { canUserSetStage, getStageSelectOptionLabel, getStageOwnerLabel } from "../../utils/stageAuthorization";
import { ApplicationDossierModal } from "../../components/counsellor/ApplicationDossierModal";
import { useAuth } from "../../contexts/AuthContext";
import {
  Search,
  History,
  Building2,
  GraduationCap,
  X,
  Eye,
} from "lucide-react";

export const CounsellorApplications: React.FC = () => {
  const { appUser } = useAuth();
  const { applications, documents, updateApplicationStage, loading } = useCounsellorData();
  const userRole = (appUser?.role as any) || "counsellor";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");

  // Application Dossier Inspection Modal state
  const [selectedDossierApp, setSelectedDossierApp] = useState<Application | null>(null);

  // Stage update modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [targetStage, setTargetStage] = useState<ApplicationStage>("Draft");
  const [stageNote, setStageNote] = useState("");

  // Timeline view modal
  const [timelineApp, setTimelineApp] = useState<Application | null>(null);

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      (app.applicationNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.universityName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.programmeName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === "All" || app.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const handleUpdateStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (!canUserSetStage(userRole, targetStage)) {
      const owner = getStageOwnerLabel(targetStage);
      alert(`Permission Denied: Only ${owner} is authorized to transition applications to "${targetStage}".`);
      return;
    }

    await updateApplicationStage(selectedApp.id, targetStage, stageNote);
    setSelectedApp(null);
    setStageNote("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">Loading assigned applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">My University Applications</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track student application milestones, click any candidate row to open their Application Dossier, inspect profile & academics, and manage university decisions.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] px-3 py-1.5 sq-card text-xs">
          <span className="text-[var(--text-muted)]">Applications Managed:</span>
          <span className="font-mono font-bold text-sky-400">{applications.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by app #, student, university, programme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-sky-500/50"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            "All",
            "Draft",
            "Initial Review",
            "Documents Pending",
            "Ready for Submission",
            "Submitted",
            "University Reviewing",
            "Additional Info Requested",
            "Conditional Offer",
            "Unconditional Offer",
            "Deposit Pending",
            "Deposit Paid",
            "CAS / COE Pending",
            "CAS Issued",
            "Visa Preparation",
            "Visa Submitted",
            "Visa Approved",
            "Enrolled",
            "Deferred",
            "Withdrawn",
            "Rejected",
          ].map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1.5 sq-badge text-xs transition-all whitespace-nowrap ${
                selectedStage === stage
                  ? "bg-sky-500 text-zinc-950 font-bold shadow-sm shadow-sky-500/20"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">App ID</th>
                <th className="px-4 py-3">Student Candidate</th>
                <th className="px-4 py-3">Target Programme & University</th>
                <th className="px-4 py-3">Intake</th>
                <th className="px-4 py-3">Current Stage</th>
                <th className="px-4 py-3">Dossier Docs</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                    No applications match the current search or stage filter.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const appEmbeddedDocs = Array.isArray((app as any).documents) ? (app as any).documents : [];
                  const combinedDocsMap = new Map<string, any>();
                  appEmbeddedDocs.forEach((d: any, idx: number) => {
                    const docId = d.id || `emb-${app.id}-${idx}`;
                    combinedDocsMap.set(docId, {
                      id: docId,
                      status: d.status || (d.verificationStatus === "verified" ? "Verified" : (d.verificationStatus === "rejected" ? "Rejected" : "Received")),
                      fileName: d.fileName || d.name,
                      docType: d.slotType || d.docType || "Other",
                    });
                  });
                  documents.forEach((d) => {
                    if (
                      (app.studentId && d.studentId === app.studentId) ||
                      ((d as any).applicationId && (d as any).applicationId === app.id) ||
                      (d.studentName && app.studentName && d.studentName.toLowerCase().trim() === app.studentName.toLowerCase().trim())
                    ) {
                      const existing = combinedDocsMap.get(d.id);
                      const isVerified =
                        d.status === "Verified" ||
                        (d.status as string) === "verified" ||
                        (d as any).verificationStatus === "verified" ||
                        existing?.status === "Verified";
                      combinedDocsMap.set(d.id, {
                        ...existing,
                        ...d,
                        status: isVerified ? "Verified" : (d.status || existing?.status || "Received"),
                      });
                    }
                  });
                  const studentDocs = Array.from(combinedDocsMap.values());
                  const verifiedDocs = studentDocs.filter(
                    (d) =>
                      d.status === "Verified" ||
                      (d.status as string) === "verified" ||
                      (d as any).verificationStatus === "verified"
                  );

                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedDossierApp(app)}
                      className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">
                        {app.applicationNumber}
                      </td>

                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:text-sky-400 transition-colors">{app.studentName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 space-y-0.5">
                        <div className="font-semibold text-[var(--text-primary)] flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>{app.universityName}</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">{app.programmeName}</div>
                      </td>

                      <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">{app.intake}</td>

                      <td className="px-4 py-3 text-xs">
                        <span className="px-2.5 py-0.5 sq-badge bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold text-[10px]">
                          {app.stage}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`px-2 py-0.5 sq-badge text-[10px] font-mono font-semibold ${
                            studentDocs.length > 0 && verifiedDocs.length === studentDocs.length
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : studentDocs.length > 0
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {studentDocs.length > 0
                            ? `${verifiedDocs.length}/${studentDocs.length} Verified`
                            : "0 Uploads"}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3 text-right space-x-2 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedDossierApp(app)}
                          className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 sq-btn text-[11px] inline-flex items-center space-x-1 font-semibold"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect Dossier</span>
                        </button>

                        <button
                          onClick={() => setTimelineApp(app)}
                          className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-[11px] inline-flex items-center space-x-1"
                        >
                          <History className="w-3 h-3 text-sky-400" />
                          <span>Timeline</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setTargetStage(app.stage);
                          }}
                          className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-zinc-950 font-bold sq-btn text-[11px]"
                        >
                          Advance Stage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Dossier Modal */}
      {selectedDossierApp && (
        <ApplicationDossierModal
          application={selectedDossierApp}
          onClose={() => setSelectedDossierApp(null)}
          onAdvanceStage={async (app, newStage, note) => {
            await updateApplicationStage(app.id, newStage, note);
            setSelectedDossierApp((prev) => (prev ? { ...prev, stage: newStage } : null));
          }}
        />
      )}

      {/* Stage Advance Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              Advance Stage: {selectedApp.applicationNumber}
            </h3>

            <form onSubmit={handleUpdateStageSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Select Next Application Milestone *</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as ApplicationStage)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)] font-semibold"
                >
                  {[
                    "Draft",
                    "Initial Review",
                    "Documents Pending",
                    "Ready for Submission",
                    "Submitted",
                    "University Reviewing",
                    "Additional Info Requested",
                    "Conditional Offer",
                    "Unconditional Offer",
                    "Deposit Pending",
                    "Deposit Paid",
                    "CAS / COE Pending",
                    "CAS Issued",
                    "Visa Preparation",
                    "Visa Submitted",
                    "Visa Approved",
                    "Enrolled",
                    "Deferred",
                    "Withdrawn",
                    "Rejected",
                  ].map((stg) => {
                    const isAllowed = canUserSetStage(userRole, stg as ApplicationStage);
                    return (
                      <option key={stg} value={stg} disabled={!isAllowed}>
                        {getStageSelectOptionLabel(stg as ApplicationStage, userRole)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Counsellor Transition Note</label>
                <textarea
                  rows={3}
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="Record reasons for stage progression..."
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-zinc-950 font-bold sq-btn text-xs"
                >
                  Confirm Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline View Modal */}
      {timelineApp && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Milestone History: {timelineApp.applicationNumber}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">{timelineApp.studentName} • {timelineApp.programmeName}</p>
              </div>
              <button
                onClick={() => setTimelineApp(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {(!timelineApp.history || timelineApp.history.length === 0) ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                  No stage transition history recorded yet. Currently in <span className="font-bold text-sky-400">{timelineApp.stage}</span>.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-default)]">
                  {timelineApp.history.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-500 border-2 border-[var(--bg-card)]" />
                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-sky-400">{item.stage}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">Updated by: {item.updatedBy}</div>
                        {item.note && (
                          <div className="text-xs text-[var(--text-primary)] pt-1 mt-1 border-t border-[var(--border-default)]">
                            "{item.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setTimelineApp(null)}
                className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounsellorApplications;
