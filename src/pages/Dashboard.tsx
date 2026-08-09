import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { Lead } from "../types/lead";
import { Student } from "../types/student";
import { Application } from "../types/application";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Users2, GraduationCap, FileText, TrendingUp, Filter, RotateCcw } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { appUser } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // Filters
  const [stageFilter, setStageFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  useEffect(() => {
    const unsubLeads = onSnapshot(collection(db, "leads"), (snap) => {
      const docs: Lead[] = [];
      snap.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Lead));
      setLeads(docs);
    });

    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      const docs: Student[] = [];
      snap.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Student));
      setStudents(docs);
    });

    const unsubApps = onSnapshot(collection(db, "applications"), (snap) => {
      const docs: Application[] = [];
      snap.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as Application));
      setApplications(docs);
    });

    return () => {
      unsubLeads();
      unsubStudents();
      unsubApps();
    };
  }, []);

  const roleHome: Partial<Record<NonNullable<typeof appUser>["role"], string>> = {
    team_leader: "/team-leader/dashboard",
    finance_officer: "/finance/dashboard",
    visa_officer: "/visa-officer/dashboard",
    student: "/student/dashboard",
    support_user: "/support/dashboard",
    external_agent: "/agent/dashboard",
    university_partner: "/university/dashboard",
  };

  const destination = appUser?.role ? roleHome[appUser.role] : undefined;
  if (destination) return <Navigate to={destination} replace />;

  if (appUser?.role === "admissions_officer") {
    return <Navigate to="/admissions/dashboard" replace />;
  }

  if (appUser?.role === "finance_officer") {
    return <Navigate to="/finance/dashboard" replace />;
  }

  if (appUser?.role === "support_user") {
    return <Navigate to="/support/dashboard" replace />;
  }

  if (appUser?.role === "auditor" || appUser?.role === "compliance_officer") {
    return <Navigate to="/auditor/dashboard" replace />;
  }

  if (appUser?.role === "platform_super_admin") {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  const filteredLeads = leads.filter((l) => {
    const matchesStage = stageFilter === "All" || l.stage === stageFilter;
    const matchesSource = sourceFilter === "All" || l.source === sourceFilter;
    return matchesStage && matchesSource;
  });

  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter((l) => l.stage === "Converted").length;

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Executive Dashboard</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Multi-tenant recruitment funnel, student conversion rates, and live operational metrics.
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-400 ml-1.5" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none"
            >
              <option value="All" className="bg-[var(--bg-card)]">All Stages</option>
              <option value="New" className="bg-[var(--bg-card)]">New</option>
              <option value="Counselling" className="bg-[var(--bg-card)]">Counselling</option>
              <option value="Converted" className="bg-[var(--bg-card)]">Converted</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none border-l border-[var(--border-default)] pl-2"
            >
              <option value="All" className="bg-[var(--bg-card)]">All Sources</option>
              <option value="Website" className="bg-[var(--bg-card)]">Website</option>
              <option value="Referral" className="bg-[var(--bg-card)]">Referral</option>
              <option value="Walk-in" className="bg-[var(--bg-card)]">Walk-in</option>
            </select>
            {(stageFilter !== "All" || sourceFilter !== "All") && (
              <button
                onClick={() => {
                  setStageFilter("All");
                  setSourceFilter("All");
                }}
                className="p-1 hover:text-emerald-400"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span>Total Lead Inquiries</span>
              <Users2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">{totalLeads}</div>
            <div className="text-[10px] text-emerald-400 font-medium">Filtered lead count</div>
          </div>

          <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span>Enrolled Students</span>
              <GraduationCap className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">{students.length}</div>
            <div className="text-[10px] text-teal-400 font-medium">Active student profiles</div>
          </div>

          <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span>Active Applications</span>
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">{applications.length}</div>
            <div className="text-[10px] text-sky-400 font-medium">University submissions</div>
          </div>

          <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span>Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">
              {totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0}%
            </div>
            <div className="text-[10px] text-amber-400 font-medium">Converted to enrolment</div>
          </div>
        </div>
      </div>
    </RoleGate>
  );
};
