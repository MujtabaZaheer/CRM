import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, setDoc, doc } from "firebase/firestore";
import { AppUser } from "../types/role";
import { Lead } from "../types/lead";
import { Student } from "../types/student";
import { Application } from "../types/application";
import { StudentDocument } from "../pages/Documents";
import { Task } from "../types/task";
import { University } from "../types/university";
import { useAuth } from "./AuthContext";
import { sanitizeFirestoreData } from "../utils/firestoreSanitizer";

import { DEMO_APPLICATIONS, DEMO_DOCUMENTS, DEMO_LEADS, DEMO_STUDENTS, DEMO_TASKS, DEMO_UNIVERSITIES, DEMO_USERS } from "../data/demoData";

import { filterRecordsByTenant, resolveUserTenantId, scopeDocumentWithTenant } from "../utils/tenantScoping";

interface GlobalDataContextType {
  users: AppUser[];
  leads: Lead[];
  students: Student[];
  applications: Application[];
  documents: StudentDocument[];
  tasks: Task[];
  universities: University[];
  activeTenantId: string;
  setActiveTenantId: (tenantId: string) => void;
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
  activeTenantId: "ALL",
  setActiveTenantId: () => {},
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

  // Demo data toggle — persisted in localStorage (defaults to true)
  const [showDemoData, setShowDemoData] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("educrm_show_demo_data");
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const [users, setUsers] = useState<AppUser[]>(() => (showDemoData ? DEMO_USERS : []));
  const [leads, setLeads] = useState<Lead[]>(() => (showDemoData ? DEMO_LEADS : []));
  const [students, setStudents] = useState<Student[]>(() => (showDemoData ? DEMO_STUDENTS : []));
  const [applications, setApplications] = useState<Application[]>(() => (showDemoData ? DEMO_APPLICATIONS : []));
  const [documents, setDocuments] = useState<StudentDocument[]>(() => (showDemoData ? DEMO_DOCUMENTS : []));
  const [tasks, setTasks] = useState<Task[]>(() => (showDemoData ? DEMO_TASKS : []));
  const [universities, setUniversities] = useState<University[]>(() =>
    DEMO_UNIVERSITIES && DEMO_UNIVERSITIES.length > 0 ? DEMO_UNIVERSITIES : []
  );
  const [activeTenantId, setActiveTenantIdState] = useState<string>("ALL");

  useEffect(() => {
    if (appUser) {
      if (appUser.role !== "platform_super_admin") {
        setActiveTenantIdState(resolveUserTenantId(appUser));
      }
    }
  }, [appUser]);

  const setActiveTenantId = useCallback((newTenantId: string) => {
    if (appUser?.role === "platform_super_admin") {
      setActiveTenantIdState(newTenantId);
    }
  }, [appUser?.role]);

  const [initialLoading, setInitialLoading] = useState<boolean>(false);

  const toggleDemoData = useCallback(() => {
    setShowDemoData((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("educrm_show_demo_data", String(next));
      } catch {}
      if (next) {
        setUsers((u) => (u.length === 0 ? DEMO_USERS : u));
        setLeads((l) => (l.length === 0 ? DEMO_LEADS : l));
        setStudents((s) => (s.length === 0 ? DEMO_STUDENTS : s));
        setApplications((a) => (a.length === 0 ? DEMO_APPLICATIONS : a));
        setDocuments((d) => (d.length === 0 ? DEMO_DOCUMENTS : d));
        setTasks((t) => (t.length === 0 ? DEMO_TASKS : t));
        setUniversities((un) => (un.length === 0 ? DEMO_UNIVERSITIES : un));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!appUser) {
      if (showDemoData) {
        setUsers((prev) => (prev.length === 0 ? DEMO_USERS : prev));
        setLeads((prev) => (prev.length === 0 ? DEMO_LEADS : prev));
        setStudents((prev) => (prev.length === 0 ? DEMO_STUDENTS : prev));
        setApplications((prev) => (prev.length === 0 ? DEMO_APPLICATIONS : prev));
        setDocuments((prev) => (prev.length === 0 ? DEMO_DOCUMENTS : prev));
        setTasks((prev) => (prev.length === 0 ? DEMO_TASKS : prev));
        setUniversities((prev) => (prev.length === 0 ? DEMO_UNIVERSITIES : prev));
      }
      setInitialLoading(false);
      return;
    }

    setInitialLoading(false);
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

    // Safety timeout: Ensure data is reliably present
    const timeoutId = setTimeout(() => {
      setInitialLoading(false);
      if (showDemoData) {
        setUsers((prev) => (prev.length === 0 ? DEMO_USERS : prev));
        setLeads((prev) => (prev.length === 0 ? DEMO_LEADS : prev));
        setStudents((prev) => (prev.length === 0 ? DEMO_STUDENTS : prev));
        setApplications((prev) => (prev.length === 0 ? DEMO_APPLICATIONS : prev));
        setDocuments((prev) => (prev.length === 0 ? DEMO_DOCUMENTS : prev));
        setTasks((prev) => (prev.length === 0 ? DEMO_TASKS : prev));
        setUniversities((prev) => (prev.length === 0 ? DEMO_UNIVERSITIES : prev));
      }
    }, 500);

    const isStudent = appUser.role === "student";
    const noop = () => {};

    if (isStudent) {
      markSourceLoaded("users");
      markSourceLoaded("leads");
      markSourceLoaded("students");
      markSourceLoaded("applications");
      markSourceLoaded("documents");
      markSourceLoaded("tasks");
    }

    // 1. Users (Staff only)
    const unsubUsers = isStudent ? noop : onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list: AppUser[] = [];
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as AppUser));
        setUsers(
          showDemoData
            ? list.length > 0
              ? [...list, ...DEMO_USERS.filter((du) => !list.some((u) => u.uid === du.uid))]
              : DEMO_USERS
            : list
        );
        markSourceLoaded("users");
      },
      (err) => {
        handleSourceError("users", err);
        setUsers((prev) => (prev.length > 0 ? prev : (showDemoData ? DEMO_USERS : [])));
      }
    );

    // 2. Leads (Staff only)
    const unsubLeads = isStudent ? noop : onSnapshot(
      query(collection(db, "leads"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Lead[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Lead));
        setLeads((prev) => {
          const localOnly = prev.filter((p) => !list.some((l) => l.id === p.id) && !DEMO_LEADS.some((dl) => dl.id === p.id));
          const base = [...list, ...localOnly];
          return showDemoData
            ? [...base, ...DEMO_LEADS.filter((dl) => !base.some((l) => l.id === dl.id))]
            : base;
        });
        markSourceLoaded("leads");
      },
      (err) => {
        handleSourceError("leads", err);
        setLeads((prev) => (prev.length > 0 ? prev : (showDemoData ? DEMO_LEADS : [])));
      }
    );

    // 3. Students (Staff only for global list)
    const unsubStudents = isStudent ? noop : onSnapshot(
      query(collection(db, "students"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Student[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Student));
        setStudents((prev) => {
          const localOnly = prev.filter((p) => !list.some((l) => l.id === p.id) && !DEMO_STUDENTS.some((ds) => ds.id === p.id));
          const base = [...list, ...localOnly];
          return showDemoData
            ? [...base, ...DEMO_STUDENTS.filter((ds) => !base.some((s) => s.id === ds.id))]
            : base;
        });
        markSourceLoaded("students");
      },
      (err) => {
        handleSourceError("students", err);
        setStudents((prev) => (prev.length > 0 ? prev : (showDemoData ? DEMO_STUDENTS : [])));
      }
    );

    // 4. Applications (Staff only for global list)
    const unsubApps = isStudent ? noop : onSnapshot(
      collection(db, "applications"),
      (snap) => {
        const list: Application[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Application));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setApplications((prev) => {
          const localOnly = prev.filter((p) => !list.some((l) => l.id === p.id) && !DEMO_APPLICATIONS.some((da) => da.id === p.id));
          const base = [...list, ...localOnly];
          return showDemoData
            ? [...base, ...DEMO_APPLICATIONS.filter((da) => !base.some((a) => a.id === da.id))]
            : base;
        });
        markSourceLoaded("applications");
      },
      (err) => {
        handleSourceError("applications", err);
        setApplications((prev) => (prev.length > 0 ? prev : (showDemoData ? DEMO_APPLICATIONS : [])));
      }
    );

    // 5. Student Documents & Documents Collections (Staff only for global list)
    let studentDocsList: StudentDocument[] = [];
    let rootDocsList: StudentDocument[] = [];

    const syncCombinedDocuments = () => {
      const mergedMap = new Map<string, StudentDocument>();
      rootDocsList.forEach((d) => mergedMap.set(d.id, d));
      studentDocsList.forEach((d) => {
        const existing = mergedMap.get(d.id);
        mergedMap.set(d.id, { ...existing, ...d });
      });
      const list = Array.from(mergedMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setDocuments(
        showDemoData
          ? list.length > 0
            ? [...list, ...DEMO_DOCUMENTS.filter((dd) => !list.some((d) => d.id === dd.id))]
            : DEMO_DOCUMENTS
          : list
      );
      markSourceLoaded("documents");
    };

    const unsubStudentDocs = isStudent ? noop : onSnapshot(
      collection(db, "student_documents"),
      (snap) => {
        studentDocsList = [];
        snap.forEach((d) => studentDocsList.push({ id: d.id, ...d.data() } as StudentDocument));
        syncCombinedDocuments();
      },
      (err) => {
        handleSourceError("documents", err);
        setDocuments((prev) => (prev.length > 0 ? prev : (showDemoData ? DEMO_DOCUMENTS : [])));
      }
    );

    const unsubRootDocs = isStudent ? noop : onSnapshot(
      collection(db, "documents"),
      (snap) => {
        rootDocsList = [];
        snap.forEach((d) => rootDocsList.push({ id: d.id, ...d.data() } as StudentDocument));
        syncCombinedDocuments();
      },
      () => {
        // Optional root documents fallback — ignore if collection permissions differ
      }
    );

    // 6. Tasks (Staff only)
    const unsubTasks = isStudent ? noop : onSnapshot(
      query(collection(db, "tasks"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Task[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Task));
        setTasks(
          showDemoData
            ? list.length > 0
              ? [...list, ...DEMO_TASKS.filter((dt) => !list.some((t) => t.id === dt.id))]
              : DEMO_TASKS
            : list
        );
        markSourceLoaded("tasks");
      },
      (err) => {
        handleSourceError("tasks", err);
        setTasks((prev) => (prev.length > 0 ? prev : (showDemoData ? DEMO_TASKS : [])));
      }
    );

    // 7. Universities (Accessible by both staff and students)
    const unsubUnivs = onSnapshot(
      collection(db, "universities"),
      (snap) => {
        const list: University[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as University));
        setUniversities(
          list.length > 0
            ? [...list, ...DEMO_UNIVERSITIES.filter((du) => !list.some((u) => u.id === du.id))]
            : DEMO_UNIVERSITIES
        );
        markSourceLoaded("universities");
      },
      (err) => {
        handleSourceError("universities", err);
        setUniversities((prev) => (prev.length > 0 ? prev : DEMO_UNIVERSITIES));
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubUsers();
      unsubLeads();
      unsubStudents();
      unsubApps();
      unsubStudentDocs();
      unsubRootDocs();
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
    try {
      const sanitized = sanitizeFirestoreData(updates);
      setDoc(doc(db, "students", studentId), sanitized, { merge: true }).catch(() => {});
    } catch (_) {}
  };

  const addApplication = (newApp: Application) => {
    const scopedApp = newApp.tenantId ? newApp : scopeDocumentWithTenant(newApp, appUser);
    setApplications((prev) => [scopedApp, ...prev.filter((a) => a.id !== scopedApp.id)]);
    try {
      const sanitized = sanitizeFirestoreData(scopedApp);
      setDoc(doc(db, "applications", scopedApp.id), sanitized, { merge: true }).catch(() => {});
    } catch (_) {}
  };

  const updateApplication = (appId: string, updates: Partial<Application>) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, ...updates } : a)));
    try {
      const sanitized = sanitizeFirestoreData(updates);
      setDoc(doc(db, "applications", appId), sanitized, { merge: true }).catch(() => {});
    } catch (_) {}
  };

  const addDocument = (newDoc: StudentDocument) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    try {
      const sanitized = sanitizeFirestoreData(newDoc);
      Promise.allSettled([
        setDoc(doc(db, "student_documents", newDoc.id), sanitized, { merge: true }),
        setDoc(doc(db, "documents", newDoc.id), sanitized, { merge: true }),
      ]).catch(() => {});
    } catch (_) {}
  };

  const updateDocument = (docId: string, updates: Partial<StudentDocument>) => {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, ...updates } : d)));
    try {
      const sanitized = sanitizeFirestoreData(updates);
      Promise.allSettled([
        setDoc(doc(db, "student_documents", docId), sanitized, { merge: true }),
        setDoc(doc(db, "documents", docId), sanitized, { merge: true }),
      ]).catch(() => {});
    } catch (_) {}
  };

  // Strictly enforce tenant boundary filtering on all exposed records
  const scopedApplications = useMemo(() => {
    return filterRecordsByTenant(applications, appUser, activeTenantId);
  }, [applications, appUser, activeTenantId]);

  const scopedLeads = useMemo(() => {
    return filterRecordsByTenant(leads, appUser, activeTenantId);
  }, [leads, appUser, activeTenantId]);

  const scopedStudents = useMemo(() => {
    return filterRecordsByTenant(students, appUser, activeTenantId);
  }, [students, appUser, activeTenantId]);

  const scopedTasks = useMemo(() => {
    return filterRecordsByTenant(tasks, appUser, activeTenantId);
  }, [tasks, appUser, activeTenantId]);

  const scopedDocuments = useMemo(() => {
    return filterRecordsByTenant(documents, appUser, activeTenantId);
  }, [documents, appUser, activeTenantId]);

  const scopedUsers = useMemo(() => {
    return filterRecordsByTenant(users, appUser, activeTenantId);
  }, [users, appUser, activeTenantId]);

  return (
    <GlobalDataContext.Provider
      value={{
        users: scopedUsers,
        leads: scopedLeads,
        students: scopedStudents,
        applications: scopedApplications,
        documents: scopedDocuments,
        tasks: scopedTasks,
        universities,
        activeTenantId,
        setActiveTenantId,
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
