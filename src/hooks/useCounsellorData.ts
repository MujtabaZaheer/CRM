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
import { scopeDocumentWithTenant } from "../utils/tenantScoping";

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
    error
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
      const leadRef = doc(db, "leads", leadId);
      const leadData = leads.find((l) => l.id === leadId);
      const leadName = leadData?.fullName || "Lead";

      const updates: Partial<Lead> = {
        stage,
        updatedAt: Date.now(),
        lastContactedAt: Date.now(),
      };
      if (lostReason) updates.lostReason = lostReason;
      if (note) updates.notes = note;

      await updateDoc(leadRef, updates);

      await logAuditEvent(
        "LEAD_STAGE_UPDATED",
        userEmail || "Counsellor",
        "Lead",
        `Updated stage for lead ${leadName} to "${stage}"${lostReason ? ` (Reason: ${lostReason})` : ""}`,
        leadId,
        appUser?.role
      );
    },
    [leads, userEmail, appUser]
  );

  const convertLeadToStudent = useCallback(
    async (lead: Lead): Promise<string> => {
      const newStudent: Omit<Student, "id"> = {
        leadId: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        nationality: lead.nationality || "Unspecified",
        countryOfResidence: lead.countryOfResidence || "Unspecified",
        preferredDestination: lead.destinationCountry || "Unspecified",
        academicHistory: [],
        profileCompleteness: 35,
        assignedCounsellorId: userUid || userEmail,
        notes: `Converted from lead. ${lead.notes || ""}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "students"), scopeDocumentWithTenant(newStudent, appUser));

      const leadRef = doc(db, "leads", lead.id);
      await updateDoc(leadRef, {
        stage: "Converted",
        updatedAt: Date.now(),
      });

      await logAuditEvent(
        "STUDENT_CONVERTED",
        userEmail || "Counsellor",
        "Student",
        `Converted lead ${lead.fullName} to active student profile`,
        docRef.id,
        appUser?.role
      );

      return docRef.id;
    },
    [userUid, userEmail, appUser]
  );

  const createApplication = useCallback(
    async (
      studentId: string,
      studentName: string,
      universityName: string,
      programmeName: string,
      intake: string
    ) => {
      const appNum = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newApp: Omit<Application, "id"> = {
        applicationNumber: appNum,
        studentId,
        studentName,
        universityId: `univ-${Date.now()}`,
        universityName,
        programmeId: `prog-${Date.now()}`,
        programmeName,
        intake,
        stage: "Draft",
        assignedCounsellor: userEmail || "Counsellor",
        history: [
          {
            stage: "Draft",
            updatedBy: userEmail || "Counsellor",
            timestamp: Date.now(),
            note: "Application draft created",
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "applications"), newApp);

      await logAuditEvent(
        "APPLICATION_CREATED",
        userEmail || "Counsellor",
        "Application",
        `Created application ${appNum} (${universityName} - ${programmeName}) for student ${studentName}`,
        docRef.id,
        appUser?.role
      );

      return docRef.id;
    },
    [userEmail, appUser]
  );

  const updateApplicationStage = useCallback(
    async (appId: string, newStage: ApplicationStage, note?: string) => {
      const appRef = doc(db, "applications", appId);
      const appData = applications.find((a) => a.id === appId);
      if (!appData) return;

      const newHistoryItem = {
        stage: newStage,
        updatedBy: userEmail || "Counsellor",
        timestamp: Date.now(),
        note: note || `Stage updated to ${newStage}`,
      };

      const updatedHistory = [...(appData.history || []), newHistoryItem];

      await updateDoc(appRef, {
        stage: newStage,
        history: updatedHistory,
        updatedAt: Date.now(),
      });

      await logAuditEvent(
        "APPLICATION_STAGE_UPDATED",
        userEmail || "Counsellor",
        "Application",
        `Updated application ${appData.applicationNumber} stage to "${newStage}"`,
        appId,
        appUser?.role
      );
    },
    [applications, userEmail, appUser]
  );

  const uploadDocument = useCallback(
    async (studentId: string, studentName: string, docType: DocumentType, file: File) => {
      const uploadedFile = await uploadStudentDocument(studentId, file);
      const newDoc: Omit<StudentDocument, "id"> = {
        studentId,
        studentName,
        docType,
        ...uploadedFile,
        status: "Received",
        uploadedBy: userEmail || "Counsellor",
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "student_documents"), newDoc);

      await logAuditEvent(
        "DOCUMENT_UPLOADED",
        userEmail || "Counsellor",
        "Document",
        `Uploaded ${docType} (${file.name}) for ${studentName}`,
        docRef.id,
        appUser?.role
      );

      return docRef.id;
    },
    [userEmail, appUser]
  );

  const verifyDocument = useCallback(
    async (docId: string, status: "Verified" | "Rejected") => {
      const docRef = doc(db, "student_documents", docId);
      const docData = documents.find((d) => d.id === docId);

      await updateDoc(docRef, {
        status,
      });

      await logAuditEvent(
        "DOCUMENT_VERIFIED",
        userEmail || "Counsellor",
        "Document",
        `Marked document ${docData?.fileName || docId} as "${status}"`,
        docId,
        appUser?.role
      );
    },
    [documents, userEmail, appUser]
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
      const newTask: Omit<Task, "id"> = {
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

      const docRef = await addDoc(collection(db, "tasks"), newTask);

      await logAuditEvent(
        "TASK_CREATED",
        userEmail || "Counsellor",
        "Task",
        `Created personal follow-up task "${title}"`,
        docRef.id,
        appUser?.role
      );
    },
    [userEmail, appUser]
  );

  const toggleTask = useCallback(async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "Completed" ? "Open" : "Completed";
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      status: newStatus,
      updatedAt: Date.now(),
    });
  }, []);

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
