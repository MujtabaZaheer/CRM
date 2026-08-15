import React, { useMemo, useState } from "react";
import { BarChart3, Download, Printer, TrendingUp, Users, FileText, CircleDollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { useFinanceData } from "../hooks/useFinanceData";

export const ReportsPage: React.FC = () => {
  const { leads, students, applications } = useGlobalData();
  const financeData = useFinanceData();
  const [timeframe, setTimeframe] = useState("all");

  // 1. Funnel Data
  const funnelData = useMemo(() => {
    const stages = ["New", "Contacted", "Qualified", "Counselling", "Application Initiated", "Converted", "Lost"];
    return stages.map((stage) => ({
      stage,
      count: leads.filter((l) => l.stage === stage).length,
    }));
  }, [leads]);

  // 2. Application Pipeline Stages Data
  const appStageData = useMemo(() => {
    const stageCounts: Record<string, number> = {};
    applications.forEach((app) => {
      const group = app.stage?.includes("Offer")
        ? "Offers Issued"
        : app.stage?.includes("Visa") || app.stage?.includes("CAS")
        ? "CAS & Visa"
        : app.stage === "Enrolled"
        ? "Enrolled"
        : "Under Review";
      stageCounts[group] = (stageCounts[group] || 0) + 1;
    });

    return [
      { name: "Under Review", value: stageCounts["Under Review"] || 0, color: "#38bdf8" },
      { name: "Offers Issued", value: stageCounts["Offers Issued"] || 0, color: "#34d399" },
      { name: "CAS & Visa", value: stageCounts["CAS & Visa"] || 0, color: "#fbbf24" },
      { name: "Enrolled", value: stageCounts["Enrolled"] || 0, color: "#10b981" },
    ];
  }, [applications]);

  // 3. Finance Summary Charts
  const financeChartData = useMemo(() => {
    return [
      { name: "Revenue Collected", amount: financeData.summary.paidRevenue, color: "#10b981" },
      { name: "Outstanding Receivables", amount: financeData.summary.outstanding, color: "#f59e0b" },
      { name: "Refund Exposure", amount: financeData.summary.refunds, color: "#f43f5e" },
      { name: "Agent Commissions", amount: financeData.summary.commissions, color: "#6366f1" },
    ];
  }, [financeData.summary]);

  const handleExportCSV = () => {
    const rows = [
      ["Report Type", "Metric / Stage", "Count / Value"],
      ...funnelData.map((f) => ["Lead Funnel", f.stage, f.count]),
      ...appStageData.map((a) => ["Application Pipeline", a.name, a.value]),
      ...financeChartData.map((f) => ["Financial Overview", f.name, f.amount]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduCRM_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
              Executive Reports & Funnel Analytics
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Conversion funnels, recruitment yield forecasts, and financial summary dashboards.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
          >
            <option value="all">All Time History</option>
            <option value="90">Last 90 Days</option>
            <option value="30">This Month</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] sq-btn text-xs text-[var(--text-primary)] font-medium"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sq-btn"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Total Inquiries</div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{leads.length}</div>
          </div>
          <Users className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Enrolled Students</div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{students.length}</div>
          </div>
          <TrendingUp className="w-6 h-6 text-teal-400" />
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Applications Submitted</div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{applications.length}</div>
          </div>
          <FileText className="w-6 h-6 text-sky-400" />
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Revenue Collected</div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
              ${financeData.summary.paidRevenue.toLocaleString()}
            </div>
          </div>
          <CircleDollarSign className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel Chart */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              Lead Conversion Funnel
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Stage Breakdown</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                <XAxis dataKey="stage" stroke="var(--text-muted)" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-default)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Stage Distribution */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              Application Pipeline Distribution
            </h3>
            <span className="text-[10px] text-sky-400 font-mono">University Submissions</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appStageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {appStageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-default)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Table & Chart */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-4">
        <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
          Financial Ledger Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {financeChartData.map((item) => (
            <div key={item.name} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card">
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">{item.name}</div>
              <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
                ${item.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
