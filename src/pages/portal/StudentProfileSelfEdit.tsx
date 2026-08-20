import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { Student, QualificationLevel } from "../../types/student";
import { User, GraduationCap, Globe, Phone, FileCheck, Save, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";

export const StudentProfileSelfEdit: React.FC = () => {
  const { appUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [preferredDestination, setPreferredDestination] = useState("");
  const [preferredIntake, setPreferredIntake] = useState("");
  const [budgetAnnualUsd, setBudgetAnnualUsd] = useState(25000);
  const [englishTestType, setEnglishTestType] = useState<"IELTS" | "PTE" | "TOEFL" | "Duolingo" | "MOI Evidence">("IELTS");
  const [englishOverallScore, setEnglishOverallScore] = useState("");
  const [studyGapJustification, setStudyGapJustification] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorRelationship, setSponsorRelationship] = useState("Parent");
  const [sponsorIncome, setSponsorIncome] = useState(40000);

  // Academic History Records
  const [academicHistory, setAcademicHistory] = useState<Student["academicHistory"]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!appUser?.uid) return;
      try {
        const snap = await getDoc(doc(db, "students", appUser.uid));
        if (snap.exists()) {
          const data = snap.data() as Student;
          setStudent(data);
          setFullName(data.fullName || "");
          setPhone(data.phone || "");
          setNationality(data.nationality || "");
          setCountryOfResidence(data.countryOfResidence || "");
          setPassportNumber(data.passportNumber || "");
          setPassportExpiry(data.passportExpiry || "");
          setPreferredDestination(data.preferredDestination || "");
          setPreferredIntake(data.preferredIntake || "");
          setBudgetAnnualUsd(data.budgetAnnualUsd || 25000);
          if (data.englishProficiency) {
            setEnglishTestType(data.englishProficiency.testType || "IELTS");
            setEnglishOverallScore(data.englishProficiency.overallScore || "");
          }
          setStudyGapJustification(data.studyGapJustification || "");
          if (data.financialSponsor) {
            setSponsorName(data.financialSponsor.name || "");
            setSponsorRelationship(data.financialSponsor.relationship || "Parent");
            setSponsorIncome(data.financialSponsor.annualIncomeUSD || 40000);
          }
          setAcademicHistory(data.academicHistory || []);
        }
      } catch (err: any) {
        console.warn("Could not load student profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [appUser]);

  const handleAddAcademicRecord = () => {
    setAcademicHistory([
      ...academicHistory,
      {
        institution: "",
        qualification: "Bachelor's Degree",
        degreeTitle: "",
        country: "",
        completionYear: 2024,
        gradeGpa: "",
      },
    ]);
  };

  const handleRemoveAcademicRecord = (index: number) => {
    setAcademicHistory(academicHistory.filter((_, i) => i !== index));
  };

  const handleUpdateAcademicRecord = (index: number, field: string, value: any) => {
    setAcademicHistory(
      academicHistory.map((rec, i) => (i === index ? { ...rec, [field]: value } : rec))
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.uid) return;
    setSaving(true);
    setNotice(null);
    setError(null);

    // Calculate completeness
    let filled = 0;
    const totalFields = 10;
    if (fullName) filled++;
    if (phone) filled++;
    if (nationality) filled++;
    if (countryOfResidence) filled++;
    if (passportNumber) filled++;
    if (preferredDestination) filled++;
    if (englishOverallScore) filled++;
    if (academicHistory.length > 0) filled++;
    if (sponsorName) filled++;
    if (studyGapJustification) filled++;
    const completeness = Math.round((filled / totalFields) * 100);

    const updatedData: Partial<Student> = {
      fullName,
      phone,
      nationality,
      countryOfResidence,
      passportNumber: passportNumber || undefined,
      passportExpiry: passportExpiry || undefined,
      preferredDestination: preferredDestination || undefined,
      preferredIntake: preferredIntake || undefined,
      budgetAnnualUsd,
      englishProficiency: englishOverallScore
        ? { testType: englishTestType, overallScore: englishOverallScore }
        : undefined,
      studyGapJustification: studyGapJustification || undefined,
      financialSponsor: sponsorName
        ? { name: sponsorName, relationship: sponsorRelationship, annualIncomeUSD: sponsorIncome, bankStatementUploaded: false }
        : undefined,
      academicHistory,
      profileCompleteness: completeness,
      updatedAt: Date.now(),
    };

    try {
      await updateDoc(doc(db, "students", appUser.uid), updatedData);
      setNotice("Your student profile has been updated successfully!");
    } catch (err: any) {
      console.error("Profile save error:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] text-sm">
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <User className="w-7 h-7 text-emerald-400" />
            <span>My Student Profile & Credentials</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Keep your academic qualifications, test scores, and personal info up to date for university admissions.
          </p>
        </div>

        {student && (
          <div className="text-right">
            <span className="text-xs text-[var(--text-secondary)] block font-semibold">Profile Completeness</span>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${student.profileCompleteness || 30}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {student.profileCompleteness || 30}%
              </span>
            </div>
          </div>
        )}
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

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-4">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span>1. Personal & Passport Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Phone / WhatsApp *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Nationality *</label>
              <input
                type="text"
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Country of Current Residence *</label>
              <input
                type="text"
                required
                value={countryOfResidence}
                onChange={(e) => setCountryOfResidence(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Passport Number</label>
              <input
                type="text"
                placeholder="e.g. A12345678"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Passport Expiry Date</label>
              <input
                type="date"
                value={passportExpiry}
                onChange={(e) => setPassportExpiry(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Study Preferences */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-4">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <span>2. Study Preferences & Budget</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Preferred Destination</label>
              <select
                value={preferredDestination}
                onChange={(e) => setPreferredDestination(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
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
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Target Intake</label>
              <input
                type="text"
                placeholder="e.g. Fall 2026 / Spring 2027"
                value={preferredIntake}
                onChange={(e) => setPreferredIntake(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Annual Tuition Budget (USD)</label>
              <input
                type="number"
                min="5000"
                max="100000"
                step="1000"
                value={budgetAnnualUsd}
                onChange={(e) => setBudgetAnnualUsd(Number(e.target.value))}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: English Proficiency & Gap Justification */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-4">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span>3. English Proficiency & Gap Explanation</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">English Test Type</label>
              <select
                value={englishTestType}
                onChange={(e) => setEnglishTestType(e.target.value as any)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none"
              >
                <option value="IELTS">IELTS Academic</option>
                <option value="PTE">PTE Academic</option>
                <option value="TOEFL">TOEFL iBT</option>
                <option value="Duolingo">Duolingo English Test</option>
                <option value="MOI Evidence">Medium of Instruction (MOI)</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Overall Test Score / Band</label>
              <input
                type="text"
                placeholder="e.g. 7.0 (with no band < 6.5)"
                value={englishOverallScore}
                onChange={(e) => setEnglishOverallScore(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-semibold mb-1">
              Study Gap Justification (If any gaps between degrees)
            </label>
            <textarea
              rows={2}
              placeholder="Explain any study gaps (e.g. full-time work experience, internships, or exam preparation)..."
              value={studyGapJustification}
              onChange={(e) => setStudyGapJustification(e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Section 4: Academic Qualifications */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <span>4. Academic Qualifications History</span>
            </h2>
            <button
              type="button"
              onClick={handleAddAcademicRecord}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl flex items-center space-x-1 border border-emerald-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Degree</span>
            </button>
          </div>

          <div className="space-y-3">
            {academicHistory.map((rec, index) => (
              <div key={index} className="p-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">Qualification #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAcademicRecord(index)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Level</label>
                    <select
                      value={rec.qualification}
                      onChange={(e) => handleUpdateAcademicRecord(index, "qualification", e.target.value as QualificationLevel)}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]"
                    >
                      <option value="High School / A-Levels">High School / A-Levels</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate / PhD">Doctorate / PhD</option>
                      <option value="Diploma / Certificate">Diploma / Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Institution Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. University of Manchester"
                      value={rec.institution}
                      onChange={(e) => handleUpdateAcademicRecord(index, "institution", e.target.value)}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Degree Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BSc Computer Science"
                      value={rec.degreeTitle}
                      onChange={(e) => handleUpdateAcademicRecord(index, "degreeTitle", e.target.value)}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Country</label>
                    <input
                      type="text"
                      placeholder="e.g. UK / PK"
                      value={rec.country}
                      onChange={(e) => handleUpdateAcademicRecord(index, "country", e.target.value)}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Completion Year</label>
                    <input
                      type="number"
                      min="1990"
                      max="2030"
                      value={rec.completionYear}
                      onChange={(e) => handleUpdateAcademicRecord(index, "completionYear", Number(e.target.value))}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Grade / GPA</label>
                    <input
                      type="text"
                      placeholder="e.g. 3.8 / 4.0 or First Class"
                      value={rec.gradeGpa}
                      onChange={(e) => handleUpdateAcademicRecord(index, "gradeGpa", e.target.value)}
                      className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Financial Sponsor Declaration */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-4">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center space-x-2">
            <Phone className="w-5 h-5 text-emerald-400" />
            <span>5. Financial Sponsorship Declaration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Sponsor Full Name</label>
              <input
                type="text"
                placeholder="e.g. Self / Parent Name"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Relationship</label>
              <select
                value={sponsorRelationship}
                onChange={(e) => setSponsorRelationship(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none"
              >
                <option value="Self">Self-Funded</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Government Scholarship">Government Scholarship</option>
                <option value="Corporate Sponsor">Corporate Sponsor</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-semibold mb-1">Annual Income (USD Equivalent)</label>
              <input
                type="number"
                min="5000"
                step="5000"
                value={sponsorIncome}
                onChange={(e) => setSponsorIncome(Number(e.target.value))}
                className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Profile..." : "Save Student Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
