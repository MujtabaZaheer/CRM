import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Navigate } from "react-router-dom";
import { db, functions } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { AppUser, UserRole, ROLE_LABELS } from "../types/role";
import { ShieldCheck, UserCog, UserCheck, ShieldAlert } from "lucide-react";

export const Users: React.FC = () => {
  const { appUser } = useAuth();
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // Route Guard: Platform Super Admin & Organization Admin
  const isAuthorized = appUser?.role === "platform_super_admin" || appUser?.role === "org_admin";

  useEffect(() => {
    const usersCollection = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersCollection,
      (snapshot) => {
        const list: AppUser[] = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as AppUser[];
        setUsersList(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (appUser && !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUid(userId);
    try {
      const updateUserAccess = httpsCallable(functions, "updateUserAccess");
      await updateUserAccess({ userId, role: newRole });
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Permission denied or error updating user role.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const OFFICES = ["Toronto Office", "Vancouver Office", "London Office", "Sydney Office", "Delhi Office"];
  const TEAMS = ["North America Team", "Europe Team", "Asia-Pacific Team", "Americas Team"];

  const handleOfficeChange = async (userId: string, newOffice: string) => {
    setUpdatingUid(userId);
    try {
      const updateUserAccess = httpsCallable(functions, "updateUserAccess");
      await updateUserAccess({ userId, office: newOffice || null });
    } catch (err) {
      console.error("Failed to update office:", err);
      alert("Permission denied or error updating office.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleTeamChange = async (userId: string, newTeam: string) => {
    setUpdatingUid(userId);
    try {
      const updateUserAccess = httpsCallable(functions, "updateUserAccess");
      await updateUserAccess({ userId, team: newTeam || null });
    } catch (err) {
      console.error("Failed to update team:", err);
      alert("Permission denied or error updating team.");
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Admin Control — View user directory and assign active system roles
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Office</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    Loading directory from Firestore...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    No registered user accounts found.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.uid} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)] flex items-center space-x-3">
                      <div className="w-8 h-8 sq-avatar bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] text-xs">
                        {u.role === "platform_super_admin" ? (
                          <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        ) : u.role === "org_admin" ? (
                          <UserCheck className="w-4 h-4 text-teal-400" />
                        ) : (
                          <UserCog className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                      </div>
                      <div>
                        <span>{u.displayName || "Unnamed User"}</span>
                        {u.uid === appUser?.uid && (
                          <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 sq-badge font-medium">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        disabled={updatingUid === u.uid}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
                      >
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                          <option key={r} value={r} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.office || ""}
                        disabled={updatingUid === u.uid}
                        onChange={(e) => handleOfficeChange(u.uid, e.target.value)}
                        className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="" className="bg-[var(--bg-card)] text-[var(--text-muted)]">Unassigned</option>
                        {OFFICES.map((o) => (
                          <option key={o} value={o} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.team || ""}
                        disabled={updatingUid === u.uid}
                        onChange={(e) => handleTeamChange(u.uid, e.target.value)}
                        className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="" className="bg-[var(--bg-card)] text-[var(--text-muted)]">Unassigned</option>
                        {TEAMS.map((t) => (
                          <option key={t} value={t} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--text-muted)]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
