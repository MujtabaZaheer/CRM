import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { AppUser, UserRole, ROLE_LABELS } from "../types/role";
import { ShieldCheck, UserCog } from "lucide-react";

export const Users: React.FC = () => {
  const { appUser } = useAuth();
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // Route Guard: Organization Admin only
  if (appUser && appUser.role !== "org_admin") {
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
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        </div>
        <p className="text-sm text-slate-500">
          Organization Admin panel — manage system user accounts and roles
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Loading users list...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No users registered in system.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center space-x-2">
                      <UserCog className="w-4 h-4 text-slate-400" />
                      <span>{u.displayName || "Unnamed User"}</span>
                      {u.uid === appUser?.uid && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        disabled={updatingUid === u.uid}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-50"
                      >
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
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
