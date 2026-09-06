import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import {
  Sparkles,
  Building2,
  Globe,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  FileText,
  ClipboardList,
  Rocket,
  Calendar,
  Copy,
  Trash2,
  ExternalLink,
  PlusCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";
import { Programme, University } from "../../../types/university";
import type { Application } from "../../../types/application";
import { assessEligibility } from "../../../utils/eligibility";
import { getDocumentChecklist } from "../../../utils/immigrationData";
import { DEMO_UNIVERSITIES } from "../../../data/demoData";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ShortlistedMatch {
  university: University;
  programme: Programme;
  eligibility: ReturnType<typeof assessEligibility>;
  matchScore: number;
}

/* ------------------------------------------------------------------ */
/*  Status Badge Config                                                */
/* ------------------------------------------------------------------ */
const DOC_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  received: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Received",
  },
  missing: {
    bg: "bg-elevated",
    text: "text-muted",
    border: "border-subtle",
    icon: <Circle className="w-3.5 h-3.5" />,
    label: "Missing",
  },
  verification_pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Verification Pending",
  },
  action_required: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: "Action Required",
  },
};

const STAGE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Draft: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  Submitted: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "Initial Review": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "Conditional Offer": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  "Unconditional Offer": { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40" },
};

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export const StudentOnboardingMatchSelection: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [shortlistedMatches, setShortlistedMatches] = useState<ShortlistedMatch[]>([]);
  const [expandedChecklistAppId, setExpandedChecklistAppId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  /* ---- Load All Applications & Shortlists ---- */
  const loadData = async () => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid) return;

    try {
      // 1. Fetch Student doc
      const studentSnap = await getDoc(doc(db, "students", uid));
      let studentData: Student | null = null;
      let shortlistedKeys: string[] = [];

      if (studentSnap.exists()) {
        studentData = studentSnap.data() as Student;
        setStudent(studentData);
        shortlistedKeys = studentData.shortlistedPrograms || [];
      }

      // 2. Fetch all Applications created for this student
      const appQuery = query(collection(db, "applications"), where("studentId", "==", uid));
      const appSnap = await getDocs(appQuery);
      const appList: Application[] = [];
      appSnap.docs.forEach((d) => {
        appList.push({ id: d.id, ...d.data() } as Application);
      });
      // Sort newest first
      appList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setApplications(appList);

      // 3. Load shortlisted matches from universities to allow 1-click apply for unapplied shortlists
      const univSnap = await getDocs(collection(db, "universities"));
      let univs = univSnap.docs.map((d) => ({ id: d.id, ...d.data() } as University));
      if (univs.length === 0) {
        univs = DEMO_UNIVERSITIES;
      }

      const matches: ShortlistedMatch[] = [];
      univs.forEach((univ) => {
        (univ.programmes || []).forEach((prog) => {
          const key = `${univ.id}-${prog.id}`;
          if (shortlistedKeys.includes(key)) {
            // Check if application already exists for this program
            const alreadyApplied = appList.some(
              (a) => a.universityId === univ.id && a.programmeId === prog.id
            );
            if (!alreadyApplied) {
              matches.push({
                university: univ,
                programme: prog,
                eligibility: assessEligibility(studentData || undefined, prog),
                matchScore: Math.min(98, 85 + Math.floor(Math.random() * 12)),
              });
            }
          }
        });
      });
      setShortlistedMatches(matches);

      // Auto-expand checklist for first application if exists
      if (appList.length > 0 && !expandedChecklistAppId) {
        setExpandedChecklistAppId(appList[0].id);
      }
    } catch (err) {
      console.warn("Failed to load applications & matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appUser, firebaseUser]);

  /* ---- Generate Application ID ---- */
  const generateAppNumber = (): string => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `APP-${year}-${rand}`;
  };

  /* ---- Create Application for a Shortlisted Program ---- */
  const handleCreateApplication = async (match: ShortlistedMatch) => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid) return;

    const actionId = `${match.university.id}-${match.programme.id}`;
    setActionLoading(actionId);

    try {
      const appNumber = generateAppNumber();
      const checklist = getDocumentChecklist(match.university.country, match.programme.level);
      const elig = match.eligibility;

      const appDoc: Omit<Application, "id"> = {
        applicationNumber: appNumber,
        studentId: uid,
        studentName: student?.fullName || appUser?.displayName || "Student",
        studentEmail: student?.email || appUser?.email || "",
        universityId: match.university.id,
        universityName: match.university.name,
        programmeId: match.programme.id,
        programmeName: match.programme.title,
        intake: match.programme.intakes?.[0] || "September",
        targetCountry: match.university.country,
        eligibilityStatus: elig.status,
        eligibilityScore: elig.score,
        stage: "Draft",
        documentChecklist: checklist,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: [
          {
            stage: "Draft",
            updatedBy: student?.fullName || "Student",
            timestamp: Date.now(),
            note: `Application draft initiated for ${match.university.name}.`,
          },
        ],
      };

      const docRef = await addDoc(collection(db, "applications"), appDoc);
      const newApp: Application = { id: docRef.id, ...appDoc };

      setApplications((prev) => [newApp, ...prev]);
      setShortlistedMatches((prev) =>
        prev.filter((m) => m.programme.id !== match.programme.id)
      );
      setExpandedChecklistAppId(docRef.id);
    } catch (err) {
      console.error("Failed to create application draft:", err);
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Delete Draft Application ---- */
  const handleDeleteDraft = async (appId: string) => {
    if (!confirm("Are you sure you want to remove this application draft?")) return;
    setActionLoading(appId);
    try {
      await deleteDoc(doc(db, "applications", appId));
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      console.error("Failed to delete draft:", err);
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Copy App ID ---- */
  const copyAppId = (appNumber: string) => {
    navigator.clipboard.writeText(appNumber).catch(() => {});
    setCopiedId(appNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ---- Finish Onboarding & Go to Student Portal ---- */
  const handleFinishOnboarding = async () => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid) return;

    setCompletingOnboarding(true);
    try {
      await setDoc(
        doc(db, "students", uid),
        {
          onboardingCompleted: true,
          onboardingStep: 4,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      navigate("/");
    } catch (err) {
      console.error("Failed to finish onboarding:", err);
    } finally {
      setCompletingOnboarding(false);
    }
  };

  /* ---- Loading Screen ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main text-primary font-sans pb-20">
      {/* ---- Sticky Header ---- */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 4 of 4 • Multi-Tier Admission & Application Engine
            </span>
            <h1 className="text-xl font-bold font-heading text-primary">
              All Applied Applications & Readiness
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student/onboarding/program-matcher")}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Matcher
            </button>

            <button
              onClick={() => navigate("/student/onboarding/program-matcher")}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-primary rounded-lg border border-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Apply to More Universities</span>
            </button>

            <button
              onClick={handleFinishOnboarding}
              disabled={completingOnboarding}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {completingOnboarding ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Finalizing...</>
              ) : (
                <><span>Go to Portal Dashboard</span><ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-surface to-surface border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary font-heading">
                Multi-University Application Central
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Track your applications, upload documents according to university requirements, and monitor admission milestones.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-surface px-4 py-2 rounded-xl border border-subtle text-center">
              <span className="text-[10px] uppercase font-bold text-muted block">Applications</span>
              <span className="text-lg font-bold text-emerald-400">{applications.length}</span>
            </div>
            <div className="bg-surface px-4 py-2 rounded-xl border border-subtle text-center">
              <span className="text-[10px] uppercase font-bold text-muted block">Shortlisted</span>
              <span className="text-lg font-bold text-primary">{shortlistedMatches.length}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Active Applications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary font-heading flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" /> Active Application Drafts ({applications.length})
            </h2>
            <Link
              to="/student/documents"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> Upload Center →
            </Link>
          </div>

          {applications.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-default space-y-4 sq-card">
              <Building2 className="w-12 h-12 text-muted mx-auto opacity-40" />
              <div>
                <h3 className="text-base font-bold text-primary">No application drafts created yet</h3>
                <p className="text-xs text-secondary mt-1 max-w-md mx-auto">
                  Explore universities in Step 3 and click &quot;Apply Now&quot; to initiate tracked application drafts.
                </p>
              </div>
              <button
                onClick={() => navigate("/student/onboarding/program-matcher")}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Explore Universities & Programs
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {applications.map((app) => {
              const stageStyle = STAGE_CONFIG[app.stage] || STAGE_CONFIG.Draft;
              const isExpanded = expandedChecklistAppId === app.id;
              const checklist = app.documentChecklist || [];
              const totalRequired = checklist.filter((d) => d.required).length;
              const totalReceived = checklist.filter((d) => d.status === "received").length;

              return (
                <div
                  key={app.id}
                  className="bg-surface border border-subtle rounded-2xl p-6 sq-card shadow-sm space-y-5 transition-all hover:border-default"
                >
                  {/* Top Bar: App ID + Stage + Delete */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-subtle">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyAppId(app.applicationNumber)}
                        className="px-3 py-1.5 rounded-xl bg-elevated border border-subtle hover:border-default transition-all flex items-center gap-2 cursor-pointer group"
                      >
                        <span className="text-[10px] text-muted uppercase font-bold tracking-wider">ID</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">{app.applicationNumber}</span>
                        {copiedId === app.applicationNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
                        )}
                      </button>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}>
                        {app.stage}
                      </span>

                      {app.targetCountry && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-elevated border border-subtle text-secondary">
                          {app.targetCountry}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/student/applications/${app.id}`}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Continue Application</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {app.stage === "Draft" && (
                        <button
                          onClick={() => handleDeleteDraft(app.id)}
                          disabled={actionLoading === app.id}
                          className="p-2 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Draft"
                        >
                          {actionLoading === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* University & Program Info */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-elevated border border-subtle flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-primary font-heading">{app.programmeName}</h3>
                        <p className="text-sm text-secondary font-medium mt-0.5">{app.universityName}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {app.intake}</span>
                          {app.eligibilityScore && (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <Sparkles className="w-3.5 h-3.5" /> {app.eligibilityScore}% Admission Readiness
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Readiness Bar */}
                    <div className="bg-main p-3 rounded-xl border border-subtle text-right shrink-0 min-w-[200px]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted">Document Readiness</span>
                        <span className="font-bold text-emerald-400">{totalReceived} / {totalRequired}</span>
                      </div>
                      <div className="w-full bg-elevated h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${totalRequired > 0 ? (totalReceived / totalRequired) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Readiness Checklist Toggle & Accordion */}
                  <div className="pt-2 border-t border-subtle/50">
                    <button
                      onClick={() => setExpandedChecklistAppId(isExpanded ? null : app.id)}
                      className="w-full flex items-center justify-between py-2 text-xs font-bold text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-400" />
                        Specific University & Country Requirements Checklist ({checklist.length} Documents)
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 divide-y divide-subtle bg-main rounded-xl border border-subtle overflow-hidden animate-fade-in">
                        {checklist.map((item, idx) => {
                          const config = DOC_STATUS_CONFIG[item.status] || DOC_STATUS_CONFIG.missing;
                          return (
                            <div
                              key={idx}
                              className="px-4 py-3 flex items-center gap-3 hover:bg-elevated/40 transition-colors text-xs"
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                                {config.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-primary">{item.label}</p>
                                {item.notes && <p className="text-[10px] text-muted mt-0.5">{item.notes}</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {!item.required && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-elevated text-muted border border-subtle">
                                    Optional
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${config.bg} ${config.text} ${config.border}`}>
                                  {config.icon}
                                  {config.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Shortlisted Programs Waiting to be Applied */}
        {shortlistedMatches.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-subtle">
            <h2 className="text-base font-bold text-primary font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Shortlisted Programs Ready for Application ({shortlistedMatches.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shortlistedMatches.map((match) => {
                const actionId = `${match.university.id}-${match.programme.id}`;
                const isCreating = actionLoading === actionId;

                return (
                  <div
                    key={actionId}
                    className="p-5 rounded-2xl bg-surface border border-subtle flex flex-col justify-between space-y-4 sq-card hover-lift"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[10px] uppercase font-bold text-muted">{match.programme.level}</span>
                        <span className="text-emerald-400 font-bold">{match.matchScore}% Match</span>
                      </div>
                      <h3 className="text-sm font-bold text-primary leading-snug">{match.programme.title}</h3>
                      <p className="text-xs text-muted mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{match.university.name}</span>
                      </p>
                      <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3" />
                        <span>{match.university.city}, {match.university.country}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-subtle text-xs space-y-1 text-muted">
                      <div className="flex justify-between">
                        <span>Tuition:</span>
                        <span className="font-semibold text-secondary">
                          {match.programme.currency} {match.programme.tuitionFeeAnnual?.toLocaleString()}/yr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Intake:</span>
                        <span className="font-semibold text-secondary">{match.programme.intakes?.[0] || "September"}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isCreating}
                      onClick={() => handleCreateApplication(match)}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCreating ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Draft...</>
                      ) : (
                        <><Rocket className="w-3.5 h-3.5" /> Initiate Application Draft</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regulatory Disclaimer */}
        <div className="p-5 rounded-2xl bg-surface border border-subtle text-xs text-muted space-y-2 sq-card">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Important Admissions & Immigration Notice</span>
          </div>
          <p className="leading-relaxed">
            All submitted applications are processed under official partner institutional agreements and national immigration compliance protocols. Document requirements must be verified before final university submission.
          </p>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingMatchSelection;
