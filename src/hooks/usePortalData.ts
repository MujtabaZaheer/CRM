import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { Application } from "../types/application";
import { Student } from "../types/student";
import { Task } from "../types/task";
import { SupportRequest, SupportRequestStatus, VisaCase, VisaCaseStatus } from "../types/portal";

import { DEMO_APPLICATIONS, DEMO_DOCUMENTS, DEMO_STUDENTS, DEMO_VISA_CASES } from "../data/demoData";
import { uploadStudentDocument } from "../utils/documentStorage";

export interface PortalDocument { id: string; studentId: string; studentName: string; documentType: string; fileName: string; fileUrl?: string; filePath?: string; fileSize?: number; fileType?: string; status: "Missing" | "Pending" | "Verified" | "Rejected"; remarks?: string; deadline?: string; createdAt: number; }
const subscribe = <T extends { id: string }>(name: string, setData: (items: T[]) => void, fail: () => void, field?: string, value?: string) => onSnapshot(field && value ? query(collection(db, name), where(field, "==", value)) : query(collection(db, name), orderBy("createdAt", "desc")), (snapshot) => setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)), fail);

export const usePortalData = () => {
  const { appUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]); const [applications, setApplications] = useState<Application[]>([]); const [tasks, setTasks] = useState<Task[]>([]); const [documents, setDocuments] = useState<PortalDocument[]>([]); const [visaCases, setVisaCases] = useState<VisaCase[]>([]); const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const ownStudent = useMemo(() => students.find((student) => student.email === appUser?.email || student.id === appUser?.uid) || DEMO_STUDENTS[0], [appUser, students]);
  const ownStudentId = ownStudent?.id;

  useEffect(() => {
    let count = 0;
    const done = () => { count += 1; if (count >= 6) setLoading(false); };
    const fail = () => { setError("Some portal records could not be loaded. Check your access and connection."); done(); };
    const studentRole = appUser?.role === "student";
    const noSubscription = () => { done(); return () => undefined; };

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setStudents((prev) => (prev.length === 0 ? DEMO_STUDENTS : prev));
      setApplications((prev) => (prev.length === 0 ? DEMO_APPLICATIONS : prev));
      setDocuments((prev) => (prev.length === 0 ? (DEMO_DOCUMENTS as unknown as PortalDocument[]) : prev));
      setVisaCases((prev) => (prev.length === 0 ? (DEMO_VISA_CASES as unknown as VisaCase[]) : prev));
    }, 1000);

    const stops = [
      subscribe<Student>("students", (x) => { setStudents(x.length > 0 ? x : DEMO_STUDENTS); done(); }, fail, studentRole ? "email" : undefined, studentRole ? appUser?.email : undefined),
      studentRole && !ownStudentId ? noSubscription() : subscribe<Application>("applications", (x) => { setApplications(x.length > 0 ? x : DEMO_APPLICATIONS); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudentId : undefined),
      studentRole && !ownStudentId ? noSubscription() : subscribe<Task>("tasks", (x) => { setTasks(x); done(); }, fail, studentRole ? "assignedTo" : undefined, studentRole ? appUser?.email : undefined),
      studentRole && !ownStudentId ? noSubscription() : subscribe<PortalDocument>("student_documents", (x) => { setDocuments(x); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudentId : undefined),
      studentRole && !ownStudentId ? noSubscription() : subscribe<VisaCase>("visa_cases", (x) => { setVisaCases(x.length > 0 ? x : (DEMO_VISA_CASES as unknown as VisaCase[])); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudentId : undefined),
      studentRole && !ownStudentId ? noSubscription() : subscribe<SupportRequest>("support_requests", (x) => { setRequests(x); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudentId : undefined)
    ];
    return () => {
      clearTimeout(timeoutId);
      stops.forEach((stop) => stop());
    };
  }, [appUser?.email, appUser?.role, ownStudentId]);
  const ownApplications = useMemo(() => applications.filter((application) => application.studentId === ownStudent?.id), [applications, ownStudent]);
  const ownDocuments = useMemo(() => documents.filter((item) => item.studentId === ownStudent?.id), [documents, ownStudent]);
  const ownTasks = useMemo(() => tasks.filter((task) => task.assignedTo === appUser?.email || task.assignedTo === appUser?.uid || task.linkedEntityId === ownStudent?.id), [appUser, ownStudent, tasks]);
  const updateVisa = useCallback(async (item: VisaCase, status: VisaCaseStatus, note = "") => { await updateDoc(doc(db, "visa_cases", item.id), { status, notes: note || item.notes || "", updatedAt: Date.now(), history: [...(item.history || []), { status, note, timestamp: Date.now(), updatedBy: appUser?.email || "Visa Officer" }] }); }, [appUser]);
  const updateDocument = useCallback(async (item: PortalDocument, status: PortalDocument["status"], remarks = "") => { await updateDoc(doc(db, "student_documents", item.id), { status, remarks, updatedAt: Date.now() }); }, []);
  const updateTask = useCallback(async (task: Task) => { await updateDoc(doc(db, "tasks", task.id), { status: task.status === "Completed" ? "Open" : "Completed", updatedAt: Date.now() }); }, []);
  const createRequest = useCallback(async (data: Omit<SupportRequest, "id" | "status" | "createdAt" | "updatedAt">) => { await addDoc(collection(db, "support_requests"), { ...data, status: "Open", createdAt: Date.now(), updatedAt: Date.now() }); }, []);
  const updateRequest = useCallback(async (request: SupportRequest, status: SupportRequestStatus, notes?: string) => { await updateDoc(doc(db, "support_requests", request.id), { status, notes: notes ?? request.notes ?? "", updatedAt: Date.now() }); }, []);
  const saveProfile = useCallback(async (student: Student, changes: Partial<Student>) => { await updateDoc(doc(db, "students", student.id), { ...changes, updatedAt: Date.now() }); }, []);
  const uploadDocument = useCallback(async (data: Omit<PortalDocument, "id" | "status" | "createdAt" | "fileName" | "fileUrl">, file: File) => {
    const uploadedFile = await uploadStudentDocument(data.studentId, file);
    await addDoc(collection(db, "student_documents"), { ...data, ...uploadedFile, status: "Pending", createdAt: Date.now() });
  }, []);
  return { students, applications, tasks, documents, visaCases, requests, ownStudent, ownApplications, ownDocuments, ownTasks, loading, error, updateVisa, updateDocument, updateTask, createRequest, updateRequest, saveProfile, uploadDocument };
};
