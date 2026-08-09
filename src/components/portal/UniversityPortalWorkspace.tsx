import React, { useState } from "react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { Building2, CheckCircle2, FileText, Search, Award, ShieldCheck } from "lucide-react";

export type UniversitySubPage = "dashboard" | "applications" | "decisions" | "cas-issuance" | "notifications";

export const UniversityPortalWorkspace: React.FC<{ page: UniversitySubPage }> = ({ page }) => {
  const { applications } = useGlobalData();
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");

  const filteredApps = applications.filter((a) =>
    `${a.studentName} ${a.programmeName} ${a.stage}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDecision = (appId: string, decision: "Conditional Offer" | "Unconditional Offer" | "Rejected") => {
    setNotice(`Application ${appId} status updated to: ${decision}`);
  };

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            University Partner Portal — {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Direct university portal to inspect student application submissions, issue official offer letters, and submit CAS/COE reference numbers.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Submitted Applications</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{applications.length || 15}</p>
              <span className="text-[10px] text-emerald-400">Direct Intake Applications</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Offers Issued</span>
                <Award className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">9 Offers</p>
              <span className="text-[10px] text-[var(--text-muted)]">6 Unconditional / 3 Conditional</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>CAS / COE Released</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">4 Released</p>
              <span className="text-[10px] text-emerald-400">Visa Ready</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Avg Decision Time</span>
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">2.4 Days</p>
              <span className="text-[10px] text-emerald-400">Fast-Track Partner</span>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS LIST PAGE */}
      {page === "applications" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search submitted applications..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Applied Programme</th>
                  <th className="p-3">Intake</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Admissions Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredApps.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-bold text-[var(--text-primary)]">{a.studentName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{a.programmeName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{a.intake}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold rounded">
                        {a.stage}
                      </span>
                    </td>
                    <td className="p-3 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => handleDecision(a.id, "Unconditional Offer")}
                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded hover:bg-emerald-500/20"
                      >
                        Issue Offer
                      </button>
                      <button
                        onClick={() => handleDecision(a.id, "Rejected")}
                        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded hover:bg-rose-500/20"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAS ISSUANCE PAGE */}
      {page === "cas-issuance" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">CAS / COE Reference Release Desk</h2>
          <p className="text-[var(--text-secondary)]">Upload official CAS reference documents directly to agency students.</p>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">University Portal Alerts</h2>
          <p className="text-[var(--text-secondary)]">Notifications regarding new student applications and document uploads.</p>
        </div>
      )}
    </div>
  );
};
