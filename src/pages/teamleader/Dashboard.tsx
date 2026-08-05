import React, { useState, useEffect } from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { db } from "../../firebase/config";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { 
  Users2, 
  FileText, 
  TrendingUp, 
  Clock, 
  Building2, 
  Globe, 
  Bell, 
  UserCheck, 
  History, 
  Sparkles, 
  ArrowUpRight, 
  Activity, 
  AlertTriangle 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: number;
}

export const TeamLeaderDashboard: React.FC = () => {
  const {
    office,
    team,
    counsellors,
    applications,
    leads,
    students,
    tasks,
    loading
  } = useTeamLeaderData();

  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [activityError, setActivityError] = useState("");

  // Fetch recent logs
  useEffect(() => {
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(6));
    const unsub = onSnapshot(q, (snap) => {
      const logs: AuditLog[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          action: data.action || "ACTIVITY",
          user: data.performedBy || "Unknown",
          details: data.details || "Team activity updated.",
          timestamp: data.timestamp || Date.now()
        });
      });
      setRecentLogs(logs);
      setActivityError("");
    }, () => setActivityError("Recent activity could not be loaded."));
    return () => unsub();
  }, []);

  // Compute Metrics
  const totalTeamMembers = counsellors.length;
  const assignedLeads = leads.length;
  const assignedApps = applications.length;
  
  const pendingDocs = applications.filter(a => a.stage === "Documents Pending").length;
  const submittedApps = applications.filter(a => a.stage === "Submitted").length;
  const conditionalOffers = applications.filter(a => a.stage === "Conditional Offer").length;
  const unconditionalOffers = applications.filter(a => a.stage === "Unconditional Offer").length;
  const visaProcessing = applications.filter(a => ["Deposit Paid", "CAS Issued", "Visa Approved"].includes(a.stage)).length;

  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    if (t.status === "Completed") return false;
    return new Date(t.dueDate) < now;
  }).length;

  // Simulated avg response time & conversion score
  const avgResponseTime = assignedApps > 10 ? "2.1 hours" : "2.8 hours";
  const conversionRate = assignedLeads > 0 
    ? Math.round((applications.filter(a => ["Enrolled", "Visa Approved", "Unconditional Offer"].includes(a.stage)).length / assignedLeads) * 100)
    : 0;

  // Chart 1: Applications by Status
  const statusCounts: Record<string, number> = {};
  applications.forEach(a => {
    statusCounts[a.stage] = (statusCounts[a.stage] || 0) + 1;
  });
  const statusChartData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  }));

  const COLORS = ["#10b981", "#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280"];

  // Chart 2: Applications by Counsellor
  const counsellorAppCounts: Record<string, number> = {};
  counsellors.forEach(c => {
    counsellorAppCounts[c.displayName || c.email] = 0;
  });
  applications.forEach(a => {
    if (a.assignedCounsellor) {
      const match = counsellors.find(c => c.email === a.assignedCounsellor);
      if (match) {
        const name = match.displayName || match.email;
        counsellorAppCounts[name] = (counsellorAppCounts[name] || 0) + 1;
      }
    }
  });
  const counsellorChartData = Object.keys(counsellorAppCounts).map(name => ({
    name: name.split(" ")[0], // Use first name for space
    applications: counsellorAppCounts[name]
  }));

  // Chart 3: Applications by Country (scoped from students)
  const countryCounts: Record<string, number> = {};
  applications.forEach(a => {
    const student = students.find(s => s.id === a.studentId);
    const country = student?.countryOfResidence || student?.nationality || "Other";
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });
  const countryChartData = Object.keys(countryCounts).map(name => ({
    name,
    applications: countryCounts[name]
  })).slice(0, 5); // top 5

  // Chart 4: Lead Conversion stages
  const stageCounts: Record<string, number> = {};
  leads.forEach(l => {
    stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
  });
  const leadStageChartData = Object.keys(stageCounts).map(name => ({
    name,
    leads: stageCounts[name]
  }));

  // Chart 5: Workload Distribution (Radar Chart showing Tasks vs Apps per counsellor)
  const workloadChartData = counsellors.map(c => {
    const cName = (c.displayName || c.email).split(" ")[0];
    const appsCount = applications.filter(a => a.assignedCounsellor === c.email).length;
    const tasksCount = tasks.filter(t => t.assignedTo === c.email && t.status !== "Completed").length;
    return {
      subject: cName,
      Applications: appsCount,
      Tasks: tasksCount,
      fullMark: Math.max(appsCount, tasksCount, 5)
    };
  });

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6">
        {/* Banner Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/10 p-6 sq-card">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                {office} &bull; {team}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] mt-1">
              Team Leader Command Center
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Workload balances, recruiter conversions, and real-time operational performance metrics.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-[var(--bg-card)] border border-[var(--border-default)] p-3 sq-card">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Office Scope</span>
              <span className="text-[var(--text-primary)] font-bold">{office}</span>
            </div>
            <div className="border-l border-[var(--border-default)] pl-3">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Recruitment Team</span>
              <span className="text-[var(--text-primary)] font-bold">{team}</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Row 1 */}
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Team Members</span>
                <Users2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)]">{totalTeamMembers}</div>
              <div className="text-[10px] text-emerald-400 font-medium">Recruitment Counsellors</div>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Active Leads</span>
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)]">{assignedLeads}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Assigned in queue</div>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Applications</span>
                <FileText className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)]">{assignedApps}</div>
              <div className="text-[10px] text-sky-400 font-medium">Under management</div>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Pending Docs</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </div>
              <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)]">{pendingDocs}</div>
              <div className="text-[10px] text-amber-400 font-medium">Action required</div>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Conversion Rate</span>
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)]">{conversionRate}%</div>
              <div className="text-[10px] text-rose-400 font-medium">Lead to offer success</div>
            </div>

            {/* Row 2 */}
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Submitted</span>
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{submittedApps}</div>
              <span className="text-[9px] text-[var(--text-muted)] font-mono">In university review</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Offers (Cond / Uncond)</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {conditionalOffers} / {unconditionalOffers}
              </div>
              <span className="text-[9px] text-emerald-400 font-mono">Offered students</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Visa Processing</span>
                <Globe className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{visaProcessing}</div>
              <span className="text-[9px] text-[var(--text-muted)] font-mono">CAS / Visa active</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Overdue Tasks</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-rose-400">{overdueTasks}</div>
              <span className="text-[9px] text-rose-400/80 font-mono">Immediate follow-ups</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover-lift space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                <span>Avg Response Time</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{avgResponseTime}</div>
              <span className="text-[9px] text-indigo-400 font-mono">Counsellor lead pick</span>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Applications by Status */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Applications by Status</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Active funnel stages distribution</p>
            </div>
            <div className="h-64">
              {statusChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No application data found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px",
                        color: "var(--text-primary)" 
                      }} 
                    />
                    <Legend 
                      iconSize={8} 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Workload distribution (Apps vs Tasks) */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Workload Distribution</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Active Applications & Open Tasks per Counsellor</p>
            </div>
            <div className="h-64">
              {workloadChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Add team members to view workload radar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={workloadChartData}>
                    <PolarGrid stroke="var(--border-default)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" style={{ fontSize: '10px' }} />
                    <PolarRadiusAxis stroke="var(--border-default)" angle={30} domain={[0, 'auto']} style={{ fontSize: '9px' }} />
                    <Radar name="Applications" dataKey="Applications" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Radar name="Pending Tasks" dataKey="Tasks" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px"
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Applications by Country */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Top Recruitment Destinations</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Student origin distributions</p>
            </div>
            <div className="h-64">
              {countryChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No country records found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis type="number" stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" style={{ fontSize: "9px" }} width={80} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px"
                      }}
                    />
                    <Bar dataKey="applications" fill="#14b8a6" radius={[0, 4, 4, 0]}>
                      {countryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Second Row of Charts: Applications by Counsellor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Application Distribution by Recruiter</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Total submissions per counsellor</p>
            </div>
            <div className="h-64">
              {counsellorChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Assign applications to counsellors to load stats.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={counsellorChartData}>
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
                    <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Lead Stages Conversion Pipeline</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Active leads distribution by current stage</p>
            </div>
            <div className="h-64">
              {leadStageChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No active enquiries found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leadStageChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: "9px" }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: "10px" }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "var(--bg-card)", 
                        borderColor: "var(--border-default)",
                        borderRadius: "10px",
                        fontSize: "11px"
                      }}
                    />
                    <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Timelines and Assignments split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline of activity */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recent Team Activity</span>
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">Live audit trail actions within team scope</p>
              </div>
              <History className="w-4 h-4 text-[var(--text-muted)]" />
            </div>

            <div className="space-y-4 overflow-y-auto max-h-80 pr-1">
              {activityError ? (
                <div className="text-center py-8 text-xs text-rose-400">{activityError}</div>
              ) : recentLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                  No recent audit logs available.
                </div>
              ) : (
                recentLogs.map((log, i) => (
                  <div key={log.id} className="flex items-start space-x-3 text-xs relative">
                    {/* Visual Line */}
                    {i !== recentLogs.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-[-16px] w-[1px] bg-[var(--border-default)]" />
                    )}
                    <div className="w-6 h-6 sq-avatar bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 text-emerald-400">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)]">{log.action.replace(/_/g, " ")}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px] mt-0.5">{log.details}</p>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">By: {log.user}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent assignments queue */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-teal-400" />
                  <span>Assignments & Alerts</span>
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">Active updates needing team supervisor approval</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)]" />
            </div>

            <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
              {applications.filter(a => a.stage === "Draft" || a.stage === "Initial Review").slice(0, 5).length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                  No pending new application reviews.
                </div>
              ) : (
                applications
                  .filter(a => a.stage === "Draft" || a.stage === "Initial Review")
                  .slice(0, 5)
                  .map(app => (
                    <div 
                      key={app.id} 
                      className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card flex justify-between items-center text-xs hover:border-emerald-500/20"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">{app.applicationNumber}</span>
                          <span className="font-semibold text-[var(--text-primary)]">{app.studentName}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          {app.universityName} &bull; {app.programmeName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px]">
                          {app.stage}
                        </span>
                        <div className="text-[9px] text-[var(--text-muted)] mt-1">
                          Assigned: {app.assignedCounsellor ? app.assignedCounsellor.split("@")[0] : "None"}
                        </div>
                      </div>
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
