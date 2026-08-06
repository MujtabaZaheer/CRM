import React, { useState } from "react";
import { useAdmissionsData } from "../../hooks/useAdmissionsData";
import { ApplicationStage } from "../../types/application";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Filter,
  FolderOpen,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  Send,
} from "lucide-react";

export type AdmissionsSubPage =
  | "dashboard"
  | "applications"
  | "verification"
  | "offers"
  | "tasks"
  | "reports"
  | "notifications";

const ALL_STAGES: ApplicationStage[] = [
  "Draft",
  "Initial Review",
  "Documents Pending",
  "Submitted",
  "University Reviewing",
  "Conditional Offer",
  "Unconditional Offer",
  "Deposit Paid",
  "CAS Issued",
  "Visa Approved",
  "Enrolled",
  "Rejected",
  "Withdrawn",
];

const StatusBadge: React.FC<{ value: string }> = ({ value }) => {
  let color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (value.includes("Pending") || value.includes("Review") || value.includes("Draft")) {
    color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (value.includes("Rejected") || value.includes("Withdrawn")) {
    color = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  } else if (value.includes("Offer") || value.includes("CAS") || value.includes("Visa") || value.includes("Enrolled")) {
    color = "bg-teal-500/10 text-teal-400 border-teal-500/20";
  }
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${color}`}>
      {value}
    </span>
  );
};

export const AdmissionsWorkspace: React.FC<{ page: AdmissionsSubPage }> = ({ page }) => {
  const admissions = useAdmissionsData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("All");
  const [notice, setNotice] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [newStage, setNewStage] = useState<ApplicationStage>("Initial Review");
  const [stageNote, setStageNote] = useState("");

  // Document verification modal state
  const [verifyDocId, setVerifyDocId] = useState<string | null>(null);
  const [docFeedback, setDocFeedback] = useState("");

  // New task modal state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionAppId, setDecisionAppId] = useState("");
  const [decisionType, setDecisionType] = useState<"Conditional Offer" | "Unconditional Offer" | "Rejection">("Conditional Offer");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [depositAmount, setDepositAmount] = useState<number>(1000);

  const filteredApps = admissions.applications.filter((app) => {
    const matchesSearch =
      `${app.applicationNumber} ${app.studentName} ${app.universityName} ${app.programmeName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStage = selectedStageFilter === "All" || app.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const filteredDocs = admissions.documents.filter((doc) =>
    `${doc.fileName} ${doc.studentName} ${doc.docType}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleStageChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    const targetApp = admissions.applications.find((a) => a.id === selectedAppId);
    if (!targetApp) return;

    try {
      await admissions.updateStage(targetApp, newStage, stageNote);
      setNotice(`Updated ${targetApp.applicationNumber} to ${newStage}`);
      setSelectedAppId(null);
      setStageNote("");
    } catch (err: any) {
      setNotice(`Failed to update stage: ${err.message}`);
    }
  };

  const handleVerifyDocSubmit = async (status: "Verified" | "Rejected") => {
    if (!verifyDocId) return;
    try {
      await admissions.verifyDocument(verifyDocId, status, docFeedback);
      setNotice(`Document marked as ${status}`);
      setVerifyDocId(null);
      setDocFeedback("");
    } catch (err: any) {
      setNotice(`Document update failed: ${err.message}`);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      await admissions.createAdmissionTask({
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate,
      });
      setNotice(`Admission task recorded successfully.`);
      setShowTaskForm(false);
      setTaskTitle("");
      setTaskDesc("");
    } catch (err: any) {
      setNotice(`Failed to create task: ${err.message}`);
    }
  };

  const handleRecordDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const app = admissions.applications.find((a) => a.id === decisionAppId);
    if (!app) return;

    try {
      await admissions.recordDecision({
        applicationId: app.id,
        studentName: app.studentName,
        universityName: app.universityName,
        programmeName: app.programmeName,
        decisionType,
        depositAmountRequired: depositAmount,
        notes: decisionNotes,
      });

      // Update stage accordingly
      await admissions.updateStage(app, decisionType as ApplicationStage, `Decision recorded: ${decisionType}`);
      setNotice(`Decision ${decisionType} recorded for ${app.applicationNumber}`);
      setShowDecisionModal(false);
    } catch (err: any) {
      setNotice(`Failed to record decision: ${err.message}`);
    }
  };

  if (admissions.loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Admissions {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Application processing, academic eligibility verification, conditional offers, and CAS compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {page === "offers" && (
            <button
              onClick={() => setShowDecisionModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              Issue Offer / Decision
            </button>
          )}
          {page === "tasks" && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Admission Task
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {admissions.metrics.totalPendingReview}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Doc Verification</span>
                <FolderOpen className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {admissions.metrics.documentsPendingVerification}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Offers Issued</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {admissions.metrics.offersIssued}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>CAS / COE Pending</span>
                <FileCheck2 className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {admissions.metrics.casPending}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Total Enrolled</span>
                <GraduationCap className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {admissions.metrics.enrolledTotal}
              </p>
            </div>
          </div>

          {/* Subscriptions & Recent Applications Table */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center justify-between">
                <span>Recent Applications Awaiting Review</span>
                <span className="text-xs text-emerald-400 font-medium">Live Feed</span>
              </h2>
              <div className="divide-y divide-[var(--border-default)]">
                {admissions.applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{app.studentName}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {app.applicationNumber} • {app.universityName} ({app.intake})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={app.stage} />
                      <button
                        onClick={() => {
                          setSelectedAppId(app.id);
                          setNewStage(app.stage);
                        }}
                        className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-xs rounded"
                      >
                        Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text-primary)]">
                Document Verification Queue
              </h2>
              <div className="divide-y divide-[var(--border-default)]">
                {admissions.documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{doc.fileName}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {doc.studentName} • {doc.docType}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={doc.status} />
                      <button
                        onClick={() => setVerifyDocId(doc.id)}
                        className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-xs rounded"
                      >
                        Audit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS QUEUE PAGE */}
      {page === "applications" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, app #, university..."
                className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              >
                <option value="All">All Stages</option>
                {ALL_STAGES.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">App #</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">University & Programme</th>
                  <th className="p-3">Intake</th>
                  <th className="p-3">Counsellor</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {app.applicationNumber}
                    </td>
                    <td className="p-3 font-bold text-[var(--text-primary)]">{app.studentName}</td>
                    <td className="p-3">
                      <div className="font-semibold">{app.universityName}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{app.programmeName}</div>
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">{app.intake}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{app.assignedCounsellor}</td>
                    <td className="p-3">
                      <StatusBadge value={app.stage} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedAppId(app.id);
                          setNewStage(app.stage);
                        }}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-md"
                      >
                        Update Stage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENT VERIFICATION PAGE */}
      {page === "verification" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter verification items by document or student..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-teal-400">
                      {doc.docType}
                    </span>
                    <StatusBadge value={doc.status} />
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {doc.fileName}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">Student: {doc.studentName}</p>
                </div>
                <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Uploaded by {doc.uploadedBy}
                  </span>
                  <button
                    onClick={() => setVerifyDocId(doc.id)}
                    className="px-3 py-1 bg-emerald-500 text-zinc-950 font-bold rounded hover:bg-emerald-400"
                  >
                    Verify / Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFFER & CAS TRACKING PAGE */}
      {page === "offers" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
              <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Offers Issued Log
              </h2>
              <div className="divide-y divide-[var(--border-default)]">
                {admissions.decisions.map((dec) => (
                  <div key={dec.id} className="py-2.5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[var(--text-primary)]">{dec.studentName}</span>
                      <StatusBadge value={dec.decisionType} />
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {dec.universityName} • {dec.programmeName}
                    </div>
                    {dec.notes && <div className="text-[10px] text-zinc-400 italic">{dec.notes}</div>}
                  </div>
                ))}
                {admissions.decisions.length === 0 && (
                  <div className="p-4 text-center text-[var(--text-muted)]">No decision letters issued yet.</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3">
              <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-teal-400" />
                CAS & Visa Milestone Tracker
              </h2>
              <div className="divide-y divide-[var(--border-default)]">
                {admissions.applications
                  .filter((a) => ["Deposit Paid", "CAS Issued", "Visa Approved"].includes(a.stage))
                  .map((app) => (
                    <div key={app.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{app.studentName}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {app.applicationNumber} • {app.universityName}
                        </div>
                      </div>
                      <StatusBadge value={app.stage} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TASKS PAGE */}
      {page === "tasks" && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="p-4 font-bold text-sm border-b border-[var(--border-default)]">
              Admission Tasks & Review Reminders
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {admissions.tasks.map((task) => (
                <div key={task.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">{task.description}</div>
                    )}
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">
                      Due: {task.dueDate} • Assigned to: {task.assignedTo}
                    </div>
                  </div>
                  <StatusBadge value={task.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORTS PAGE */}
      {page === "reports" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
            <BarChart3 className="w-8 h-8 text-emerald-400" />
            <h2 className="font-bold text-base text-[var(--text-primary)]">Admissions Funnel & Bottlenecks</h2>
            <p className="text-[var(--text-secondary)]">
              Turn-around time analysis, document rejection rates, and stage conversion performance.
            </p>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Admissions Report
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-sm text-[var(--text-primary)]">High-Priority Alerts</h2>
          <div className="space-y-2">
            {admissions.applications
              .filter((a) => a.stage === "Submitted" || a.stage === "Documents Pending")
              .map((app) => (
                <div key={app.id} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>
                      Application <strong>{app.applicationNumber}</strong> for {app.studentName} requires review.
                    </span>
                  </div>
                  <StatusBadge value={app.stage} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL: STAGE CHANGE */}
      {selectedAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleStageChangeSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4"
          >
            <h2 className="font-bold text-base">Update Application Stage</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Select Stage</label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as ApplicationStage)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              >
                {ALL_STAGES.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Internal Note / Decision Details</label>
              <textarea
                rows={3}
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                placeholder="e.g. verified transcripts, conditional offer issued."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAppId(null)}
                className="px-4 py-2 bg-[var(--bg-hover)] rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: VERIFY DOCUMENT */}
      {verifyDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <div className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
            <h2 className="font-bold text-base">Audit Document</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Verification Note / Reason for Rejection</label>
              <textarea
                rows={3}
                value={docFeedback}
                onChange={(e) => setDocFeedback(e.target.value)}
                placeholder="e.g. Document verified clear and authentic / Passport image blurred."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setVerifyDocId(null)}
                className="px-3 py-2 bg-[var(--bg-hover)] rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyDocSubmit("Rejected")}
                className="px-3 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-lg text-xs"
              >
                Reject Document
              </button>
              <button
                onClick={() => handleVerifyDocSubmit("Verified")}
                className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs"
              >
                Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ADMISSION TASK */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleCreateTaskSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4"
          >
            <h2 className="font-bold text-base">Create Admission Task</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Task Title</label>
              <input
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Request updated MOI from student"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Additional instructions..."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Due Date</label>
              <input
                type="date"
                required
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="px-4 py-2 bg-[var(--bg-hover)] rounded-lg text-xs"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs">
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DECISION & OFFER */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleRecordDecisionSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4"
          >
            <h2 className="font-bold text-base">Issue Offer / Admission Decision</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Target Application</label>
              <select
                required
                value={decisionAppId}
                onChange={(e) => setDecisionAppId(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              >
                <option value="">Select Application...</option>
                {admissions.applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.applicationNumber} - {app.studentName} ({app.universityName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Decision Type</label>
              <select
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value as any)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              >
                <option value="Conditional Offer">Conditional Offer</option>
                <option value="Unconditional Offer">Unconditional Offer</option>
                <option value="Rejection">Rejection</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Deposit Amount Required (USD)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Decision Conditions / Notes</label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="e.g. Offer subject to submitting final semester transcript and IELTS score."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 bg-[var(--bg-hover)] rounded-lg text-xs"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs">
                Issue Decision
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
