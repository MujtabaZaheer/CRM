import React, { useState } from "react";
import { Menu, LogOut, Sun, Moon, Shield, Sparkles, ShieldCheck, FileText, Database } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useNavigate } from "react-router-dom";

import { GlobalSearch } from "../common/GlobalSearch";
import { NotificationBell } from "../common/NotificationBell";
import { BranchSwitcher } from "./BranchSwitcher";
import { CourseRecommendationModal } from "../ai/CourseRecommendationModal";
import { VisaProbabilityModal } from "../ai/VisaProbabilityModal";
import { DocumentExtractionModal } from "../ai/DocumentExtractionModal";
import { PersonalStatementModal } from "../ai/PersonalStatementModal";
import { ApplicationReadinessModal } from "../ai/ApplicationReadinessModal";

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setMobileOpen }) => {
  const { appUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showDemoData, toggleDemoData } = useGlobalData();
  const navigate = useNavigate();

  const [showAiMenu, setShowAiMenu] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [visaModalOpen, setVisaModalOpen] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [sopModalOpen, setSopModalOpen] = useState(false);
  const [readinessModalOpen, setReadinessModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isSuperAdmin = appUser?.role === "platform_super_admin";

  return (
    <header className="h-16 bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border-default)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 sq-btn hover:bg-[var(--bg-hover)]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isSuperAdmin && (
          <div className="flex items-center space-x-2 px-3 py-1 sq-badge bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin Mode</span>
          </div>
        )}

        <GlobalSearch />
      </div>

      <div className="flex items-center space-x-3">
        {/* AI Tools Launch Button */}
        <div className="relative">
          <button
            onClick={() => setShowAiMenu(!showAiMenu)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 sq-btn text-xs font-bold transition-all shadow-sm shadow-emerald-500/10"
            title="AI Tools Engine (Gemini 2.0 Flash)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Tools</span>
          </button>

          {showAiMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 p-2 space-y-1 animate-fade-in">
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Gemini AI Suite
              </div>

              <button
                onClick={() => {
                  setShowAiMenu(false);
                  setCourseModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg text-left transition-colors"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Course Matcher</span>
              </button>

              <button
                onClick={() => {
                  setShowAiMenu(false);
                  setVisaModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-sky-500/10 hover:text-sky-400 rounded-lg text-left transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Visa Risk Calculator</span>
              </button>

              <button
                onClick={() => {
                  setShowAiMenu(false);
                  setOcrModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-purple-500/10 hover:text-purple-400 rounded-lg text-left transition-colors"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Document OCR Extractor</span>
              </button>

              <button
                onClick={() => {
                  setShowAiMenu(false);
                  setSopModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-amber-500/10 hover:text-amber-400 rounded-lg text-left transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Personal Statement Drafter</span>
              </button>

              <button
                onClick={() => {
                  setShowAiMenu(false);
                  setReadinessModalOpen(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg text-left transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Application Readiness Auditor</span>
              </button>
            </div>
          )}
        </div>

        {/* Multi-Branch Switcher */}
        <BranchSwitcher />

        {/* Demo Data Visibility Toggle */}
        <button
          onClick={toggleDemoData}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 sq-btn text-xs font-bold transition-all border ${
            showDemoData
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-sm shadow-amber-500/10"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10"
          }`}
          title={showDemoData ? "Demo Data is ON. Click to hide demo records & view live/clean data only." : "Demo Data is OFF (Clean/Live mode). Click to display demo records."}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{showDemoData ? "Demo Data: ON" : "Live Only"}</span>
        </button>

        {/* Notifications Component */}
        <NotificationBell />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] sq-btn transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-3 border-l border-[var(--border-default)] pl-3 sm:pl-4">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px]">
              {appUser?.displayName || appUser?.email || "User"}
            </div>
            <div className="text-[10px] text-teal-400 font-medium capitalize">
              {appUser?.role ? appUser.role.replace(/_/g, " ") : "Counsellor"}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-400 border border-[var(--border-default)] hover:border-rose-500/30 sq-btn text-xs font-medium transition-all"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* AI Engine Modals */}
      <CourseRecommendationModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
      />
      <VisaProbabilityModal
        isOpen={visaModalOpen}
        onClose={() => setVisaModalOpen(false)}
      />
      <DocumentExtractionModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
      />
      <PersonalStatementModal
        isOpen={sopModalOpen}
        onClose={() => setSopModalOpen(false)}
      />
      <ApplicationReadinessModal
        isOpen={readinessModalOpen}
        onClose={() => setReadinessModalOpen(false)}
      />
    </header>
  );
};
