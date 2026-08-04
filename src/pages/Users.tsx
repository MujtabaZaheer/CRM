import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db } from "../firebase/config";
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

  if (appUser && !isAuthorized) {
    return <Navigate to="/" replace />;
  }

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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUid(userId);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Permission denied or error updating user role.");
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
          <h1 className="font-heading text-2xl font-bold text-white">User Management</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Admin Control — View user directory and assign active system roles
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Loading directory from Firestore...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    No registered user accounts found.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.uid} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 text-xs">
                        {u.role === "platform_super_admin" ? (
                          <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        ) : u.role === "org_admin" ? (
                          <UserCheck className="w-4 h-4 text-teal-400" />
                        ) : (
                          <UserCog className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <span>{u.displayName || "Unnamed User"}</span>
                        {u.uid === appUser?.uid && (
                          <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        disabled={updatingUid === u.uid}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
                      >
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500">
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
