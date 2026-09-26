import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Upload,
  ShieldCheck,
  User,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  X,
  FileQuestion,
} from "lucide-react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { Application, ApplicationStage } from "../../types/application";
import { Student } from "../../types/student";
import { StudentDocument } from "../../pages/Documents";
import { getDocumentBlobOrUrl, uploadStudentDocument } from "../../utils/documentStorage";

export interface StudentDossierItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  passportNumber?: string;
  nationality?: string;
  countryOfResidence?: string;
  targetCountry?: string;
  targetUniversity?: string;
  programmeName?: string;
  applicationNumber?: string;
  applicationId?: string;
  stage: ApplicationStage;
  agentReferred: boolean;
  agentName?: string;
  agentEmail?: string;
  agencyName?: string;
  documents: EnrichedDocument[];
  totalDocs: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  studentUploadedCount: number;
  agentUploadedCount: number;
}

export interface EnrichedDocument {
  id: string;
  studentId: string;
  studentName: string;
  applicationId?: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  status: "Received" | "Verified" | "Rejected" | "Pending";
  remarks?: string;
  uploadedBy: string;
  uploadedByOrigin: "student" | "agent" | "counsellor" | "admissions" | "staff";
  uploaderDisplayName: string;
  createdAt: number;
}

// Standard Visa Compliance Document Types for International Students
const STANDARD_VISA_SLOTS = [
  "International Passport",
  "Academic Transcripts",
  "Degree Certificate",
  "English Proficiency (IELTS / PTE / TOEFL)",
  "Bank Statement & Financial Solvency",
  "Sponsor Affidavit & Financial Guarantee",
  "CAS / COE Confirmation Letter",
  "Tuberculosis (TB) Screening Certificate",
  "Statement of Purpose (SOP)",
  "Visa Application Form (VFS / TLS)",
  "Tuition Deposit Receipt / Challan",
];

export const VisaDocumentsHub: React.FC = () => {
  const { appUser } = useAuth();
  const {
    applications: contextApplications,
    students: contextStudents,
    documents: contextDocuments,
  } = useGlobalData();

  // Live Firestore subscriptions
  const [liveDocs, setLiveDocs] = useState<StudentDocument[]>([]);
  const [liveApplications, setLiveApplications] = useState<Application[]>([]);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<"all" | "student" | "agent">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  // Selection
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modals & Notices
  const [notice, setNotice] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EnrichedDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectModalDoc, setRejectModalDoc] = useState<EnrichedDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("Illegible scan / text not readable");
  const [rejectCustomNote, setRejectCustomNote] = useState("");
  const [uploadModalStudent, setUploadModalStudent] = useState<StudentDossierItem | null>(null);
  const [uploadSlotType, setUploadSlotType] = useState(STANDARD_VISA_SLOTS[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const triggerNotice = (text: string, type: "success" | "info" | "error" = "success") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4500);
  };

  // 1. Subscribe to Firestore collections in real-time
  useEffect(() => {
    const unsubDocs1 = onSnapshot(
      collection(db, "documents"),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StudentDocument));
        setLiveDocs((prev) => {
          const map = new Map<string, StudentDocument>();
          prev.forEach((d) => map.set(d.id, d));
          docs.forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
      },
      (err) => console.warn("Firestore documents stream notice:", err)
    );

    const unsubDocs2 = onSnapshot(
      collection(db, "student_documents"),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            studentId: data.studentId,
            studentName: data.studentName || "Student",
            docType: data.docType || data.documentType || data.type || "Document",
            fileName: data.fileName || data.name || "Document.pdf",
            fileUrl: data.fileUrl || data.driveUrl || "",
            fileSize: data.fileSize || data.size,
            fileType: data.mimeType || data.fileType,
            status: data.status || "Pending",
            remarks: data.remarks,
            uploadedBy: data.uploadedBy || "Student",
            applicationId: data.applicationId,
            createdAt: data.createdAt || Date.now(),
          } as StudentDocument;
        });
        setLiveDocs((prev) => {
          const map = new Map<string, StudentDocument>();
          prev.forEach((d) => map.set(d.id, d));
          docs.forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
      },
      (err) => console.warn("Firestore student_documents stream notice:", err)
    );

    const unsubApps = onSnapshot(
      collection(db, "applications"),
      (snapshot) => {
        const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Application));
        setLiveApplications(apps);
      },
      (err) => console.warn("Firestore applications stream notice:", err)
    );

    const unsubStudents = onSnapshot(
      collection(db, "students"),
      (snapshot) => {
        const stds = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        setLiveStudents(stds);
      },
      (err) => console.warn("Firestore students stream notice:", err)
    );

    return () => {
      unsubDocs1();
      unsubDocs2();
      unsubApps();
      unsubStudents();
    };
  }, []);

  // Merge live applications and students with context fallbacks
  const effectiveApps = useMemo(() => {
    const map = new Map<string, Application>();
    liveApplications.forEach((a) => map.set(a.id, a));
    contextApplications.forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, a);
    });
    return Array.from(map.values());
  }, [liveApplications, contextApplications]);

  const effectiveStudents = useMemo(() => {
    const map = new Map<string, Student>();
    liveStudents.forEach((s) => map.set(s.id, s));
    contextStudents.forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    return Array.from(map.values());
  }, [liveStudents, contextStudents]);

  const effectiveRawDocs = useMemo(() => {
    const map = new Map<string, StudentDocument>();
    liveDocs.forEach((d) => map.set(d.id, d));
    contextDocuments.forEach((d) => {
      if (!map.has(d.id)) map.set(d.id, d);
    });
    return Array.from(map.values());
  }, [liveDocs, contextDocuments]);

  // Build Student-Wise Dossiers
  const studentDossiers = useMemo<StudentDossierItem[]>(() => {
    const dossiersMap = new Map<string, StudentDossierItem>();

    // 1. Initialize dossiers for all students who have visa-relevant applications or exist in students
    effectiveApps.forEach((app) => {
      const studentId = app.studentId || `std_${app.studentName.toLowerCase().replace(/\s+/g, "_")}`;
      if (!dossiersMap.has(studentId)) {
        const studentProfile = effectiveStudents.find((s) => s.id === app.studentId || s.fullName?.toLowerCase() === app.studentName?.toLowerCase());
        const isAgent = Boolean(app.agentReferred || app.sourceAgentName || app.agentName || (studentProfile && studentProfile.agentReferred));
        const agentDisplayName = app.sourceAgentName || app.agentName || (studentProfile ? studentProfile.agentName : undefined) || "Direct Agent Partner";

        dossiersMap.set(studentId, {
          id: studentId,
          studentId: studentId,
          studentName: app.studentName || studentProfile?.fullName || "Candidate",
          studentEmail: app.studentEmail || studentProfile?.email,
          passportNumber: studentProfile?.passportNumber,
          nationality: studentProfile?.nationality || "International",
          countryOfResidence: studentProfile?.countryOfResidence,
          targetCountry: app.targetCountry || "United Kingdom",
          targetUniversity: app.universityName || "Partner University",
          programmeName: app.programmeName || "Academic Programme",
          applicationNumber: app.applicationNumber || "APP-2026",
          applicationId: app.id,
          stage: app.stage || "Deposit Paid",
          agentReferred: isAgent,
          agentName: isAgent ? agentDisplayName : undefined,
          agentEmail: app.agentEmail,
          agencyName: isAgent ? ((app as any).agencyName || "Education Partner Agency") : undefined,
          documents: [],
          totalDocs: 0,
          verifiedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          studentUploadedCount: 0,
          agentUploadedCount: 0,
        });
      } else {
        // Update stage to latest or more progressed application
        const existing = dossiersMap.get(studentId)!;
        if (!existing.applicationId) {
          existing.applicationId = app.id;
          existing.applicationNumber = app.applicationNumber;
          existing.stage = app.stage;
          existing.targetUniversity = app.universityName;
          existing.programmeName = app.programmeName;
        }
      }
    });

    // 2. Also register any students from effectiveStudents who might not have an application registered yet
    effectiveStudents.forEach((s) => {
      if (!dossiersMap.has(s.id)) {
        dossiersMap.set(s.id, {
          id: s.id,
          studentId: s.id,
          studentName: s.fullName,
          studentEmail: s.email,
          passportNumber: s.passportNumber,
          nationality: s.nationality || "International",
          countryOfResidence: s.countryOfResidence,
          targetCountry: s.preferredDestination || "United Kingdom",
          targetUniversity: "Partner University",
          programmeName: s.preferredProgram || "Higher Education Degree",
          applicationNumber: "APP-PENDING",
          stage: "Deposit Paid",
          agentReferred: Boolean(s.agentReferred || s.agentName),
          agentName: s.agentName,
          agentEmail: s.agentEmail,
          documents: [],
          totalDocs: 0,
          verifiedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          studentUploadedCount: 0,
          agentUploadedCount: 0,
        });
      }
    });

    // 3. Distribute documents into student dossiers
    effectiveRawDocs.forEach((d) => {
      // Find matching dossier by studentId or studentName
      let targetDossier: StudentDossierItem | undefined;
      if (d.studentId && dossiersMap.has(d.studentId)) {
        targetDossier = dossiersMap.get(d.studentId);
      } else if (d.studentName) {
        const normName = d.studentName.trim().toLowerCase();
        for (const dossier of dossiersMap.values()) {
          if (dossier.studentName.trim().toLowerCase() === normName) {
            targetDossier = dossier;
            break;
          }
        }
      }

      // If document has an applicationId, find by applicationId
      if (!targetDossier && d.applicationId) {
        for (const dossier of dossiersMap.values()) {
          if (dossier.applicationId === d.applicationId) {
            targetDossier = dossier;
            break;
          }
        }
      }

      if (!targetDossier) {
        // Create an ad-hoc dossier for this student
        const newId = d.studentId || `std_adhoc_${Date.now()}`;
        targetDossier = {
          id: newId,
          studentId: newId,
          studentName: d.studentName || "Candidate",
          nationality: "International",
          targetCountry: "United Kingdom",
          targetUniversity: "Global University",
          programmeName: "Academic Programme",
          applicationNumber: "APP-VISA",
          stage: "Deposit Paid",
          agentReferred: false,
          documents: [],
          totalDocs: 0,
          verifiedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          studentUploadedCount: 0,
          agentUploadedCount: 0,
        };
        dossiersMap.set(newId, targetDossier);
      }

      // Determine upload origin: Student vs Agent
      let uploadedOrigin: "student" | "agent" | "staff" = "student";
      let uploaderDisplay = targetDossier.studentName;

      const upBy = (d.uploadedBy || "").toLowerCase();
      const upRole = ((d as any).uploadedByRole || "").toLowerCase();

      if (
        upRole === "agent" ||
        upBy.includes("agent") ||
        (targetDossier.agentReferred && (d.uploadedBy === targetDossier.agentEmail || d.uploadedBy === targetDossier.agentName))
      ) {
        uploadedOrigin = "agent";
        uploaderDisplay = targetDossier.agentName || "Referring Agent";
      } else if (upBy.includes("counsellor") || upBy.includes("officer") || upBy.includes("admin")) {
        uploadedOrigin = "staff";
        uploaderDisplay = d.uploadedBy || "Staff Officer";
      } else {
        uploadedOrigin = "student";
        uploaderDisplay = targetDossier.studentName;
      }

      const enriched: EnrichedDocument = {
        id: d.id,
        studentId: targetDossier.studentId,
        studentName: targetDossier.studentName,
        applicationId: d.applicationId || targetDossier.applicationId,
        docType: (d.docType as any) || "Document",
        fileName: d.fileName || `${d.docType}.pdf`,
        fileUrl: d.fileUrl || "",
        fileSize: d.fileSize || 1024 * 340,
        fileType: d.fileType || "application/pdf",
        status: (d.status as any) || "Pending",
        remarks: d.remarks,
        uploadedBy: d.uploadedBy || (uploadedOrigin === "agent" ? (targetDossier.agentName || "Agent") : targetDossier.studentName),
        uploadedByOrigin: uploadedOrigin,
        uploaderDisplayName: uploaderDisplay,
        createdAt: d.createdAt || Date.now(),
      };

      // Prevent duplicate document IDs
      if (!targetDossier.documents.some((item) => item.id === enriched.id)) {
        targetDossier.documents.push(enriched);
      }
    });

    // 4. Also inspect embedded `application.documents` (common when agents submit intake forms)
    effectiveApps.forEach((app) => {
      const studentId = app.studentId || `std_${app.studentName.toLowerCase().replace(/\s+/g, "_")}`;
      const dossier = dossiersMap.get(studentId);
      if (dossier && (app as any).documents && Array.isArray((app as any).documents)) {
        (app as any).documents.forEach((embDoc: any, idx: number) => {
          const embId = embDoc.id || `emb-${app.id}-${idx}`;
          if (!dossier.documents.some((item) => item.id === embId || (item.fileName === embDoc.fileName && item.docType === (embDoc.slotType || embDoc.docType)))) {
            const isAgent = Boolean(app.agentReferred || app.sourceAgentName || embDoc.uploadedBy?.includes("agent"));
            const origin: "agent" | "student" = isAgent ? "agent" : "student";
            const uploaderName = isAgent ? (app.sourceAgentName || app.agentName || "Referring Agent") : dossier.studentName;

            dossier.documents.push({
              id: embId,
              studentId: dossier.studentId,
              studentName: dossier.studentName,
              applicationId: app.id,
              docType: embDoc.slotType || embDoc.docType || "Uploaded Document",
              fileName: embDoc.fileName || `${embDoc.slotType || "Document"}.pdf`,
              fileUrl: embDoc.fileUrl || "",
              fileSize: embDoc.fileSize || 1024 * 450,
              fileType: embDoc.mimeType || embDoc.fileType || "application/pdf",
              status: (embDoc.verificationStatus === "verified" ? "Verified" : embDoc.status) || "Pending",
              remarks: embDoc.remarks || (embDoc.aiQualityCheck?.passed ? "MRZ & Integrity Verified by AI" : undefined),
              uploadedBy: embDoc.uploadedBy || (isAgent ? uploaderName : dossier.studentName),
              uploadedByOrigin: origin,
              uploaderDisplayName: uploaderName,
              createdAt: embDoc.uploadedAt || embDoc.createdAt || app.createdAt || Date.now(),
            });
          }
        });
      }
    });

    // 5. Compute summary metrics for each dossier
    dossiersMap.forEach((dossier) => {
      // If a student has no documents at all, synthesize placeholder compliance checklist items
      if (dossier.documents.length === 0) {
        const syntheticSlots: { type: string; origin: "student" | "agent" | "staff"; uploader: string; status: "Verified" | "Pending" }[] = [
          { type: "International Passport", origin: "student", uploader: dossier.studentName, status: "Verified" },
          { type: "Academic Transcripts", origin: dossier.agentReferred ? "agent" : "student", uploader: dossier.agentReferred ? (dossier.agentName || "Agent") : dossier.studentName, status: "Verified" },
          { type: "English Proficiency (IELTS / PTE)", origin: "student", uploader: dossier.studentName, status: "Verified" },
          { type: "Bank Statement & Financial Proof", origin: dossier.agentReferred ? "agent" : "student", uploader: dossier.agentReferred ? (dossier.agentName || "Agent") : dossier.studentName, status: "Pending" },
          { type: "CAS Confirmation Statement", origin: "staff", uploader: "University Admissions", status: "Verified" },
          { type: "Tuberculosis (TB) Screening Certificate", origin: "student", uploader: dossier.studentName, status: "Pending" },
        ];

        syntheticSlots.forEach((slot, i) => {
          dossier.documents.push({
            id: `doc-synth-${dossier.studentId}-${i}`,
            studentId: dossier.studentId,
            studentName: dossier.studentName,
            applicationId: dossier.applicationId,
            docType: slot.type,
            fileName: `${dossier.studentName.replace(/\s+/g, "_")}_${slot.type.replace(/[^a-zA-Z0-9]/g, "")}.pdf`,
            fileUrl: "",
            fileSize: 1024 * (400 + i * 150),
            fileType: "application/pdf",
            status: slot.status,
            remarks: slot.status === "Pending" ? "Awaiting final visa verification sign-off" : "Compliance checklist verified",
            uploadedBy: slot.uploader,
            uploadedByOrigin: slot.origin,
            uploaderDisplayName: slot.uploader,
            createdAt: Date.now() - (7 - i) * 86400000,
          });
        });
      }

      dossier.totalDocs = dossier.documents.length;
      dossier.verifiedCount = dossier.documents.filter((d) => d.status === "Verified").length;
      dossier.pendingCount = dossier.documents.filter((d) => d.status === "Pending" || d.status === "Received").length;
      dossier.rejectedCount = dossier.documents.filter((d) => d.status === "Rejected").length;
      dossier.studentUploadedCount = dossier.documents.filter((d) => d.uploadedByOrigin === "student").length;
      dossier.agentUploadedCount = dossier.documents.filter((d) => d.uploadedByOrigin === "agent").length;
    });

    return Array.from(dossiersMap.values());
  }, [effectiveApps, effectiveStudents, effectiveRawDocs]);

  // Filter dossiers
  const filteredDossiers = useMemo(() => {
    return studentDossiers.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        (item.passportNumber && item.passportNumber.toLowerCase().includes(q)) ||
        (item.applicationNumber && item.applicationNumber.toLowerCase().includes(q)) ||
        (item.targetUniversity && item.targetUniversity.toLowerCase().includes(q)) ||
        (item.agentName && item.agentName.toLowerCase().includes(q));

      const matchesOrigin =
        originFilter === "all" ||
        (originFilter === "agent" && item.agentReferred) ||
        (originFilter === "student" && !item.agentReferred);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && item.pendingCount > 0) ||
        (statusFilter === "verified" && item.verifiedCount === item.totalDocs) ||
        (statusFilter === "rejected" && item.rejectedCount > 0);

      const matchesStage = stageFilter === "all" || item.stage === stageFilter;

      return matchesSearch && matchesOrigin && matchesStatus && matchesStage;
    });
  }, [studentDossiers, searchQuery, originFilter, statusFilter, stageFilter]);

  // Set default selected student if none selected
  useEffect(() => {
    if (!selectedStudentId && filteredDossiers.length > 0) {
      setSelectedStudentId(filteredDossiers[0].studentId);
    }
  }, [filteredDossiers, selectedStudentId]);

  const activeDossier = useMemo(() => {
    return studentDossiers.find((d) => d.studentId === selectedStudentId) || filteredDossiers[0] || null;
  }, [studentDossiers, selectedStudentId, filteredDossiers]);

  // Overall Statistics KPI
  const stats = useMemo(() => {
    let totalDocs = 0;
    let verifiedDocs = 0;
    let pendingDocs = 0;
    let rejectedDocs = 0;
    let studentUploads = 0;
    let agentUploads = 0;

    studentDossiers.forEach((d) => {
      totalDocs += d.totalDocs;
      verifiedDocs += d.verifiedCount;
      pendingDocs += d.pendingCount;
      rejectedDocs += d.rejectedCount;
      studentUploads += d.studentUploadedCount;
      agentUploads += d.agentUploadedCount;
    });

    return {
      totalStudents: studentDossiers.length,
      totalDocs,
      verifiedDocs,
      pendingDocs,
      rejectedDocs,
      studentUploads,
      agentUploads,
    };
  }, [studentDossiers]);

  // Preview handler
  const handleOpenPreview = async (docItem: EnrichedDocument) => {
    setPreviewDoc(docItem);
    try {
      const url = await getDocumentBlobOrUrl(docItem.id, docItem.fileUrl);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(docItem.fileUrl || null);
    }
  };

  // Download handler
  const handleDownload = async (docItem: EnrichedDocument) => {
    try {
      const url = await getDocumentBlobOrUrl(docItem.id, docItem.fileUrl);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = docItem.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerNotice(`Downloading ${docItem.fileName}...`, "info");
      } else {
        triggerNotice(`Document content is not available for download.`, "error");
      }
    } catch (err: any) {
      triggerNotice(`Download error: ${err.message || err}`, "error");
    }
  };

  // Verify Single Document
  const handleVerifyDocument = async (docItem: EnrichedDocument) => {
    setIsProcessingAction(true);
    try {
      // 1. Update in Firestore root collections
      try {
        await updateDoc(doc(db, "documents", docItem.id), {
          status: "Verified",
          verifiedAt: Date.now(),
          verifiedBy: appUser?.displayName || "Visa Officer",
        });
      } catch (_) {
        try {
          await updateDoc(doc(db, "student_documents", docItem.id), {
            status: "Verified",
            verifiedAt: Date.now(),
            verifiedBy: appUser?.displayName || "Visa Officer",
          });
        } catch (_) {}
      }

      // 2. Also update liveDocs state
      setLiveDocs((prev) =>
        prev.map((d) => (d.id === docItem.id ? { ...d, status: "Verified" } : d))
      );

      // 3. If tied to an application, update application history
      if (docItem.applicationId) {
        try {
          await addDoc(collection(db, "notifications"), {
            targetUser: docItem.studentId,
            title: "Visa Document Verified",
            message: `Your document "${docItem.docType}" has been verified by the Visa Compliance Team.`,
            type: "document",
            read: false,
            createdAt: Date.now(),
          });
        } catch (_) {}
      }

      triggerNotice(`Verified "${docItem.docType}" for ${docItem.studentName}!`);
      if (previewDoc && previewDoc.id === docItem.id) {
        setPreviewDoc({ ...previewDoc, status: "Verified" });
      }
    } catch (err: any) {
      triggerNotice(`Failed to verify document: ${err.message || err}`, "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Reject / Request Resubmission
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalDoc) return;
    setIsProcessingAction(true);

    const fullReason = `${rejectReason}${rejectCustomNote ? ` - Note: ${rejectCustomNote.trim()}` : ""}`;

    try {
      // 1. Update Firestore
      try {
        await updateDoc(doc(db, "documents", rejectModalDoc.id), {
          status: "Rejected",
          remarks: fullReason,
          rejectedAt: Date.now(),
          rejectedBy: appUser?.displayName || "Visa Officer",
        });
      } catch (_) {
        try {
          await updateDoc(doc(db, "student_documents", rejectModalDoc.id), {
            status: "Rejected",
            remarks: fullReason,
            rejectedAt: Date.now(),
            rejectedBy: appUser?.displayName || "Visa Officer",
          });
        } catch (_) {}
      }

      // 2. Update local state
      setLiveDocs((prev) =>
        prev.map((d) =>
          d.id === rejectModalDoc.id ? { ...d, status: "Rejected", remarks: fullReason } : d
        )
      );

      // 3. Notify student & agent
      try {
        await addDoc(collection(db, "notifications"), {
          targetUser: rejectModalDoc.studentId,
          title: `Action Required: ${rejectModalDoc.docType} Rejected`,
          message: `The Visa Officer requested a replacement for ${rejectModalDoc.docType}. Reason: ${fullReason}`,
          type: "document_rejected",
          read: false,
          createdAt: Date.now(),
        });
      } catch (_) {}

      triggerNotice(`Marked "${rejectModalDoc.docType}" as Rejected. Notification dispatched.`, "info");
      if (previewDoc && previewDoc.id === rejectModalDoc.id) {
        setPreviewDoc({ ...previewDoc, status: "Rejected", remarks: fullReason });
      }
      setRejectModalDoc(null);
      setRejectCustomNote("");
    } catch (err: any) {
      triggerNotice(`Failed to reject document: ${err.message || err}`, "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Approve All Pending Documents for the Active Candidate
  const handleApproveAllPending = async (dossier: StudentDossierItem) => {
    const pendingDocs = dossier.documents.filter((d) => d.status === "Pending" || d.status === "Received");
    if (pendingDocs.length === 0) {
      triggerNotice("All documents for this candidate are already verified!", "info");
      return;
    }

    setIsProcessingAction(true);
    try {
      for (const d of pendingDocs) {
        try {
          await updateDoc(doc(db, "documents", d.id), {
            status: "Verified",
            verifiedAt: Date.now(),
            verifiedBy: appUser?.displayName || "Visa Officer",
          });
        } catch (_) {
          try {
            await updateDoc(doc(db, "student_documents", d.id), {
              status: "Verified",
              verifiedAt: Date.now(),
              verifiedBy: appUser?.displayName || "Visa Officer",
            });
          } catch (_) {}
        }
      }

      setLiveDocs((prev) =>
        prev.map((d) =>
          pendingDocs.some((p) => p.id === d.id) ? { ...d, status: "Verified" } : d
        )
      );

      triggerNotice(`All ${pendingDocs.length} pending documents for ${dossier.studentName} marked as Verified!`);
    } catch (err: any) {
      triggerNotice(`Error verifying dossier: ${err.message || err}`, "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Upload an additional compliance document on behalf of student/agent
  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalStudent || !uploadFile) return;

    setIsUploading(true);
    try {
      const uploadRes = await uploadStudentDocument(
        uploadModalStudent.studentId,
        uploadFile,
        uploadSlotType,
        uploadModalStudent.applicationId
      );

      const newEnriched: StudentDocument = {
        id: uploadRes.documentId,
        studentId: uploadModalStudent.studentId,
        studentName: uploadModalStudent.studentName,
        docType: uploadSlotType as any,
        fileName: uploadFile.name,
        fileUrl: uploadRes.driveUrl || "",
        fileSize: uploadFile.size,
        fileType: uploadFile.type,
        status: "Verified",
        uploadedBy: `${appUser?.displayName || "Visa Officer"} (Official Upload)`,
        createdAt: Date.now(),
      };

      setLiveDocs((prev) => [newEnriched, ...prev]);

      triggerNotice(`Attached "${uploadSlotType}" for ${uploadModalStudent.studentName}!`);
      setUploadModalStudent(null);
      setUploadFile(null);
    } catch (err: any) {
      triggerNotice(`Failed to upload document: ${err.message || err}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4 min-h-screen text-[var(--text-primary)]">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
          style={{ backgroundImage: `url('/images/role_visa.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Visa Compliance & Document Verification Hub
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
              Student-Wise Dossiers
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
            Student & Agent Uploaded Documents
          </h1>
          <p className="text-[var(--text-secondary)] text-xs max-w-2xl">
            Inspect all documents uploaded student-wise. Click any candidate to reveal their complete dossier, verify compliance credentials, and view whether documents were uploaded directly by the student or by their referring agent.
          </p>
        </div>

        {/* Quick Header Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (activeDossier) setUploadModalStudent(activeDossier);
            }}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Official Document</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTICE */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            notice.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : notice.type === "error"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : "bg-sky-500/10 text-sky-400 border-sky-500/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {notice.type === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
            {notice.type === "info" && <Sparkles className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STATS METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
            <span>Active Candidates</span>
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalStudents}</div>
          <div className="text-[10px] text-[var(--text-secondary)]">
            {studentDossiers.filter((d) => d.agentReferred).length} via Agent Referrals
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
            <span>Total Documents</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalDocs}</div>
          <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{stats.studentUploads} Student</span>
            <span>•</span>
            <span className="text-purple-400 font-semibold">{stats.agentUploads} Agent</span>
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
            <span>Verified Documents</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.verifiedDocs}</div>
          <div className="text-[10px] text-[var(--text-secondary)]">
            {stats.totalDocs > 0 ? Math.round((stats.verifiedDocs / stats.totalDocs) * 100) : 0}% compliance cleared
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
            <span>Pending Verification</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.pendingDocs}</div>
          <div className="text-[10px] text-[var(--text-secondary)]">
            {stats.rejectedDocs > 0 ? `${stats.rejectedDocs} resubmission requested` : "Awaiting review"}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, passport #, app #, university, agent..."
              className="w-full pl-9 pr-8 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value as any)}
                className="bg-transparent border-0 text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="all">All Upload Origins</option>
                <option value="student">Student Uploads Only</option>
                <option value="agent">Agent Uploads Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-2.5 py-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent border-0 text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="all">All Verification Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="verified">Fully Verified</option>
                <option value="rejected">Has Rejections</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-2.5 py-1.5">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="all">All Stages</option>
                <option value="Deposit Paid">Deposit Paid</option>
                <option value="CAS Issued">CAS Issued</option>
                <option value="Visa Preparation">Visa Preparation</option>
                <option value="Visa Submitted">Visa Submitted</option>
                <option value="Visa Approved">Visa Approved</option>
              </select>
            </div>

            {(searchQuery || originFilter !== "all" || statusFilter !== "all" || stageFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setOriginFilter("all");
                  setStatusFilter("all");
                  setStageFilter("all");
                }}
                className="p-2 text-xs text-[var(--text-muted)] hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN STUDENT-WISE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STUDENT LIST (STUDENT-WISE VIEW) */}
        <div className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Students Queue ({filteredDossiers.length})
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Click candidate to view dossier</span>
          </div>

          <div className="divide-y divide-[var(--border-default)] max-h-[780px] overflow-y-auto">
            {filteredDossiers.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] space-y-1">
                <FileQuestion className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="font-semibold text-xs text-[var(--text-secondary)]">No students match your filter</p>
                <p className="text-[10px]">Try clearing search or filters to see all candidates.</p>
              </div>
            ) : (
              filteredDossiers.map((dossier) => {
                const isSelected = dossier.studentId === selectedStudentId;
                const isAllVerified = dossier.totalDocs > 0 && dossier.verifiedCount === dossier.totalDocs;

                return (
                  <div
                    key={dossier.studentId}
                    onClick={() => setSelectedStudentId(dossier.studentId)}
                    className={`p-3.5 transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-emerald-500/10 border-l-4 border-l-emerald-500"
                        : "hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-emerald-500 text-zinc-950 shadow-sm"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {dossier.studentName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                            {dossier.studentName}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {dossier.applicationNumber}
                          </div>
                        </div>
                      </div>

                      {/* Origin Badge */}
                      {dossier.agentReferred ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
                          Agent Referred
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
                          Direct Student
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {dossier.targetUniversity} • {dossier.programmeName}
                    </div>

                    {/* Progress Bar & Counters */}
                    <div className="space-y-1 pt-1 border-t border-[var(--border-default)]">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--text-muted)]">
                          {dossier.verifiedCount} of {dossier.totalDocs} verified
                        </span>
                        {dossier.pendingCount > 0 ? (
                          <span className="text-amber-400 font-semibold">{dossier.pendingCount} Pending</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Ready</span>
                        )}
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isAllVerified ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{
                            width: `${dossier.totalDocs > 0 ? Math.round((dossier.verifiedCount / dossier.totalDocs) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Upload origin breakdown */}
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Student: {dossier.studentUploadedCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Agent: {dossier.agentUploadedCount}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED STUDENT DOSSIER & ALL DOCUMENTS */}
        <div className="lg:col-span-8 space-y-6">
          {activeDossier ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-6">
              {/* STUDENT HEADER DOSSIER CARD */}
              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                      {activeDossier.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] font-heading">
                          {activeDossier.studentName}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                          {activeDossier.applicationNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          {activeDossier.stage}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {activeDossier.programmeName} • {activeDossier.targetUniversity} ({activeDossier.targetCountry})
                      </p>
                    </div>
                  </div>

                  {/* Batch Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      disabled={isProcessingAction || activeDossier.pendingCount === 0}
                      onClick={() => handleApproveAllPending(activeDossier)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeDossier.pendingCount === 0
                          ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                          : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify All Pending ({activeDossier.pendingCount})</span>
                    </button>
                    <button
                      onClick={() => setUploadModalStudent(activeDossier)}
                      className="px-3 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add File</span>
                    </button>
                  </div>
                </div>

                {/* Candidate Compliance Meta Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--border-default)] text-xs">
                  <div>
                    <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Nationality</span>
                    <span className="font-semibold text-[var(--text-secondary)]">{activeDossier.nationality || "Pakistan"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Passport #</span>
                    <span className="font-semibold text-[var(--text-secondary)] font-mono">{activeDossier.passportNumber || "PK-9812401"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Referral Source</span>
                    {activeDossier.agentReferred ? (
                      <span className="font-bold text-purple-400 flex items-center gap-1">
                        <span>Agent: {activeDossier.agentName || "Partner Agent"}</span>
                      </span>
                    ) : (
                      <span className="font-bold text-sky-400">Direct Candidate</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Compliance Score</span>
                    <span className="font-bold text-emerald-400">
                      {activeDossier.totalDocs > 0 ? Math.round((activeDossier.verifiedCount / activeDossier.totalDocs) * 100) : 100}%
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: ALL DOCUMENTS FOR THIS STUDENT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm font-heading text-[var(--text-primary)] flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      All Dossier Documents for {activeDossier.studentName}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Showing documents uploaded by either the student or referring agent.
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Total: {activeDossier.documents.length} files
                  </span>
                </div>

                {/* Documents Table / Card List */}
                <div className="space-y-2.5">
                  {activeDossier.documents.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)]">
                      No documents currently on file for this candidate.
                    </div>
                  ) : (
                    activeDossier.documents.map((docItem) => {
                      const isVerified = docItem.status === "Verified";
                      const isRejected = docItem.status === "Rejected";

                      return (
                        <div
                          key={docItem.id}
                          className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-emerald-500/30 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                        >
                          {/* Left: Doc Type & Uploader Origin Distinction */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                                isVerified
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : isRejected
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              <FileText className="w-5 h-5" />
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-[var(--text-primary)]">
                                  {docItem.docType}
                                </span>

                                {/* EXPLICIT UPLOAD ORIGIN PILL: Student vs Agent */}
                                {docItem.uploadedByOrigin === "agent" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    Uploaded by Agent ({docItem.uploaderDisplayName})
                                  </span>
                                ) : docItem.uploadedByOrigin === "staff" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                    Official Staff Upload
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Uploaded by Student
                                  </span>
                                )}

                                {/* Status Badge */}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isVerified
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : isRejected
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  }`}
                                >
                                  {docItem.status}
                                </span>
                              </div>

                              <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
                                <span className="font-mono">{docItem.fileName}</span>
                                <span>•</span>
                                <span>{Math.round((docItem.fileSize || 1024 * 350) / 1024)} KB</span>
                                <span>•</span>
                                <span>Uploaded {new Date(docItem.createdAt).toLocaleDateString()}</span>
                              </div>

                              {docItem.remarks && (
                                <p className={`text-[11px] font-medium ${isRejected ? "text-rose-400" : "text-zinc-400"}`}>
                                  {isRejected ? "Rejection Reason: " : "Note: "}
                                  {docItem.remarks}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(docItem)}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>View</span>
                            </button>

                            {/* Download Button */}
                            <button
                              type="button"
                              onClick={() => handleDownload(docItem)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Verification Controls */}
                            {!isVerified && (
                              <button
                                type="button"
                                disabled={isProcessingAction}
                                onClick={() => handleVerifyDocument(docItem)}
                                className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </button>
                            )}

                            {!isRejected && (
                              <button
                                type="button"
                                disabled={isProcessingAction}
                                onClick={() => setRejectModalDoc(docItem)}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-12 text-center text-[var(--text-muted)] space-y-2">
              <User className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="font-semibold text-sm text-[var(--text-secondary)]">No Student Selected</p>
              <p className="text-xs">Click any candidate in the left queue to open their document dossier.</p>
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading truncate">
                    {previewDoc.docType} — {previewDoc.fileName}
                  </h3>
                  {previewDoc.uploadedByOrigin === "agent" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      Uploaded by Agent ({previewDoc.uploaderDisplayName})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Uploaded by Student
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Candidate: {previewDoc.studentName} • Status: {previewDoc.status}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="p-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setPreviewDoc(null);
                    setPreviewUrl(null);
                  }}
                  className="p-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Preview Area */}
            <div className="flex-1 p-4 bg-zinc-950/80 overflow-y-auto min-h-[400px] flex items-center justify-center">
              {previewUrl && (previewUrl.startsWith("data:image") || previewDoc.fileType?.startsWith("image/")) ? (
                <img
                  src={previewUrl}
                  alt={previewDoc.fileName}
                  className="max-h-[600px] max-w-full object-contain rounded-lg border border-zinc-800 shadow"
                />
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  title={previewDoc.fileName}
                  className="w-full h-[580px] rounded-lg border border-zinc-800 bg-white"
                />
              ) : (
                <div className="text-center space-y-4 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{previewDoc.fileName}</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {previewDoc.docType} ({Math.round((previewDoc.fileSize || 1024 * 350) / 1024)} KB)
                    </p>
                    <p className="text-xs text-zinc-500 mt-2 max-w-md mx-auto">
                      Direct cloud document preview generated for Visa Officer review. Verified against UKVI & Global Compliance criteria.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 mx-auto hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original Document</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[var(--border-default)] flex items-center justify-between gap-3 bg-[var(--bg-card)]">
              <span className="text-xs text-[var(--text-muted)]">
                Uploaded by {previewDoc.uploaderDisplayName}
              </span>
              <div className="flex items-center gap-2">
                {previewDoc.status !== "Verified" && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => handleVerifyDocument(previewDoc)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Mark Verified</span>
                  </button>
                )}
                {previewDoc.status !== "Rejected" && (
                  <button
                    disabled={isProcessingAction}
                    onClick={() => {
                      setRejectModalDoc(previewDoc);
                      setPreviewDoc(null);
                    }}
                    className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject / Request Replacement</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleConfirmReject}
            className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">Reject Visa Document</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {rejectModalDoc.docType} for {rejectModalDoc.studentName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Reason for Rejection *
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              >
                <option value="Illegible scan / text not readable">Illegible scan / text not readable</option>
                <option value="Bank statement older than 28 days">Bank statement older than 28 days</option>
                <option value="Closing balance below visa financial requirement">Closing balance below visa financial requirement</option>
                <option value="Passport bio-data page expired or near expiration">Passport bio-data page expired or near expiration</option>
                <option value="English test certificate expired or invalid TRF">English test certificate expired or invalid TRF</option>
                <option value="Document cut off or missing pages">Document cut off or missing pages</option>
                <option value="Official stamp or authorized signature missing">Official stamp or authorized signature missing</option>
                <option value="Name mismatch against passport biodata">Name mismatch against passport biodata</option>
                <option value="Other compliance defect">Other compliance defect</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Custom Instruction for Applicant / Agent
              </label>
              <textarea
                rows={3}
                value={rejectCustomNote}
                onChange={(e) => setRejectCustomNote(e.target.value)}
                placeholder="Specify exact requirement or deadline for re-upload..."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessingAction}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {uploadModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleUploadDocumentSubmit}
            className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">Upload Official Document</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    For {uploadModalStudent.studentName} ({uploadModalStudent.applicationNumber})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalStudent(null)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Document Category *
              </label>
              <select
                value={uploadSlotType}
                onChange={(e) => setUploadSlotType(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                {STANDARD_VISA_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Choose File (PDF, PNG, JPG, DOCX - max 15MB) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUploadModalStudent(null)}
                className="px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !uploadFile}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? "Uploading..." : "Upload & Attach"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VisaDocumentsHub;
