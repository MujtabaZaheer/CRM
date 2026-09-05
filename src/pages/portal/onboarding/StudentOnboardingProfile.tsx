import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  User,
  GraduationCap,
  Globe,
  FileCheck,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Loader2,
  Shield,
  BookOpen,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import { AcademicRecord, QualificationLevel, Student } from "../../../types/student";
import { calculateProfileCompleteness } from "../../../utils/profileCompleteness";

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
  "United Kingdom", "Canada", "Australia", "United States", "Germany",
  "Ireland", "New Zealand", "United Arab Emirates", "France", "Netherlands",
  "Sweden", "Singapore", "Malaysia", "Pakistan", "India", "Nigeria",
  "Ghana", "Bangladesh", "Other",
];

export const StudentOnboardingProfile: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();

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

  // Passport Info
  const [hasPassport, setHasPassport] = useState(true);
  const [passportNumber, setPassportNumber] = useState("");
  const [passportCountry, setPassportCountry] = useState("Pakistan");
  const [passportExpiry, setPassportExpiry] = useState("");

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

  // English Proficiency
  const [englishTestType, setEnglishTestType] = useState<string>("IELTS");
  const [englishOverallScore, setEnglishOverallScore] = useState("");
  const [englishSubScores, setEnglishSubScores] = useState({
    listening: "",
    reading: "",
    writing: "",
    speaking: "",
  });
  const [englishTestDate, setEnglishTestDate] = useState("");
  const [englishExpiryDate, setEnglishExpiryDate] = useState("");
  const [noEnglishTestYet, setNoEnglishTestYet] = useState(false);

  // Study Level Goal
  const [desiredStudyLevel, setDesiredStudyLevel] = useState("Master's");

  // Financial Sponsor
  const [hasSponsor, setHasSponsor] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorRelation, setSponsorRelation] = useState("Parent");
  const [sponsorIncome, setSponsorIncome] = useState("");

  // Employment
  const [hasEmployment, setHasEmployment] = useState(false);
  const [employerName, setEmployerName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Dependants
  const [hasDependants, setHasDependants] = useState(false);
  const [dependantsCount, setDependantsCount] = useState("1");

  // References
  const [hasReferences, setHasReferences] = useState(false);
  const [refName, setRefName] = useState("");
  const [refEmail, setRefEmail] = useState("");

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
          setNationality(data.nationality || "Pakistan");
          setCountryOfResidence(data.countryOfResidence || "Pakistan");
          setCity((data as any).city || "");
          setPhone(data.phone || "");

          if (data.passportNumber) {
            setHasPassport(true);
            setPassportNumber(data.passportNumber);
            setPassportExpiry(data.passportExpiry || "");
            setPassportCountry((data as any).passportCountry || data.nationality || "Pakistan");
          } else if ((data as any).passportAvailable === false) {
            setHasPassport(false);
          }

          if (data.academicHistory && data.academicHistory.length > 0) {
            setAcademicRecords(data.academicHistory);
          }

          if (data.englishProficiency) {
            setEnglishTestType(data.englishProficiency.testType);
            setEnglishOverallScore(data.englishProficiency.overallScore);
            setEnglishTestDate(data.englishProficiency.testDate || "");
            setEnglishExpiryDate(data.englishProficiency.expiryDate || "");
            if ((data.englishProficiency as any).subScores) {
              setEnglishSubScores((data.englishProficiency as any).subScores);
            }
          } else if ((data as any).noEnglishTestYet) {
            setNoEnglishTestYet(true);
            setEnglishTestType("No test yet");
          }

          if ((data as any).desiredStudyLevel) {
            setDesiredStudyLevel((data as any).desiredStudyLevel);
          }
          if (data.financialSponsor) {
            setHasSponsor(true);
            setSponsorName(data.financialSponsor.name);
            setSponsorRelation(data.financialSponsor.relationship);
            setSponsorIncome(data.financialSponsor.annualIncomeUSD.toString());
          }
          if (data.employmentHistory && data.employmentHistory.length > 0) {
            setHasEmployment(true);
            setEmployerName(data.employmentHistory[0].employer);
            setJobTitle(data.employmentHistory[0].jobTitle);
          }
          if (data.dependants && data.dependants.length > 0) {
            setHasDependants(true);
            setDependantsCount(data.dependants.length.toString());
          }
          if (data.references && data.references.length > 0) {
            setHasReferences(true);
            setRefName(data.references[0].name);
            setRefEmail(data.references[0].email);
          }
        } else if (appUser?.displayName) {
          const parts = appUser.displayName.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
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
      nationality,
      countryOfResidence,
      passportNumber: hasPassport ? passportNumber : undefined,
      passportExpiry: hasPassport ? passportExpiry : undefined,
      academicHistory: academicRecords,
      englishProficiency: noEnglishTestYet
        ? undefined
        : {
            testType: englishTestType as any,
            overallScore: englishOverallScore,
            testDate: englishTestDate,
            expiryDate: englishExpiryDate,
          },
      notes: !hasPassport ? "no_passport_yet" : undefined,
    };
    (mockStudent as any).passportAvailable = hasPassport;
    (mockStudent as any).noEnglishTestYet = noEnglishTestYet;
    (mockStudent as any).desiredStudyLevel = desiredStudyLevel;

    return calculateProfileCompleteness(mockStudent);
  }, [
    firstName,
    lastName,
    email,
    phone,
    nationality,
    countryOfResidence,
    hasPassport,
    passportNumber,
    passportExpiry,
    academicRecords,
    noEnglishTestYet,
    englishTestType,
    englishOverallScore,
    englishTestDate,
    englishExpiryDate,
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
      passportAvailable: hasPassport,
      passportNumber: hasPassport ? passportNumber.trim() : "",
      passportCountry: hasPassport ? passportCountry : "",
      passportExpiry: hasPassport ? passportExpiry : "",
      academicHistory: academicRecords.filter((r) => r.institution.trim() || r.degreeTitle.trim()),
      englishProficiency: noEnglishTestYet
        ? { testType: "MOI Evidence" as any, overallScore: "Pending" }
        : {
            testType: englishTestType as any,
            overallScore: englishOverallScore.trim(),
            testDate: englishTestDate,
            expiryDate: englishExpiryDate,
          },
      noEnglishTestYet,
      desiredStudyLevel,
      financialSponsor: hasSponsor ? {
        name: sponsorName.trim(),
        relationship: sponsorRelation,
        annualIncomeUSD: Number(sponsorIncome) || 0,
        bankStatementUploaded: false
      } : undefined,
      employmentHistory: hasEmployment ? [{
        employer: employerName.trim(),
        jobTitle: jobTitle.trim(),
        country: countryOfResidence,
        startDate: "",
        endDate: "",
        description: ""
      }] : [],
      dependants: hasDependants ? Array.from({ length: Number(dependantsCount) || 1 }).map(() => ({
        name: "Dependant",
        relationship: "Child/Spouse",
        dateOfBirth: "",
        accompanyingStudent: true
      })) : [],
      references: hasReferences ? [{
        name: refName.trim(),
        email: refEmail.trim(),
        designation: "Academic",
        institution: "",
        phone: "",
        letterUploaded: false
      }] : [],
      profileCompleteness: completeness.percentage,
      onboardingStep: 1,
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "students", uid), payload, { merge: true });
      // Also update base user profile display name
      await setDoc(doc(db, "users", uid), { displayName: fullName, updatedAt: Date.now() }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      if (isProceeding) {
        navigate("/student/onboarding/destination");
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16">
      {/* Top Guided Progress Header */}
      <div className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Step 1 of 4 • Student Onboarding
            </span>
            <h1 className="text-xl font-bold font-heading text-white">
              Let's build your student profile
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-zinc-400">Profile Completion</span>
              <p className="text-lg font-bold text-emerald-400">{completeness.percentage}%</p>
            </div>
            <div className="w-24 bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => saveProgress(false)}
              disabled={saving}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Draft"}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Banner */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-sm text-zinc-300 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">
              Tell us about yourself so we can find universities and programs that match your academic background and goals.
            </p>
            <p className="text-xs text-zinc-400 mt-1">
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
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-heading">1. Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Muhammad"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ali"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address (Auth)</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nationality *</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Country of Residence *</label>
              <select
                value={countryOfResidence}
                onChange={(e) => setCountryOfResidence(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore / Islamabad"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Passport Information */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-heading">2. Passport Information</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">Do you have a passport?</span>
              <button
                type="button"
                onClick={() => setHasPassport(!hasPassport)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  hasPassport
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {hasPassport ? "Yes, I have a passport" : "No passport yet"}
              </button>
            </div>
          </div>

          {hasPassport ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Passport Number</label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="AB1234567"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Passport Issuing Country</label>
                <select
                  value={passportCountry}
                  onChange={(e) => setPassportCountry(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Passport Expiry Date</label>
                <input
                  type="date"
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
              ℹ Passport details are not required to search programs or draft applications. You can add them later prior to final university CAS/Visa submission.
            </p>
          )}
        </section>

        {/* Section 3: Academic Background */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-heading">3. Academic Background</h2>
            </div>
            <button
              type="button"
              onClick={addAcademicRecord}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-emerald-400 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Qualification
            </button>
          </div>

          <div className="space-y-4">
            {academicRecords.map((record, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4 relative"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
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
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Institution Name *</label>
                    <input
                      type="text"
                      value={record.institution}
                      onChange={(e) => updateAcademicRecord(index, "institution", e.target.value)}
                      placeholder="e.g. NUST / University of the Punjab"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Qualification Level *</label>
                    <select
                      value={record.qualification}
                      onChange={(e) => updateAcademicRecord(index, "qualification", e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Degree Title / Major *</label>
                    <input
                      type="text"
                      value={record.degreeTitle}
                      onChange={(e) => updateAcademicRecord(index, "degreeTitle", e.target.value)}
                      placeholder="BS Computer Science / A-Levels Pre-Eng"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Country of Study</label>
                    <input
                      type="text"
                      value={record.country}
                      onChange={(e) => updateAcademicRecord(index, "country", e.target.value)}
                      placeholder="Pakistan"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Completion Year</label>
                    <input
                      type="number"
                      value={record.completionYear}
                      onChange={(e) => updateAcademicRecord(index, "completionYear", Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Grade / CGPA / % *</label>
                    <input
                      type="text"
                      value={record.gradeGpa}
                      onChange={(e) => updateAcademicRecord(index, "gradeGpa", e.target.value)}
                      placeholder="3.45 / 4.00 or 78%"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: English Language Proficiency */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-heading">4. English Language Proficiency</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noEnglishTestYet}
                  onChange={(e) => setNoEnglishTestYet(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0"
                />
                Haven't taken an English test yet
              </label>
            </div>
          </div>

          {!noEnglishTestYet ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Test Type</label>
                  <select
                    value={englishTestType}
                    onChange={(e) => setEnglishTestType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="IELTS">IELTS Academic</option>
                    <option value="PTE">PTE Academic</option>
                    <option value="TOEFL">TOEFL iBT</option>
                    <option value="Duolingo">Duolingo English Test (DET)</option>
                    <option value="MOI Evidence">Medium of Instruction (MOI)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Overall Score</label>
                  <input
                    type="text"
                    value={englishOverallScore}
                    onChange={(e) => setEnglishOverallScore(e.target.value)}
                    placeholder="e.g. 7.0 or 65 or 120"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Test Date</label>
                  <input
                    type="date"
                    value={englishTestDate}
                    onChange={(e) => setEnglishTestDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {englishTestType === "IELTS" && (
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                  <p className="text-xs font-semibold text-zinc-300">Sub-scores (Optional but recommended)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[11px] text-zinc-400">Listening</span>
                      <input
                        type="text"
                        value={englishSubScores.listening}
                        onChange={(e) => setEnglishSubScores({ ...englishSubScores, listening: e.target.value })}
                        placeholder="7.5"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400">Reading</span>
                      <input
                        type="text"
                        value={englishSubScores.reading}
                        onChange={(e) => setEnglishSubScores({ ...englishSubScores, reading: e.target.value })}
                        placeholder="6.5"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400">Writing</span>
                      <input
                        type="text"
                        value={englishSubScores.writing}
                        onChange={(e) => setEnglishSubScores({ ...englishSubScores, writing: e.target.value })}
                        placeholder="6.5"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400">Speaking</span>
                      <input
                        type="text"
                        value={englishSubScores.speaking}
                        onChange={(e) => setEnglishSubScores({ ...englishSubScores, speaking: e.target.value })}
                        placeholder="7.0"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
              ℹ No worries! Our Program Matcher will still evaluate programs that offer English test waivers, internal university tests, or pre-sessional English courses.
            </p>
          )}
        </section>

        {/* Section 5: Target Study Level */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-heading">5. Desired Study Level</h2>
          </div>

          <p className="text-xs text-zinc-400">
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
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </section>
        {/* Section 6: Employment History */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-heading">6. Employment History</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">Do you have work experience?</span>
              <button
                type="button"
                onClick={() => setHasEmployment(!hasEmployment)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  hasEmployment
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {hasEmployment ? "Yes" : "No"}
              </button>
            </div>
          </div>

          {hasEmployment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Employer Name</label>
                <input
                  type="text"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  placeholder="Company Inc."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </section>

        {/* Section 7: Financial Sponsor */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-heading">7. Financial Sponsor</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">Do you have a financial sponsor?</span>
              <button
                type="button"
                onClick={() => setHasSponsor(!hasSponsor)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  hasSponsor
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {hasSponsor ? "Yes" : "No"}
              </button>
            </div>
          </div>

          {hasSponsor && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Sponsor Name</label>
                <input
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Relationship</label>
                <select
                  value={sponsorRelation}
                  onChange={(e) => setSponsorRelation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Self">Self-Funded</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Annual Income (USD)</label>
                <input
                  type="number"
                  value={sponsorIncome}
                  onChange={(e) => setSponsorIncome(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </section>

        {/* Section 8: Dependants */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-heading">8. Dependants</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">Any dependants joining you?</span>
              <button
                type="button"
                onClick={() => setHasDependants(!hasDependants)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  hasDependants
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {hasDependants ? "Yes" : "No"}
              </button>
            </div>
          </div>

          {hasDependants && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Number of Dependants</label>
              <input
                type="number"
                min="1"
                value={dependantsCount}
                onChange={(e) => setDependantsCount(e.target.value)}
                className="w-full sm:w-1/3 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </section>

        {/* Section 9: References */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-heading">9. References</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">Add an academic/professional reference?</span>
              <button
                type="button"
                onClick={() => setHasReferences(!hasReferences)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  hasReferences
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {hasReferences ? "Yes" : "No"}
              </button>
            </div>
          </div>

          {hasReferences && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Reference Name</label>
                <input
                  type="text"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Reference Email</label>
                <input
                  type="email"
                  value={refEmail}
                  onChange={(e) => setRefEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </section>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            Step 1 of 4 • Next: Destination Countries & Study Preferences
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => saveProgress(false)}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Progress"}
            </button>

            <button
              type="button"
              onClick={() => saveProgress(true)}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Continue to Step 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentOnboardingProfile;
