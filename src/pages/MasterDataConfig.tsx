import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { RoleGate } from "../components/layout/RoleGate";
import { logAuditEvent } from "../utils/auditLogger";
import {
  Sliders,
  Globe,
  Globe2,
  DollarSign,
  GraduationCap,
  FileCheck,
  Tag,
  Plus,
  Trash2,
  Save,
  CheckCircle2
} from "lucide-react";

export interface MasterDataSchema {
  countries: string[];
  currencies: string[];
  degreeLevels: string[];
  gradingSystems: string[];
  intakePeriods: string[];
  leadSources: string[];
  rejectionReasons: string[];
}

const DEFAULT_MASTER_DATA: MasterDataSchema = {
  countries: ["United Kingdom", "United States", "Canada", "Australia", "Germany", "Ireland"],
  currencies: ["USD", "GBP", "EUR", "CAD", "AUD", "PKR", "INR"],
  degreeLevels: ["Undergraduate / Bachelor", "Postgraduate / Master", "Doctorate / PhD", "Diploma / Foundation"],
  gradingSystems: ["GPA (4.0 Scale)", "Percentage (%)", "UK Class (First, 2:1, 2:2)", "ECTS"],
  intakePeriods: ["Fall (September)", "Spring (January)", "Summer (May)"],
  leadSources: ["Website", "Referral", "Walk-in", "Social Media", "Agent", "Event/Fair"],
  rejectionReasons: ["Low GPA / Academic entry missed", "English proficiency score insufficient", "Visa rejection history", "Financial proof insufficient", "Incomplete document submission"],
};

export const MasterDataConfigContent: React.FC = () => {
  const { appUser } = useAuth();
  const [data, setData] = useState<MasterDataSchema>(DEFAULT_MASTER_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New item inputs
  const [newInputs, setNewInputs] = useState<Record<keyof MasterDataSchema, string>>({
    countries: "",
    currencies: "",
    degreeLevels: "",
    gradingSystems: "",
    intakePeriods: "",
    leadSources: "",
    rejectionReasons: "",
  });

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const docRef = doc(db, "config", "master_data");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setData(snap.data() as MasterDataSchema);
        }
      } catch (err) {
        console.warn("Failed to load master data from Firestore:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  const handleAddItem = (category: keyof MasterDataSchema) => {
    const val = newInputs[category].trim();
    if (!val) return;

    if (data[category].includes(val)) {
      setNotice(`'${val}' is already present in ${category}.`);
      return;
    }

    setData((prev) => ({
      ...prev,
      [category]: [...prev[category], val],
    }));

    setNewInputs((prev) => ({ ...prev, [category]: "" }));
  };

  const handleRemoveItem = (category: keyof MasterDataSchema, item: string) => {
    setData((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, "config", "master_data");
      await setDoc(docRef, { ...data, updatedAt: Date.now() });

      await logAuditEvent(
        "MASTER_DATA_UPDATED",
        appUser?.email || "Admin",
        "Configuration",
        "Updated global master data configuration lists",
        "master_data",
        appUser?.role
      );

      setNotice("Master data lists updated and saved to Firestore.");
    } catch (err: any) {
      setNotice(`Failed to save configuration: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const categories: { key: keyof MasterDataSchema; label: string; icon: React.ReactNode }[] = [
    { key: "countries", label: "Target Destination Countries", icon: <Globe className="w-4 h-4 text-emerald-400" /> },
    { key: "currencies", label: "Supported Currencies", icon: <DollarSign className="w-4 h-4 text-sky-400" /> },
    { key: "degreeLevels", label: "Degree Qualification Levels", icon: <GraduationCap className="w-4 h-4 text-purple-400" /> },
    { key: "gradingSystems", label: "Academic Grading Systems", icon: <FileCheck className="w-4 h-4 text-amber-400" /> },
    { key: "intakePeriods", label: "Academic Intake Periods", icon: <Sliders className="w-4 h-4 text-indigo-400" /> },
    { key: "leadSources", label: "Lead Acquisition Sources", icon: <Tag className="w-4 h-4 text-teal-400" /> },
    { key: "rejectionReasons", label: "Standard Application Rejection Reasons", icon: <Sliders className="w-4 h-4 text-rose-400" /> },
  ];

  if (loading) return <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Loading master configuration...</div>;

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Master Data & System Configuration Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Configure global dropdown choices, target countries, degree levels, currencies, and rejection categories
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Master Configuration"}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div key={cat.key} className="bg-[var(--bg-card)] border border-[var(--border-default)] p-5 sq-card space-y-3">
            <div className="flex items-center space-x-2 border-b border-[var(--border-default)] pb-2 font-bold text-sm text-[var(--text-primary)]">
              {cat.icon}
              <span>{cat.label}</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Add new ${cat.label.toLowerCase()}...`}
                value={newInputs[cat.key]}
                onChange={(e) => setNewInputs({ ...newInputs, [cat.key]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem(cat.key)}
                className="flex-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-[var(--text-primary)]"
              />
              <button
                onClick={() => handleAddItem(cat.key)}
                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {data[cat.key].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-[11px] text-[var(--text-primary)]"
                >
                  <span>{item}</span>
                  <button onClick={() => handleRemoveItem(cat.key, item)} className="text-[var(--text-muted)] hover:text-rose-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MasterDataConfigPage: React.FC = () => {
  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin"]}>
      <MasterDataConfigContent />
    </RoleGate>
  );
};
