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

  // Route Guard: Super Admin Only
  if (appUser && appUser.role !== "platform_super_admin") {
    return <Navigate to="/" replace />;
  }

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
            <h1 className="font-heading text-2xl font-bold text-white">Platform Super Admin Portal</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Global multi-tenant system overview, tenant health, and platform configuration
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>System Root Active</span>
        </div>
      </div>

      {/* Global Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registered Accounts</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-white">
            {loadingUsers ? "..." : totalUsers}
          </div>
          <p className="text-xs text-zinc-500">Across all 10 system roles</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total System Records</span>
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-white">
            {loadingLeads ? "..." : totalLeads}
          </div>
          <p className="text-xs text-zinc-500">Live lead documents in Firestore</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Organizations</span>
            <Building className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-white">1</div>
          <p className="text-xs text-zinc-500">Tenant Structure: Single Org (Default)</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">System Status</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading text-2xl font-bold text-emerald-400 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational</span>
          </div>
          <p className="text-xs text-zinc-500">Firebase Auth & Firestore Online</p>
        </div>
      </div>

      {/* Role Distribution Grid */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-zinc-200 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Platform Role Distribution</span>
          </h2>
          <span className="text-xs text-zinc-500">10 Role Types Defined</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
            const count = roleCounts[roleKey] || 0;
            return (
              <div key={roleKey} className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-1">
                <div className="text-[11px] text-zinc-400 font-medium truncate">{label}</div>
                <div className="font-heading text-xl font-bold text-white">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Environment & Backend Config Info */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-3">
        <h2 className="font-heading text-base font-semibold text-zinc-200 flex items-center space-x-2">
          <Server className="w-4 h-4 text-teal-400" />
          <span>Platform Service Connection</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 block mb-1">AUTH PROVIDER</span>
            <span className="text-emerald-400">Firebase Authentication (Client SDK)</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 block mb-1">DATABASE INSTANCE</span>
            <span className="text-emerald-400">education-crm-9fee2 (Firestore)</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 block mb-1">HOSTING ENGINE</span>
            <span className="text-teal-400">Vercel Edge SPA Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
