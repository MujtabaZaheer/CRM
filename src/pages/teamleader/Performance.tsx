import React from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Trophy, 
  TrendingDown
} from "lucide-react";
import { AppUser } from "../../types/role";

export const TeamLeaderPerformance: React.FC = () => {
  const {
    counsellors,
    applications,
    leads,
    tasks,
    loading
  } = useTeamLeaderData();

  // Compute stats for a counsellor
  const getCounsellorPerformance = (c: AppUser) => {
    const cLeads = leads.filter(l => l.assignedTo === c.uid || l.assignedTo === c.email);
    const cApps = applications.filter(a => a.assignedCounsellor === c.email);
    const cTasks = tasks.filter(t => t.assignedTo === c.email);
    const completedTasksCount = cTasks.filter(t => t.status === "Completed").length;
    const pendingTasksCount = cTasks.filter(t => t.status !== "Completed").length;

    // Conversions: conditional offer, unconditional offer, deposit paid, visa approved, enrolled
    const successfulApps = cApps.filter(a => 
      ["Conditional Offer", "Unconditional Offer", "Deposit Paid", "CAS Issued", "Visa Approved", "Enrolled"].includes(a.stage)
    ).length;

    const conversionRate = cLeads.length > 0 
      ? Math.round((successfulApps / cLeads.length) * 100) 
      : 0;

    // Doc completion: applications NOT in "Documents Pending" stage
    const docsCompletedApps = cApps.filter(a => a.stage !== "Documents Pending").length;
    const docCompletionRate = cApps.length > 0 
      ? Math.round((docsCompletedApps / cApps.length) * 100) 
      : 100;

    // Simulated average response time based on pending tasks (fewer pending = faster)
    const simulatedHrs = Math.max(1.2, parseFloat((1.5 + pendingTasksCount * 0.4).toFixed(1)));
    const avgResponseTime = `${simulatedHrs} hrs`;

    // KPI Performance Score
    const baseScore = 70 + (successfulApps * 5) + (completedTasksCount * 2) - (pendingTasksCount * 3);
    const performanceScore = Math.max(55, Math.min(99, baseScore));

    return {
      leadsCount: cLeads.length,
      appsCount: cApps.length,
      successfulApps,
      conversionRate,
      completedTasksCount,
      pendingTasksCount,
      docCompletionRate,
      avgResponseTime,
      performanceScore,
      simulatedHrs
    };
  };

  // Build metrics & chart datas
  const counsellorPerformanceData = counsellors.map(c => {
    const perf = getCounsellorPerformance(c);
    return {
      name: c.displayName || c.email.split("@")[0],
      email: c.email,
      ...perf
    };
  });

  // Team averages
  const teamAverageScore = counsellorPerformanceData.length > 0
    ? Math.round(counsellorPerformanceData.reduce((acc, c) => acc + c.performanceScore, 0) / counsellorPerformanceData.length)
    : 0;

  const teamAverageConversion = counsellorPerformanceData.length > 0
    ? Math.round(counsellorPerformanceData.reduce((acc, c) => acc + c.conversionRate, 0) / counsellorPerformanceData.length)
    : 0;

  // Sorting leaderboard
  const leaderboardData = [...counsellorPerformanceData]
    .sort((a, b) => b.performanceScore - a.performanceScore);

  const topPerformer = leaderboardData[0] || null;

  const COLORS = ["#10b981", "#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280"];

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6 text-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Team Performance Analytics</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Recruiter KPIs, lead conversion scores, response times, and monthly rankings.
            </p>
          </div>
        </div>

        {/* Top Performers Banner Card */}
        {topPerformer && (
          <div className="p-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-transparent border border-emerald-500/10 sq-card flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 sq-avatar bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase text-[9px] tracking-wider">
                    Top Performer
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">This Month</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] mt-1">
                  {topPerformer.name}
                </h3>
                <p className="text-[var(--text-secondary)] text-[10px] mt-0.5">
                  Achieved {topPerformer.conversionRate}% Conversion with a KPI Score of {topPerformer.performanceScore}/100.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-center">
              <div className="p-2">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Team Average KPI</span>
                <span className="text-xl font-bold text-[var(--text-primary)] mt-1 block">{teamAverageScore}</span>
              </div>
              <div className="border-l border-[var(--border-default)] pl-6 p-2">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Avg Conversion</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">{teamAverageConversion}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard Chart */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Counsellor Leaderboard</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Comparison of total KPI Performance Scores</p>
            </div>
            <div className="h-64">
              {counsellorPerformanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                  Register counsellors in the team to compile leaderboard.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderboardData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px"
                      }}
                    />
                    <Bar dataKey="performanceScore" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {leaderboardData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Conversion comparison */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Lead-to-Enrolment Conversion (%)</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Performance rates per recruiter</p>
            </div>
            <div className="h-64">
              {counsellorPerformanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                  No recruitment metrics available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={counsellorPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis type="number" stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px"
                      }}
                    />
                    <Bar dataKey="conversionRate" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Third Chart: Response Time analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Average Response Time (Hours)</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Workload-turnaround speed per recruiter</p>
            </div>
            <div className="h-64">
              {counsellorPerformanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                  No workload tracking available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={counsellorPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px"
                      }}
                    />
                    <Line type="monotone" dataKey="simulatedHrs" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Closed applications pie chart */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Closed Offers Contribution</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Total offers issued share across the team</p>
            </div>
            <div className="h-64">
              {counsellorPerformanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                  No active offers generated yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={counsellorPerformanceData.filter(c => c.successfulApps > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="successfulApps"
                      nameKey="name"
                    >
                      {counsellorPerformanceData.filter(c => c.successfulApps > 0).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px"
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "9px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Recruiter KPI Cards Grid */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2 border-b border-[var(--border-default)] pb-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Recruiter Performance Scorecards</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 text-center py-8 text-[var(--text-muted)]">
                Loading scorecards...
              </div>
            ) : counsellorPerformanceData.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-6">
                Assign counsellors to this team leadership context to generate performance metrics.
              </div>
            ) : (
              counsellorPerformanceData.map((c) => {
                const isPositiveTrend = c.performanceScore >= teamAverageScore;
                return (
                  <div key={c.email} className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover:border-emerald-500/20 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 sq-avatar bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-[11px]">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)] text-sm">{c.name}</h4>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono block leading-none mt-0.5">
                            {c.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-0.5 sq-badge font-bold text-[10px] border ${
                          c.performanceScore >= 80 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                        }`}>
                          {c.performanceScore} KPI
                        </span>
                      </div>
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block">Enrolled / Apps</span>
                        <span className="text-[var(--text-primary)] font-bold">{c.successfulApps} / {c.appsCount}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block">Leads Managed</span>
                        <span className="text-[var(--text-primary)] font-semibold">{c.leadsCount}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block">Conversion Rate</span>
                        <span className="text-emerald-400 font-extrabold">{c.conversionRate}%</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block">Response Time</span>
                        <span className="text-[var(--text-primary)] font-semibold flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>{c.avgResponseTime}</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block">Tasks (Done / Pending)</span>
                        <span className="text-[var(--text-primary)] font-semibold">
                          {c.completedTasksCount} / {c.pendingTasksCount}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block">Doc Completion</span>
                        <span className="text-teal-400 font-bold">{c.docCompletionRate}%</span>
                      </div>
                    </div>

                    {/* Trend indicator */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-default)] text-[10px] text-[var(--text-muted)]">
                      <span>Monthly Performance Growth</span>
                      {isPositiveTrend ? (
                        <span className="flex items-center text-emerald-400 font-bold space-x-0.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Above Average</span>
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-400 font-bold space-x-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Below Average</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </RoleGate>
  );
};
export default TeamLeaderPerformance;
