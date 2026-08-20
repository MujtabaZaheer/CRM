import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Commission, CommissionStatus } from "../types/finance";
import { processPayoutBatch, DEFAULT_COMMISSION_TIERS } from "../utils/commissionEngine";
import { CircleDollarSign, CheckCircle2, Download, DollarSign, Wallet, ArrowUpRight } from "lucide-react";

export const CommissionManagerPage: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "commissions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Commission);
        setCommissions(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const totalAccrued = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalEligible = commissions.filter((c) => c.status === "Eligible" || c.status === "Approved").reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaid = commissions.filter((c) => c.status === "Paid").reduce((sum, c) => sum + (c.amount || 0), 0);

  const handleStatusChange = async (id: string, status: CommissionStatus) => {
    try {
      await updateDoc(doc(db, "commissions", id), {
        status,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn("Failed to update status:", err);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = commissions.filter((c) => c.status === "Eligible" || c.status === "Approved").map((c) => c.id);
    setSelectedIds(eligibleIds);
  };

  const handleRunBatchPayout = async () => {
    if (selectedIds.length === 0) return;
    setProcessingPayout(true);
    setNotice(null);
    try {
      const res = await processPayoutBatch(selectedIds);
      setNotice(`Successfully processed payout batch #${res.batchId.slice(-6)} ($${res.totalPaid.toLocaleString()} across ${res.count} claims)!`);
      setSelectedIds([]);
    } catch (err: any) {
      setNotice("Batch payout error: " + err.message);
    } finally {
      setProcessingPayout(false);
    }
  };

  const exportCSV = () => {
    if (commissions.length === 0) return;
    const headers = ["ID", "Agent Name", "Counsellor", "Student Name", "University", "Tuition Fee", "Rate Applied", "Amount", "Currency", "Status", "Date"];
    const rows = commissions.map((c) => [
      c.id,
      `"${c.agentName}"`,
      `"${c.counsellorName || ""}"`,
      `"${c.studentName || ""}"`,
      `"${c.universityName || ""}"`,
      c.tuitionFeeAmount || 0,
      `${c.rateApplied || 0}%`,
      c.amount,
      c.currency,
      c.status,
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Commission_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const filtered = commissions.filter((c) => {
    if (statusFilter === "All") return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <CircleDollarSign className="w-7 h-7 text-emerald-400" />
            <span>Partner Commission & Revenue Share</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manage agency contracts, track enrollment commissions, and execute payout disbursements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-[var(--border-color)] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Ledger</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={handleRunBatchPayout}
              disabled={processingPayout}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              <span>{processingPayout ? "Disbursing..." : `Disburse Payout (${selectedIds.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="underline text-[10px]">Dismiss</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Total Accrued</span>
          <span className="text-2xl font-extrabold font-heading text-[var(--text-primary)] mt-1 block">
            ${totalAccrued.toLocaleString()}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] mt-1 flex items-center space-x-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>All lifetime enrollments</span>
          </span>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Pending / Eligible Payouts</span>
          <span className="text-2xl font-extrabold font-heading text-amber-400 mt-1 block">
            ${totalEligible.toLocaleString()}
          </span>
          <button
            onClick={handleSelectAllEligible}
            className="text-[10px] text-emerald-400 hover:underline mt-1 font-semibold flex items-center space-x-1"
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>Select all for payout</span>
          </button>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Total Disbursed</span>
          <span className="text-2xl font-extrabold font-heading text-emerald-400 mt-1 block">
            ${totalPaid.toLocaleString()}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] mt-1 block font-mono">
            {commissions.filter((c) => c.status === "Paid").length} claims settled
          </span>
        </div>
      </div>

      {/* Commission Rate Tier Matrix */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-3">
        <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Standard Partner Revenue Share Tiers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(DEFAULT_COMMISSION_TIERS).map(([tier, rate]) => (
            <div key={tier} className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] text-center">
              <span className="text-xs font-bold text-emerald-400">{tier} Tier</span>
              <span className="text-lg font-bold font-mono text-[var(--text-primary)] block mt-0.5">{rate}%</span>
              <span className="text-[10px] text-[var(--text-secondary)]">of 1st Year Tuition</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {["All", "Eligible", "Approved", "Paid", "Pending", "Disputed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              statusFilter === tab
                ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-zinc-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center">Select</th>
                <th className="px-4 py-3">Partner / Agent</th>
                <th className="px-4 py-3">Student & University</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Commission Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                    Loading commission ledger records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                    No commission claims found matching status "{statusFilter}".
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isPaid = c.status === "Paid";

                  return (
                    <tr key={c.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPaid}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.id)}
                          className="rounded border-[var(--border-color)] text-emerald-500 focus:ring-emerald-500 disabled:opacity-30"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        <div>
                          <span>{c.agentName}</span>
                          {c.counsellorName && (
                            <span className="text-[10px] text-[var(--text-muted)] block font-normal">
                              Counsellor: {c.counsellorName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-bold text-[var(--text-primary)] block">{c.studentName || "Enrolled Student"}</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">{c.universityName || "Partner University"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-emerald-400">
                        {c.rateApplied ? `${c.rateApplied}%` : "Standard"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)]">
                        ${c.amount.toLocaleString()} {c.currency}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "Paid" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          c.status === "Approved" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                          c.status === "Eligible" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value as CommissionStatus)}
                          className="px-2 py-1 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none"
                        >
                          <option value="Eligible">Eligible</option>
                          <option value="Approved">Approved</option>
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Disputed">Disputed</option>
                          <option value="Reversed">Reversed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
