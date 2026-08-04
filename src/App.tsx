import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Leads } from "./pages/Leads";
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
              <Route path="/users" element={<Users />} />
              <Route path="/super-admin" element={<SuperAdmin />} />

              {/* Modules — Under Construction Stubs */}
              <Route
                path="/students"
                element={
                  <StubPage
                    title="Students"
                    description="Student record profiles, academic background, and enrolment history."
                  />
                }
              />
              <Route
                path="/applications"
                element={
                  <StubPage
                    title="Applications"
                    description="University application submission tracking and offer management."
                  />
                }
              />
              <Route
                path="/documents"
                element={
                  <StubPage
                    title="Documents"
                    description="Student document vault, OCR processing, and verification checklist."
                  />
                }
              />
              <Route
                path="/programme-search"
                element={
                  <StubPage
                    title="Programme Search"
                    description="Global university course directory and entry requirement finder."
                  />
                }
              />
              <Route
                path="/communications"
                element={
                  <StubPage
                    title="Communications"
                    description="Unified omnichannel messaging inbox (Email, WhatsApp, SMS)."
                  />
                }
              />
              <Route
                path="/universities"
                element={
                  <StubPage
                    title="Universities & Courses"
                    description="Partner university profiles, commission structures, and course mapping."
                  />
                }
              />
              <Route
                path="/agents"
                element={
                  <StubPage
                    title="Agents & Partners"
                    description="Sub-agent network directory, performance analytics, and payouts."
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <StubPage
                    title="Reports"
                    description="Executive analytics, conversion funnels, and performance reporting."
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
