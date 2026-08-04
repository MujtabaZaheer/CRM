import React from "react";
import { signOut } from "firebase/auth";
import { Menu, LogOut, Shield, User as UserIcon, Sun, Moon } from "lucide-react";
import { auth } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ROLE_LABELS } from "../../types/role";

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setMobileOpen }) => {
  const { firebaseUser, appUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const roleLabel = appUser?.role ? ROLE_LABELS[appUser.role] : "User";
  const isSuperAdmin = appUser?.role === "platform_super_admin";

  return (
    <header className="h-16 bg-zinc-900 dark:bg-zinc-900 border-b border-zinc-800 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <h1 className="font-heading font-semibold text-lg text-zinc-100 hidden sm:block">
            Education Operations Portal
          </h1>
          {isSuperAdmin && (
            <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              <span>Super Admin Mode</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* User Info Badge */}
        <div className="flex items-center space-x-3 px-3 py-1.5 bg-zinc-950/60 border border-zinc-800 rounded-full">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
            {appUser?.displayName ? appUser.displayName[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-zinc-200 leading-tight">
              {appUser?.displayName || firebaseUser?.email}
            </p>
            <p className="text-[10px] text-teal-400 font-medium leading-tight">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-zinc-800 hover:border-rose-500/20"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
