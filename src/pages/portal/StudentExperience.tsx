import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  AlertCircle, 
  ArrowRight, 
  GraduationCap, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  Building2, 
  Compass, 
  Clock, 
  ChevronRight,
  MapPin
} from "lucide-react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { usePortalData } from "../../hooks/usePortalData";
import { Programme, University } from "../../types/university";
import { assessEligibility } from "../../utils/eligibility";
import { UniversityExplorerMatcher } from "../../components/portal/UniversityExplorerMatcher";
import { getUniversityCampusImage, getUniversityLandmark } from "../../utils/universityImages";

const money = (value: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const programmesFor = (university: University) => university.programmes || [];

const Cover: React.FC<{ 
  university?: University | { id?: string; name?: string; country?: string; city?: string; coverImageUrl?: string }; 
  name?: string; 
  className?: string; 
}> = ({ university, name, className = "" }) => {
  const target = university || name || "";
  const imageUrl = getUniversityCampusImage(target);
  const altText = (typeof university === "object" && university?.name) ? university.name : (name || "University campus");

  return (
    <img
      src={imageUrl}
      alt={`${altText} campus`}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85";
      }}
      className={`object-cover ${className}`}
    />
  );
};

const EligibilityBadge: React.FC<{ programme: Programme; student: ReturnType<typeof usePortalData>["ownStudent"] }> = ({ programme, student }) => { 
  const result = assessEligibility(student, programme); 
  const style = result.status === "eligible" 
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" 
    : result.status === "not_eligible" 
    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30" 
    : "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30"; 
  const label = result.status === "eligible" ? "Meets requirements" : result.status === "not_eligible" ? "Needs review" : "Assessment pending"; 
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${style}`}>{label}</span>; 
};

export const StudentDashboard: React.FC = () => {
  const { ownStudent, ownApplications, ownDocuments, ownTasks } = usePortalData();
  const { universities } = useGlobalData();
  const navigate = useNavigate();

  const name = ownStudent?.fullName?.split(" ")[0] || "there";
  const completeness = ownStudent?.profileCompleteness || 0;
  
  const active = ownApplications.filter((app) => !["Rejected", "Withdrawn", "Enrolled"].includes(app.stage));

  // Intelligent, Commercial-Grade Next Action Engine
  const nextAction = React.useMemo(() => {
    // 1. Any offers received (Highest Priority Milestone)
    const offerApp = ownApplications.find((app) =>
      ["Conditional Offer", "Unconditional Offer", "Deposit Pending", "CAS Issued"].includes(app.stage)
    );
    if (offerApp) {
      return {
        badge: "OFFER RECEIVED",
        badgeColor: "emerald" as const,
        title: `Offer Received: ${offerApp.universityName}`,
        text: `Official admission offer has been issued for ${offerApp.programmeName}. Review conditions and confirm your placement.`,
        actionText: "Review Offer Letters",
        href: `/student/applications/${offerApp.id}`,
        universityName: offerApp.universityName,
        universityId: offerApp.universityId,
        programmeName: offerApp.programmeName,
        icon: Sparkles,
      };
    }

    // 2. Any active draft application
    const draftApp = ownApplications.find((app) => app.stage === "Draft");
    if (draftApp) {
      return {
        badge: "ACTION REQUIRED • DRAFT READY",
        badgeColor: "amber" as const,
        title: `Resume Application: ${draftApp.universityName}`,
        text: `You have an unsubmitted application draft for ${draftApp.programmeName}. Complete remaining statements and submit your official application.`,
        actionText: "Continue Application",
        href: `/student/new-application?universityId=${draftApp.universityId}&programmeId=${draftApp.programmeId}`,
        universityName: draftApp.universityName,
        universityId: draftApp.universityId,
        programmeName: draftApp.programmeName,
        icon: Clock,
      };
    }

    // 3. Applications requiring documents or additional info
    const docApp = ownApplications.find((app) =>
      ["Additional Info Requested", "Documents Pending"].includes(app.stage)
    );
    if (docApp) {
      return {
        badge: "ACTION REQUIRED • DOCUMENTS NEEDED",
        badgeColor: "rose" as const,
        title: `Document Request: ${docApp.universityName}`,
        text: `The admissions committee for ${docApp.programmeName} requires supplementary documents to process your assessment.`,
        actionText: "Upload to Document Vault",
        href: "/student/documents",
        universityName: docApp.universityName,
        universityId: docApp.universityId,
        programmeName: docApp.programmeName,
        icon: AlertCircle,
      };
    }

    // 4. Applications under official admissions review
    const reviewApp = ownApplications.find((app) =>
      ["Submitted", "University Reviewing", "Initial Review", "Ready for Submission"].includes(app.stage)
    );
    if (reviewApp) {
      return {
        badge: "IN REVIEW • ADMISSIONS COMMITTEE",
        badgeColor: "sky" as const,
        title: `Admissions Review: ${reviewApp.universityName}`,
        text: `Your dossier for ${reviewApp.programmeName} has been submitted and is under official evaluation. Track timeline and counselor updates.`,
        actionText: "Track Application Status",
        href: `/student/applications/${reviewApp.id}`,
        universityName: reviewApp.universityName,
        universityId: reviewApp.universityId,
        programmeName: reviewApp.programmeName,
        icon: Building2,
      };
    }

    // 5. Incomplete profile check (< 80%)
    if (completeness < 80) {
      return {
        badge: "PROFILE SETUP",
        badgeColor: "indigo" as const,
        title: "Complete Your Academic Profile",
        text: `Your profile is at ${completeness}%. Add educational qualifications and test scores to unlock accurate university matching.`,
        actionText: "Update Academic History",
        href: "/student/profile",
        icon: GraduationCap,
      };
    }

    // 6. Default: explore programs if no applications
    return {
      badge: "DISCOVER PROGRAMMES",
      badgeColor: "emerald" as const,
      title: "Find & Match Programs",
      text: "Explore top global universities matching your academic grades, preferred intake, and budget.",
      actionText: "Explore Programs",
      href: "/student/programs",
      icon: Compass,
    };
  }, [ownApplications, completeness]);

  const verifiedDocCount = ownDocuments.filter((d) => d.status === "Verified").length;
  const standardRequired = [
    { type: "Passport", label: "Passport" },
    { type: "Academic Transcript", label: "Academic Transcript" },
    { type: "High School Transcript", label: "High School Transcript" },
    { type: "Degree Certificate", label: "Degree Certificate" },
    { type: "English Language Certificate", label: "English Test Certificate" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-12 font-sans animate-fade-in">
      
      {/* Header - High-end Futuristic Glassmorphic Banner */}
      <header className="rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 px-6 py-7 shadow-sm sm:px-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Student Admissions Portal
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight font-heading text-slate-900 dark:text-white">
              Good morning, {name} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              Continue tracking your university applications, dossiers, and verified credentials.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-100/90 dark:bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Readiness</span>
            <div className="w-28 h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-sm" 
                style={{ width: `${completeness}%` }} 
              />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completeness}%</span>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        
        {/* Left Column: Next Step Tracker + My Applications */}
        <div className="space-y-6">

          {/* Futuristic Commercial Next Action Hero Card */}
          <div className={`rounded-3xl border p-6 sm:p-7 shadow-sm relative overflow-hidden transition-all backdrop-blur-xl ${
            nextAction.badgeColor === "amber"
              ? "bg-gradient-to-br from-white/95 via-amber-50/40 to-amber-100/20 dark:from-surface/90 dark:via-amber-950/20 dark:to-surface/90 border-amber-500/30"
              : nextAction.badgeColor === "emerald"
              ? "bg-gradient-to-br from-white/95 via-emerald-50/40 to-emerald-100/20 dark:from-surface/90 dark:via-emerald-950/20 dark:to-surface/90 border-emerald-500/30"
              : nextAction.badgeColor === "sky"
              ? "bg-gradient-to-br from-white/95 via-sky-50/40 to-sky-100/20 dark:from-surface/90 dark:via-sky-950/20 dark:to-surface/90 border-sky-500/30"
              : "bg-gradient-to-br from-white/95 via-indigo-50/40 to-indigo-100/20 dark:from-surface/90 dark:via-indigo-950/20 dark:to-surface/90 border-indigo-500/30"
          }`}>
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <nextAction.icon className="w-36 h-36" />
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                  nextAction.badgeColor === "amber"
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                    : nextAction.badgeColor === "emerald"
                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                    : nextAction.badgeColor === "sky"
                    ? "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30"
                    : "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {nextAction.badge}
                </span>

                {nextAction.universityName && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    {getUniversityLandmark(nextAction.universityId || nextAction.universityName)}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  {nextAction.title}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {nextAction.text}
                </p>
              </div>

              {/* University Photo Preview Chip (if attached to an application) */}
              {nextAction.universityName && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 shadow-xs">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0">
                    <Cover
                      university={{ id: nextAction.universityId, name: nextAction.universityName }}
                      name={nextAction.universityName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {nextAction.universityName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {nextAction.programmeName}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button 
                  onClick={() => navigate(nextAction.href)} 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {nextAction.actionText} <ArrowRight className="w-4 h-4" />
                </button>
                {nextAction.universityName && (
                  <Link
                    to="/student/applications"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                  >
                    View All Applications
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* My Applications Institutional Cards List */}
          <div className="rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold font-heading text-base sm:text-lg text-slate-900 dark:text-white">
                  My Applications
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {active.length} Active
                </span>
              </div>
              <Link 
                to="/student/applications" 
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {active.slice(0, 4).map((application) => { 
                const university = universities.find(
                  (item) => item.id === application.universityId || item.name.toLowerCase() === application.universityName?.toLowerCase()
                ); 
                // Navigate to Wizard if it's a draft, otherwise application detail
                const href = application.stage === "Draft" 
                  ? `/student/new-application?universityId=${application.universityId}&programmeId=${application.programmeId}`
                  : `/student/applications/${application.id}`;
                
                const isDraft = application.stage === "Draft";
                const isOffer = ["Conditional Offer", "Unconditional Offer", "CAS Issued"].includes(application.stage);

                return (
                  <Link 
                    key={application.id} 
                    to={href} 
                    className="group block overflow-hidden rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50 transition-all duration-200 p-4 shadow-2xs hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Authentic Real University Campus Photograph Thumbnail */}
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
                          <Cover 
                            university={university || { id: application.universityId, name: application.universityName, country: "", city: "", programmes: [], createdAt: 0, updatedAt: 0 }} 
                            name={application.universityName}
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold font-heading text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {application.universityName}
                            </h3>
                            {university?.country && (
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-200/70 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                {university.country}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 truncate mt-0.5 font-medium">
                            {application.programmeName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                            {getUniversityLandmark(application.universityId || application.universityName)}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
                          isDraft
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30"
                            : isOffer
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-sky-500/15 text-sky-800 dark:text-sky-400 border-sky-500/30"
                        }`}>
                          {application.stage}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                          {isDraft 
                            ? "Click to continue application →" 
                            : isOffer 
                            ? "Action required: review offer" 
                            : "Admissions review underway"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ); 
              })}

              {active.length === 0 && (
                <Empty title="No applications yet" action="Explore Programs" href="/student/programs" />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Institutional Widgets */}
        <div className="space-y-6">
          
          {/* Documents Widget - Clean & Accurate */}
          <div className="rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold font-heading text-slate-900 dark:text-white text-base">
                Documents
              </h2>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                {verifiedDocCount} / {standardRequired.length} Verified
              </span>
            </div>

            <div className="space-y-2.5">
              {standardRequired.map((req) => {
                const doc = ownDocuments.find((d) => d.documentType?.toLowerCase() === req.type.toLowerCase() || d.documentType?.toLowerCase() === req.label.toLowerCase());
                const isVerified = doc?.status === "Verified";
                const isPending = doc && doc.status !== "Verified";

                return (
                  <div 
                    key={req.type} 
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5"
                  >
                    <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-zinc-200">
                      {isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : isPending ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mx-0.5 shrink-0" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700 mx-0.5 shrink-0" />
                      )}
                      <span>{req.label}</span>
                    </span>

                    <span className={`text-[11px] font-bold ${
                      isVerified 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : isPending 
                        ? "text-amber-600 dark:text-amber-400" 
                        : "text-slate-400 dark:text-zinc-500"
                    }`}>
                      {isVerified ? "Verified" : isPending ? "Pending" : "Not uploaded"}
                    </span>
                  </div>
                );
              })}

              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 mt-2">
                <Link 
                  to="/student/documents" 
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline block text-center"
                >
                  Open Document Vault →
                </Link>
              </div>
            </div>
          </div>

          {/* My Tasks Widget */}
          <div className="rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm">
            <h2 className="font-bold font-heading text-slate-900 dark:text-white text-base mb-4">
              My Tasks
            </h2>
            <div className="space-y-2.5">
              {ownTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/5 pb-2.5 text-xs last:border-0 last:pb-0">
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{task.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === 'Completed' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
              {ownTasks.length === 0 && <p className="text-xs text-slate-500 dark:text-zinc-400">You're all caught up!</p>}
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm">
            <h2 className="font-bold font-heading text-slate-900 dark:text-white text-base mb-4">
              Upcoming Deadlines
            </h2>
            <div className="space-y-3">
              {Array.from(new Set(ownApplications.filter(app => app.intake).map(a => `${a.universityName}|${a.programmeName}|${a.intake}`)))
                .slice(0, 3)
                .map((key) => {
                  const [univ, prog, intake] = key.split("|");
                  return (
                    <div key={key} className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/5 pb-2.5 text-xs last:border-0 last:pb-0">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{univ}</span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate block">{prog}</span>
                      </div>
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md shrink-0">
                        {intake}
                      </span>
                    </div>
                  );
                })}
              {ownApplications.length === 0 && <p className="text-xs text-slate-500 dark:text-zinc-400">No upcoming deadlines.</p>}
            </div>
          </div>

          {/* Dedicated Admissions Advisory Desk */}
          <div className="rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 text-white flex items-center justify-center font-bold text-base shadow-md shadow-emerald-500/20 shrink-0">
                {ownStudent?.assignedCounsellorId ? "AC" : "AA"}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-bold">
                  Education Advisor
                </p>
                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                  Admissions Advisory Desk
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available for guidance
                </p>
              </div>
            </div>
            <Link
              to="/student/messages"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 hover:scale-105 active:scale-95 shrink-0"
            >
              Chat Now
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </section>

      {/* Recommended Universities */}
      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            Explore Universities
          </h2>
          <Link to="/student/universities" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {universities
            .filter(u => !ownStudent?.preferredDestination || u.country === ownStudent.preferredDestination)
            .slice(0, 3)
            .map(university => (
              <Link 
                key={university.id} 
                to={`/student/universities/${university.id}`} 
                className="group block overflow-hidden rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl shadow-sm border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50 transition-all hover:shadow-md"
              >
                <Cover university={university} className="h-44 w-full group-hover:scale-105 transition-transform duration-500" />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {university.country}
                    </p>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-[150px]">
                      {getUniversityLandmark(university.id || university.name)}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-bold font-heading text-slate-900 dark:text-white truncate">
                    {university.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 truncate">
                    {university.city}, {university.country}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Recommended Programs */}
      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            Recommended Programs
          </h2>
          <Link to="/student/programs" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            View all matches
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {universities
            .flatMap(u => programmesFor(u).map(p => ({ university: u, programme: p })))
            .filter(item => !ownStudent?.preferredDestination || item.university.country === ownStudent.preferredDestination)
            .slice(0, 3)
            .map(item => (
              <ProgrammeCard key={`${item.university.id}-${item.programme.id}`} university={item.university} programme={item.programme} />
            ))}
        </div>
      </section>
    </div>
  );
};

const Empty: React.FC<{ title: string; action: string; href: string }> = ({ title, action, href }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-8 text-center">
    <GraduationCap className="mx-auto h-8 w-8 text-slate-400 dark:text-zinc-500" />
    <p className="mt-3 font-semibold text-sm text-slate-600 dark:text-zinc-400">{title}</p>
    <Link to={href} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
      {action} <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  </div>
);

export const StudentUniversities: React.FC = () => { 
  return <UniversityExplorerMatcher initialViewMode="universities" isOnboarding={false} />;
};

export const StudentUniversityDetail: React.FC = () => { 
  const { universityId } = useParams(); 
  const { universities } = useGlobalData(); 
  const university = universities.find((item) => item.id === universityId); 
  
  if (!university) return <div className="p-8 text-secondary">University not found or is no longer available.</div>; 
  
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8 animate-fade-in">
      <div className="overflow-hidden rounded-3xl bg-main border border-default relative">
        <Cover university={university} className="h-64 w-full opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />
        <div className="-mt-24 relative p-7 z-10">
          <p className="text-sm font-bold tracking-wider text-emerald-400">{university.city}, {university.country}</p>
          <h1 className="mt-1 text-3xl font-bold text-white font-heading">{university.name}</h1>
          <p className="mt-3 max-w-2xl text-zinc-300">{university.description || "Programme and admission details are maintained by the education team."}</p>
          <a href={university.website?.startsWith("http") ? university.website : `https://${university.website}`} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Official website →</a>
        </div>
      </div>
      <section>
        <h2 className="text-xl font-bold font-heading text-primary">Popular programmes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {programmesFor(university).map((programme) => <ProgrammeCard key={programme.id} university={university} programme={programme} />)}
        </div>
      </section>
    </div>
  ); 
};

export const ProgrammeCard: React.FC<{ university: University; programme: Programme }> = ({ university, programme }) => { 
  const { ownStudent } = usePortalData(); 
  return (
    <article className="rounded-3xl bg-white/85 dark:bg-surface/85 backdrop-blur-xl p-5 shadow-sm border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50 transition-all hover:shadow-md flex flex-col h-full group">
      <div className="flex items-start gap-3.5 mb-3">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 shadow-xs">
          <Cover university={university} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {programme.level}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
              {university.country}
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 truncate mt-0.5">
            {university.name}
          </h4>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-bold font-heading text-sm text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {programme.title}
        </h3>
        <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300 flex flex-wrap gap-x-3 gap-y-1">
          <span>{programme.durationMonths} months</span>
          <span>•</span>
          <span className="font-semibold">{money(programme.tuitionFeeAnnual, programme.currency)} / year</span>
        </p>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <EligibilityBadge programme={programme} student={ownStudent} />
        <div className="flex items-center gap-2">
          <Link to={`/student/programs/${university.id}-${programme.id}`} className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-colors">
            Details
          </Link>
          <Link
            to={`/student/new-application?universityId=${university.id}&programmeId=${programme.id}`}
            className="text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Send className="w-3 h-3" /> Apply
          </Link>
        </div>
      </div>
    </article>
  ); 
};


export const StudentProgrammes: React.FC = () => { 
  return <UniversityExplorerMatcher initialViewMode="programs" isOnboarding={false} />;
};

export const StudentProgramDetail: React.FC = () => { 
  const { programId } = useParams(); 
  const { universities } = useGlobalData(); 
  const { ownStudent } = usePortalData(); 
  
  const found = universities
    .flatMap((university) => programmesFor(university).map((programme) => ({ university, programme })))
    .find((item) => `${item.university.id}-${item.programme.id}` === programId); 
    
  if (!found) return <div className="p-8 text-secondary">Programme not found.</div>; 
  
  const result = assessEligibility(ownStudent, found.programme); 
  const colorClass = result.status === "eligible" ? "emerald" : result.status === "not_eligible" ? "rose" : "amber"; 
  
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8 animate-fade-in">
      <div className="rounded-3xl bg-surface border border-default p-7 shadow-sm">
        <p className="text-sm font-bold text-emerald-500 tracking-wider uppercase">{found.university.name} • {found.university.city}</p>
        <h1 className="mt-2 text-3xl font-bold font-heading text-primary">{found.programme.title}</h1>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-secondary">
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">{found.programme.level}</span>
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">{found.programme.durationMonths} months</span>
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">{money(found.programme.tuitionFeeAnnual, found.programme.currency)}</span>
          <span className="bg-elevated border border-subtle px-3 py-1 rounded-full">Intakes: {found.programme.intakes.join(", ")}</span>
        </div>
      </div>
      
      <section className={`rounded-2xl border bg-${colorClass}-500/10 border-${colorClass}-500/30 p-6 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${colorClass}-500/20 text-${colorClass}-400`}>
            {result.status === "eligible" ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary font-heading">
              Based on your profile: <span className="capitalize">{result.status.replace("_", " ")}</span>
            </h2>
            <p className="mt-1 text-sm text-secondary">{result.disclaimer}</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          {result.checks.map((check) => (
            <div key={check.label} className="rounded-xl bg-surface border border-subtle p-4 text-sm shadow-sm flex items-start gap-3">
              <span className={`mt-0.5 font-bold ${check.status === "pass" ? "text-emerald-500" : check.status === "fail" ? "text-rose-500" : "text-amber-500"}`}>
                {check.status === "pass" ? "✓" : check.status === "fail" ? "✕" : "!"}
              </span>
              <div>
                <span className="font-semibold text-primary">{check.label}</span>
                <p className="mt-1 text-secondary">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Link 
          to={`/student/new-application?universityId=${found.university.id}&programmeId=${found.programme.id}`} 
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors"
        >
          Start application <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  ); 
};
