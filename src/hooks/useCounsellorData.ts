import { useCallback } from "react";
import { db } from "../firebase/config";
import {
  doc,
  updateDoc,
  addDoc,
  collection
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { Lead, LeadStage } from "../types/lead";
import { Student } from "../types/student";
import { Application, ApplicationStage } from "../types/application";
import { Task, TaskPriority, TaskStatus } from "../types/task";
import { StudentDocument, DocumentType } from "../pages/Documents";
import { logAuditEvent } from "../utils/auditLogger";
import { uploadStudentDocument } from "../utils/documentStorage";

export const useCounsellorData = () => {
  const { appUser } = useAuth();
  const {
    leads,
    students,
    applications,
    documents,
    tasks,
    universities,
    initialLoading: loading,
    error,
    addTask,
    updateTask,
    updateLead,
    addStudent,
    addApplication,
    updateApplication,
    addDocument,
    updateDocument,
  } = useGlobalData();

  // Filter Data scoped to logged-in Counsellor (or all items for Admins)
  const userUid = appUser?.uid;
  const userEmail = appUser?.email;
  const isAdminOrManager =
    appUser?.role === "platform_super_admin" ||
    appUser?.role === "org_admin" ||
    appUser?.role === "office_manager";

  const filteredLeads = leads.filter((l) => l.assignedTo === userUid || l.assignedTo === userEmail);
  const myLeads = isAdminOrManager || filteredLeads.length === 0 ? leads : filteredLeads;

  const filteredStudents = students.filter((s) => s.assignedCounsellorId === userUid || s.assignedCounsellorId === userEmail);
  const myStudents = isAdminOrManager || filteredStudents.length === 0 ? students : filteredStudents;

  const myStudentIds = myStudents.map((s) => s.id);

  const filteredApplications = applications.filter(
    (a) =>
      a.assignedCounsellor === userEmail ||
      a.assignedCounsellor === userUid ||
      myStudentIds.includes(a.studentId)
  );
  const myApplications = isAdminOrManager || filteredApplications.length === 0 ? applications : filteredApplications;

  const filteredDocuments = documents.filter((d) => myStudentIds.includes(d.studentId) || d.uploadedBy === userEmail);
  const myDocuments = isAdminOrManager || filteredDocuments.length === 0 ? documents : filteredDocuments;

  const filteredTasks = tasks.filter((t) => t.assignedTo === userEmail || t.assignedTo === userUid || t.createdBy === userEmail);
  const myTasks = isAdminOrManager || filteredTasks.length === 0 ? tasks : filteredTasks;

  // Actions
  const updateLeadStage = useCallback(
    async (leadId: string, stage: LeadStage, lostReason?: string, note?: string) => {
      const leadData = leads.find((l) => l.id === leadId);
      const leadName = leadData?.fullName || "Lead";

      const updates: Partial<Lead> = {
        stage,
        updatedAt: Date.now(),
        lastContactedAt: Date.now(),
      };
      if (lostReason) updates.lostReason = lostReason;
      if (note) updates.notes = note;

      // Optimistic update
      updateLead(leadId, updates);

      try {
        const leadRef = doc(db, "leads", leadId);
        await updateDoc(leadRef, updates);
        await logAuditEvent(
          "LEAD_STAGE_UPDATED",
          userEmail || "Counsellor",
          "Lead",
          `Updated stage for lead ${leadName} to "${stage}"${lostReason ? ` (Reason: ${lostReason})` : ""}`,
          leadId,
          appUser?.role
        );
      } catch (err) {
        console.warn("Firestore update notice (persisted in local state):", err);
      }
    },
    [leads, userEmail, appUser, updateLead]
  );

  const convertLeadToStudent = useCallback(
    async (lead: Lead): Promise<string> => {
      const newStudentId = `student-${Date.now()}`;
      const newStudent: Student = {
        id: newStudentId,
        leadId: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        nationality: lead.nationality || "Unspecified",
        countryOfResidence: lead.countryOfResidence || "Unspecified",
        assignedCounsellorId: userUid,
        preferredDestination: lead.destinationCountry,
        preferredIntake: lead.preferredIntake,
        academicHistory: [],
        profileCompleteness: 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Optimistic student creation and lead update
      addStudent(newStudent);
      updateLead(lead.id, { stage: "Converted", updatedAt: Date.now() });

      try {
        const docRef = await addDoc(collection(db, "students"), newStudent);
        await updateDoc(doc(db, "leads", lead.id), {
          stage: "Converted",
          convertedStudentId: docRef.id,
          updatedAt: Date.now(),
        });

        await logAuditEvent(
          "LEAD_CONVERTED",
          userEmail || "Counsellor",
          "Student",
          `Converted lead ${lead.fullName} to permanent student record`,
          docRef.id,
          appUser?.role
        );

        return docRef.id;
      } catch (err) {
        console.warn("Firestore convert notice (persisted in local state):", err);
        return newStudentId;
      }
    },
    [userUid, userEmail, appUser, addStudent, updateLead]
  );

  const createApplication = useCallback(
    async (studentId: string, universityName: string, programmeName: string, intake: string, targetCountry?: string) => {
      const student = students.find((s) => s.id === studentId);
      const appNumber = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAppId = `app-${Date.now()}`;
      const newApp: Application = {
        id: newAppId,
        applicationNumber: appNumber,
        studentId,
        studentName: student?.fullName || "Student",
        universityId: "univ-custom",
        universityName,
        programmeId: "prog-custom",
        programmeName,
        intake,
        targetCountry: targetCountry || "United Kingdom",
        stage: "Draft",
        assignedCounsellor: userEmail || "Counsellor",
        history: [
          {
            stage: "Draft",
            updatedBy: userEmail || "Counsellor",
            timestamp: Date.now(),
            note: "Application draft created.",
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Optimistic local add
      addApplication(newApp);

      try {
        const docRef = await addDoc(collection(db, "applications"), newApp);
        await logAuditEvent(
          "APPLICATION_CREATED",
          userEmail || "Counsellor",
          "Application",
          `Created application ${appNumber} for ${student?.fullName} at ${universityName}`,
          docRef.id,
          appUser?.role
        );
        return docRef.id;
      } catch (err) {
        console.warn("Firestore create application notice (persisted locally):", err);
        return newAppId;
      }
    },
    [students, userEmail, appUser, addApplication]
  );

  const updateApplicationStage = useCallback(
    async (appId: string, newStage: ApplicationStage, note?: string) => {
      const appData = applications.find((a) => a.id === appId);
      if (!appData) return;

      const newHistoryItem = {
        stage: newStage,
        updatedBy: userEmail || "Counsellor",
        timestamp: Date.now(),
        note: note || `Stage updated to ${newStage}`,
      };

      const updatedHistory = [...(appData.history || []), newHistoryItem];
      const updates: Partial<Application> = {
        stage: newStage,
        history: updatedHistory,
        updatedAt: Date.now(),
      };

      // Optimistic update
      updateApplication(appId, updates);

      try {
        const appRef = doc(db, "applications", appId);
        await updateDoc(appRef, updates);
        await logAuditEvent(
          "APPLICATION_STAGE_UPDATED",
          userEmail || "Counsellor",
          "Application",
          `Updated application ${appData.applicationNumber} stage to "${newStage}"`,
          appId,
          appUser?.role
        );
      } catch (err) {
        console.warn("Firestore update app stage notice (persisted locally):", err);
      }
    },
    [applications, userEmail, appUser, updateApplication]
  );

  const uploadDocument = useCallback(
    async (studentId: string, studentName: string, docType: DocumentType, file: File) => {
      const newDocId = `doc-${Date.now()}`;
      const newDoc: StudentDocument = {
        id: newDocId,
        studentId,
        studentName,
        docType,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        status: "Received",
        uploadedBy: userEmail || "Counsellor",
        createdAt: Date.now(),
      };

      // Optimistic local add
      addDocument(newDoc);

      try {
        const uploadedFile = await uploadStudentDocument(studentId, file);
        const docRef = await addDoc(collection(db, "student_documents"), {
          ...newDoc,
          ...uploadedFile,
        });

        await logAuditEvent(
          "DOCUMENT_UPLOADED",
          userEmail || "Counsellor",
          "Document",
          `Uploaded ${docType} (${file.name}) for ${studentName}`,
          docRef.id,
          appUser?.role
        );

        return docRef.id;
      } catch (err) {
        console.warn("Firestore upload doc notice (persisted locally):", err);
        return newDocId;
      }
    },
    [userEmail, appUser, addDocument]
  );

  const verifyDocument = useCallback(
    async (docId: string, status: "Verified" | "Rejected") => {
      const docData = documents.find((d) => d.id === docId);

      // Optimistic local update
      updateDocument(docId, { status });

      try {
        const docRef = doc(db, "student_documents", docId);
        await updateDoc(docRef, { status });

        await logAuditEvent(
          "DOCUMENT_VERIFIED",
          userEmail || "Counsellor",
          "Document",
          `Marked document ${docData?.fileName || docId} as "${status}"`,
          docId,
          appUser?.role
        );
      } catch (err) {
        console.warn("Firestore verify doc notice (persisted locally):", err);
      }
    },
    [documents, userEmail, appUser, updateDocument]
  );

  const createTask = useCallback(
    async (
      title: string,
      description: string,
      dueDate: string,
      priority: TaskPriority,
      linkedEntityId?: string,
      linkedEntityName?: string,
      linkedEntityType?: "lead" | "student" | "application"
    ) => {
      const newTaskId = `task-${Date.now()}`;
      const newTask: Task = {
        id: newTaskId,
        title,
        description,
        dueDate,
        priority,
        status: "Open",
        linkedEntityId: linkedEntityId || undefined,
        linkedEntityName: linkedEntityName || undefined,
        linkedEntityType: linkedEntityType || undefined,
        assignedTo: userEmail || "Counsellor",
        createdBy: userEmail || "Counsellor",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Optimistic local update (instant feedback in UI)
      addTask(newTask);

      try {
        const docRef = await addDoc(collection(db, "tasks"), newTask);
        await logAuditEvent(
          "TASK_CREATED",
          userEmail || "Counsellor",
          "Task",
          `Created personal follow-up task "${title}"`,
          docRef.id,
          appUser?.role
        );
      } catch (err) {
        console.warn("Firestore task creation notice (persisted in local state):", err);
      }
    },
    [userEmail, appUser, addTask]
  );

  const toggleTask = useCallback(
    async (taskId: string, currentStatus: TaskStatus) => {
      const newStatus: TaskStatus = currentStatus === "Completed" ? "Open" : "Completed";

      // Optimistic local update
      updateTask(taskId, { status: newStatus, updatedAt: Date.now() });

      try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
          status: newStatus,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn("Firestore toggle task notice (persisted locally):", err);
      }
    },
    [updateTask]
  );

  return {
    leads: myLeads,
    students: myStudents,
    applications: myApplications,
    documents: myDocuments,
    tasks: myTasks,
    universities,
    allLeads: leads,
    allStudents: students,
    loading,
    error,
    updateLeadStage,
    convertLeadToStudent,
    createApplication,
    updateApplicationStage,
    uploadDocument,
    verifyDocument,
    createTask,
    toggleTask,
  };
};
