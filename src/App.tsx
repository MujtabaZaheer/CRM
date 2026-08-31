import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AcceptInvitation } from "./pages/AcceptInvitation";
import { PublicFormPage } from "./pages/PublicFormPage";
import { PublicFormSuccess } from "./pages/PublicFormSuccess";
import { StudentRegister } from "./pages/StudentRegister";
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
import { ProgrammeSearch } from "./pages/ProgrammeSearch";
import { Communications } from "./pages/Communications";
import { CalendarPage } from "./pages/Calendar";
import { ReportsPage } from "./pages/Reports";
import { EmailTemplatesPage } from "./pages/EmailTemplates";
import { FormBuilderPage } from "./pages/FormBuilder";
import { LeadRoutingConfigPage } from "./pages/LeadRoutingConfig";
import { LeadScoringConfigPage } from "./pages/LeadScoringConfig";
import { WorkflowRulesConfigPage } from "./pages/WorkflowRulesConfig";
import { CommissionManagerPage } from "./pages/CommissionManager";
import { StudentProfileSelfEdit } from "./pages/portal/StudentProfileSelfEdit";
import { StudentNewApplication } from "./pages/portal/StudentNewApplication";
import { AgentSubAgentManager } from "./pages/portal/AgentSubAgentManager";
import { AgentsPage } from "./pages/Agents";
import { DataQualityPage } from "./pages/DataQualityDashboard";
import { ImportExportPage } from "./pages/ImportExport";
import { MasterDataConfigPage } from "./pages/MasterDataConfig";
import { TeamLeaderRoute } from "./components/layout/TeamLeaderRoute";
import { AdmissionsRoute } from "./components/layout/AdmissionsRoute";
import { CounsellorRoute } from "./components/layout/CounsellorRoute";
import { FinanceRoute } from "./components/layout/FinanceRoute";
import { SupportRoute } from "./components/layout/SupportRoute";
import { AuditorRoute } from "./components/layout/AuditorRoute";
import { SuperAdminRoute } from "./components/layout/SuperAdminRoute";
import { RoleRoute } from "./components/layout/RoleRoute";
import { RolePortal } from "./components/portal/RolePortal";

// Support Module Imports
import { SupportDashboard } from "./pages/support/Dashboard";
import { SupportTicketsPage } from "./pages/support/Tickets";
import { SupportCreateTicketPage } from "./pages/support/CreateTicket";
import { SupportKnowledgeBasePage } from "./pages/support/KnowledgeBase";
import { SupportReportsPage } from "./pages/support/Reports";
import { SupportNotificationsPage } from "./pages/support/Notifications";

// Auditor Module Imports
import { AuditorDashboard } from "./pages/auditor/Dashboard";
import { AuditorAuditTrailPage } from "./pages/auditor/AuditTrail";
import { AuditorComplianceInspectPage } from "./pages/auditor/ComplianceInspect";
import { AuditorSystemLogsPage } from "./pages/auditor/SystemLogs";
import { AuditorReportsPage } from "./pages/auditor/Reports";
import { AuditorNotificationsPage } from "./pages/auditor/Notifications";

// Super Admin Module Imports
import { SuperAdminDashboardPage } from "./pages/superadmin/Dashboard";
import { SuperAdminTenantsPage } from "./pages/superadmin/Tenants";
import { SuperAdminUsersPage } from "./pages/superadmin/Users";
import { SuperAdminSystemHealthPage } from "./pages/superadmin/SystemHealth";
import { SuperAdminGlobalSettingsPage } from "./pages/superadmin/GlobalSettings";
import { SuperAdminAuditLogsPage } from "./pages/superadmin/AuditLogs";
import { SuperAdminNotificationsPage } from "./pages/superadmin/Notifications";

// Agent Module Imports
import { AgentDashboardPage } from "./pages/agent/Dashboard";
import { AgentReferralsPage } from "./pages/agent/Referrals";
import { AgentReferLeadPage } from "./pages/agent/ReferLead";
import { AgentCommissionsPage } from "./pages/agent/Commissions";
import { AgentNotificationsPage } from "./pages/agent/Notifications";

// University Module Imports
import { UniversityDashboardPage } from "./pages/university/Dashboard";
import { UniversityApplicationsPage } from "./pages/university/Applications";
import { UniversityCASIssuancePage } from "./pages/university/CASIssuance";
import { UniversityNotificationsPage } from "./pages/university/Notifications";

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
import { NotificationProvider } from "./contexts/NotificationProvider";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GlobalDataProvider>
          <NotificationProvider>
            <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/student-register" element={<StudentRegister />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />

              {/* Public Form Routes (Unauthenticated) */}
              <Route path="/public/forms/:formId" element={<PublicFormPage />} />
              <Route path="/public/form-success" element={<PublicFormSuccess />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/students" element={<Students />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/universities" element={<Universities />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/users" element={<Users />} />

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

                {/* Support Module Routes */}
                <Route path="/support" element={<SupportRoute />}>
                  <Route path="dashboard" element={<SupportDashboard />} />
                  <Route path="tickets" element={<SupportTicketsPage />} />
                  <Route path="create-ticket" element={<SupportCreateTicketPage />} />
                  <Route path="knowledge-base" element={<SupportKnowledgeBasePage />} />
                  <Route path="reports" element={<SupportReportsPage />} />
                  <Route path="notifications" element={<SupportNotificationsPage />} />
                </Route>

                {/* Auditor Module Routes */}
                <Route path="/auditor" element={<AuditorRoute />}>
                  <Route path="dashboard" element={<AuditorDashboard />} />
                  <Route path="audit-trail" element={<AuditorAuditTrailPage />} />
                  <Route path="compliance-inspect" element={<AuditorComplianceInspectPage />} />
                  <Route path="system-logs" element={<AuditorSystemLogsPage />} />
                  <Route path="reports" element={<AuditorReportsPage />} />
                  <Route path="notifications" element={<AuditorNotificationsPage />} />
                </Route>

                {/* Super Admin Module Routes */}
                <Route path="/super-admin" element={<SuperAdminRoute />}>
                  <Route path="dashboard" element={<SuperAdminDashboardPage />} />
                  <Route path="tenants" element={<SuperAdminTenantsPage />} />
                  <Route path="users" element={<SuperAdminUsersPage />} />
                  <Route path="system-health" element={<SuperAdminSystemHealthPage />} />
                  <Route path="global-settings" element={<SuperAdminGlobalSettingsPage />} />
                  <Route path="audit-logs" element={<SuperAdminAuditLogsPage />} />
                  <Route path="notifications" element={<SuperAdminNotificationsPage />} />
                </Route>

                {/* Visa Officer Module Routes (Added by Saad) */}
                <Route path="/visa-officer" element={<RoleRoute role="visa_officer" />}>
                  <Route path="dashboard" element={<RolePortal role="visa" page="dashboard" />} />
                  <Route path="cases" element={<RolePortal role="visa" page="cases" />} />
                  <Route path="documents" element={<RolePortal role="visa" page="documents" />} />
                  <Route path="tasks" element={<RolePortal role="visa" page="tasks" />} />
                  <Route path="notifications" element={<RolePortal role="visa" page="notifications" />} />
                </Route>

                {/* Student Portal Routes (Added by Saad) */}
                <Route path="/student" element={<RoleRoute role="student" />}>
                  <Route path="dashboard" element={<RolePortal role="student" page="dashboard" />} />
                  <Route path="profile" element={<RolePortal role="student" page="profile" />} />
                  <Route path="applications" element={<RolePortal role="student" page="applications" />} />
                  <Route path="documents" element={<RolePortal role="student" page="documents" />} />
                  <Route path="requests" element={<RolePortal role="student" page="requests" />} />
                  <Route path="tasks" element={<RolePortal role="student" page="tasks" />} />
                  <Route path="new-application" element={<StudentNewApplication />} />
                </Route>

                {/* External Agent Portal Routes */}
                <Route path="/agent" element={<RoleRoute role="external_agent" />}>
                  <Route path="dashboard" element={<AgentDashboardPage />} />
                  <Route path="referrals" element={<AgentReferralsPage />} />
                  <Route path="refer-lead" element={<AgentReferLeadPage />} />
                  <Route path="commissions" element={<AgentCommissionsPage />} />
                  <Route path="notifications" element={<AgentNotificationsPage />} />
                </Route>

                {/* University Partner Portal Routes */}
                <Route path="/university" element={<RoleRoute role="university_partner" />}>
                  <Route path="dashboard" element={<UniversityDashboardPage />} />
                  <Route path="applications" element={<UniversityApplicationsPage />} />
                  <Route path="cas-issuance" element={<UniversityCASIssuancePage />} />
                  <Route path="notifications" element={<UniversityNotificationsPage />} />
                </Route>

                {/* Modules — Under Construction Stubs (Phase 2 & 3 in PDF) */}
                <Route
                  path="/programme-search"
                  element={<ProgrammeSearch />}
                />
                <Route path="/email-templates" element={<EmailTemplatesPage />} />
                <Route path="/form-builder" element={<FormBuilderPage />} />
                <Route path="/lead-routing" element={<LeadRoutingConfigPage />} />
                <Route path="/lead-scoring" element={<LeadScoringConfigPage />} />
                <Route path="/workflow-rules" element={<WorkflowRulesConfigPage />} />
                <Route path="/commission-manager" element={<CommissionManagerPage />} />
                <Route path="/student-portal/profile" element={<StudentProfileSelfEdit />} />
                <Route path="/agent-portal/sub-agents" element={<AgentSubAgentManager />} />
                <Route
                  path="/communications"
                  element={<Communications />}
                />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/data-quality" element={<DataQualityPage />} />
                <Route path="/import-export" element={<ImportExportPage />} />
                <Route path="/master-data" element={<MasterDataConfigPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </NotificationProvider>
        </GlobalDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
