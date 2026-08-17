import React, { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { RoleGate } from "../components/layout/RoleGate";
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Link,
  DollarSign,
  Users,
  Building,
  X
} from "lucide-react";

export interface ExternalAgent {
  id: string;
  agencyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  referralCode: string;
  status: "Active" | "Pending Approval" | "Suspended";
  totalReferrals: number;
  totalCommissionPaidUSD: number;
  createdAt: number;
}

export const AgentsContent: React.FC = () => {
  const [agents, setAgents] = useState<ExternalAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "agents"), (snapshot) => {
      const docs: ExternalAgent[] = [];
      snapshot.forEach((d) => {
        docs.push({ id: d.id, ...d.data() } as ExternalAgent);
      });
      setAgents(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName || !email) return;

    try {
      setSubmitting(true);
      const referralCode = `REF-${agencyName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAgent: Omit<ExternalAgent, "id"> = {
        agencyName,
        contactPerson,
        email,
        phone,
        country: country || "International",
        referralCode,
        status: "Active",
        totalReferrals: 0,
        totalCommissionPaidUSD: 0,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "agents"), newAgent);
      setIsModalOpen(false);
      setAgencyName("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setCountry("");
    } catch (err) {
      console.error("Create agent error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (agentId: string, newStatus: "Active" | "Pending Approval" | "Suspended") => {
    try {
      await updateDoc(doc(db, "agents", agentId), { status: newStatus });
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const copyReferralLink = (code: string) => {
    const url = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      a.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            External Agent & Sub-Agent Network
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage partner agencies, referral links, status approvals, and commission ledgers
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sq-btn shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Agent</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-medium">Active Partner Agencies</div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">
              {agents.filter((a) => a.status === "Active").length}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center space-x-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-medium">Total Referred Leads</div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">
              {agents.reduce((acc, curr) => acc + (curr.totalReferrals || 0), 0)}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-medium">Total Commissions Disbursed</div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">
              ${agents.reduce((acc, curr) => acc + (curr.totalCommissionPaidUSD || 0), 0).toLocaleString()} USD
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search agency, code, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Loading partner agencies...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <UserCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <div className="text-sm font-bold text-[var(--text-primary)]">No partner agencies found</div>
            <p className="text-xs text-[var(--text-secondary)]">Click "Onboard New Agent" to register an external recruitment partner.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] font-semibold border-b border-[var(--border-default)]">
                  <th className="p-3.5">Agency & Contact</th>
                  <th className="p-3.5">Country</th>
                  <th className="p-3.5">Referral Code</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Referrals</th>
                  <th className="p-3.5">Paid Commission</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-[var(--text-primary)]">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-sm text-[var(--text-primary)]">{agent.agencyName}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center space-x-2 mt-0.5">
                        <span>{agent.contactPerson}</span>
                        <span>•</span>
                        <span>{agent.email}</span>
                      </div>
                    </td>
                    <td className="p-3.5">{agent.country}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => copyReferralLink(agent.referralCode)}
                        className="flex items-center space-x-1.5 px-2 py-1 bg-[var(--bg-input)] hover:bg-emerald-500/10 border border-[var(--border-default)] hover:border-emerald-500/30 rounded text-[11px] font-mono text-emerald-400 transition-colors"
                        title="Click to copy full referral registration URL"
                      >
                        <Link className="w-3 h-3" />
                        <span>{agent.referralCode}</span>
                        {copiedCode === agent.referralCode && <span className="text-[9px] text-emerald-400 font-bold ml-1">Copied!</span>}
                      </button>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${
                          agent.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : agent.status === "Pending Approval"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-semibold">{agent.totalReferrals}</td>
                    <td className="p-3.5 font-mono font-semibold">${agent.totalCommissionPaidUSD.toLocaleString()} USD</td>
                    <td className="p-3.5 text-right space-x-2">
                      {agent.status !== "Active" && (
                        <button
                          onClick={() => handleUpdateStatus(agent.id, "Active")}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      {agent.status !== "Suspended" && (
                        <button
                          onClick={() => handleUpdateStatus(agent.id, "Suspended")}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">Onboard External Agent</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Agency Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Apex Global Student Services"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Primary Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Robert Vance"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  placeholder="agent@apexedu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+44 7700 900077"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Operating Country</label>
                <input
                  type="text"
                  placeholder="e.g. India, Nigeria, United Kingdom"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Onboard Partner Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AgentsPage: React.FC = () => {
  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "office_manager", "team_leader"]}>
      <AgentsContent />
    </RoleGate>
  );
};
