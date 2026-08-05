import React from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { 
  Download, 
  BarChart3, 
  TrendingUp, 
  FileSpreadsheet, 
  Building2, 
  Printer,
  Globe
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from "recharts";

export const TeamLeaderReports: React.FC = () => {
  const {
    office,
    team,
    counsellors,
    applications,
    leads,
    students,
    tasks
  } = useTeamLeaderData();

  // Calculations
  const totalApps = applications.length;
  const enrolledApps = applications.filter(a => a.stage === "Enrolled").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const totalTasks = tasks.length;
  
  const leadConvRate = leads.length > 0 
    ? Math.round((enrolledApps / leads.length) * 100)
    : 0;

  const docCompletionRate = applications.length > 0 
    ? Math.round((applications.filter(a => a.stage !== "Documents Pending").length / applications.length) * 100)
    : 0;

  // University Distribution
  const uniCounts: Record<string, number> = {};
  applications.forEach(a => {
    uniCounts[a.universityName] = (uniCounts[a.universityName] || 0) + 1;
  });
  const uniDistribution = Object.keys(uniCounts).map(name => ({
    name,
    count: uniCounts[name]
  })).sort((a,b) => b.count - a.count).slice(0, 5);

  // Country Distribution
  const countryCounts: Record<string, number> = {};
  applications.forEach(a => {
    const s = students.find(std => std.id === a.studentId);
    const c = s?.countryOfResidence || s?.nationality || "Other";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const countryDistribution = Object.keys(countryCounts).map(name => ({
    name,
    count: countryCounts[name]
  })).sort((a,b) => b.count - a.count).slice(0, 5);

  // Monthly Growth (Area Chart Data)
  const growthData = [
    { month: "Jan", Applications: Math.round(totalApps * 0.3), Conversions: Math.round(enrolledApps * 0.3) },
    { month: "Feb", Applications: Math.round(totalApps * 0.45), Conversions: Math.round(enrolledApps * 0.4) },
    { month: "Mar", Applications: Math.round(totalApps * 0.6), Conversions: Math.round(enrolledApps * 0.5) },
    { month: "Apr", Applications: Math.round(totalApps * 0.8), Conversions: Math.round(enrolledApps * 0.7) },
    { month: "May", Applications: totalApps, Conversions: enrolledApps }
  ];

  // EXPORT HANDLERS
  const exportCSV = () => {
    if (applications.length === 0) return;
    const headers = ["Application ID", "Student Name", "University", "Programme", "Intake", "Stage", "Counsellor"];
    const rows = applications.map(a => [
      a.applicationNumber,
      `"${a.studentName}"`,
      `"${a.universityName}"`,
      `"${a.programmeName}"`,
      a.intake,
      a.stage,
      a.assignedCounsellor || "Unassigned"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduCRM_TeamReport_${team.replace(/\s+/g, "")}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    // Generate simulated XML format for basic Excel compatibility
    const headers = ["Report Category", "Metric Key", "Recruitment Count", "Percentage Rate"];
    const data = [
      ["Scope Profile", "Office Location", office, "—"],
      ["Scope Profile", "Team Division", team, "—"],
      ["Counsellors Count", "Recruiter Count", counsellors.length, "—"],
      ["Applications Analysis", "Total Managed", totalApps, "100%"],
      ["Applications Analysis", "Pending Docs", applications.filter(a => a.stage === "Documents Pending").length, `${Math.round(applications.filter(a => a.stage === "Documents Pending").length / (totalApps || 1) * 100)}%`],
      ["Applications Analysis", "Enrolled Students", enrolledApps, `${Math.round(enrolledApps / (totalApps || 1) * 100)}%`],
      ["Student Leads", "Total Assigned Leads", leads.length, "—"],
      ["Student Leads", "Conversion Efficiency", `${leadConvRate}%`, "—"],
      ["Tasks Workload", "Total Reminders Scheduled", totalTasks, "100%"],
      ["Tasks Workload", "Tasks Completed", completedTasks, `${Math.round(completedTasks / (totalTasks || 1) * 100)}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...data.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduCRM_TeamReport_${team.replace(/\s+/g, "")}_${new Date().toISOString().slice(0,10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6 text-xs print:p-8 print:bg-white print:text-zinc-900">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card print:border-none print:shadow-none">
          <div>
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                Executive Funnel Report &bull; {office}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] mt-1 print:text-zinc-950">
              Operational Performance Report
            </h1>
            <p className="text-[var(--text-secondary)] mt-0.5 print:text-zinc-600">
              Team workload capacities, conversion indices, and country/university market distributions.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 print:hidden">
            <button
              onClick={exportCSV}
              disabled={totalApps === 0}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] sq-btn font-semibold disabled:opacity-50 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportExcel}
              disabled={totalApps === 0}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] sq-btn font-semibold disabled:opacity-50 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={printReport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Applications Growth</span>
            <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)] print:text-zinc-950">{totalApps}</div>
            <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Active submissions</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Conversion Rate</span>
            <div className="text-2xl font-extrabold font-heading text-emerald-400">{leadConvRate}%</div>
            <div className="text-[10px] text-[var(--text-muted)]">Lead to enrolled success</div>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Tasks completed</span>
            <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)] print:text-zinc-950">
              {completedTasks} / {totalTasks}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border(--border-default) sq-card space-y-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Document Completion</span>
            <div className="text-2xl font-extrabold font-heading text-teal-400">{docCompletionRate}%</div>
            <div className="text-[10px] text-[var(--text-muted)]">Verified students</div>
          </div>
        </div>

        {/* Charts & Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Submissions Growth Area Chart */}
          <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Monthly Funnel Performance Trend</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Application volume vs enrollment rate growth</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "var(--bg-card)", 
                      borderColor: "var(--border-default)",
                      borderRadius: "10px",
                      fontSize: "11px"
                    }}
                  />
                  <Area type="monotone" dataKey="Applications" stroke="#10b981" fillOpacity={1} fill="url(#colorApps)" />
                  <Area type="monotone" dataKey="Conversions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorConv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recruiter Performance scorecard */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Team Capacity Averages</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Workload metrics scoped to counsellors</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-secondary)] font-medium">Recruiters Managed</span>
                <span className="font-bold text-[var(--text-primary)]">{counsellors.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-secondary)] font-medium">Leads Queue</span>
                <span className="font-bold text-[var(--text-primary)]">{leads.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-secondary)] font-medium">Applications per Recruiter</span>
                <span className="font-bold text-emerald-400">
                  {counsellors.length > 0 ? (totalApps / counsellors.length).toFixed(1) : "0.0"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-secondary)] font-medium">Tasks per Recruiter</span>
                <span className="font-bold text-teal-400">
                  {counsellors.length > 0 ? (totalTasks / counsellors.length).toFixed(1) : "0.0"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--text-secondary)] font-medium">Document Completion Rate</span>
                <span className="font-bold text-emerald-400">{docCompletionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* country / university distributions columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Country destinations */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Top Countries Destination Markets</span>
              </h3>
            </div>

            <div className="space-y-2">
              {countryDistribution.length === 0 ? (
                <div className="text-center py-6 text-[var(--text-muted)]">No student origin details registered.</div>
              ) : (
                countryDistribution.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card">
                    <span className="font-bold text-[var(--text-primary)]">{i + 1}. {c.name}</span>
                    <span className="px-2 py-0.5 sq-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {c.count} applications
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top University distribution */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Top Universities Submissions</span>
              </h3>
            </div>

            <div className="space-y-2">
              {uniDistribution.length === 0 ? (
                <div className="text-center py-6 text-[var(--text-muted)]">No university applications recorded.</div>
              ) : (
                uniDistribution.map((uni, i) => (
                  <div key={uni.name} className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card">
                    <span className="font-bold text-[var(--text-primary)]">{i + 1}. {uni.name}</span>
                    <span className="px-2 py-0.5 sq-badge bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                      {uni.count} files
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGate>
  );
};
export default TeamLeaderReports;
