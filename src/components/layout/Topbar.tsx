import React from "react";
import { signOut } from "firebase/auth";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { auth } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_LABELS } from "../../types/role";

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setMobileOpen }) => {
  const { firebaseUser, appUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const roleLabel = appUser?.role ? ROLE_LABELS[appUser.role] : "User";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
          Education Operations Portal
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* User Info Badge */}
        <div className="flex items-center space-x-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium text-xs">
            {appUser?.displayName ? appUser.displayName[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {appUser?.displayName || firebaseUser?.email}
            </p>
            <p className="text-[10px] text-indigo-600 font-medium leading-tight">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
