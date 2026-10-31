import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePortalData } from "../../hooks/usePortalData";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Sparkles,
  FileText,
  FolderOpen,
  Award,
  CheckSquare,
  MessageSquare,
  Calendar,
  UserCheck,
  ReceiptText,
  Sliders,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Search,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

interface StudentNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { label: "Overview", path: "/student/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Find Universities", path: "/student/universities", icon: <Building2 className="w-4 h-4" /> },
  { label: "Explore Programmes", path: "/student/programs", icon: <BookOpen className="w-4 h-4" /> },
  {
    label: "AI Study Match",
    path: "/student/ai-match",
    icon: <Sparkles className="w-4 h-4 text-teal-400" />,
    badge: "AI",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  },
  { label: "My Applications", path: "/student/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Document Vault", path: "/student/documents", icon: <FolderOpen className="w-4 h-4" /> },
  {
    label: "Scholarships",
    path: "/student/scholarships",
    icon: <Award className="w-4 h-4 text-amber-400" />,
    badge: "New",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  { label: "Tasks & Deadlines", path: "/student/tasks", icon: <CheckSquare className="w-4 h-4" /> },
  { label: "Messages & Support", path: "/student/messages", icon: <MessageSquare className="w-4 h-4 text-emerald-400" /> },
  { label: "Appointments", path: "/student/appointments", icon: <Calendar className="w-4 h-4 text-sky-400" /> },
  { label: "Fee Invoices", path: "/student/invoices", icon: <ReceiptText className="w-4 h-4" /> },
  { label: "My Profile", path: "/student/profile", icon: <UserCheck className="w-4 h-4" /> },
  { label: "Settings", path: "/student/settings", icon: <Sliders className="w-4 h-4" /> },
];

export const StudentPortalLayout: React.FC = () => {
  const { appUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { ownStudent } = usePortalData();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const studentName = ownStudent?.fullName || appUser?.displayName || "Student";
  const studentEmail = ownStudent?.email || appUser?.email || "";
  const completeness = ownStudent?.profileCompleteness ?? 100;

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/programs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-main text-primary flex flex-col font-sans relative overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      {/* Premium Ambient Lighting Gradients */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 flex min-h-screen">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-main/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* ========================================================================= */}
        {/* STUDENT DEDICATED SIDEBAR                                                 */}
        {/* ========================================================================= */}
        <aside
          className={`fixed top-0 left-0 z-50 h-screen bg-surface/95 border-r border-default/80 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between
            ${collapsed ? "w-20" : "w-64"}
            ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Top Logo & Student Brand */}
          <div className="p-4 border-b border-default/80 flex items-center justify-between">
            <Link to="/student/dashboard" className="flex items-center space-x-3 overflow-hidden group">
              <div className="w-9 h-9 bg-gradient-to-tr from-teal-400 via-emerald-500 to-indigo-600 rounded-xl flex items-center justify-center text-on-accent shadow-md shadow-teal-500/25 flex-shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              {!collapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-black text-sm text-primary tracking-tight">
                      EduBridge<span className="text-teal-400">.AI</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-400/90 uppercase tracking-wider block">
                    Student Portal
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle / Mobile close */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 text-muted hover:text-primary rounded-lg hover:bg-elevated"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1.5 text-muted hover:text-primary hover:bg-elevated rounded-lg transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Student Navigation Items */}
          <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {STUDENT_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/student/dashboard" && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative
                    ${
                      isActive
                        ? "bg-gradient-to-r from-teal-500/20 to-indigo-500/10 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10 font-bold"
                        : "text-muted hover:text-primary hover:bg-elevated/60 border border-transparent"
                    }
                  `}
                >
                  <span className={`flex-shrink-0 ${isActive ? "text-teal-400" : "text-muted group-hover:text-teal-300 transition-colors"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor || "bg-elevated text-secondary border-default"}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface text-primary text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-default">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Sidebar: Counsellor Support Widget & User Dossier */}
          <div className="p-3 border-t border-default/80 space-y-3">
            {!collapsed ? (
              <>
                {/* Direct Counsellor Connection Card */}
                <div className="p-3 bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-900 rounded-2xl border border-default/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Assigned Counsellor
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold">Online</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                      SJ
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-primary truncate">Sarah Jenkins</div>
                      <div className="text-[10px] text-muted truncate">UK Admissions Lead</div>
                    </div>
                  </div>
                  <Link
                    to="/student/messages"
                    className="w-full py-1.5 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 rounded-xl text-[11px] font-bold text-teal-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat with Sarah</span>
                  </Link>
                </div>

                {/* Profile Avatar Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-7 h-7 rounded-full bg-elevated border border-default flex items-center justify-center text-xs font-bold text-teal-400 flex-shrink-0">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate leading-tight">
                      <div className="text-xs font-bold text-secondary truncate">{studentName}</div>
                      <div className="text-[10px] text-placeholder truncate">{studentEmail}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-muted hover:text-rose-400 hover:bg-elevated rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Link
                  to="/student/messages"
                  title="Chat with Counsellor"
                  className="p-2 text-teal-400 hover:bg-elevated rounded-xl transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-muted hover:text-rose-400 hover:bg-elevated rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN CONTENT AREA & STUDENT TOPBAR                                        */}
        {/* ========================================================================= */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            collapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          {/* Topbar */}
          <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-default/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
            {/* Left: Mobile trigger & Global search */}
            <div className="flex items-center space-x-3 flex-1 max-w-lg">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-muted hover:text-primary p-2 rounded-xl hover:bg-elevated"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Student Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                <input
                  type="text"
                  placeholder="Search programmes, universities, scholarships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-main/70 border border-default rounded-xl text-xs text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                />
              </form>
            </div>

            {/* Right: Actions, Public Portal Link, Notifications & Profile */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              {/* Intake Ticker Alert Pill */}
              <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-[11px] text-teal-300">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Fall 2026 Admissions Open: £15M+ Available</span>
              </div>

              {/* View Public Portal */}
              <Link
                to="/"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-elevated hover:bg-elevated text-secondary border border-default/80 rounded-xl text-xs font-semibold transition-all"
                title="View Public Discovery Landing"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden md:inline">Public Portal</span>
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-muted hover:text-primary hover:bg-elevated rounded-xl transition-colors"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-secondary" />}
              </button>

              {/* Profile Health Indicator */}
              <Link
                to="/student/profile"
                className="flex items-center gap-2.5 pl-2 border-l border-default group"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-primary shadow">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                  {completeness === 100 && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 bg-surface rounded-full absolute -bottom-0.5 -right-0.5" />
                  )}
                </div>
                <div className="hidden sm:block text-left leading-tight truncate">
                  <div className="text-xs font-bold text-primary group-hover:text-teal-300 transition-colors truncate">
                    {studentName}
                  </div>
                  <div className="text-[10px] text-teal-400 font-medium">
                    {completeness}% Profile Done
                  </div>
                </div>
              </Link>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in relative">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
