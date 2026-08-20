import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { Users2, Plus, Percent, CheckCircle2, ShieldCheck, Mail, MapPin, X } from "lucide-react";

export interface SubAgent {
  id: string;
  parentAgentId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  commissionSplitPercentage: number; // e.g. 70% to sub-agent, 30% to master agency
  status: "Active" | "Pending" | "Suspended";
  studentsReferredCount: number;
  totalRevenueGeneratedUSD: number;
  createdAt: number;
}

export const AgentSubAgentManager: React.FC = () => {
  const { appUser } = useAuth();
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [splitPercent, setSplitPercent] = useState(70);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "sub_agents"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SubAgent);
        setSubAgents(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleCreateSubAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Omit<SubAgent, "id"> = {
        parentAgentId: appUser?.uid || "master_agency",
        name,
        email,
        phone,
        location,
        commissionSplitPercentage: splitPercent,
        status: "Active",
        studentsReferredCount: 0,
        totalRevenueGeneratedUSD: 0,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "sub_agents"), payload);
      setNotice(`Sub-agent ${name} has been added with ${splitPercent}% commission split!`);
      setName("");
      setEmail("");
      setPhone("");
      setLocation("");
      setSplitPercent(70);
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert("Error adding sub-agent: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (sub: SubAgent) => {
    const nextStatus = sub.status === "Active" ? "Suspended" : "Active";
    await updateDoc(doc(db, "sub_agents", sub.id), {
      status: nextStatus,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <Users2 className="w-7 h-7 text-emerald-400" />
            <span>Sub-Agent Network & Commission Splitting</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manage your tier-2 sub-counsellors and franchise branches with automated commission splits.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sub-Agent</span>
        </button>
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
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Active Sub-Agents</span>
          <span className="text-2xl font-extrabold font-heading text-[var(--text-primary)] mt-1 block font-mono">
            {subAgents.filter((s) => s.status === "Active").length}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] mt-1 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Authorized branch partners</span>
          </span>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Total Students Referred</span>
          <span className="text-2xl font-extrabold font-heading text-emerald-400 mt-1 block font-mono">
            {subAgents.reduce((sum, s) => sum + (s.studentsReferredCount || 0), 0)}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] mt-1">Across all branches</span>
        </div>

        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Average Commission Split</span>
          <span className="text-2xl font-extrabold font-heading text-[var(--text-primary)] mt-1 block font-mono">
            {subAgents.length > 0
              ? `${Math.round(subAgents.reduce((sum, s) => sum + s.commissionSplitPercentage, 0) / subAgents.length)}%`
              : "70%"}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] mt-1">Sub-Agent Share</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Sub-Agent / Branch</th>
                <th className="px-4 py-3">Location & Contact</th>
                <th className="px-4 py-3">Commission Split</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                    Loading sub-agent directory...
                  </td>
                </tr>
              ) : subAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                    No sub-agents registered yet. Click "Add Sub-Agent" to onboard branch partners.
                  </td>
                </tr>
              ) : (
                subAgents.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center space-x-2">
                        <Users2 className="w-4 h-4 text-emerald-400" />
                        <span>{sub.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="flex items-center space-x-1 text-[var(--text-secondary)]">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{sub.location || "Global"}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)]">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <span>{sub.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center space-x-1 font-mono font-bold text-emerald-400">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{sub.commissionSplitPercentage}% Sub / {100 - sub.commissionSplitPercentage}% Master</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-[var(--text-primary)]">
                      {sub.studentsReferredCount || 0}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold border border-[var(--border-color)] transition-colors"
                      >
                        {sub.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Sub-Agent */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
                <Users2 className="w-5 h-5 text-emerald-400" />
                <span>Onboard New Sub-Agent</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAgent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Sub-Agent / Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Education Lahore Branch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="branch@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore, Pakistan"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-semibold mb-1">
                  Commission Split (% to Sub-Agent): {splitPercent}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-0.5">
                  <span>30% Sub / 70% You</span>
                  <span className="font-bold text-emerald-400">{splitPercent}% Sub / {100 - splitPercent}% You</span>
                  <span>90% Sub / 10% You</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Save Sub-Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
