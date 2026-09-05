import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  arrayUnion,
} from "firebase/firestore";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Save,
  HelpCircle,
  Edit3,
  Send,
} from "lucide-react";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { Student } from "../../types/student";
import { Programme, University } from "../../types/university";
import { Application } from "../../types/application";
import { assessEligibility } from "../../utils/eligibility";
import { getApplicationReadiness } from "../../utils/applicationReadiness";
import { uploadStudentDocument } from "../../utils/documentStorage";

const STEPS = [
  { num: 1, title: "Overview" },
  { num: 2, title: "Personal Info" },
  { num: 3, title: "Academic History" },
  { num: 4, title: "English Language" },
  { num: 5, title: "Program Requirements" },
  { num: 6, title: "University Questions" },
  { num: 7, title: "Documents" },
  { num: 8, title: "Country / Visa Info" },
  { num: 9, title: "Review" },
  { num: 10, title: "Declaration" },
  { num: 11, title: "Submit" },
];

export const StudentApplicationWizard: React.FC = () => {
  const { appUser, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const universityIdParam = searchParams.get("universityId") || "";
  const programmeIdParam = searchParams.get("programmeId") || "";

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1 & 2: Application Details & Overrides
  const [selectedIntake, setSelectedIntake] = useState<string>("September 2027");
  const [personalStatement, setPersonalStatement] = useState("");
  const [personalOverrides, setPersonalOverrides] = useState({
    fullName: "",
    phone: "",
    countryOfResidence: "",
    passportNumber: "",
  });

  // Step 6: Dynamic University Questions
  const [questionResponses, setQuestionResponses] = useState<Record<string, any>>({});

  // Step 7: Documents uploaded in session
  const [uploadedDocuments, setUploadedDocuments] = useState<
    { id: string; name: string; type: string; url: string }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setUploadingDoc] = useState(false);
  const [visaReviewed, setVisaReviewed] = useState(false);

  // Step 10: Declarations
  const [declaration1, setDeclaration1] = useState(false);
  const [declaration2, setDeclaration2] = useState(false);
  const [declaration3, setDeclaration3] = useState(false);

  const allDeclarationsAccepted = declaration1 && declaration2 && declaration3;

  // Load student, university, program & any existing draft
  useEffect(() => {
    const initWizard = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) return;

      try {
        // 1. Fetch student master profile
        const studentSnap = await getDoc(doc(db, "students", uid));
        let studentData: Student | null = null;
        if (studentSnap.exists()) {
          studentData = studentSnap.data() as Student;
          setStudent(studentData);
          setPersonalOverrides({
            fullName: studentData.fullName || "",
            phone: studentData.phone || "",
            countryOfResidence: studentData.countryOfResidence || "",
            passportNumber: studentData.passportNumber || "",
          });
        }

        // 2. Fetch university & programme
        const univSnap = await getDocs(collection(db, "universities"));
        let foundUniv: University | null = null;
        let foundProg: Programme | null = null;

        univSnap.docs.forEach((uDoc) => {
          const u = { id: uDoc.id, ...uDoc.data() } as University;
          if (u.id === universityIdParam || !foundUniv) {
            const p = u.programmes?.find((item) => item.id === programmeIdParam);
            if (p) {
              foundUniv = u;
              foundProg = p;
            }
          }
        });

        // Fallback to first available if not found
        if (!foundUniv && !univSnap.empty) {
          const firstUniv = { id: univSnap.docs[0].id, ...univSnap.docs[0].data() } as University;
          foundUniv = firstUniv;
          foundProg = firstUniv.programmes?.[0] || null;
        }

        setUniversity(foundUniv);
        setProgramme(foundProg);
        if (foundProg?.intakes?.[0]) setSelectedIntake(foundProg.intakes[0]);

        // 3. Check for existing application draft for this student + prog
        if (foundUniv && foundProg) {
          const appQ = query(
            collection(db, "applications"),
            where("studentId", "==", uid),
            where("universityId", "==", foundUniv.id),
            where("programmeId", "==", foundProg.id),
            where("applicationStatus", "==", "Draft")
          );
          const appSnap = await getDocs(appQ);
          if (!appSnap.empty) {
            const existingApp = appSnap.docs[0].data() as Application & Record<string, any>;
            setApplicationId(appSnap.docs[0].id);
            if (existingApp.currentStep) setCurrentStep(existingApp.currentStep);
            if (existingApp.personalStatement) setPersonalStatement(existingApp.personalStatement);
            if (existingApp.formResponses) setQuestionResponses(existingApp.formResponses);
            if (existingApp.intake) setSelectedIntake(existingApp.intake);
          }
        }

        // 4. Load existing documents from student_documents collection
        const docsQ = query(collection(db, "student_documents"), where("studentId", "==", uid));
        const docsSnap = await getDocs(docsQ);
        if (!docsSnap.empty) {
          const existingDocs = docsSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.fileName || data.documentType,
              type: data.documentType || "General Document",
              url: data.fileUrl || "",
            };
          });
          setUploadedDocuments(existingDocs);
        }
      } catch (err: any) {
        console.warn("Wizard initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initWizard();
  }, [appUser, firebaseUser, universityIdParam, programmeIdParam]);

  // Compute eligibility
  const eligibility = useMemo(() => {
    return assessEligibility(student || undefined, programme || ({} as Programme));
  }, [student, programme]);

  // Compute readiness
  const readiness = useMemo(() => {
    return getApplicationReadiness(
      student || undefined,
      programme || undefined,
      uploadedDocuments as any,
      eligibility,
      questionResponses,
      allDeclarationsAccepted
    );
  }, [
    student,
    programme,
    university,
    uploadedDocuments,
    questionResponses,
    allDeclarationsAccepted,
    visaReviewed,
  ]);

  // Document Upload Handler with Firebase Storage
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid) return;

    setUploadingDoc(true);
    setError(null);

    try {
      // 1. Upload to Firebase Storage
      const uploadRes = await uploadStudentDocument(uid, file);

      // 2. Add record to student_documents in Firestore
      const docRef = await addDoc(collection(db, "student_documents"), {
        studentId: uid,
        studentName: student?.fullName || appUser?.displayName || "Student",
        studentEmail: student?.email || appUser?.email || "",
        documentType: docType,
        fileName: uploadRes.fileName,
        filePath: uploadRes.filePath,
        fileUrl: uploadRes.fileUrl,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        status: "Pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setUploadedDocuments((prev) => [
        ...prev,
        {
          id: docRef.id,
          name: uploadRes.fileName,
          type: docType,
          url: uploadRes.fileUrl,
        },
      ]);
      setSaveNotice(`Uploaded ${uploadRes.fileName} successfully!`);
      setTimeout(() => setSaveNotice(null), 2500);
    } catch (err: any) {
      console.error("Document upload failed:", err);
      setError(err.message || "Failed to upload document to Firebase Storage.");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  // Continuous Draft Save
  const saveDraft = async (nextStepNum?: number) => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid || !university || !programme) return;

    setSaving(true);
    setError(null);

    try {
      const payload: Partial<Application> & Record<string, any> = {
        studentId: uid,
        studentName: personalOverrides.fullName || student?.fullName || appUser?.displayName || "Student",
        studentEmail: student?.email || appUser?.email || "",
        universityId: university.id,
        universityName: university.name,
        programmeId: programme.id,
        programmeName: programme.title,
        intake: selectedIntake,
        targetCountry: university.country,
        personalStatement,
        formResponses: questionResponses,
        stage: "Draft",
        applicationStatus: "Draft",
        currentStep: nextStepNum || currentStep,
        eligibilityStatus: eligibility.status,
        eligibilityScore: eligibility.score,
        declarationAccepted: allDeclarationsAccepted,
        visaReviewed,
        updatedAt: Date.now(),
      };

      if (applicationId) {
        await setDoc(doc(db, "applications", applicationId), payload, { merge: true });
      } else {
        const appNumber = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRef = await addDoc(collection(db, "applications"), {
          ...payload,
          applicationNumber: appNumber,
          createdAt: Date.now(),
          history: [
            {
              stage: "Draft",
              updatedBy: student?.email || "Student",
              timestamp: Date.now(),
              note: "Application draft started by student.",
            },
          ],
        });
        setApplicationId(newRef.id);
      }

      setSaveNotice("Draft saved automatically.");
      setTimeout(() => setSaveNotice(null), 2000);

      if (nextStepNum) {
        setCurrentStep(nextStepNum);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("Failed to save draft:", err);
      setError(err.message || "Could not save application draft.");
    } finally {
      setSaving(false);
    }
  };

  // Final Application Submission (Part 16 & 17)
  const handleSubmitApplication = async () => {
    const uid = firebaseUser?.uid || appUser?.uid;
    if (!uid || !university || !programme) return;

    if (!readiness.ready) {
      setError(`Application is not ready for submission. Please resolve blocking items.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = Date.now();
      const payload: Partial<Application> & Record<string, any> = {
        studentId: uid,
        studentName: personalOverrides.fullName || student?.fullName || appUser?.displayName || "Student",
        studentEmail: student?.email || appUser?.email || "",
        universityId: university.id,
        universityName: university.name,
        programmeId: programme.id,
        programmeName: programme.title,
        intake: selectedIntake,
        targetCountry: university.country,
        personalStatement,
        formResponses: questionResponses,
        stage: "Submitted",
        applicationStatus: "Submitted",
        submittedAt: now,
        submissionRequested: true,
        currentStep: 11,
        eligibilityStatus: eligibility.status,
        eligibilityScore: eligibility.score,
        declarationAccepted: true,
        visaReviewed: true,
        updatedAt: now,
      };

      let finalAppId = applicationId;

      if (finalAppId) {
        await setDoc(doc(db, "applications", finalAppId), {
          ...payload,
          history: arrayUnion({
            stage: "Submitted",
            updatedBy: student?.email || "Student",
            timestamp: now,
            note: "Application officially submitted by student for university review.",
          }),
        }, { merge: true });
      } else {
        const appNumber = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const created = await addDoc(collection(db, "applications"), {
          ...payload,
          applicationNumber: appNumber,
          createdAt: now,
          history: [
            {
              stage: "Submitted",
              updatedBy: student?.email || "Student",
              timestamp: now,
              note: "Application officially submitted by student for university review.",
            },
          ],
        });
        finalAppId = created.id;
      }

      // Create student notification
      try {
        await addDoc(collection(db, "notifications"), {
          targetUser: uid,
          title: "Application Submitted Successfully",
          message: `Your application to ${university.name} for ${programme.title} (${selectedIntake}) has been received and is now in internal admissions review.`,
          type: "application",
          read: false,
          createdAt: now,
        });
      } catch (_) {}

      // Redirect to application detail tracking
      navigate(`/student/applications/${finalAppId}`);
    } catch (err: any) {
      console.error("Application submission failed:", err);
      setError(err.message || "Failed to submit application. Please try again.");
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

  if (!university || !programme) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8 text-center text-zinc-300 space-y-4">
        <h2 className="text-xl font-bold">No Program Selected</h2>
        <p className="text-sm text-zinc-500">Please choose a university program through the Program Matcher.</p>
        <Link to="/student/onboarding/program-matcher" className="text-emerald-400 font-bold underline">
          Open Program Matcher →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24">
      {/* Top Wizard Navigation Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
              Step {currentStep} of 11
            </span>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                {programme.title}
              </h1>
              <p className="text-xs text-zinc-400 truncate">
                {university.name} • {university.country}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveNotice && (
              <span className="text-xs text-emerald-400 font-medium animate-fade-in flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveNotice}
              </span>
            )}
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-zinc-400">Readiness: </span>
              <span className="text-xs font-bold text-emerald-400">{readiness.percentage}%</span>
            </div>
            <button
              type="button"
              onClick={() => saveDraft()}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="max-w-6xl mx-auto mt-3 overflow-x-auto scrollbar-none py-1">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max">
            {STEPS.map((s) => {
              const active = currentStep === s.num;
              const completed = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => saveDraft(s.num)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    active
                      ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                      : completed
                      ? "bg-zinc-800 text-emerald-400"
                      : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span>{s.num}.</span>
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Application Overview */}
        {currentStep === 1 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 1</span>
              <h2 className="text-lg font-bold text-white font-heading">Application Overview</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verify program details, intakes, and admission deadlines before proceeding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500">Degree Level</span>
                <p className="font-bold text-white text-sm">{programme.level}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500">Duration</span>
                <p className="font-bold text-white text-sm">{programme.durationMonths} Months</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500">Annual Tuition Fee</span>
                <p className="font-bold text-emerald-400 text-sm">
                  {programme.currency} {programme.tuitionFeeAnnual?.toLocaleString()}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500">Application Deadline</span>
                <p className="font-bold text-amber-300 text-sm">{programme.deadline || "Rolling Admissions"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">Select Intake Session *</label>
              <select
                value={selectedIntake}
                onChange={(e) => setSelectedIntake(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {(programme.intakes || ["September", "January"]).map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Information (Auto-Filled) */}
        {currentStep === 2 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 2</span>
                <h2 className="text-lg font-bold text-white font-heading">Personal Information</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                Auto-filled from Master Profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={personalOverrides.fullName}
                  onChange={(e) => setPersonalOverrides({ ...personalOverrides, fullName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={student?.email || appUser?.email || ""}
                  disabled
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={personalOverrides.phone}
                  onChange={(e) => setPersonalOverrides({ ...personalOverrides, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Country of Residence</label>
                <input
                  type="text"
                  value={personalOverrides.countryOfResidence}
                  onChange={(e) => setPersonalOverrides({ ...personalOverrides, countryOfResidence: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Academic History */}
        {currentStep === 3 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 3</span>
                <h2 className="text-lg font-bold text-white font-heading">Academic History</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                Auto-filled from Master Profile
              </span>
            </div>

            {student?.academicHistory && student.academicHistory.length > 0 ? (
              <div className="space-y-3">
                {student.academicHistory.map((rec, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-sm text-white">
                      <span>{rec.degreeTitle}</span>
                      <span className="text-emerald-400">{rec.gradeGpa}</span>
                    </div>
                    <p className="text-zinc-400">{rec.institution} • {rec.country} ({rec.completionYear})</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-400 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-xs">No academic records found in profile.</p>
                <Link to="/student/onboarding/profile" className="text-xs font-bold text-emerald-400 underline mt-2 inline-block">
                  Update Academic History in Profile →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: English Language */}
        {currentStep === 4 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 4</span>
                <h2 className="text-lg font-bold text-white font-heading">English Language Proficiency</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                Auto-filled from Master Profile
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-sm font-bold text-white">
                <span>Test Type: {student?.englishProficiency?.testType || "Pending / Not Taken"}</span>
                <span className="text-emerald-400">Score: {student?.englishProficiency?.overallScore || "N/A"}</span>
              </div>
              <p className="text-zinc-400">
                Minimum Program IELTS Requirement: {programme.minIeltsScore ? `IELTS ${programme.minIeltsScore}` : "None explicitly required"}
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: Program-Specific Requirements */}
        {currentStep === 5 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 5</span>
              <h2 className="text-lg font-bold text-white font-heading">Program-Specific Requirements</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <p className="font-semibold text-zinc-200">Admissions Criteria Comparison:</p>
                <div className="space-y-1.5 text-zinc-400">
                  {eligibility.checks.map((chk, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={chk.status === "pass" ? "text-emerald-400" : "text-amber-400"}>
                        {chk.status === "pass" ? "✓" : "⚠"}
                      </span>
                      <span>{chk.label}: {chk.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block font-semibold text-zinc-300">Statement of Purpose / Personal Statement</label>
                <textarea
                  rows={5}
                  value={personalStatement}
                  onChange={(e) => setPersonalStatement(e.target.value)}
                  placeholder="Explain why you wish to study this program, your academic background, and your future career objectives..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: University-Specific Dynamic Questions */}
        {currentStep === 6 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 6</span>
              <h2 className="text-lg font-bold text-white font-heading">University-Specific Questions</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Questions configured specifically by {university.name} for this admissions intake.
              </p>
            </div>

            {programme.applicationForm && programme.applicationForm.length > 0 ? (
              <div className="space-y-4">
                {programme.applicationForm.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      {q.label} {q.required && <span className="text-rose-400">*</span>}
                    </label>
                    {q.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={questionResponses[q.id] || ""}
                        onChange={(e) => setQuestionResponses({ ...questionResponses, [q.id]: e.target.value })}
                        placeholder={q.helpText || "Enter your answer"}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    ) : q.type === "select" ? (
                      <select
                        value={questionResponses[q.id] || ""}
                        onChange={(e) => setQuestionResponses({ ...questionResponses, [q.id]: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Select an option --</option>
                        {(q.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={q.type}
                        value={questionResponses[q.id] || ""}
                        onChange={(e) => setQuestionResponses({ ...questionResponses, [q.id]: e.target.value })}
                        placeholder={q.helpText || "Your response"}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400">
                ✓ No additional university-specific questions required for this program.
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Required Documents (Firebase Storage) */}
        {currentStep === 7 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 7</span>
                <h2 className="text-lg font-bold text-white font-heading">Document Requirements</h2>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {readiness.items.filter(i => i.key.startsWith("document-") && i.state === "complete").length} / {readiness.items.filter(i => i.key.startsWith("document-")).length} Complete
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Upload documents using secure Firebase Storage. All documents are encrypted and associated directly with your admissions profile.
            </p>

            <div className="space-y-3">
              {["Passport", "Academic Transcript", "Degree Certificate", "Statement of Purpose"].map((docName) => {
                const norm = docName.toLowerCase().replace(/[^a-z0-9]/g, "");
                const existing = uploadedDocuments.find((d) => d.type.toLowerCase().replace(/[^a-z0-9]/g, "").includes(norm));

                return (
                  <div
                    key={docName}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>{docName}</span>
                        {existing ? (
                          <span className="text-emerald-400 text-[11px]">✓ Uploaded</span>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Pending</span>
                        )}
                      </div>
                      {existing && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-xs">{existing.name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {existing?.url && (
                        <a
                          href={existing.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                        >
                          Preview
                        </a>
                      )}
                      <label className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold cursor-pointer transition-colors flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{existing ? "Replace" : "Upload"}</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, docName)}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 8: Country / Visa Information (Informational) */}
        {currentStep === 8 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 8</span>
              <h2 className="text-lg font-bold text-white font-heading">Destination Country & Visa Guidelines</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Target Country: <span className="text-emerald-400 font-semibold">{university.country}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-3">
              <h3 className="font-bold text-white text-sm">General Student Visa Requirements:</h3>
              <ul className="space-y-1.5 text-zinc-300 list-disc pl-4 leading-relaxed">
                <li>Official University Unconditional Offer & Confirmation of Acceptance for Studies (CAS / COE).</li>
                <li>Proof of Financial Maintenance (Tuition fee balance + official living expenses for 9 - 12 months).</li>
                <li>Valid International Passport with minimum 6 months validity.</li>
                <li>Medical examination & Tuberculosis (TB) screening where required.</li>
                <li>Biometric enrollment and visa application submission.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                Please acknowledge that you have reviewed these general country guidelines. Official visa processing begins after university offer issuance.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-200 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={visaReviewed}
                onChange={(e) => setVisaReviewed(e.target.checked)}
                className="rounded border-zinc-700 text-emerald-500 focus:ring-0"
              />
              I have reviewed the general visa prerequisites for {university.country}
            </label>
          </div>
        )}

        {/* STEP 9: Application Review */}
        {currentStep === 9 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6 animate-fade-in">
            <div className="pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 9</span>
              <h2 className="text-lg font-bold text-white font-heading">Complete Application Review</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect your submission data across each section prior to making your declaration.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Review Section 1: University & Program */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-white">
                  <span>Programme & University</span>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-zinc-300">{programme.title} ({programme.level})</p>
                <p className="text-zinc-500">{university.name} • {university.country} • Intake: {selectedIntake}</p>
              </div>

              {/* Review Section 2: Personal Details */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-white">
                  <span>Personal Details</span>
                  <button type="button" onClick={() => setCurrentStep(2)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-zinc-300">Name: {personalOverrides.fullName || student?.fullName}</p>
                <p className="text-zinc-500">Email: {student?.email} • Phone: {personalOverrides.phone || student?.phone}</p>
              </div>

              {/* Review Section 3: Academic & Language */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-white">
                  <span>Academic & Language</span>
                  <button type="button" onClick={() => setCurrentStep(3)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-zinc-300">Qualification: {student?.academicHistory?.[0]?.degreeTitle || "Recorded"} ({student?.academicHistory?.[0]?.gradeGpa || "N/A"})</p>
                <p className="text-zinc-500">English: {student?.englishProficiency?.testType || "Pending"} ({student?.englishProficiency?.overallScore || "N/A"})</p>
              </div>

              {/* Review Section 4: Documents Uploaded */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-white">
                  <span>Uploaded Documents ({uploadedDocuments.length})</span>
                  <button type="button" onClick={() => setCurrentStep(7)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {programme?.requiredDocuments?.map((item: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: Declaration & Consents */}
        {currentStep === 10 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 10</span>
              <h2 className="text-lg font-bold text-white font-heading">Applicant Declarations</h2>
            </div>

            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaration1}
                  onChange={(e) => setDeclaration1(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0 mt-0.5"
                />
                <span className="text-zinc-300 leading-relaxed">
                  I confirm that the academic, personal, and financial information provided in this application is true, accurate, and complete to the best of my knowledge.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaration2}
                  onChange={(e) => setDeclaration2(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0 mt-0.5"
                />
                <span className="text-zinc-300 leading-relaxed">
                  I understand that submitting this application does not guarantee admission. Final admission decisions are made solely by the university admissions committee.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaration3}
                  onChange={(e) => setDeclaration3(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0 mt-0.5"
                />
                <span className="text-zinc-300 leading-relaxed">
                  I understand that student visa and immigration decisions are governed independently by official government immigration authorities.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 11: Final Submit & Readiness Check */}
        {currentStep === 11 && (
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6 animate-fade-in">
            <div className="pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 11</span>
              <h2 className="text-lg font-bold text-white font-heading">Application Readiness & Final Submission</h2>
            </div>

            {/* Readiness Card */}
            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Application Readiness Score</h3>
                  <p className="text-xs text-zinc-400">Calculated based on verified profile, documents, and declarations.</p>
                </div>
                <span className="text-2xl font-bold text-emerald-400">{readiness.percentage}%</span>
              </div>

              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${readiness.percentage}%` }}
                />
              </div>

              {readiness.items.filter(i => i.state === "missing").length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Required Action Items Before Submission:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    {readiness.items.filter(i => i.state === "missing").map((item, idx) => (
                      <li key={idx}>{item.label}: {item.detail}</li>
                    ))}
                  </ul>
                </div>
              )}

              {readiness.ready && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Your application is 100% verified and ready for formal submission!</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={saving || !readiness.ready}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Official Application
                </>
              )}
            </button>
          </div>
        )}

        {/* Wizard Bottom Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => saveDraft(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || saving}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-xs text-zinc-500">
            Step {currentStep} of 11
          </span>

          {currentStep < 11 && (
            <button
              type="button"
              onClick={() => saveDraft(currentStep + 1)}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentApplicationWizard;
