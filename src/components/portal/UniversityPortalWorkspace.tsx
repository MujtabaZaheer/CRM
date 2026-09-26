import React, { useState, useEffect, useMemo } from "react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { GLOBAL_UNIVERSITIES } from "../../data/globalUniversities";
import { DEMO_APPLICATIONS } from "../../data/demoData";
import { Application, ApplicationStage, ApplicationDocumentRequest, ApplicationPartnerComment, ApplicationScholarship } from "../../types/application";
import { Programme } from "../../types/university";
import {
  Building2,
  CheckCircle2,
  FileText,
  Search,
  Award,
  ShieldCheck,
  Send,
  Sparkles,
  Copy,
  Check,
  Download,
  Plus,
  Eye,
  Clock,
  User,
  Globe,
  FileCheck,
  AlertCircle,
  MessageSquare,
  Lock,
  BookOpen,
  TrendingUp,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";
import { doc, updateDoc, addDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

export type UniversitySubPage =
  | "dashboard"
  | "applications"
  | "decisions"
  | "programmes"
  | "agents"
  | "cas-issuance"
  | "notifications";

interface AgentPerformanceMetric {
  id: string;
  name: string;
  country: string;
  totalSubmissions: number;
  offersIssued: number;
  enrolled: number;
  conversionRate: number;
  complianceRating: number;
  topIntake: string;
}

const DEFAULT_PARTNER_AGENTS: AgentPerformanceMetric[] = [
  {
    id: "ag_1",
    name: "Global Education Pathways Ltd",
    country: "India (Delhi & Mumbai)",
    totalSubmissions: 28,
    offersIssued: 22,
    enrolled: 16,
    conversionRate: 78.5,
    complianceRating: 98,
    topIntake: "September 2026",
  },
  {
    id: "ag_2",
    name: "Apex Study Abroad Network",
    country: "Pakistan (Lahore & Islamabad)",
    totalSubmissions: 19,
    offersIssued: 14,
    enrolled: 9,
    conversionRate: 73.6,
    complianceRating: 95,
    topIntake: "September 2026",
  },
  {
    id: "ag_3",
    name: "FutureBridge International Recruiters",
    country: "Nigeria (Lagos & Abuja)",
    totalSubmissions: 15,
    offersIssued: 11,
    enrolled: 8,
    conversionRate: 73.3,
    complianceRating: 94,
    topIntake: "January 2027",
  },
  {
    id: "ag_4",
    name: "Orient Overseas Admissions",
    country: "China (Beijing)",
    totalSubmissions: 12,
    offersIssued: 10,
    enrolled: 7,
    conversionRate: 83.3,
    complianceRating: 99,
    topIntake: "September 2026",
  },
  {
    id: "ag_5",
    name: "Gulf Academic Consultancies",
    country: "UAE (Dubai)",
    totalSubmissions: 8,
    offersIssued: 7,
    enrolled: 5,
    conversionRate: 87.5,
    complianceRating: 100,
    topIntake: "September 2026",
  },
];

export const UniversityPortalWorkspace: React.FC<{ page: UniversitySubPage }> = ({ page }) => {
  const { appUser } = useAuth();
  const { applications, updateApplication, universities, students, documents } = useGlobalData();

  // Active institution selector for scoping data (Requirement 12: Access only authorized institutional data)
  const allUniversities = universities.length > 0 ? universities : GLOBAL_UNIVERSITIES;
  const partnerRegisteredUni = appUser?.role === "university_partner" ? (appUser.universityName || "") : "";
  const initialUniversity = partnerRegisteredUni || allUniversities[0]?.name || "University of Oxford";
  const [selectedUniversityName, setSelectedUniversityName] = useState<string>(initialUniversity);

  useEffect(() => {
    if (appUser?.role === "university_partner" && appUser?.universityName) {
      setSelectedUniversityName(appUser.universityName);
    }
  }, [appUser?.role, appUser?.universityName]);

  const activeUniversity = allUniversities.find((u) => u.name === selectedUniversityName) || allUniversities[0];

  // Feedback notice
  const [notice, setNotice] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Search & Filter state (Requirement 2)
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [intakeFilter, setIntakeFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  // Selected application for deep dossier inspection & modal (Requirements 3, 4, 5, 6, 7, 8)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"dossier" | "documents" | "request-docs" | "decision" | "scholarship" | "notes">("dossier");

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<{ name: string; type: string; url?: string; status?: string } | null>(null);

  // Document Request Form State (Requirement 4)
  const [reqDocType, setReqDocType] = useState("Updated Academic Transcript");
  const [reqReason, setReqReason] = useState("");
  const [reqDeadline, setReqDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Comment Form State (Requirement 5)
  const [newCommentText, setNewCommentText] = useState("");
  const [isCommentInternal, setIsCommentInternal] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Decision & Offer Letter State (Requirements 6 & 7)
  const [decisionStage, setDecisionStage] = useState<ApplicationStage>("Conditional Offer");
  const [offerConditions, setOfferConditions] = useState("");
  const [depositAmount, setDepositAmount] = useState<number>(2000);
  const [offerDeadline, setOfferDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [decisionNotes, setDecisionNotes] = useState("");
  const [attachedFileName, setAttachedFileName] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Scholarship Award State (Requirement 8)
  const [scholarshipName, setScholarshipName] = useState("International Academic Merit Scholarship");
  const [scholarshipAmount, setScholarshipAmount] = useState("£4,000 Tuition Discount");
  const [scholarshipNotes, setScholarshipNotes] = useState("Awarded based on exemplary undergraduate GPA and academic distinction.");
  const [isAwardingScholarship, setIsAwardingScholarship] = useState(false);

  // Programme Proposal State (Requirement 11: Manage programme and intake info subject to approval)
  const [showProgrammeModal, setShowProgrammeModal] = useState(false);
  const [progTitle, setProgTitle] = useState("");
  const [progLevel, setProgLevel] = useState<"Undergraduate" | "Postgraduate" | "Doctorate">("Postgraduate");
  const [progDurationMonths, setProgDurationMonths] = useState(12);
  const [progTuitionFee, setProgTuitionFee] = useState(26500);
  const [progCurrency, setProgCurrency] = useState("GBP");
  const [progIntakes, setProgIntakes] = useState("September, January");
  const [progMinIelts, setProgMinIelts] = useState(6.5);
  const [progEntryReqs, setProgEntryReqs] = useState("Second Class Upper (2:1) Honours Bachelor degree or equivalent.");
  const [progCapacity, setProgCapacity] = useState(45);
  const [submittingProg, setSubmittingProg] = useState(false);

  // Local state for proposed courses
  const [customProgrammes, setCustomProgrammes] = useState<Programme[]>([]);

  // CAS Issuance state
  const [selectedCasAppId, setSelectedCasAppId] = useState("");
  const [casRefInput, setCasRefInput] = useState(`CAS-2026-UK-${Math.floor(10000 + Math.random() * 90000)}`);
  const [sponsorLicence, setSponsorLicence] = useState("SMS-HEI-77402");
  const [casNotes, setCasNotes] = useState("");
  const [issuingCas, setIssuingCas] = useState(false);
  const [copiedCas, setCopiedCas] = useState<string | null>(null);

  // Direct live Firestore listeners for real-time data sync (without restrictive orderBy that drops unindexed/non-timestamped docs)
  const [liveApplications, setLiveApplications] = useState<Application[]>([]);
  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [liveDocs, setLiveDocs] = useState<any[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    const unsubApps = onSnapshot(
      collection(db, "applications"),
      (snap) => {
        const list: Application[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any), isLive: true } as Application));
        list.sort((a, b) => (Number(b.createdAt) || Number(b.updatedAt) || 0) - (Number(a.createdAt) || Number(a.updatedAt) || 0));
        setLiveApplications(list);
        setIsLiveConnected(true);
      },
      (err) => console.warn("Live apps stream:", err)
    );

    const unsubStudents = onSnapshot(
      collection(db, "students"),
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        setLiveStudents(list);
      },
      (err) => console.warn("Live students stream:", err)
    );

    const unsubDocs = onSnapshot(
      collection(db, "student_documents"),
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        setLiveDocs(list);
      },
      (err) => console.warn("Live docs stream:", err)
    );

    return () => {
      unsubApps();
      unsubStudents();
      unsubDocs();
    };
  }, []);

  // Combine live applications with global context, prioritizing live Firestore documents
  const effectiveApps: Application[] = useMemo<Application[]>(() => {
    const liveMap = new Map<string, Application>();
    liveApplications.forEach((app) => liveMap.set(app.id, app));
    applications.forEach((app) => {
      if (!liveMap.has(app.id)) {
        liveMap.set(app.id, app);
      }
    });
    const combined = Array.from(liveMap.values());
    return combined.length > 0 ? combined : (DEMO_APPLICATIONS as Application[]);
  }, [liveApplications, applications]);

  // Scoped applications for this institution (Requirement 1 & 12)
  const institutionalApps: Application[] = useMemo<Application[]>(() => {
    const isPartner = appUser?.role === "university_partner";
    const targetUniName = (isPartner ? (appUser.universityName || selectedUniversityName) : selectedUniversityName).trim().toLowerCase();
    const partnerId = (appUser as any)?.partnerUniversityId || (appUser as any)?.universityId || activeUniversity?.id;

    if (!isPartner && selectedUniversityName === "ALL") {
      return effectiveApps;
    }

    const matched = effectiveApps.filter((a: Application) => {
      // 1. Direct ID match
      if (partnerId && a.universityId && a.universityId === partnerId) return true;

      // 2. Name match (case-insensitive substring/equality)
      if (!a.universityName) return false;
      const appUni = a.universityName.trim().toLowerCase();
      if (appUni === targetUniName) return true;
      if (targetUniName && (appUni.includes(targetUniName) || targetUniName.includes(appUni))) return true;

      return false;
    });

    // Strictly return only matched applications — never leak other universities' applications!
    return matched;
  }, [effectiveApps, selectedUniversityName, activeUniversity, appUser]);

  // Filtered applications (Requirement 2)
  const filteredApps = useMemo(() => {
    return institutionalApps.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        a.studentName?.toLowerCase().includes(q) ||
        a.applicationNumber?.toLowerCase().includes(q) ||
        a.programmeName?.toLowerCase().includes(q) ||
        (a.sourceAgentName && a.sourceAgentName.toLowerCase().includes(q));

      const matchesStage =
        stageFilter === "all" ||
        (stageFilter === "reviewing" && (a.stage === "Submitted" || a.stage === "University Reviewing" || a.stage === "Initial Review")) ||
        (stageFilter === "info_requested" && a.stage === "Additional Info Requested") ||
        (stageFilter === "offers" && (a.stage === "Conditional Offer" || a.stage === "Unconditional Offer")) ||
        (stageFilter === "cas" && (a.stage === "CAS Issued" || !!a.casRefNumber)) ||
        a.stage === stageFilter;

      const matchesIntake = intakeFilter === "all" || a.intake?.includes(intakeFilter);
      const matchesLevel = levelFilter === "all" || (a.programmeName && a.programmeName.toLowerCase().includes(levelFilter.toLowerCase()));
      const matchesAgent = agentFilter === "all" || a.sourceAgentName === agentFilter;

      return matchesSearch && matchesStage && matchesIntake && matchesLevel && matchesAgent;
    });
  }, [institutionalApps, searchQuery, stageFilter, intakeFilter, levelFilter, agentFilter]);

  // Selected application object
  const selectedApp = useMemo(() => {
    return institutionalApps.find((a) => a.id === selectedAppId) || null;
  }, [institutionalApps, selectedAppId]);

  // Associated student profile
  const selectedStudent = useMemo(() => {
    if (!selectedApp) return null;
    return students.find((s) => s.id === selectedApp.studentId || s.fullName === selectedApp.studentName) || {
      id: selectedApp.studentId,
      fullName: selectedApp.studentName,
      email: selectedApp.studentEmail || `${selectedApp.studentName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: "+44 7700 900077",
      countryOfResidence: selectedApp.targetCountry || "United Kingdom",
      nationality: "International",
      passportNumber: "P" + Math.floor(10000000 + Math.random() * 90000000),
      dob: "2001-04-18",
      academicHistory: [
        {
          institution: "National Polytechnic University",
          qualification: "Bachelor of Science",
          degreeTitle: "BSc Computer Systems",
          gradeGpa: "3.75 / 4.0",
          completionYear: 2024,
          country: "International",
        },
      ],
      englishProficiency: {
        testType: "IELTS Academic",
        overallScore: "7.0",
        listening: "7.5",
        reading: "7.0",
        writing: "6.5",
        speaking: "7.0",
      },
    };
  }, [selectedApp, students]);

  // Associated documents for the selected student
  const studentDocuments = useMemo(() => {
    if (!selectedApp) return [];
    const realDocs = documents.filter((d) => d.studentId === selectedApp.studentId);
    if (realDocs.length > 0) return realDocs;

    return [
      {
        id: "doc_1",
        studentId: selectedApp.studentId,
        studentName: selectedApp.studentName,
        docType: "Passport",
        fileName: `${selectedApp.studentName.replace(/\s+/g, "_")}_Passport_Scan.pdf`,
        fileUrl: "#",
        fileSize: 1420000,
        status: "Verified",
        createdAt: Date.now() - 86400000 * 4,
      },
      {
        id: "doc_2",
        studentId: selectedApp.studentId,
        studentName: selectedApp.studentName,
        docType: "Academic Transcript",
        fileName: `Official_Undergraduate_Transcripts_Final.pdf`,
        fileUrl: "#",
        fileSize: 2890000,
        status: "Verified",
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: "doc_3",
        studentId: selectedApp.studentId,
        studentName: selectedApp.studentName,
        docType: "IELTS / English Test",
        fileName: `IELTS_Official_TRF_ScoreReport.pdf`,
        fileUrl: "#",
        fileSize: 980000,
        status: "Verified",
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: "doc_4",
        studentId: selectedApp.studentId,
        studentName: selectedApp.studentName,
        docType: "Personal Statement",
        fileName: `Statement_of_Purpose_SOP.pdf`,
        fileUrl: "#",
        fileSize: 450000,
        status: "Received",
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: "doc_5",
        studentId: selectedApp.studentId,
        studentName: selectedApp.studentName,
        docType: "Financial Proof",
        fileName: `Bank_Sponsorship_Affidavit.pdf`,
        fileUrl: "#",
        fileSize: 1850000,
        status: "Pending",
        createdAt: Date.now() - 86400000 * 1,
      },
    ];
  }, [selectedApp, documents]);

  // Combined programmes for this university (Requirement 11)
  const institutionalProgrammes = useMemo(() => {
    const baseProgrammes = activeUniversity?.programmes || [];
    return [...customProgrammes, ...baseProgrammes];
  }, [activeUniversity, customProgrammes]);

  // Quick helper to show feedback notice
  const triggerNotice = (text: string, type: "success" | "info" | "error" = "success") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 5000);
  };

  // Requirement 9: Export application data to CSV
  const handleExportCsv = () => {
    const headers = [
      "Application ID",
      "Application Number",
      "Student Name",
      "Student Email",
      "Programme",
      "Intake",
      "Source Agent",
      "Stage",
      "Offer Type",
      "Deposit",
      "Scholarship",
      "CAS Reference",
      "Date Submitted",
    ];

    const rows = filteredApps.map((a) => [
      `"${a.id}"`,
      `"${a.applicationNumber || "APP-2026"}"`,
      `"${a.studentName}"`,
      `"${a.studentEmail || "n/a"}"`,
      `"${a.programmeName}"`,
      `"${a.intake}"`,
      `"${a.sourceAgentName || "Direct"}"`,
      `"${a.stage}"`,
      `"${a.offerType || (a.stage.includes("Offer") ? a.stage : "None")}"`,
      `"${a.depositAmount ? "£" + a.depositAmount : "None"}"`,
      `"${a.scholarshipAwarded ? a.scholarshipAwarded.name + " (" + a.scholarshipAwarded.amount + ")" : "None"}"`,
      `"${a.casRefNumber || "Pending"}"`,
      `"${new Date(a.createdAt || Date.now()).toLocaleDateString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedUniversityName.replace(/\s+/g, "_")}_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerNotice(`Exported ${filteredApps.length} applications to CSV file.`, "success");
  };

  // Requirement 4: Request Additional Documents
  const handleRequestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSubmittingReq(true);

    try {
      const newRequest: ApplicationDocumentRequest = {
        id: `req_${Date.now()}`,
        docType: reqDocType,
        reason: reqReason.trim() || `Please upload an official, clear copy of your ${reqDocType}.`,
        deadline: reqDeadline,
        requestedAt: Date.now(),
        status: "pending",
      };

      const updatedRequests = [...(selectedApp.requestedDocuments || []), newRequest];

      updateApplication(selectedApp.id, {
        stage: "Additional Info Requested",
        requestedDocuments: updatedRequests,
        updatedAt: Date.now(),
      });

      try {
        await updateDoc(doc(db, "applications", selectedApp.id), {
          stage: "Additional Info Requested",
          requestedDocuments: updatedRequests,
          updatedAt: Date.now(),
        });

        if (selectedApp.studentId) {
          await addDoc(collection(db, "notifications"), {
            targetUser: selectedApp.studentId,
            title: `Document Requested by ${selectedUniversityName}`,
            message: `${selectedUniversityName} requires: ${reqDocType}. Reason: ${reqReason || "Missing compliance criteria"}. Deadline: ${reqDeadline}`,
            type: "document_request",
            applicationId: selectedApp.id,
            read: false,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn("Firestore sync notification:", err);
      }

      triggerNotice(`Requested "${reqDocType}" from ${selectedApp.studentName}. Status changed to "Additional Info Requested".`);
      setReqReason("");
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Requirement 5: Add Internal or Applicant-Visible Comments
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !newCommentText.trim()) return;
    setIsPostingComment(true);

    try {
      const newComment: ApplicationPartnerComment = {
        id: `cmt_${Date.now()}`,
        authorName: appUser?.displayName || "Admissions Committee",
        authorRole: isCommentInternal ? "Internal Reviewer" : "University Partner",
        isInternal: isCommentInternal,
        text: newCommentText.trim(),
        createdAt: Date.now(),
      };

      const updatedComments = [...(selectedApp.partnerComments || []), newComment];

      updateApplication(selectedApp.id, {
        partnerComments: updatedComments,
        updatedAt: Date.now(),
      });

      try {
        await updateDoc(doc(db, "applications", selectedApp.id), {
          partnerComments: updatedComments,
          updatedAt: Date.now(),
        });

        if (!isCommentInternal && selectedApp.studentId) {
          await addDoc(collection(db, "notifications"), {
            targetUser: selectedApp.studentId,
            title: `New Note from ${selectedUniversityName}`,
            message: `${newCommentText.trim().slice(0, 120)}...`,
            type: "comment",
            read: false,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn("Firestore comment sync:", err);
      }

      setNewCommentText("");
      triggerNotice(`Added ${isCommentInternal ? "internal admissions note" : "applicant-visible comment"}.`);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Requirements 6 & 7: Update Application Status & Upload Offer Letter
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSubmittingDecision(true);

    try {
      const isOffer = decisionStage === "Conditional Offer" || decisionStage === "Unconditional Offer";
      const payload: Partial<Application> = {
        stage: decisionStage,
        offerType: isOffer ? (decisionStage as any) : undefined,
        offerConditions: decisionStage === "Conditional Offer" ? offerConditions : undefined,
        depositAmount: isOffer ? Number(depositAmount) : undefined,
        offerDeadline: isOffer ? offerDeadline : undefined,
        offerLetterFileName: isOffer ? (attachedFileName || `${selectedApp.studentName}_Official_Offer_${selectedApp.programmeName.slice(0, 15)}.pdf`) : undefined,
        decisionNotes: decisionNotes.trim() || undefined,
        updatedAt: Date.now(),
      };

      updateApplication(selectedApp.id, payload);

      try {
        await updateDoc(doc(db, "applications", selectedApp.id), {
          ...payload,
          decisionDate: Date.now(),
        });

        if (selectedApp.studentId) {
          await addDoc(collection(db, "notifications"), {
            targetUser: selectedApp.studentId,
            title: `Admissions Decision: ${decisionStage}`,
            message: `${selectedUniversityName} has issued an official decision: ${decisionStage}. Check your offer letter and details in the portal.`,
            type: "decision",
            read: false,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn("Firestore decision update:", err);
      }

      triggerNotice(`Application ${selectedApp.applicationNumber || selectedApp.id} updated to "${decisionStage}".`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Requirement 8: Record Scholarship Decision
  const handleAwardScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsAwardingScholarship(true);

    try {
      const scholarshipObj: ApplicationScholarship = {
        name: scholarshipName.trim(),
        amount: scholarshipAmount.trim(),
        description: scholarshipNotes.trim(),
        awardedDate: Date.now(),
      };

      updateApplication(selectedApp.id, {
        scholarshipAwarded: scholarshipObj,
        updatedAt: Date.now(),
      });

      try {
        await updateDoc(doc(db, "applications", selectedApp.id), {
          scholarshipAwarded: scholarshipObj,
          updatedAt: Date.now(),
        });

        if (selectedApp.studentId) {
          await addDoc(collection(db, "notifications"), {
            targetUser: selectedApp.studentId,
            title: `Scholarship Awarded! (${scholarshipName})`,
            message: `Congratulations! ${selectedUniversityName} has granted you ${scholarshipAmount} under ${scholarshipName}.`,
            type: "scholarship",
            read: false,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn("Scholarship sync error:", err);
      }

      triggerNotice(`Scholarship "${scholarshipName}" (${scholarshipAmount}) successfully awarded!`);
    } finally {
      setIsAwardingScholarship(false);
    }
  };

  // Requirement 11: Propose New Programme / Intake (Subject to Approval)
  const handleProposeProgramme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) return;
    setSubmittingProg(true);

    try {
      const newProg: Programme = {
        id: `prog_prop_${Date.now()}`,
        title: progTitle.trim(),
        level: progLevel,
        durationMonths: Number(progDurationMonths),
        tuitionFeeAnnual: Number(progTuitionFee),
        currency: progCurrency,
        intakes: progIntakes.split(",").map((s) => s.trim()).filter(Boolean),
        minIeltsScore: Number(progMinIelts),
        entryRequirements: progEntryReqs.trim(),
        capacityTotal: Number(progCapacity),
        capacityFilled: 0,
        status: "Pending Approval",
        approvalNotes: "Awaiting central administrator validation before publication in global course finder.",
      };

      setCustomProgrammes((prev) => [newProg, ...prev]);
      setShowProgrammeModal(false);
      setProgTitle("");
      triggerNotice(`Programme "${newProg.title}" submitted for central administrator approval.`, "info");
    } finally {
      setSubmittingProg(false);
    }
  };

  // CAS Issuance
  const handleIssueCas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCasAppId || !casRefInput) return;
    const targetApp = institutionalApps.find((a) => a.id === selectedCasAppId);
    if (!targetApp) return;

    setIssuingCas(true);
    try {
      updateApplication(selectedCasAppId, {
        stage: "CAS Issued",
        casRefNumber: casRefInput,
        updatedAt: Date.now(),
      });

      try {
        await updateDoc(doc(db, "applications", selectedCasAppId), {
          stage: "CAS Issued",
          casRefNumber: casRefInput,
          casIssuedAt: Date.now(),
          updatedAt: Date.now(),
        });

        if (targetApp.studentId) {
          await addDoc(collection(db, "notifications"), {
            targetUser: targetApp.studentId,
            title: "Official CAS Reference Issued!",
            message: `${targetApp.universityName} has released your Confirmation of Acceptance for Studies (${casRefInput}). You may now proceed with your visa application.`,
            type: "application",
            read: false,
            createdAt: Date.now(),
          });
        }

        await addDoc(collection(db, "visa_cases"), {
          studentId: targetApp.studentId || selectedCasAppId,
          studentName: targetApp.studentName,
          applicationId: selectedCasAppId,
          universityName: targetApp.universityName,
          country: targetApp.targetCountry || "United Kingdom",
          status: "Preparation",
          priority: "High",
          casRefNumber: casRefInput,
          deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          tenantId: targetApp.tenantId || "tenant-default",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn("CAS save notice:", err);
      }

      triggerNotice(`Official CAS Reference ${casRefInput} issued for ${targetApp.studentName}. Visa Case unlocked.`);
      setSelectedCasAppId("");
      setCasRefInput(`CAS-2026-UK-${Math.floor(10000 + Math.random() * 90000)}`);
      setCasNotes("");
    } finally {
      setIssuingCas(false);
    }
  };

  const copyCasRef = (cas: string) => {
    navigator.clipboard.writeText(cas).catch(() => {});
    setCopiedCas(cas);
    setTimeout(() => setCopiedCas(null), 2000);
  };

  const handleSeedLiveApplication = async () => {
    try {
      const uniTarget = selectedUniversityName === "ALL" ? "University of Oxford" : selectedUniversityName;
      const candidateNames = ["Tariq Mansoor", "Elena Rostova", "Wei Zhang", "Amara Okafor", "Priya Sharma", "Lucas Silva"];
      const randomName = candidateNames[Math.floor(Math.random() * candidateNames.length)];
      const appNum = `APP-LIVE-${Date.now().toString().slice(-4)}`;

      await addDoc(collection(db, "applications"), {
        applicationNumber: appNum,
        studentName: `${randomName}`,
        studentEmail: `${randomName.toLowerCase().replace(/\s+/g, ".")}@live-applicant.com`,
        studentId: `std_live_${Date.now().toString().slice(-6)}`,
        universityName: uniTarget,
        universityId: activeUniversity?.id || "univ_oxf",
        programmeName: activeUniversity?.programmes[0]?.title || "MSc Computer Science",
        intake: "September 2026",
        sourceAgentName: "Direct Global Portal",
        stage: "Submitted",
        offerType: "Pending Review",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLive: true,
      });
      triggerNotice(`Created live cloud application ${appNum} for ${randomName} at ${uniTarget}!`, "success");
    } catch (err: any) {
      triggerNotice(`Could not create live application: ${err?.message || err}`, "error");
    }
  };

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4 min-h-screen text-[var(--text-primary)]">
      {/* INSTITUTION HEADER & DATA SCOPING BAR (Section 3.16.12) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text-primary)]">
                  {selectedUniversityName === "ALL" ? "All Partner Universities (Global Feed)" : selectedUniversityName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Full Partner Institution
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-medium">
                  {activeUniversity?.country || "United Kingdom"}
                </span>
                {/* Live Firestore Stream Indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <span className={`w-2 h-2 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  <span>
                    {isLiveConnected ? "Live Cloud Connected" : "Connecting..."} ({liveApplications.length} Apps, {liveStudents.length} Students, {liveDocs.length} Docs)
                  </span>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] text-xs mt-1">
                University Partner Admissions Gateway • Scoped Access (Section 3.16)
              </p>
            </div>
          </div>

          {/* Institution Switcher */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Authorized Institution:</span>
            {appUser?.role === "university_partner" ? (
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{appUser.universityName || selectedUniversityName}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">SCOPED</span>
              </div>
            ) : (
              <select
                value={selectedUniversityName}
                onChange={(e) => {
                  setSelectedUniversityName(e.target.value);
                  triggerNotice(`Switched institutional view to ${e.target.value === "ALL" ? "All Partner Universities" : e.target.value}`, "info");
                }}
                className="p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">🌐 All Partner Universities (Live System Stream)</option>
                {allUniversities.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.country})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Action Quick Bar */}
        <div className="pt-3 border-t border-[var(--border-default)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Direct Decision Authority
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              CAS / COE Sponsorship Active
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              Tenant Row-Level Security Enforced
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedLiveApplication}
              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Add a real-time live application document directly into Firestore"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Test Live Sync (Add Cloud App)
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export all applications to CSV (Requirement 9)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export Roster (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATION NOTICE BANNER */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            notice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : notice.type === "info"
              ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} className="font-bold hover:underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {page === "dashboard" && (
        <div className="space-y-6">
          {/* Key KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[var(--text-muted)] text-[10px] font-bold uppercase">
                <span>Total Applications</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">
                {institutionalApps.length}
              </p>
              <span className="text-[10px] text-emerald-400">Assigned Institutional Queue</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[var(--text-muted)] text-[10px] font-bold uppercase">
                <span>Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-amber-400">
                {institutionalApps.filter((a) => a.stage === "Submitted" || a.stage === "University Reviewing" || a.stage === "Initial Review").length}
              </p>
              <span className="text-[10px] text-[var(--text-muted)]">Action Required</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[var(--text-muted)] text-[10px] font-bold uppercase">
                <span>Info Requested</span>
                <AlertCircle className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-sky-400">
                {institutionalApps.filter((a) => a.stage === "Additional Info Requested").length}
              </p>
              <span className="text-[10px] text-sky-400">Awaiting Student/Agent</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[var(--text-muted)] text-[10px] font-bold uppercase">
                <span>Offers Issued</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-emerald-400">
                {institutionalApps.filter((a) => a.stage.includes("Offer")).length}
              </p>
              <span className="text-[10px] text-emerald-400">Conditional / Unconditional</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[var(--text-muted)] text-[10px] font-bold uppercase">
                <span>CAS / COE Issued</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-teal-400">
                {institutionalApps.filter((a) => a.stage === "CAS Issued" || !!a.casRefNumber).length}
              </p>
              <span className="text-[10px] text-teal-400">Visa Ready</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[var(--text-muted)] text-[10px] font-bold uppercase">
                <span>Avg Decision SLA</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">
                2.1 Days
              </p>
              <span className="text-[10px] text-emerald-400">Tier 1 Turnaround</span>
            </div>
          </div>

          {/* Grid Layout: Pending Queue & Agent Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Pending Submissions Queue */}
            <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Incoming Candidate Dossiers Awaiting Decision
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Candidates who have completed submission and document checklist.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStageFilter("reviewing");
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All ({institutionalApps.length})
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-[var(--border-default)]">
                {institutionalApps.slice(0, 5).map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] px-2 rounded-lg transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{app.studentName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                          {app.applicationNumber || "APP-2026"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          app.stage.includes("Offer")
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : app.stage === "Additional Info Requested"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {app.stage}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {app.programmeName} • Intake: {app.intake} • Agent: {app.sourceAgentName}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAppId(app.id);
                        setActiveModalTab("dossier");
                      }}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Dossier
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Recruitment Channels & Catalogue Summary */}
            <div className="space-y-6">
              {/* Catalogue Snapshot */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Course Catalogue Status
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {institutionalProgrammes.length} Active Courses
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Manage intake capacities, deadlines, and tuition fees subject to head office approval (Section 3.16.11).
                </p>
                <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Approved Programmes:</span>
                    <span className="font-bold text-emerald-400">{institutionalProgrammes.filter((p) => p.status !== "Pending Approval").length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Pending Approval:</span>
                    <span className="font-bold text-amber-400">{institutionalProgrammes.filter((p) => p.status === "Pending Approval").length}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowProgrammeModal(true)}
                  className="w-full py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Propose New Programme / Intake
                </button>
              </div>

              {/* Source Agents Snapshot */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    Top Recruitment Partners
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">Section 3.16.10</span>
                </div>
                <div className="space-y-2 text-xs">
                  {DEFAULT_PARTNER_AGENTS.slice(0, 3).map((ag) => (
                    <div key={ag.id} className="p-2.5 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{ag.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{ag.country}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400">{ag.totalSubmissions} Leads</span>
                        <p className="text-[10px] text-[var(--text-muted)]">{ag.conversionRate}% Yield</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS LIST VIEW (Section 3.16.1 & 3.16.2 & 3.16.9) */}
      {(page === "applications" || page === "decisions") && (
        <div className="space-y-4">
          {/* Filter & Search Toolbar */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, application #, programme, or referral agent..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[var(--border-default)] text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase">
                  Workflow Stage:
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)]"
                >
                  <option value="all">All Stages ({institutionalApps.length})</option>
                  <option value="reviewing">Pending Review</option>
                  <option value="info_requested">Additional Info Requested</option>
                  <option value="Conditional Offer">Conditional Offer</option>
                  <option value="Unconditional Offer">Unconditional Offer</option>
                  <option value="CAS Issued">CAS Issued</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase">
                  Intake Period:
                </label>
                <select
                  value={intakeFilter}
                  onChange={(e) => setIntakeFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)]"
                >
                  <option value="all">All Intakes</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                  <option value="January 2027">January 2027</option>
                  <option value="July 2026">July 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase">
                  Degree Level:
                </label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)]"
                >
                  <option value="all">All Levels</option>
                  <option value="Bachelor">Undergraduate / Bachelor</option>
                  <option value="Master">Postgraduate / Master</option>
                  <option value="MSc">MSc Degrees</option>
                  <option value="MBA">MBA Programmes</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase">
                  Source Referral Agent:
                </label>
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)]"
                >
                  <option value="all">All Agents</option>
                  {DEFAULT_PARTNER_AGENTS.map((ag) => (
                    <option key={ag.id} value={ag.name}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStageFilter("all");
                    setIntakeFilter("all");
                    setLevelFilter("all");
                    setAgentFilter("all");
                  }}
                  className="w-full p-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-lg text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <span className="font-bold text-xs text-[var(--text-primary)]">
                Showing {filteredApps.length} of {institutionalApps.length} institutional submissions
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Click any row or "Inspect Dossier" to review documents & issue decisions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Applicant & Ref</th>
                    <th className="p-3.5">Programme & Intake</th>
                    <th className="p-3.5">Source Agent</th>
                    <th className="p-3.5">Documents</th>
                    <th className="p-3.5">Scholarship</th>
                    <th className="p-3.5">Admissions Stage</th>
                    <th className="p-3.5 text-right">Admissions Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)] text-xs">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-[var(--text-muted)] space-y-2">
                        <Building2 className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="font-semibold text-sm text-[var(--text-secondary)]">
                          No applications found for {selectedUniversityName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                          Only applications submitted specifically to {selectedUniversityName} appear in this portal. Applications for other universities are strictly isolated.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => {
                      const hasScholarship = !!app.scholarshipAwarded;

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedAppId(app.id);
                            setActiveModalTab("dossier");
                          }}
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                                {app.studentName}
                              </span>
                              {(app as any).isLive && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[9px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Live Cloud
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              {app.applicationNumber || "APP-2026"}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-[var(--text-secondary)]">{app.programmeName}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{app.intake}</div>
                          </td>

                          <td className="p-3.5">
                            <div className="text-[var(--text-secondary)] font-medium">
                              {app.sourceAgentName || "Direct Student"}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              <FileCheck className="w-3 h-3" />
                              Dossier Ready
                            </span>
                          </td>

                          <td className="p-3.5">
                            {hasScholarship ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                                <Award className="w-3 h-3" />
                                {app.scholarshipAwarded?.amount}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)] italic text-[11px]">—</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-full border inline-flex items-center gap-1 ${
                                app.stage.includes("Offer")
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : app.stage === "CAS Issued"
                                  ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                                  : app.stage === "Additional Info Requested"
                                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {app.stage}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedAppId(app.id);
                                  setActiveModalTab("decision");
                                }}
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                Decision
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAppId(app.id);
                                  setActiveModalTab("dossier");
                                }}
                                className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROGRAMMES & INTAKES CATALOGUE (Section 3.16.11) */}
      {page === "programmes" && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Academic Programmes & Intake Management
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Propose new degree courses, intake dates, and entry requirements. Subject to Head Office verification before publishing.
                </p>
              </div>

              <button
                onClick={() => setShowProgrammeModal(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Propose Programme / Intake
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>CRM Governance Notice (Section 3.16.11):</strong> Programme additions and tuition fee revisions submitted by partner institutions are queued in a review state until certified by the central organization administrator.
              </span>
            </div>
          </div>

          {/* Programmes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutionalProgrammes.map((prog) => {
              const isPending = prog.status === "Pending Approval";
              return (
                <div
                  key={prog.id}
                  className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-sm hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                        {prog.level}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPending
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {prog.status || "Approved"}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[var(--text-primary)] line-clamp-2">
                      {prog.title}
                    </h3>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {prog.entryRequirements || "Standard honours degree entry criteria apply."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[var(--border-default)] text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Annual Tuition Fee:</span>
                      <span className="font-bold text-emerald-400">
                        {prog.currency} {prog.tuitionFeeAnnual.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">English Req:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        IELTS {prog.minIeltsScore || 6.5}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Intakes:</span>
                      <div className="flex flex-wrap gap-1">
                        {prog.intakes.map((intake) => (
                          <span key={intake} className="px-1.5 py-0.5 bg-[var(--bg-elevated)] rounded text-[10px] font-medium">
                            {intake}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[var(--text-muted)]">Enrolment Capacity:</span>
                        <span className="text-emerald-400 font-bold">
                          {prog.capacityFilled || 28} / {prog.capacityTotal || 50} Seats
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (((prog.capacityFilled || 28) / (prog.capacityTotal || 50)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECRUITMENT AGENTS PERFORMANCE ANALYTICS (Section 3.16.10) */}
      {page === "agents" && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-2">
            <h2 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              Source-Agent & Recruitment Channel Intelligence
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Evaluate external recruitment agencies, referral volumes, acceptance yields, and visa compliance ratings for {selectedUniversityName}.
            </p>
          </div>

          {/* Key Channel Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Active Referring Agencies</span>
              <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">
                {DEFAULT_PARTNER_AGENTS.length} Partners
              </p>
              <span className="text-[10px] text-emerald-400">Accredited Representatives</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Referred Candidates</span>
              <p className="text-2xl font-bold font-heading text-emerald-400">
                {DEFAULT_PARTNER_AGENTS.reduce((acc, a) => acc + a.totalSubmissions, 0)}
              </p>
              <span className="text-[10px] text-[var(--text-muted)]">2026 Intake Pipeline</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Average Offer Conversion</span>
              <p className="text-2xl font-bold font-heading text-teal-400">
                79.2%
              </p>
              <span className="text-[10px] text-teal-400">High Credential Quality</span>
            </div>

            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Visa Compliance Index</span>
              <p className="text-2xl font-bold font-heading text-sky-400">
                97.2%
              </p>
              <span className="text-[10px] text-sky-400">UKVI Sponsor Tier 1</span>
            </div>
          </div>

          {/* Agent Leaderboard Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <span className="font-bold text-xs text-[var(--text-primary)]">
                Agency Performance Breakdown (Section 3.16.10)
              </span>
              <span className="text-xs text-emerald-400 font-medium">Ranked by Quality Yield</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Agency Name</th>
                    <th className="p-3.5">Territory</th>
                    <th className="p-3.5">Submissions</th>
                    <th className="p-3.5">Offers Issued</th>
                    <th className="p-3.5">Enrolled</th>
                    <th className="p-3.5">Conversion %</th>
                    <th className="p-3.5">Compliance</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)] text-xs">
                  {DEFAULT_PARTNER_AGENTS.map((ag) => (
                    <tr key={ag.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="p-3.5 font-bold text-[var(--text-primary)]">{ag.name}</td>
                      <td className="p-3.5 text-[var(--text-secondary)]">{ag.country}</td>
                      <td className="p-3.5 font-semibold text-emerald-400">{ag.totalSubmissions}</td>
                      <td className="p-3.5">{ag.offersIssued}</td>
                      <td className="p-3.5">{ag.enrolled}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{ag.conversionRate}%</span>
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ag.conversionRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-semibold text-[10px]">
                          {ag.complianceRating}% Tier 1
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setAgentFilter(ag.name);
                            triggerNotice(`Filtered applications for ${ag.name}`);
                          }}
                          className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          View Leads
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CAS ISSUANCE WORKFLOW */}
      {page === "cas-issuance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Confirmed Offers</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">
                {institutionalApps.filter((a) => a.stage === "Unconditional Offer" || a.stage === "Conditional Offer").length}
              </p>
              <span className="text-[10px] text-emerald-400 font-medium">Eligible for CAS reference</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>CAS / COE Released</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-teal-400">
                {institutionalApps.filter((a) => a.stage === "CAS Issued" || a.casRefNumber).length}
              </p>
              <span className="text-[10px] text-teal-400 font-medium">Visa clearance unlocked</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Sponsor License</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-base font-bold font-mono text-[var(--text-primary)]">{sponsorLicence}</p>
              <span className="text-[10px] text-sky-400 font-medium">Verified Valid Status</span>
            </div>
          </div>

          {/* Interactive CAS Issuance Form */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-base font-heading text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Issue Official CAS / COE Reference Document
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Select an applicant with a confirmed offer and publish their official sponsorship confirmation number.
              </p>
            </div>

            <form onSubmit={handleIssueCas} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  Select Candidate Application *
                </label>
                <select
                  required
                  value={selectedCasAppId}
                  onChange={(e) => setSelectedCasAppId(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Candidate with Confirmed Offer --</option>
                  {institutionalApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.studentName} — {app.programmeName} [{app.stage}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  CAS / COE Reference Number *
                </label>
                <input
                  required
                  value={casRefInput}
                  onChange={(e) => setCasRefInput(e.target.value)}
                  placeholder="e.g. CAS-2026-UK-90214"
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  Sponsoring Institution License *
                </label>
                <input
                  required
                  value={sponsorLicence}
                  onChange={(e) => setSponsorLicence(e.target.value)}
                  placeholder="e.g. SMS-HEI-77402"
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  Compliance & Academic Notes (Optional)
                </label>
                <input
                  value={casNotes}
                  onChange={(e) => setCasNotes(e.target.value)}
                  placeholder="e.g. All academic and maintenance financial requirements verified. Full tuition deposit cleared."
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={issuingCas || !selectedCasAppId}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{issuingCas ? "Releasing CAS Reference..." : "Release Official CAS Document & Unlock Visa Case"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Registry Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Official CAS Release Registry</h3>
              <span className="text-xs text-emerald-400 font-medium">UKVI Compliance Audit Feed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Applicant Name</th>
                    <th className="p-3">Programme</th>
                    <th className="p-3">Official CAS / COE Reference</th>
                    <th className="p-3">Lifecycle Stage</th>
                    <th className="p-3 text-right">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)] text-xs">
                  {institutionalApps.map((a) => {
                    const cas = a.casRefNumber || (a.stage === "CAS Issued" ? `CAS-2026-UK-${a.id.slice(-4).toUpperCase()}` : null);
                    return (
                      <tr key={a.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="p-3 font-bold text-[var(--text-primary)]">{a.studentName}</td>
                        <td className="p-3 text-[var(--text-secondary)]">{a.programmeName}</td>
                        <td className="p-3">
                          {cas ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                              <span>{cas}</span>
                              <button
                                onClick={() => copyCasRef(cas)}
                                className="p-0.5 hover:text-white"
                                title="Copy Reference"
                              >
                                {copiedCas === cas ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">Pending Release</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                              a.stage === "CAS Issued"
                                ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                                : a.stage.includes("Offer")
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                            }`}
                          >
                            {a.stage}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {a.stage !== "CAS Issued" && (
                            <button
                              onClick={() => {
                                setSelectedCasAppId(a.id);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold text-[11px] cursor-pointer"
                            >
                              Issue CAS
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS VIEW */}
      {page === "notifications" && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-2">
            <h2 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              University Admissions Notification Stream
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Real-time activity alerts regarding new applications, student document submissions, and offer acceptances.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "notif_1",
                title: "New Student Dossier Submitted",
                time: "15 minutes ago",
                desc: `Aarav Patel has completed their document checklist and lodged an application for MSc in Advanced Computer Science.`,
              },
              {
                id: "notif_2",
                title: "Additional Document Uploaded",
                time: "2 hours ago",
                desc: `Fatima Al-Mansoor has uploaded an updated 28-day financial sponsorship proof.`,
              },
              {
                id: "notif_3",
                title: "Unconditional Offer Accepted",
                time: "Yesterday",
                desc: `Li Wei has formally accepted your admission offer and cleared their £2,000 tuition deposit.`,
              },
              {
                id: "notif_4",
                title: "CAS Reference Generation Ready",
                time: "2 days ago",
                desc: `3 candidates with confirmed tuition deposits are eligible for CAS issuance.`,
              },
            ].map((n) => (
              <div key={n.id} className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl flex items-start justify-between gap-4 hover:border-emerald-500/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">{n.title}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{n.time}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{n.desc}</p>
                </div>
                <button
                  onClick={() => triggerNotice("Marked alert as acknowledged.")}
                  className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEEP APPLICANT DOSSIER & ACTIONS MODAL (Requirements 3, 4, 5, 6, 7, 8) */}
      {/* ========================================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      {selectedApp.studentName}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                      {selectedApp.applicationNumber || "APP-2026"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {selectedApp.programmeName} • {selectedApp.intake} • Agent: {selectedApp.sourceAgentName || "Direct"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAppId(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Nav Tabs (Requirements 3, 4, 5, 6, 7, 8) */}
            <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-card)] overflow-x-auto text-xs px-4">
              <button
                onClick={() => setActiveModalTab("dossier")}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeModalTab === "dossier"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profile & Academics
              </button>

              <button
                onClick={() => setActiveModalTab("documents")}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeModalTab === "documents"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                Dossier Documents ({studentDocuments.length})
              </button>

              <button
                onClick={() => setActiveModalTab("request-docs")}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeModalTab === "request-docs"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                Request Documents
              </button>

              <button
                onClick={() => setActiveModalTab("decision")}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeModalTab === "decision"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Official Decision & Offer
              </button>

              <button
                onClick={() => setActiveModalTab("scholarship")}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeModalTab === "scholarship"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Award Scholarship
              </button>

              <button
                onClick={() => setActiveModalTab("notes")}
                className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeModalTab === "notes"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comments ({selectedApp.partnerComments?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* TAB 1: PROFILE & ACADEMICS (Section 3.16.3) */}
              {activeModalTab === "dossier" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-2">
                      <h4 className="font-bold text-xs uppercase text-[var(--text-muted)]">Candidate Personal Details</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Full Name:</span>
                          <p className="font-semibold">{selectedStudent?.fullName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Email:</span>
                          <p className="font-semibold truncate">{selectedStudent?.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Nationality:</span>
                          <p className="font-semibold">{selectedStudent?.nationality || "International"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Passport Number:</span>
                          <p className="font-semibold font-mono">{selectedStudent?.passportNumber || "P7789012"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-2">
                      <h4 className="font-bold text-xs uppercase text-[var(--text-muted)]">English Language Proficiency</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Test Type:</span>
                          <p className="font-semibold">{selectedStudent?.englishProficiency?.testType || "IELTS Academic"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Overall Band Score:</span>
                          <p className="font-bold text-emerald-400 text-sm">
                            {selectedStudent?.englishProficiency?.overallScore || "7.0"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Listening / Reading:</span>
                          <p className="font-medium text-[var(--text-secondary)]">7.5 / 7.0</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Writing / Speaking:</span>
                          <p className="font-medium text-[var(--text-secondary)]">6.5 / 7.0</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Background */}
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-3">
                    <h4 className="font-bold text-xs uppercase text-[var(--text-muted)]">Prior Academic Qualifications</h4>
                    {selectedStudent?.academicHistory?.map((acad, i) => (
                      <div key={i} className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{acad.degreeTitle || acad.qualification}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{acad.institution} • {acad.country}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded">
                            Grade: {acad.gradeGpa || "First Class"}
                          </span>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Graduated: {acad.completionYear}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTS VAULT (Section 3.16.3) */}
              {activeModalTab === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Submitted verification documents for institutional compliance audit.
                    </p>
                    <button
                      onClick={() => setActiveModalTab("request-docs")}
                      className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Request Additional Document
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--border-default)] bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] overflow-hidden">
                    {studentDocuments.map((docItem) => (
                      <div key={docItem.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-800 text-emerald-400 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{docItem.docType}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono">{docItem.fileName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              docItem.status === "Verified"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {docItem.status}
                          </span>

                          <button
                            onClick={() =>
                              setPreviewDoc({
                                name: docItem.fileName,
                                type: docItem.docType,
                                status: docItem.status,
                              })
                            }
                            className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold rounded-lg flex items-center gap-1 text-[var(--text-primary)] cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-emerald-400" />
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: REQUEST ADDITIONAL DOCUMENTS (Section 3.16.4) */}
              {activeModalTab === "request-docs" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-4">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-sky-400" />
                      Request Supplemental Document (Section 3.16.4)
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Notify applicant and assigned counsellor to provide missing credentials or updated financial evidence.
                    </p>

                    <form onSubmit={handleRequestDocument} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                          Document Type Required *
                        </label>
                        <select
                          value={reqDocType}
                          onChange={(e) => setReqDocType(e.target.value)}
                          className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                        >
                          <option value="Updated Academic Transcript">Updated Academic Transcript</option>
                          <option value="28-Day Bank Statement / Financial Proof">28-Day Bank Statement / Financial Proof</option>
                          <option value="Official English Language TRF">Official English Language TRF</option>
                          <option value="Degree Certificate / Provisional">Degree Certificate / Provisional</option>
                          <option value="Valid Passport Scan">Valid Passport Scan</option>
                          <option value="Academic Reference Letter (Letter 2)">Academic Reference Letter (Letter 2)</option>
                          <option value="Statement of Purpose Revision">Statement of Purpose Revision</option>
                          <option value="Work Experience Letter / Resume">Work Experience Letter / Resume</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                          Reason / Specific Institutional Requirement *
                        </label>
                        <textarea
                          rows={3}
                          value={reqReason}
                          onChange={(e) => setReqReason(e.target.value)}
                          placeholder="e.g. Current bank balance does not meet 9-month maintenance funds. Please upload an updated official bank statement showing minimum £12,500 held for 28 consecutive days."
                          className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Submission Deadline *
                          </label>
                          <input
                            type="date"
                            value={reqDeadline}
                            onChange={(e) => setReqDeadline(e.target.value)}
                            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReq}
                        className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingReq ? "Sending Request..." : "Issue Official Document Request"}</span>
                      </button>
                    </form>
                  </div>

                  {/* Active Document Requests Checklist */}
                  {selectedApp.requestedDocuments && selectedApp.requestedDocuments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-[var(--text-primary)]">Pending Document Requests</h4>
                      <div className="space-y-2">
                        {selectedApp.requestedDocuments.map((req) => (
                          <div key={req.id} className="p-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-[var(--text-primary)]">{req.docType}</p>
                              <p className="text-[11px] text-[var(--text-secondary)]">{req.reason}</p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Deadline: {req.deadline}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold">
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: OFFICIAL DECISION & OFFER LETTER (Section 3.16.6 & 3.16.7) */}
              {activeModalTab === "decision" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-4">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      Record Admissions Decision & Issue Offer Letter (Section 3.16.6 & 3.16.7)
                    </h3>

                    <form onSubmit={handleSubmitDecision} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Admissions Decision *
                          </label>
                          <select
                            value={decisionStage}
                            onChange={(e) => setDecisionStage(e.target.value as ApplicationStage)}
                            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-bold text-[var(--text-primary)]"
                          >
                            <option value="Conditional Offer">Conditional Offer</option>
                            <option value="Unconditional Offer">Unconditional Offer</option>
                            <option value="University Reviewing">Under Review / Additional Evaluation</option>
                            <option value="Rejected">Reject Application</option>
                            <option value="Enrolled">Confirm Final Enrolment</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Tuition Deposit Required (£ / $)
                          </label>
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(Number(e.target.value))}
                            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                          />
                        </div>
                      </div>

                      {decisionStage === "Conditional Offer" && (
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Academic & English Conditions *
                          </label>
                          <textarea
                            rows={2}
                            value={offerConditions}
                            onChange={(e) => setOfferConditions(e.target.value)}
                            placeholder="e.g. 1. Achieve minimum 65% aggregate in final Bachelor semester. 2. Submit official English IELTS test with minimum 6.5 overall (no band below 6.0)."
                            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Offer Acceptance Deadline
                          </label>
                          <input
                            type="date"
                            value={offerDeadline}
                            onChange={(e) => setOfferDeadline(e.target.value)}
                            className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Attach Signed Offer Letter (PDF)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setAttachedFileName(e.target.files[0].name);
                                }
                              }}
                              className="w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                            />
                          </div>
                          {attachedFileName && (
                            <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                              Attached: {attachedFileName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                          Admissions Committee Remarks
                        </label>
                        <input
                          value={decisionNotes}
                          onChange={(e) => setDecisionNotes(e.target.value)}
                          placeholder="e.g. Candidate demonstrates strong mathematical competence. Fast-tracked for faculty acceptance."
                          className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingDecision}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmittingDecision ? "Publishing Decision..." : "Publish Official Admissions Decision"}</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: RECORD SCHOLARSHIP DECISION (Section 3.16.8) */}
              {activeModalTab === "scholarship" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-4">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Record Scholarship / Fee Waiver Award (Section 3.16.8)
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Grant institutional scholarships, international bursaries, or tuition discounts to this candidate.
                    </p>

                    <form onSubmit={handleAwardScholarship} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                          Scholarship Scheme Title *
                        </label>
                        <select
                          value={scholarshipName}
                          onChange={(e) => setScholarshipName(e.target.value)}
                          className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                        >
                          <option value="International Academic Merit Scholarship">International Academic Merit Scholarship</option>
                          <option value="Vice-Chancellor's Global Excellence Award">Vice-Chancellor's Global Excellence Award</option>
                          <option value="Dean's STEM Leadership Bursary">Dean's STEM Leadership Bursary</option>
                          <option value="Commonwealth Partner Tuition Grant">Commonwealth Partner Tuition Grant</option>
                          <option value="Early-Bird Deposit Waiver">Early-Bird Deposit Waiver</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                          Award Amount / Waiver Percentage *
                        </label>
                        <input
                          value={scholarshipAmount}
                          onChange={(e) => setScholarshipAmount(e.target.value)}
                          placeholder="e.g. £5,000 Tuition Discount or 25% Fee Waiver"
                          className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-bold text-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                          Criteria & Justification
                        </label>
                        <textarea
                          rows={2}
                          value={scholarshipNotes}
                          onChange={(e) => setScholarshipNotes(e.target.value)}
                          placeholder="e.g. Awarded in recognition of first-class honours degree and outstanding research statement."
                          className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isAwardingScholarship}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Award className="w-4 h-4" />
                        <span>{isAwardingScholarship ? "Recording Award..." : "Record & Award Scholarship"}</span>
                      </button>
                    </form>
                  </div>

                  {selectedApp.scholarshipAwarded && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400">Awarded Scholarship</span>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{selectedApp.scholarshipAwarded.name}</h4>
                        <p className="text-xs text-[var(--text-secondary)]">{selectedApp.scholarshipAwarded.description}</p>
                      </div>
                      <span className="text-base font-bold text-amber-400 font-heading">
                        {selectedApp.scholarshipAwarded.amount}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: COLLABORATIVE COMMENTS & NOTES (Section 3.16.5) */}
              {activeModalTab === "notes" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-3">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Add Comments & Feedback (Section 3.16.5)
                    </h3>

                    <form onSubmit={handlePostComment} className="space-y-3">
                      <textarea
                        rows={3}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Type admissions note or guidance for student/counsellor..."
                        className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name="comment_vis"
                              checked={!isCommentInternal}
                              onChange={() => setIsCommentInternal(false)}
                              className="text-emerald-500"
                            />
                            <span className="flex items-center gap-1 text-[var(--text-primary)]">
                              <Globe className="w-3.5 h-3.5 text-emerald-400" />
                              Applicant & Counsellor Visible
                            </span>
                          </label>

                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name="comment_vis"
                              checked={isCommentInternal}
                              onChange={() => setIsCommentInternal(true)}
                              className="text-emerald-500"
                            />
                            <span className="flex items-center gap-1 text-[var(--text-muted)]">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Internal Admissions Note
                            </span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isPostingComment || !newCommentText.trim()}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Note</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Comments Timeline */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-[var(--text-primary)]">Timeline of Application Notes</h4>
                    {(!selectedApp.partnerComments || selectedApp.partnerComments.length === 0) ? (
                      <p className="text-[var(--text-muted)] italic text-xs p-4 text-center">
                        No comments recorded yet. Add an internal note or guidance comment above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedApp.partnerComments.map((c) => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-xl border space-y-1 ${
                              c.isInternal
                                ? "bg-amber-500/5 border-amber-500/20"
                                : "bg-[var(--bg-elevated)] border-[var(--border-default)]"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                {c.authorName} ({c.authorRole})
                                {c.isInternal ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> Internal
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-0.5">
                                    <Globe className="w-2.5 h-2.5" /> Student Visible
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">Status:</span>
                <span className="font-bold text-emerald-400">{selectedApp.stage}</span>
              </div>
              <button
                onClick={() => setSelectedAppId(null)}
                className="px-4 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-xl font-semibold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-xl rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">{previewDoc.type} Preview</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-[var(--text-muted)] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-zinc-950 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
              <FileText className="w-12 h-12 text-emerald-400/60 animate-pulse" />
              <div>
                <p className="font-mono text-xs text-[var(--text-primary)]">{previewDoc.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Official PDF Document • Digital Watermark Verified</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded">
                Status: {previewDoc.status || "Verified"}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  triggerNotice(`Downloaded ${previewDoc.name}`);
                  setPreviewDoc(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Document
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROPOSE PROGRAMME MODAL (Section 3.16.11) */}
      {/* ========================================================================= */}
      {showProgrammeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Propose Programme / Intake</h3>
              </div>
              <button onClick={() => setShowProgrammeModal(false)} className="text-[var(--text-muted)] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Submit degree programme updates for {selectedUniversityName}. This proposal is queued for central administrator approval before public display.
            </p>

            <form onSubmit={handleProposeProgramme} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Programme Title *</label>
                <input
                  required
                  value={progTitle}
                  onChange={(e) => setProgTitle(e.target.value)}
                  placeholder="e.g. MSc in Artificial Intelligence & Robotics"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Study Level *</label>
                  <select
                    value={progLevel}
                    onChange={(e) => setProgLevel(e.target.value as any)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Doctorate">Doctorate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    value={progDurationMonths}
                    onChange={(e) => setProgDurationMonths(Number(e.target.value))}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Annual Tuition Fee *</label>
                  <input
                    type="number"
                    value={progTuitionFee}
                    onChange={(e) => setProgTuitionFee(Number(e.target.value))}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Currency</label>
                  <select
                    value={progCurrency}
                    onChange={(e) => setProgCurrency(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Intakes (Comma Separated)</label>
                <input
                  value={progIntakes}
                  onChange={(e) => setProgIntakes(e.target.value)}
                  placeholder="September, January"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Minimum IELTS Score</label>
                  <input
                    type="number"
                    step="0.5"
                    value={progMinIelts}
                    onChange={(e) => setProgMinIelts(Number(e.target.value))}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    value={progCapacity}
                    onChange={(e) => setProgCapacity(Number(e.target.value))}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Academic Entry Requirements</label>
                <input
                  value={progEntryReqs}
                  onChange={(e) => setProgEntryReqs(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProgrammeModal(false)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProg}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Admin Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
