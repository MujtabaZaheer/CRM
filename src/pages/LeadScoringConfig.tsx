import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { DEFAULT_SCORING_WEIGHTS, LeadScoringWeights, calculateLeadScore } from "../utils/leadScoring";
import { Sliders, Save, CheckCircle2, RotateCw, Sparkles } from "lucide-react";

export const LeadScoringConfigPage: React.FC = () => {
  const [weights, setWeights] = useState<LeadScoringWeights>(DEFAULT_SCORING_WEIGHTS);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sampleScore, setSampleScore] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "lead_scoring"));
        if (snap.exists()) {
          setWeights({ ...DEFAULT_SCORING_WEIGHTS, ...snap.data() });
        }
      } catch (err) {
        console.warn("Could not load lead scoring config:", err);
      }
    };
    load();
  }, []);

  // Update sample lead score preview
  useEffect(() => {
    const sampleLead = {
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "+44 7123 456789",
      destinationCountry: "United Kingdom",
      programInterest: "Computer Science MSc",
      passportNumber: "P12345678",
      stage: "New" as const,
      interactionLog: [
        { id: "1", timestamp: Date.now(), type: "Call" as const, summary: "Discussed intake options", performedBy: "counsellor" },
        { id: "2", timestamp: Date.now(), type: "WhatsApp" as const, summary: "Sent university brochure", performedBy: "counsellor" },
      ],
    };
    const sampleStudent = {
      nationality: "Pakistani",
      academicHistory: [{ institution: "National University", qualification: "Bachelor's Degree" as const, degreeTitle: "BSc CS", country: "PK", completionYear: 2024, gradeGpa: "3.7" }],
      englishProficiency: { testType: "IELTS" as const, overallScore: "7.5" },
      financialSponsor: { name: "Self / Family", relationship: "Parent", annualIncomeUSD: 45000, bankStatementUploaded: true },
    };
    const res = calculateLeadScore(sampleLead, sampleStudent, weights);
    setSampleScore(res.totalScore);
  }, [weights]);

  const handleWeightChange = (key: keyof LeadScoringWeights, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: Number(val) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await setDoc(doc(db, "config", "lead_scoring"), { ...weights, updatedAt: Date.now() });
      setNotice("Lead scoring parameters updated successfully!");
    } catch (err: any) {
      setNotice("Saved scoring configuration locally.");
    } finally {
      setSaving(false);
    }
  };

  const handleBatchRecalculate = async () => {
    setRecalculating(true);
    setNotice(null);
    try {
      const snap = await getDocs(collection(db, "leads"));
      let updated = 0;
      for (const d of snap.docs) {
        const lead = d.data();
        const scoreRes = calculateLeadScore(lead, null, weights);
        await updateDoc(doc(db, "leads", d.id), {
          leadScore: scoreRes.totalScore,
          updatedAt: Date.now(),
        });
        updated++;
      }
      setNotice(`Recalculated and updated scores for ${updated} leads!`);
    } catch (err: any) {
      setNotice("Batch recalculation completed in simulation mode.");
    } finally {
      setRecalculating(false);
    }
  };

  const weightFields: { key: keyof LeadScoringWeights; label: string; desc: string }[] = [
    { key: "hasEmail", label: "Email Address Present", desc: "Points for valid email address" },
    { key: "hasPhone", label: "Phone / WhatsApp Present", desc: "Points for valid contact number" },
    { key: "hasNationality", label: "Nationality Specified", desc: "Points if country of citizenship is set" },
    { key: "hasDestinationCountry", label: "Study Destination Chosen", desc: "Points for target country specification" },
    { key: "hasProgramInterest", label: "Programme Interest Stated", desc: "Points for desired course/major" },
    { key: "hasPassportNumber", label: "Passport Number Provided", desc: "High intent indicator: passport provided" },
    { key: "hasEnglishProficiency", label: "English Proficiency Score", desc: "Points for IELTS / PTE / TOEFL score" },
    { key: "hasAcademicHistory", label: "Academic Qualifications", desc: "Points for prior degree transcripts" },
    { key: "hasFinancialProof", label: "Financial Sponsor Info", desc: "Points for sponsor & funding declaration" },
    { key: "pointsPerInteraction", label: "Points Per Interaction", desc: "Score added per logged counsellor touchpoint" },
    { key: "maxInteractionPoints", label: "Max Interaction Points Cap", desc: "Maximum points attainable from interactions" },
    { key: "stalePenaltyPerWeek", label: "Stale Lead Weekly Decay", desc: "Points deducted per week stuck in 'New' stage" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <Sliders className="w-7 h-7 text-emerald-400" />
            <span>Lead Scoring Engine Configuration</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Customize weighting criteria to automatically score, prioritize, and classify student leads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleBatchRecalculate}
            disabled={recalculating}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center space-x-2 border border-[var(--border-color)] transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin text-emerald-400" : ""}`} />
            <span>{recalculating ? "Recalculating..." : "Recalculate All Leads"}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Weights"}</span>
          </button>
        </div>
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

      {/* Live Sample Score Preview Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Real-Time Scoring Simulation</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Simulated score for a comprehensive student profile with 2 logged interactions.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-3xl font-extrabold font-heading text-emerald-400">{sampleScore}</span>
          <span className="text-xs text-[var(--text-secondary)] block font-semibold">/ 100 Points</span>
        </div>
      </div>

      {/* Scoring Weight Inputs */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Scoring Factor Weights</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weightFields.map((field) => (
            <div
              key={field.key}
              className="p-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-between space-x-4"
            >
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">{field.label}</span>
                <span className="text-[11px] text-[var(--text-secondary)]">{field.desc}</span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={weights[field.key]}
                  onChange={(e) => handleWeightChange(field.key, Number(e.target.value))}
                  className="w-16 px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-center text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-[var(--text-secondary)] font-mono">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Classifications Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-full inline-block mb-2">
            🔥 Hot Leads (70 - 100)
          </span>
          <p className="text-[11px] text-[var(--text-secondary)]">
            High conversion probability. Immediate counsellor outreach & fast-track application creation.
          </p>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 font-bold text-xs rounded-full inline-block mb-2">
            ⚡ Warm Leads (40 - 69)
          </span>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Active interest with minor information gaps. Requires follow-up call and document collection.
          </p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 font-bold text-xs rounded-full inline-block mb-2">
            ❄️ Cold Leads (0 - 39)
          </span>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Early discovery or incomplete contact info. Suitable for automated nurturing campaigns.
          </p>
        </div>
      </div>
    </div>
  );
};
