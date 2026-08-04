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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
