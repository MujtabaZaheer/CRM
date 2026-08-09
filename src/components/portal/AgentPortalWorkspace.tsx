import React, { useState } from "react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Users2, DollarSign, Send, CheckCircle2, Search, Link2, Sparkles, FileText } from "lucide-react";

export type AgentSubPage = "dashboard" | "referrals" | "refer-lead" | "commissions" | "notifications";

export const AgentPortalWorkspace: React.FC<{ page: AgentSubPage }> = ({ page }) => {
  const { leads, applications } = useGlobalData();
  const { appUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [copyNotice, setCopyNotice] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadProgram, setLeadProgram] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const referralLink = `https://education-crm-9fee2.web.app/register?ref=${appUser?.uid || "agent123"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 3000);
  };

  const handleReferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;
    setFormSuccess(`Referral for ${leadName} submitted successfully! Assigned tracking ID REF-${Date.now().toString().slice(-4)}.`);
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadProgram("");
  };

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <Users2 className="w-6 h-6 text-emerald-400" />
            External Agent Portal — {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Submit student referrals, monitor application milestones, and track referral commissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg hover:bg-emerald-500/20 transition-all"
          >
            <Link2 className="w-4 h-4" />
            {copyNotice ? "Tracking Link Copied!" : "Copy Referral Link"}
          </button>
        </div>
      </div>

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Referred Students</span>
                <Users2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{leads.length || 12}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">+3 this month</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Active Applications</span>
                <FileText className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{applications.length || 8}</p>
              <span className="text-[10px] text-[var(--text-muted)]">5 Unconditional Offers</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Earned Commission</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">$4,850 USD</p>
              <span className="text-[10px] text-[var(--text-muted)]">2 Approved Payouts</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Enrolment Conversion</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">68%</p>
              <span className="text-[10px] text-emerald-400">High Performing Agent</span>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-sm text-[var(--text-primary)]">Your Referral Tracking Link</h2>
            <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg font-mono text-emerald-400 flex items-center justify-between">
              <span className="truncate">{referralLink}</span>
              <button onClick={handleCopyLink} className="px-3 py-1 bg-emerald-500 text-zinc-950 font-bold rounded text-xs ml-2">
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFERRALS LIST PAGE */}
      {page === "referrals" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search referred students by name, email..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Email / Contact</th>
                  <th className="p-3">Intended Program</th>
                  <th className="p-3">Application Stage</th>
                  <th className="p-3">Est. Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {leads.slice(0, 10).map((l, i) => (
                  <tr key={l.id || i} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-bold text-[var(--text-primary)]">{l.fullName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{l.email}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{l.programInterest || "MSc Data Science"}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold rounded">
                        {l.stage}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">$650 USD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REFER NEW LEAD FORM PAGE */}
      {page === "refer-lead" && (
        <div className="max-w-xl p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">Submit New Student Referral</h2>
          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {formSuccess}
            </div>
          )}
          <form onSubmit={handleReferSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Student Full Name *</label>
              <input
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Student Email *</label>
              <input
                required
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Phone Number</label>
              <input
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="+44 7123 456789"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Intended Study Program</label>
              <input
                value={leadProgram}
                onChange={(e) => setLeadProgram(e.target.value)}
                placeholder="e.g. MBA International Business"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg flex items-center gap-2">
              <Send className="w-4 h-4" /> Submit Referral
            </button>
          </form>
        </div>
      )}

      {/* COMMISSIONS LEDGER PAGE */}
      {page === "commissions" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">Agent Commission Ledger</h2>
          <p className="text-[var(--text-secondary)]">Track referral payouts and eligibility statuses.</p>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">Agent Portal Alerts</h2>
          <p className="text-[var(--text-secondary)]">Notifications regarding offer issuances and commission releases.</p>
        </div>
      )}
    </div>
  );
};
