import React from "react";
import { Construction, Sparkles } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
}

export const StubPage: React.FC<StubPageProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="w-16 h-16 sq-avatar bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/5">
        <Construction className="w-8 h-8" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold font-heading text-[var(--text-primary)]">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
      </div>
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-muted)] text-xs">
        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
        <span>Planned for Phase 2 Rollout</span>
      </div>
    </div>
  );
};
