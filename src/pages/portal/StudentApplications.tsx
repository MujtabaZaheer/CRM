import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { usePortalData } from "../../hooks/usePortalData";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Building2,
  GraduationCap,
  Sparkles,
  Award,
  AlertCircle,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Trash2,
  Search,
  CreditCard,
  Upload,
  Receipt,
  X,
  Plane,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { getUniversityCampusImage, getUniversityLandmark } from "../../utils/universityImages";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Invoice } from "../../types/finance";
import { generateInvoiceHtml, printDocumentHtml } from "../../utils/invoiceGenerator";

export const getStageGuidance = (stage: string): string => {
  switch (stage) {
    case "Visa Preparation":
      return "Visa preparation active: compile your financial proof (28-day funds rule), schedule medical/TB test, and review your visa dossier.";
    case "Visa Submitted":
      return "Visa application submitted to embassy/consulate. Biometrics completed and awaiting visa decision.";
    case "Visa Approved":
      return "🎉 Visa Approved! Entry clearance granted. Prepare arrival logistics, travel itinerary, and university enrollment.";
    case "Enrolled":
      return "🎉 Fully Enrolled! All admissions, visa compliance, and university registration milestones completed.";
    case "CAS Issued":
      return "CAS / COE released by university registry! Review your official document and start your visa application filing.";
    case "CAS / COE Pending":
      return "Deposit verified. University registry is compiling and generating your official CAS / COE statement.";
    case "Deposit Paid":
      return "Tuition deposit confirmed by finance. Awaiting university registry to open CAS / COE processing.";
    case "Deposit Pending":
      return "Official offer accepted! Pay tuition deposit challan to unlock your university CAS statement.";
    case "Conditional Offer":
      return "Conditional Offer received! Review and upload remaining academic or language conditions.";
    case "Unconditional Offer":
      return "Unconditional Offer issued! Accept your offer and proceed to the deposit stage.";
    case "University Reviewing":
      return "Application lodged with institution. Registry admissions committee is evaluating your academic dossier.";
    case "Documents Pending":
      return "Required documents missing. Check your document vault and upload pending certificates.";
    case "Draft":
      return "Draft in progress — click below to continue or delete if no longer needed.";
    default:
      return "Your application is undergoing active processing by the admissions and visa department.";
  }
};

const STAGE_PROGRESS: Record<string, number> = {
  Draft: 15,
  "Initial Review": 35,
  "Documents Pending": 45,
  "Ready for Submission": 55,
  Submitted: 65,
  "University Reviewing": 75,
  "Additional Info Requested": 70,
  "Conditional Offer": 85,
  "Unconditional Offer": 95,
  Approved: 95,
  "Deposit Pending": 90,
  "Deposit Paid": 92,
  "CAS / COE Pending": 96,
  "CAS Issued": 98,
  "Visa Preparation": 97,
  "Visa Submitted": 98,
  "Visa Approved": 99,
  Enrolled: 100,
  Deferred: 50,
  Withdrawn: 0,
  Rejected: 100,
};

const getStageBadgeStyle = (stage: string) => {
  if (stage === "Unconditional Offer" || stage === "Approved" || stage === "Enrolled" || stage === "CAS Issued" || stage === "Visa Approved") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  }
  if (stage === "Conditional Offer") {
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
  }
  if (stage === "Rejected" || stage === "Withdrawn") {
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  }
  if (stage.includes("Pending") || stage.includes("Review") || stage === "Submitted") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }
  return "bg-sky-500/10 text-sky-400 border-sky-500/30";
};

export const StudentApplications: React.FC = () => {
  const { ownApplications, deleteDraftApplication } = usePortalData();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteDraft = async (appId: string, universityName: string) => {
    if (!window.confirm(`Are you sure you want to delete your draft application for ${universityName}? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(appId);
    try {
      await deleteDraftApplication(appId);
    } catch (err: any) {
      alert(err.message || "Failed to delete draft application.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredApplications = ownApplications.filter((app) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (app.universityName || "").toLowerCase().includes(q) ||
      (app.programmeName || "").toLowerCase().includes(q) ||
      (app.applicationNumber || "").toLowerCase().includes(q) ||
      (app.stage || "").toLowerCase().includes(q) ||
      (app.intake || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 font-sans animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
            STUDENT ADMISSIONS TRACKER
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text-primary)] mt-1">
            My Applications
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Monitor real-time university admissions stages, offer releases, and CAS compliance.
          </p>
        </div>

        <Link
          to="/student/new-application"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Application</span>
        </Link>
      </header>

      {/* Search Bar */}
      {ownApplications.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applications by university, program, stage, or ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Applications Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {filteredApplications.map((app) => {
          const isDraft = app.stage === "Draft" || app.applicationStatus === "Draft";
          const isApproved =
            app.stage === "Unconditional Offer" ||
            app.stage === "CAS Issued" ||
            app.stage === "Enrolled";

          const pct = STAGE_PROGRESS[app.stage] || 25;

          return (
            <article
              key={app.id}
              className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
                      {app.applicationNumber || "APP-2026"}
                    </span>
                    <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2 mt-0.5">
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {app.universityName}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {app.programmeName} · {app.intake}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold border ${getStageBadgeStyle(
                        app.stage
                      )}`}
                    >
                      {app.stage}
                    </span>

                    {/* Delete Draft Button */}
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(app.id, app.universityName)}
                        disabled={deletingId === app.id}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                        title="Delete draft application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isApproved && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                    <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Status Confirmed:</strong> An official offer has been released for this application.
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
                    <span>Admissions Progress</span>
                    <span className="text-emerald-400 font-bold">{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {app.nextAction || getStageGuidance(app.stage)}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Last updated:{" "}
                  {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : "Recently"}
                </span>

                <div className="flex items-center gap-3">
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(app.id, app.universityName)}
                      disabled={deletingId === app.id}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Delete Draft
                    </button>
                  )}

                  <Link
                    to={`/student/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {isDraft ? "Continue Draft →" : "View Details & Timeline →"}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {ownApplications.length > 0 && filteredApplications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-10 text-center text-[var(--text-muted)] space-y-3">
          <Search className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            No applications match "{searchQuery}"
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Try searching by university name, intake, program, or application reference.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-emerald-400 font-semibold hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {!ownApplications.length && (
        <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-12 text-center text-[var(--text-muted)] space-y-4">
          <GraduationCap className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              You have not started an application yet.
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Explore partnered global universities and submit your direct admissions application.
            </p>
          </div>
          <Link
            to="/student/universities"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Explore Universities & Programs
          </Link>
        </div>
      )}
    </div>
  );
};

export const StudentApplicationDetail: React.FC = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { ownApplications, ownDocuments, ownInvoices, submitPaymentProof, deleteDraftApplication } = usePortalData();
  const { universities } = useGlobalData();
  const [challan, setChallan] = useState<Invoice | null>(null);

  // Payment Proof Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofRef, setProofRef] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofNotice, setProofNotice] = useState<string | null>(null);

  // Visa Tracking Modal State & Handlers
  const [showVisaSubmitModal, setShowVisaSubmitModal] = useState(false);
  const [visaRef, setVisaRef] = useState("");
  const [visaCentre, setVisaCentre] = useState("");
  const [isUpdatingVisa, setIsUpdatingVisa] = useState(false);
  const [visaNotice, setVisaNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (applicationId) {
      const fetchChallan = async () => {
        const q = query(collection(db, "invoices"), where("applicationId", "==", applicationId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setChallan({ id: snap.docs[0].id, ...snap.docs[0].data() } as Invoice);
        }
      };
      fetchChallan();
    }
  }, [applicationId]);

  const app = ownApplications.find((item) => item.id === applicationId);

  const relevantInvoices = React.useMemo(() => {
    const list = [...ownInvoices.filter((inv) => inv.applicationId === applicationId)];
    if (challan && !list.some((i) => i.id === challan.id)) {
      list.push(challan);
    }
    if (list.length === 0 && app?.studentId) {
      const fallback = ownInvoices.filter(
        (inv) => inv.studentId === app.studentId && (inv.type === "Deposit" || inv.type === "Tuition Fee" || inv.type === "Application Fee")
      );
      return fallback;
    }
    return list;
  }, [ownInvoices, applicationId, challan, app?.studentId]);

  const handleUploadProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !proofFile) return;
    setIsSubmittingProof(true);
    try {
      await submitPaymentProof(payingInvoice.id, proofFile, proofRef);
      setProofNotice(`Payment proof uploaded for Invoice #${payingInvoice.invoiceNumber}. Finance has been notified for verification.`);
      setPayingInvoice(null);
      setProofFile(null);
      setProofRef("");
      setTimeout(() => setProofNotice(null), 5000);
    } catch (err: any) {
      alert(`Proof submission failed: ${err.message}`);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleStudentVisaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    setIsUpdatingVisa(true);
    try {
      const historyItem = {
        stage: "Visa Submitted" as const,
        updatedBy: app.studentName || "Student",
        timestamp: Date.now(),
        note: `Student submitted visa application. Reference: ${visaRef || "N/A"}${visaCentre ? `, Centre: ${visaCentre}` : ""}`,
      };
      const updatedHistory = [...(app.history || []), historyItem];
      await updateDoc(doc(db, "applications", app.id), {
        stage: "Visa Submitted",
        updatedAt: Date.now(),
        history: updatedHistory,
      });
      setVisaNotice("Visa application marked as Submitted! Your Visa Officer has been notified.");
      setShowVisaSubmitModal(false);
      setTimeout(() => setVisaNotice(null), 6000);
    } catch (err: any) {
      alert(`Could not update visa status: ${err.message}`);
    } finally {
      setIsUpdatingVisa(false);
    }
  };

  const handleStudentVisaApproved = async () => {
    if (!app) return;
    if (!window.confirm("Confirm that your visa has been approved and granted by the embassy?")) return;
    setIsUpdatingVisa(true);
    try {
      const historyItem = {
        stage: "Visa Approved" as const,
        updatedBy: app.studentName || "Student",
        timestamp: Date.now(),
        note: "Student reported official visa grant / entry clearance approval.",
      };
      const updatedHistory = [...(app.history || []), historyItem];
      await updateDoc(doc(db, "applications", app.id), {
        stage: "Visa Approved",
        updatedAt: Date.now(),
        history: updatedHistory,
      });
      setVisaNotice("🎉 Congratulations on your Visa Approval! The admissions and visa department has been updated.");
      setTimeout(() => setVisaNotice(null), 6000);
    } catch (err: any) {
      alert(`Could not update visa status: ${err.message}`);
    } finally {
      setIsUpdatingVisa(false);
    }
  };

  if (!app) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-base font-bold text-[var(--text-primary)]">Application Not Found</p>
        <button
          onClick={() => navigate("/student/applications")}
          className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg cursor-pointer"
        >
          Back to My Applications
        </button>
      </div>
    );
  }

  const university = universities.find(
    (item) => item.id === app.universityId || item.name.toLowerCase() === app.universityName.toLowerCase()
  );
  const campusImage = getUniversityCampusImage(university || app.universityName);
  const landmark = getUniversityLandmark(university?.id);

  const isApproved =
    app.stage === "Unconditional Offer" ||
    app.stage === "CAS Issued" ||
    app.stage === "Enrolled";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 font-sans animate-fade-in">
      <button
        onClick={() => navigate("/student/applications")}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Applications
      </button>

      {/* Header Banner with Real Campus Hero Photography */}
      <header className="overflow-hidden rounded-3xl border border-[var(--border-default)] p-6 sm:p-8 relative shadow-2xl min-h-[190px] flex flex-col justify-end bg-slate-950">
        {/* Real Campus Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105 opacity-40"
          style={{ backgroundImage: `url('${campusImage}')` }}
        />
        {/* Sleek Dark Gradient Overlay for Maximum Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {app.applicationNumber}
              </span>
              <span className="text-xs text-zinc-300 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{university?.city ? `${university.city}, ` : ""}{university?.country || app.targetCountry || "International"}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mt-2 drop-shadow-md">
              {app.universityName}
            </h1>
            <p className="text-sm text-zinc-300 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{app.programmeName}</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">{app.intake}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-bold border shrink-0 ${getStageBadgeStyle(
                app.stage
              )}`}
            >
              {app.stage}
            </span>
            {isApproved && (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed / Approved Status
              </span>
            )}
            {(app.stage === "Draft" || app.applicationStatus === "Draft") && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Delete this draft application for ${app.universityName}?`)) {
                      await deleteDraftApplication(app.id);
                      navigate("/student/applications");
                    }
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Draft</span>
                </button>
                <Link
                  to={`/student/new-application?universityId=${app.universityId}&programmeId=${app.programmeId}&applicationId=${app.id}`}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors flex items-center gap-1"
                >
                  <span>Continue</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* University & Campus Showcase Card */}
      <section className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] overflow-hidden shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Real University Campus Photo with Landmark Badge */}
          <div className="relative h-52 md:h-auto min-h-[220px] overflow-hidden group bg-slate-900">
            <img
              src={campusImage}
              alt={`${app.universityName} Campus`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = "/images/campus_uk.jpg";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white text-xs">
              <span className="bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                Official Campus View
              </span>
              <p className="text-[11px] font-medium mt-1 truncate text-zinc-200">
                {landmark}
              </p>
            </div>
          </div>

          {/* Institutional Highlights */}
          <div className="p-6 md:col-span-2 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>{app.universityName}</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                    <span>{university?.city ? `${university.city}, ` : ""}{university?.country || app.targetCountry || "International"}</span>
                    {university?.campus && <span>• {university.campus} Campus</span>}
                  </p>
                </div>
                {university?.website && (
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors"
                  >
                    <span>Official University Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {university?.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
                  {university.description}
                </p>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--border-default)]">
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Global Rank</span>
                <span className="text-sm font-bold text-emerald-400">
                  {university?.globalRanking ? `#${university.globalRanking}` : "Top 100"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">National Rank</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {university?.nationalRanking ? `#${university.nationalRanking}` : "Tier 1"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Acceptance</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {university?.acceptanceRate ? `${university.acceptanceRate}%` : "Competitive"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Accreditation</span>
                <span className="text-sm font-bold text-emerald-400 truncate block">
                  {university?.accreditationStatus || "Full Partner"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmed Offer Callout if Approved */}
      {isApproved && (
        <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h2 className="font-bold text-base text-emerald-300">
                Official Offer Released & Confirmed!
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                The admissions office and {app.universityName} have reviewed your credentials and confirmed your admission.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Next Action Box */}
      <section className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 space-y-2">
        <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Next Action
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {app.nextAction || getStageGuidance(app.stage)}
        </p>
      </section>

      {/* Visa & Embassy Processing Section */}
      {["CAS Issued", "Visa Preparation", "Visa Submitted", "Visa Approved", "Enrolled"].includes(app.stage) && (
        <section className="rounded-2xl bg-[var(--bg-card)] border border-emerald-500/30 p-6 space-y-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base text-[var(--text-primary)]">
                  Visa & Embassy Processing Tracker
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Complete your visa filing, embassy compliance checklist, and arrival milestones.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Current Stage: {app.stage}
              </span>
            </div>
          </div>

          {visaNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-between">
              <span>{visaNotice}</span>
              <button onClick={() => setVisaNotice(null)} className="underline cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* Visa Stepper */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { title: "1. CAS / COE Released", desc: "Official code ready", done: ["CAS Issued", "Visa Preparation", "Visa Submitted", "Visa Approved", "Enrolled"].includes(app.stage) },
              { title: "2. Visa Preparation", desc: "Funds & medical proof", done: ["Visa Preparation", "Visa Submitted", "Visa Approved", "Enrolled"].includes(app.stage), active: app.stage === "Visa Preparation" },
              { title: "3. Visa Lodged", desc: "Biometrics & embassy", done: ["Visa Submitted", "Visa Approved", "Enrolled"].includes(app.stage), active: app.stage === "Visa Submitted" },
              { title: "4. Visa Approved", desc: "Vignette & enrolment", done: ["Visa Approved", "Enrolled"].includes(app.stage), active: app.stage === "Visa Approved" || app.stage === "Enrolled" },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  step.active
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30"
                    : step.done
                    ? "bg-[var(--bg-elevated)] border-emerald-500/30 text-emerald-400"
                    : "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-muted)] opacity-60"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {step.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                  <span>{step.title}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Detailed Guidance Box */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
            <h3 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Visa Checklist & Requirements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[var(--text-primary)] block">University CAS / Confirmation Document</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Official code issued by {app.universityName} registry.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[var(--text-primary)] block">28-Day Bank Statement / Maintenance</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Must cover tuition + living expenses held for 28 consecutive days.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[var(--text-primary)] block">Medical / TB Screening Certificate</span>
                  <span className="text-[11px] text-[var(--text-muted)]">From an approved embassy clinic if applicable to your country.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[var(--text-primary)] block">Biometrics & Passport Validity</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Ensure passport has at least 6 months validity from travel date.</span>
                </div>
              </div>
            </div>

            {/* Stage-Specific Call-To-Action */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)]">
              <div className="text-xs text-[var(--text-secondary)]">
                {app.stage === "Visa Preparation" && (
                  <span>Once you have lodged your visa at the visa center (VFS/Embassy), mark it as submitted below.</span>
                )}
                {app.stage === "Visa Submitted" && (
                  <span>Your visa is under evaluation at the embassy. When you receive your decision letter or passport, report it here.</span>
                )}
                {app.stage === "Visa Approved" && (
                  <span className="text-emerald-400 font-semibold">Visa successfully approved! You are cleared for international travel and enrolment.</span>
                )}
                {app.stage === "Enrolled" && (
                  <span className="text-emerald-400 font-semibold">🎉 All admissions and visa milestones completed!</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to="/student/messages"
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ask Visa Officer</span>
                </Link>

                <Link
                  to="/student/documents"
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload Visa Docs</span>
                </Link>

                {app.stage === "Visa Preparation" && (
                  <button
                    type="button"
                    onClick={() => setShowVisaSubmitModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>I Have Submitted My Visa</span>
                  </button>
                )}

                {app.stage === "Visa Submitted" && (
                  <button
                    type="button"
                    onClick={handleStudentVisaApproved}
                    disabled={isUpdatingVisa}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Report Visa Approved</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal: Confirm Visa Lodged / Submitted */}
      {showVisaSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Confirm Visa Submission
                </h3>
              </div>
              <button
                onClick={() => setShowVisaSubmitModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enter your visa application tracking reference or GWF number to update your application status to <strong>Visa Submitted</strong> and notify your Visa Officer.
            </p>

            <form onSubmit={handleStudentVisaSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Visa Reference / GWF Number
                </label>
                <input
                  type="text"
                  required
                  value={visaRef}
                  onChange={(e) => setVisaRef(e.target.value)}
                  placeholder="e.g. GWF012345678 or VFS-LON-9921"
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Visa Center / Embassy Location
                </label>
                <input
                  type="text"
                  value={visaCentre}
                  onChange={(e) => setVisaCentre(e.target.value)}
                  placeholder="e.g. VFS Lahore / Gerry's Islamabad / TLSContact"
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVisaSubmitModal(false)}
                  className="px-4 py-2 bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingVisa || !visaRef.trim()}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingVisa ? "Updating..." : "Confirm & Update Stage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Submission Notice */}
      {proofNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <span>{proofNotice}</span>
          <button onClick={() => setProofNotice(null)} className="underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Challan / Payment Box */}
      <section className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Fee Challan & Financial Records
          </h2>
          {relevantInvoices.length > 0 && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {relevantInvoices.length} Record(s)
            </span>
          )}
        </div>

        {relevantInvoices.length > 0 ? (
          <div className="space-y-3">
            {relevantInvoices.map((inv) => {
              const isPaid = inv.status === "Paid";
              const isPartiallyPaid = inv.status === "Partially Paid";

              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                        {inv.invoiceNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {inv.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isPaid
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : isPartiallyPaid
                            ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {isPaid ? "Paid" : isPartiallyPaid ? "Proof Submitted / Verifying" : inv.status}
                      </span>
                    </div>
                    <p className="text-base font-bold text-emerald-400 font-heading">
                      {inv.currency} {inv.amount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Due Date: {inv.dueDate || "Upon Receipt"}
                      {inv.notes && ` • ${inv.notes}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const html = generateInvoiceHtml(inv);
                        printDocumentHtml(html);
                      }}
                      className="px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Challan</span>
                    </button>

                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => setPayingInvoice(inv)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Proof</span>
                      </button>
                    )}

                    {isPaid && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Receipt Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
            <p>
              {app.stage === "Deposit Pending"
                ? "Your admission deposit is pending. The finance department is issuing your official fee challan shortly."
                : "No outstanding tuition or deposit challans recorded for this application."}
            </p>
          </div>
        )}
      </section>

      {/* Payment Proof Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)] backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleUploadProofSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)] font-heading">
                  Submit Payment Proof
                </h3>
                <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                  Challan #{payingInvoice.invoiceNumber} • {payingInvoice.currency} {payingInvoice.amount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Upload Bank Receipt / Deposit Slip <span className="text-rose-400">*</span>
              </label>
              <input
                type="file"
                required
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs cursor-pointer"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Accepted: PDF, PNG, JPG up to 15MB.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Bank Transaction / Reference ID
              </label>
              <input
                type="text"
                value={proofRef}
                onChange={(e) => setProofRef(e.target.value)}
                placeholder="e.g. FT2609148819 or Wire Transfer Ref"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-2 bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingProof || !proofFile}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingProof ? "Submitting..." : "Upload & Notify Finance"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline Section */}
      <section className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 space-y-4">
        <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          Application Timeline & Audit Trail
        </h2>

        <ol className="relative border-l border-[var(--border-default)] pl-6 space-y-6">
          {(app.history || [])
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((event, index) => (
              <li key={`${event.timestamp}-${index}`} className="relative">
                <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {event.stage}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {new Date(event.timestamp).toLocaleString()} · Updated by {event.updatedBy}
                </p>
                {event.note && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                    {event.note}
                  </p>
                )}
              </li>
            ))}
        </ol>
      </section>

      {/* Documents Section */}
      <section className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Supporting Documents
          </h2>
          <Link
            to="/student/documents"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Open Document Vault</span>
            <span>→</span>
          </Link>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          {ownDocuments.length} document record(s) attached to your applicant profile. All academic records, transcripts, and certificates are securely linked to this application.
        </p>

        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Admissions Document Encryption Active
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Transcripts, ID records, and degree certificates are verified and forwarded to {app.universityName} admissions registry.
              </p>
            </div>
          </div>
          <Link
            to="/student/documents"
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-lg border border-emerald-500/30 shrink-0 transition-colors"
          >
            Manage Files
          </Link>
        </div>
      </section>
    </div>
  );
};
