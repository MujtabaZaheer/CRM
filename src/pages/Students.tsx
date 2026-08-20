import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, addDoc, query, orderBy } from "firebase/firestore";
import { Student, QualificationLevel } from "../types/student";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";
import { getStudentJourneyFeed, JourneyEvent, STANDARD_JOURNEY_MILESTONES } from "../utils/studentJourney";
import { Plus, Search, Eye, GraduationCap, Mail, Phone, Globe, BookOpen, Award, AlertCircle, X, History } from "lucide-react";

export const Students: React.FC = () => {
  const { appUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentModalTab, setStudentModalTab] = useState<"overview" | "journey">("overview");
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [degreeTitle, setDegreeTitle] = useState("");
  const [qualification, setQualification] = useState<QualificationLevel>("Bachelor's Degree");
  const [institution, setInstitution] = useState("");
  const [gradeGpa, setGradeGpa] = useState("");
  const [completionYear] = useState(2025);
  const [ieltsScore, setIeltsScore] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Student[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      setErrorMsg("Full Name, Email, and Phone are required.");
      return;
    }

    try {
      let completeness = 40;
      if (nationality) completeness += 15;
      if (countryOfResidence) completeness += 15;
      if (degreeTitle) completeness += 15;
      if (ieltsScore) completeness += 15;

      const newStudentData: Omit<Student, "id"> = {
        fullName,
        email,
        phone,
        nationality: nationality || "Not specified",
        countryOfResidence: countryOfResidence || "Not specified",
        academicHistory: degreeTitle
          ? [
              {
                institution: institution || "Unknown University",
                qualification,
                degreeTitle,
                country: nationality || "Unknown",
                completionYear: Number(completionYear),
                gradeGpa: gradeGpa || "N/A",
              },
            ]
          : [],
        englishProficiency: ieltsScore
          ? { testType: "IELTS", overallScore: ieltsScore }
          : undefined,
        profileCompleteness: completeness,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "students"), newStudentData);
      await logAuditEvent(
        "STUDENT_CREATED",
        appUser?.email || "Unknown",
        "Student",
        `Created student profile for ${fullName}`,
        docRef.id,
        appUser?.role
      );

      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setNationality("");
      setCountryOfResidence("");
      setDegreeTitle("");
      setInstitution("");
      setGradeGpa("");
      setIeltsScore("");
      setErrorMsg("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create student.");
    }
  };

  const handleOpenStudentModal = async (student: Student) => {
    setSelectedStudent(student);
    setStudentModalTab("overview");
    setLoadingJourney(true);
    try {
      const feed = await getStudentJourneyFeed(student.id);
      setJourneyEvents(feed);
    } catch (err) {
      console.warn("Error fetching student journey:", err);
    } finally {
      setLoadingJourney(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nationality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Student Directory</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Manage complete applicant profiles, academic records, and qualifications.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student Profile</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search students by name, email, nationality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Nationality</th>
                  <th className="px-4 py-3">Academic Background</th>
                  <th className="px-4 py-3">English Test</th>
                  <th className="px-4 py-3">Completeness</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                      Loading student records...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                      No student records found. Click "Add Student Profile" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 sq-avatar bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <div>{student.fullName}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">ID: {student.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-[var(--text-primary)]">{student.email}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{student.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{student.nationality}</td>
                      <td className="px-4 py-3 text-xs">
                        {student.academicHistory && student.academicHistory.length > 0 ? (
                          <div>
                            <span className="font-medium text-[var(--text-primary)]">{student.academicHistory[0].degreeTitle}</span>
                            <span className="text-[10px] text-[var(--text-muted)] block">{student.academicHistory[0].institution}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] text-[10px]">No records added</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {student.englishProficiency ? (
                          <span className="px-2 py-0.5 sq-badge bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-semibold">
                            {student.englishProficiency.testType}: {student.englishProficiency.overallScore}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] text-[10px]">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-[var(--bg-elevated)] h-1.5 sq-pill overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full transition-all"
                              style={{ width: `${student.profileCompleteness}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono">{student.profileCompleteness}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenStudentModal(student)}
                          className="p-1.5 bg-[var(--bg-elevated)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 sq-btn transition-colors border border-[var(--border-default)]"
                          title="View Profile & Journey"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Student */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  <span>Create Student Profile</span>
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 sq-badge text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
                {/* Personal Section */}
                <div className="space-y-3">
                  <span className="font-bold text-teal-400 uppercase tracking-wider text-[10px]">Personal Information</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+44 7911 123456"
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Nationality</label>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="e.g. British / Pakistani"
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Background */}
                <div className="space-y-3 pt-2 border-t border-[var(--border-default)]">
                  <span className="font-bold text-teal-400 uppercase tracking-wider text-[10px]">Academic Background</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Highest Qualification</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value as QualificationLevel)}
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      >
                        <option value="High School / A-Levels">High School / A-Levels</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="Doctorate / PhD">Doctorate / PhD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Degree Title</label>
                      <input
                        type="text"
                        value={degreeTitle}
                        onChange={(e) => setDegreeTitle(e.target.value)}
                        placeholder="e.g. BSc Computer Science"
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Institution Name</label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. University of Manchester"
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">Grade / GPA</label>
                      <input
                        type="text"
                        value={gradeGpa}
                        onChange={(e) => setGradeGpa(e.target.value)}
                        placeholder="e.g. 3.8 GPA or 2:1 First Class"
                        className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* English Test */}
                <div className="space-y-3 pt-2 border-t border-[var(--border-default)]">
                  <span className="font-bold text-teal-400 uppercase tracking-wider text-[10px]">English Proficiency</span>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">IELTS / Test Score (Overall)</label>
                    <input
                      type="text"
                      value={ieltsScore}
                      onChange={(e) => setIeltsScore(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium sq-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                  >
                    Save Student Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Student Detail & Journey Timeline */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-lg">
                    {selectedStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-heading text-[var(--text-primary)]">{selectedStudent.fullName}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Student Record #{selectedStudent.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex space-x-2 border-b border-[var(--border-default)] pb-2 text-xs">
                <button
                  onClick={() => setStudentModalTab("overview")}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    studentModalTab === "overview"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  Profile Overview
                </button>
                <button
                  onClick={() => setStudentModalTab("journey")}
                  className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all ${
                    studentModalTab === "journey"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Student Journey & Timeline ({journeyEvents.length})</span>
                </button>
              </div>

              {studentModalTab === "overview" ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl space-y-1">
                      <div className="text-[var(--text-muted)] flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-teal-400" />
                        <span>Email</span>
                      </div>
                      <div className="font-semibold text-[var(--text-primary)] truncate">{selectedStudent.email}</div>
                    </div>
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl space-y-1">
                      <div className="text-[var(--text-muted)] flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-teal-400" />
                        <span>Phone</span>
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">{selectedStudent.phone}</div>
                    </div>
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl space-y-1">
                      <div className="text-[var(--text-muted)] flex items-center space-x-1">
                        <Globe className="w-3.5 h-3.5 text-teal-400" />
                        <span>Nationality</span>
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">{selectedStudent.nationality}</div>
                    </div>
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl space-y-1">
                      <div className="text-[var(--text-muted)] flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-teal-400" />
                        <span>Profile Score</span>
                      </div>
                      <div className="font-semibold text-emerald-400 font-mono">{selectedStudent.profileCompleteness || 30}% Complete</div>
                    </div>
                  </div>

                  {/* Financial Sponsor & Study Preferences */}
                  <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-default)] rounded-xl space-y-2">
                    <span className="font-bold text-[var(--text-primary)] block text-xs">Admissions Profile Summary</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-[var(--text-muted)] block">Target Destination:</span>
                        <span className="font-semibold text-[var(--text-primary)]">{selectedStudent.preferredDestination || "United Kingdom"}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block">Target Intake:</span>
                        <span className="font-semibold text-[var(--text-primary)]">{selectedStudent.preferredIntake || "Fall 2026"}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block">Annual Budget:</span>
                        <span className="font-semibold text-emerald-400 font-mono">${(selectedStudent.budgetAnnualUsd || 25000).toLocaleString()} USD</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div className="space-y-2">
                    <span className="font-bold text-[var(--text-primary)] text-xs flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>Academic Credentials</span>
                    </span>
                    {selectedStudent.academicHistory && selectedStudent.academicHistory.length > 0 ? (
                      selectedStudent.academicHistory.map((rec, i) => (
                        <div key={i} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl text-xs flex justify-between items-center">
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">{rec.degreeTitle} ({rec.qualification})</div>
                            <div className="text-[var(--text-muted)] text-[11px]">{rec.institution} • Completed {rec.completionYear}</div>
                          </div>
                          <div className="text-emerald-400 font-mono font-bold">{rec.gradeGpa}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-[var(--text-muted)] text-xs bg-[var(--bg-elevated)] rounded-xl">No academic records specified.</div>
                    )}
                  </div>
                </div>
              ) : (
                /* Journey Timeline Tab */
                <div className="space-y-4 text-xs">
                  {/* Journey Milestones Progress Bar */}
                  <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-default)] rounded-xl space-y-3">
                    <span className="font-bold text-[var(--text-primary)] block text-xs">Standard Admissions Milestones</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {STANDARD_JOURNEY_MILESTONES.slice(0, 5).map((m, idx) => (
                        <div key={m.key} className="p-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-center">
                          <span className="text-[9px] text-[var(--text-muted)] block">Step {idx + 1}</span>
                          <span className="font-bold text-[10px] text-emerald-400 block truncate">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chronological Event Stream */}
                  {loadingJourney ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                      Loading unified student journey events...
                    </div>
                  ) : journeyEvents.length === 0 ? (
                    <div className="p-6 text-center text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-xl">
                      No tracked events in journey history yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pl-1">
                      {journeyEvents.map((evt) => (
                        <div key={evt.id} className="flex items-start space-x-3 p-3 bg-[var(--bg-main)] border border-[var(--border-default)] rounded-xl">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                            <History className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[var(--text-primary)] text-xs">{evt.title}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                {new Date(evt.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)]">{evt.description}</p>
                            <span className="text-[9px] text-[var(--text-muted)] block">
                              Recorded by: {evt.author}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
