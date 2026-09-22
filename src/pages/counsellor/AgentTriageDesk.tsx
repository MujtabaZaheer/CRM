import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { canAccessAgentTriage, submitStudentToAdmissions } from "../../utils/agentTriage";
import { Student } from "../../types/student";
import {
  ShieldCheck,
  FileCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
  FileText,
  User,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface ComplianceState {
  transcripts: boolean;
  passport: boolean;
  englishProof: boolean;
  sop: boolean;
}

export const AgentTriageDesk: React.FC = () => {
  const { appUser } = useAuth();
  const { students, applications, updateStudent, updateApplication } = useGlobalData();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "vetted">("pending");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Per-student interactive checklist state
  const [checklistMap, setChecklistMap] = useState<Record<string, ComplianceState>>({
    stu_agent_1: { transcripts: true, passport: true, englishProof: true, sop: true },
    stu_agent_2: { transcripts: true, passport: true, englishProof: true, sop: false },
  });

  const isAuthorized = useMemo(() => {
    return canAccessAgentTriage(appUser);
  }, [appUser]);

  // Filter agent referred students
  const agentStudents = useMemo(() => {
    return students.filter((s) => s.agentReferred === true);
  }, [students]);

  const pendingStudents = useMemo(() => {
    return agentStudents.filter((s) => s.admissionsVisibility !== true);
  }, [agentStudents]);

  const vettedStudents = useMemo(() => {
    return agentStudents.filter((s) => s.admissionsVisibility === true);
  }, [agentStudents]);

  const displayList = useMemo(() => {
    const list = activeTab === "pending" ? pendingStudents : vettedStudents;
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.fullName.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        (s.agentName && s.agentName.toLowerCase().includes(query)) ||
        (s.nationality && s.nationality.toLowerCase().includes(query))
    );
  }, [activeTab, pendingStudents, vettedStudents, searchQuery]);

  // Find linked application for a student
  const getLinkedApplication = (studentId: string) => {
    return applications.find((a) => a.studentId === studentId);
  };

  const getChecklist = (studentId: string): ComplianceState => {
    return (
      checklistMap[studentId] || {
        transcripts: true,
        passport: true,
        englishProof: false,
        sop: false,
      }
    );
  };

  const toggleChecklistItem = (studentId: string, item: keyof ComplianceState) => {
    setChecklistMap((prev) => {
      const current = getChecklist(studentId);
      return {
        ...prev,
        [studentId]: {
          ...current,
          [item]: !current[item],
        },
      };
    });
  };

  const isChecklistComplete = (studentId: string) => {
    const check = getChecklist(studentId);
    return check.transcripts && check.passport && check.englishProof && check.sop;
  };

  const handleOpenVerification = (student: Student) => {
    setSelectedStudent(student);
    setVerificationNotes(
      `Verified by ${appUser?.displayName || appUser?.email}. Academic marksheets and identity documentation confirmed.`
    );
  };

  const handleConfirmSubmission = async () => {
    if (!selectedStudent || !appUser) return;
    setIsSubmitting(true);

    const linkedApp = getLinkedApplication(selectedStudent.id);

    try {
      const result = await submitStudentToAdmissions(
        selectedStudent.id,
        linkedApp?.id,
        verificationNotes,
        appUser,
        selectedStudent.fullName
      );

      if (result.success) {
        // Optimistic UI update in global data
        updateStudent(selectedStudent.id, {
          admissionsVisibility: true,
          vettingStatus: "submitted_to_admissions",
          vettedBy: appUser.displayName || appUser.email,
          vettedAt: Date.now(),
          vettingNotes: verificationNotes,
        });

        if (linkedApp) {
          updateApplication(linkedApp.id, {
            admissionsVisibility: true,
            vettingStatus: "submitted_to_admissions",
            vettedBy: appUser.displayName || appUser.email,
            vettedAt: Date.now(),
          });
        }

        setSuccessToast(
          `Successfully vetted ${selectedStudent.fullName}! Dossier unlocked and forwarded to Admissions Desk.`
        );
        setSelectedStudent(null);
      } else {
        alert(`Failed to submit: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--surface-card)] border border-rose-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Access Restricted</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
            The <strong>Agent Referral Triage Gate</strong> is strictly isolated to prevent unvetted candidate data from leaking into unauthorized assessment streams.
          </p>
          <div className="mt-4 p-3 rounded-lg bg-rose-500/5 text-xs text-rose-300 font-mono">
            Required Roles: Counsellor, Team Leader, Office Manager, or Administrator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-emerald-950/30 border border-indigo-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Compliance & Data Isolation Gate
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-heading">
              Agent Referral Triage Desk
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Verify compliance checklists and authenticate original candidate credentials before releasing agent-referred students into the official Admissions Office assessment queue.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block font-medium">Pending Triage</span>
              <span className="text-2xl font-bold text-amber-400 font-mono">{pendingStudents.length}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block font-medium">Ready to Submit</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {pendingStudents.filter((s) => isChecklistComplete(s.id)).length}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-700/50 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block font-medium">Vetted & Released</span>
              <span className="text-2xl font-bold text-indigo-400 font-mono">{vettedStudents.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 shadow-xl backdrop-blur-md animate-slide-up">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Control Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex bg-[var(--surface-card)] p-1 rounded-xl border border-[var(--border-subtle)] w-fit">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Triage ({pendingStudents.length})
          </button>
          <button
            onClick={() => setActiveTab("vetted")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "vetted"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vetted & Released ({vettedStudents.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search candidate, agent agency, or nationality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Referral Cards / Table */}
      {displayList.length === 0 ? (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
          <FileCheck className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">No dossiers found</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {activeTab === "pending"
              ? "All agent referrals have undergone document triage or no new referrals are awaiting verification."
              : "No dossiers have been submitted to Admissions through the triage desk yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayList.map((student) => {
            const check = getChecklist(student.id);
            const complete = isChecklistComplete(student.id);
            const linkedApp = getLinkedApplication(student.id);

            return (
              <div
                key={student.id}
                className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-6 transition-all hover:border-indigo-500/40 hover:shadow-xl flex flex-col justify-between space-y-6"
              >
                {/* Header Info */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] font-heading">
                          {student.fullName}
                        </h3>
                        {student.admissionsVisibility === true ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Admissions Visible
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Admissions Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {student.email} • {student.phone || "No phone"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg inline-block">
                        Agent: {student.agentName || "External Agent"}
                      </span>
                    </div>
                  </div>

                  {/* Program & Target Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--surface-elevated)] p-3 rounded-xl border border-[var(--border-subtle)] mb-4">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Nationality / Country</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {student.nationality || student.countryOfResidence || "International"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Target Destination</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {student.preferredDestination || "United Kingdom"}
                      </span>
                    </div>
                    {student.preferredProgram && (
                      <div className="col-span-2 mt-1">
                        <span className="text-[var(--text-muted)] block text-[10px]">Desired Program</span>
                        <span className="font-semibold text-indigo-300">
                          {student.preferredProgram}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Document Compliance Checklist */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">
                        Document Compliance Checklist
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          complete
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {complete ? "Ready for Admissions" : "Verification Incomplete"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          check.transcripts
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                            : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={student.admissionsVisibility === true}
                          checked={check.transcripts}
                          onChange={() => toggleChecklistItem(student.id, "transcripts")}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span className="font-medium">Academic Transcripts</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          check.passport
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                            : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={student.admissionsVisibility === true}
                          checked={check.passport}
                          onChange={() => toggleChecklistItem(student.id, "passport")}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span className="font-medium">Passport / Photo ID</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          check.englishProof
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                            : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={student.admissionsVisibility === true}
                          checked={check.englishProof}
                          onChange={() => toggleChecklistItem(student.id, "englishProof")}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span className="font-medium">English Language Test</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          check.sop
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                            : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={student.admissionsVisibility === true}
                          checked={check.sop}
                          onChange={() => toggleChecklistItem(student.id, "sop")}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span className="font-medium">Statement of Purpose</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
                  {student.admissionsVisibility === true ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Vetted by <strong>{student.vettedBy || "Triage Officer"}</strong> on{" "}
                        {student.vettedAt ? new Date(student.vettedAt).toLocaleDateString() : "Record"}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenVerification(student)}
                      disabled={!complete}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        complete
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-lg shadow-emerald-950/40 cursor-pointer"
                          : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Verify & Submit to Admissions
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Authorize Admissions Release
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Sign off on compliance checks and elevate dossier visibility
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Candidate:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{selectedStudent.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Referring Agent:</span>
                  <span className="font-semibold text-indigo-300">{selectedStudent.agentName || "Agent"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Target Program:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedStudent.preferredProgram || "Higher Education"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-2">
                  Reviewer Vetting Notes & Audit Remarks
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Record verification notes, academic equivalence checks, or special considerations..."
                  className="w-full p-3 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Confirming this action will flip <code>admissionsVisibility: true</code> in Firestore, log an immutable audit event, and notify the Admissions Desk.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Forward Dossier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
