import React, { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { RoleGate } from "../layout/RoleGate";
import { Application } from "../../types/application";
import { Task } from "../../types/task";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Building2,
  GraduationCap,
  FileText,
  AlertCircle,
  Eye,
  Check,
  Users,
  MapPin,
} from "lucide-react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { logAuditEvent } from "../../utils/auditLogger";
import {
  assignReferralToCounsellor,
  detectStudentLocation,
  rankCounsellorsByProximity,
} from "../../services/assignmentService";
import { ApplicationDossierModal } from "../counsellor/ApplicationDossierModal";

// Triage Desk: Team Leaders, Office Managers, Admins only.
// Counsellors are NOT permitted to triage/accept/reject agent referrals.
const ALLOWED_TRIAGE_ROLES = [
  "platform_super_admin",
  "org_admin",
  "office_manager",
  "team_leader",
] as const;

// Only these roles can perform assign / accept / reject triage actions
const TRIAGE_ACTION_ROLES = [
  "platform_super_admin",
  "org_admin",
  "office_manager",
  "team_leader",
];

export const AgentReferralTriageDesk: React.FC = () => {
  const { appUser } = useAuth();
  const {
    applications,
    students,
    leads,
    users,
    updateApplication,
    updateStudent,
    addStudent,
    updateLead,
    addLead,
    addTask,
  } = useGlobalData();

  const canPerformTriageActions = TRIAGE_ACTION_ROLES.includes(appUser?.role || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("All");

  // Rejection modal state
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
  const [rejectionReasonCode, setRejectionReasonCode] = useState("duplicate_lead");
  const [rejectionComment, setRejectionComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Application Dossier Inspection Modal state
  const [inspectingApp, setInspectingApp] = useState<Application | null>(null);

  // Quick detail preview (legacy fallback)
  const [previewApp, setPreviewApp] = useState<Application | null>(null);

  // Inline assignment state tracking per application
  const [assignedCounsellorState, setAssignedCounsellorState] = useState<Record<string, string>>({});

  // Active Counsellors list
  const activeCounsellors = useMemo(() => {
    return users.filter((u) => u.role === "counsellor");
  }, [users]);

  // Query: Applications referred by external agents
  const agentReferredApplications = useMemo(() => {
    return applications.filter((app) => {
      const isAgentReferred =
        Boolean(app.agentUid) ||
        Boolean(app.agentId) ||
        Boolean(app.agentEmail) ||
        Boolean(app.agentName) ||
        app.agentReferred === true;
      return isAgentReferred;
    });
  }, [applications]);

  // Helper: determine if an application has been formally accepted by triage
  const isAcceptedByTriage = (app: Application): boolean => {
    return (
      app.admissionsVisibility === true ||
      app.vettingStatus === "documents_verified" ||
      app.vettingStatus === "submitted_to_admissions" ||
      Boolean(app.assignedCounsellorId) ||
      Boolean(app.assignedCounsellor)
    );
  };

  // Unique agents for filtering
  const uniqueAgents = useMemo(() => {
    const names = new Set<string>();
    agentReferredApplications.forEach((app) => {
      const name = app.agentName || app.sourceAgentName || app.agentEmail;
      if (name) names.add(name);
    });
    return Array.from(names);
  }, [agentReferredApplications]);

  // Split into categories — strict mutex: once accepted, never shows in pending
  const pendingApps = useMemo(() => {
    return agentReferredApplications.filter((app) => {
      if (app.stage === "Rejected" || app.vettingStatus === "rejected") return false;
      // Exclude any app that has been formally accepted/assigned by triage
      if (isAcceptedByTriage(app)) return false;
      // Pending = waiting for triage assignment
      return (
        app.vettingStatus === "pending_triage" ||
        app.stage === "Draft" ||
        (!app.admissionsVisibility && !app.assignedCounsellorId)
      );
    });
  }, [agentReferredApplications]);

  const acceptedApps = useMemo(() => {
    return agentReferredApplications.filter(
      (app) =>
        isAcceptedByTriage(app) &&
        app.stage !== "Rejected" &&
        app.vettingStatus !== "rejected"
    );
  }, [agentReferredApplications]);

  const rejectedApps = useMemo(() => {
    return agentReferredApplications.filter(
      (app) => app.stage === "Rejected" || app.vettingStatus === "rejected"
    );
  }, [agentReferredApplications]);

  // Filtered list based on tab, search, agent
  const displayApplications = useMemo(() => {
    let list: Application[] = [];
    if (activeTab === "pending") list = pendingApps;
    else if (activeTab === "accepted") list = acceptedApps;
    else if (activeTab === "rejected") list = rejectedApps;
    else list = agentReferredApplications;

    if (selectedAgentFilter !== "All") {
      list = list.filter(
        (a) => (a.agentName || a.sourceAgentName || a.agentEmail) === selectedAgentFilter
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.studentName?.toLowerCase().includes(q) ||
          a.applicationNumber?.toLowerCase().includes(q) ||
          a.universityName?.toLowerCase().includes(q) ||
          a.programmeName?.toLowerCase().includes(q) ||
          a.agentName?.toLowerCase().includes(q) ||
          a.agentEmail?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    activeTab,
    pendingApps,
    acceptedApps,
    rejectedApps,
    agentReferredApplications,
    selectedAgentFilter,
    searchQuery,
  ]);

  // Canonical flag for accepted state (used per row)
  const getIsAccepted = (app: Application) => isAcceptedByTriage(app);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCounsellorSelect = (appId: string, counsellorEmail: string) => {
    setAssignedCounsellorState((prev) => ({
      ...prev,
      [appId]: counsellorEmail,
    }));
  };

  // Action: Accept Referral
  const handleAcceptReferral = async (app: Application) => {
    const student = students.find(
      (s) =>
        s.id === app.studentId ||
        (s.email && app.studentEmail && s.email.toLowerCase().trim() === app.studentEmail.toLowerCase().trim())
    );
    const rankedCounsellors = rankCounsellorsByProximity(activeCounsellors, student, app);
    const defaultCounsellor = rankedCounsellors[0] || activeCounsellors[0];

    const chosenCounsellorEmail =
      assignedCounsellorState[app.id] ||
      app.assignedCounsellor ||
      (defaultCounsellor ? defaultCounsellor.email : "counsellor@educrm.demo");

    const counsellorUser =
      activeCounsellors.find((c) => c.email === chosenCounsellorEmail) ||
      defaultCounsellor;

    const counsellorName =
      counsellorUser?.displayName ||
      counsellorUser?.email ||
      chosenCounsellorEmail;

    const counsellorOffice = counsellorUser?.office || counsellorUser?.campusCity || "Main Branch";
    const counsellorTenant = counsellorUser?.tenantId || "tenant-london";

    setIsProcessing(true);
    const actorName = appUser?.displayName || appUser?.email || "Internal Staff";

    try {
      // Execute atomic batch assignment across Application, Student, Notification, Task, and Audit Trail
      const result = await assignReferralToCounsellor({
        applicationId: app.id,
        studentId: app.studentId || student?.id || "",
        counsellorId: counsellorUser?.uid || `usr_couns_${Date.now()}`,
        counsellorName,
        counsellorEmail: chosenCounsellorEmail,
        assignedByUserId: appUser?.uid || "internal_staff",
        assignedByName: actorName,
        assignedByRole: appUser?.role || "team_leader",
        officeId: counsellorOffice,
        tenantId: counsellorTenant,
        studentName: app.studentName,
        applicationNumber: app.applicationNumber,
      });

      // Update local React global context state immediately
      updateApplication(app.id, result.applicationUpdate);
      const effectiveStudentId = app.studentId || student?.id || `stu_${app.id}`;
      if (student?.id || app.studentId) {
        updateStudent(effectiveStudentId, result.studentUpdate);
      } else {
        addStudent({
          id: effectiveStudentId,
          fullName: app.studentName,
          email: app.studentEmail || "",
          countryOfResidence: app.targetCountry || "International",
          nationality: "International",
          preferredDestination: app.targetCountry,
          profileCompleteness: 85,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...result.studentUpdate,
        } as any);
      }

      // Sync with Leads roster so Counsellor sees referral under 'My Assigned Leads'
      const existingLead = leads.find(
        (l) =>
          l.id === app.studentId ||
          (l.email && app.studentEmail && l.email.toLowerCase().trim() === app.studentEmail.toLowerCase().trim()) ||
          (l.fullName && l.fullName.toLowerCase().trim() === app.studentName.toLowerCase().trim())
      );
      if (existingLead) {
        updateLead(existingLead.id, result.leadUpdate);
      } else {
        addLead({
          id: `lead_${app.id}`,
          fullName: app.studentName,
          email: app.studentEmail || "",
          phone: (app as any).studentPhone || "",
          destinationCountry: app.targetCountry || "United Kingdom",
          programInterest: app.programmeName || "Degree Programme",
          stage: "Counselling",
          source: "Agent Referral",
          assignedTo: chosenCounsellorEmail,
          assignedCounsellorId: counsellorUser?.uid,
          tenantId: counsellorTenant,
          office: counsellorOffice,
          agentUid: app.agentUid,
          agentName: app.agentName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...result.leadUpdate,
        } as any);
      }

      // Add task to local global context for Counsellor Task Center
      const alertTask: Task = {
        id: `tsk_ref_${Date.now()}`,
        title: `📥 New Agent Referral Assigned: ${app.studentName}`,
        description: `Agent ${app.agentName || "Partner"} referred ${app.studentName} for ${app.programmeName} at ${app.universityName}. Triaged and assigned by ${actorName}.`,
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
        priority: "High",
        status: "Open",
        assignedTo: chosenCounsellorEmail,
        createdBy: actorName,
        linkedEntityType: "application",
        linkedEntityId: app.id,
        linkedEntityName: `${app.studentName} (${app.applicationNumber})`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addTask(alertTask);

      showToast(`Referral accepted! ${app.studentName} assigned to ${counsellorName} (${counsellorOffice}).`);
    } catch (err) {
      console.error("Error accepting referral:", err);
      alert("Failed to accept referral. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Reject Referral with Reason Code
  const handleRejectReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApp) return;

    setIsProcessing(true);
    const now = Date.now();
    const actorName = appUser?.displayName || appUser?.email || "Internal Staff";

    const reasonLabelMap: Record<string, string> = {
      duplicate_lead: "Duplicate Lead / Record Already Exists",
      out_of_jurisdiction: "Out of Operating Jurisdiction / Unsupported Territory",
      incomplete_docs: "Incomplete / Fraudulent Application Documents",
      academic_mismatch: "Candidate Does Not Meet Academic Entry Requirements",
      unresponsive: "Student / Agency Unresponsive",
      other: "Other Operational Reason",
    };

    const formattedReason = `${reasonLabelMap[rejectionReasonCode] || rejectionReasonCode}: ${rejectionComment.trim() || "No extra comment provided."}`;

    try {
      const updatedFields: Partial<Application> = {
        stage: "Rejected",
        vettingStatus: "rejected",
        admissionsVisibility: false,
        vettedBy: actorName,
        vettedAt: now,
        vettingNotes: formattedReason,
        decisionNotes: formattedReason,
        updatedAt: now,
      };

      updateApplication(rejectingApp.id, updatedFields);
      try {
        await updateDoc(doc(db, "applications", rejectingApp.id), updatedFields);
      } catch (err) {
        console.warn("Firestore rejection update notice:", err);
      }

      if (rejectingApp.studentId) {
        updateStudent(rejectingApp.studentId, {
          vettingStatus: "rejected",
          admissionsVisibility: false,
          vettedBy: actorName,
          vettedAt: now,
          updatedAt: now,
        });
        try {
          await updateDoc(doc(db, "students", rejectingApp.studentId), {
            vettingStatus: "rejected",
            admissionsVisibility: false,
            vettedBy: actorName,
            vettedAt: now,
            updatedAt: now,
          });
        } catch (err) {
          console.warn("Firestore student rejection notice:", err);
        }
      }

      await logAuditEvent(
        "AGENT_REFERRAL_REJECTED",
        appUser?.email || "Internal Staff",
        "Application",
        `Rejected agent referral ${rejectingApp.applicationNumber} (${rejectingApp.studentName}). Reason: ${formattedReason}`,
        rejectingApp.id,
        appUser?.role
      );

      showToast(`Referral ${rejectingApp.applicationNumber} rejected.`);
      setRejectingApp(null);
      setRejectionComment("");
      setRejectionReasonCode("duplicate_lead");
    } catch (err) {
      console.error("Error rejecting referral:", err);
      alert("Failed to reject referral. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <RoleGate allowedRoles={ALLOWED_TRIAGE_ROLES as any}>
      <div className="space-y-6">
        {/* Toast Alert */}
        {successToast && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 sq-card text-emerald-400 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-400/80 hover:text-emerald-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Internal Management & Admissions Triage Hub</span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              Agent Referral Triage Desk
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
              Inspect incoming agent-referred student applications, verify entry qualifications, assign active counsellors, and triage priority before routing to university lodgment queues.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] px-3 py-1.5 sq-card text-xs">
              <span className="text-[var(--text-muted)]">Pending Triage:</span>
              <span className="font-mono font-bold text-amber-400">{pendingApps.length}</span>
            </div>
            <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] px-3 py-1.5 sq-card text-xs">
              <span className="text-[var(--text-muted)]">Active Counsellors:</span>
              <span className="font-mono font-bold text-sky-400">{activeCounsellors.length}</span>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              {pendingApps.length}
            </div>
            <p className="text-[11px] text-amber-400/90 font-medium">Awaiting counsellor assignment</p>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Accepted & Assigned</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              {acceptedApps.length}
            </div>
            <p className="text-[11px] text-emerald-400/90 font-medium">In active counselling/admissions</p>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Rejected / Disqualified</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              {rejectedApps.length}
            </div>
            <p className="text-[11px] text-rose-400/90 font-medium">With reason codes recorded</p>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Partner Agencies</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              {uniqueAgents.length}
            </div>
            <p className="text-[11px] text-sky-400/90 font-medium">Referring active candidates</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {(["pending", "accepted", "rejected", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 sq-badge text-xs capitalize font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {tab === "pending" && `Pending (${pendingApps.length})`}
                {tab === "accepted" && `Accepted (${acceptedApps.length})`}
                {tab === "rejected" && `Rejected (${rejectedApps.length})`}
                {tab === "all" && `All Referrals (${agentReferredApplications.length})`}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Agency Filter */}
            <div className="relative w-full sm:w-48">
              <select
                aria-label="Filter by Partner Agency"
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="All">All Agencies</option>
                {uniqueAgents.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search candidate, agency, app #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Triage Queue Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Reference & Date</th>
                  <th className="px-4 py-3">Candidate Profile</th>
                  <th className="px-4 py-3">Partner Agency</th>
                  <th className="px-4 py-3">Target University & Course</th>
                  <th className="px-4 py-3">Stage / Compliance</th>
                  {canPerformTriageActions && <th className="px-4 py-3">Assign Counsellor</th>}
                  {canPerformTriageActions && <th className="px-4 py-3 text-right">Triage Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {displayApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[var(--text-muted)]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShieldCheck className="w-8 h-8 text-[var(--text-muted)] opacity-40" />
                        <span>No agent referrals found matching the selected criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayApplications.map((app) => {
                    const student = students.find(
                      (s) =>
                        s.id === app.studentId ||
                        (s.email && app.studentEmail && s.email.toLowerCase().trim() === app.studentEmail.toLowerCase().trim())
                    );
                    const studentLoc = detectStudentLocation(student, app);
                    const rankedCounsellors = rankCounsellorsByProximity(activeCounsellors, student, app);
                    const defaultCounsellor = rankedCounsellors[0] || activeCounsellors[0];

                    const currentAssigned =
                      assignedCounsellorState[app.id] ||
                      app.assignedCounsellor ||
                      (defaultCounsellor ? defaultCounsellor.email : "");
                    const isAccepted = getIsAccepted(app);
                    const isRejected = app.stage === "Rejected" || app.vettingStatus === "rejected";

                    return (
                      <tr
                        key={app.id}
                        onClick={() => setInspectingApp(app)}
                        className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                      >
                        {/* Reference & Date */}
                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-emerald-400 group-hover:underline">
                            {app.applicationNumber || app.id}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Recent"}
                          </div>
                        </td>

                        {/* Candidate Profile */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--text-primary)] flex items-center space-x-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:text-sky-400 transition-colors">{app.studentName}</span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[180px]">
                            {app.studentEmail || "No email"}
                          </div>
                          {studentLoc.displayLocation && (
                            <div className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                              <span className="truncate max-w-[170px]" title={`Student Location: ${studentLoc.displayLocation}`}>
                                {studentLoc.displayLocation}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Partner Agency */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {app.agentName || app.sourceAgentName || "External Referral"}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {app.agentEmail || "agent@referral.com"}
                          </div>
                        </td>

                        {/* Target Course & Uni */}
                        <td className="px-4 py-3 space-y-0.5">
                          <div className="font-semibold text-[var(--text-primary)] flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-sky-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{app.universityName}</span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[180px]">
                            {app.programmeName}
                          </div>
                        </td>

                        {/* Stage & Compliance */}
                        <td className="px-4 py-3 space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 sq-badge text-[10px] font-semibold ${
                              isRejected
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : isAccepted
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {app.stage}
                          </span>
                          {app.vettingNotes && (
                            <div className="text-[10px] text-[var(--text-muted)] italic truncate max-w-[160px]" title={app.vettingNotes}>
                              {app.vettingNotes}
                            </div>
                          )}
                        </td>

                        {/* Counsellor Dropdown — Team Leader / Admin only */}
                        {canPerformTriageActions && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            {isRejected ? (
                              <span className="text-[11px] text-[var(--text-muted)] italic">N/A (Disqualified)</span>
                            ) : isAccepted ? (
                              <div className="space-y-1">
                                <div className="text-[11px] text-emerald-400 font-semibold">
                                  {app.assignedCounsellorName || app.assignedCounsellor || "Assigned"}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] italic">Accepted — locked</div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <select
                                  aria-label={`Assign Counsellor for ${app.studentName}`}
                                  value={currentAssigned}
                                  disabled={isProcessing}
                                  onChange={(e) => handleCounsellorSelect(app.id, e.target.value)}
                                  className="px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50 w-52"
                                >
                                  {rankedCounsellors.map((c) => (
                                    <option key={c.uid} value={c.email}>
                                      {c.displayName || c.email} ({c.badgeLabel})
                                    </option>
                                  ))}
                                </select>
                                {rankedCounsellors[0] && (
                                  <div className="flex items-center space-x-1 text-[10px] text-sky-400 font-mono">
                                    <MapPin className="w-2.5 h-2.5 text-sky-400 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]" title={rankedCounsellors[0].matchReason}>
                                      Rec: {rankedCounsellors[0].displayName || rankedCounsellors[0].email} ({rankedCounsellors[0].office || rankedCounsellors[0].campusCity || "Local Branch"})
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        )}

                        {/* Triage Actions — Team Leader / Admin only */}
                        {canPerformTriageActions && (
                          <td
                            className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Inspect Full Dossier */}
                            <button
                              onClick={() => setInspectingApp(app)}
                              title="Inspect Full Application Dossier"
                              className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-sky-500/10 hover:border-sky-500/30 text-sky-400 border border-[var(--border-default)] sq-btn text-xs inline-flex items-center space-x-1 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>

                            {/* Accept action — only on pending (not yet accepted) */}
                            {!isRejected && !isAccepted && (
                              <>
                                <button
                                  onClick={() => handleAcceptReferral(app)}
                                  disabled={isProcessing}
                                  className="px-2.5 py-1 sq-btn text-xs font-bold inline-flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm shadow-emerald-500/20"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Accept Referral</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectingApp(app);
                                    setRejectionComment("");
                                    setRejectionReasonCode("duplicate_lead");
                                  }}
                                  disabled={isProcessing}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 sq-btn text-xs font-semibold inline-flex items-center space-x-1"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* Accepted state: show locked badge — counsellor reassignment from All Referrals tab only */}
                            {!isRejected && isAccepted && (
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 sq-badge text-[10px] font-semibold inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Accepted</span>
                              </span>
                            )}

                            {isRejected && (
                              <button
                                onClick={() => handleAcceptReferral(app)}
                                disabled={isProcessing}
                                className="px-2 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-[11px]"
                              >
                                Restore / Accept
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Reject Referral with Reason Code */}
        {rejectingApp && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center space-x-2 text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                    Disqualify / Reject Referral
                  </h3>
                </div>
                <button
                  onClick={() => setRejectingApp(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1 text-xs">
                <div className="text-[var(--text-muted)]">Candidate:</div>
                <div className="font-bold text-[var(--text-primary)]">{rejectingApp.studentName}</div>
                <div className="text-[11px] text-sky-400">{rejectingApp.applicationNumber} • {rejectingApp.programmeName}</div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Agency: {rejectingApp.agentName || "Partner Agency"}
                </div>
              </div>

              <form onSubmit={handleRejectReferralSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                    Select Rejection Reason Code *
                  </label>
                  <select
                    value={rejectionReasonCode}
                    onChange={(e) => setRejectionReasonCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="duplicate_lead">Duplicate Lead / Record Already Exists</option>
                    <option value="out_of_jurisdiction">Out of Operating Jurisdiction / Unsupported Territory</option>
                    <option value="incomplete_docs">Incomplete / Fraudulent Application Documents</option>
                    <option value="academic_mismatch">Candidate Does Not Meet Academic Entry Requirements</option>
                    <option value="unresponsive">Student / Agency Unresponsive</option>
                    <option value="other">Other Operational Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">
                    Triage Feedback & Specific Notes *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide specific justification for rejection to maintain audit trail..."
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500/50 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setRejectingApp(null)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold sq-btn text-xs shadow-md shadow-rose-500/20"
                  >
                    {isProcessing ? "Processing..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Quick Dossier Preview */}
        {previewApp && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                    Referral Dossier: {previewApp.studentName}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewApp(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Reference</div>
                  <div className="font-mono font-bold text-emerald-400">{previewApp.applicationNumber}</div>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Referring Agent</div>
                  <div className="font-semibold text-[var(--text-primary)]">{previewApp.agentName || "Partner"}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">{previewApp.agentEmail || "N/A"}</div>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Target Programme</div>
                  <div className="font-semibold text-[var(--text-primary)]">{previewApp.programmeName}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{previewApp.universityName} • {previewApp.intake}</div>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Current Lifecycle Stage</div>
                  <div className="font-semibold text-sky-400">{previewApp.stage}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Vetting: {previewApp.vettingStatus || "pending"}</div>
                </div>
              </div>

              {previewApp.academicHistory && previewApp.academicHistory.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[var(--text-primary)]">Academic Background</div>
                  <div className="divide-y divide-[var(--border-default)] bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card p-2 text-xs">
                    {previewApp.academicHistory.map((acad, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <div>
                          <span className="font-semibold text-[var(--text-primary)]">{acad.degreeTitle || acad.qualification}</span>
                          <span className="text-[var(--text-muted)]"> — {acad.institution}</span>
                        </div>
                        <div className="font-mono text-emerald-400 font-bold">{acad.gradeGpa || acad.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewApp.englishProficiency && (
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">English Proficiency Test:</span>
                  <span className="font-mono font-bold text-teal-400">
                    {previewApp.englishProficiency.testType} — {previewApp.englishProficiency.overallScore || "Submitted"}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  onClick={() => setPreviewApp(null)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] sq-btn text-xs"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    const toAccept = previewApp;
                    setPreviewApp(null);
                    handleAcceptReferral(toAccept);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold sq-btn text-xs"
                >
                  Accept & Assign Now
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Full Application Dossier Inspection */}
        {inspectingApp && (
          <ApplicationDossierModal
            application={inspectingApp}
            onClose={() => setInspectingApp(null)}
          />
        )}
      </div>
    </RoleGate>
  );
};

export default AgentReferralTriageDesk;
