import React, { useState, useEffect, useRef, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { Student, QualificationLevel } from "../../types/student";
import { DEMO_STUDENTS } from "../../data/demoData";
import { 
  User, GraduationCap, Globe, FileCheck, 
  CheckCircle2, AlertCircle, Plus, Trash2, ShieldCheck, 
  BookOpen, CreditCard, Loader2
} from "lucide-react";

type TabId = 'personal' | 'passport' | 'academic' | 'preferences' | 'english' | 'financial';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal & Contact', icon: User },
  { id: 'passport', label: 'Passport & Identity', icon: Globe },
  { id: 'academic', label: 'Academic History', icon: GraduationCap },
  { id: 'preferences', label: 'Study Preferences', icon: BookOpen },
  { id: 'english', label: 'English Proficiency', icon: FileCheck },
  { id: 'financial', label: 'Financial Sponsor', icon: CreditCard },
];

export const StudentProfileSelfEdit: React.FC = () => {
  const { appUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  
  // Data State
  const [data, setData] = useState<Partial<Student>>({});
  
  // Ref to track if it's the initial load to prevent immediate autosave
  const isInitialLoad = useRef(true);
  // Ref to debounce save
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!appUser?.uid) return;
      try {
        const snap = await getDoc(doc(db, "students", appUser.uid));
        const st = snap.exists() ? (snap.data() as Student) : DEMO_STUDENTS[0];
        if (st) {
          setStudent(st);
          setData({
            fullName: st.fullName || "",
            phone: st.phone || "",
            nationality: st.nationality || "",
            countryOfResidence: st.countryOfResidence || "",
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

  const calculateCompleteness = (currentData: Partial<Student>) => {
    let filled = 0;
    const totalFields = 10;
    if (currentData.fullName) filled++;
    if (currentData.phone) filled++;
    if (currentData.nationality) filled++;
    if (currentData.countryOfResidence) filled++;
    if (currentData.passportNumber) filled++;
    if (currentData.preferredDestination) filled++;
    if (currentData.englishProficiency?.overallScore) filled++;
    if (currentData.academicHistory && currentData.academicHistory.length > 0) filled++;
    if (currentData.financialSponsor?.name) filled++;
    if (currentData.studyGapJustification || currentData.academicHistory?.length) filled++; // Rough proxy
    return Math.round((filled / totalFields) * 100);
  };

  const handleSave = useCallback(async (currentData: Partial<Student>) => {
    if (!appUser?.uid) return;
    setSaveState('saving');
    
    try {
      const completeness = calculateCompleteness(currentData);
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

      setStudent(prev => prev ? { ...prev, ...updatedData } as Student : null);
      setSaveState('saved');
      
      setTimeout(() => {
        setSaveState(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      setSaveState('error');
    }
  }, [appUser]);

  // Autosave effect
  useEffect(() => {
    if (isInitialLoad.current || loading) return;
    
    setSaveState('idle');
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      handleSave(data);
    }, 1500); // 1.5s debounce

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
      <div className="p-12 text-center text-muted flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const completeness = student?.profileCompleteness || calculateCompleteness(data);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-6 rounded-2xl border border-subtle shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-heading text-primary flex items-center space-x-2">
            <User className="w-7 h-7 text-emerald-500" />
            <span>My Master Profile</span>
          </h1>
          <p className="text-sm text-secondary mt-1">
            This information is used to match you with programs and automatically populate your university applications.
          </p>
        </div>

        <div className="text-right sm:min-w-[200px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-secondary font-semibold">Profile Completeness</span>
            <span className="text-xs font-bold text-emerald-500">{completeness}%</span>
          </div>
          <div className="w-full h-2.5 bg-elevated rounded-full overflow-hidden border border-subtle">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <div className="flex items-center justify-end mt-2 text-xs h-4">
            {saveState === 'saving' && <span className="text-muted flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
            {saveState === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Saved just now</span>}
            {saveState === 'error' && <span className="text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Save failed</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium text-sm ${
                activeTab === tab.id 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-surface hover:bg-hover text-secondary border border-subtle'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-500' : 'text-muted'}`} />
              {tab.label}
            </button>
          ))}
          
          <div className="mt-8 p-4 bg-elevated border border-subtle rounded-xl text-xs text-muted space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <p>Your data is securely stored and only shared with universities when you explicitly submit an application.</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-surface border border-subtle rounded-2xl p-6 shadow-sm min-h-[400px]">
          
          {/* TAB 1: PERSONAL */}
          {activeTab === 'personal' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-primary font-heading border-b border-subtle pb-3">Personal & Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Full Legal Name *</label>
                  <input
                    type="text"
                    value={data.fullName || ""}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="As it appears on your passport"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    value={data.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Nationality *</label>
                  <input
                    type="text"
                    value={data.nationality || ""}
                    onChange={(e) => updateField("nationality", e.target.value)}
                    placeholder="e.g. Pakistani"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Country of Residence *</label>
                  <input
                    type="text"
                    value={data.countryOfResidence || ""}
                    onChange={(e) => updateField("countryOfResidence", e.target.value)}
                    placeholder="e.g. United Arab Emirates"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSPORT */}
          {activeTab === 'passport' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-primary font-heading border-b border-subtle pb-3">Passport & Identity</h2>
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-600/90 dark:text-emerald-400 mb-4 flex gap-2">
                <Globe className="w-4 h-4 shrink-0" />
                <p>Passport details are required for issuing your CAS/COE and processing your visa application.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Passport Number</label>
                  <input
                    type="text"
                    value={data.passportNumber || ""}
                    onChange={(e) => updateField("passportNumber", e.target.value)}
                    placeholder="e.g. A12345678"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Passport Expiry Date</label>
                  <input
                    type="date"
                    value={data.passportExpiry || ""}
                    onChange={(e) => updateField("passportExpiry", e.target.value)}
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC */}
          {activeTab === 'academic' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-subtle pb-3">
                <h2 className="text-lg font-bold text-primary font-heading">Academic History</h2>
                <button
                  type="button"
                  onClick={() => {
                    const newHist = [...(data.academicHistory || []), { institution: "", qualification: "Bachelor's Degree", degreeTitle: "", country: "", completionYear: new Date().getFullYear(), gradeGpa: "" }];
                    updateField("academicHistory", newHist);
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Degree
                </button>
              </div>
              
              {!data.academicHistory?.length ? (
                <div className="p-8 text-center text-muted border border-dashed border-subtle rounded-xl">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No academic history added yet.</p>
                  <p className="text-xs mt-1">Add your most recent qualifications to match with eligible programs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.academicHistory.map((rec, index) => (
                    <div key={index} className="p-4 bg-elevated border border-default rounded-xl space-y-4 relative group">
                      <button
                        onClick={() => {
                          const newHist = data.academicHistory?.filter((_, i) => i !== index);
                          updateField("academicHistory", newHist);
                        }}
                        className="absolute top-3 right-3 p-1.5 text-muted hover:text-rose-500 bg-surface rounded-md border border-subtle opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Qualification {index + 1}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-secondary font-medium mb-1">Level</label>
                          <select
                            value={rec.qualification}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].qualification = e.target.value as QualificationLevel;
                              updateField("academicHistory", hist);
                            }}
                            className="w-full p-2 bg-input border border-default rounded-lg text-primary outline-none"
                          >
                            <option value="High School / A-Levels">High School / A-Levels</option>
                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                            <option value="Master's Degree">Master's Degree</option>
                            <option value="Doctorate / PhD">Doctorate / PhD</option>
                            <option value="Diploma / Certificate">Diploma / Certificate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-secondary font-medium mb-1">Institution</label>
                          <input
                            type="text"
                            value={rec.institution}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].institution = e.target.value;
                              updateField("academicHistory", hist);
                            }}
                            placeholder="e.g. University of Manchester"
                            className="w-full p-2 bg-input border border-default rounded-lg text-primary outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-secondary font-medium mb-1">Degree Title</label>
                          <input
                            type="text"
                            value={rec.degreeTitle}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].degreeTitle = e.target.value;
                              updateField("academicHistory", hist);
                            }}
                            placeholder="e.g. BSc Computer Science"
                            className="w-full p-2 bg-input border border-default rounded-lg text-primary outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-secondary font-medium mb-1">Grade / GPA</label>
                          <input
                            type="text"
                            value={rec.gradeGpa}
                            onChange={(e) => {
                              const hist = [...(data.academicHistory || [])];
                              hist[index].gradeGpa = e.target.value;
                              updateField("academicHistory", hist);
                            }}
                            placeholder="e.g. 3.8/4.0 or First Class"
                            className="w-full p-2 bg-input border border-default rounded-lg text-primary outline-none focus:border-emerald-500"
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
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-primary font-heading border-b border-subtle pb-3">Study Preferences & Budget</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Preferred Destination</label>
                  <select
                    value={data.preferredDestination || ""}
                    onChange={(e) => updateField("preferredDestination", e.target.value)}
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="">Select country...</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="United States">United States</option>
                    <option value="Germany">Germany</option>
                    <option value="Ireland">Ireland</option>
                  </select>
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Target Intake</label>
                  <input
                    type="text"
                    value={data.preferredIntake || ""}
                    onChange={(e) => updateField("preferredIntake", e.target.value)}
                    placeholder="e.g. Fall 2026"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Annual Tuition Budget (USD)</label>
                  <input
                    type="number"
                    value={data.budgetAnnualUsd || ""}
                    onChange={(e) => updateField("budgetAnnualUsd", Number(e.target.value))}
                    step="1000"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ENGLISH */}
          {activeTab === 'english' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-primary font-heading border-b border-subtle pb-3">English Proficiency & Gap Justification</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">English Test Type</label>
                  <select
                    value={data.englishProficiency?.testType || "IELTS"}
                    onChange={(e) => updateNestedField("englishProficiency", "testType", e.target.value)}
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="IELTS">IELTS Academic</option>
                    <option value="PTE">PTE Academic</option>
                    <option value="TOEFL">TOEFL iBT</option>
                    <option value="Duolingo">Duolingo English Test</option>
                    <option value="MOI Evidence">Medium of Instruction (MOI)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Overall Score / Band</label>
                  <input
                    type="text"
                    value={data.englishProficiency?.overallScore || ""}
                    onChange={(e) => updateNestedField("englishProficiency", "overallScore", e.target.value)}
                    placeholder="e.g. 7.0"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="sm:col-span-2 mt-4">
                  <label className="block text-secondary font-semibold mb-1.5">Study Gap Justification</label>
                  <p className="text-xs text-muted mb-2">If you have gaps of more than 6 months between your studies, explain what you were doing (e.g. working full-time, exam preparation).</p>
                  <textarea
                    rows={3}
                    value={data.studyGapJustification || ""}
                    onChange={(e) => updateField("studyGapJustification", e.target.value)}
                    placeholder="Explain any study gaps..."
                    className="w-full p-3 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FINANCIAL */}
          {activeTab === 'financial' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-primary font-heading border-b border-subtle pb-3">Financial Sponsor</h2>
              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-600/90 dark:text-amber-400 mb-4 flex gap-2">
                <CreditCard className="w-4 h-4 shrink-0" />
                <p>Universities and embassies require proof that you have sufficient funds to cover tuition and living expenses.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Sponsor Full Name</label>
                  <input
                    type="text"
                    value={data.financialSponsor?.name || ""}
                    onChange={(e) => updateNestedField("financialSponsor", "name", e.target.value)}
                    placeholder="e.g. Self or Parent Name"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Relationship to Student</label>
                  <select
                    value={data.financialSponsor?.relationship || "Parent"}
                    onChange={(e) => updateNestedField("financialSponsor", "relationship", e.target.value)}
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="Self">Self-Funded</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Government Scholarship">Government Scholarship</option>
                    <option value="Corporate Sponsor">Corporate Sponsor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-secondary font-semibold mb-1.5">Annual Income (USD Equivalent)</label>
                  <input
                    type="number"
                    value={data.financialSponsor?.annualIncomeUSD || ""}
                    onChange={(e) => updateNestedField("financialSponsor", "annualIncomeUSD", Number(e.target.value))}
                    step="5000"
                    className="w-full p-2.5 bg-input border border-default rounded-xl text-primary focus:border-emerald-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
