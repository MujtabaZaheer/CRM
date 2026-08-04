import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { Lead, LeadStage } from "../types/lead";
import { RoleGate } from "../components/layout/RoleGate";
import { Users, Clock, Filter, TrendingUp, Sparkles, ArrowUpRight } from "lucide-react";

export const DashboardContent: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const leadsCollection = collection(db, "leads");
    const unsubscribe = onSnapshot(
      leadsCollection,
      (snapshot) => {
        const leadList: Lead[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Lead[];
        setLeads(leadList);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to leads:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const totalLeads = leads.length;

  const stageCounts = leads.reduce((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {} as Record<LeadStage, number>);

  const newLeadsCount = stageCounts["New"] || 0;
  const counsellingCount = stageCounts["Counselling"] || 0;
  const convertedCount = stageCounts["Converted"] || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-zinc-400">Live metrics and student pipeline performance</p>
        </div>
      </div>

      {/* Prim
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-3xl font-extrabold text-white">
              {loading ? "..." : totalLeads}
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center font-medium">
              Live <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-xs text-zinc-500">All registered student enquiries</p>
        </div>

        {/* New Enquiries */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">New Stage</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-3xl font-extrabold text-white">
              {loading ? "..." : newLeadsCount}
            </span>
            <span className="text-[11px] text-sky-400 font-medium">Unassigned</span>
          </div>
          <p className="text-xs text-zinc-500">Requires initial contact</p>
        </div>

        {/* In Counselling */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Counselling</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-3xl font-extrabold text-white">
              {loading ? "..." : counsellingCount}
            </span>
            <span className="text-[11px] text-amber-400 font-medium">Active</span>
          </div>
          <p className="text-xs text-zinc-500">In active student guidance</p>
        </div>

        {/* Converted */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-teal-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Converted</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-3xl font-extrabold text-white">
              {loading ? "..." : convertedCount}
            </span>
            <span className="text-[11px] text-teal-400 font-medium">Enrolled</span>
          </div>
          <p className="text-xs text-zinc-500">Successful student conversions</p>
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
        <h2 className="font-heading text-base font-semibold text-zinc-200">
          Complete Stage Breakdown
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading breakdown data...</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">No lead records available in Firestore.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              "New",
              "Contacted",
              "Qualified",
              "Counselling",
              "Documents Pending",
              "Application Initiated",
              "Converted",
              "Lost",
              "Unresponsive",
            ].map((stageName) => {
              const count = stageCounts[stageName as LeadStage] || 0;
              return (
                <div key={stageName} className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-zinc-400 font-medium truncate">{stageName}</div>
                  <div className="font-heading text-xl font-bold text-white">{count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <RoleGate>
      <DashboardContent />
    </RoleGate>
  );
};
