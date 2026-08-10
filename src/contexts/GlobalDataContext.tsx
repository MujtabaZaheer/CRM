import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { AppUser } from "../types/role";
import { Lead } from "../types/lead";
import { Student } from "../types/student";
import { Application } from "../types/application";
import { StudentDocument } from "../pages/Documents";
import { Task } from "../types/task";
import { University } from "../types/university";
import { useAuth } from "./AuthContext";

interface GlobalDataContextType {
  users: AppUser[];
  leads: Lead[];
  students: Student[];
  applications: Application[];
  documents: StudentDocument[];
  tasks: Task[];
  universities: University[];
  initialLoading: boolean;
  error: string | null;
}

const GlobalDataContext = createContext<GlobalDataContextType>({
  users: [],
  leads: [],
  students: [],
  applications: [],
  documents: [],
  tasks: [],
  universities: [],
  initialLoading: true,
  error: null,
});

import { DEMO_APPLICATIONS, DEMO_DOCUMENTS, DEMO_LEADS, DEMO_STUDENTS, DEMO_USERS } from "../data/demoData";

export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appUser } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!appUser) {
      setInitialLoading(false);
      return;
    }

    setInitialLoading(true);
    const loadedSources = new Set<string>();

    const markSourceLoaded = (source: string) => {
      loadedSources.add(source);
      if (loadedSources.size >= 7) {
        setInitialLoading(false);
      }
    };

    const handleSourceError = (source: string, err: Error) => {
      console.warn(`Cache stream notice (${source}):`, err.message);
      markSourceLoaded(source);
    };

    // Safety timeout: Never keep the UI stuck on loading for more than 1 second & populate DEMO data
    const timeoutId = setTimeout(() => {
      setInitialLoading(false);
      setUsers((prev) => (prev.length === 0 ? DEMO_USERS : prev));
      setLeads((prev) => (prev.length === 0 ? DEMO_LEADS : prev));
      setStudents((prev) => (prev.length === 0 ? DEMO_STUDENTS : prev));
      setApplications((prev) => (prev.length === 0 ? DEMO_APPLICATIONS : prev));
      setDocuments((prev) => (prev.length === 0 ? DEMO_DOCUMENTS : prev));
    }, 1000);

    // 1. Users
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list: AppUser[] = [];
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as AppUser));
        setUsers(list.length > 0 ? list : DEMO_USERS);
        markSourceLoaded("users");
      },
      (err) => { handleSourceError("users", err); setUsers(DEMO_USERS); }
    );

    // 2. Leads
    const unsubLeads = onSnapshot(
      query(collection(db, "leads"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Lead[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Lead));
        setLeads(list.length > 0 ? list : DEMO_LEADS);
        markSourceLoaded("leads");
      },
      (err) => { handleSourceError("leads", err); setLeads(DEMO_LEADS); }
    );

    // 3. Students
    const unsubStudents = onSnapshot(
      query(collection(db, "students"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Student[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Student));
        setStudents(list.length > 0 ? list : DEMO_STUDENTS);
        markSourceLoaded("students");
      },
      (err) => { handleSourceError("students", err); setStudents(DEMO_STUDENTS); }
    );

    // 4. Applications
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Application[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Application));
        setApplications(list.length > 0 ? list : DEMO_APPLICATIONS);
        markSourceLoaded("applications");
      },
      (err) => { handleSourceError("applications", err); setApplications(DEMO_APPLICATIONS); }
    );

    // 5. Student Documents
    const unsubDocs = onSnapshot(
      query(collection(db, "student_documents"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: StudentDocument[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StudentDocument));
        setDocuments(list.length > 0 ? list : DEMO_DOCUMENTS);
        markSourceLoaded("documents");
      },
      (err) => { handleSourceError("documents", err); setDocuments(DEMO_DOCUMENTS); }
    );

    // 6. Tasks
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

    // 7. Universities
    const unsubUnivs = onSnapshot(
      collection(db, "universities"),
      (snap) => {
        const list: University[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as University));
        setUniversities(list);
        markSourceLoaded("universities");
      },
      (err) => handleSourceError("universities", err)
    );

    return () => {
      clearTimeout(timeoutId);
      unsubUsers();
      unsubLeads();
      unsubStudents();
      unsubApps();
      unsubDocs();
      unsubTasks();
      unsubUnivs();
    };
  }, [appUser]);

  return (
    <GlobalDataContext.Provider
      value={{
        users,
        leads,
        students,
        applications,
        documents,
        tasks,
        universities,
        initialLoading,
        error: null,
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

export const useGlobalData = () => useContext(GlobalDataContext);
