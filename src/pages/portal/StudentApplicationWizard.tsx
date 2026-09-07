import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
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
import { uploadStudentDocument, getDocumentBlobOrUrl } from "../../utils/documentStorage";
import { DEMO_UNIVERSITIES } from "../../data/demoData";

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
  const params = useParams();

  const universityIdParam = searchParams.get("universityId") || "";
  const programmeIdParam = searchParams.get("programmeId") || params.programmeId || params.id || "";
  const intakeParam = searchParams.get("intake") || "";

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
        // 1. Fetch student master profile from both students/{uid} and users/{uid}
        const studentSnap = await getDoc(doc(db, "students", uid));
        const userSnap = await getDoc(doc(db, "users", uid));
        const userData = userSnap.exists() ? userSnap.data() : null;

        let studentData: Student | null = null;
        if (studentSnap.exists()) {
          studentData = studentSnap.data() as Student;
        } else if (userData) {
          studentData = {
            id: uid,
            fullName: userData.displayName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            countryOfResidence: userData.countryOfResidence || "",
            nationality: userData.nationality || "",
            profileCompleteness: 30,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as Student;
        }

        const resolvedName =
          studentData?.fullName ||
          userData?.displayName ||
          appUser?.displayName ||
          firebaseUser?.displayName ||
          "Student";
        const resolvedPhone = studentData?.phone || userData?.phone || "";
        const resolvedCountry =
          studentData?.countryOfResidence ||
          userData?.countryOfResidence ||
          studentData?.nationality ||
          userData?.nationality ||
          "";

        setStudent(studentData);
        setPersonalOverrides({
          fullName: resolvedName,
          phone: resolvedPhone,
          countryOfResidence: resolvedCountry,
          passportNumber: studentData?.passportNumber || "",
        });

        // 2. Fetch universities (DB + DEMO catalog for universal coverage)
        const univSnap = await getDocs(collection(db, "universities"));
        const allUnivs: University[] = univSnap.docs.map(
          (uDoc) => ({ id: uDoc.id, ...uDoc.data() } as University)
        );
        DEMO_UNIVERSITIES.forEach((demo) => {
          if (
            !allUnivs.some(
              (u) =>
                u.id === demo.id ||
                u.name.toLowerCase() === demo.name.toLowerCase()
            )
          ) {
            allUnivs.push(demo);
          }
        });

        let foundUniv: University | null = null;
        let foundProg: Programme | null = null;

        // Prioritize finding by programmeIdParam across all universities
        if (programmeIdParam) {
          for (const u of allUnivs) {
            const p = u.programmes?.find((item) => item.id === programmeIdParam);
            if (p) {
              foundUniv = u;
              foundProg = p;
              break;
            }
          }
        }

        // Secondary check by universityIdParam
        if (!foundUniv && universityIdParam) {
          const u = allUnivs.find((item) => item.id === universityIdParam);
          if (u) {
            foundUniv = u;
            foundProg = u.programmes?.[0] || null;
          }
        }

        // Fallback to first available if not found
        if (!foundUniv && allUnivs.length > 0) {
          foundUniv = allUnivs[0];
          foundProg = allUnivs[0].programmes?.[0] || null;
        }

        setUniversity(foundUniv);
        setProgramme(foundProg);

        if (intakeParam) {
          setSelectedIntake(intakeParam);
        } else if (foundProg?.intakes?.[0]) {
          setSelectedIntake(foundProg.intakes[0]);
        }

        // 3. Check for existing application for this student + prog
        if (foundUniv && foundProg) {
          const appQ = query(
            collection(db, "applications"),
            where("studentId", "==", uid),
            where("universityId", "==", foundUniv.id),
            where("programmeId", "==", foundProg.id)
          );
          const appSnap = await getDocs(appQ);
          if (!appSnap.empty) {
            const existingApp = appSnap.docs[0].data() as Application & Record<string, any>;
            
            if (existingApp.applicationStatus !== "Draft") {
              setError("You have already applied to this program. Please check your Dashboard for status.");
              setLoading(false);
              return;
            }

            setApplicationId(appSnap.docs[0].id);
            if (existingApp.currentStep) setCurrentStep(existingApp.currentStep);
            if (existingApp.personalStatement) setPersonalStatement(existingApp.personalStatement);
            if (existingApp.formResponses) setQuestionResponses(existingApp.formResponses);
            if (existingApp.intake) setSelectedIntake(existingApp.intake);
          } else {
            // Force create Draft immediately so it shows on Dashboard
            const appNumber = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const newRef = await addDoc(collection(db, "applications"), {
              applicationNumber: appNumber,
              studentId: uid,
              studentName: resolvedName,
              studentEmail: studentData?.email || userData?.email || appUser?.email || "",
              universityId: foundUniv.id,
              universityName: foundUniv.name,
              programmeId: foundProg.id,
              programmeName: foundProg.title,
              intake: foundProg.intakes?.[0] || "September 2027",
              targetCountry: foundUniv.country,
              stage: "Draft",
              applicationStatus: "Draft",
              currentStep: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              history: [
                {
                  stage: "Draft",
                  updatedBy: studentData?.email || "Student",
                  timestamp: Date.now(),
                  note: "Application draft started by student.",
                },
              ],
            });
            setApplicationId(newRef.id);
          }
        }

        // 4. Load existing documents from student_documents collection
        const docsQ = query(collection(db, "student_documents"), where("studentId", "==", uid));
        const docsSnap = await getDocs(docsQ);
        if (!docsSnap.empty) {
          const existingDocs = docsSnap.docs.map((d) => {
            const data = d.data();
            const resolvedType = data.documentType || data.docType || data.type || "General Document";
            const resolvedName = data.fileName || data.name || resolvedType;
            return {
              id: d.id,
              name: resolvedName,
              fileName: resolvedName,
              type: resolvedType,
              documentType: resolvedType,
              url: data.fileUrl || data.driveUrl || "",
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
      // Find existing document ID if replacing
      const existingDoc = uploadedDocuments.find(d => d.type === docType);
      
      // 1. Upload to Document Storage and Firestore via Backend
      const uploadRes = await uploadStudentDocument(
        uid, 
        file, 
        docType, 
        applicationId || undefined, 
        existingDoc?.id
      );

      setUploadedDocuments((prev) => {
        const filtered = prev.filter(d => (d.type || (d as any).documentType) !== docType);
        return [
          ...filtered,
          {
            id: uploadRes.documentId,
            name: file.name,
            fileName: file.name,
            type: docType,
            documentType: docType,
            url: uploadRes.driveUrl,
          },
        ];
      });
      setSaveNotice(`Uploaded ${file.name} successfully!`);
      setTimeout(() => setSaveNotice(null), 2500);
    } catch (err: any) {
      console.error("Document upload failed:", err);
      const friendlyMsg = err.message && err.message !== "internal"
        ? err.message
        : "Failed to upload document. Please ensure the file is under 15MB (PDF/JPG/PNG/DOCX) and try again.";
      setError(friendlyMsg);
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  // Safe document preview handler pulling from IndexedDB local cache or remote
  const handlePreviewDocument = async (docId: string, fallbackUrl?: string) => {
    try {
      const previewUrl = await getDocumentBlobOrUrl(docId, fallbackUrl);
      if (previewUrl) {
        window.open(previewUrl, "_blank", "noopener,noreferrer");
      } else if (fallbackUrl) {
        window.open(fallbackUrl, "_blank");
      } else {
        setSaveNotice("Document is safely stored for application submission.");
        setTimeout(() => setSaveNotice(null), 3000);
      }
    } catch (e) {
      console.warn("Preview error:", e);
      if (fallbackUrl) window.open(fallbackUrl, "_blank");
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
      <div className="min-h-screen bg-transparent flex items-center justify-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!university || !programme) {
    return (
      <div className="min-h-screen bg-transparent p-8 text-center text-primary space-y-4">
        <h2 className="text-xl font-bold">No Program Selected</h2>
        <p className="text-sm text-muted">Please choose a university program through the Program Matcher.</p>
        <Link to="/student/onboarding/program-matcher" className="text-emerald-400 font-bold underline">
          Open Program Matcher →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-primary font-sans pb-24 relative">
      {/* Role-Specific Atmospheric Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-700 opacity-20 dark:opacity-25"
        style={{ backgroundImage: `url('/images/student_campus_hero.jpg')` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-white/70 via-white/50 to-white/75 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-950/85" />

      {/* Top Wizard Navigation Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-subtle px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-2.5 py-1.5 rounded-lg bg-elevated hover:bg-hover border border-subtle text-xs font-semibold text-primary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
              Step {currentStep} of 11
            </span>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-primary truncate">
                {programme.title}
              </h1>
              <p className="text-xs text-secondary truncate">
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
              <span className="text-[11px] text-secondary">Readiness: </span>
              <span className="text-xs font-bold text-emerald-400">{readiness.percentage}%</span>
            </div>
            <button
              type="button"
              onClick={() => saveDraft()}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-hover border border-subtle text-xs font-semibold text-primary flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
                      ? "bg-emerald-500 text-primary font-bold shadow-sm shadow-emerald-500/20"
                      : completed
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : "bg-elevated text-muted hover:text-primary hover:bg-hover border border-subtle"
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

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Application Overview */}
        {currentStep === 1 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 1</span>
              <h2 className="text-lg font-bold text-primary font-heading font-bold">Application Overview</h2>
              <p className="text-xs text-secondary mt-0.5">
                Verify program details, intakes, and admission deadlines before proceeding.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-elevated/50 border border-subtle space-y-1">
                <span className="text-muted">Degree Level</span>
                <p className="font-bold text-primary text-sm">{programme.level}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-elevated/50 border border-subtle space-y-1">
                <span className="text-muted">Duration</span>
                <p className="font-bold text-primary text-sm">{programme.durationMonths} Months</p>
              </div>
              <div className="p-3.5 rounded-xl bg-elevated/50 border border-subtle space-y-1">
                <span className="text-muted">Annual Tuition Fee</span>
                <p className="font-bold text-emerald-400 text-sm">
                  {programme.currency} {programme.tuitionFeeAnnual?.toLocaleString()}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-elevated/50 border border-subtle space-y-1">
                <span className="text-muted">Application Deadline</span>
                <p className="font-bold text-amber-300 text-sm">{programme.deadline || "Rolling Admissions"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-secondary">Select Intake Session *</label>
              <select
                value={selectedIntake}
                onChange={(e) => setSelectedIntake(e.target.value)}
                className="w-full bg-input border border-subtle rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
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
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 2</span>
                <h2 className="text-lg font-bold text-primary font-heading font-bold">Personal Information</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                Auto-filled from Master Profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={personalOverrides.fullName}
                  onChange={(e) => setPersonalOverrides({ ...personalOverrides, fullName: e.target.value })}
                  className="w-full bg-input border border-subtle rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  value={student?.email || appUser?.email || ""}
                  disabled
                  className="w-full bg-elevated border border-subtle rounded-xl px-3.5 py-2.5 text-sm text-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={personalOverrides.phone}
                  onChange={(e) => setPersonalOverrides({ ...personalOverrides, phone: e.target.value })}
                  className="w-full bg-input border border-subtle rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Country of Residence</label>
                <input
                  type="text"
                  value={personalOverrides.countryOfResidence}
                  onChange={(e) => setPersonalOverrides({ ...personalOverrides, countryOfResidence: e.target.value })}
                  className="w-full bg-input border border-subtle rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Academic History */}
        {currentStep === 3 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 3</span>
                <h2 className="text-lg font-bold text-primary font-heading font-bold">Academic History</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                Auto-filled from Master Profile
              </span>
            </div>

            {student?.academicHistory && student.academicHistory.length > 0 ? (
              <div className="space-y-3">
                {student.academicHistory.map((rec, i) => (
                  <div key={i} className="p-4 rounded-xl bg-elevated/50 border border-subtle text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-sm text-primary">
                      <span>{rec.degreeTitle}</span>
                      <span className="text-emerald-400">{rec.gradeGpa}</span>
                    </div>
                    <p className="text-secondary">{rec.institution} • {rec.country} ({rec.completionYear})</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-secondary border border-dashed border-subtle rounded-xl">
                <p className="text-xs">No academic records found in profile.</p>
                <Link to="/student/onboarding/step-1" className="text-xs font-bold text-emerald-400 underline mt-2 inline-block">
                  Update Academic History in Profile →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: English Language */}
        {currentStep === 4 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 4</span>
                <h2 className="text-lg font-bold text-primary font-heading font-bold">English Language Proficiency</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                Auto-filled from Master Profile
              </span>
            </div>

            <div className="p-4 rounded-xl bg-elevated/50 border border-subtle space-y-2 text-xs">
              <div className="flex justify-between items-center text-sm font-bold text-primary">
                <span>Test Type: {student?.englishProficiency?.testType || "Pending / Not Taken"}</span>
                <span className="text-emerald-400">Score: {student?.englishProficiency?.overallScore || "N/A"}</span>
              </div>
              <p className="text-secondary">
                Minimum Program IELTS Requirement: {programme.minIeltsScore ? `IELTS ${programme.minIeltsScore}` : "None explicitly required"}
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: Program-Specific Requirements */}
        {currentStep === 5 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 5</span>
              <h2 className="text-lg font-bold text-primary font-heading font-bold">Program-Specific Requirements</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-elevated/50 border border-subtle space-y-2">
                <p className="font-semibold text-primary">Admissions Criteria Comparison:</p>
                <div className="space-y-1.5 text-secondary">
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
                <label className="block font-semibold text-secondary">Statement of Purpose / Personal Statement</label>
                <textarea
                  rows={5}
                  value={personalStatement}
                  onChange={(e) => setPersonalStatement(e.target.value)}
                  placeholder="Explain why you wish to study this program, your academic background, and your future career objectives..."
                  className="w-full bg-input border border-subtle rounded-xl p-3 text-xs sm:text-sm text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: University-Specific Dynamic Questions */}
        {currentStep === 6 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 6</span>
              <h2 className="text-lg font-bold text-primary font-heading font-bold">University-Specific Questions</h2>
              <p className="text-xs text-secondary mt-0.5">
                Questions configured specifically by {university.name} for this admissions intake.
              </p>
            </div>

            {programme.applicationForm && programme.applicationForm.length > 0 ? (
              <div className="space-y-4">
                {programme.applicationForm.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-secondary">
                      {q.label} {q.required && <span className="text-rose-400">*</span>}
                    </label>
                    {q.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={questionResponses[q.id] || ""}
                        onChange={(e) => setQuestionResponses({ ...questionResponses, [q.id]: e.target.value })}
                        placeholder={q.helpText || "Enter your answer"}
                        className="w-full bg-input border border-subtle rounded-xl p-3 text-sm text-primary focus:outline-none focus:border-emerald-500"
                      />
                    ) : q.type === "select" ? (
                      <select
                        value={questionResponses[q.id] || ""}
                        onChange={(e) => setQuestionResponses({ ...questionResponses, [q.id]: e.target.value })}
                        className="w-full bg-input border border-subtle rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
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
                        className="w-full bg-input border border-subtle rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-elevated/40 border border-subtle text-xs text-secondary">
                ✓ No additional university-specific questions required for this program.
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Required Documents (Firebase Storage) */}
        {currentStep === 7 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Step 7</span>
                <h2 className="text-lg font-bold text-primary font-heading font-bold">Document Requirements</h2>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {readiness.items.filter(i => i.key.startsWith("document-") && i.state === "complete").length} / {readiness.items.filter(i => i.key.startsWith("document-")).length} Complete
              </span>
            </div>

            <p className="text-xs text-secondary">
              Upload documents using secure Firebase Storage. All documents are encrypted and associated directly with your admissions profile.
            </p>

            <div className="space-y-3">
              {["Passport", "Academic Transcript", "Degree Certificate", "Statement of Purpose"].map((docName) => {
                const norm = (docName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const existing = uploadedDocuments.find((d) => {
                  const t = (d.type || (d as any).documentType || d.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  return t.includes(norm) || norm.includes(t);
                });

                return (
                  <div
                    key={docName}
                    className="p-4 rounded-xl bg-elevated/50 border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-primary">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>{docName}</span>
                        {existing ? (
                          <span className="text-emerald-400 text-[11px]">✓ Uploaded</span>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Pending</span>
                        )}
                      </div>
                      {existing && (
                        <p className="text-[11px] text-muted mt-0.5 truncate max-w-xs">{existing.name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {existing && (
                        <button
                          type="button"
                          onClick={() => handlePreviewDocument(existing.id, existing.url)}
                          className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-hover text-primary font-semibold border border-subtle cursor-pointer transition-colors"
                        >
                          Preview
                        </button>
                      )}
                      <label className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold cursor-pointer transition-colors flex items-center gap-1">
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
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 8</span>
              <h2 className="text-lg font-bold text-primary font-heading font-bold">Destination Country & Visa Guidelines</h2>
              <p className="text-xs text-secondary mt-0.5">
                Target Country: <span className="text-emerald-400 font-semibold">{university.country}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-elevated/50 border border-subtle text-xs space-y-3">
              <h3 className="font-bold text-primary text-sm">General Student Visa Requirements:</h3>
              <ul className="space-y-1.5 text-secondary list-disc pl-4 leading-relaxed">
                <li>Official University Unconditional Offer & Confirmation of Acceptance for Studies (CAS / COE).</li>
                <li>Proof of Financial Maintenance (Tuition fee balance + official living expenses for 9 - 12 months).</li>
                <li>Valid International Passport with minimum 6 months validity.</li>
                <li>Medical examination & Tuberculosis (TB) screening where required.</li>
                <li>Biometric enrollment and visa application submission.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-elevated/40 border border-subtle text-xs text-secondary flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                Please acknowledge that you have reviewed these general country guidelines. Official visa processing begins after university offer issuance.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={visaReviewed}
                onChange={(e) => setVisaReviewed(e.target.checked)}
                className="rounded border-subtle text-emerald-500 focus:ring-0"
              />
              I have reviewed the general visa prerequisites for {university.country}
            </label>
          </div>
        )}

        {/* STEP 9: Application Review */}
        {currentStep === 9 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-6 animate-fade-in">
            <div className="pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 9</span>
              <h2 className="text-lg font-bold text-primary font-heading font-bold">Complete Application Review</h2>
              <p className="text-xs text-secondary mt-0.5">
                Inspect your submission data across each section prior to making your declaration.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Review Section 1: University & Program */}
              <div className="p-4 rounded-xl bg-elevated/50 border border-subtle space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-primary">
                  <span>Programme & University</span>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-secondary">{programme.title} ({programme.level})</p>
                <p className="text-muted">{university.name} • {university.country} • Intake: {selectedIntake}</p>
              </div>

              {/* Review Section 2: Personal Details */}
              <div className="p-4 rounded-xl bg-elevated/50 border border-subtle space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-primary">
                  <span>Personal Details</span>
                  <button type="button" onClick={() => setCurrentStep(2)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-secondary">Name: {personalOverrides.fullName || student?.fullName}</p>
                <p className="text-muted">Email: {student?.email} • Phone: {personalOverrides.phone || student?.phone}</p>
              </div>

              {/* Review Section 3: Academic & Language */}
              <div className="p-4 rounded-xl bg-elevated/50 border border-subtle space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-primary">
                  <span>Academic & Language</span>
                  <button type="button" onClick={() => setCurrentStep(3)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-secondary">Qualification: {student?.academicHistory?.[0]?.degreeTitle || "Recorded"} ({student?.academicHistory?.[0]?.gradeGpa || "N/A"})</p>
                <p className="text-muted">English: {student?.englishProficiency?.testType || "Pending"} ({student?.englishProficiency?.overallScore || "N/A"})</p>
              </div>

              {/* Review Section 4: Documents Uploaded */}
              <div className="p-4 rounded-xl bg-elevated/50 border border-subtle space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-primary">
                  <span>Uploaded Documents ({uploadedDocuments.length})</span>
                  <button type="button" onClick={() => setCurrentStep(7)} className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {programme?.requiredDocuments?.map((item: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-elevated border border-subtle text-[11px] text-primary">
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
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-5 animate-fade-in">
            <div className="pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 10</span>
              <h2 className="text-lg font-bold text-primary font-heading font-bold">Applicant Declarations</h2>
            </div>

            <div className="p-5 rounded-xl bg-elevated/50 border border-subtle space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaration1}
                  onChange={(e) => setDeclaration1(e.target.checked)}
                  className="rounded border-subtle text-emerald-500 focus:ring-0 mt-0.5"
                />
                <span className="text-secondary leading-relaxed">
                  I confirm that the academic, personal, and financial information provided in this application is true, accurate, and complete to the best of my knowledge.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaration2}
                  onChange={(e) => setDeclaration2(e.target.checked)}
                  className="rounded border-subtle text-emerald-500 focus:ring-0 mt-0.5"
                />
                <span className="text-secondary leading-relaxed">
                  I understand that submitting this application does not guarantee admission. Final admission decisions are made solely by the university admissions committee.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaration3}
                  onChange={(e) => setDeclaration3(e.target.checked)}
                  className="rounded border-subtle text-emerald-500 focus:ring-0 mt-0.5"
                />
                <span className="text-secondary leading-relaxed">
                  I understand that student visa and immigration decisions are governed independently by official government immigration authorities.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 11: Final Submit & Readiness Check */}
        {currentStep === 11 && (
          <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-sm space-y-6 animate-fade-in">
            <div className="pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-emerald-400 uppercase">Step 11</span>
              <h2 className="text-lg font-bold text-primary font-heading font-bold">Application Readiness & Final Submission</h2>
            </div>

            {/* Readiness Card */}
            <div className="p-5 rounded-xl bg-elevated/50 border border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-primary">Application Readiness Score</h3>
                  <p className="text-xs text-secondary">Calculated based on verified profile, documents, and declarations.</p>
                </div>
                <span className="text-2xl font-bold text-emerald-400">{readiness.percentage}%</span>
              </div>

              <div className="w-full bg-input h-2.5 rounded-full overflow-hidden">
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
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="flex items-center justify-between pt-4 border-t border-subtle">
          <button
            type="button"
            onClick={() => saveDraft(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || saving}
            className="px-4 py-2 rounded-xl bg-elevated hover:bg-hover text-primary font-semibold border border-subtle text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-xs text-muted">
            Step {currentStep} of 11
          </span>

          {currentStep < 11 && (
            <button
              type="button"
              onClick={() => saveDraft(currentStep + 1)}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
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
