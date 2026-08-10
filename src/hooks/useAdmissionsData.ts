import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";
import { Application, ApplicationStage } from "../types/application";
import { StudentDocument } from "../pages/Documents";
import { AdmissionsDecision, AdmissionsMetrics, DocumentVerificationStatus } from "../types/admissions";
import { Task } from "../types/task";

import { DEMO_APPLICATIONS, DEMO_DOCUMENTS } from "../data/demoData";

export const useAdmissionsData = () => {
  const { appUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [decisions, setDecisions] = useState<AdmissionsDecision[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let loaded = 0;
    const finish = () => {
      loaded += 1;
      if (loaded >= 4) setLoading(false);
    };
    const fail = (msg: string) => {
      setError(msg);
      finish();
    };

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setApplications((prev) => (prev.length === 0 ? DEMO_APPLICATIONS : prev));
      setDocuments((prev) => (prev.length === 0 ? DEMO_DOCUMENTS : prev));
    }, 1000);

    const unsubApps = onSnapshot(
      query(collection(db, "applications"), orderBy("createdAt", "desc")),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application);
        setApplications(list.length > 0 ? list : DEMO_APPLICATIONS);
        finish();
      },
      () => {
        setApplications(DEMO_APPLICATIONS);
        fail("Failed to subscribe to applications.");
      }
    );

    const unsubDocs = onSnapshot(
      query(collection(db, "student_documents"), orderBy("createdAt", "desc")),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudentDocument);
        setDocuments(list.length > 0 ? list : DEMO_DOCUMENTS);
        finish();
      },
      () => {
        setDocuments(DEMO_DOCUMENTS);
        fail("Failed to subscribe to student documents.");
      }
    );

    const unsubDecisions = onSnapshot(
      query(collection(db, "admissions_decisions"), orderBy("createdAt", "desc")),
      (snap) => {
        setDecisions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AdmissionsDecision));
        finish();
      },
      () => finish()
    );

    const unsubTasks = onSnapshot(
      query(collection(db, "tasks"), orderBy("createdAt", "desc")),
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
        finish();
      },
      () => finish()
    );

    return () => {
      clearTimeout(timeoutId);
      unsubApps();
      unsubDocs();
      unsubDecisions();
      unsubTasks();
    };
  }, []);

  const updateStage = useCallback(
    async (app: Application, newStage: ApplicationStage, note?: string) => {
      try {
        const historyItem = {
          stage: newStage,
          updatedBy: appUser?.email || "Admissions Officer",
          timestamp: Date.now(),
          note: note || `Stage updated to ${newStage}`,
        };

        await updateDoc(doc(db, "applications", app.id), {
          stage: newStage,
          history: [...(app.history || []), historyItem],
          updatedAt: Date.now(),
        });

        await logAuditEvent(
          "APPLICATION_STAGE_CHANGED",
          appUser?.email || "Admissions Officer",
          "Application",
          `Updated application ${app.applicationNumber} stage to ${newStage}`,
          app.id,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to update stage");
      }
    },
    [appUser]
  );

  const verifyDocument = useCallback(
    async (docId: string, status: DocumentVerificationStatus, feedback?: string) => {
      try {
        const targetDoc = documents.find((d) => d.id === docId);
        await updateDoc(doc(db, "student_documents", docId), {
          status: status === "Verified" ? "Verified" : status === "Rejected" ? "Rejected" : "Pending",
          feedback: feedback || "",
          updatedAt: Date.now(),
        });

        await logAuditEvent(
          "DOCUMENT_VERIFICATION_UPDATED",
          appUser?.email || "Admissions Officer",
          "Document",
          `Marked document ${targetDoc?.fileName || docId} as ${status}`,
          docId,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to verify document");
      }
    },
    [appUser, documents]
  );

  const recordDecision = useCallback(
    async (decision: Omit<AdmissionsDecision, "id" | "createdAt" | "officerEmail">) => {
      try {
        const payload: Omit<AdmissionsDecision, "id"> = {
          ...decision,
          officerEmail: appUser?.email || "Unknown",
          createdAt: Date.now(),
        };

        const docRef = await addDoc(collection(db, "admissions_decisions"), payload);

        await logAuditEvent(
          "ADMISSIONS_DECISION_RECORDED",
          appUser?.email || "Admissions Officer",
          "Decision",
          `Recorded decision ${decision.decisionType} for ${decision.studentName} at ${decision.universityName}`,
          docRef.id,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to record decision");
      }
    },
    [appUser]
  );

  const createAdmissionTask = useCallback(
    async (task: { title: string; description?: string; dueDate?: string; assignedTo?: string }) => {
      try {
        const newTask: Omit<Task, "id"> = {
          title: task.title,
          description: task.description || "",
          dueDate: task.dueDate || new Date().toISOString().slice(0, 10),
          priority: "Medium",
          status: "Open",
          assignedTo: task.assignedTo || appUser?.email || "Admissions Officer",
          createdBy: appUser?.email || "Admissions Officer",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const docRef = await addDoc(collection(db, "tasks"), newTask);

        await logAuditEvent(
          "TASK_CREATED",
          appUser?.email || "Admissions Officer",
          "Task",
          `Created admission task: ${task.title}`,
          docRef.id,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to create task");
      }
    },
    [appUser]
  );

  const metrics: AdmissionsMetrics = useMemo(() => {
    const totalPendingReview = applications.filter((a) =>
      ["Initial Review", "Submitted", "University Reviewing"].includes(a.stage)
    ).length;
    const documentsPendingVerification = documents.filter((d) => d.status === "Received" || d.status === "Pending").length;
    const offersIssued = applications.filter((a) =>
      ["Conditional Offer", "Unconditional Offer", "Deposit Paid", "CAS Issued", "Visa Approved", "Enrolled"].includes(a.stage)
    ).length;
    const casPending = applications.filter((a) => a.stage === "Deposit Paid" || a.stage === "CAS Issued").length;
    const enrolledTotal = applications.filter((a) => a.stage === "Enrolled").length;

    return {
      totalPendingReview,
      documentsPendingVerification,
      offersIssued,
      casPending,
      enrolledTotal,
    };
  }, [applications, documents]);

  return {
    applications,
    documents,
    decisions,
    tasks,
    metrics,
    loading,
    error,
    updateStage,
    verifyDocument,
    recordDecision,
    createAdmissionTask,
  };
};
