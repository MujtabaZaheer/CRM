import React, { useState, useEffect, useRef, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { Student, QualificationLevel } from "../../types/student";
import { 
  User, GraduationCap, Globe, FileCheck, 
  CheckCircle2, AlertCircle, Plus, Trash2, ShieldCheck, 
  BookOpen, CreditCard, Loader2, Check, Save
} from "lucide-react";
import { calculateProfileCompleteness } from "../../utils/profileCompleteness";

type TabId = 'personal' | 'passport' | 'academic' | 'preferences' | 'english' | 'financial';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'personal', label: 'Personal Information', icon: User, description: 'Legal name, contact number, and residence' },
  { id: 'academic', label: 'Academic History', icon: GraduationCap, description: 'Institutions, qualifications, and grades' },
  { id: 'preferences', label: 'Study Preferences', icon: BookOpen, description: 'Target destination, intake, and study level' },
  { id: 'passport', label: 'Identity & Passport', icon: Globe, description: 'Official passport number and expiration (Optional for early review)' },
  { id: 'english', label: 'English Proficiency', icon: FileCheck, description: 'Language exam scores or MOI evidence (Optional)' },
  { id: 'financial', label: 'Financial Sponsor', icon: CreditCard, description: 'Funding source and annual financial support (Optional)' },
];

export const StudentProfileSelfEdit: React.FC = () => {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  
  // Data State
  const [data, setData] = useState<Partial<Student>>({});
  
  // Ref to track if it's the initial load to prevent immediate autosave
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!appUser?.uid) return;
      try {
        const snap = await getDoc(doc(db, "students", appUser.uid));
        let st: Partial<Student> | null = null;
        if (snap.exists()) {
          st = snap.data() as Student;
        } else {
          // Initialize fresh student profile with current authenticated user credentials
          st = {
            id: appUser.uid,
            fullName: appUser.displayName || "",
            email: appUser.email || "",
            phone: (appUser as any)?.phone || "",
            nationality: (appUser as any).nationality || "Pakistan",
            countryOfResidence: (appUser as any).countryOfResidence || "Pakistan",
            desiredStudyLevel: (appUser as any).desiredStudyLevel || "Bachelor's Degree",
            preferredDestination: "United Kingdom",
            preferredIntake: "September 2027",
            budgetAnnualUsd: 25000,
            academicHistory: [],
          };
        }

        if (st) {
          setData({
            fullName: st.fullName || appUser.displayName || "",
            phone: st.phone || (appUser as any)?.phone || "",
            nationality: st.nationality || (appUser as any).nationality || "Pakistan",
            countryOfResidence: st.countryOfResidence || (appUser as any).countryOfResidence || "Pakistan",
            desiredStudyLevel: (st as any).desiredStudyLevel || "Bachelor's Degree",
            passportNumber: st.passportNumber || "",
            passportExpiry: st.passportExpiry || "",
            preferredDestination: st.preferredDestination || "",
            preferredIntake: st.preferredIntake || "",
            budgetAnnualUsd: st.budgetAnnualUsd || 25000,
            englishProficiency: st.englishProficiency || { testType: "IELTS", overallScore: "" },
            studyGapJustification: st.studyGapJustification || "",
            financialSponsor: st.financialSponsor || { name: "", relationship: "Parent", annualIncomeUSD: 40000, bankStatementUploaded: false },
            academicHistory: st.academicHistory || [],
          });
        }
      } catch (err) {
        console.warn("Could not load student profile:", err);
      } finally {
        setLoading(false);
        setTimeout(() => { isInitialLoad.current = false; }, 500);
      }
    };
    loadProfile();
  }, [appUser]);

  // Section completion evaluation
  const sectionStatus = {
    personal: Boolean(data.fullName?.trim() && data.phone?.trim() && data.nationality?.trim() && data.countryOfResidence?.trim()),
    academic: Boolean(data.academicHistory && data.academicHistory.length > 0 && data.academicHistory[0].institution?.trim()),
    preferences: Boolean(data.preferredDestination?.trim() && (data as any).desiredStudyLevel?.trim()),
    passport: Boolean(data.passportNumber?.trim() && data.passportExpiry?.trim()),
    english: Boolean(data.englishProficiency?.testType && data.englishProficiency?.overallScore?.trim()),
    financial: Boolean(data.financialSponsor?.name?.trim() && (data.financialSponsor?.annualIncomeUSD || 0) > 0),
  };

  const calculateCompleteness = () => {
    const res = calculateProfileCompleteness(data);
    return res.percentage;
  };

  const handleSave = useCallback(async (currentData: Partial<Student>) => {
    if (!appUser?.uid) return;
    setSaveState('saving');
    
    try {
      const completeness = calculateCompleteness();
      const updatedData = {
        ...currentData,
        profileCompleteness: Math.min(100, completeness),
        updatedAt: Date.now(),
      };
      
      // Update Student CRM record
      await setDoc(doc(db, "students", appUser.uid), updatedData, { merge: true });
      
      // Keep Core Auth User record in sync
      if (updatedData.fullName || updatedData.phone) {
        await setDoc(doc(db, "users", appUser.uid), {
          displayName: updatedData.fullName,
          phone: updatedData.phone,
          updatedAt: Date.now(),
        }, { merge: true });
      }

      setSaveState('saved');
      
      setTimeout(() => {
        setSaveState(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      setSaveState('error');
    }
  }, [appUser, sectionStatus]);

  // Debounced Autosave
  useEffect(() => {
    if (isInitialLoad.current || loading) return;
    
    setSaveState('idle');
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      handleSave(data);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, [data, handleSave, loading]);

  const updateField = (field: keyof Student, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: keyof Student, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any || {}),
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-muted flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-secondary">Loading your student profile...</p>
      </div>
    );
  }

  const overallCompleteness = calculateCompleteness();

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-16 animate-fade-in font-sans">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-surface p-6 sm:p-7 rounded-3xl border border-subtle shadow-sm relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Student Master Record
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-primary">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-secondary max-w-xl">
            This verified data automatically populates university application dossiers, eligibility scoring, and visa compliance records.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 sm:min-w-[220px]">
          <div className="flex-1 bg-elevated/80 p-3.5 rounded-2xl border border-subtle">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-secondary">Profile Completion</span>
              <span className="text-xs font-bold font-mono text-emerald-500">{overallCompleteness}%</span>
            </div>
            <div className="w-full h-2 bg-input rounded-full overflow-hidden border border-subtle/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${overallCompleteness}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-muted">
              <span>{Object.values(sectionStatus).filter(Boolean).length} of 6 complete</span>
              {saveState === 'saving' && <span className="text-amber-400 flex items-center gap-1 font-semibold"><Loader2 className="w-3 h-3 animate-spin"/> Saving</span>}
              {saveState === 'saved' && <span className="text-emerald-400 flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3 h-3"/> Saved</span>}
              {saveState === 'error' && <span className="text-rose-400 flex items-center gap-1 font-semibold"><AlertCircle className="w-3 h-3"/> Error</span>}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Completion Checklist Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-secondary">
            Profile Completion Checklist
          </h2>
          <span className="text-xs text-muted">Click any section to review or edit</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {TABS.map((tab) => {
            const isDone = sectionStatus[tab.id];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/30"
                    : isDone
                    ? "bg-surface hover:bg-elevated border-subtle"
                    : "bg-surface/60 hover:bg-surface border-subtle/80 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <tab.icon className={`w-4 h-4 ${isActive || isDone ? "text-emerald-500" : "text-muted"}`} />
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : "!"}
                  </span>
                </div>
                <p className="text-xs font-bold text-primary truncate leading-tight">
                  {tab.label}
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  {isDone ? "Completed" : "Action Required"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Form Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Tab Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {TABS.map(tab => {
            const isDone = sectionStatus[tab.id];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left font-medium text-xs cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-bold shadow-xs' 
                    : 'bg-surface hover:bg-elevated text-secondary border border-subtle'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-500' : isDone ? 'text-emerald-500/70' : 'text-muted'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  isDone 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {isDone ? "✓ Complete" : "! Missing"}
                </span>
              </button>
            );
          })}
          
          <div className="mt-6 p-4 bg-surface border border-subtle rounded-2xl text-xs text-muted space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Your information is securely encrypted and only shared with partnered institutions when you submit an official application.
              </p>
            </div>
          </div>
        </div>

        {/* Form Content Area */}
        <div className="lg:col-span-3 bg-surface border border-subtle rounded-3xl p-6 sm:p-8 shadow-sm min-h-[440px] flex flex-col justify-between">
          
          {/* TAB 1: PERSONAL */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-subtle pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary font-heading">Personal Information</h2>
                  <p className="text-xs text-secondary mt-0.5">Contact coordinates and residency details</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sectionStatus.personal ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                  {sectionStatus.personal ? "✓ Verified" : "! Action Required"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Full Legal Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.fullName || ""}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="e.g. Aarav Patel"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted mt-1">Exact name as printed in your international passport</p>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Phone / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={data.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+44 7123 456789"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted mt-1">Used for urgent admissions calls & status alerts</p>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Nationality <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.nationality || ""}
                    onChange={(e) => updateField("nationality", e.target.value)}
                    placeholder="e.g. Indian, Pakistani, Nigerian"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted mt-1">Primary citizenship determining visa category</p>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Country of Current Residence <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.countryOfResidence || ""}
                    onChange={(e) => updateField("countryOfResidence", e.target.value)}
                    placeholder="e.g. United Arab Emirates"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted mt-1">Where you will lodge your student visa</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSPORT */}
          {activeTab === 'passport' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-subtle pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary font-heading">Passport & Identity</h2>
                  <p className="text-xs text-secondary mt-0.5">Government travel credentials required for CAS/COE</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sectionStatus.passport ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                  {sectionStatus.passport ? "✓ Verified" : "! Action Required"}
                </span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
                <Globe className="w-5 h-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-bold">Official Document Rule</p>
                  <p className="mt-0.5 text-secondary">
                    Your passport must have at least 6 months of validity beyond your intended course start date. Upload a clear copy in the Document Vault.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Passport Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.passportNumber || ""}
                    onChange={(e) => updateField("passportNumber", e.target.value)}
                    placeholder="e.g. A12345678"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all uppercase"
                  />
                  <p className="text-[11px] text-muted mt-1">Alpha-numeric international passport number</p>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Passport Expiry Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={data.passportExpiry || ""}
                    onChange={(e) => updateField("passportExpiry", e.target.value)}
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted mt-1">Official expiration date printed on data page</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC */}
          {activeTab === 'academic' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-subtle pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary font-heading">Academic History</h2>
                  <p className="text-xs text-secondary mt-0.5">Educational qualifications, institutions, and scores</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newHist = [...(data.academicHistory || []), { institution: "", qualification: "Bachelor's Degree", degreeTitle: "", country: "", completionYear: new Date().getFullYear(), gradeGpa: "" }];
                    updateField("academicHistory", newHist);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Qualification</span>
                </button>
              </div>
              
              {!data.academicHistory?.length ? (
                <div className="p-10 text-center text-muted border border-dashed border-subtle rounded-2xl space-y-2">
                  <GraduationCap className="w-10 h-10 mx-auto text-muted opacity-40" />
                  <p className="text-sm font-bold text-primary">No academic records added yet</p>
                  <p className="text-xs text-secondary max-w-sm mx-auto">
                    Add your previous degrees, secondary school certificates, or diplomas to calculate program eligibility.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      updateField("academicHistory", [{ institution: "", qualification: "Bachelor's Degree", degreeTitle: "", country: "", completionYear: new Date().getFullYear(), gradeGpa: "" }]);
                    }}
                    className="mt-3 px-4 py-2 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Record</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.academicHistory.map((rec, index) => (
                    <div key={index} className="p-5 bg-elevated/70 border border-subtle rounded-2xl space-y-4 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Qualification {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newHist = data.academicHistory?.filter((_, i) => i !== index);
                            updateField("academicHistory", newHist);
                          }}
                          className="p-1.5 text-muted hover:text-rose-400 bg-surface rounded-lg border border-subtle transition-colors cursor-pointer"
                          title="Remove Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-secondary font-semibold text-xs mb-1">Level / Type</label>
                          <select
                            value={rec.qualification}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].qualification = e.target.value as QualificationLevel;
                              updateField("academicHistory", hist);
                            }}
                            className="w-full p-2.5 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm outline-none focus:border-emerald-500"
                          >
                            <option value="High School / A-Levels">High School / Secondary / A-Levels</option>
                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                            <option value="Master's Degree">Master's Degree</option>
                            <option value="Doctorate / PhD">Doctorate / PhD</option>
                            <option value="Diploma / Certificate">Diploma / Certificate</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-secondary font-semibold text-xs mb-1">Institution Name</label>
                          <input
                            type="text"
                            value={rec.institution}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].institution = e.target.value;
                              updateField("academicHistory", hist);
                            }}
                            placeholder="e.g. University of Mumbai"
                            className="w-full p-2.5 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-secondary font-semibold text-xs mb-1">Degree Title / Major</label>
                          <input
                            type="text"
                            value={rec.degreeTitle}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].degreeTitle = e.target.value;
                              updateField("academicHistory", hist);
                            }}
                            placeholder="e.g. B.Tech Computer Science"
                            className="w-full p-2.5 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-secondary font-semibold text-xs mb-1">Grade / GPA / Percentage</label>
                          <input
                            type="text"
                            value={rec.gradeGpa}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].gradeGpa = e.target.value;
                              updateField("academicHistory", hist);
                            }}
                            placeholder="e.g. 3.75 / 4.0 or 82%"
                            className="w-full p-2.5 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-subtle pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary font-heading">Study Preferences & Budget</h2>
                  <p className="text-xs text-secondary mt-0.5">Target education parameters for university matching</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sectionStatus.preferences ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                  {sectionStatus.preferences ? "✓ Verified" : "! Action Required"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Desired Study Level <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={(data as any).desiredStudyLevel || "Bachelor's Degree"}
                    onChange={(e) => updateField("desiredStudyLevel" as any, e.target.value)}
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="Bachelor's Degree">Bachelor&apos;s Degree (Undergraduate)</option>
                    <option value="Master's Degree">Master&apos;s Degree (Postgraduate)</option>
                    <option value="Doctorate / PhD">Doctorate / PhD</option>
                    <option value="Diploma / Foundation">Diploma / Foundation Pathway</option>
                  </select>
                  <p className="text-[11px] text-muted mt-1">Primary degree objective for admissions triage</p>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Target Study Destination <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={data.preferredDestination || ""}
                    onChange={(e) => updateField("preferredDestination", e.target.value)}
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="">Select country...</option>
                    <option value="United Kingdom">United Kingdom (UK)</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="United States">United States (USA)</option>
                    <option value="Germany">Germany</option>
                    <option value="Ireland">Ireland</option>
                    <option value="New Zealand">New Zealand</option>
                  </select>
                  <p className="text-[11px] text-muted mt-1">Country for your primary university applications</p>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Target Intake / Season <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.preferredIntake || ""}
                    onChange={(e) => updateField("preferredIntake", e.target.value)}
                    placeholder="e.g. September 2026, January 2027"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted mt-1">Semester or term you intend to commence study</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Annual Tuition Budget in USD ($)
                  </label>
                  <input
                    type="number"
                    value={data.budgetAnnualUsd || ""}
                    onChange={(e) => updateField("budgetAnnualUsd", Number(e.target.value))}
                    step="1000"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono"
                  />
                  <p className="text-[11px] text-muted mt-1">Used to filter scholarships and affordable universities</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ENGLISH */}
          {activeTab === 'english' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-subtle pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary font-heading">English Language & Academic Gaps</h2>
                  <p className="text-xs text-secondary mt-0.5">Language competency certifications and timeline explanations</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sectionStatus.english ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                  {sectionStatus.english ? "✓ Verified" : "! Action Required"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Standardized English Test
                  </label>
                  <select
                    value={data.englishProficiency?.testType || "IELTS"}
                    onChange={(e) => updateNestedField("englishProficiency", "testType", e.target.value)}
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="IELTS">IELTS Academic</option>
                    <option value="PTE">PTE Academic (Pearson)</option>
                    <option value="TOEFL">TOEFL iBT</option>
                    <option value="Duolingo">Duolingo English Test (DET)</option>
                    <option value="MOI Evidence">Medium of Instruction (MOI Waiver)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Overall Band / Score
                  </label>
                  <input
                    type="text"
                    value={data.englishProficiency?.overallScore || ""}
                    onChange={(e) => updateNestedField("englishProficiency", "overallScore", e.target.value)}
                    placeholder="e.g. 7.0 Overall (6.5 minimum subscores)"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Study / Employment Gap Explanation
                  </label>
                  <textarea
                    rows={3}
                    value={data.studyGapJustification || ""}
                    onChange={(e) => updateField("studyGapJustification", e.target.value)}
                    placeholder="If you have more than 6 months of gap between courses, describe your activities (e.g. full-time software engineering work, internship, civil service exams)..."
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FINANCIAL */}
          {activeTab === 'financial' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-subtle pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary font-heading">Financial Sponsor</h2>
                  <p className="text-xs text-secondary mt-0.5">Proof of tuition and living maintenance funds</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sectionStatus.financial ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                  {sectionStatus.financial ? "✓ Verified" : "! Action Required"}
                </span>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
                <CreditCard className="w-5 h-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-bold">Visa Maintenance Requirement</p>
                  <p className="mt-0.5 text-secondary">
                    Immigration authorities (UKVI, IRCC, Home Affairs) require 28-day seasoning of funds covering course fees plus living costs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Sponsor Name / Organization <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.financialSponsor?.name || ""}
                    onChange={(e) => updateNestedField("financialSponsor", "name", e.target.value)}
                    placeholder="e.g. Rajesh Patel (Father)"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted mt-1">Primary party funding your overseas education</p>
                </div>

                <div>
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Relationship to Student <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={data.financialSponsor?.relationship || "Parent"}
                    onChange={(e) => updateNestedField("financialSponsor", "relationship", e.target.value)}
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="Parent">Parent (Father / Mother)</option>
                    <option value="Self">Self-Funded (Personal savings)</option>
                    <option value="Sibling">Sibling (Brother / Sister)</option>
                    <option value="Government Scholarship">Government Scholarship Agency</option>
                    <option value="Corporate Sponsor">Corporate Employer Sponsor</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-secondary font-bold text-xs mb-1.5">
                    Annual Income in USD ($ Equivalent) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={data.financialSponsor?.annualIncomeUSD || ""}
                    onChange={(e) => updateNestedField("financialSponsor", "annualIncomeUSD", Number(e.target.value))}
                    step="5000"
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono"
                  />
                  <p className="text-[11px] text-muted mt-1">Documented household or sponsor yearly earnings</p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Confirmation Action Bar */}
          <div className="mt-8 pt-5 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted">
              {saveState === 'saving' && <span className="text-amber-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving changes to CRM database...</span>}
              {saveState === 'saved' && <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> All profile modifications saved successfully</span>}
              {saveState === 'idle' && <span className="text-secondary flex items-center gap-1.5">Autosave is active</span>}
            </div>

            <button
              type="button"
              onClick={() => handleSave(data)}
              disabled={saveState === 'saving'}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveState === 'saving' ? "Saving..." : "Save Profile Now"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
