import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { Application } from "../types/application";
import { Student } from "../types/student";
import { Task } from "../types/task";
import { SupportRequest, SupportRequestStatus, VisaCase, VisaCaseStatus } from "../types/portal";

export interface PortalDocument { id: string; studentId: string; studentName: string; documentType: string; fileName: string; status: "Missing" | "Pending" | "Verified" | "Rejected"; remarks?: string; deadline?: string; createdAt: number; }
const subscribe = <T extends { id: string }>(name: string, setData: (items: T[]) => void, fail: () => void, field?: string, value?: string) => onSnapshot(field && value ? query(collection(db, name), where(field, "==", value)) : query(collection(db, name), orderBy("createdAt", "desc")), (snapshot) => setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)), fail);

export const usePortalData = () => {
  const { appUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]); const [applications, setApplications] = useState<Application[]>([]); const [tasks, setTasks] = useState<Task[]>([]); const [documents, setDocuments] = useState<PortalDocument[]>([]); const [visaCases, setVisaCases] = useState<VisaCase[]>([]); const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const ownStudent = useMemo(() => students.find((student) => student.email === appUser?.email || student.id === appUser?.uid), [appUser, students]);
  useEffect(() => { let count = 0; const done = () => { count += 1; if (count === 6) setLoading(false); }; const fail = () => { setError("Some portal records could not be loaded. Check your access and connection."); done(); }; const studentRole = appUser?.role === "student"; const noSubscription = () => { done(); return () => undefined; }; const stops = [subscribe<Student>("students", (x) => { setStudents(x); done(); }, fail, studentRole ? "email" : undefined, studentRole ? appUser?.email : undefined), studentRole && !ownStudent ? noSubscription() : subscribe<Application>("applications", (x) => { setApplications(x); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudent?.id : undefined), studentRole && !ownStudent ? noSubscription() : subscribe<Task>("tasks", (x) => { setTasks(x); done(); }, fail, studentRole ? "assignedTo" : undefined, studentRole ? appUser?.email : undefined), studentRole && !ownStudent ? noSubscription() : subscribe<PortalDocument>("student_documents", (x) => { setDocuments(x); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudent?.id : undefined), studentRole && !ownStudent ? noSubscription() : subscribe<VisaCase>("visa_cases", (x) => { setVisaCases(x); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudent?.id : undefined), studentRole && !ownStudent ? noSubscription() : subscribe<SupportRequest>("support_requests", (x) => { setRequests(x); done(); }, fail, studentRole ? "studentId" : undefined, studentRole ? ownStudent?.id : undefined)]; return () => stops.forEach((stop) => stop()); }, [appUser?.email, appUser?.role, ownStudent?.id]);
  const ownApplications = useMemo(() => applications.filter((application) => application.studentId === ownStudent?.id), [applications, ownStudent]);
  const ownDocuments = useMemo(() => documents.filter((item) => item.studentId === ownStudent?.id), [documents, ownStudent]);
  const ownTasks = useMemo(() => tasks.filter((task) => task.assignedTo === appUser?.email || task.assignedTo === appUser?.uid || task.linkedEntityId === ownStudent?.id), [appUser, ownStudent, tasks]);
  const updateVisa = useCallback(async (item: VisaCase, status: VisaCaseStatus, note = "") => { await updateDoc(doc(db, "visa_cases", item.id), { status, notes: note || item.notes || "", updatedAt: Date.now(), history: [...(item.history || []), { status, note, timestamp: Date.now(), updatedBy: appUser?.email || "Visa Officer" }] }); }, [appUser]);
  const updateDocument = useCallback(async (item: PortalDocument, status: PortalDocument["status"], remarks = "") => { await updateDoc(doc(db, "student_documents", item.id), { status, remarks, updatedAt: Date.now() }); }, []);
  const updateTask = useCallback(async (task: Task) => { await updateDoc(doc(db, "tasks", task.id), { status: task.status === "Completed" ? "Open" : "Completed", updatedAt: Date.now() }); }, []);
  const createRequest = useCallback(async (data: Omit<SupportRequest, "id" | "status" | "createdAt" | "updatedAt">) => { await addDoc(collection(db, "support_requests"), { ...data, status: "Open", createdAt: Date.now(), updatedAt: Date.now() }); }, []);
  const updateRequest = useCallback(async (request: SupportRequest, status: SupportRequestStatus, notes?: string) => { await updateDoc(doc(db, "support_requests", request.id), { status, notes: notes ?? request.notes ?? "", updatedAt: Date.now() }); }, []);
  const saveProfile = useCallback(async (student: Student, changes: Partial<Student>) => { await updateDoc(doc(db, "students", student.id), { ...changes, updatedAt: Date.now() }); }, []);
  const uploadDocument = useCallback(async (data: Omit<PortalDocument, "id" | "status" | "createdAt">) => { await addDoc(collection(db, "student_documents"), { ...data, status: "Pending", createdAt: Date.now() }); }, []);
  return { students, applications, tasks, documents, visaCases, requests, ownStudent, ownApplications, ownDocuments, ownTasks, loading, error, updateVisa, updateDocument, updateTask, createRequest, updateRequest, saveProfile, uploadDocument };
};
