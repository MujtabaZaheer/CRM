import { useCallback, useMemo, useState } from "react";
import { collection, doc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { logAuditEvent } from "../utils/auditLogger";
import { Application, ApplicationStage } from "../types/application";
import { AdmissionsDecision, AdmissionsMetrics, DocumentVerificationStatus } from "../types/admissions";
import { Task } from "../types/task";

export const useAdmissionsData = () => {
  const { appUser } = useAuth();
  const {
    applications,
    documents,
    tasks,
    initialLoading: loading,
    error,
    updateApplication: updateGlobalApplication,
    updateDocument: updateGlobalDocument,
    addTask: addGlobalTask,
  } = useGlobalData();

  const [decisions, setDecisions] = useState<AdmissionsDecision[]>([]);

  const updateStage = useCallback(
    async (app: Application, newStage: ApplicationStage, note?: string) => {
      const historyItem = {
        stage: newStage,
        updatedBy: appUser?.email || "Admissions Officer",
        timestamp: Date.now(),
        note: note || `Stage updated to ${newStage}`,
      };

      const updatedHistory = [...(app.history || []), historyItem];
      updateGlobalApplication(app.id, {
        stage: newStage,
        history: updatedHistory,
        updatedAt: Date.now(),
      });

      try {
        await updateDoc(doc(db, "applications", app.id), {
          stage: newStage,
          history: updatedHistory,
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
      } catch (err) {
        console.warn("Firestore update notice (persisted in local state):", err);
      }
    },
    [appUser, updateGlobalApplication]
  );

  const verifyDocument = useCallback(
    async (docId: string, status: DocumentVerificationStatus, feedback?: string) => {
      const targetDoc = documents.find((d) => d.id === docId);
      const newStatus = status === "Verified" ? "Verified" : status === "Rejected" ? "Rejected" : "Received";
      
      updateGlobalDocument(docId, {
        status: newStatus,
        remarks: feedback || "",
      });

      try {
        await updateDoc(doc(db, "student_documents", docId), {
          status: newStatus,
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
      } catch (err) {
        console.warn("Firestore update notice (persisted in local state):", err);
      }
    },
    [appUser, documents, updateGlobalDocument]
  );

  const recordDecision = useCallback(
    async (decision: Omit<AdmissionsDecision, "id" | "createdAt" | "officerEmail">) => {
      const newDecision: AdmissionsDecision = {
        ...decision,
        id: `decision-${Date.now()}`,
        officerEmail: appUser?.email || "Unknown",
        createdAt: Date.now(),
      };

      setDecisions((prev) => [newDecision, ...prev]);

      try {
        const docRef = await addDoc(collection(db, "admissions_decisions"), newDecision);
        await logAuditEvent(
          "ADMISSIONS_DECISION_RECORDED",
          appUser?.email || "Admissions Officer",
          "Decision",
          `Recorded decision ${decision.decisionType} for ${decision.studentName} at ${decision.universityName}`,
          docRef.id,
          appUser?.role
        );
      } catch (err) {
        console.warn("Firestore decision notice (persisted in local state):", err);
      }
    },
    [appUser]
  );

  const createAdmissionTask = useCallback(
    async (task: { title: string; description?: string; dueDate?: string; assignedTo?: string }) => {
      const newTask: Task = {
        id: `task-${Date.now()}`,
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

      addGlobalTask(newTask);

      try {
        const docRef = await addDoc(collection(db, "tasks"), newTask);
        await logAuditEvent(
          "TASK_CREATED",
          appUser?.email || "Admissions Officer",
          "Task",
          `Created admission task: ${task.title}`,
          docRef.id,
          appUser?.role
        );
      } catch (err) {
        console.warn("Firestore task notice (persisted in local state):", err);
      }
    },
    [appUser, addGlobalTask]
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
