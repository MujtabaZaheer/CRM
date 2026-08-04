import React from "react";
import { Construction } from "lucide-react";

interface StubPageProps {
  title: string;
  description?: string;
}

export const StubPage: React.FC<StubPageProps> = ({ title, description }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500">Module overview & status</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4 shadow-sm max-w-2xl mx-auto mt-8">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Construction className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Under Construction</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
          {description || `The ${title} module is scheduled for future development phases.`}
        </p>
        <div className="pt-4 border-t border-slate-100">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Phase 2 Planned Module
          </span>
        </div>
      </div>
    </div>
  );
};
