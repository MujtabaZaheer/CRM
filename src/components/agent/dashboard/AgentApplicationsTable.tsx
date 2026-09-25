import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronRight,
  GraduationCap,
  Building2,
  FileCheck,
  Award,
  X,
  ShieldCheck,
  TrendingUp,
  Download,
} from "lucide-react";
import { StudentDocument } from "../../../pages/Documents";
import { useNavigate } from "react-router-dom";

export interface AgentApplicationsTableProps {
  applications?: any[];
  documents?: StudentDocument[];
  onOpenWizard?: (appId?: string) => void;
  onRefresh?: () => void;
}

// Stage badge color resolver
export const getAgentStageBadge = (stage: string) => {
  const s = stage?.toLowerCase() || "";
  if (s.includes("enrolled") || s.includes("visa approved") || s.includes("visa granted")) {
    return {
      bg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
      dot: "bg-teal-400",
      label: stage,
    };
  }
  if (s.includes("unconditional") || s.includes("conditional offer") || s.includes("offer")) {
    return {
      bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400",
      label: stage,
    };
  }
  if (s.includes("cas") || s.includes("coe") || s.includes("deposit")) {
    return {
      bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      dot: "bg-indigo-400",
      label: stage,
    };
  }
  if (s.includes("draft")) {
    return {
      bg: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
      dot: "bg-zinc-400",
      label: "Intake Draft",
    };
  }
  if (s.includes("initial review") || s.includes("vetting") || s.includes("pending_triage")) {
    return {
      bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      dot: "bg-amber-400 animate-pulse",
      label: "Initial Review",
    };
  }
  if (s.includes("rejected") || s.includes("withdrawn")) {
    return {
      bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      dot: "bg-rose-400",
      label: stage,
    };
  }
  return {
    bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    label: stage || "In Progress",
  };
};

export const AgentApplicationsTable: React.FC<AgentApplicationsTableProps> = ({
  applications = [],
  documents = [],
  onOpenWizard,
}) => {
  const navigate = useNavigate();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Group applications and compute stats
  const stats = useMemo(() => {
    let total = applications.length;
    let drafts = 0;
    let inReview = 0;
    let offers = 0;
    let enrolled = 0;
    let totalCommission = 0;

    applications.forEach((app) => {
      const s = (app.stage || app.status || "").toLowerCase();
      if (s.includes("draft")) drafts++;
      else if (s.includes("initial") || s.includes("review") || s.includes("submission") || s.includes("submitted")) inReview++;
      if (s.includes("offer")) offers++;
      if (s.includes("enrolled") || s.includes("visa approved")) enrolled++;

      // Commission calculation
      const commAmount = Number(app.commissionAmount) || 850;
      totalCommission += commAmount;
    });

    return { total, drafts, inReview, offers, enrolled, totalCommission };
  }, [applications]);

  // Mandatory docs checklist required for standard admission
  const mandatoryDocTypes = [
    "Passport",
    "Academic Transcripts",
    "Degree Certificate",
    "English Proficiency",
    "Statement of Purpose (SOP)",
    "Letter of Recommendation (LOR)",
    "CV / Resume",
  ];

  // Helper to count documents for an application/student
  const getAppDocStats = (app: any) => {
    // Check if app has embedded documents or query from documents array
    const appDocs = (app.documents && Array.isArray(app.documents) && app.documents.length > 0)
      ? app.documents
      : documents.filter((d: any) => d.studentId === app.studentId || d.applicationId === app.id);

    const totalUploaded = appDocs.length;
    const requiredCount = 6;
    const isComplete = totalUploaded >= requiredCount;
    const verifiedCount = appDocs.filter((d: any) => d.verificationStatus === "verified" || d.status === "Verified").length;

    return {
      uploaded: totalUploaded,
      required: requiredCount,
      isComplete,
      verified: verifiedCount,
      docs: appDocs,
    };
  };

  // Filtered applications list
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Stage Filter
      const s = (app.stage || app.status || "").toLowerCase();
      if (stageFilter === "DRAFT" && !s.includes("draft")) return false;
      if (stageFilter === "REVIEW" && !s.includes("review") && !s.includes("submitted") && !s.includes("submission")) return false;
      if (stageFilter === "OFFERS" && !s.includes("offer")) return false;
      if (stageFilter === "ENROLLED" && !s.includes("enrolled") && !s.includes("visa")) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (app.studentName || app.name || "").toLowerCase().includes(q);
        const matchesEmail = (app.studentEmail || app.email || "").toLowerCase().includes(q);
        const matchesUni = (app.universityName || "").toLowerCase().includes(q);
        const matchesProg = (app.programName || "").toLowerCase().includes(q);
        const matchesId = (app.id || app.trackingCode || "").toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesUni || matchesProg || matchesId;
      }

      return true;
    });
  }, [applications, stageFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Referred</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">{stats.total}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{stats.drafts} Drafts</span>
            <span>•</span>
            <span className="text-blue-400 font-semibold">{stats.inReview} In Pipeline</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Confirmed Offers</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">{stats.offers}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
            <span className="text-amber-400 font-semibold">Conditional & Direct</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Visa & Enrolled</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">{stats.enrolled}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
            <span className="text-teal-400 font-semibold">Ready for Payout</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Est. Commissions</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-400 font-mono">
            ${stats.totalCommission.toLocaleString()} <span className="text-xs text-[var(--text-muted)] font-normal">USD</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Eligible partner commission</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, email, university or reference..."
            className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All Referrals" },
            { id: "DRAFT", label: "Drafts" },
            { id: "REVIEW", label: "Under Review" },
            { id: "OFFERS", label: "Offers" },
            { id: "ENROLLED", label: "Enrolled" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStageFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                stageFilter === pill.id
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                  : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)]"
              }`}
            >
              {pill.label}
            </button>
          ))}

          <button
            onClick={() => {
              if (onOpenWizard) onOpenWizard();
              else navigate("/agent/refer-lead");
            }}
            className="ml-2 flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Student Referral</span>
          </button>
        </div>
      </div>

      {/* APPLICATIONS TABLE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-[var(--text-primary)]">
              Referred Candidates Roster
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {filteredApps.length} Records
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] hidden sm:block">
            Section 3.14 & 3.15 CRM Admission Dossier Tracking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Student Name & ID</th>
                <th className="p-3.5">Target University & Program</th>
                <th className="p-3.5">Intake</th>
                <th className="p-3.5">Pipeline Stage</th>
                <th className="p-3.5">Document Dossier</th>
                <th className="p-3.5">Commission</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-xs">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[var(--text-muted)]">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
                    <p className="font-semibold text-sm text-[var(--text-secondary)]">No student referrals found</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {searchQuery ? "Try refining your search terms or filter." : "Start referring students using our admission intake wizard."}
                    </p>
                    <button
                      onClick={() => {
                        if (onOpenWizard) onOpenWizard();
                        else navigate("/agent/refer-lead");
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Refer First Student
                    </button>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app, idx) => {
                  const sBadge = getAgentStageBadge(app.stage || app.status || "Draft");
                  const docStats = getAppDocStats(app);
                  const isDraft = (app.stage || app.status || "").toLowerCase().includes("draft");
                  const commVal = Number(app.commissionAmount) || 850;

                  return (
                    <tr key={app.id || idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                      {/* 1. Student Name & ID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                            {(app.studentName || app.name || "ST").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                              {app.studentName || app.name || "Applicant"}
                              {app.isLive && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Live
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              {app.id || app.studentId || app.trackingCode || `REF-${idx + 100}`}
                            </div>
                            <div className="text-[10px] text-[var(--text-secondary)]">
                              {app.studentEmail || app.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Target University & Program */}
                      <td className="p-3.5">
                        <div className="font-semibold text-[var(--text-primary)] line-clamp-1">
                          {app.programName || app.preferredProgram || "Degree Programme"}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="line-clamp-1">{app.universityName || app.preferredUniversity || "Target University"}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {app.country || "United Kingdom"}
                        </div>
                      </td>

                      {/* 3. Intake */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 font-medium">
                          {app.intake || "Sep/Oct 2026"}
                        </span>
                      </td>

                      {/* 4. Pipeline Stage Badge */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${sBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sBadge.dot}`} />
                          {sBadge.label}
                        </span>
                      </td>

                      {/* 5. Document Dossier Stats */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[var(--text-secondary)]">
                              {docStats.uploaded}/{docStats.required} Files
                            </span>
                            {docStats.isComplete ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Complete
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                <AlertCircle className="w-3 h-3" /> {docStats.required - docStats.uploaded} Missing
                              </span>
                            )}
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-24 h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                docStats.isComplete ? "bg-emerald-500" : "bg-amber-400"
                              }`}
                              style={{ width: `${Math.min(100, (docStats.uploaded / docStats.required) * 100)}%` }}
                            />
                          </div>

                          <div className="text-[10px] text-[var(--text-muted)]">
                            {docStats.verified} verified
                          </div>
                        </div>
                      </td>

                      {/* 6. Commission */}
                      <td className="p-3.5">
                        <div className="font-bold text-sm text-emerald-400 font-mono">
                          ${commVal.toLocaleString()} USD
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {app.commissionStatus || "Eligible"}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft ? (
                            <button
                              onClick={() => {
                                if (onOpenWizard) onOpenWizard(app.id);
                                else navigate("/agent/refer-lead");
                              }}
                              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Continue Intake Wizard"
                            >
                              <span>Continue</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="px-2.5 py-1 bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Inspect Admission Dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Dossier</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMISSION DOSSIER PREVIEW DRAWER / MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--border-default)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Admission Dossier
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Ref ID: {selectedApp.id || selectedApp.studentId || "APP-REF"}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">
                  {selectedApp.studentName || selectedApp.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedApp.programName} • {selectedApp.universityName}
                </p>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Current Stage</div>
                <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${getAgentStageBadge(selectedApp.stage || selectedApp.status).dot}`} />
                  {selectedApp.stage || selectedApp.status || "Initial Review"}
                </div>
              </div>

              <div className="p-3.5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Target Intake</div>
                <div className="font-bold text-xs text-[var(--text-primary)]">
                  {selectedApp.intake || "Sep/Oct 2026"}
                </div>
              </div>

              <div className="p-3.5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Commission Value</div>
                <div className="font-bold text-xs text-emerald-400 font-mono">
                  ${(Number(selectedApp.commissionAmount) || 850).toLocaleString()} USD ({selectedApp.commissionStatus || "Eligible"})
                </div>
              </div>
            </div>

            {/* Documents Checklist Vault */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Compliance & Academic Documents Vault</span>
                </h4>
                <span className="text-xs text-[var(--text-muted)]">
                  Verified by Admissions Desk
                </span>
              </div>

              <div className="bg-[var(--bg-input)] rounded-2xl border border-[var(--border-default)] overflow-hidden divide-y divide-[var(--border-default)]">
                {mandatoryDocTypes.map((docType) => {
                  const matchingDoc = documents.find(
                    (d: any) =>
                      (d.studentId === selectedApp.studentId || d.applicationId === selectedApp.id) &&
                      ((d.docType || d.type || "") as string).toLowerCase().includes(docType.toLowerCase().slice(0, 4))
                  );

                  return (
                    <div key={docType} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{docType}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {matchingDoc?.fileName || "Uploaded during intake wizard"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {matchingDoc ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Attached
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Available in Archive
                          </span>
                        )}

                        {matchingDoc?.fileUrl && (
                          <a
                            href={matchingDoc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit / Timeline Notes */}
            <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-default)] space-y-2">
              <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Application History & Audit Trail</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Referred by verified external partner agency. Intake record created and indexed with agency attribution. Automatic admissions queue gating active until primary triage completes.
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-5 py-2 bg-[var(--bg-input)] hover:bg-[var(--border-default)] text-[var(--text-primary)] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
