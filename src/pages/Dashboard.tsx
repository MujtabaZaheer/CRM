import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { Lead, LeadStage } from "../types/lead";
import { RoleGate } from "../components/layout/RoleGate";
import { Users, Filter, Clock, TrendingUp } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Live operational overview of student lead pipeline</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-2 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? "..." : totalLeads}
          </div>
          <p className="text-xs text-slate-400">All registered student enquiries</p>
        </div>

        {/* Card 2: New Enquiries */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-2 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">New Enquiries</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? "..." : newLeadsCount}
          </div>
          <p className="text-xs text-slate-400">Stage: New</p>
        </div>

        {/* Card 3: In Counselling */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">In Counselling</span>
            <Filter className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? "..." : counsellingCount}
          </div>
          <p className="text-xs text-slate-400">Active engagement</p>
        </div>

        {/* Card 4: Converted */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Converted</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? "..." : convertedCount}
          </div>
          <p className="text-xs text-slate-400">Successfully enrolled</p>
        </div>
      </div>

      {/* Stage Breakdown Section */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Leads by Stage Breakdown</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Loading breakdown data...</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No leads available in Firestore yet.</p>
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
                <div key={stageName} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                  <div className="text-xs text-slate-500 font-medium truncate">{stageName}</div>
                  <div className="text-xl font-bold text-slate-800">{count}</div>
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
