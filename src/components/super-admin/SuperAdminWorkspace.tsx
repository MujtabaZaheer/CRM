import React, { useState } from "react";
import { useSuperAdminData } from "../../hooks/useSuperAdminData";
import { ROLE_LABELS, UserRole } from "../../types/role";
import { SubscriptionTier, TenantStatus } from "../../types/superadmin";
import {
  Activity,
  Building,
  Database,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Users
} from "lucide-react";

export type SuperAdminSubPage =
  | "dashboard"
  | "tenants"
  | "users"
  | "system-health"
  | "global-settings"
  | "audit-logs"
  | "notifications";

const StatusBadge: React.FC<{ value: TenantStatus }> = ({ value }) => {
  let color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (value === "Trial") color = "bg-sky-500/10 text-sky-400 border-sky-500/20";
  else if (value === "Suspended" || value === "Cancelled") color = "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${color}`}>{value}</span>;
};

export const SuperAdminWorkspace: React.FC<{ page: SuperAdminSubPage }> = ({ page }) => {
  const superAdmin = useSuperAdminData();
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");

  // Create Tenant Modal
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantDomain, setTenantDomain] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantTier, setTenantTier] = useState<SubscriptionTier>("Professional");

  // User Role Editing Modal
  const [editingUserUid, setEditingUserUid] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("counsellor");

  const filteredTenants = superAdmin.tenants.filter((t) =>
    `${t.name} ${t.domain} ${t.adminEmail} ${t.tier}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredUsers = superAdmin.users.filter((u) =>
    `${u.email} ${u.displayName} ${u.role}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantDomain || !tenantEmail) return;
    try {
      await superAdmin.createTenant({
        name: tenantName,
        domain: tenantDomain,
        adminEmail: tenantEmail,
        tier: tenantTier,
      });
      setNotice(`Tenant organization ${tenantName} onboarded.`);
      setShowTenantModal(false);
      setTenantName("");
      setTenantDomain("");
      setTenantEmail("");
    } catch (err: any) {
      setNotice(`Tenant onboarding failed: ${err.message}`);
    }
  };

  const handleRoleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserUid) return;
    try {
      await superAdmin.updateUserRole(editingUserUid, selectedRole);
      setNotice(`User role updated to ${ROLE_LABELS[selectedRole]}`);
      setEditingUserUid(null);
    } catch (err: any) {
      setNotice(`Role assignment failed: ${err.message}`);
    }
  };

  if (superAdmin.loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            Platform Super Admin Portal — {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Global multi-tenant system management, platform configuration, user roles, and infrastructure monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {page === "tenants" && (
            <button
              onClick={() => setShowTenantModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Onboard Tenant Org
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Root System Active</span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{superAdmin.users.length}</p>
              <span className="text-[10px] text-[var(--text-muted)]">Across 10 system roles</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>System Records</span>
                <Database className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{superAdmin.totalLeads + superAdmin.totalStudents}</p>
              <span className="text-[10px] text-[var(--text-muted)]">Live Firestore documents</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Tenant Organizations</span>
                <Building className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{Math.max(1, superAdmin.tenants.length)}</p>
              <span className="text-[10px] text-[var(--text-muted)]">Multi-tenant active</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>System Status</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">Firebase Auth & Firestore Online</span>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Platform Role Distribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
                const count = superAdmin.users.filter((u) => u.role === roleKey).length;
                return (
                  <div key={roleKey} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg space-y-1">
                    <div className="text-[11px] text-[var(--text-secondary)] font-semibold truncate">{label}</div>
                    <div className="text-xl font-bold text-[var(--text-primary)]">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TENANTS PAGE */}
      {page === "tenants" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenant organizations by name, domain..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Organization Name</th>
                  <th className="p-3">Domain</th>
                  <th className="p-3">Admin Email</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-bold text-[var(--text-primary)]">{t.name}</td>
                    <td className="p-3 text-[var(--text-secondary)] font-mono">{t.domain}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{t.adminEmail}</td>
                    <td className="p-3 font-semibold text-emerald-400">{t.tier}</td>
                    <td className="p-3">
                      <StatusBadge value={t.status} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => superAdmin.updateTenantStatus(t.id, t.status === "Active" ? "Suspended" : "Active")}
                        className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded font-bold hover:bg-[var(--bg-hover)]"
                      >
                        {t.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-[var(--text-muted)]">
                      Default Organization Active (Single-tenant default).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS MANAGEMENT PAGE */}
      {page === "users" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user accounts by email, name, role..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Display Name</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Office</th>
                  <th className="p-3 text-right">Reassign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-bold text-[var(--text-primary)]">{u.email}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{u.displayName || "N/A"}</td>
                    <td className="p-3 font-semibold text-emerald-400">{ROLE_LABELS[u.role] || u.role}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{u.office || "Main Office"}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setEditingUserUid(u.uid);
                          setSelectedRole(u.role);
                        }}
                        className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded hover:bg-emerald-500/20"
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM HEALTH PAGE */}
      {page === "system-health" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {superAdmin.healthMetrics.map((h, i) => (
              <div key={i} className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-primary)]">{h.serviceName}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] rounded">
                    {h.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div>
                    <span className="text-[var(--text-muted)] block">Latency:</span>
                    <span className="font-mono font-bold text-teal-400">{h.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Uptime Target:</span>
                    <span className="font-mono font-bold text-emerald-400">{h.uptimePercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GLOBAL SETTINGS PAGE */}
      {page === "global-settings" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl max-w-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">Global System Configuration</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg">
              <span>Enable Public User Registration</span>
              <input
                type="checkbox"
                checked={superAdmin.globalSettings?.allowPublicRegistration ?? true}
                onChange={(e) => superAdmin.updateGlobalSettings({ allowPublicRegistration: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg">
              <span>Enforce Multi-Factor Authentication (MFA)</span>
              <input
                type="checkbox"
                checked={superAdmin.globalSettings?.enforceMFA ?? false}
                onChange={(e) => superAdmin.updateGlobalSettings({ enforceMFA: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg">
              <span>Maintenance Mode Toggle</span>
              <input
                type="checkbox"
                checked={superAdmin.globalSettings?.maintenanceMode ?? false}
                onChange={(e) => superAdmin.updateGlobalSettings({ maintenanceMode: e.target.checked })}
              />
            </label>
          </div>
        </div>
      )}

      {/* AUDIT LOGS PAGE */}
      {page === "audit-logs" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">Platform Administrative Audit Trail</h2>
          <p className="text-[var(--text-secondary)]">Root audit logs for tenant onboarding and security updates.</p>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">System Incident Broadcasts</h2>
          <p className="text-[var(--text-secondary)]">Broadcasting notices to all active tenant organizations.</p>
        </div>
      )}

      {/* MODAL: CREATE TENANT */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleCreateTenantSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3"
          >
            <h2 className="font-bold text-base">Onboard Tenant Organization</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Org Name *</label>
              <input
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="e.g. Global Education Group"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tenant Domain *</label>
              <input
                required
                value={tenantDomain}
                onChange={(e) => setTenantDomain(e.target.value)}
                placeholder="e.g. globaledu.crm"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Admin Email *</label>
              <input
                required
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                placeholder="admin@globaledu.com"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Subscription Tier</label>
              <select
                value={tenantTier}
                onChange={(e) => setTenantTier(e.target.value as SubscriptionTier)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              >
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTenantModal(false)}
                className="px-3 py-1.5 bg-[var(--bg-hover)] rounded text-xs"
              >
                Cancel
              </button>
              <button className="px-4 py-1.5 bg-emerald-500 text-zinc-950 font-bold rounded text-xs">
                Onboard Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT USER ROLE */}
      {editingUserUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleRoleUpdateSubmit}
            className="w-full max-w-sm p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3"
          >
            <h2 className="font-bold text-base">Reassign User System Role</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Select System Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUserUid(null)}
                className="px-3 py-1.5 bg-[var(--bg-hover)] rounded text-xs"
              >
                Cancel
              </button>
              <button className="px-4 py-1.5 bg-emerald-500 text-zinc-950 font-bold rounded text-xs">
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
