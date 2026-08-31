import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

import { DEMO_APPLICATIONS, DEMO_DOCUMENTS, DEMO_LEADS, DEMO_STUDENTS, DEMO_TASKS, DEMO_UNIVERSITIES, DEMO_USERS } from "../data/demoData";

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
  showDemoData: boolean;
  toggleDemoData: () => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addLead: (lead: Lead) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  addStudent: (student: Student) => void;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  addApplication: (app: Application) => void;
  updateApplication: (appId: string, updates: Partial<Application>) => void;
  addDocument: (doc: StudentDocument) => void;
  updateDocument: (docId: string, updates: Partial<StudentDocument>) => void;
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
  showDemoData: true,
  toggleDemoData: () => {},
  addTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
  addLead: () => {},
  updateLead: () => {},
  addStudent: () => {},
  updateStudent: () => {},
  addApplication: () => {},
  updateApplication: () => {},
  addDocument: () => {},
  updateDocument: () => {},
});

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

  // Demo data toggle — persisted in localStorage
  const [showDemoData, setShowDemoData] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("educrm_show_demo_data");
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggleDemoData = useCallback(() => {
    setShowDemoData((prev) => {
      const next = !prev;
      try { localStorage.setItem("educrm_show_demo_data", String(next)); } catch {}
      return next;
    });
  }, []);

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

    // Safety timeout: Never keep the UI stuck on loading for more than 1 second & populate demo data if toggle is on
    const timeoutId = setTimeout(() => {
      setInitialLoading(false);
      setUsers((prev) => (prev.length === 0 && showDemoData ? DEMO_USERS : prev));
      setLeads((prev) => (prev.length === 0 && showDemoData ? DEMO_LEADS : prev));
      setStudents((prev) => (prev.length === 0 && showDemoData ? DEMO_STUDENTS : prev));
      setApplications((prev) => (prev.length === 0 && showDemoData ? DEMO_APPLICATIONS : prev));
      setDocuments((prev) => (prev.length === 0 && showDemoData ? DEMO_DOCUMENTS : prev));
      setTasks((prev) => (prev.length === 0 && showDemoData ? DEMO_TASKS : prev));
      setUniversities((prev) => (prev.length === 0 && showDemoData ? DEMO_UNIVERSITIES : prev));
    }, 1000);

    // 1. Users
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list: AppUser[] = [];
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as AppUser));
        setUsers(list.length > 0 ? list : (showDemoData ? DEMO_USERS : []));
        markSourceLoaded("users");
      },
      (err) => { handleSourceError("users", err); setUsers(showDemoData ? DEMO_USERS : []); }
    );

    // 2. Leads
    const unsubLeads = onSnapshot(
      query(collection(db, "leads"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Lead[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Lead));
        setLeads(list.length > 0 ? list : (showDemoData ? DEMO_LEADS : []));
        markSourceLoaded("leads");
      },
      (err) => { handleSourceError("leads", err); setLeads(showDemoData ? DEMO_LEADS : []); }
    );

    // 3. Students
    const unsubStudents = onSnapshot(
      query(collection(db, "students"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Student[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Student));
        setStudents(list.length > 0 ? list : (showDemoData ? DEMO_STUDENTS : []));
        markSourceLoaded("students");
      },
      (err) => { handleSourceError("students", err); setStudents(showDemoData ? DEMO_STUDENTS : []); }
    );

    // 4. Applications
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Application[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Application));
        setApplications(list.length > 0 ? list : (showDemoData ? DEMO_APPLICATIONS : []));
        markSourceLoaded("applications");
      },
      (err) => { handleSourceError("applications", err); setApplications(showDemoData ? DEMO_APPLICATIONS : []); }
    );

    // 5. Student Documents
    const unsubDocs = onSnapshot(
      query(collection(db, "student_documents"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: StudentDocument[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StudentDocument));
        setDocuments(list.length > 0 ? list : (showDemoData ? DEMO_DOCUMENTS : []));
        markSourceLoaded("documents");
      },
      (err) => { handleSourceError("documents", err); setDocuments(showDemoData ? DEMO_DOCUMENTS : []); }
    );

    // 6. Tasks
    const unsubTasks = onSnapshot(
      query(collection(db, "tasks"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Task[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Task));
        setTasks(list.length > 0 ? list : (showDemoData ? DEMO_TASKS : []));
        markSourceLoaded("tasks");
      },
      (err) => { handleSourceError("tasks", err); setTasks(showDemoData ? DEMO_TASKS : []); }
    );

    // 7. Universities
    const unsubUnivs = onSnapshot(
      collection(db, "universities"),
      (snap) => {
        const list: University[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as University));
        setUniversities(list.length > 0 ? list : (showDemoData ? DEMO_UNIVERSITIES : []));
        markSourceLoaded("universities");
      },
      (err) => { handleSourceError("universities", err); setUniversities(showDemoData ? DEMO_UNIVERSITIES : []); }
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
  }, [appUser, showDemoData]);

  // Optimistic Mutation Handlers
  const addTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev.filter((l) => l.id !== newLead.id)]);
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updates } : l)));
  };

  const addStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev.filter((s) => s.id !== newStudent.id)]);
  };

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s)));
  };

  const addApplication = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]);
  };

  const updateApplication = (appId: string, updates: Partial<Application>) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, ...updates } : a)));
  };

  const addDocument = (newDoc: StudentDocument) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
  };

  const updateDocument = (docId: string, updates: Partial<StudentDocument>) => {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, ...updates } : d)));
  };

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
        showDemoData,
        toggleDemoData,
        addTask,
        updateTask,
        deleteTask,
        addLead,
        updateLead,
        addStudent,
        updateStudent,
        addApplication,
        updateApplication,
        addDocument,
        updateDocument,
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

export const useGlobalData = () => useContext(GlobalDataContext);
