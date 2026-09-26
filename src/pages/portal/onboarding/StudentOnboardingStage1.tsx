import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import {
  User,
  GraduationCap,
  Globe,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Loader2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { auth, db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { AcademicRecord, QualificationLevel, Student } from "../../../types/student";
import { calculateProfileCompleteness } from "../../../utils/profileCompleteness";
import { toCountryName, ExtractedStudentCVData, COMMON_COUNTRIES } from "../../../utils/cvExtractor";
import { StudentCVUploader } from "../../../components/ai/StudentCVUploader";
import { getRoleBackground } from "../../../utils/roleBackgrounds";
import { getRoleDashboardPath } from "../../../types/registrationConfig";

const STUDY_LEVELS = [
  "Foundation",
  "Diploma",
  "Bachelor's",
  "Master's",
  "MPhil",
  "PhD",
  "Other",
];

const QUALIFICATIONS: QualificationLevel[] = [
  "High School / A-Levels",
  "Diploma / Certificate",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate / PhD",
];

const COUNTRIES = COMMON_COUNTRIES;

export const StudentOnboardingStage1: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [currentStage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Personal Info - initialized with immediate fallback to registration cache
  const [firstName, setFirstName] = useState(() => {
    try {
      return sessionStorage.getItem("student_registration_first_name") || "";
    } catch {
      return "";
    }
  });
  const [lastName, setLastName] = useState(() => {
    try {
      return sessionStorage.getItem("student_registration_last_name") || "";
    } catch {
      return "";
    }
  });
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Student["gender"]>("Prefer not to say");
  const [nationality, setNationality] = useState(() => {
    try {
      return sessionStorage.getItem("student_registration_nationality") || "Pakistan";
    } catch {
      return "Pakistan";
    }
  });
  const [countryOfResidence, setCountryOfResidence] = useState(() => {
    try {
      return sessionStorage.getItem("student_registration_country") || "Pakistan";
    } catch {
      return "Pakistan";
    }
  });
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState(() => {
    try {
      return sessionStorage.getItem("student_registration_phone") || "";
    } catch {
      return "";
    }
  });
  const email = firebaseUser?.email || appUser?.email || "";

  // Academic History
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([
    {
      institution: "",
      qualification: "Bachelor's Degree",
      degreeTitle: "",
      country: "Pakistan",
      completionYear: 2024,
      gradeGpa: "",
    },
  ]);

  // Study Level Goal (initially empty so not automatically pre-selected)
  const [desiredStudyLevel, setDesiredStudyLevel] = useState("");

  // Redirect non-students away from student onboarding immediately
  useEffect(() => {
    if (appUser && appUser.role !== "student") {
      navigate(getRoleDashboardPath(appUser.role), { replace: true });
    }
  }, [appUser, navigate]);

  // Load existing profile from Firestore with comprehensive multi-tier fallback
  useEffect(() => {
    const fetchProfile = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        let loadedFirst = "";
        let loadedLast = "";
        let loadedPhone = "";
        let loadedNationality = "";
        let loadedResidence = "";
        let loadedCity = "";
        let loadedDob = "";
        let loadedGender: Student["gender"] = undefined;
        let loadedStudyLevel = "";
        let loadedAcademic: AcademicRecord[] = [];

        // 1. Primary Source: `students` collection doc
        const studentSnap = await getDoc(doc(db, "students", uid));
        if (studentSnap.exists()) {
          const data = studentSnap.data() as Student;
          if (data.firstName) loadedFirst = data.firstName;
          if (data.lastName) loadedLast = data.lastName;
          if ((!loadedFirst || !loadedLast) && data.fullName) {
            const parts = data.fullName.trim().split(/\s+/);
            if (!loadedFirst) loadedFirst = parts[0] || "";
            if (!loadedLast) loadedLast = parts.slice(1).join(" ") || "";
          }
          if (data.phone) loadedPhone = data.phone;
          if (data.dob) loadedDob = data.dob;
          if (data.gender) loadedGender = data.gender;
          if ((data as any).city) loadedCity = (data as any).city;
          if ((data as any).desiredStudyLevel) loadedStudyLevel = (data as any).desiredStudyLevel;
          if (data.nationality) loadedNationality = data.nationality;
          if (data.countryOfResidence) loadedResidence = data.countryOfResidence;
          if (data.academicHistory && data.academicHistory.length > 0) {
            loadedAcademic = data.academicHistory as AcademicRecord[];
          }
        }

        // 2. Secondary Source: `users` collection doc fallback
        if (!loadedFirst || !loadedLast || !loadedPhone) {
          try {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              if (!loadedFirst && uData.firstName) loadedFirst = uData.firstName;
              if (!loadedLast && uData.lastName) loadedLast = uData.lastName;
              if ((!loadedFirst || !loadedLast) && uData.displayName) {
                const parts = uData.displayName.trim().split(/\s+/);
                if (!loadedFirst) loadedFirst = parts[0] || "";
                if (!loadedLast) loadedLast = parts.slice(1).join(" ") || "";
              }
              if (!loadedPhone && uData.phone) loadedPhone = uData.phone;
            }
          } catch (uErr) {
            console.warn("Could not check users collection fallback:", uErr);
          }
        }

        // 3. Tertiary Source: Context User Profile displayName
        if ((!loadedFirst || !loadedLast) && appUser?.displayName) {
          const parts = appUser.displayName.trim().split(/\s+/);
          if (!loadedFirst) loadedFirst = parts[0] || "";
          if (!loadedLast) loadedLast = parts.slice(1).join(" ") || "";
        }
        if ((!loadedFirst || !loadedLast) && firebaseUser?.displayName) {
          const parts = firebaseUser.displayName.trim().split(/\s+/);
          if (!loadedFirst) loadedFirst = parts[0] || "";
          if (!loadedLast) loadedLast = parts.slice(1).join(" ") || "";
        }

        // 4. Session Storage Registration Cache
        try {
          if (!loadedFirst) loadedFirst = sessionStorage.getItem("student_registration_first_name") || "";
          if (!loadedLast) loadedLast = sessionStorage.getItem("student_registration_last_name") || "";
          if (!loadedFirst && !loadedLast) {
            const sessionFull = sessionStorage.getItem("student_registration_full_name") || "";
            if (sessionFull) {
              const parts = sessionFull.trim().split(/\s+/);
              loadedFirst = parts[0] || "";
              loadedLast = parts.slice(1).join(" ") || "";
            }
          }
          if (!loadedPhone) loadedPhone = sessionStorage.getItem("student_registration_phone") || "";
          if (!loadedNationality) loadedNationality = sessionStorage.getItem("student_registration_nationality") || "";
          if (!loadedResidence) loadedResidence = sessionStorage.getItem("student_registration_country") || "";
        } catch (_) {}

        // 5. Pre-extracted CV Cache
        try {
          const cachedCV = sessionStorage.getItem("student_extracted_cv");
          if (cachedCV) {
            const parsed = JSON.parse(cachedCV);
            if (!loadedFirst && parsed.firstName) loadedFirst = parsed.firstName;
            if (!loadedLast && parsed.lastName) loadedLast = parsed.lastName;
            if ((!loadedFirst || !loadedLast) && parsed.fullName) {
              const parts = parsed.fullName.trim().split(/\s+/);
              if (!loadedFirst) loadedFirst = parts[0] || "";
              if (!loadedLast) loadedLast = parts.slice(1).join(" ") || "";
            }
            if (!loadedPhone && parsed.phone) loadedPhone = parsed.phone;
            if (!loadedNationality && parsed.nationality) loadedNationality = parsed.nationality;
            if (!loadedResidence && parsed.countryOfResidence) loadedResidence = parsed.countryOfResidence;
            if (!loadedDob && parsed.dob) loadedDob = parsed.dob;
            if (!loadedGender && parsed.gender) loadedGender = parsed.gender;
            if (!loadedCity && parsed.city) loadedCity = parsed.city;
            if (!loadedStudyLevel && parsed.desiredStudyLevel) loadedStudyLevel = parsed.desiredStudyLevel;
            if ((!loadedAcademic || loadedAcademic.length === 0) && parsed.academicRecords?.length > 0) {
              loadedAcademic = parsed.academicRecords;
            }
          }
        } catch (_) {}

        // Commit loaded values into state
        if (loadedFirst) setFirstName(loadedFirst);
        if (loadedLast) setLastName(loadedLast);
        if (loadedPhone) setPhone(loadedPhone);
        if (loadedDob) setDob(loadedDob);
        if (loadedGender) setGender(loadedGender);
        if (loadedCity) setCity(loadedCity);
        if (loadedStudyLevel) setDesiredStudyLevel(loadedStudyLevel);

        const normalizedNat = loadedNationality ? (toCountryName(loadedNationality) || loadedNationality) : "Pakistan";
        const finalNat = COUNTRIES.includes(normalizedNat) ? normalizedNat : (COUNTRIES.includes(loadedNationality) ? loadedNationality : "Pakistan");
        setNationality(finalNat);

        const normalizedCountry = loadedResidence ? (toCountryName(loadedResidence) || loadedResidence) : "Pakistan";
        const finalCountry = COUNTRIES.includes(normalizedCountry) ? normalizedCountry : (COUNTRIES.includes(loadedResidence) ? loadedResidence : "Pakistan");
        setCountryOfResidence(finalCountry);

        if (loadedAcademic && loadedAcademic.length > 0) {
          setAcademicRecords(loadedAcademic);
        }
      } catch (err: any) {
        console.warn("Could not load student profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [appUser, firebaseUser]);

  const handleCVExtracted = (extracted: ExtractedStudentCVData) => {
    setError(null);
    let extractedFirst = extracted.firstName?.trim() || "";
    let extractedLast = extracted.lastName?.trim() || "";
    if ((!extractedFirst || !extractedLast) && extracted.fullName) {
      const parts = extracted.fullName.trim().split(/\s+/);
      if (!extractedFirst) extractedFirst = parts[0] || "";
      if (!extractedLast) extractedLast = parts.slice(1).join(" ") || "";
    }

    if (extractedFirst) setFirstName(extractedFirst);
    if (extractedLast) setLastName(extractedLast);
    if (extracted.phone) setPhone(extracted.phone.trim());
    if (extracted.dob) setDob(extracted.dob.trim());
    if (extracted.gender) setGender(extracted.gender);
    if (extracted.city) setCity(extracted.city.trim());
    if (extracted.desiredStudyLevel) setDesiredStudyLevel(extracted.desiredStudyLevel);

    const mappedCountry = toCountryName(extracted.countryOfResidence || extracted.nationality) || countryOfResidence || "Pakistan";
    const mappedNat = toCountryName(extracted.nationality) || nationality || mappedCountry;

    setCountryOfResidence(mappedCountry);
    setNationality(mappedNat);

    if (Array.isArray(extracted.academicRecords) && extracted.academicRecords.length > 0) {
      const mappedRecords: AcademicRecord[] = extracted.academicRecords.map((r) => ({
        institution: r.institution || "",
        qualification: (QUALIFICATIONS.includes(r.qualification as any) ? r.qualification : "Bachelor's Degree") as QualificationLevel,
        degreeTitle: r.degreeTitle || "",
        country: r.country || mappedCountry,
        completionYear: Number(r.completionYear) || new Date().getFullYear(),
        gradeGpa: r.gradeGpa || "",
      }));
      setAcademicRecords(mappedRecords);
    }

    try {
      sessionStorage.setItem("student_extracted_cv", JSON.stringify(extracted));
      if (extracted.firstName) sessionStorage.setItem("student_registration_first_name", extracted.firstName.trim());
      if (extracted.lastName) sessionStorage.setItem("student_registration_last_name", extracted.lastName.trim());
      if (extracted.fullName) sessionStorage.setItem("student_registration_full_name", extracted.fullName.trim());
      if (extracted.phone) sessionStorage.setItem("student_registration_phone", extracted.phone.trim());
    } catch (_) {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 5000);
  };

  // Centralized completeness calculation
  const completeness = useMemo(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    const mockStudent: Partial<Student> = {
      fullName,
      email,
      phone,
      dob,
      nationality,
      countryOfResidence,
      academicHistory: academicRecords,
      desiredStudyLevel: desiredStudyLevel || undefined,
    };
    (mockStudent as any).desiredStudyLevel = desiredStudyLevel;

    return calculateProfileCompleteness(mockStudent);
  }, [
    firstName,
    lastName,
    email,
    phone,
    dob,
    nationality,
    countryOfResidence,
    academicRecords,
    desiredStudyLevel,
  ]);

  // Academic record management
  const addAcademicRecord = () => {
    setAcademicRecords((prev) => [
      ...prev,
      {
        institution: "",
        qualification: "Bachelor's Degree",
        degreeTitle: "",
        country: countryOfResidence || "Pakistan",
        completionYear: new Date().getFullYear(),
        gradeGpa: "",
      },
    ]);
  };

  const removeAcademicRecord = (idx: number) => {
    setAcademicRecords((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAcademicRecord = (idx: number, field: keyof AcademicRecord, val: any) => {
    setAcademicRecords((prev) =>
      prev.map((rec, i) => (i === idx ? { ...rec, [field]: val } : rec))
    );
  };

  // Save progress
  const saveProgress = async (isProceeding = false) => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid) return;

    setSaving(true);
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim() || appUser?.displayName || firebaseUser?.displayName || "Student";

    // Immediate sync to session storage for instant UI persistence
    try {
      sessionStorage.setItem("student_registration_first_name", trimmedFirst);
      sessionStorage.setItem("student_registration_last_name", trimmedLast);
      sessionStorage.setItem("student_registration_full_name", fullName);
      if (phone.trim()) sessionStorage.setItem("student_registration_phone", phone.trim());
      if (countryOfResidence) sessionStorage.setItem("student_registration_country", countryOfResidence);
      if (nationality) sessionStorage.setItem("student_registration_nationality", nationality);
    } catch (_) {}

    const payload: Partial<Student> & Record<string, any> = {
      id: uid,
      firstName: trimmedFirst,
      lastName: trimmedLast,
      fullName,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      dob,
      gender,
      nationality,
      countryOfResidence,
      city: city.trim(),
      academicHistory: academicRecords.filter((r) => (r.institution || "").trim() || (r.degreeTitle || "").trim()),
      desiredStudyLevel,
      profileCompleteness: completeness.percentage,
      onboardingStep: 1,
      updatedAt: Date.now(),
    };

    try {
      // 1. Persist to students collection
      await setDoc(doc(db, "students", uid), {
        ...payload,
        onboardingStatus: "in_progress",
        profileCompleted: false,
        currentStep: 2
      }, { merge: true });
      
      // 2. Persist to users base profile
      await setDoc(doc(db, "users", uid), { 
        firstName: trimmedFirst,
        lastName: trimmedLast,
        displayName: fullName, 
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        onboardingStatus: "in_progress",
        profileCompleted: false,
        currentStep: 2,
        updatedAt: Date.now() 
      }, { merge: true });

      // 3. Keep Firebase Auth user displayName synchronized
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { displayName: fullName });
        } catch (_) {}
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      if (isProceeding) {
        if (!completeness.isComplete) {
          setError("Please complete all required fields (Personal Information, Academic History, and Desired Study Level) before proceeding.");
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        navigate("/student/onboarding/step-2");
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      setError(err.message || "Could not save profile. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-main relative overflow-hidden flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main relative overflow-hidden text-primary font-sans pb-16">
      {/* Role-Specific Atmospheric Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-700 opacity-20 dark:opacity-25"
        style={{ backgroundImage: `url('${getRoleBackground("student")}')` }}
      />
      {/* Decorative Background Elements */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Guided Progress Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Profile Stage {currentStage} of 4 • Student Onboarding
            </span>
            <h1 className="text-xl font-bold font-heading text-primary">
              Let's build your student profile
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-muted">Profile Completion</span>
              <p className="text-lg font-bold text-emerald-400">{completeness.percentage}%</p>
            </div>
            <div className="w-24 bg-elevated h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => saveProgress(false)}
              disabled={saving}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-primary rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Draft"}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Banner */}
        <div className="p-5 rounded-2xl bg-surface/70 border border-subtle text-sm text-secondary flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary">
              Tell us about yourself so we can find universities and programs that match your academic background and goals.
            </p>
            <p className="text-xs text-muted mt-1">
              Your master profile auto-fills future applications, eliminates redundant paperwork, and provides instant eligibility feedback.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Profile draft and personal information saved successfully.</span>
          </div>
        )}

        {/* AI CV Auto-Fill Engine */}
        <StudentCVUploader
          title="Auto-Fill Profile with AI (CV / Resume Scanner)"
          subtitle="Upload or drop your CV (PDF, DOCX, TXT) or paste text to instantly auto-fill your personal details, contact info, and academic history."
          onExtracted={handleCVExtracted}
        />

        {/* Section 1: Personal Information */}
        <section className="bg-surface/80 border border-subtle rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-subtle">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-primary font-heading">1. Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Muhammad"
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ali"
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-elevated border border-default rounded-xl px-3.5 py-2.5 text-sm text-muted cursor-not-allowed opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Date of Birth *</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Nationality *</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Country of Residence *</label>
              <select
                value={countryOfResidence}
                onChange={(e) => {
                  const newCountry = e.target.value;
                  if (!nationality || nationality === countryOfResidence) {
                    setNationality(newCountry);
                  }
                  setCountryOfResidence(newCountry);
                }}
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore / Islamabad"
                className="w-full bg-main relative overflow-hidden border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Academic Background */}
        <section className="bg-surface/80 border border-subtle rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-primary font-heading">2. Academic Background</h2>
            </div>
            <button
              type="button"
              onClick={addAcademicRecord}
              className="px-3 py-1.5 bg-elevated hover:bg-hover text-xs font-semibold text-emerald-400 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Qualification
            </button>
          </div>

          <div className="space-y-4">
            {academicRecords.map((record, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-main relative overflow-hidden/80 border border-subtle space-y-4 relative"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                  <span>Record #{index + 1}</span>
                  {academicRecords.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAcademicRecord(index)}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1.5">Institution Name *</label>
                    <input
                      type="text"
                      value={record.institution}
                      onChange={(e) => updateAcademicRecord(index, "institution", e.target.value)}
                      placeholder="e.g. NUST / University of the Punjab"
                      className="w-full bg-surface border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1.5">Qualification Level *</label>
                    <select
                      value={record.qualification}
                      onChange={(e) => updateAcademicRecord(index, "qualification", e.target.value)}
                      className="w-full bg-surface border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                    >
                      {QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1.5">Degree Title / Major *</label>
                    <input
                      type="text"
                      value={record.degreeTitle}
                      onChange={(e) => updateAcademicRecord(index, "degreeTitle", e.target.value)}
                      placeholder="BS Computer Science / A-Levels Pre-Eng"
                      className="w-full bg-surface border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1.5">Country of Study</label>
                    <input
                      type="text"
                      value={record.country}
                      onChange={(e) => updateAcademicRecord(index, "country", e.target.value)}
                      placeholder="Pakistan"
                      className="w-full bg-surface border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1.5">Completion Year</label>
                    <input
                      type="number"
                      value={record.completionYear}
                      onChange={(e) => updateAcademicRecord(index, "completionYear", Number(e.target.value))}
                      className="w-full bg-surface border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1.5">Grade / CGPA / % *</label>
                    <input
                      type="text"
                      value={record.gradeGpa}
                      onChange={(e) => updateAcademicRecord(index, "gradeGpa", e.target.value)}
                      placeholder="3.45 / 4.00 or 78%"
                      className="w-full bg-surface border border-default rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Desired Study Level */}
        <section className="bg-surface/80 border border-subtle rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-primary font-heading">3. Desired Study Level *</h2>
            </div>
            {!desiredStudyLevel && (
              <span className="text-xs text-amber-400 font-medium">Please select a level</span>
            )}
          </div>

          <p className="text-xs text-muted">
            Select the degree level you are seeking to pursue abroad:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STUDY_LEVELS.map((level) => {
              const active = desiredStudyLevel === level;
              return (
                <button
                  type="button"
                  key={level}
                  onClick={() => setDesiredStudyLevel(level)}
                  className={`p-3.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                    active
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                      : "bg-main relative overflow-hidden text-muted border-subtle hover:border-default hover:text-primary"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </section>

        {!completeness.isComplete && completeness.missingFields.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Missing Information Required:
            </h3>
            <p className="text-xs mb-2 opacity-90">
              Please complete the following required fields to proceed:
            </p>
            <ul className="list-disc list-inside text-xs space-y-1 ml-1 opacity-90 font-medium">
              {completeness.missingFields.map((field: string, idx: number) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex justify-end items-center gap-3 pt-6 border-t border-subtle">
          <button
            type="button"
            onClick={() => saveProgress(false)}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-default text-secondary hover:text-primary hover:bg-hover font-medium transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => saveProgress(true)}
            disabled={saving || !completeness.isComplete}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Processing..." : "Next Step"}
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingStage1;
