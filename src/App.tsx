import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Leads } from "./pages/Leads";
import { Students } from "./pages/Students";
import { Applications } from "./pages/Applications";
import { Documents } from "./pages/Documents";
import { Universities } from "./pages/Universities";
import { Tasks } from "./pages/Tasks";
import { AuditLogPage } from "./pages/AuditLog";
import { NotificationsPage } from "./pages/Notifications";
import { Users } from "./pages/Users";
import { SuperAdmin } from "./pages/SuperAdmin";
import { StubPage } from "./components/layout/StubPage";
import { TeamLeaderRoute } from "./components/layout/TeamLeaderRoute";
import { CounsellorRoute } from "./components/layout/CounsellorRoute";
import { FinanceRoute } from "./components/layout/FinanceRoute";
import { AdmissionsRoute } from "./components/layout/AdmissionsRoute";

// Finance Module Imports
import { FinanceDashboard } from "./pages/finance/Dashboard";
import { FinanceInvoices } from "./pages/finance/Invoices";
import { FinancePayments } from "./pages/finance/Payments";
import { FinanceRefunds } from "./pages/finance/Refunds";
import { FinanceCommissions } from "./pages/finance/Commissions";
import { FinanceReports } from "./pages/finance/Reports";
import { FinanceNotifications } from "./pages/finance/Notifications";

// Admissions Module Imports
import { AdmissionsDashboard } from "./pages/admissions/Dashboard";
import { AdmissionsApplications } from "./pages/admissions/Applications";
import { AdmissionsVerification } from "./pages/admissions/Verification";
import { AdmissionsOffers } from "./pages/admissions/Offers";
import { AdmissionsTasks } from "./pages/admissions/Tasks";
import { AdmissionsReports } from "./pages/admissions/Reports";
import { AdmissionsNotifications } from "./pages/admissions/Notifications";

// Team Leader Module Imports
import { TeamLeaderDashboard } from "./pages/teamleader/Dashboard";
import { TeamLeaderTeamMembers } from "./pages/teamleader/TeamMembers";
import { TeamLeaderApplications } from "./pages/teamleader/Applications";
import { TeamLeaderAssignApplications } from "./pages/teamleader/AssignApplications";
import { TeamLeaderTasks } from "./pages/teamleader/Tasks";
import { TeamLeaderPerformance } from "./pages/teamleader/Performance";
import { TeamLeaderReports } from "./pages/teamleader/Reports";
import { TeamLeaderNotifications } from "./pages/teamleader/Notifications";

// Counsellor Module Imports
import { CounsellorDashboard } from "./pages/counsellor/Dashboard";
import { CounsellorLeads } from "./pages/counsellor/Leads";
import { CounsellorStudents } from "./pages/counsellor/Students";
import { CounsellorApplications } from "./pages/counsellor/Applications";
import { CounsellorDocuments } from "./pages/counsellor/Documents";
import { CounsellorTasks } from "./pages/counsellor/Tasks";
import { CounsellorProgrammeMatcher } from "./pages/counsellor/ProgrammeMatcher";

import { GlobalDataProvider } from "./contexts/GlobalDataContext";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GlobalDataProvider>
          <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/students" element={<Students />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/universities" element={<Universities />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/users" element={<Users />} />
              <Route path="/super-admin" element={<SuperAdmin />} />

              {/* Team Leader Module Routes */}
              <Route path="/team-leader" element={<TeamLeaderRoute />}>
                <Route path="dashboard" element={<TeamLeaderDashboard />} />
                <Route path="team-members" element={<TeamLeaderTeamMembers />} />
                <Route path="applications" element={<TeamLeaderApplications />} />
                <Route path="assign-applications" element={<TeamLeaderAssignApplications />} />
                <Route path="tasks" element={<TeamLeaderTasks />} />
                <Route path="performance" element={<TeamLeaderPerformance />} />
                <Route path="reports" element={<TeamLeaderReports />} />
                <Route path="notifications" element={<TeamLeaderNotifications />} />
              </Route>

              {/* Finance Module Routes */}
              <Route path="/finance" element={<FinanceRoute />}>
                <Route path="dashboard" element={<FinanceDashboard />} />
                <Route path="invoices" element={<FinanceInvoices />} />
                <Route path="payments" element={<FinancePayments />} />
                <Route path="refunds" element={<FinanceRefunds />} />
                <Route path="commissions" element={<FinanceCommissions />} />
                <Route path="reports" element={<FinanceReports />} />
                <Route path="notifications" element={<FinanceNotifications />} />
              </Route>

              {/* Admissions Module Routes */}
              <Route path="/admissions" element={<AdmissionsRoute />}>
                <Route path="dashboard" element={<AdmissionsDashboard />} />
                <Route path="applications" element={<AdmissionsApplications />} />
                <Route path="verification" element={<AdmissionsVerification />} />
                <Route path="offers" element={<AdmissionsOffers />} />
                <Route path="tasks" element={<AdmissionsTasks />} />
                <Route path="reports" element={<AdmissionsReports />} />
                <Route path="notifications" element={<AdmissionsNotifications />} />
              </Route>

              {/* Counsellor Module Routes */}
              <Route path="/counsellor" element={<CounsellorRoute />}>
                <Route path="dashboard" element={<CounsellorDashboard />} />
                <Route path="leads" element={<CounsellorLeads />} />
                <Route path="students" element={<CounsellorStudents />} />
                <Route path="applications" element={<CounsellorApplications />} />
                <Route path="documents" element={<CounsellorDocuments />} />
                <Route path="tasks" element={<CounsellorTasks />} />
                <Route path="programme-matcher" element={<CounsellorProgrammeMatcher />} />
              </Route>

              {/* Modules — Under Construction Stubs (Phase 2 & 3 in PDF) */}
              <Route
                path="/programme-search"
                element={
                  <StubPage
                    title="Programme Search Engine"
                    description="Global university course finder and entry requirement matcher."
                  />
                }
              />
              <Route
                path="/communications"
                element={
                  <StubPage
                    title="Omnichannel Communications"
                    description="Unified messaging inbox (Email, WhatsApp, SMS)."
                  />
                }
              />
              <Route
                path="/agents"
                element={
                  <StubPage
                    title="Agents & Sub-Agent Network"
                    description="External agent management, referral links, and commission statements."
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <StubPage
                    title="Reports & Funnel Analytics"
                    description="Executive reporting, conversion funnels, and performance forecasts."
                  />
                }
              />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </GlobalDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
