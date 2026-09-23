import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { AcademicRecord, QualificationLevel, Student } from "../../../types/student";
import { calculateProfileCompleteness } from "../../../utils/profileCompleteness";
import { toCountryName } from "../../../utils/cvExtractor";
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

const COUNTRIES = [
  "Pakistan", "United Kingdom", "Canada", "Australia", "United States", "Germany",
  "Ireland", "Malaysia", "Turkey", "United Arab Emirates", "Saudi Arabia", "India",
  "China", "France", "Netherlands", "Sweden", "New Zealand", "Singapore"
];

export const StudentOnboardingStage1: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [currentStage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Student["gender"]>("Prefer not to say");
  const [nationality, setNationality] = useState("Pakistan");
  const [countryOfResidence, setCountryOfResidence] = useState("Pakistan");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
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

  // Load existing profile from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        const snap = await getDoc(doc(db, "students", uid));
        if (snap.exists()) {
          const data = snap.data() as Student;
          const names = (data.fullName || "").split(" ");
          setFirstName(names[0] || "");
          setLastName(names.slice(1).join(" ") || "");
          setDob(data.dob || "");
          setGender(data.gender || "Prefer not to say");
          const normalizedNat = data.nationality ? (toCountryName(data.nationality) || data.nationality) : "Pakistan";
          const finalNat = COUNTRIES.includes(normalizedNat) ? normalizedNat : (COUNTRIES.includes(data.nationality) ? data.nationality : "Pakistan");
          setNationality(finalNat);

          const normalizedCountry = data.countryOfResidence ? (toCountryName(data.countryOfResidence) || data.countryOfResidence) : "Pakistan";
          const finalCountry = COUNTRIES.includes(normalizedCountry) ? normalizedCountry : (COUNTRIES.includes(data.countryOfResidence) ? data.countryOfResidence : "Pakistan");
          setCountryOfResidence(finalCountry);
          setCity((data as any).city || "");
          setPhone(data.phone || "");

          if (data.academicHistory && data.academicHistory.length > 0) {
            setAcademicRecords(data.academicHistory);
          }

          if ((data as any).desiredStudyLevel) {
            setDesiredStudyLevel((data as any).desiredStudyLevel);
          }
        } else if (appUser?.displayName) {
          const parts = appUser.displayName.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }

        // Check if CV was pre-extracted during registration
        try {
          const cachedCV = sessionStorage.getItem("student_extracted_cv");
          if (cachedCV) {
            const parsed = JSON.parse(cachedCV);
            if (parsed.firstName && !firstName) setFirstName(parsed.firstName);
            if (parsed.lastName && !lastName) setLastName(parsed.lastName);
            if (parsed.phone && !phone) setPhone(parsed.phone);
            if (parsed.nationality) {
              const matchedCountry = toCountryName(parsed.nationality);
              setNationality(COUNTRIES.includes(matchedCountry) ? matchedCountry : "Pakistan");
            }
            if (parsed.countryOfResidence) {
              const matchedResidence = toCountryName(parsed.countryOfResidence);
              setCountryOfResidence(COUNTRIES.includes(matchedResidence) ? matchedResidence : "Pakistan");
            }
            if (parsed.dob && !dob) setDob(parsed.dob);
            if (parsed.gender && (!gender || gender === "Prefer not to say")) setGender(parsed.gender);
            if (parsed.city && !city) setCity(parsed.city);
            if (parsed.desiredStudyLevel && !desiredStudyLevel) setDesiredStudyLevel(parsed.desiredStudyLevel);
            if (parsed.academicRecords && parsed.academicRecords.length > 0) {
              setAcademicRecords(parsed.academicRecords);
            }
          }
        } catch (_) {}
      } catch (err: any) {
        console.warn("Could not load student profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [appUser, firebaseUser]);

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

    const fullName = `${firstName} ${lastName}`.trim() || appUser?.displayName || "Student";

    const payload: Partial<Student> & Record<string, any> = {
      id: uid,
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
      await setDoc(doc(db, "students", uid), {
        ...payload,
        onboardingStatus: "in_progress",
        profileCompleted: false,
        currentStep: 2
      }, { merge: true });
      
      // Also update base user profile display name and completion status
      await setDoc(doc(db, "users", uid), { 
        displayName: fullName, 
        onboardingStatus: "in_progress",
        profileCompleted: false,
        currentStep: 2,
        updatedAt: Date.now() 
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

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
