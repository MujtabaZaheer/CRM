import React from "react";
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
} from "lucide-react";

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
  const { ownApplications } = usePortalData();

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

      {/* Applications Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {ownApplications.map((app) => {
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

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold border shrink-0 ${getStageBadgeStyle(
                      app.stage
                    )}`}
                  >
                    {app.stage}
                  </span>
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

                <p className="text-xs text-[var(--text-muted)]">
                  {app.nextAction ||
                    (isApproved
                      ? "Next Step: Accept offer and verify fee deposit."
                      : app.stage === "Draft"
                      ? "Draft in progress — click below to continue."
                      : "Your application is undergoing active internal review.")}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Last updated:{" "}
                  {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : "Recently"}
                </span>

                <Link
                  to={`/student/applications/${app.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {app.stage === "Draft" ? "Continue Draft →" : "View Details & Timeline →"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

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
  const { ownApplications, ownDocuments } = usePortalData();
  const { universities } = useGlobalData();

  const app = ownApplications.find((item) => item.id === applicationId);

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

  const university = universities.find((item) => item.id === app.universityId);
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

      {/* Header Banner */}
      <header className="overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-8 relative shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-emerald-400 tracking-wider">
              {app.applicationNumber}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text-primary)] mt-1">
              {app.universityName}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {app.programmeName} · {app.intake}
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
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed / Approved Status
              </span>
            )}
          </div>
        </div>
      </header>

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
          {app.nextAction ||
            (isApproved
              ? "Your offer is active. Please review your conditional requirements (if any) and proceed with CAS issuance."
              : "Your application is currently being reviewed by our admissions panel and the institution's registry.")}
        </p>
      </section>

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
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Open Document Vault →
          </Link>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          {ownDocuments.length} document record(s) attached to your applicant profile.
        </p>

        {university?.coverImageUrl && (
          <img
            className="mt-4 h-32 w-full max-w-sm rounded-xl object-cover border border-[var(--border-default)]"
            src={university.coverImageUrl}
            alt={university.name}
          />
        )}
      </section>
    </div>
  );
};
