import React, { useState } from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  Eye, 
  GraduationCap, 
  FileText,
  Clock,
  Globe,
  Building,
  X
} from "lucide-react";
import { Application, ApplicationStage } from "../../types/application";

const STAGES: ApplicationStage[] = [
  "Draft",
  "Initial Review",
  "Documents Pending",
  "Submitted",
  "University Reviewing",
  "Conditional Offer",
  "Unconditional Offer",
  "Deposit Paid",
  "CAS Issued",
  "Visa Approved",
  "Enrolled",
  "Rejected",
  "Withdrawn"
];

export const TeamLeaderApplications: React.FC = () => {
  const {
    counsellors,
    applications,
    students,
    loading
  } = useTeamLeaderData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedCounsellor, setSelectedCounsellor] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected App details drawer/modal
  const [viewApp, setViewApp] = useState<Application | null>(null);

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Get student details helper
  const getStudentCountry = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.countryOfResidence || student?.nationality || "Unknown";
  };

  // Unique countries for filter dropdowns
  const uniqueCountries = Array.from(new Set(applications.map(a => getStudentCountry(a.studentId))));

  // Filter & Sort
  const filteredApps = applications
    .filter((app) => {
      const studentCountry = getStudentCountry(app.studentId);
      const name = app.studentName.toLowerCase();
      const num = app.applicationNumber.toLowerCase();
      const uni = app.universityName.toLowerCase();
      const queryStr = searchQuery.toLowerCase();

      const matchesSearch = name.includes(queryStr) || num.includes(queryStr) || uni.includes(queryStr);
      const matchesStage = selectedStage === "All" || app.stage === selectedStage;
      const matchesCounsellor = selectedCounsellor === "All" || app.assignedCounsellor === selectedCounsellor;
      const matchesCountry = selectedCountry === "All" || studentCountry === selectedCountry;

      return matchesSearch && matchesStage && matchesCounsellor && matchesCountry;
    })
    .sort((a, b) => {
      let valA: any = a[sortField as keyof Application] || "";
      let valB: any = b[sortField as keyof Application] || "";

      if (sortField === "country") {
        valA = getStudentCountry(a.studentId);
        valB = getStudentCountry(b.studentId);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6 text-xs">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Team Application Tracker</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Global university submissions, intake stages, and tracking details within team office bounds.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by student, APP-ID, university..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
              >
                <option value="All">All Stages</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={selectedCounsellor}
                onChange={(e) => {
                  setSelectedCounsellor(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
              >
                <option value="All">All Counsellors</option>
                {counsellors.map((c) => (
                  <option key={c.uid} value={c.email}>{c.displayName || c.email}</option>
                ))}
              </select>

              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
              >
                <option value="All">All Countries</option>
                {uniqueCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {(searchQuery || selectedStage !== "All" || selectedCounsellor !== "All" || selectedCountry !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStage("All");
                    setSelectedCounsellor("All");
                    setSelectedCountry("All");
                    setCurrentPage(1);
                  }}
                  className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 sq-btn"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tracker Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)]" onClick={() => handleSort("applicationNumber")}>
                    <div className="flex items-center space-x-1">
                      <span>App Number</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)]" onClick={() => handleSort("studentName")}>
                    <div className="flex items-center space-x-1">
                      <span>Student</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)]" onClick={() => handleSort("universityName")}>
                    <div className="flex items-center space-x-1">
                      <span>University & Programme</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-[var(--text-primary)]" onClick={() => handleSort("country")}>
                    <div className="flex items-center space-x-1">
                      <span>Country</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Intake</th>
                  <th className="py-3.5 px-4">Recruiter</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-[var(--text-muted)]">
                      Loading tracking records...
                    </td>
                  </tr>
                ) : paginatedApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-[var(--text-muted)]">
                      No matching student applications found.
                    </td>
                  </tr>
                ) : (
                  paginatedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--text-primary)] text-sm flex items-center space-x-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                          <span>{app.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--text-primary)] flex items-center space-x-1">
                          <Building className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{app.universityName}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] ml-4">{app.programmeName}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        <span className="flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{getStudentCountry(app.studentId)}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{app.intake}</td>
                      <td className="py-3 px-4 font-semibold">
                        {app.assignedCounsellor ? (
                          <span className="px-2 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                            {app.assignedCounsellor.split("@")[0]}
                          </span>
                        ) : (
                          <span className="text-rose-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 sq-badge font-bold border ${
                          app.stage === "Enrolled"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : app.stage === "Rejected"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                        }`}>
                          {app.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewApp(app)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 sq-btn transition-all"
                          title="View Application Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                  className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-btn disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-btn disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Application Details Drawer */}
        {viewApp && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex justify-end">
            <div className="bg-[var(--bg-card)] border-l border-[var(--border-default)] w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between animate-fade-in text-xs">
              <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div>
                    <span className="font-mono text-emerald-400 font-bold block text-sm">
                      {viewApp.applicationNumber}
                    </span>
                    <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">
                      {viewApp.studentName}
                    </h2>
                  </div>
                  <button onClick={() => setViewApp(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 sq-btn">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info block */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">University</span>
                    <span className="text-[var(--text-primary)] font-semibold">{viewApp.universityName}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Programme</span>
                    <span className="text-[var(--text-primary)] font-semibold">{viewApp.programmeName}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Intake Term</span>
                    <span className="text-[var(--text-primary)] font-semibold">{viewApp.intake}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Origin Country</span>
                    <span className="text-[var(--text-primary)] font-semibold">{getStudentCountry(viewApp.studentId)}</span>
                  </div>
                </div>

                {/* History timeline */}
                <div className="space-y-3 pt-3">
                  <h4 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Application Status History</span>
                  </h4>
                  <div className="space-y-4 pl-1">
                    {viewApp.history && viewApp.history.length > 0 ? (
                      viewApp.history.map((h, i) => (
                        <div key={i} className="flex items-start space-x-3 relative">
                          {i !== viewApp.history.length - 1 && (
                            <div className="absolute left-3 top-5 bottom-[-16px] w-[1px] bg-[var(--border-default)]" />
                          )}
                          <div className="w-6 h-6 sq-avatar bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 text-teal-400">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[var(--text-primary)] bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 sq-badge">
                                {h.stage}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                {new Date(h.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[var(--text-secondary)] text-[10px] mt-1 leading-relaxed">
                              {h.note || "No comments details provided."}
                            </p>
                            <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">By: {h.updatedBy}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[var(--text-muted)] text-[10px]">No historical stage records loaded.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex justify-end">
                <button
                  onClick={() => setViewApp(null)}
                  className="px-5 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn hover:bg-emerald-400"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
export default TeamLeaderApplications;
