import React, { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { Application, ApplicationStage } from "../types/application";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { logAuditEvent } from "../utils/auditLogger";
import { cloneApplication, getRequiredDocumentsForCountry } from "../utils/applicationCloner";
import { isApplicationLocked, toggleApplicationLock, canUnlockApplication } from "../utils/applicationLock";
import { triggerApplicationCommission } from "../utils/commissionEngine";
import { executeWorkflowRules } from "../utils/workflowEngine";
import { Plus, Search, FileText, GraduationCap, AlertCircle, X, Copy, Lock, Unlock, CheckCircle2, ChevronDown, ChevronRight, FileCheck } from "lucide-react";

const STAGES: ApplicationStage[] = [
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
];

export const Applications: React.FC = () => {
  const { appUser } = useAuth();
  const { applications, students, addApplication, updateApplication, initialLoading: loading } = useGlobalData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedDocAppId, setExpandedDocAppId] = useState<string | null>(null);

  // Clone Modal State
  const [cloneModalApp, setCloneModalApp] = useState<Application | null>(null);
  const [cloneUniName, setCloneUniName] = useState("");
  const [cloneProgName, setCloneProgName] = useState("");
  const [cloneIntake, setCloneIntake] = useState("Fall 2026");
  const [cloning, setCloning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form
  const [studentId, setStudentId] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [intake, setIntake] = useState("Fall 2026");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !universityName || !programmeName) {
      setErrorMsg("Student, University, and Programme are required.");
      return;
    }

    const selectedStudent = students.find((s) => s.id === studentId);
    if (!selectedStudent) {
      setErrorMsg("Selected student not found.");
      return;
    }

    const appNumber = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetCountry = selectedStudent.preferredDestination || "United Kingdom";
    const newAppId = `app-${Date.now()}`;
    const newApp: Application = {
      id: newAppId,
      applicationNumber: appNumber,
      studentId,
      studentName: selectedStudent.fullName,
      universityId: "univ-custom",
      universityName,
      programmeId: "prog-custom",
      programmeName,
      intake,
      targetCountry,
      stage: "Draft",
      assignedCounsellor: appUser?.email || "Unassigned",
      requiredDocuments: getRequiredDocumentsForCountry(targetCountry),
      history: [
        {
          stage: "Draft",
          updatedBy: appUser?.email || "System",
          timestamp: Date.now(),
          note: "Application record created.",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic local add
    addApplication(newApp);

    try {
      const docRef = await addDoc(collection(db, "applications"), newApp);
      await logAuditEvent(
        "APPLICATION_CREATED",
        appUser?.email || "Unknown",
        "Application",
        `Created application ${appNumber} for ${selectedStudent.fullName} at ${universityName}`,
        docRef.id,
        appUser?.role
      );

      // Execute Workflow Automation Trigger
      executeWorkflowRules("application", "created", { ...newApp, id: docRef.id }).catch(console.warn);
    } catch (err: any) {
      console.warn("Application created locally:", err);
    } finally {
      // Reset
      setStudentId("");
      setUniversityName("");
      setProgrammeName("");
      setErrorMsg("");
      setIsAddModalOpen(false);
    }
  };

  const handleStageChange = async (app: Application, newStage: ApplicationStage) => {
    if (isApplicationLocked(app.lockedAt) && !canUnlockApplication(appUser)) {
      alert("This application is locked from editing. Contact an Administrator to modify it.");
      return;
    }

    const updatedHistory = [
      ...(app.history || []),
      {
        stage: newStage,
        updatedBy: appUser?.email || "System",
        timestamp: Date.now(),
        note: `Stage changed to ${newStage}`,
      },
    ];

    // Optimistic update
    updateApplication(app.id, {
      stage: newStage,
      history: updatedHistory,
      updatedAt: Date.now(),
    });

    try {
      const appRef = doc(db, "applications", app.id);
      await updateDoc(appRef, {
        stage: newStage,
        history: updatedHistory,
        updatedAt: Date.now(),
      });

      await logAuditEvent(
        "APPLICATION_STAGE_UPDATED",
        appUser?.email || "Unknown",
        "Application",
        `Updated ${app.applicationNumber} stage to ${newStage}`,
        app.id,
        appUser?.role
      );

      // Trigger Workflow Automation
      executeWorkflowRules("application", "stage_changed", { ...app, stage: newStage }, app).catch(console.warn);

      // Auto-trigger partner commission when enrolled
      if (newStage === "Enrolled" || newStage === "CAS Issued") {
        await triggerApplicationCommission(app, 24000, "Direct / Agency Partner", appUser?.email);
      }
    } catch (err) {
      console.warn("Firestore application update notice (persisted in local state):", err);
    }
  };

  const handleToggleLock = async (app: Application) => {
    try {
      const isLocked = await toggleApplicationLock(app.id, app.lockedAt, appUser);
      setNotice(`Application #${app.applicationNumber || app.id.slice(-6)} is now ${isLocked ? "Locked" : "Unlocked"}.`);
    } catch (err: any) {
      alert(err.message || "Lock operation failed.");
    }
  };

  const handleExecuteClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneModalApp || !cloneUniName || !cloneProgName) return;
    setCloning(true);
    try {
      const newAppId = await cloneApplication(
        cloneModalApp.id,
        cloneUniName,
        cloneProgName,
        cloneIntake,
        appUser?.email,
        appUser?.role
      );
      setNotice(`Application successfully cloned to ${cloneUniName}! (New Ref ID: #${newAppId.slice(-6)})`);
      setCloneModalApp(null);
      setCloneUniName("");
      setCloneProgName("");
    } catch (err: any) {
      alert("Cloning failed: " + err.message);
    } finally {
      setCloning(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.applicationNumber && app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = selectedStage === "All" || app.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
              <GraduationCap className="w-7 h-7 text-emerald-400" />
              <span>Multi-University Application Dossier & Tracker</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Track student submissions, clone dossiers to secondary institutions, and verify country compliance checklists.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="underline text-[10px]">Dismiss</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by student, university, APP-ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none"
          >
            <option value="All">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">App ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">University & Course</th>
                  <th className="px-4 py-3">Intake & Country</th>
                  <th className="px-4 py-3">Stage / Lock</th>
                  <th className="px-4 py-3 text-right">Actions & Stage</th>
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
                      No applications found. Click "New Application" to initiate one.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const isLocked = isApplicationLocked(app.lockedAt);
                    const isExpanded = expandedDocAppId === app.id;
                    const reqDocs = app.requiredDocuments || [];

                    return (
                      <React.Fragment key={app.id}>
                        <tr className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-xs text-emerald-400">
                            <div>
                              <span>{app.applicationNumber || `#${app.id.slice(-6)}`}</span>
                              {app.clonedFrom && (
                                <span className="block text-[9px] text-[var(--text-muted)] font-normal">
                                  Cloned from #{app.clonedFrom.slice(-6)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-teal-400" />
                              <span>{app.studentName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="font-bold text-[var(--text-primary)]">{app.universityName}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{app.programmeName}</div>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">
                            <span className="block">{app.intake}</span>
                            <span className="text-[10px] text-zinc-400">{app.targetCountry || "United Kingdom"}</span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] border ${
                                  app.stage === "Enrolled"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : app.stage === "Rejected"
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                    : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                                }`}
                              >
                                {app.stage}
                              </span>
                              {isLocked && (
                                <span className="p-1 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20" title="Locked from unauthorized edits">
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Document Checklist Expander */}
                              <button
                                onClick={() => setExpandedDocAppId(isExpanded ? null : app.id)}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center space-x-1 border border-[var(--border-default)] transition-colors"
                                title="View Compliance Checklist"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="hidden sm:inline text-[10px]">Docs</span>
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>

                              {/* Clone Application Button */}
                              <button
                                onClick={() => {
                                  setCloneModalApp(app);
                                  setCloneUniName("");
                                  setCloneProgName(app.programmeName);
                                }}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-emerald-500/20 transition-colors"
                                title="Clone to Another University"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[10px]">Clone</span>
                              </button>

                              {/* Lock / Unlock Button */}
                              <button
                                onClick={() => handleToggleLock(app)}
                                className={`p-1.5 rounded-lg text-xs border transition-colors ${
                                  isLocked
                                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-[var(--border-default)]"
                                }`}
                                title={isLocked ? "Unlock Application" : "Lock Application"}
                              >
                                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>

                              {/* Stage Selector */}
                              <select
                                value={app.stage}
                                disabled={isLocked && !canUnlockApplication(appUser)}
                                onChange={(e) => handleStageChange(app, e.target.value as ApplicationStage)}
                                className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[11px] text-[var(--text-primary)] disabled:opacity-50"
                              >
                                {STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Compliance Checklist Sub-Row */}
                        {isExpanded && (
                          <tr className="bg-[var(--bg-main)]/50">
                            <td colSpan={6} className="px-6 py-4 border-b border-[var(--border-default)]">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center space-x-1.5">
                                    <FileCheck className="w-4 h-4 text-emerald-400" />
                                    <span>Country Compliance Document Checklist ({app.targetCountry || "United Kingdom"})</span>
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    {reqDocs.filter((d) => d.uploaded).length} of {reqDocs.length} documents compiled
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                  {reqDocs.map((docItem, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-[var(--text-primary)] block text-[11px]">{docItem.docType}</span>
                                        <span className="text-[9px] text-[var(--text-muted)]">
                                          {docItem.required ? "Mandatory" : "Optional"}
                                        </span>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        docItem.uploaded
                                          ? "bg-emerald-500/20 text-emerald-400"
                                          : "bg-amber-500/20 text-amber-300"
                                      }`}>
                                        {docItem.uploaded ? "Attached ✓" : "Pending"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Clone Application */}
        {cloneModalApp && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
                  <Copy className="w-5 h-5 text-emerald-400" />
                  <span>Clone Application Dossier</span>
                </h3>
                <button onClick={() => setCloneModalApp(null)} className="text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Clone all documents, transcripts, and personal details for <strong>{cloneModalApp.studentName}</strong> into a new university application.
              </p>

              <form onSubmit={handleExecuteClone} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">New Target University *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. University of Leeds"
                    value={cloneUniName}
                    onChange={(e) => setCloneUniName(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">New Programme Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MSc Data Science"
                    value={cloneProgName}
                    onChange={(e) => setCloneProgName(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Intake</label>
                  <select
                    value={cloneIntake}
                    onChange={(e) => setCloneIntake(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Fall 2026">Fall 2026</option>
                    <option value="Spring 2027">Spring 2027</option>
                    <option value="Fall 2027">Fall 2027</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setCloneModalApp(null)}
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cloning}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {cloning ? "Cloning..." : "Clone Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Application */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Initiate New Application</span>
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 sq-badge text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateApplication} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Select Student *</label>
                  <select
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="">-- Choose a student profile --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Target University Name *</label>
                  <input
                    type="text"
                    required
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    placeholder="e.g. University of Toronto"
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Target Programme Title *</label>
                  <input
                    type="text"
                    required
                    value={programmeName}
                    onChange={(e) => setProgrammeName(e.target.value)}
                    placeholder="e.g. MSc Data Science"
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Target Intake</label>
                  <select
                    value={intake}
                    onChange={(e) => setIntake(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="Fall 2026">Fall 2026</option>
                    <option value="Spring 2026">Spring 2026</option>
                    <option value="Fall 2027">Fall 2027</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium sq-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                  >
                    Create Application Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
