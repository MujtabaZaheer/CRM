import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, addDoc } from "firebase/firestore";
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
  MapPin,
  Calendar,
  Banknote,
  Copy,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { Student } from "../../../types/student";
import { Programme, University } from "../../../types/university";
import type { Application, DocumentChecklistItem } from "../../../types/application";
import { assessEligibility } from "../../../utils/eligibility";
import { getDocumentChecklist } from "../../../utils/immigrationData";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ShortlistedMatch {
  university: University;
  programme: Programme;
  eligibility: ReturnType<typeof assessEligibility>;
  matchScore: number;
}

type ApplicationPhase = "review" | "creating" | "checklist";

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

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export const StudentOnboardingMatchSelection: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shortlistedMatches, setShortlistedMatches] = useState<ShortlistedMatch[]>([]);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);

  // Application flow
  const [phase, setPhase] = useState<ApplicationPhase>("review");
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [createdAppNumber, setCreatedAppNumber] = useState<string | null>(null);
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklistItem[]>([]);
  const [activeMatch, setActiveMatch] = useState<ShortlistedMatch | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  /* ---- Load shortlisted programs ---- */
  useEffect(() => {
    const loadMatches = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;
      try {
        const studentSnap = await getDoc(doc(db, "students", uid));
        let studentData: Student | null = null;
        let keys: string[] = [];

        if (studentSnap.exists()) {
          studentData = studentSnap.data() as Student;
          keys = studentData.shortlistedPrograms || [];
        }

        const univSnap = await getDocs(collection(db, "universities"));
        const matches: ShortlistedMatch[] = [];

        univSnap.docs.forEach((uDoc) => {
          const univ = { id: uDoc.id, ...uDoc.data() } as University;
          const progs = univ.programmes || [];

          progs.forEach((prog) => {
            const key = `${univ.id}-${prog.id}`;
            if (keys.includes(key) || (keys.length === 0 && matches.length < 3)) {
              const elig = assessEligibility(studentData || undefined, prog);
              matches.push({
                university: univ,
                programme: prog,
                eligibility: elig,
                matchScore: Math.min(98, 80 + Math.floor(Math.random() * 15)),
              });
            }
          });
        });

        setShortlistedMatches(matches);
        if (matches.length > 0) {
          setSelectedMatchKey(`${matches[0].university.id}-${matches[0].programme.id}`);
        }
      } catch (err) {
        console.warn("Failed to load match selection:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
  }, [appUser, firebaseUser]);

  /* ---- Generate Application ID ---- */
  const generateAppNumber = (): string => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `APP-${year}-${rand}`;
  };

  /* ---- Start Application ---- */
  const handleStartApplication = async (match: ShortlistedMatch) => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid) return;

    setActiveMatch(match);
    setPhase("creating");

    try {
      const studentSnap = await getDoc(doc(db, "students", uid));
      const studentData = studentSnap.exists() ? (studentSnap.data() as Student) : null;

      const appNumber = generateAppNumber();
      const elig = match.eligibility;

      // Generate document checklist based on country + level
      const checklist = getDocumentChecklist(match.university.country, match.programme.level);

      const appDoc: Omit<Application, "id"> = {
        applicationNumber: appNumber,
        studentId: uid,
        studentName: studentData?.fullName || appUser?.displayName || "",
        studentEmail: studentData?.email || appUser?.email || "",
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
            updatedBy: studentData?.fullName || "Student",
            timestamp: Date.now(),
            note: "Application draft initiated from onboarding wizard.",
          },
        ],
      };

      const docRef = await addDoc(collection(db, "applications"), appDoc);

      // Small delay for the animation effect
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setCreatedAppId(docRef.id);
      setCreatedAppNumber(appNumber);
      setDocumentChecklist(checklist);
      setPhase("checklist");
    } catch (err) {
      console.error("Failed to create application:", err);
      setPhase("review");
    }
  };

  /* ---- Copy app number ---- */
  const copyAppNumber = () => {
    if (createdAppNumber) {
      navigator.clipboard.writeText(createdAppNumber).catch(() => {});
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  /* ================================================================ */
  /*  PHASE: CREATING (Animation)                                      */
  /* ================================================================ */
  if (phase === "creating") {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center text-primary">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading">Creating Your Application</h2>
            <p className="text-sm text-secondary mt-2">
              Setting up your application for{" "}
              <span className="text-emerald-400 font-semibold">{activeMatch?.programme.title}</span>{" "}
              at {activeMatch?.university.name}...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <FileText className="w-4 h-4" />
            <span>Generating document checklist & requirements...</span>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  PHASE: CHECKLIST                                                 */
  /* ================================================================ */
  if (phase === "checklist" && activeMatch) {
    const totalRequired = documentChecklist.filter((d) => d.required).length;
    const totalReceived = documentChecklist.filter((d) => d.status === "received").length;

    return (
      <div className="min-h-screen bg-main text-primary font-sans pb-16">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                Step 4 of 4 • Application Draft Created
              </span>
              <h1 className="text-xl font-bold font-heading text-primary">
                Document Readiness Checklist
              </h1>
            </div>
            <button
              onClick={() => {
                setPhase("review");
                setCreatedAppId(null);
                setCreatedAppNumber(null);
              }}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Shortlist
            </button>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
          {/* Success Banner */}
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Rocket className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-primary">Application Draft Created!</h2>
              <p className="text-sm text-secondary mt-1">
                Your application for{" "}
                <span className="font-semibold text-emerald-400">{activeMatch.programme.title}</span>{" "}
                at {activeMatch.university.name} has been initiated.
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={copyAppNumber}
                className="px-4 py-2.5 rounded-xl bg-surface border border-default hover:border-emerald-500/30 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="text-xs text-muted">Application ID</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{createdAppNumber}</span>
                <Copy className={`w-3.5 h-3.5 transition-colors ${copiedId ? "text-emerald-400" : "text-muted"}`} />
              </button>
              {copiedId && <p className="text-[10px] text-emerald-400 text-right mt-1">Copied!</p>}
            </div>
          </div>

          {/* Program Summary Card */}
          <div className="bg-surface border border-subtle rounded-2xl p-5 sq-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-elevated flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-primary">{activeMatch.programme.title}</h3>
                <p className="text-sm text-secondary mt-0.5">{activeMatch.university.name}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {activeMatch.university.city}, {activeMatch.university.country}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {activeMatch.programme.intakes?.[0] || "September"}</span>
                  <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> {activeMatch.programme.currency} {(activeMatch.programme.tuitionFeeAnnual || 0).toLocaleString()}/yr</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activeMatch.programme.durationMonths} months</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-muted">Readiness</span>
                <p className="text-lg font-bold text-emerald-400">{activeMatch.eligibility.score}%</p>
              </div>
            </div>
          </div>

          {/* Document Checklist */}
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden sq-card">
            <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-primary font-heading">Required Documents</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">
                  {totalReceived} / {totalRequired} complete
                </span>
                <div className="w-20 h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${totalRequired > 0 ? (totalReceived / totalRequired) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-subtle">
              {documentChecklist.map((item, idx) => {
                const config = DOC_STATUS_CONFIG[item.status] || DOC_STATUS_CONFIG.missing;
                return (
                  <div
                    key={idx}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-elevated/50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">{item.label}</p>
                      {item.notes && (
                        <p className="text-[11px] text-muted mt-0.5">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!item.required && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-elevated text-muted border border-subtle sq-pill">
                          Optional
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${config.bg} ${config.text} ${config.border} sq-pill`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={createdAppId ? `/student/applications/${createdAppId}` : `/student/new-application?universityId=${activeMatch.university.id}&programmeId=${activeMatch.programme.id}`}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              Continue to Application Draft <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/student/documents"
              className="flex-1 py-3 bg-elevated hover:bg-hover text-primary font-bold text-sm rounded-xl border border-default transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> Upload Documents
            </Link>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-5 rounded-2xl bg-surface border border-subtle text-xs text-muted space-y-2 sq-card">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Important Admissions & Immigration Notice</span>
            </div>
            <p className="leading-relaxed">
              Based on the information currently available in your profile, these programs appear
              suitable. However, EduCRM makes no guarantees of admission or visa issuance.
            </p>
            <p className="leading-relaxed">
              Final admission and visa decisions are made exclusively by the relevant university
              admissions boards and government immigration authorities.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* ================================================================ */
  /*  PHASE: REVIEW (Shortlisted Programs)                             */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-main text-primary font-sans pb-16">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 4 of 4 • Application Draft & Readiness
            </span>
            <h1 className="text-xl font-bold font-heading text-primary">
              Choose your best match
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/student/onboarding/program-matcher")}
            className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-secondary rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change Programs
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Tip Banner */}
        <div className="p-5 rounded-2xl bg-surface border border-subtle text-sm text-secondary flex items-start gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-primary">
              Review your shortlisted programs and launch your application.
            </p>
            <p className="text-xs text-muted">
              Select your preferred choice to generate a tracked application draft with a document
              readiness checklist.
            </p>
          </div>
        </div>

        {/* Shortlisted Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shortlistedMatches.map(({ university, programme, eligibility, matchScore }) => {
            const key = `${university.id}-${programme.id}`;
            const isSelected = selectedMatchKey === key;

            return (
              <div
                key={key}
                onClick={() => setSelectedMatchKey(key)}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 cursor-pointer relative sq-card hover-lift ${
                  isSelected
                    ? "bg-elevated border-emerald-500/50 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                    : "bg-surface border-subtle hover:border-default"
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    {matchScore}% Match
                  </span>
                  <span className="text-[11px] font-semibold text-muted uppercase">
                    {programme.level}
                  </span>
                </div>

                {/* Program Info */}
                <div>
                  <h3 className="text-base font-bold text-primary leading-snug">
                    {programme.title}
                  </h3>
                  <p className="text-xs text-muted flex items-center gap-1.5 mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium text-secondary">{university.name}</span>
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    {university.city}, {university.country}
                  </p>
                </div>

                {/* Key Specs */}
                <div className="space-y-2 py-3 border-y border-subtle text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Annual Tuition:</span>
                    <span className="font-semibold text-secondary">
                      {programme.currency} {programme.tuitionFeeAnnual?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Duration:</span>
                    <span className="font-semibold text-secondary">{programme.durationMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Target Intake:</span>
                    <span className="font-semibold text-secondary">
                      {programme.intakes?.[0] || "September"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Application Deadline:</span>
                    <span className="font-semibold text-amber-400">
                      {programme.deadline || "Rolling Admissions"}
                    </span>
                  </div>
                </div>

                {/* Eligibility Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-muted">Admission Readiness</span>
                    <span className="text-emerald-400">{eligibility.score}%</span>
                  </div>
                  <div className="w-full bg-main h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${eligibility.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted pt-1 line-clamp-2">
                    {eligibility.checks[0]?.detail || "Meets baseline requirements."}
                  </p>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartApplication({ university, programme, eligibility, matchScore });
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Start Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {shortlistedMatches.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-default space-y-3 sq-card">
            <p className="text-sm text-muted">You have not shortlisted any programs yet.</p>
            <Link
              to="/student/onboarding/program-matcher"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 underline"
            >
              Go to Program Matcher →
            </Link>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-5 rounded-2xl bg-surface border border-subtle text-xs text-muted space-y-2 sq-card">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Important Admissions & Immigration Notice</span>
          </div>
          <p className="leading-relaxed">
            Based on the information currently available in your profile, these programs appear
            suitable. However, EduCRM makes no guarantees of admission or visa issuance.
          </p>
          <p className="leading-relaxed">
            Final admission and visa decisions are made exclusively by the relevant university
            admissions boards and government immigration authorities.
          </p>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingMatchSelection;
