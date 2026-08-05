import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { AppUser, ROLE_LABELS } from "../types/role";
import { Lead } from "../types/lead";
import {
  ShieldAlert,
  Server,
  Users,
  Database,
  Building,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";

export const SuperAdmin: React.FC = () => {
  const { appUser } = useAuth();
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsersList(snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })) as AppUser[]);
        setLoadingUsers(false);
      },
      (err) => console.error("Error loading users:", err)
    );

    const unsubscribeLeads = onSnapshot(
      collection(db, "leads"),
      (snap) => {
        setLeadsList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Lead[]);
        setLoadingLeads(false);
      },
      (err) => console.error("Error loading leads:", err)
    );

    return () => {
      unsubscribeUsers();
      unsubscribeLeads();
    };
  }, []);

  // Route Guard: Super Admin Only
  if (appUser && appUser.role !== "platform_super_admin") {
    return <Navigate to="/" replace />;
  }

  const totalUsers = usersList.length;
  const totalLeads = leadsList.length;

  const roleCounts = usersList.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Platform Super Admin Portal</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Global multi-tenant system overview, tenant health, and platform configuration
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 sq-badge text-xs font-semibold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>System Root Active</span>
        </div>
      </div>

      {/* Global Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registered Accounts</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">
            {loadingUsers ? "..." : totalUsers}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Across all 10 system roles</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total System Records</span>
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">
            {loadingLeads ? "..." : totalLeads}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Live lead documents in Firestore</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Organizations</span>
            <Building className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">1</div>
          <p className="text-xs text-[var(--text-secondary)]">Tenant Structure: Single Org (Default)</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">System Status</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading text-2xl font-bold text-emerald-400 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Firebase Auth & Firestore Online</p>
        </div>
      </div>

      {/* Role Distribution Grid */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sq-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-[var(--text-primary)] flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Platform Role Distribution</span>
          </h2>
          <span className="text-xs text-[var(--text-muted)]">10 Role Types Defined</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
            const count = roleCounts[roleKey] || 0;
            return (
              <div key={roleKey} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                <div className="text-[11px] text-[var(--text-secondary)] font-medium truncate">{label}</div>
                <div className="font-heading text-xl font-bold text-[var(--text-primary)]">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Environment & Backend Config Info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sq-card space-y-3">
        <h2 className="font-heading text-base font-semibold text-[var(--text-primary)] flex items-center space-x-2">
          <Server className="w-4 h-4 text-teal-400" />
          <span>Platform Service Connection</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block mb-1">AUTH PROVIDER</span>
            <span className="text-emerald-400">Firebase Authentication (Client SDK)</span>
          </div>
          <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block mb-1">DATABASE INSTANCE</span>
            <span className="text-emerald-400">education-crm-9fee2 (Firestore)</span>
          </div>
          <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)]">
            <span className="text-[var(--text-muted)] block mb-1">HOSTING ENGINE</span>
            <span className="text-teal-400">Vercel Edge SPA Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
