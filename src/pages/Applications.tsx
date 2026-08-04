import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { Application, ApplicationStage } from "../types/application";
import { Student } from "../types/student";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";
import { Plus, Search, FileText, GraduationCap, AlertCircle, X } from "lucide-react";

const STAGES: ApplicationStage[] = [
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

export const Applications: React.FC = () => {
  const { appUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [studentId, setStudentId] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [intake, setIntake] = useState("Fall 2026");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Applications snapshot
    const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
    const unsubscribeApps = onSnapshot(q, (snapshot) => {
      const docs: Application[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Application);
      });
      setApplications(docs);
      setLoading(false);
    });

    // Students snapshot for dropdown
    const unsubscribeStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const docs: Student[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(docs);
    });

    return () => {
      unsubscribeApps();
      unsubscribeStudents();
    };
  }, []);

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

    try {
      const appNumber = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newApp: Omit<Application, "id"> = {
        applicationNumber: appNumber,
        studentId,
        studentName: selectedStudent.fullName,
        universityId: "univ-custom",
        universityName,
        programmeId: "prog-custom",
        programmeName,
        intake,
        stage: "Draft",
        assignedCounsellor: appUser?.email || "Unassigned",
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

      const docRef = await addDoc(collection(db, "applications"), newApp);
      await logAuditEvent(
        "APPLICATION_CREATED",
        appUser?.email || "Unknown",
        "Application",
        `Created application ${appNumber} for ${selectedStudent.fullName} at ${universityName}`,
        docRef.id,
        appUser?.role
      );

      // Reset
      setStudentId("");
      setUniversityName("");
      setProgrammeName("");
      setErrorMsg("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create application.");
    }
  };

  const handleStageChange = async (app: Application, newStage: ApplicationStage) => {
    try {
      const appRef = doc(db, "applications", app.id);
      const updatedHistory = [
        ...(app.history || []),
        {
          stage: newStage,
          updatedBy: appUser?.email || "System",
          timestamp: Date.now(),
          note: `Stage changed to ${newStage}`,
        },
      ];

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
    } catch (err) {
      console.error("Failed to update application stage:", err);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === "All" || app.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Application Tracker</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Track multi-university student applications across all stages.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by student, university, APP-ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
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
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">App ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">University & Course</th>
                  <th className="px-4 py-3">Intake</th>
                  <th className="px-4 py-3">Current Stage</th>
                  <th className="px-4 py-3 text-right">Quick Stage Update</th>
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
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-emerald-400">
                        {app.applicationNumber}
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
                      <td className="px-4 py-3 text-xs font-medium">{app.intake}</td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`px-2.5 py-1 sq-badge font-semibold text-[10px] border ${
                            app.stage === "Enrolled"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : app.stage === "Rejected"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                          }`}
                        >
                          {app.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={app.stage}
                          onChange={(e) => handleStageChange(app, e.target.value as ApplicationStage)}
                          className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-input text-[11px] text-[var(--text-primary)]"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
