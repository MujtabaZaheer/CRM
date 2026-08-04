import React from "react";
import { Construction, Sparkles } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
}

export const StubPage: React.FC<StubPageProps> = ({ title, description }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Construction className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Scheduled for Milestone Phase 2 & 3 Release</span>
        </div>
      </div>
    </div>
  );
};
