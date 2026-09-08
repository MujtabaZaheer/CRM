import React, { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { AppUser, UserRole, ROLE_LABELS } from "../types/role";
import { ShieldCheck, UserCog, UserCheck, ShieldAlert, Plus, Lock, Search } from "lucide-react";
import { provisionStaffUser, updateStaffPassword, generateStrongPassword } from "../utils/staffProvisioner";

export const Users: React.FC = () => {
  const { appUser } = useAuth();
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Provision Staff Account Modal State
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("Edu-Pass2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>("counsellor");
  const [newOffice, setNewOffice] = useState("London HQ");
  const [newTeam, setNewTeam] = useState("Global Team");
  const [provisioning, setProvisioning] = useState(false);

  // Password Reset Modal State
  const [passwordUserUid, setPasswordUserUid] = useState<string | null>(null);
  const [passwordUserEmail, setPasswordUserEmail] = useState<string>("");
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

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
      await updateDoc(doc(db, "users", userId), { role: newRole, updatedAt: Date.now() });
      setNotice(`Assigned role ${ROLE_LABELS[newRole]} to user.`);
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Permission denied or error updating user role.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const OFFICES = [
    "London HQ",
    "Manchester Branch",
    "Toronto Office",
    "Vancouver Office",
    "Sydney Centre",
    "Delhi Hub",
    "Dubai Office"
  ];
  const TEAMS = [
    "Global Team",
    "North America Team",
    "Europe Team",
    "Asia-Pacific Team",
    "Americas Team"
  ];

  const handleOfficeChange = async (userId: string, newOffice: string) => {
    setUpdatingUid(userId);
    try {
      await updateDoc(doc(db, "users", userId), { office: newOffice || null, updatedAt: Date.now() });
      setNotice(`Updated office assignment.`);
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
      await updateDoc(doc(db, "users", userId), { team: newTeam || null, updatedAt: Date.now() });
      setNotice(`Updated team assignment.`);
    } catch (err) {
      console.error("Failed to update team:", err);
      alert("Permission denied or error updating team.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    setProvisioning(true);
    try {
      const newStaff = await provisionStaffUser({
        displayName: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        office: newOffice,
        team: newTeam,
        actorEmail: appUser?.email || "Organization Admin",
        actorRole: appUser?.role || "org_admin",
      });
      setUsersList((prev) => [newStaff, ...prev.filter((u) => u.email !== newStaff.email)]);
      setNotice(`Successfully provisioned ${ROLE_LABELS[newRole]} account for ${newEmail} with custom password.`);
      setShowProvisionModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword(generateStrongPassword());
      setNewRole("counsellor");
    } catch (err: any) {
      setNotice(`Failed to provision user: ${err.message}`);
    } finally {
      setProvisioning(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUserUid || !newPasswordInput) return;
    setUpdatingPassword(true);
    try {
      await updateStaffPassword(
        passwordUserUid,
        newPasswordInput,
        appUser?.email || "Organization Admin",
        appUser?.role || "org_admin"
      );
      setNotice(`Secure password reset email dispatched to ${passwordUserEmail}. Plaintext credentials are never stored.`);
      setPasswordUserUid(null);
      setNewPasswordInput("");
    } catch (err: any) {
      setNotice(`Failed to send password reset: ${err.message}`);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const filteredUsers = usersList.filter((u) =>
    `${u.displayName || ""} ${u.email || ""} ${ROLE_LABELS[u.role] || u.role} ${u.office || ""} ${u.team || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Organization Admin Control — Provision internal staff accounts, set passwords, and manage role permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewPassword(generateStrongPassword());
              setShowProvisionModal(true);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Staff Account</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-between text-xs">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name, email, role, office..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
        />
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
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    Loading directory from Firestore...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    No user accounts match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
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
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] text-xs">{u.email}</td>
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
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setPasswordUserUid(u.uid);
                          setPasswordUserEmail(u.email);
                          setNewPasswordInput(generateStrongPassword());
                        }}
                        className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded hover:bg-amber-500/20 flex items-center gap-1 ml-auto text-xs cursor-pointer"
                        title="Set or reset account password"
                      >
                        <Lock className="w-3 h-3" /> Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PROVISION STAFF ACCOUNT */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleProvisionSubmit}
            className="w-full max-w-lg p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-2xl"
          >
            <div>
              <h2 className="font-bold text-base text-[var(--text-primary)]">
                Provision Internal Staff Account
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Set credentials and role permissions for non-signup staff members.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                Staff Full Name *
              </label>
              <input
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                Staff Email Address *
              </label>
              <input
                required
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. sarah.jenkins@educrm.app"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Set Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Account Password *
                </label>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateStrongPassword())}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  Generate Strong Password
                </button>
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full p-2.5 pr-20 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                The staff member can log in directly using this password.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                  Assign System Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
                >
                  <option value="counsellor">Education Counsellor</option>
                  <option value="team_leader">Branch Team Leader</option>
                  <option value="admissions_officer">Admissions Officer</option>
                  <option value="finance_officer">Finance Officer</option>
                  <option value="auditor">Auditor &amp; Compliance</option>
                  <option value="support_user">Support Specialist</option>
                  <option value="visa_officer">Visa Officer</option>
                  <option value="external_agent">External Agent</option>
                  <option value="university_partner">University Partner</option>
                  <option value="office_manager">Office Manager</option>
                  <option value="org_admin">Organization Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                  Assigned Branch / Office
                </label>
                <select
                  value={newOffice}
                  onChange={(e) => setNewOffice(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
                >
                  {OFFICES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                Assigned Team
              </label>
              <select
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              >
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={provisioning || !newName || !newEmail || !newPassword}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {provisioning ? "Provisioning..." : "Create Staff Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: RESET / CHANGE PASSWORD */}
      {passwordUserUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handlePasswordResetSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-2xl"
          >
            <div>
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" /> Reset User Password
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Set a new password for <strong className="text-[var(--text-primary)]">{passwordUserEmail}</strong>.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  New Password *
                </label>
                <button
                  type="button"
                  onClick={() => setNewPasswordInput(generateStrongPassword())}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  Generate Strong Password
                </button>
              </div>
              <div className="relative">
                <input
                  required
                  type={showPasswordInput ? "text" : "password"}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter minimum 6 characters"
                  className="w-full p-2.5 pr-20 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute right-2.5 top-2.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium cursor-pointer"
                >
                  {showPasswordInput ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setPasswordUserUid(null);
                  setNewPasswordInput("");
                }}
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingPassword || !newPasswordInput}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {updatingPassword ? "Updating..." : "Save Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

