import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  query,
  orderBy
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { Lead, LeadStage } from "../types/lead";
import { Student } from "../types/student";
import { Application, ApplicationStage } from "../types/application";
import { Task, TaskPriority, TaskStatus } from "../types/task";
import { StudentDocument, DocumentType } from "../pages/Documents";
import { logAuditEvent } from "../utils/auditLogger";

export const useCounsellorData = () => {
  const { appUser } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const loadedSources = new Set<string>();

    const markSourceLoaded = (source: string) => {
      loadedSources.add(source);
      if (loadedSources.size === 5) setLoading(false);
    };

    const handleSourceError = (source: string, err: Error) => {
      console.error(`Error loading ${source}:`, err);
      setError("Some counsellor data could not be loaded. Please check permissions.");
      markSourceLoaded(source);
    };

    // 1. Subscribe to Leads
    const unsubLeads = onSnapshot(
      query(collection(db, "leads"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Lead[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Lead));
        setLeads(list);
        markSourceLoaded("leads");
      },
      (err) => handleSourceError("leads", err)
    );

    // 2. Subscribe to Students
    const unsubStudents = onSnapshot(
      query(collection(db, "students"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Student[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Student));
        setStudents(list);
        markSourceLoaded("students");
      },
      (err) => handleSourceError("students", err)
    );

    // 3. Subscribe to Applications
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Application[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Application));
        setApplications(list);
        markSourceLoaded("applications");
      },
      (err) => handleSourceError("applications", err)
    );

    // 4. Subscribe to Student Documents
    const unsubDocs = onSnapshot(
      query(collection(db, "student_documents"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: StudentDocument[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StudentDocument));
        setDocuments(list);
        markSourceLoaded("documents");
      },
      (err) => handleSourceError("documents", err)
    );

    // 5. Subscribe to Tasks
    const unsubTasks = onSnapshot(
      query(collection(db, "tasks"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Task[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Task));
        setTasks(list);
        markSourceLoaded("tasks");
      },
      (err) => handleSourceError("tasks", err)
    );

    return () => {
      unsubLeads();
      unsubStudents();
      unsubApps();
      unsubDocs();
      unsubTasks();
    };
  }, []);

  // Filter Data scoped to logged-in Counsellor
  const userUid = appUser?.uid;
  const userEmail = appUser?.email;

  const myLeads = leads.filter(
    (l) => l.assignedTo === userUid || l.assignedTo === userEmail
  );

  const myStudents = students.filter(
    (s) => s.assignedCounsellorId === userUid || s.assignedCounsellorId === userEmail
  );

  const myStudentIds = myStudents.map((s) => s.id);

  const myApplications = applications.filter(
    (a) =>
      a.assignedCounsellor === userEmail ||
      a.assignedCounsellor === userUid ||
      myStudentIds.includes(a.studentId)
  );

  const myDocuments = documents.filter(
    (d) => myStudentIds.includes(d.studentId) || d.uploadedBy === userEmail
  );

  const myTasks = tasks.filter(
    (t) => t.assignedTo === userEmail || t.assignedTo === userUid || t.createdBy === userEmail
  );

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

      const docRef = await addDoc(collection(db, "students"), newStudent);

      // Update lead stage to Converted
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
    async (studentId: string, studentName: string, docType: DocumentType, fileName: string) => {
      const newDoc: Omit<StudentDocument, "id"> = {
        studentId,
        studentName,
        docType,
        fileName,
        fileUrl: "#",
        status: "Received",
        uploadedBy: userEmail || "Counsellor",
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "student_documents"), newDoc);

      await logAuditEvent(
        "DOCUMENT_UPLOADED",
        userEmail || "Counsellor",
        "Document",
        `Uploaded ${docType} (${fileName}) for ${studentName}`,
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
