import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Eye,
  FileText,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  User,
  ShieldCheck,
  FileCheck,
  Globe,
  Plus,
  Loader2,
  Calendar,
  Download,
  AlertTriangle,
  Building,
  FileUp,
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  ApplicationWizardFormData,
  WizardDocumentUpload,
  validateWizardDocumentFile,
  validateStep1Personal,
  validateStep2Emergency,
  validateStep3Academic,
  validateStep4GapsAndImmigration,
  validateStep5Documents,
  validateStep6Declaration,
  submitPublicApplication,
  cleanPayload,
} from "../../utils/applicationIntakeTriage";

const STEPS = [
  { id: 1, title: "Personal Details", subtitle: "Passport & Identity", icon: User },
  { id: 2, title: "Guardian & Emergency", subtitle: "Next of Kin Contact", icon: ShieldCheck },
  { id: 3, title: "Academic & English", subtitle: "Qualifications & Tests", icon: GraduationCap },
  { id: 4, title: "Gaps & Immigration", subtitle: "Refusal & Gap History", icon: Globe },
  { id: 5, title: "Document Vault", subtitle: "10MB PDF/JPG/PNG", icon: FileUp },
  { id: 6, title: "Review & Sign", subtitle: "Legal Declaration", icon: FileCheck },
];

const INITIAL_FORM_DATA: ApplicationWizardFormData = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  nationality: "",
  countryOfResidence: "",
  passportNumber: "",
  passportExpiry: "",
  passportIssueCountry: "",
  emergencyContact: {
    name: "",
    relation: "",
    phone: "",
    email: "",
    address: "",
  },
  academicHistory: [
    {
      institution: "",
      qualification: "High School / A-Levels",
      passingYear: new Date().getFullYear(),
      gradeScale: "Percentage (%)",
      score: "",
      country: "",
    },
  ],
  englishProficiency: {
    testType: "IELTS",
    overallScore: "",
    trfNumber: "",
    testDate: "",
  },
  studyGaps: [],
  immigrationHistory: {
    hasPriorRefusal: false,
    refusalDetails: "",
    refusalCountries: [],
  },
  documents: [],
  declaration: {
    signedName: "",
    agreedAt: "",
    consentGiven: false,
  },
  agentReferred: false,
  tenantId: "tenant-london",
};

export const ApplicationWizard: React.FC = () => {
  const { token, applicationId: paramAppId } = useParams<{ token?: string; applicationId?: string }>();
  const activeId = token || paramAppId || "draft-intake";

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ApplicationWizardFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string>("");
  const [activeDocCategory, setActiveDocCategory] = useState<WizardDocumentUpload["category"]>("passport");
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewModalDoc, setPreviewModalDoc] = useState<WizardDocumentUpload | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing application or draft if exists
  useEffect(() => {
    let isMounted = true;
    const loadApplication = async () => {
      try {
        setLoading(true);
        if (activeId && activeId !== "draft-intake") {
          const appRef = doc(db, "applications", activeId);
          const snap = await getDoc(appRef);
          if (snap.exists() && isMounted) {
            const data = snap.data();
            setFormData((prev) => ({
              ...prev,
              fullName: data.studentName || prev.fullName,
              email: data.studentEmail || prev.email,
              phone: data.phone || prev.phone,
              dob: data.dob || prev.dob,
              gender: data.gender || prev.gender,
              nationality: data.nationality || prev.nationality,
              countryOfResidence: data.countryOfResidence || prev.countryOfResidence,
              passportNumber: data.passportNumber || prev.passportNumber,
              passportExpiry: data.passportExpiry || prev.passportExpiry,
              passportIssueCountry: data.passportIssueCountry || prev.passportIssueCountry,
              emergencyContact: data.emergencyContact || prev.emergencyContact,
              academicHistory: data.academicHistory?.length ? data.academicHistory : prev.academicHistory,
              englishProficiency: data.englishProficiency || prev.englishProficiency,
              studyGaps: data.studyGaps || prev.studyGaps,
              immigrationHistory: data.immigrationHistory || prev.immigrationHistory,
              documents: data.documents || prev.documents,
              declaration: data.declaration || prev.declaration,
              agentReferred: data.agentReferred ?? prev.agentReferred,
              agentUid: data.agentUid,
              agentName: data.agentName,
              tenantId: data.tenantId || prev.tenantId,
              universityId: data.universityId,
              universityName: data.universityName,
              programmeId: data.programmeId,
              programmeName: data.programmeName,
              intake: data.intake,
            }));
            if (data.wizardStepCompleted && data.wizardStepCompleted >= 1 && data.wizardStepCompleted <= 6) {
              setCurrentStep(Math.min(data.wizardStepCompleted + 1, 6));
            }
            if (data.status === "Submitted" || data.stage === "Ready for Submission") {
              setIsSubmitted(true);
              setSubmittedRef(data.applicationNumber || activeId);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load remote draft application, using fresh session:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadApplication();
    return () => {
      isMounted = false;
    };
  }, [activeId]);

  // Debounced auto-save function
  const triggerAutoSave = (dataToSave: ApplicationWizardFormData, step: number) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!activeId || activeId === "draft-intake" || isSubmitted) return;
      try {
        setSaving(true);
        const appRef = doc(db, "applications", activeId);
        const cleanUpdate = cleanPayload({
          studentName: dataToSave.fullName,
          studentEmail: dataToSave.email,
          wizardStepCompleted: step,
          currentStep: step,
          emergencyContact: dataToSave.emergencyContact,
          academicHistory: dataToSave.academicHistory,
          englishProficiency: dataToSave.englishProficiency,
          studyGaps: dataToSave.studyGaps,
          immigrationHistory: dataToSave.immigrationHistory,
          documents: dataToSave.documents,
          updatedAt: Date.now(),
        });
        await updateDoc(appRef, cleanUpdate);
        setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } catch (err) {
        console.warn("Auto-save sync:", err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  const updateFormData = (updater: (prev: ApplicationWizardFormData) => ApplicationWizardFormData) => {
    setFormData((prev) => {
      const next = updater(prev);
      triggerAutoSave(next, currentStep);
      return next;
    });
  };

  // Step Validation Check
  const validateCurrentStep = (stepNum: number): boolean => {
    let stepErrors: Record<string, string> = {};
    if (stepNum === 1) {
      stepErrors = validateStep1Personal(formData);
    } else if (stepNum === 2) {
      stepErrors = validateStep2Emergency(formData.emergencyContact);
    } else if (stepNum === 3) {
      stepErrors = validateStep3Academic(formData.academicHistory, formData.englishProficiency);
    } else if (stepNum === 4) {
      stepErrors = validateStep4GapsAndImmigration(formData.studyGaps, formData.immigrationHistory);
    } else if (stepNum === 5) {
      stepErrors = validateStep5Documents(formData.documents);
    } else if (stepNum === 6) {
      stepErrors = validateStep6Declaration(formData.declaration);
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setErrors({});
      const next = Math.min(currentStep + 1, 6);
      setCurrentStep(next);
      triggerAutoSave(formData, next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Document Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateWizardDocumentFile({
      size: file.size,
      type: file.type,
      name: file.name,
    });

    if (!validation.valid) {
      setFileError(validation.error || "File upload rejected.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const previewUrl = event.target?.result as string;
      const newDoc: WizardDocumentUpload = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category: activeDocCategory,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        previewUrl,
        uploadedAt: Date.now(),
      };

      updateFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (id: string) => {
    updateFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (!validateCurrentStep(6)) return;
    setSubmitting(true);
    try {
      const res = await submitPublicApplication(db, activeId, formData, formData.tenantId);
      if (res.success) {
        setIsSubmitted(true);
        setSubmittedRef(activeId);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(res.error || "Submission failed. Please check your network and try again.");
      }
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Academic History Helpers
  const addAcademicRecord = () => {
    updateFormData((prev) => ({
      ...prev,
      academicHistory: [
        ...prev.academicHistory,
        {
          institution: "",
          qualification: "Bachelor's Degree",
          passingYear: new Date().getFullYear(),
          gradeScale: "CGPA (Out of 4.0)",
          score: "",
          country: "",
        },
      ],
    }));
  };

  const removeAcademicRecord = (index: number) => {
    if (formData.academicHistory.length <= 1) return;
    updateFormData((prev) => ({
      ...prev,
      academicHistory: prev.academicHistory.filter((_, idx) => idx !== index),
    }));
  };

  // Study Gap Helpers
  const addStudyGap = () => {
    updateFormData((prev) => ({
      ...prev,
      studyGaps: [
        ...prev.studyGaps,
        {
          startDate: "",
          endDate: "",
          explanation: "",
          documentationAttached: false,
        },
      ],
    }));
  };

  const removeStudyGap = (index: number) => {
    updateFormData((prev) => ({
      ...prev,
      studyGaps: prev.studyGaps.filter((_, idx) => idx !== index),
    }));
  };

  // Progress percentage
  const progressPercent = useMemo(() => {
    return Math.round(((currentStep - 1) / 5) * 100);
  }, [currentStep]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-[#F5A623] animate-spin mb-4" />
        <h2 className="text-xl font-semibold tracking-wide">Loading Application Intake...</h2>
        <p className="text-sm text-slate-400 mt-1">Connecting to EduBridge Network compliance vault</p>
      </div>
    );
  }

  // Submitted Success View
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl w-full bg-[#141f36] border border-[#1e3366] rounded-3xl p-8 sm:p-12 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#10B981] via-[#F5A623] to-[#10B981]" />
          
          <div className="w-20 h-20 bg-[#10B981]/20 border-2 border-[#10B981] text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#10B981]/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 mb-3 tracking-wider uppercase">
            Official Application Received
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Application Submitted Successfully!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto mb-6 leading-relaxed">
            Thank you, <strong className="text-white">{formData.fullName}</strong>. Your full dossier and compliance documents have been encrypted and submitted to the admissions evaluation desk.
          </p>

          <div className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-5 mb-8 text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-[#1e3366]">
              <span>Reference Number:</span>
              <span className="font-mono font-bold text-[#F5A623] text-sm">{submittedRef}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-[#1e3366]">
              <span>Signed Declaration:</span>
              <span className="font-medium text-slate-200">{formData.declaration.signedName || formData.fullName}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Triage Queue:</span>
              <span className="text-[#10B981] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> EduBridge Verified
              </span>
            </div>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <div className="p-4 rounded-xl bg-[#1a2a4f]/50 border border-[#1e3366] text-xs text-slate-300 text-left space-y-1.5">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#F5A623]" /> What happens next?
              </p>
              <p>1. Our admissions compliance team audits your qualifications & documents.</p>
              <p>2. A dedicated counsellor will contact you via email at <span className="text-slate-100 font-medium">{formData.email}</span> within 24-48 hours.</p>
              <p>3. CAS / Visa preparation instructions will be issued upon conditional offer release.</p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 px-4 rounded-xl bg-[#1e3366] hover:bg-[#264282] text-white text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Application Summary (PDF)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col selection:bg-[#F5A623] selection:text-slate-900">
      {/* Top Compliance Header */}
      <header className="sticky top-0 z-30 bg-[#0B1120]/90 backdrop-blur-md border-b border-[#1e3366] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1a2a4f] to-[#F5A623] flex items-center justify-center font-bold text-white shadow-md">
            EB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">EduBridge Network</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Intake
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Official International Student Admissions Portal</p>
          </div>
        </div>

        {/* Live Auto-Save Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            {saving ? (
              <span className="text-[#F5A623] flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving draft...
              </span>
            ) : lastSaved ? (
              <span className="text-slate-400 hidden sm:inline">
                Auto-saved at <span className="text-slate-200">{lastSaved}</span>
              </span>
            ) : (
              <span className="text-slate-500 hidden sm:inline">Draft saved</span>
            )}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-[#141f36] border border-[#1e3366] text-xs font-mono text-slate-300">
            Ref: <span className="text-[#F5A623] font-semibold">{activeId.slice(0, 8)}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Stepper Progress Bar */}
        <section className="bg-[#141f36] border border-[#1e3366] rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#F5A623]">Step {currentStep} of 6</span>
              <h2 className="text-lg font-bold text-white tracking-tight">{STEPS[currentStep - 1].title}</h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-300">{progressPercent}%</span>
              <p className="text-[10px] text-slate-400 hidden sm:block">Dossier Completion</p>
            </div>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full h-2 bg-[#0B1120] rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-[#F5A623] to-[#10B981] transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progressPercent, 5)}%` }}
            />
          </div>

          {/* Step Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isDone = currentStep > s.id;
              const isActive = currentStep === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id < currentStep) setCurrentStep(s.id);
                  }}
                  disabled={s.id > currentStep}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition ${
                    isActive
                      ? "bg-[#1a2a4f] border border-[#F5A623] text-white shadow-md shadow-[#F5A623]/10"
                      : isDone
                      ? "bg-[#0B1120]/50 border border-[#10B981]/40 text-[#10B981] hover:bg-[#0B1120] cursor-pointer"
                      : "opacity-40 border border-transparent text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive
                        ? "bg-[#F5A623] text-slate-900"
                        : isDone
                        ? "bg-[#10B981]/20 text-[#10B981]"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold truncate leading-tight">{s.title}</p>
                    <p className="text-[10px] text-slate-400 truncate hidden md:block">{s.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step Form Body */}
        <div className="bg-[#141f36] border border-[#1e3366] rounded-3xl p-6 sm:p-8 shadow-2xl flex-1 flex flex-col justify-between">
          <div>
            {/* STEP 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#F5A623]" /> Personal & Passport Details
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide exact information as displayed on your international passport for university clearance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Legal Name (as per Passport) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="e.g. Alexander John Smith"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.fullName ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.fullName && <p className="text-rose-400 text-xs mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. alex.smith@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.email ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Phone Number (with Country Code) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +44 7700 900077"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.phone ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Date of Birth <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, dob: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 focus:outline-none focus:border-[#F5A623] ${
                        errors.dob ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.dob && <p className="text-rose-400 text-xs mt-1">{errors.dob}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-[#1e3366] text-sm text-slate-100 focus:outline-none focus:border-[#F5A623]"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nationality <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, nationality: e.target.value }))}
                      placeholder="e.g. Nigerian, Pakistani, Indian, Ghanaian"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.nationality ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.nationality && <p className="text-rose-400 text-xs mt-1">{errors.nationality}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Country of Residence <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.countryOfResidence}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, countryOfResidence: e.target.value }))}
                      placeholder="e.g. United Kingdom, Nigeria, UAE"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.countryOfResidence ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.countryOfResidence && (
                      <p className="text-rose-400 text-xs mt-1">{errors.countryOfResidence}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Passport Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.passportNumber}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, passportNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. A12345678"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] font-mono ${
                        errors.passportNumber ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.passportNumber && <p className="text-rose-400 text-xs mt-1">{errors.passportNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Passport Expiry Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.passportExpiry}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, passportExpiry: e.target.value }))}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 focus:outline-none focus:border-[#F5A623] ${
                        errors.passportExpiry ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.passportExpiry && <p className="text-rose-400 text-xs mt-1">{errors.passportExpiry}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Passport Issue Country</label>
                    <input
                      type="text"
                      value={formData.passportIssueCountry}
                      onChange={(e) => updateFormData((prev) => ({ ...prev, passportIssueCountry: e.target.value }))}
                      placeholder="e.g. Nigeria"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-[#1e3366] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Emergency Contact */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#F5A623]" /> Emergency Contact & Next of Kin
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Universities require verified emergency contacts for international safeguarding compliance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={(e) =>
                        updateFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value },
                        }))
                      }
                      placeholder="e.g. Sarah Smith"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.name ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Relationship to Applicant <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.emergencyContact.relation}
                      onChange={(e) =>
                        updateFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relation: e.target.value },
                        }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 focus:outline-none focus:border-[#F5A623] ${
                        errors.relation ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    >
                      <option value="">Select Relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Guardian">Legal Guardian</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other Relative</option>
                    </select>
                    {errors.relation && <p className="text-rose-400 text-xs mt-1">{errors.relation}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) =>
                        updateFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value },
                        }))
                      }
                      placeholder="e.g. +44 7700 900123"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.phone ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.emergencyContact.email}
                      onChange={(e) =>
                        updateFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, email: e.target.value },
                        }))
                      }
                      placeholder="e.g. guardian@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.email ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Residential Address <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.emergencyContact.address}
                      onChange={(e) =>
                        updateFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, address: e.target.value },
                        }))
                      }
                      placeholder="Full residential street address, city, state, postal code, and country"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623] ${
                        errors.address ? "border-rose-500" : "border-[#1e3366]"
                      }`}
                    />
                    {errors.address && <p className="text-rose-400 text-xs mt-1">{errors.address}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Academic Qualifications & English Proficiency */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#F5A623]" /> Academic Qualifications
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        List your highest completed secondary and tertiary qualifications.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addAcademicRecord}
                      className="px-3 py-1.5 rounded-xl bg-[#1e3366] hover:bg-[#284488] text-xs font-semibold text-[#F5A623] flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Qualification
                    </button>
                  </div>

                  {errors.academicHistory && (
                    <p className="text-rose-400 text-xs mt-2">{errors.academicHistory}</p>
                  )}

                  <div className="space-y-4 mt-4">
                    {formData.academicHistory.map((acad, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-4 sm:p-5 relative group"
                      >
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1e3366]">
                          <span className="text-xs font-bold text-slate-300">Qualification #{idx + 1}</span>
                          {formData.academicHistory.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAcademicRecord(idx)}
                              className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                              Institution / University Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={acad.institution}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateFormData((prev) => {
                                  const updated = [...prev.academicHistory];
                                  updated[idx] = { ...updated[idx], institution: val };
                                  return { ...prev, academicHistory: updated };
                                });
                              }}
                              placeholder="e.g. University of Lagos"
                              className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                            />
                            {errors[`academic_${idx}_institution`] && (
                              <p className="text-rose-400 text-[10px] mt-1">{errors[`academic_${idx}_institution`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                              Country of Institution
                            </label>
                            <input
                              type="text"
                              value={acad.country}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateFormData((prev) => {
                                  const updated = [...prev.academicHistory];
                                  updated[idx] = { ...updated[idx], country: val };
                                  return { ...prev, academicHistory: updated };
                                });
                              }}
                              placeholder="e.g. Nigeria"
                              className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                              Qualification Title <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={acad.qualification}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateFormData((prev) => {
                                  const updated = [...prev.academicHistory];
                                  updated[idx] = { ...updated[idx], qualification: val };
                                  return { ...prev, academicHistory: updated };
                                });
                              }}
                              placeholder="e.g. BSc Computer Science"
                              className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                            />
                            {errors[`academic_${idx}_qualification`] && (
                              <p className="text-rose-400 text-[10px] mt-1">{errors[`academic_${idx}_qualification`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                              Passing Year <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="number"
                              min={1970}
                              max={new Date().getFullYear() + 2}
                              value={acad.passingYear}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                updateFormData((prev) => {
                                  const updated = [...prev.academicHistory];
                                  updated[idx] = { ...updated[idx], passingYear: val };
                                  return { ...prev, academicHistory: updated };
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 focus:outline-none focus:border-[#F5A623]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                              Grade / Score <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={acad.score}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateFormData((prev) => {
                                  const updated = [...prev.academicHistory];
                                  updated[idx] = { ...updated[idx], score: val };
                                  return { ...prev, academicHistory: updated };
                                });
                              }}
                              placeholder="e.g. 3.8 / 4.0 or First Class (82%)"
                              className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                            />
                            {errors[`academic_${idx}_score`] && (
                              <p className="text-rose-400 text-[10px] mt-1">{errors[`academic_${idx}_score`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* English Language Proficiency */}
                <div className="pt-6 border-t border-[#1e3366]">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                    <Globe className="w-5 h-5 text-[#F5A623]" /> English Language Proficiency
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    UKVI compliance mandates evidence of English proficiency or approved WAEC / high school exemptions.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0B1120] border border-[#1e3366] rounded-2xl p-4 sm:p-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Test Type / Waiver</label>
                      <select
                        value={formData.englishProficiency.testType}
                        onChange={(e) =>
                          updateFormData((prev) => ({
                            ...prev,
                            englishProficiency: {
                              ...prev.englishProficiency,
                              testType: e.target.value as any,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 focus:outline-none focus:border-[#F5A623]"
                      >
                        <option value="IELTS">IELTS Academic</option>
                        <option value="PTE">PTE Academic</option>
                        <option value="TOEFL">TOEFL iBT</option>
                        <option value="Duolingo">Duolingo English Test (DET)</option>
                        <option value="WAEC">WAEC / WASSCE English (Grade C6+)</option>
                        <option value="None">None / English Waiver Pending</option>
                      </select>
                    </div>

                    {formData.englishProficiency.testType !== "None" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Overall Score / Grade <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.englishProficiency.overallScore || ""}
                            onChange={(e) =>
                              updateFormData((prev) => ({
                                ...prev,
                                englishProficiency: {
                                  ...prev.englishProficiency,
                                  overallScore: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g. 7.5 or C4"
                            className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                          />
                          {errors.englishScore && (
                            <p className="text-rose-400 text-[10px] mt-1">{errors.englishScore}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            TRF / Candidate Reg Number
                          </label>
                          <input
                            type="text"
                            value={formData.englishProficiency.trfNumber || ""}
                            onChange={(e) =>
                              updateFormData((prev) => ({
                                ...prev,
                                englishProficiency: {
                                  ...prev.englishProficiency,
                                  trfNumber: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g. 23NG001234SMIA001A"
                            className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Test Date</label>
                          <input
                            type="date"
                            value={formData.englishProficiency.testDate || ""}
                            onChange={(e) =>
                              updateFormData((prev) => ({
                                ...prev,
                                englishProficiency: {
                                  ...prev.englishProficiency,
                                  testDate: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 focus:outline-none focus:border-[#F5A623]"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Study Gaps & Immigration Refusals */}
            {currentStep === 4 && (
              <div className="space-y-8">
                {/* Study Gaps Section */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#F5A623]" /> Study Gaps Justification
                      </h3>
                      <p className="text-xs text-slate-400">
                        Detail any gap exceeding 6 months between your academic qualifications or employment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addStudyGap}
                      className="px-3 py-1.5 rounded-xl bg-[#1e3366] hover:bg-[#284488] text-xs font-semibold text-[#F5A623] flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Study Gap
                    </button>
                  </div>

                  {formData.studyGaps.length === 0 ? (
                    <div className="bg-[#0B1120] border border-dashed border-[#1e3366] rounded-2xl p-6 text-center text-slate-400 text-xs">
                      No study gaps recorded. If you have no gaps exceeding 6 months, you may proceed.
                    </div>
                  ) : (
                    <div className="space-y-4 mt-3">
                      {formData.studyGaps.map((gap, idx) => (
                        <div key={idx} className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-4 sm:p-5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-slate-300">Gap #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeStudyGap(idx)}
                              className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Gap Start Date <span className="text-rose-400">*</span>
                              </label>
                              <input
                                type="date"
                                value={gap.startDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateFormData((prev) => {
                                    const gaps = [...prev.studyGaps];
                                    gaps[idx] = { ...gaps[idx], startDate: val };
                                    return { ...prev, studyGaps: gaps };
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 focus:outline-none focus:border-[#F5A623]"
                              />
                              {errors[`gap_${idx}_start`] && (
                                <p className="text-rose-400 text-[10px] mt-1">{errors[`gap_${idx}_start`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                Gap End Date <span className="text-rose-400">*</span>
                              </label>
                              <input
                                type="date"
                                value={gap.endDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateFormData((prev) => {
                                    const gaps = [...prev.studyGaps];
                                    gaps[idx] = { ...gaps[idx], endDate: val };
                                    return { ...prev, studyGaps: gaps };
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 focus:outline-none focus:border-[#F5A623]"
                              />
                              {errors[`gap_${idx}_end`] && (
                                <p className="text-rose-400 text-[10px] mt-1">{errors[`gap_${idx}_end`]}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                              Explanation (Work experience, family commitment, health, etc.){" "}
                              <span className="text-rose-400">*</span>
                            </label>
                            <textarea
                              rows={2}
                              value={gap.explanation}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateFormData((prev) => {
                                  const gaps = [...prev.studyGaps];
                                  gaps[idx] = { ...gaps[idx], explanation: val };
                                  return { ...prev, studyGaps: gaps };
                                });
                              }}
                              placeholder="Provide genuine and clear explanation for this gap period"
                              className="w-full px-3 py-2 rounded-xl bg-[#141f36] border border-[#1e3366] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
                            />
                            {errors[`gap_${idx}_explanation`] && (
                              <p className="text-rose-400 text-[10px] mt-1">{errors[`gap_${idx}_explanation`]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Immigration & Visa Refusal History */}
                <div className="pt-6 border-t border-[#1e3366]">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                    <Globe className="w-5 h-5 text-[#F5A623]" /> Immigration & Visa Refusal History
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Full disclosure is strictly required under UKVI Home Office and international immigration laws.
                  </p>

                  <div className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">
                        Have you ever been refused a visa or entry clearance to any country?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData((prev) => ({
                              ...prev,
                              immigrationHistory: { ...prev.immigrationHistory, hasPriorRefusal: false },
                            }))
                          }
                          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                            !formData.immigrationHistory.hasPriorRefusal
                              ? "bg-[#10B981] text-slate-900"
                              : "bg-[#141f36] text-slate-400 hover:text-white"
                          }`}
                        >
                          No Refusals
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData((prev) => ({
                              ...prev,
                              immigrationHistory: { ...prev.immigrationHistory, hasPriorRefusal: true },
                            }))
                          }
                          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                            formData.immigrationHistory.hasPriorRefusal
                              ? "bg-rose-500 text-white"
                              : "bg-[#141f36] text-slate-400 hover:text-white"
                          }`}
                        >
                          Yes, Prior Refusal
                        </button>
                      </div>
                    </div>

                    {formData.immigrationHistory.hasPriorRefusal && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-4">
                        <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Mandatory Compliance Disclosure: Failure to declare prior refusals will result in automatic rejection.
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-200 mb-1">
                            Countries of Prior Refusal <span className="text-rose-400">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {["United Kingdom", "United States", "Canada", "Australia", "Schengen Area", "Ireland"].map(
                              (country) => {
                                const isSelected =
                                  formData.immigrationHistory.refusalCountries?.includes(country);
                                return (
                                  <button
                                    key={country}
                                    type="button"
                                    onClick={() => {
                                      updateFormData((prev) => {
                                        const current = prev.immigrationHistory.refusalCountries || [];
                                        const updated = isSelected
                                          ? current.filter((c) => c !== country)
                                          : [...current, country];
                                        return {
                                          ...prev,
                                          immigrationHistory: { ...prev.immigrationHistory, refusalCountries: updated },
                                        };
                                      });
                                    }}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                      isSelected
                                        ? "bg-rose-500 text-white border border-rose-400"
                                        : "bg-[#141f36] text-slate-300 border border-[#1e3366] hover:bg-[#1a2a4f]"
                                    }`}
                                  >
                                    {country}
                                  </button>
                                );
                              }
                            )}
                          </div>
                          {errors.refusalCountries && (
                            <p className="text-rose-400 text-xs mt-1">{errors.refusalCountries}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-200 mb-1">
                            Refusal Context, Reasons & Decision Date <span className="text-rose-400">*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={formData.immigrationHistory.refusalDetails || ""}
                            onChange={(e) =>
                              updateFormData((prev) => ({
                                ...prev,
                                immigrationHistory: {
                                  ...prev.immigrationHistory,
                                  refusalDetails: e.target.value,
                                },
                              }))
                            }
                            placeholder="State the year of refusal, official reason from refusal letter, and if any appeal was undertaken"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#141f36] border border-rose-500/40 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400"
                          />
                          {errors.refusalDetails && (
                            <p className="text-rose-400 text-xs mt-1">{errors.refusalDetails}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Document Upload Vault */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-[#F5A623]" /> Compliance Document Vault
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload clear scanned copies. Maximum size <strong className="text-white">10MB per document</strong>. Accepted formats: PDF, JPG, PNG.
                  </p>
                </div>

                {/* Upload Category Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "passport", label: "Passport ID", required: true },
                    { id: "transcript", label: "Transcripts", required: true },
                    { id: "certificate", label: "Degree Cert", required: false },
                    { id: "english_test", label: "English Test", required: false },
                    { id: "sop", label: "SOP / Essay", required: false },
                  ].map((cat) => {
                    const count = formData.documents.filter((d) => d.category === cat.id).length;
                    const isSelected = activeDocCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveDocCategory(cat.id as any);
                          setFileError(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition relative ${
                          isSelected
                            ? "bg-[#1a2a4f] border-[#F5A623] text-white shadow-lg"
                            : "bg-[#0B1120] border-[#1e3366] text-slate-400 hover:text-white"
                        }`}
                      >
                        <p className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>{cat.label}</span>
                          {count > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[#10B981] text-slate-900 text-[10px] flex items-center justify-center font-bold">
                              {count}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {cat.required ? <span className="text-[#F5A623]">Required</span> : "Optional"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Upload Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#0B1120] border-2 border-dashed border-[#1e3366] hover:border-[#F5A623] transition rounded-3xl p-8 text-center cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-[#141f36] border border-[#1e3366] group-hover:border-[#F5A623] flex items-center justify-center mx-auto mb-3 transition shadow-inner">
                    <Upload className="w-7 h-7 text-[#F5A623]" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Upload for: <span className="text-[#F5A623] uppercase">{activeDocCategory}</span>
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click to browse or drag & drop file here. Must be under 10MB (PDF, JPG, PNG).
                  </p>
                </div>

                {fileError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {fileError}
                  </div>
                )}

                {/* Validation errors for documents */}
                {(errors.passportDoc || errors.transcriptDoc) && (
                  <div className="p-3.5 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] text-xs space-y-1">
                    {errors.passportDoc && <p>• {errors.passportDoc}</p>}
                    {errors.transcriptDoc && <p>• {errors.transcriptDoc}</p>}
                  </div>
                )}

                {/* Uploaded Documents List with Immediate Preview & Remove */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Uploaded Vault Items ({formData.documents.length})
                  </h4>

                  {formData.documents.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No files uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-3 flex items-center justify-between gap-3 group hover:border-slate-500 transition"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {doc.mimeType.startsWith("image/") ? (
                              <img
                                src={doc.previewUrl}
                                alt={doc.fileName}
                                className="w-10 h-10 rounded-xl object-cover border border-[#1e3366] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}

                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-100 truncate">{doc.fileName}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="uppercase font-mono text-[#F5A623]">{doc.category}</span>
                                <span>•</span>
                                <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewModalDoc(doc)}
                              title="Preview Document"
                              className="p-1.5 rounded-lg bg-[#141f36] hover:bg-[#1a2a4f] text-slate-300 hover:text-white transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              title="Remove Document"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Review, Legal Declaration & Digital Signature */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#F5A623]" /> Review, Legal Declaration & Signature
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Review your application summary and execute the binding admissions compliance declaration.
                  </p>
                </div>

                {/* Dossier Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e3366]">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#F5A623]" /> Applicant Profile
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-[#F5A623] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-slate-300">
                      <strong>Name:</strong> {formData.fullName || "—"}
                    </p>
                    <p className="text-slate-300">
                      <strong>Email:</strong> {formData.email || "—"}
                    </p>
                    <p className="text-slate-300">
                      <strong>Passport:</strong> {formData.passportNumber || "—"} ({formData.nationality || "—"})
                    </p>
                  </div>

                  <div className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e3366]">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#F5A623]" /> Emergency Contact
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[#F5A623] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-slate-300">
                      <strong>Name:</strong> {formData.emergencyContact.name || "—"} ({formData.emergencyContact.relation || "—"})
                    </p>
                    <p className="text-slate-300">
                      <strong>Phone:</strong> {formData.emergencyContact.phone || "—"}
                    </p>
                    <p className="text-slate-300">
                      <strong>Email:</strong> {formData.emergencyContact.email || "—"}
                    </p>
                  </div>

                  <div className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e3366]">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#F5A623]" /> Qualifications
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-[#F5A623] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-slate-300">
                      <strong>Primary:</strong> {formData.academicHistory[0]?.qualification || "—"} at{" "}
                      {formData.academicHistory[0]?.institution || "—"} ({formData.academicHistory[0]?.score || "—"})
                    </p>
                    <p className="text-slate-300">
                      <strong>English:</strong> {formData.englishProficiency.testType} (Score:{" "}
                      {formData.englishProficiency.overallScore || "N/A"})
                    </p>
                  </div>

                  <div className="bg-[#0B1120] border border-[#1e3366] rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e3366]">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <FileUp className="w-3.5 h-3.5 text-[#F5A623]" /> Uploaded Files
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="text-[#F5A623] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-slate-300">
                      <strong>Total Attached:</strong> {formData.documents.length} document(s)
                    </p>
                    <p className="text-slate-300">
                      <strong>Prior Refusals:</strong>{" "}
                      {formData.immigrationHistory.hasPriorRefusal ? (
                        <span className="text-rose-400 font-semibold">Yes (Declared)</span>
                      ) : (
                        <span className="text-[#10B981] font-semibold">No Refusals</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Legal Declaration Terms */}
                <div className="p-5 rounded-2xl bg-[#0B1120] border border-[#1e3366] space-y-4">
                  <div className="text-xs text-slate-300 leading-relaxed space-y-2 bg-[#141f36]/60 p-4 rounded-xl border border-[#1e3366]/50">
                    <p className="font-bold text-white">EduBridge Network Legal & Compliance Accord:</p>
                    <p>
                      1. I certify that all information submitted in this application is genuine, accurate, and complete. I understand that any false, omitted, or misleading documentation constitutes grounds for instant disqualification and reporting to immigration authorities (UKVI).
                    </p>
                    <p>
                      2. I authorize EduBridge Network and its designated educational partner institutions to verify my academic credentials, English test results, financial status, and immigration background with relevant bodies.
                    </p>
                    <p>
                      3. I consent to the processing and cross-border transfer of my personal data in accordance with the UK GDPR and Data Protection Act 2018.
                    </p>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.declaration.consentGiven}
                      onChange={(e) =>
                        updateFormData((prev) => ({
                          ...prev,
                          declaration: {
                            ...prev.declaration,
                            consentGiven: e.target.checked,
                            agreedAt: e.target.checked ? new Date().toISOString() : "",
                          },
                        }))
                      }
                      className="w-4 h-4 mt-0.5 rounded border-[#1e3366] text-[#F5A623] focus:ring-[#F5A623] bg-[#141f36]"
                    />
                    <span className="text-xs text-slate-200 group-hover:text-white font-medium">
                      I have read, understood, and agree to the EduBridge Network admissions terms, UKVI compliance statements, and data processing policies. <span className="text-rose-400">*</span>
                    </span>
                  </label>
                  {errors.consentGiven && <p className="text-rose-400 text-xs">{errors.consentGiven}</p>}

                  {/* Digital Signature */}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Digital Legal Signature (Type your Full Legal Name) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.declaration.signedName}
                        onChange={(e) =>
                          updateFormData((prev) => ({
                            ...prev,
                            declaration: { ...prev.declaration, signedName: e.target.value },
                          }))
                        }
                        placeholder="e.g. Alexander John Smith"
                        className={`w-full px-4 py-3 rounded-xl bg-[#141f36] border text-sm text-slate-100 placeholder-slate-500 font-serif italic tracking-wide focus:outline-none focus:border-[#F5A623] ${
                          errors.signedName ? "border-rose-500" : "border-[#1e3366]"
                        }`}
                      />
                      {formData.declaration.signedName && (
                        <div className="absolute right-3 top-3 text-[11px] text-[#10B981] font-mono flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Certified
                        </div>
                      )}
                    </div>
                    {errors.signedName && <p className="text-rose-400 text-xs mt-1">{errors.signedName}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">
                      By typing your name, you acknowledge this operates as an immutable electronic signature under the Electronic Communications Act.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Action Buttons */}
          <div className="pt-8 mt-6 border-t border-[#1e3366] flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                currentStep === 1
                  ? "opacity-30 cursor-not-allowed bg-[#0B1120] text-slate-500"
                  : "bg-[#0B1120] hover:bg-[#1a2a4f] text-slate-200 border border-[#1e3366]"
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#d97706] hover:from-[#f8b446] hover:to-[#e58a18] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#F5A623]/20 transition"
              >
                Continue to Step {currentStep + 1} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34d399] hover:to-[#10B981] text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xl shadow-[#10B981]/25 transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Submit Official Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Document Inline Preview Modal */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141f36] border border-[#1e3366] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#1e3366] flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-white truncate max-w-md">{previewModalDoc.fileName}</h4>
                <p className="text-[10px] text-slate-400 uppercase font-mono">
                  {previewModalDoc.category} • {(previewModalDoc.fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-[#0B1120]">
              {previewModalDoc.mimeType.startsWith("image/") ? (
                <img
                  src={previewModalDoc.previewUrl}
                  alt={previewModalDoc.fileName}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-rose-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-200">{previewModalDoc.fileName}</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Adobe PDF Document</p>
                  <a
                    href={previewModalDoc.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e3366] hover:bg-[#284488] text-xs font-semibold text-white transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Open / Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApplicationWizard;
