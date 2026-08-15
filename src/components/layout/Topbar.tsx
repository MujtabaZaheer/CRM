import React from "react";
import { Menu, LogOut, Sun, Moon, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

import { GlobalSearch } from "../common/GlobalSearch";
import { NotificationBell } from "../common/NotificationBell";

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setMobileOpen }) => {
  const { appUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
    </header>
  );
};
