import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { University } from "../../types/university";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { Student } from "../../types/student";
import {
  Search,
  Building2,
  GraduationCap,
  Sparkles,
  Plus
} from "lucide-react";

export const CounsellorProgrammeMatcher: React.FC = () => {
  const { students, createApplication } = useCounsellorData();

  const [universities, setUniversities] = useState<University[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [degreeFilter, setDegreeFilter] = useState("All");

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "universities"), (snap) => {
      const docs: University[] = [];
      snap.forEach((doc) => docs.push({ id: doc.id, ...doc.data() } as University));
      setUniversities(docs);
    });
    return () => unsub();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Flatten programmes with university metadata
  const allCourses = universities.flatMap((u) =>
    (u.programmes || []).map((p) => ({
      ...p,
      universityId: u.id,
      universityName: u.name,
      country: u.country,
      logoUrl: u.logoUrl,
    }))
  );

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.universityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === "All" || course.country === countryFilter;
    const matchesDegree = degreeFilter === "All" || course.level === degreeFilter;
    return matchesSearch && matchesCountry && matchesDegree;
  });

  const evaluateEligibility = (student?: Student) => {
    if (!student) return { status: "Select Student to Check", color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-elevated)]" };

    if (!student.academicHistory || student.academicHistory.length === 0) {
      return { status: "Additional Review Required (Missing GPA)", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    }

    if (!student.englishProficiency) {
      return { status: "Potentially Eligible (IELTS Pending)", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" };
    }

    return { status: "Likely Eligible", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" };
  };

  const handleApply = async (univName: string, progName: string) => {
    if (!selectedStudent) {
      alert("Please select a student profile first from the top selector.");
      return;
    }
    await createApplication(selectedStudent.id, selectedStudent.fullName, univName, progName, "Fall 2026");
    alert(`Created draft application for ${selectedStudent.fullName} at ${univName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Programme Finder & Matcher</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Match prospective students against global university programmes, entry requirements, and fee criteria.
          </p>
        </div>

        {/* Student Selector */}
        <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] p-2 sq-card">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none max-w-xs"
          >
            <option value="" className="bg-[var(--bg-card)]">-- Select Student to Match --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id} className="bg-[var(--bg-card)]">
                {s.fullName} ({s.nationality})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search programme, subject, university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
          >
            <option value="All">All Countries</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="United States">United States</option>
            <option value="Australia">Australia</option>
          </select>

          <select
            value={degreeFilter}
            onChange={(e) => setDegreeFilter(e.target.value)}
            className="p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
          >
            <option value="All">All Qualification Levels</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Doctorate">Doctorate</option>
          </select>
        </div>
      </div>

      {/* Selected Student Banner */}
      {selectedStudent && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 sq-card flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>
              Matching programmes for <strong className="text-[var(--text-primary)]">{selectedStudent.fullName}</strong> ({selectedStudent.nationality})
            </span>
          </div>
          <span className="font-mono">
            {selectedStudent.englishProficiency ? `IELTS: ${selectedStudent.englishProficiency.overallScore}` : "No IELTS"}
          </span>
        </div>
      )}

      {/* Programme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">
            No programmes found matching search criteria.
          </div>
        ) : (
          filteredCourses.map((course) => {
            const eligibility = evaluateEligibility(selectedStudent);
            return (
              <div
                key={course.id}
                className="bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-emerald-500/30 sq-card p-5 space-y-4 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] text-teal-400 font-mono flex items-center space-x-1">
                        <Building2 className="w-3 h-3" />
                        <span>{course.universityName} • {course.country}</span>
                      </div>
                      <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] mt-1">{course.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px] font-mono">
                      {course.level}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Tuition Fee:</span>
                      <span className="font-mono text-emerald-400">
                        {course.currency} {course.tuitionFeeAnnual?.toLocaleString() || "N/A"} / yr
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Duration:</span>
                      <span className="font-mono text-[var(--text-primary)]">{course.durationMonths} Months</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Intakes:</span>
                      <span className="font-mono text-sky-400">{(course.intakes || []).join(", ") || "Fall / Spring"}</span>
                    </div>
                  </div>

                  {/* Eligibility Match Card */}
                  <div className={`p-2.5 sq-card border text-[11px] font-medium flex items-center justify-between ${eligibility.bg}`}>
                    <span>Match Evaluation:</span>
                    <span className={`font-semibold ${eligibility.color}`}>{eligibility.status}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
                  <button
                    onClick={() => handleApply(course.universityName, course.title)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-xs shadow-md shadow-emerald-500/20 inline-flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Application</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
