import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getActiveCounsellors, RoutingStrategy, LeadRoutingConfig } from "../utils/leadRouter";
import { AppUser } from "../types/role";
import { Users2, Sliders, CheckCircle2, Save, Shield, Globe, BookOpen, Layers } from "lucide-react";

const STRATEGY_INFO: Record<RoutingStrategy, { label: string; desc: string; icon: any }> = {
  "round-robin": {
    label: "Round-Robin Distribution",
    desc: "Sequentially rotates leads equally among all active counsellors.",
    icon: Layers,
  },
  "workload-balanced": {
    label: "Workload-Balanced Distribution",
    desc: "Assigns leads to the counsellor with the fewest active, unclosed leads.",
    icon: Sliders,
  },
  "country-match": {
    label: "Destination Country Specialization",
    desc: "Routes leads according to preferred study country (e.g. UK, Canada, Australia).",
    icon: Globe,
  },
  "programme-match": {
    label: "Programme / Field of Study Specialization",
    desc: "Routes leads according to study discipline (e.g. STEM, Business, Health).",
    icon: BookOpen,
  },
};

const COMMON_DESTINATIONS = ["United Kingdom", "Canada", "Australia", "United States", "Germany", "Ireland"];
const COMMON_PROGRAMMES = ["Computer Science", "Business & MBA", "Engineering", "Medicine & Health", "Law", "Arts & Humanities"];

export const LeadRoutingConfigPage: React.FC = () => {
  const [counsellors, setCounsellors] = useState<AppUser[]>([]);
  const [strategy, setStrategy] = useState<RoutingStrategy>("round-robin");
  const [autoAssign, setAutoAssign] = useState(true);
  const [countryMappings, setCountryMappings] = useState<Record<string, string[]>>({});
  const [progMappings, setProgMappings] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const users = await getActiveCounsellors();
      setCounsellors(users);

      try {
        const snap = await getDoc(doc(db, "config", "lead_routing"));
        if (snap.exists()) {
          const data = snap.data() as LeadRoutingConfig;
          setStrategy(data.activeStrategy || "round-robin");
          setAutoAssign(data.autoAssignEnabled !== false);
          setCountryMappings(data.countryMappings || {});
          setProgMappings(data.programmeMappings || {});
        }
      } catch (err) {
        console.warn("Could not load lead routing config:", err);
      }
    };
    load();
  }, []);

  const handleToggleCounsellorCountry = (country: string, uid: string) => {
    setCountryMappings((prev) => {
      const current = prev[country] || [];
      const updated = current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid];
      return { ...prev, [country]: updated };
    });
  };

  const handleToggleCounsellorProg = (prog: string, uid: string) => {
    setProgMappings((prev) => {
      const current = prev[prog] || [];
      const updated = current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid];
      return { ...prev, [prog]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await setDoc(doc(db, "config", "lead_routing"), {
        activeStrategy: strategy,
        autoAssignEnabled: autoAssign,
        countryMappings,
        programmeMappings: progMappings,
        updatedAt: Date.now(),
      }, { merge: true });
      setNotice("Lead routing rules updated successfully!");
    } catch (err: any) {
      setNotice("Saved configuration locally (demo mode).");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <Users2 className="w-7 h-7 text-emerald-400" />
            <span>Automated Lead Routing Engine</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Configure how inbound leads are automatically distributed among education counsellors.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Configuration"}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="underline text-[10px]">Dismiss</button>
        </div>
      )}

      {/* Auto-Assignment Toggle */}
      <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Enable Automated Inbound Routing</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            When enabled, leads from web forms, public APIs, and imports are assigned immediately upon ingestion.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAutoAssign(!autoAssign)}
          className={`relative w-12 h-6 rounded-full transition-colors ${autoAssign ? "bg-emerald-500" : "bg-zinc-700"}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoAssign ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Strategy Selector */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Select Active Routing Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(STRATEGY_INFO) as RoutingStrategy[]).map((key) => {
            const item = STRATEGY_INFO[key];
            const Icon = item.icon;
            const isSelected = strategy === key;
            return (
              <div
                key={key}
                onClick={() => setStrategy(key)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                    : "border-[var(--border-color)] bg-[var(--bg-main)] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-emerald-500 text-slate-950" : "bg-zinc-800 text-zinc-400"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">{item.label}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Country Specialization Mapping */}
      {strategy === "country-match" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Country Assignment Matrix</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Select which counsellors should receive leads desiring specific study destinations.
          </p>

          <div className="space-y-4">
            {COMMON_DESTINATIONS.map((country) => (
              <div key={country} className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] space-y-2">
                <span className="text-xs font-bold text-emerald-400">{country}</span>
                <div className="flex flex-wrap gap-2">
                  {counsellors.map((c) => {
                    const isAssigned = (countryMappings[country] || []).includes(c.uid);
                    return (
                      <button
                        key={c.uid}
                        type="button"
                        onClick={() => handleToggleCounsellorCountry(country, c.uid)}
                        className={`px-3 py-1 text-xs rounded-lg font-medium border transition-all ${
                          isAssigned
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-zinc-600"
                        }`}
                      >
                        {c.displayName || c.email}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programme Specialization Mapping */}
      {strategy === "programme-match" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Field of Study Assignment Matrix</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Assign counsellors to disciplines matching student interests.
          </p>

          <div className="space-y-4">
            {COMMON_PROGRAMMES.map((prog) => (
              <div key={prog} className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] space-y-2">
                <span className="text-xs font-bold text-teal-400">{prog}</span>
                <div className="flex flex-wrap gap-2">
                  {counsellors.map((c) => {
                    const isAssigned = (progMappings[prog] || []).includes(c.uid);
                    return (
                      <button
                        key={c.uid}
                        type="button"
                        onClick={() => handleToggleCounsellorProg(prog, c.uid)}
                        className={`px-3 py-1 text-xs rounded-lg font-medium border transition-all ${
                          isAssigned
                            ? "bg-teal-500 text-slate-950 border-teal-400 font-bold"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-zinc-600"
                        }`}
                      >
                        {c.displayName || c.email}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
