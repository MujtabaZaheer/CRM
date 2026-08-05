import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { Application, ApplicationStage } from "../../types/application";
import {
  Search,
  History,
  Building2,
  GraduationCap,
  X
} from "lucide-react";

export const CounsellorApplications: React.FC = () => {
  const { applications, updateApplicationStage, loading } = useCounsellorData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");

  // Stage update modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [targetStage, setTargetStage] = useState<ApplicationStage>("Draft");
  const [stageNote, setStageNote] = useState("");

  // Timeline view modal
  const [timelineApp, setTimelineApp] = useState<Application | null>(null);

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.programmeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === "All" || app.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const handleUpdateStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

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
            Track student application milestones from initial draft submission through conditional/unconditional offers, visa approvals, and enrolment.
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
            "Submitted",
            "Conditional Offer",
            "Unconditional Offer",
            "Visa Approved",
            "Enrolled"
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
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">University & Programme</th>
                <th className="px-4 py-3">Intake</th>
                <th className="px-4 py-3">Current Stage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                    No applications match the current search or stage filter.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sky-400">
                      {app.applicationNumber}
                    </td>

                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-teal-400" />
                        <span>{app.studentName}</span>
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

                    <td className="px-4 py-3 text-right space-x-2">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  <option value="Draft">Draft</option>
                  <option value="Initial Review">Initial Review</option>
                  <option value="Documents Pending">Documents Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="University Reviewing">University Reviewing</option>
                  <option value="Conditional Offer">Conditional Offer</option>
                  <option value="Unconditional Offer">Unconditional Offer</option>
                  <option value="Deposit Paid">Deposit Paid</option>
                  <option value="CAS Issued">CAS Issued</option>
                  <option value="Visa Approved">Visa Approved</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Milestone Progress Note</label>
                <textarea
                  rows={3}
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="e.g. Received offer letter from university admissions portal..."
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] sq-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 text-zinc-950 font-bold sq-btn shadow-lg shadow-sky-500/20"
                >
                  Save Stage Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {timelineApp && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Application Timeline: {timelineApp.applicationNumber}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {timelineApp.studentName} — {timelineApp.universityName}
                </p>
              </div>
              <button onClick={() => setTimelineApp(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {(!timelineApp.history || timelineApp.history.length === 0) ? (
                <p className="text-xs text-[var(--text-muted)] italic">No historical timeline logs found.</p>
              ) : (
                <div className="relative border-l-2 border-sky-500/30 ml-3 space-y-4 pl-4 text-xs">
                  {timelineApp.history.map((h, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-sky-400 border border-zinc-950" />
                      <div className="font-bold text-sky-400">{h.stage}</div>
                      <div className="text-[11px] text-[var(--text-primary)]">{h.note}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        {new Date(h.timestamp).toLocaleString()} by {h.updatedBy}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setTimelineApp(null)}
                className="px-5 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] sq-btn text-xs"
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
