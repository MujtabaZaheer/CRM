import React, { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Send,
  MapPin,
  Clock,
  ChevronRight,
  Trash2,
  CreditCard,
  Award,
  FileText,
  FolderOpen,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { usePortalData } from "../../hooks/usePortalData";
import { Programme, University } from "../../types/university";
import { assessEligibility } from "../../utils/eligibility";
import { UniversityExplorerMatcher } from "../../components/portal/UniversityExplorerMatcher";
import { getUniversityCampusImage, getUniversityLandmark } from "../../utils/universityImages";
import {
  StudentStatusBadge,
  StudentMetricCard,
  StudentEmptyState,
} from "../../components/portal/common";

const money = (value: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const programmesFor = (university: University) => university.programmes || [];

export const Cover: React.FC<{
  university?: University | { id?: string; name?: string; country?: string; coverImageUrl?: string };
  name?: string;
  className?: string;
}> = ({ university, name, className = "" }) => {
  const target = university || name || "";
  const imageUrl = getUniversityCampusImage(target);
  const altText =
    typeof university === "object" && university?.name
      ? university.name
      : name || "University campus";

  return (
    <img
      src={imageUrl}
      alt={`${altText} campus`}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = "/images/campus_uk.jpg";
      }}
      className={`object-cover ${className}`}
    />
  );
};

const EligibilityBadge: React.FC<{
  programme: Programme;
  student: ReturnType<typeof usePortalData>["ownStudent"];
}> = ({ programme, student }) => {
  const result = assessEligibility(student, programme);
  const style =
    result.status === "eligible"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
      : result.status === "not_eligible"
      ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
      : "bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30";
  const label =
    result.status === "eligible"
      ? "Meets requirements"
      : result.status === "not_eligible"
      ? "Needs improvement"
      : "Needs review";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style}`}>
      {label}
    </span>
  );
};

export const StudentDashboard: React.FC = () => {
  const { ownStudent, ownApplications, ownDocuments, ownTasks, ownInvoices, deleteDraftApplication } = usePortalData();
  const { universities } = useGlobalData();
  const navigate = useNavigate();

  const name = ownStudent?.fullName?.split(" ")[0] || "there";
  const completeness = ownStudent?.profileCompleteness || 0;

  const pendingInvoices = useMemo(() => {
    return (ownInvoices || []).filter((inv) => inv.status !== "Paid");
  }, [ownInvoices]);

  // Time-Aware Dynamic Greeting Engine
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Good morning, ${name}`,
        emoji: "🌅",
        subtitle: "Here's what's happening with your university applications today.",
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        greeting: `Good afternoon, ${name}`,
        emoji: "☀️",
        subtitle: "Track live admissions progress and complete your pending actions.",
      };
    }
    if (hour >= 17 && hour < 22) {
      return {
        greeting: `Good evening, ${name}`,
        emoji: "🌆",
        subtitle: "Review your admissions milestones, document status, and university offers.",
      };
    }
    return {
      greeting: `Good night, ${name}`,
      emoji: "🌙",
      subtitle: "Your applications are active. Review your progress or prepare for tomorrow.",
    };
  }, [name]);

  // Comprehensive KPI stats
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
    const actionRequired =
      pendingInvoices.length +
      ownDocuments.filter((d) => d.status === "Rejected" || d.status === "Pending").length +
      ownTasks.filter((t) => t.status !== "Completed").length;

    return { totalApps, underReview, offers, accepted, actionRequired };
  }, [ownApplications, pendingInvoices, ownDocuments, ownTasks]);

  // Highest priority offer application
  const topOfferApp = useMemo(() => {
    return ownApplications.find((app) =>
      ["Conditional Offer", "Unconditional Offer", "Approved", "CAS Issued"].includes(app.stage)
    );
  }, [ownApplications]);

  // Intelligent Next Action Engine
  const nextAction = useMemo(() => {
    const unpaidChallan = (ownInvoices || []).find((inv) => inv.status !== "Paid");
    if (unpaidChallan) {
      const targetApp = ownApplications.find((app) => app.id === unpaidChallan.applicationId) || ownApplications[0];
      if (targetApp) {
        return {
          badge: "ACTION REQUIRED · PAYMENT PENDING",
          badgeColor: "amber" as const,
          title: `Tuition Deposit Due: ${targetApp.universityName}`,
          text: `Official challan #${unpaidChallan.invoiceNumber} for ${unpaidChallan.currency} ${unpaidChallan.amount.toLocaleString()} is awaiting payment. Submit bank deposit proof to reserve your place.`,
          actionText: "Pay & Upload Proof",
          href: "/student/invoices",
          universityName: targetApp.universityName,
          universityId: targetApp.universityId,
          programmeName: targetApp.programmeName,
          type: "payment" as const,
        };
      }
    }

    if (topOfferApp) {
      return {
        badge: "OFFER RECEIVED · NEXT STEPS",
        badgeColor: "emerald" as const,
        title: `Official Offer: ${topOfferApp.universityName}`,
        text: `Congratulations! An admission offer has been released for ${topOfferApp.programmeName}. Review conditions and confirm your placement.`,
        actionText: "Review Offer",
        href: `/student/applications/${topOfferApp.id}`,
        universityName: topOfferApp.universityName,
        universityId: topOfferApp.universityId,
        programmeName: topOfferApp.programmeName,
        type: "offer" as const,
      };
    }

    const draftApp = ownApplications.find((app) => app.stage === "Draft");
    if (draftApp) {
      return {
        badge: "ACTION REQUIRED · DRAFT SAVED",
        badgeColor: "amber" as const,
        title: `Resume Application: ${draftApp.universityName}`,
        text: `You have an unsubmitted draft for ${draftApp.programmeName}. Complete remaining statements and submit your application.`,
        actionText: "Continue Application",
        href: `/student/new-application?universityId=${draftApp.universityId}&programmeId=${draftApp.programmeId}&applicationId=${draftApp.id}`,
        universityName: draftApp.universityName,
        universityId: draftApp.universityId,
        programmeName: draftApp.programmeName,
        type: "draft" as const,
      };
    }

    const docApp = ownApplications.find((app) =>
      ["Additional Info Requested", "Documents Pending"].includes(app.stage)
    );
    if (docApp) {
      return {
        badge: "DOCUMENTS REQUESTED",
        badgeColor: "rose" as const,
        title: `Document Request: ${docApp.universityName}`,
        text: `The admissions team for ${docApp.programmeName} requires additional academic materials to finalize evaluation.`,
        actionText: "Upload Documents",
        href: "/student/documents",
        universityName: docApp.universityName,
        universityId: docApp.universityId,
        programmeName: docApp.programmeName,
        type: "document" as const,
      };
    }

    const reviewApp = ownApplications.find((app) =>
      ["Submitted", "University Reviewing", "Initial Review", "Ready for Submission"].includes(app.stage)
    );
    if (reviewApp) {
      return {
        badge: "UNDER REVIEW · ADMISSIONS COMMITTEE",
        badgeColor: "sky" as const,
        title: `Evaluation In Progress: ${reviewApp.universityName}`,
        text: `Your dossier for ${reviewApp.programmeName} has been received and is under official evaluation. Track timeline and counselor updates.`,
        actionText: "Track Application",
        href: `/student/applications/${reviewApp.id}`,
        universityName: reviewApp.universityName,
        universityId: reviewApp.universityId,
        programmeName: reviewApp.programmeName,
        type: "review" as const,
      };
    }

    if (completeness < 80) {
      return {
        badge: "PROFILE SETUP",
        badgeColor: "indigo" as const,
        title: "Complete Your Academic Profile",
        text: `Your profile is ${completeness}% complete. Add your educational history and scores to unlock verified eligibility matching.`,
        actionText: "Complete Profile",
        href: "/student/profile",
        type: "profile" as const,
      };
    }

    return {
      badge: "DISCOVER PROGRAMS",
      badgeColor: "emerald" as const,
      title: "Explore Partnered Universities",
      text: "Explore global universities matching your academic grades, preferred intake, and budget.",
      actionText: "Explore Programs",
      href: "/student/programs",
      type: "explore" as const,
    };
  }, [ownApplications, ownInvoices, completeness, topOfferApp]);

  const active = ownApplications.filter((app) => !["Rejected", "Withdrawn", "Enrolled"].includes(app.stage));
  const verifiedDocCount = ownDocuments.filter((d) => d.status === "Verified").length;
  const totalUploadedDocs = ownDocuments.length;

  const upcomingDeadlines = useMemo(() => {
    const seen = new Set<string>();
    return ownApplications
      .filter((app) => {
        if (!app.intake) return false;
        const key = `${app.universityName}-${app.intake}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
  }, [ownApplications]);

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-12 font-sans animate-fade-in">
      {/* Modern Greeting & Profile Status Header */}
      <header className="rounded-3xl bg-surface border border-subtle px-6 py-6 shadow-sm sm:px-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                Student Admissions Command Center
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-primary font-heading">
              {timeGreeting.greeting} {timeGreeting.emoji}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-secondary">
              {timeGreeting.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/student/profile"
              className="flex items-center gap-3 bg-elevated/90 hover:bg-elevated px-4 py-2 rounded-2xl border border-subtle shadow-xs transition-colors group"
            >
              <div className="leading-tight text-left">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Profile Health</span>
                <span className="text-xs font-bold text-primary group-hover:text-emerald-400 transition-colors">
                  {completeness === 100 ? "Complete" : `${completeness}% Done`}
                </span>
              </div>
              <div className="w-20 h-2 bg-input rounded-full overflow-hidden border border-subtle/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </Link>

            {pendingInvoices.length > 0 && (
              <Link
                to="/student/invoices"
                className="flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3.5 py-2 rounded-2xl text-xs font-bold text-amber-500 dark:text-amber-300 transition-colors shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{pendingInvoices.length} Pending Challan{pendingInvoices.length > 1 ? "s" : ""}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 5-KPI Application Overview Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StudentMetricCard
          label="Applications"
          value={kpiStats.totalApps}
          icon={<FileText className="w-4 h-4" />}
          hint="Total dossiers"
          variant="default"
          onClick={() => navigate("/student/applications")}
        />
        <StudentMetricCard
          label="Under Review"
          value={kpiStats.underReview}
          icon={<Clock className="w-4 h-4" />}
          hint="Registry evaluation"
          variant="sky"
          onClick={() => navigate("/student/applications")}
        />
        <StudentMetricCard
          label="Offers"
          value={kpiStats.offers}
          icon={<Award className="w-4 h-4" />}
          hint={kpiStats.offers > 0 ? "Decision ready" : "Awaiting response"}
          variant="emerald"
          onClick={() => navigate("/student/applications")}
        />
        <StudentMetricCard
          label="Accepted"
          value={kpiStats.accepted}
          icon={<CheckCircle2 className="w-4 h-4" />}
          hint="Confirmed places"
          variant="default"
          onClick={() => navigate("/student/applications")}
        />
        <StudentMetricCard
          label="Action Required"
          value={kpiStats.actionRequired}
          icon={<AlertCircle className="w-4 h-4" />}
          hint={kpiStats.actionRequired > 0 ? "Pending steps" : "All up to date"}
          variant={kpiStats.actionRequired > 0 ? "amber" : "default"}
          onClick={() => navigate(nextAction.href)}
        />
      </section>

      {/* Prominent Offer Received Showcase (Rendered when offer exists) */}
      {topOfferApp && (
        <section className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-emerald-500/15 via-surface to-surface border border-emerald-500/40 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.08] dark:opacity-[0.15] pointer-events-none overflow-hidden">
            <img
              src={getUniversityCampusImage(topOfferApp.universityId || topOfferApp.universityName)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Offer Received</span>
                </span>
                <span className="text-xs text-secondary font-medium">
                  Application #{topOfferApp.applicationNumber || "APP-2026"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-primary leading-tight">
                {topOfferApp.universityName}
              </h2>
              <p className="text-xs sm:text-sm text-secondary max-w-xl">
                Official offer issued for <strong className="text-primary">{topOfferApp.programmeName}</strong> ({topOfferApp.intake || "Upcoming Intake"}). Review terms, complete conditions, and submit deposit to confirm your admission.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => navigate(`/student/applications/${topOfferApp.id}`)}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Review Offer Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid: Left Column (Action Required + Applications) & Right Column (Widgets) */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Action Required / Next Steps Card */}
          <div
            className={`rounded-3xl p-6 sm:p-7 shadow-sm border transition-all duration-300 relative overflow-hidden ${
              nextAction.badgeColor === "amber"
                ? "bg-gradient-to-br from-amber-500/10 via-surface to-surface border-amber-500/30"
                : nextAction.badgeColor === "emerald"
                ? "bg-gradient-to-br from-emerald-500/10 via-surface to-surface border-emerald-500/30"
                : nextAction.badgeColor === "sky"
                ? "bg-gradient-to-br from-sky-500/10 via-surface to-surface border-sky-500/30"
                : "bg-gradient-to-br from-indigo-500/10 via-surface to-surface border-indigo-500/30"
            }`}
          >
            {nextAction.universityName && (
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.06] dark:opacity-[0.10] pointer-events-none overflow-hidden">
                <img
                  src={getUniversityCampusImage(nextAction.universityId || nextAction.universityName)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 shadow-xs ${
                    nextAction.badgeColor === "amber"
                      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                      : nextAction.badgeColor === "emerald"
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                      : nextAction.badgeColor === "sky"
                      ? "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30"
                      : "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      nextAction.badgeColor === "amber"
                        ? "bg-amber-500 animate-ping"
                        : nextAction.badgeColor === "emerald"
                        ? "bg-emerald-500"
                        : "bg-sky-500 animate-pulse"
                    }`}
                  />
                  {nextAction.badge}
                </span>

                {nextAction.universityName && (
                  <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    {getUniversityLandmark(nextAction.universityId || nextAction.universityName)}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-primary font-heading leading-tight">
                  {nextAction.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-secondary leading-relaxed max-w-xl">
                  {nextAction.text}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={() => navigate(nextAction.href)}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                    nextAction.badgeColor === "amber"
                      ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
                      : nextAction.badgeColor === "emerald"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
                      : "bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-500/20"
                  }`}
                >
                  <span>{nextAction.actionText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {nextAction.universityName && (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface/80 backdrop-blur-sm border border-subtle">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-subtle shrink-0">
                      <img
                        src={getUniversityCampusImage(nextAction.universityId || nextAction.universityName)}
                        alt={nextAction.universityName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] leading-tight min-w-0">
                      <p className="font-bold text-primary truncate max-w-[160px]">
                        {nextAction.universityName}
                      </p>
                      <p className="text-muted truncate max-w-[160px]">
                        {nextAction.programmeName || "Degree Programme"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Applications List Section */}
          <div className="rounded-3xl bg-surface border border-subtle p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary font-heading">My Applications</h2>
                <p className="text-xs text-secondary">
                  Official university dossiers submitted or in draft
                </p>
              </div>
              <Link
                to="/student/applications"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View all ({ownApplications.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {active.slice(0, 4).map((application) => {
                const university = universities.find(
                  (item) =>
                    item.id === application.universityId ||
                    item.name.toLowerCase() === application.universityName?.toLowerCase()
                );
                const campusImage = getUniversityCampusImage(
                  university || application.universityName || application.universityId
                );
                const landmark = getUniversityLandmark(
                  application.universityId || application.universityName
                );
                const isDraft = application.stage === "Draft";
                const isOffer = [
                  "Conditional Offer",
                  "Unconditional Offer",
                  "CAS Issued",
                  "Deposit Pending",
                ].includes(application.stage);

                const progressPct =
                  application.stage === "Enrolled"
                    ? 100
                    : isOffer
                    ? 85
                    : application.stage.includes("Review") || application.stage === "Submitted"
                    ? 65
                    : isDraft
                    ? 25
                    : 50;

                const href = isDraft
                  ? `/student/new-application?universityId=${application.universityId}&programmeId=${application.programmeId}&applicationId=${application.id}`
                  : `/student/applications/${application.id}`;

                return (
                  <Link
                    key={application.id}
                    to={href}
                    className="block rounded-2xl bg-elevated/50 hover:bg-elevated border border-subtle hover:border-emerald-500/40 p-4 sm:p-5 transition-all duration-300 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Campus Photo + University Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-subtle shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={campusImage}
                            alt={`${application.universityName} campus`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = "/images/campus_uk.jpg";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                              {application.universityName}
                            </h3>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-surface border border-subtle text-muted">
                              #{application.applicationNumber || "APP-2026"}
                            </span>
                          </div>
                          <p className="text-xs text-secondary font-medium mt-0.5 truncate">
                            {application.programmeName}
                          </p>
                          <p className="text-[11px] text-muted flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{landmark}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Status Pill & Progress */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-subtle/50 gap-2">
                        <div className="flex items-center gap-2">
                          <StudentStatusBadge status={application.stage} size="md" />
                          {isDraft && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (window.confirm(`Delete draft application for ${application.universityName}?`)) {
                                  await deleteDraftApplication(application.id);
                                }
                              }}
                              className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
                            <span>Progress</span>
                            <span className="font-bold text-emerald-500 font-mono">{progressPct}%</span>
                          </div>
                          <p className="text-[11px] text-secondary font-medium">
                            {isDraft
                              ? "Continue draft →"
                              : isOffer
                              ? "Offer review required"
                              : "Under evaluation"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {active.length === 0 && (
                <StudentEmptyState
                  title="No active applications yet"
                  description="Explore top global universities matching your academic profile and start your direct application."
                  actionText="Explore Programs"
                  actionHref="/student/programs"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Upcoming Tasks & Deadlines Widget */}
          <div className="rounded-3xl bg-surface border border-subtle p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-primary font-heading text-base flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>Tasks & Deadlines</span>
                </h2>
                <p className="text-xs text-secondary">Approaching milestones</p>
              </div>
              <Link
                to="/student/tasks"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-2.5">
              {ownTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-elevated/40 border border-subtle/70 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-primary block truncate">{task.title}</span>
                    {task.dueDate && (
                      <span className="text-[10px] text-muted mt-0.5 block">Due: {task.dueDate}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      task.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}

              {upcomingDeadlines.map((app) => (
                <div
                  key={`dl-${app.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-elevated/40 border border-subtle/70 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-primary block truncate">{app.universityName}</span>
                    <span className="text-[10px] text-muted truncate block">{app.programmeName}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                    {app.intake}
                  </span>
                </div>
              ))}

              {ownTasks.length === 0 && upcomingDeadlines.length === 0 && (
                <p className="text-xs text-muted py-3 text-center">You're all caught up on tasks!</p>
              )}
            </div>
          </div>

          {/* Fee Challans & Invoices Widget */}
          <div className="rounded-3xl bg-surface border border-subtle p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-primary font-heading text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>Fee Challans</span>
                </h2>
                <p className="text-xs text-secondary">Tuition deposits and invoices</p>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  pendingInvoices.length > 0
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                }`}
              >
                {pendingInvoices.length > 0 ? `${pendingInvoices.length} Pending` : "All Settled"}
              </span>
            </div>

            <div className="space-y-2.5">
              {(ownInvoices || []).length === 0 ? (
                <div className="text-xs text-muted py-3 text-center bg-elevated/50 rounded-xl border border-subtle">
                  No fee invoices issued yet.
                </div>
              ) : (
                (ownInvoices || []).slice(0, 3).map((inv) => {
                  const isPaid = inv.status === "Paid";
                  const targetApp = ownApplications.find((a) => a.id === inv.applicationId);

                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-elevated/40 border border-subtle/70 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-primary">#{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-muted">({inv.type})</span>
                        </div>
                        {targetApp && (
                          <p className="text-[11px] font-semibold text-secondary truncate max-w-[140px]">
                            {targetApp.universityName}
                          </p>
                        )}
                        <p className="font-bold text-emerald-500 mt-0.5">
                          {inv.currency} {inv.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {inv.status}
                        </span>
                        <Link
                          to="/student/invoices"
                          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}

              <Link
                to="/student/invoices"
                className="pt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline block text-center"
              >
                View Invoices & Paid Challans →
              </Link>
            </div>
          </div>

          {/* Documents Vault Widget */}
          <div className="rounded-3xl bg-surface border border-subtle p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-primary font-heading text-base flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-500" />
                  <span>Document Vault</span>
                </h2>
                <p className="text-xs text-secondary">Verified credentials</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {verifiedDocCount} / {totalUploadedDocs} Verified
              </span>
            </div>

            <div className="space-y-2.5">
              {ownDocuments.length === 0 ? (
                <div className="text-xs text-muted py-3 text-center bg-elevated/50 rounded-xl border border-subtle">
                  No documents uploaded yet.
                </div>
              ) : (
                ownDocuments.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-elevated/40 border border-subtle/70 text-xs"
                  >
                    <span className="flex items-center gap-2 text-primary font-medium truncate max-w-[180px]">
                      {doc.status === "Verified" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : doc.status === "Rejected" ? (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate">{doc.documentType}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        doc.status === "Verified"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : doc.status === "Rejected"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))
              )}

              <Link
                to="/student/documents"
                className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline block text-center"
              >
                Open Document Vault →
              </Link>
            </div>
          </div>

          {/* Assigned Education Advisor Card */}
          <div className="rounded-3xl bg-surface border border-subtle p-6 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-zinc-950 font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                {ownStudent?.assignedCounsellorId ? "AC" : "EA"}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted uppercase tracking-wider font-bold">
                  Education Advisor
                </p>
                <p className="font-bold text-primary text-sm truncate">Admissions Advisory Desk</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online for guidance
                </p>
              </div>
            </div>
            <Link
              to="/student/messages"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </Link>
          </div>
        </div>
      </section>


      {/* Recommended Universities */}
      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-primary">Explore Universities</h2>
          <Link to="/student/universities" className="text-sm font-semibold text-emerald-500 hover:underline">View all</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {universities
            .filter(u => !ownStudent?.preferredDestination || u.country === ownStudent.preferredDestination)
            .slice(0, 3)
            .map(university => (
              <Link key={university.id} to={`/student/universities/${university.id}`} className="group block overflow-hidden rounded-2xl bg-surface shadow-sm border border-default hover:border-emerald-500/50 transition-all hover:shadow-md">
                <Cover university={university} className="h-40 w-full group-hover:scale-105 transition-transform duration-500" />
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">{university.country}</p>
                  <h3 className="mt-1 font-bold text-primary truncate">{university.name}</h3>
                  <p className="mt-1 text-sm text-secondary truncate">{university.city}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Recommended Programs */}
      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-primary">Recommended Programs</h2>
          <Link to="/student/programs" className="text-sm font-semibold text-emerald-500 hover:underline">View all matches</Link>
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
    <article className="rounded-2xl bg-surface p-5 shadow-sm border border-default hover:border-emerald-500/50 transition-colors flex flex-col h-full">
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">{programme.level}</p>
        <h3 className="mt-1 font-bold text-primary leading-snug">{programme.title}</h3>
        <p className="mt-2 text-sm text-secondary flex flex-wrap gap-x-4 gap-y-1">
          <span>{programme.durationMonths} months</span>
          <span>•</span>
          <span>{money(programme.tuitionFeeAnnual, programme.currency)} / year</span>
        </p>
      </div>
      <div className="mt-5 pt-4 border-t border-subtle flex items-center justify-between gap-2 flex-wrap">
        <EligibilityBadge programme={programme} student={ownStudent} />
        <div className="flex items-center gap-2">
          <Link to={`/student/programs/${university.id}-${programme.id}`} className="text-xs font-semibold text-secondary hover:text-primary px-3 py-1.5 rounded-lg bg-elevated border border-subtle transition-colors">
            Details
          </Link>
          <Link
            to={`/student/new-application?universityId=${university.id}&programmeId=${programme.id}`}
            className="text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Send className="w-3 h-3" /> Apply Now
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
