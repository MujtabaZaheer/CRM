import React, { useState } from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  Eye, 
  X
} from "lucide-react";
import { AppUser } from "../../types/role";

export const TeamLeaderTeamMembers: React.FC = () => {
  const {
    counsellors,
    applications,
    leads,
    tasks,
    loading
  } = useTeamLeaderData();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("displayName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal State
  const [selectedMember, setSelectedMember] = useState<AppUser | null>(null);

  // Compute stats for a member
  const getMemberStats = (c: AppUser) => {
    const cLeads = leads.filter(l => l.assignedTo === c.uid || l.assignedTo === c.email).length;
    const cApps = applications.filter(a => a.assignedCounsellor === c.email).length;
    const cTasks = tasks.filter(t => t.assignedTo === c.email && t.status !== "Completed").length;
    // Mock performance score based on applications and task turnaround
    const baseScore = 75 + (cApps * 4) - (cTasks * 2);
    const score = Math.max(50, Math.min(99, baseScore));
    return {
      leadsCount: cLeads,
      appsCount: cApps,
      tasksCount: cTasks,
      performanceScore: score
    };
  };

  // Sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter and Sort counsellors
  const filteredCounsellors = counsellors
    .filter(c => {
      const name = c.displayName || "";
      const email = c.email || "";
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const stats = getMemberStats(c);
      const matchesStatus = statusFilter === "All" || 
                            (statusFilter === "Overloaded" && stats.tasksCount > 3) ||
                            (statusFilter === "Optimal" && stats.tasksCount <= 3);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA: any = a[sortField as keyof AppUser] || "";
      let valB: any = b[sortField as keyof AppUser] || "";
      
      if (sortField === "apps") {
        valA = getMemberStats(a).appsCount;
        valB = getMemberStats(b).appsCount;
      } else if (sortField === "score") {
        valA = getMemberStats(a).performanceScore;
        valB = getMemberStats(b).performanceScore;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredCounsellors.length / itemsPerPage);
  const paginatedCounsellors = filteredCounsellors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Team Recruitment Directory</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Recruiter workload monitor, student funnel rates, and action updates.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search counsellors by name, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            {(searchQuery || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 sq-btn bg-rose-500/10 border border-rose-500/20"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="All" className="bg-[var(--bg-card)]">All Workloads</option>
                <option value="Overloaded" className="bg-[var(--bg-card)]">High Workload (&gt;3 Tasks)</option>
                <option value="Optimal" className="bg-[var(--bg-card)]">Optimal Workload (&le;3 Tasks)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)]" onClick={() => handleSort("displayName")}>
                    <div className="flex items-center space-x-1">
                      <span>Counsellor</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Role / Title</th>
                  <th className="py-3.5 px-4">Assigned Office</th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)]" onClick={() => handleSort("apps")}>
                    <div className="flex items-center space-x-1">
                      <span>Applications</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Assigned Leads</th>
                  <th className="py-3.5 px-4">Pending Tasks</th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)]" onClick={() => handleSort("score")}>
                    <div className="flex items-center space-x-1">
                      <span>KPI Rating</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Workload Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[var(--text-muted)]">
                      Loading team directory...
                    </td>
                  </tr>
                ) : paginatedCounsellors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[var(--text-muted)]">
                      No team counsellors found matching filters.
                    </td>
                  </tr>
                ) : (
                  paginatedCounsellors.map((c) => {
                    const stats = getMemberStats(c);
                    const isOverloaded = stats.tasksCount > 3;
                    return (
                      <tr key={c.uid} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--text-primary)] flex items-center space-x-2.5">
                          <div className="w-8 h-8 sq-avatar bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-xs">
                            {c.displayName ? c.displayName.slice(0, 2).toUpperCase() : c.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[var(--text-primary)]">
                              {c.displayName || "Counsellor Account"}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                          Recruitment Counsellor
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {c.office || "Toronto Office"}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[var(--text-primary)]">
                          {stats.appsCount}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {stats.leadsCount}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          <span className={stats.tasksCount > 0 ? "text-amber-400 font-bold" : ""}>
                            {stats.tasksCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 sq-badge font-bold ${
                            stats.performanceScore >= 85 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : stats.performanceScore >= 70
                              ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {stats.performanceScore} / 100
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 sq-pill font-semibold text-[10px] border ${
                            isOverloaded 
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {isOverloaded ? "Overloaded" : "Optimal"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedMember(c)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 sq-btn transition-all"
                            title="View Recruiter Performance Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-3 bg-[var(--bg-elevated)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                Showing page <span className="font-bold text-[var(--text-primary)]">{currentPage}</span> of{" "}
                <span className="font-bold text-[var(--text-primary)]">{totalPages}</span>
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-btn hover:bg-[var(--bg-hover)] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-btn hover:bg-[var(--bg-hover)] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Member Details Modal */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-lg sq-modal shadow-2xl p-6 space-y-5 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div>
                  <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">
                    {selectedMember.displayName || "Recruiter Profile"}
                  </h2>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Counsellor Workload Audit Summary</p>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 sq-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card">
                  <span className="text-[10px] text-[var(--text-muted)] block">APPLICATIONS</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">
                    {getMemberStats(selectedMember).appsCount}
                  </span>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card">
                  <span className="text-[10px] text-[var(--text-muted)] block">ASSIGNED LEADS</span>
                  <span className="text-lg font-bold text-teal-400 mt-1 block">
                    {getMemberStats(selectedMember).leadsCount}
                  </span>
                </div>
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card">
                  <span className="text-[10px] text-[var(--text-muted)] block">PENDING TASKS</span>
                  <span className="text-lg font-bold text-amber-400 mt-1 block">
                    {getMemberStats(selectedMember).tasksCount}
                  </span>
                </div>
              </div>

              {/* Sub list showing active applications assigned */}
              <div className="space-y-2">
                <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[10px]">
                  Active Student Pipeline
                </h4>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card max-h-48 overflow-y-auto divide-y divide-[var(--border-default)]">
                  {applications.filter(a => a.assignedCounsellor === selectedMember.email).length === 0 ? (
                    <div className="p-4 text-center text-[var(--text-muted)] text-[11px]">
                      No active applications assigned to this counsellor.
                    </div>
                  ) : (
                    applications
                      .filter(a => a.assignedCounsellor === selectedMember.email)
                      .map(app => (
                        <div key={app.id} className="p-2.5 flex justify-between items-center">
                          <div>
                            <span className="font-mono text-emerald-400 font-bold block">{app.applicationNumber}</span>
                            <span className="text-[var(--text-primary)] font-semibold">{app.studentName}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 sq-badge bg-teal-500/10 text-teal-400 text-[9px] border border-teal-500/20 font-bold">
                              {app.stage}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{app.intake}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn hover:bg-emerald-400"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
export default TeamLeaderTeamMembers;
