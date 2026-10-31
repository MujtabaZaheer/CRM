import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  FolderOpen,
  ArrowRight,
  Calendar,
  MessageSquare,
  ChevronRight,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { usePortalData } from "../../hooks/usePortalData";
import { GLOBAL_UNIVERSITIES } from "../../data/globalUniversities";
import { getUniversityCampusImage } from "../../utils/universityImages";

export const ModernStudentDashboard: React.FC = () => {
  const { appUser } = useAuth();
  const { ownStudent, ownApplications, ownDocuments, ownTasks, ownInvoices } = usePortalData();
  const navigate = useNavigate();

  const studentName = ownStudent?.fullName?.split(" ")[0] || appUser?.displayName?.split(" ")[0] || "";
  const completeness = ownStudent?.profileCompleteness ?? 0;
  const profileGpa = Number.parseFloat((ownStudent as any)?.academicHistory?.[0]?.gradeGpa || "");
  const profileEnglish = Number.parseFloat((ownStudent as any)?.englishProficiency?.overallScore || "");
  const profileTarget = [ownStudent?.preferredDestination, ownStudent?.desiredStudyLevel].filter(Boolean).join(" / ") || "Not provided";

  // Dynamic time-based greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greeting: `Good morning, ${studentName}`, emoji: "🌅", subtitle: "Here's the latest status of your international university applications." };
    }
    if (hour >= 12 && hour < 17) {
      return { greeting: `Good afternoon, ${studentName}`, emoji: "☀️", subtitle: "Track live admissions progress and complete pending university requirements." };
    }
    if (hour >= 17 && hour < 22) {
      return { greeting: `Good evening, ${studentName}`, emoji: "🌆", subtitle: "Review your admissions milestones, conditional offers, and visa readiness." };
    }
    return { greeting: `Good night, ${studentName}`, emoji: "🌙", subtitle: "Your applications are active. Review your progress or prepare for tomorrow." };
  }, [studentName]);

  // Comprehensive KPI metrics
  const kpiStats = useMemo(() => {
    const totalApps = ownApplications.length;
    const underReview = ownApplications.filter((a) =>
      ["Submitted", "University Reviewing", "Initial Review", "Ready for Submission"].includes(a.stage)
    ).length;
    const offers = ownApplications.filter((a) =>
      ["Conditional Offer", "Unconditional Offer", "Approved", "CAS Issued"].includes(a.stage)
    ).length;
    const accepted = ownApplications.filter((a) =>
      ["Enrolled", "Deposit Paid"].includes(a.stage)
    ).length;
    const pendingInvoices = (ownInvoices || []).filter((inv) => inv.status !== "Paid");
    const actionRequired =
      pendingInvoices.length +
      ownDocuments.filter((d) => d.status === "Rejected" || d.status === "Pending" || d.status === "Missing").length +
      ownTasks.filter((t) => t.status !== "Completed").length;

    return { totalApps, underReview, offers, accepted, actionRequired };
  }, [ownApplications, ownInvoices, ownDocuments, ownTasks]);

  // Priority Offer application if present
  const topOffer = useMemo(() => {
    return ownApplications.find((app) =>
      ["Conditional Offer", "Unconditional Offer", "Approved", "CAS Issued"].includes(app.stage)
    );
  }, [ownApplications]);

  // AI-Matched Recommended Programmes from curated partner catalog
  const aiRecommendations = useMemo(() => {
    const studentGpa = Number.parseFloat((ownStudent as any)?.academicHistory?.[0]?.gradeGpa || "");
    const studentIelts = Number.parseFloat((ownStudent as any)?.englishProficiency?.overallScore || "");

    if (!Number.isFinite(studentGpa) || !Number.isFinite(studentIelts)) return [];

    const matches: any[] = [];
    GLOBAL_UNIVERSITIES.forEach((univ) => {
      (univ.programmes || []).forEach((prog) => {
        const reqGpa = prog.requirements?.minGpa || 3.0;
        const reqIelts = prog.minIeltsScore || 6.5;

        if (studentGpa >= reqGpa && studentIelts >= reqIelts) {
          const score = Math.min(99, 93 + Math.round((studentGpa - reqGpa) * 10));
          matches.push({
            university: univ,
            programme: prog,
            score,
            tier: "High Match",
            scholarship: studentGpa >= 3.4 ? "£3,000 Merit Award" : null,
          });
        }
      });
    });

    return matches.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [ownStudent]);

  // Priority documents checklist
  const documentChecklist = useMemo(() => {
    const requiredTypes = [
      { key: "passport", label: "International Passport", required: true },
      { key: "transcripts", label: "Official Academic Transcripts", required: true },
      { key: "ielts", label: "IELTS / English Proficiency Scorecard", required: true },
      { key: "sop", label: "Statement of Purpose (SOP)", required: true },
      { key: "lor", label: "Academic Reference Letters (LOR)", required: false },
    ];

    return requiredTypes.map((req) => {
      const match = ownDocuments.find((d) =>
        d.documentType?.toLowerCase().includes(req.key) || d.fileName?.toLowerCase().includes(req.key)
      );
      return {
        ...req,
        status: match ? match.status : "Pending",
        fileName: match?.fileName,
        updatedAt: match?.createdAt ? new Date(match.createdAt).toLocaleDateString() : null,
      };
    });
  }, [ownDocuments]);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16 font-sans animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. WELCOME HERO SECTION & PROFILE HEALTH                                 */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-default p-6 sm:p-8 overflow-hidden shadow-xl">
        {/* Ambient Glow Elements */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/3 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>International Student Admissions Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-primary font-heading tracking-tight">
              {timeGreeting.greeting} {timeGreeting.emoji}
            </h1>
            <p className="text-xs sm:text-sm text-secondary max-w-2xl leading-relaxed">
              {timeGreeting.subtitle} You have <span className="font-bold text-teal-400">{ownApplications.length} active application dossiers</span> managed through EduCRM.
            </p>
          </div>

          {/* Quick Actions & Profile Completeness Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/profile"
              className="flex items-center gap-3 px-4 py-2.5 bg-main/80 hover:bg-main border border-default/80 rounded-2xl transition-all shadow group"
            >
              <div className="text-left leading-tight">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Profile Health</span>
                <span className="text-xs font-extrabold text-primary group-hover:text-teal-300 transition-colors">
                  {completeness}% Complete
                </span>
              </div>
              <div className="w-16 h-2 bg-elevated rounded-full overflow-hidden border border-default/60">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </Link>

            <Link
              to="/student/ai-match"
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-primary rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Study Match</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. 5-KPI APPLICATION OVERVIEW CARDS                                       */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Total Applications */}
        <div
          onClick={() => navigate("/student/applications")}
          className="p-4 sm:p-5 rounded-2xl bg-surface/90 border border-default hover:border-default transition-all cursor-pointer group shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Applications</span>
            <div className="w-8 h-8 rounded-xl bg-elevated text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-primary font-heading">{kpiStats.totalApps}</div>
          <p className="mt-1 text-[11px] text-muted">Total submitted cases</p>
        </div>

        {/* 2. Under Review */}
        <div
          onClick={() => navigate("/student/applications")}
          className="p-4 sm:p-5 rounded-2xl bg-surface/90 border border-default hover:border-sky-500/40 transition-all cursor-pointer group shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Under Review</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-sky-300 font-heading">{kpiStats.underReview}</div>
          <p className="mt-1 text-[11px] text-muted">Admissions evaluation</p>
        </div>

        {/* 3. Offers Received */}
        <div
          onClick={() => navigate("/student/applications")}
          className="p-4 sm:p-5 rounded-2xl bg-surface/90 border border-default hover:border-emerald-500/40 transition-all cursor-pointer group shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Offers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-300 font-heading">{kpiStats.offers}</div>
          <p className="mt-1 text-[11px] text-muted">Decisions ready</p>
        </div>

        {/* 4. Confirmed / Accepted */}
        <div
          onClick={() => navigate("/student/applications")}
          className="p-4 sm:p-5 rounded-2xl bg-surface/90 border border-default hover:border-indigo-500/40 transition-all cursor-pointer group shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Confirmed</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-indigo-300 font-heading">{kpiStats.accepted}</div>
          <p className="mt-1 text-[11px] text-muted">Enrolled places</p>
        </div>

        {/* 5. Action Required */}
        <div
          onClick={() => navigate("/student/documents")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group shadow ${
            kpiStats.actionRequired > 0
              ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15"
              : "bg-surface/90 border-default"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${kpiStats.actionRequired > 0 ? "text-amber-400" : "text-muted"}`}>
              Action Needed
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-amber-300 font-heading">{kpiStats.actionRequired}</div>
          <p className="mt-1 text-[11px] text-muted">Pending steps & docs</p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROMINENT OFFICIAL ADMISSION OFFER SHOWCASE                             */}
      {/* ========================================================================= */}
      {topOffer && (
        <section className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.10] pointer-events-none">
            <img
              src={getUniversityCampusImage(topOffer.universityId || topOffer.universityName)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>OFFICIAL ADMISSION OFFER READY</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-heading">
                {topOffer.universityName}
              </h2>
              <p className="text-xs sm:text-sm text-secondary max-w-2xl">
                Programme: <span className="font-semibold text-primary">{topOffer.programmeName}</span> &middot; Intake: <span className="font-semibold text-teal-300">{topOffer.intake || "Fall 2026"}</span> &middot; Status: <span className="font-bold text-emerald-400">{topOffer.stage}</span>
              </p>
              <p className="text-xs text-emerald-400/90 font-medium">
                &bull; Awarded £3,000 International Academic Merit Bursary towards first year tuition.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={`/student/applications/${topOffer.id}`}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-on-accent font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Accept & View Offer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. APPLICATION TRACKER PIPELINE & STAGES                                  */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-surface/90 border border-default p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary font-heading">
              Application Tracker Pipeline
            </h2>
            <p className="text-xs text-muted">
              Live status across university admissions offices and immigration authorities
            </p>
          </div>
          <Link
            to="/student/applications"
            className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Applications</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {ownApplications.slice(0, 3).map((app) => {
            const stages = ["Submitted", "Under Review", "Offer Issued", "CAS Clearance", "Visa Granted"];
            const currentStageIndex = app.stage.includes("Offer") ? 2 : app.stage.includes("CAS") ? 3 : 1;

            return (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-main/60 border border-default/80 hover:border-default transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-placeholder">#{(app as any).appNumber || app.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                        {app.stage}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-primary font-heading">{app.universityName}</div>
                    <div className="text-xs text-muted">{app.programmeName} &middot; Intake: {app.intake || "September 2026"}</div>
                  </div>

                  <Link
                    to={`/student/applications/${app.id}`}
                    className="px-3.5 py-1.5 bg-elevated hover:bg-elevated text-secondary border border-default/80 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors"
                  >
                    Details & Timeline
                  </Link>
                </div>

                {/* Visual Pipeline Progression Bar */}
                <div className="pt-2 border-t border-default/60">
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {stages.map((st, idx) => {
                      const isComplete = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      return (
                        <div key={st} className="space-y-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isComplete
                                ? "bg-gradient-to-r from-teal-400 to-emerald-500"
                                : "bg-elevated"
                            } ${isCurrent ? "ring-2 ring-teal-400/40" : ""}`}
                          />
                          <span className={`text-[10px] block truncate ${isComplete ? "text-teal-300 font-bold" : "text-placeholder font-medium"}`}>
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TWO-COLUMN GRID: AI STUDY MATCH & DOCUMENT VAULT CENTRE                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: AI Study-Matching Recommendations */}
        <section className="rounded-3xl bg-surface/90 border border-default p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary font-heading">AI Study Matcher</h3>
                  <p className="text-xs text-muted">Tailored degree matches for your academic profile</p>
                </div>
              </div>
              <Link
                to="/student/ai-match"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <span>Full Matcher</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Profile Snapshot Banner */}
            <div className="p-3 bg-main/70 border border-default rounded-2xl flex items-center justify-between text-xs">
              <span className="text-muted font-medium">Your Credentials:</span>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">GPA: <span className="text-teal-400">{Number.isFinite(profileGpa) ? `${profileGpa} / 4.0` : "Not provided"}</span></span>
                <span className="text-primary font-bold">IELTS: <span className="text-teal-400">{Number.isFinite(profileEnglish) ? `${profileEnglish} Band` : "Not provided"}</span></span>
                <span className="text-primary font-bold">Target: <span className="text-teal-400">{profileTarget}</span></span>
              </div>
            </div>

            {/* Matched Degree Cards */}
            <div className="space-y-3">
              {aiRecommendations.map((match, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-main/60 border border-default hover:border-default transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={getUniversityCampusImage(match.university.id)}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover border border-default/60 flex-shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-primary truncate">{match.programme.title}</div>
                      <div className="text-[11px] text-muted truncate">{match.university.name} &middot; £{match.programme.tuitionFeeAnnual?.toLocaleString()}/yr</div>
                      {match.scholarship && (
                        <div className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 mt-0.5">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>{match.scholarship} eligible</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      {match.score}% Match
                    </span>
                    <Link
                      to={`/student/new-application?universityId=${match.university.id}&programmeId=${match.programme.id}`}
                      className="block text-[11px] font-bold text-secondary hover:text-primary mt-1 transition-colors"
                    >
                      Apply &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-default/80 text-[11px] text-placeholder">
            * Generated via deterministic criteria matching against prerequisites of 120+ partner universities.
          </div>
        </section>

        {/* Right Column: Document Centre & Verification Checklist */}
        <section className="rounded-3xl bg-surface/90 border border-default p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary font-heading">Document Centre</h3>
                  <p className="text-xs text-muted">Verification checklist for CAS and university offers</p>
                </div>
              </div>
              <Link
                to="/student/documents"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <span>Document Vault</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5">
              {documentChecklist.map((doc, idx) => {
                const isVerified = doc.status === "Verified";
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-main/60 border border-default flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-bold text-primary truncate">{doc.label}</div>
                        <div className="text-[10px] text-muted truncate">
                          {doc.fileName ? `File: ${doc.fileName}` : "Awaiting submission"}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex-shrink-0 ${
                        isVerified
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/student/documents"
            className="w-full py-2.5 bg-elevated hover:bg-elevated text-secondary border border-default/80 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-teal-400" />
            <span>Upload Missing Documents to Vault</span>
          </Link>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 6. ASSIGNED COUNSELLOR & INTERNATIONAL SCHOLARSHIPS STRIP                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Counsellor Dossier Card */}
        <section className="rounded-3xl bg-surface/90 border border-default p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Your Education Counsellor</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Assigned
            </span>
          </div>

          <div className="flex items-center gap-3.5 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center text-base font-black text-primary shadow-md flex-shrink-0">
              SJ
            </div>
            <div>
              <div className="text-sm font-bold text-primary font-heading">Sarah Jenkins</div>
              <div className="text-xs text-muted">Senior International Counsellor</div>
              <div className="text-[11px] text-teal-400 font-medium">London HQ / Global Admissions</div>
            </div>
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            Sarah is handling your admissions triage, transcript evaluation, and university submission deadlines.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to="/student/messages"
              className="py-2 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </Link>
            <Link
              to="/student/appointments"
              className="py-2 bg-elevated hover:bg-elevated text-secondary border border-default/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Book Call</span>
            </Link>
          </div>
        </section>

        {/* Scholarships Radar Card (2 cols) */}
        <section className="lg:col-span-2 rounded-3xl bg-surface/90 border border-default p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-primary font-heading">International Scholarships Radar</h3>
                <p className="text-xs text-muted">Eligible funding opportunities for UK & global universities</p>
              </div>
              <Link
                to="/student/scholarships"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <span>View All Radar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-main/60 border border-default space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Merit Bursary</span>
                  <span className="text-xs font-black text-teal-300 font-mono">£3,000 Award</span>
                </div>
                <div className="text-xs font-bold text-primary">Vice-Chancellor's International Excellence</div>
                <p className="text-[11px] text-muted">Awarded automatically for GPA &gt;= 3.4 on offer issuance.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-main/60 border border-default space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">STEM Fellowship</span>
                  <span className="text-xs font-black text-teal-300 font-mono">£5,000 Award</span>
                </div>
                <div className="text-xs font-bold text-primary">Global Women in Computing & STEM</div>
                <p className="text-[11px] text-muted">Deadline: 15 July 2026. Essay statement required.</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-muted">
            <span>Matched to your target discipline: <strong className="text-primary">Computer Science & AI</strong></span>
            <Link to="/student/scholarships" className="font-bold text-teal-400 hover:text-teal-300">
              Apply for Funding &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
