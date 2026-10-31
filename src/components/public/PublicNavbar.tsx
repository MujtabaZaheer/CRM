import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getRoleDashboardPath } from "../../types/registrationConfig";
import {
  Sparkles,
  GraduationCap,
  Building2,
  BookOpen,
  Award,
  Compass,
  LogIn,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

export const PublicNavbar: React.FC = () => {
  const { appUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const isStaff = appUser && appUser.role !== "student";
  const isStudent = appUser && appUser.role === "student";

  const getRoleBadgeLabel = (role?: string) => {
    switch (role) {
      case "platform_super_admin":
        return "Super Admin";
      case "org_admin":
        return "Org Admin";
      case "counsellor":
        return "Education Counsellor";
      case "admissions_officer":
        return "Admissions Officer";
      case "visa_officer":
        return "Visa Officer";
      case "team_leader":
        return "Team Leader";
      case "finance_officer":
        return "Finance Officer";
      case "support_user":
        return "Support Specialist";
      case "auditor":
        return "Auditor / Compliance";
      case "external_agent":
        return "Recruitment Agent";
      case "university_partner":
        return "University Partner";
      default:
        return "Staff Member";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-main/90 backdrop-blur-xl border-b border-default/80 transition-colors">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-blue-900/40 to-teal-900/60 text-primary text-[11px] py-1.5 px-4 text-center border-b border-indigo-500/20 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>Fall 2026 Admissions Open:</span>
        </span>
        <span>Over £15M in international student scholarships & fast-track offer letters now available.</span>
        <a href="/#scholarships" className="underline hover:text-primary font-medium ml-1 hidden sm:inline">
          View Scholarships &rarr;
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-main rounded-[10px] flex items-center justify-center text-teal-300 font-extrabold text-xl">
                <GraduationCap className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-lg tracking-tight text-primary dark:text-primary text-primary">
                  EduBridge<span className="text-teal-400">.AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded-full">
                  Portal
                </span>
              </div>
              <span className="text-[10px] text-muted font-medium tracking-wide">
                AI University Admissions Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <a
              href="/#programmes"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated/60 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Programmes</span>
            </a>
            <a
              href="/#universities"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated/60 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Universities</span>
            </a>
            <a
              href="/#ai-counsellor"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated/60 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Matchmaker</span>
            </a>
            <a
              href="/#scholarships"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated/60 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scholarships</span>
            </a>
            <a
              href="/#how-it-works"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated/60 transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>How It Works</span>
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-primary hover:bg-elevated/60 rounded-lg transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-secondary" />}
            </button>

            {/* Authenticated State vs Guest State */}
            {isStaff ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden md:block">
                  <div className="text-[11px] font-bold text-primary flex items-center gap-1 justify-end">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>{appUser.displayName || appUser.email}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-medium">
                    {getRoleBadgeLabel(appUser.role)}
                  </div>
                </div>
                <button
                  onClick={() => navigate(getRoleDashboardPath(appUser.role))}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-on-accent font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Open EduCRM Desk</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : isStudent ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden md:block">
                  <div className="text-[11px] font-bold text-primary flex items-center gap-1 justify-end">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                    <span>{appUser.displayName || "Student"}</span>
                  </div>
                  <div className="text-[10px] text-teal-400 font-medium">Student Portal</div>
                </div>
                <Link
                  to="/student/dashboard"
                  className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-primary font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Dashboard</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <>
                {/* Staff / CRM Login Link */}
                <Link
                  to="/login"
                  className="px-3 py-2 bg-surface/90 hover:bg-elevated text-secondary hover:text-primary border border-default/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Sign in to internal EduCRM (Admin, Counsellors, Visa Team, Admissions)"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Staff / EduCRM</span>
                </Link>

                {/* Student Login */}
                <Link
                  to="/login"
                  className="px-3 py-2 text-secondary hover:text-primary text-xs font-semibold hover:bg-elevated/50 rounded-xl transition-colors flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Student Login</span>
                </Link>

                {/* Apply / Register CTA */}
                <Link
                  to="/student-register"
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-primary font-bold text-xs rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply with AI</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-primary rounded-lg"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-secondary hover:text-primary rounded-lg"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-main border-b border-default px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            <a
              href="/#programmes"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-secondary hover:text-primary rounded-lg hover:bg-elevated/60"
            >
              Programmes Directory
            </a>
            <a
              href="/#universities"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-secondary hover:text-primary rounded-lg hover:bg-elevated/60"
            >
              Partner Universities
            </a>
            <a
              href="/#ai-counsellor"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-secondary hover:text-primary rounded-lg hover:bg-elevated/60"
            >
              AI Admission Matchmaker
            </a>
            <a
              href="/#scholarships"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-secondary hover:text-primary rounded-lg hover:bg-elevated/60"
            >
              Scholarships
            </a>
            <a
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-secondary hover:text-primary rounded-lg hover:bg-elevated/60"
            >
              How It Works
            </a>
          </nav>

          <div className="pt-3 border-t border-default flex flex-col gap-2">
            {isStaff ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(getRoleDashboardPath(appUser.role));
                }}
                className="w-full py-2.5 px-4 bg-emerald-500 text-on-accent font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Go to EduCRM Workspace ({getRoleBadgeLabel(appUser.role)})</span>
              </button>
            ) : isStudent ? (
              <Link
                to="/student/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 bg-teal-500 text-on-accent font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Open Student Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/student-register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-indigo-600 text-primary font-bold text-xs rounded-xl text-center"
                >
                  Apply with AI (Student)
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 bg-surface border border-default text-primary text-xs font-semibold rounded-xl text-center"
                  >
                    Student Login
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1"
                  >
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>EduCRM Staff</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
