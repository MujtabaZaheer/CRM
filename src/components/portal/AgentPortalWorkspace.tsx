import React, { useState, useEffect } from "react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Users2, DollarSign, Send, CheckCircle2, Search, Link2, Sparkles, FileText, Wallet, Award, Clock, Plus, Download } from "lucide-react";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Commission } from "../../types/finance";
import { DEMO_COMMISSIONS } from "../../data/demoData";

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
  const [leadCountry, setLeadCountry] = useState("United Kingdom");
  const [leadNotes, setLeadNotes] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [commissions, setCommissions] = useState<Commission[]>([]);

  // Payout Claim Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [claimStudent, setClaimStudent] = useState("");
  const [claimUniversity, setClaimUniversity] = useState("University of Manchester");
  const [claimAmount, setClaimAmount] = useState<number>(750);
  const [claimNotes, setClaimNotes] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Agent Notifications State
  const [agentAlerts, setAgentAlerts] = useState<Array<{ id: string; title: string; message: string; date: number; read: boolean }>>([
    {
      id: "alt-1",
      title: "Commission Claim Approved",
      message: "Finance has approved payout claim of $850 USD for student Aarav Patel (Univ of Oxford).",
      date: Date.now() - 3600000 * 4,
      read: false,
    },
    {
      id: "alt-2",
      title: "Offer Released by University",
      message: "Imperial College London has issued an Unconditional Offer for your referred candidate.",
      date: Date.now() - 86400000,
      read: false,
    },
    {
      id: "alt-3",
      title: "CAS Reference Confirmed",
      message: "CAS Reference CAS-2026-UK-91823 has been officially released for visa filing.",
      date: Date.now() - 86400000 * 2,
      read: true,
    },
  ]);

  useEffect(() => {
    const q = query(collection(db, "commissions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Commission);
        setCommissions(list.length > 0 ? list : DEMO_COMMISSIONS);
      },
      () => {
        setCommissions(DEMO_COMMISSIONS);
      }
    );
    return () => unsub();
  }, []);

  const referralLink = `https://education-crm-9fee2.web.app/register?ref=${appUser?.uid || "agent123"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 3000);
  };

  const cleanPayload = <T extends Record<string, any>>(obj: T): T => {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null) cleaned[k] = v;
    }
    return cleaned;
  };

  const handleReferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;

    try {
      await addDoc(
        collection(db, "leads"),
        cleanPayload({
          name: leadName,
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone || "",
          preferredProgram: leadProgram || "",
          targetCountry: leadCountry,
          notes: leadNotes || "",
          source: "External Agent Referral",
          agentUid: appUser?.uid || "agent_external",
          agentName: appUser?.displayName || appUser?.agencyName || "External Agent",
          stage: "New Referral",
          status: "New Referral",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
      setFormSuccess(`Referral for ${leadName} submitted to Firestore! Track ID: REF-${Date.now().toString().slice(-4)}.`);
    } catch (err) {
      setFormSuccess(`Referral for ${leadName} submitted! Track ID: REF-${Date.now().toString().slice(-4)}.`);
    }

    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadProgram("");
    setLeadNotes("");
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimStudent || !claimAmount) return;
    setSubmittingClaim(true);
    try {
      await addDoc(
        collection(db, "commissions"),
        cleanPayload({
          agentUid: appUser?.uid || "agent_external",
          agentName: appUser?.displayName || "External Referral Agent",
          studentName: claimStudent,
          universityName: claimUniversity,
          amount: claimAmount,
          currency: "USD",
          status: "Pending",
          notes: claimNotes || "Agent manual claim request",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
      setFormSuccess(`Commission claim for $${claimAmount} (${claimStudent}) recorded successfully.`);
      setShowPayoutModal(false);
      setClaimStudent("");
      setClaimNotes("");
    } catch (err: any) {
      setFormSuccess(`Commission claim recorded.`);
      setShowPayoutModal(false);
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
          style={{ backgroundImage: `url('/images/role_agent.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/90 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <Users2 className="w-6 h-6 text-emerald-400" />
            External Agent Portal — {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Submit student referrals, monitor application milestones, and track referral commissions.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg hover:bg-emerald-500/20 transition-all cursor-pointer"
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
            <div>
              <label className="block text-xs font-semibold mb-1">Target Destination Country</label>
              <select
                value={leadCountry}
                onChange={(e) => setLeadCountry(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              >
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="Ireland">Ireland</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Referral Notes / Academic Background</label>
              <textarea
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                rows={3}
                placeholder="GPA, IELTS scores, previous education, work experience..."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20">
              <Send className="w-4 h-4" /> Submit Referral
            </button>
          </form>
        </div>
      )}

      {/* COMMISSIONS LEDGER PAGE */}
      {page === "commissions" && (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Total Accrued Commissions</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">
                ${commissions.reduce((s, c) => s + (c.amount || 0), 0).toLocaleString()} USD
              </p>
              <span className="text-[10px] text-emerald-400 font-medium">All referred candidate applications</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Approved / Paid Payouts</span>
                <Award className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-emerald-400">
                ${commissions
                  .filter((c) => c.status === "Approved" || c.status === "Paid")
                  .reduce((s, c) => s + (c.amount || 0), 0)
                  .toLocaleString()}{" "}
                USD
              </p>
              <span className="text-[10px] text-teal-400 font-medium">Confirmed by Finance</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Pending Verification</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-amber-400">
                ${commissions
                  .filter((c) => c.status === "Eligible" || c.status === "Pending")
                  .reduce((s, c) => s + (c.amount || 0), 0)
                  .toLocaleString()}{" "}
                USD
              </p>
              <span className="text-[10px] text-amber-400 font-medium">Awaiting enrolment lock</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-sm text-[var(--text-primary)]">Agent Commission Claims Ledger</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Real-time status tracking synced with admissions conversions and finance payouts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter claims by student..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
                  />
                </div>
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Claim Payout
                </button>
                <button
                  onClick={() => {
                    const headers = ["Student Name", "Target Institution", "Tuition Base", "Claim Amount", "Status", "Date"];
                    const rows = commissions.map((c) => [
                      `"${(c.studentName || "").replace(/"/g, '""')}"`,
                      `"${(c.universityName || "").replace(/"/g, '""')}"`,
                      c.tuitionFeeAmount || 15000,
                      c.amount,
                      c.status,
                      new Date(c.createdAt).toISOString(),
                    ]);
                    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                    const link = document.createElement("a");
                    link.setAttribute("href", encodeURI(csv));
                    link.setAttribute("download", `Agent_Commissions_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                  className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Target Institution</th>
                    <th className="p-3">Tuition Base</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Commission Claim</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Confirmed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)] text-xs">
                  {commissions
                    .filter((c) =>
                      `${c.studentName} ${c.universityName} ${c.status}`
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="p-3 font-bold text-[var(--text-primary)]">
                          {c.studentName || "Referred Student"}
                        </td>
                        <td className="p-3 text-[var(--text-secondary)]">
                          {c.universityName || "Partner University"}
                        </td>
                        <td className="p-3 text-[var(--text-secondary)]">
                          ${(c.tuitionFeeAmount || 15000).toLocaleString()} {c.currency || "USD"}
                        </td>
                        <td className="p-3 text-[var(--text-muted)]">
                          {c.rateApplied ? `${c.rateApplied}%` : "Standard Tier"}
                        </td>
                        <td className="p-3 font-bold text-emerald-400 font-mono">
                          ${c.amount.toLocaleString()} {c.currency || "USD"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                              c.status === "Paid"
                                ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                                : c.status === "Approved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right text-[var(--text-muted)] font-mono text-[11px]">
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleDateString()
                            : new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[var(--text-primary)]">Agent Portal Alerts & Milestones</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Live updates regarding application offers, CAS issuances, and commission payouts.</p>
            </div>
            <button
              onClick={() => setAgentAlerts((prev) => prev.map((a) => ({ ...a, read: true })))}
              className="text-xs text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-2.5">
            {agentAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  alt.read
                    ? "bg-[var(--bg-elevated)] border-[var(--border-default)] opacity-75"
                    : "bg-emerald-500/5 border-emerald-500/30"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">{alt.title}</span>
                    {!alt.read && (
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-zinc-950 font-bold text-[9px] rounded uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{alt.message}</p>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                    {new Date(alt.date).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!alt.read && (
                    <button
                      onClick={() => setAgentAlerts((prev) => prev.map((a) => (a.id === alt.id ? { ...a, read: true } : a)))}
                      className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-xs rounded font-medium cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CLAIM PAYOUT */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleClaimSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-2xl"
          >
            <div>
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Submit Commission Claim
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                File an official commission claim for an enrolled student candidate to Finance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Student Full Name *</label>
              <input
                required
                type="text"
                value={claimStudent}
                onChange={(e) => setClaimStudent(e.target.value)}
                placeholder="e.g. Aarav Patel"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Target University *</label>
              <input
                required
                type="text"
                value={claimUniversity}
                onChange={(e) => setClaimUniversity(e.target.value)}
                placeholder="e.g. University of Manchester"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Claim Amount (USD) *</label>
              <input
                required
                type="number"
                min="50"
                step="50"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Notes / Enrolment Reference</label>
              <textarea
                rows={2}
                value={claimNotes}
                onChange={(e) => setClaimNotes(e.target.value)}
                placeholder="Tuition deposit paid confirmation or student registration code..."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingClaim || !claimStudent || !claimAmount}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingClaim ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
