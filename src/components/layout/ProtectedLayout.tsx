import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { requiresVerifiedEmail } from "../../firebase/config";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Loader2 } from "lucide-react";
import { getRoleBackground } from "../../utils/roleBackgrounds";

export const ProtectedLayout: React.FC = () => {
  const { appUser, firebaseUser, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Loading EduCRM Platform...</p>
        </div>
      </div>
    );
  }

  if (!appUser) {
    return <Navigate to="/login" replace />;
  }

  // Security Guard: Unverified students cannot access any protected internal route
  if (appUser.role === "student" && requiresVerifiedEmail && firebaseUser && !firebaseUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  const roleBackground = getRoleBackground(appUser.role);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans relative overflow-x-hidden">
      {/* Role-Specific Atmospheric Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-[0.07] dark:opacity-[0.06]"
        style={{ backgroundImage: `url('${roleBackground}')` }}
      />
      {/* Ambient Gradient Highlights */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            collapsed ? "lg:ml-16" : "lg:ml-64"
          }`}
        >
          <Topbar setMobileOpen={setMobileOpen} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in relative">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
