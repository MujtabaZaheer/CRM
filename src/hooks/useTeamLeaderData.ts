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
import { AppUser } from "../types/role";
import { Application } from "../types/application";
import { Lead } from "../types/lead";
import { Student } from "../types/student";
import { Task, TaskPriority, TaskStatus } from "../types/task";
import { logAuditEvent } from "../utils/auditLogger";

import { DEMO_APPLICATIONS, DEMO_LEADS, DEMO_STUDENTS, DEMO_USERS } from "../data/demoData";

export const useTeamLeaderData = () => {
  const { appUser } = useAuth();
  
  // Scopes (defaulting if not assigned yet)
  const office = appUser?.office || "Toronto Office";
  const team = appUser?.team || "Americas Team";
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const loadedSources = new Set<string>();
    const markSourceLoaded = (source: string) => {
      loadedSources.add(source);
      if (loadedSources.size >= 5) setLoading(false);
    };
    const handleSourceError = (source: string, err: Error) => {
      console.error(`Error loading ${source}:`, err);
      setError("Some team data could not be loaded. Check your connection and permissions, then try again.");
      markSourceLoaded(source);
    };
    
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setUsers((prev) => (prev.length === 0 ? DEMO_USERS : prev));
      setApplications((prev) => (prev.length === 0 ? DEMO_APPLICATIONS : prev));
      setLeads((prev) => (prev.length === 0 ? DEMO_LEADS : prev));
      setStudents((prev) => (prev.length === 0 ? DEMO_STUDENTS : prev));
    }, 1000);
    
    // Subscribe to Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list: AppUser[] = [];
      snap.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(list);
      markSourceLoaded("users");
    }, (err) => handleSourceError("users", err));

    // Subscribe to Applications
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Application[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Application);
        });
        setApplications(list);
        markSourceLoaded("applications");
      },
      (err) => handleSourceError("applications", err)
    );

    // Subscribe to Leads
    const unsubLeads = onSnapshot(
      query(collection(db, "leads"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Lead[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Lead);
        });
        setLeads(list);
        markSourceLoaded("leads");
      },
      (err) => handleSourceError("leads", err)
    );

    // Subscribe to Students
    const unsubStudents = onSnapshot(
      query(collection(db, "students"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Student[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Student);
        });
        setStudents(list);
        markSourceLoaded("students");
      },
      (err) => handleSourceError("students", err)
    );

    // Subscribe to Tasks
    const unsubTasks = onSnapshot(
      query(collection(db, "tasks"), orderBy("createdAt", "desc")),
      (snap) => {
        const list: Task[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Task);
        });
        setTasks(list);
        markSourceLoaded("tasks");
      },
      (err) => handleSourceError("tasks", err)
    );

    return () => {
      clearTimeout(timeoutId);
      unsubUsers();
      unsubApps();
      unsubLeads();
      unsubStudents();
      unsubTasks();
    };
  }, []);

  // Filter team members (Counsellors under the same office & team)
  const counsellors = users.filter(
    (u) => u.role === "counsellor" && u.office === office && u.team === team
  );

  const teamCounsellorEmails = counsellors.map((c) => c.email);
  const teamCounsellorUids = counsellors.map((c) => c.uid);

  // Filter Applications
  const teamApplications = applications.filter((app) => {
    if (!app.assignedCounsellor) return false;
    // Check if the application is assigned to one of the team's counsellors or the leader themselves
    return (
      teamCounsellorEmails.includes(app.assignedCounsellor) ||
      app.assignedCounsellor === appUser?.email
    );
  });

  // Unassigned applications must be available to a leader for initial allocation.
  // Until applications carry office/team fields, unassigned records cannot be scoped further.
  const assignmentApplications = applications.filter(
    (app) => !app.assignedCounsellor || teamApplications.some((teamApp) => teamApp.id === app.id)
  );

  // Filter Leads (including unassigned leads in the same office/team context, or assigned to counsellors/leader)
  const teamLeads = leads.filter((lead) => {
    if (!lead.assignedTo) return true; // Show unassigned leads so they can be assigned
    return (
      teamCounsellorUids.includes(lead.assignedTo) ||
      teamCounsellorEmails.includes(lead.assignedTo) ||
      lead.assignedTo === appUser?.uid ||
      lead.assignedTo === appUser?.email
    );
  });

  // Filter Students
  const teamStudents = students.filter((student) => {
    if (!student.assignedCounsellorId) return false;
    return (
      teamCounsellorUids.includes(student.assignedCounsellorId) ||
      teamCounsellorEmails.includes(student.assignedCounsellorId) ||
      student.assignedCounsellorId === appUser?.uid
    );
  });

  // Filter Tasks
  const teamTasks = tasks.filter((task) => {
    const isAssignedToTeam = 
      task.assignedTo && 
      (teamCounsellorEmails.includes(task.assignedTo) ||
       teamCounsellorUids.includes(task.assignedTo) ||
       task.assignedTo === appUser?.email ||
       task.assignedTo === appUser?.uid);
    const isCreatedByLeader = task.createdBy === appUser?.email;
    return isAssignedToTeam || isCreatedByLeader;
  });

  // Actions
  const assignApplication = useCallback(async (appId: string, counsellorEmail: string) => {
    const appRef = doc(db, "applications", appId);
    
    // Find application display info
    const appData = applications.find(a => a.id === appId);
    const appNum = appData?.applicationNumber || "APP";

    await updateDoc(appRef, {
      assignedCounsellor: counsellorEmail,
      updatedAt: Date.now()
    });

    await logAuditEvent(
      "APPLICATION_ASSIGNED",
      appUser?.email || "Unknown",
      "Application",
      `Assigned application ${appNum} to counsellor ${counsellorEmail}`,
      appId,
      appUser?.role
    );
  }, [applications, appUser]);

  const bulkAssignApplications = useCallback(async (appIds: string[], counsellorEmail: string) => {
    const targetCounsellor = users.find((u) => u.email === counsellorEmail);
    if (!targetCounsellor) return;

    for (const appId of appIds) {
      const appRef = doc(db, "applications", appId);
      const appData = applications.find(a => a.id === appId);
      const appNum = appData?.applicationNumber || "APP";

      await updateDoc(appRef, {
        assignedCounsellor: counsellorEmail,
        updatedAt: Date.now()
      });

      await logAuditEvent(
        "APPLICATION_ASSIGNED",
        appUser?.email || "Unknown",
        "Application",
        `Bulk assigned application ${appNum} to counsellor ${counsellorEmail}`,
        appId,
        appUser?.role
      );
    }
  }, [users, applications, appUser]);

  const assignLead = useCallback(async (leadId: string, counsellorEmailOrUid: string) => {
    // Find if user provided UID or email
    const target = users.find(
      (u) => u.email === counsellorEmailOrUid || u.uid === counsellorEmailOrUid
    );
    const resolvedId = target ? target.uid : counsellorEmailOrUid;
    const resolvedEmail = target ? target.email : counsellorEmailOrUid;

    const leadRef = doc(db, "leads", leadId);
    const leadData = leads.find(l => l.id === leadId);
    const leadName = leadData?.fullName || "Lead";

    await updateDoc(leadRef, {
      assignedTo: resolvedId,
      updatedAt: Date.now()
    });

    await logAuditEvent(
      "LEAD_ASSIGNED",
      appUser?.email || "Unknown",
      "Lead",
      `Assigned lead ${leadName} to counsellor ${resolvedEmail}`,
      leadId,
      appUser?.role
    );
  }, [users, leads, appUser]);

  const createTask = useCallback(async (
    title: string,
    description: string,
    dueDate: string,
    priority: TaskPriority,
    assignedToEmail: string,
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
      assignedTo: assignedToEmail,
      createdBy: appUser?.email || "Team Leader",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, "tasks"), newTask);
    await logAuditEvent(
      "TASK_CREATED",
      appUser?.email || "Unknown",
      "Task",
      `Created and assigned task "${title}" to ${assignedToEmail}`,
      docRef.id,
      appUser?.role
    );
  }, [appUser]);

  const toggleTask = useCallback(async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "Completed" ? "Open" : "Completed";
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      status: newStatus,
      updatedAt: Date.now()
    });
  }, []);

  return {
    office,
    team,
    counsellors,
    applications: teamApplications,
    assignmentApplications,
    leads: teamLeads,
    students: teamStudents,
    tasks: teamTasks,
    loading,
    error,
    assignApplication,
    bulkAssignApplications,
    assignLead,
    createTask,
    toggleTask
  };
};
