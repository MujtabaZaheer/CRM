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
import { Task, TaskPriority, TaskStatus } from "../types/task";
import { logAuditEvent } from "../utils/auditLogger";

export const useTeamLeaderData = () => {
  const { appUser } = useAuth();
  const {
    users,
    applications,
    leads,
    students,
    tasks,
    initialLoading: loading,
    error,
    addTask,
    updateTask: updateGlobalTask,
    updateLead: updateGlobalLead,
    updateApplication: updateGlobalApplication,
  } = useGlobalData();
  
  // Scopes (defaulting if not assigned yet)
  const office = appUser?.office || "London HQ";
  const team = appUser?.team || "Global Team";

  // Filter team members (Counsellors under the same office & team, with fallback to all counsellors)
  const scopedCounsellors = users.filter(
    (u) => u.role === "counsellor" && (!appUser?.office || u.office === office) && (!appUser?.team || u.team === team)
  );
  const counsellors = scopedCounsellors.length > 0 ? scopedCounsellors : users.filter((u) => u.role === "counsellor");

  const teamCounsellorEmails = counsellors.map((c) => c.email);
  const teamCounsellorUids = counsellors.map((c) => c.uid);

  // Applications Pool:
  // Team Leader oversees applications assigned to their team counsellors + all unassigned applications needing distribution
  const teamApplications = applications.filter((app) => {
    if (!app.assignedCounsellor) return true; // Unassigned applications always visible for allocation
    return (
      teamCounsellorEmails.includes(app.assignedCounsellor) ||
      app.assignedCounsellor === appUser?.email
    );
  });

  const unassignedApplications = teamApplications.filter((app) => !app.assignedCounsellor);
  const assignedApplications = teamApplications.filter((app) => !!app.assignedCounsellor);

  // Filter Leads (including unassigned leads in the same office/team context, or assigned to counsellors/leader)
  const filteredTeamLeads = leads.filter((lead) => {
    if (!lead.assignedTo) return true; // Show unassigned leads so they can be assigned
    return (
      teamCounsellorUids.includes(lead.assignedTo) ||
      teamCounsellorEmails.includes(lead.assignedTo) ||
      lead.assignedTo === appUser?.uid ||
      lead.assignedTo === appUser?.email
    );
  });
  const teamLeads = filteredTeamLeads.length > 0 ? filteredTeamLeads : leads;

  // Filter Students
  const teamStudents = students.filter((student) => {
    if (!student.assignedCounsellorId) return true; // Show unassigned students
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

  // Helper to strip undefined values for Firestore
  const cleanPayload = (obj: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        cleaned[k] = v;
      }
    }
    return cleaned;
  };

  // Actions
  const assignApplication = useCallback(async (appId: string, counsellorEmail: string) => {
    const appData = applications.find(a => a.id === appId);
    const appNum = appData?.applicationNumber || "APP";
    const targetCounsellor = users.find(
      (u) => (u.email || "").toLowerCase().trim() === counsellorEmail.toLowerCase().trim()
    );

    // Optimistic update
    updateGlobalApplication(appId, { assignedCounsellor: counsellorEmail, updatedAt: Date.now() });

    try {
      const appRef = doc(db, "applications", appId);
      await updateDoc(appRef, {
        assignedCounsellor: counsellorEmail,
        updatedAt: Date.now()
      });

      // Synchronize assigned counsellor on the associated student record
      if (appData?.studentId) {
        try {
          await updateDoc(doc(db, "students", appData.studentId), {
            assignedCounsellor: targetCounsellor?.displayName || counsellorEmail,
            assignedCounsellorId: targetCounsellor?.uid || counsellorEmail,
            updatedAt: Date.now(),
          });
        } catch (_) {}
      }

      await logAuditEvent(
        "APPLICATION_ASSIGNED",
        appUser?.email || "Unknown",
        "Application",
        `Assigned application ${appNum} to counsellor ${counsellorEmail}`,
        appId,
        appUser?.role
      );
    } catch (err) {
      console.warn("Firestore update notice (persisted in local state):", err);
    }
  }, [applications, users, appUser, updateGlobalApplication]);

  const bulkAssignApplications = useCallback(async (appIds: string[], counsellorEmail: string) => {
    const targetCounsellor = users.find(
      (u) => (u.email || "").toLowerCase().trim() === counsellorEmail.toLowerCase().trim()
    );

    for (const appId of appIds) {
      const appData = applications.find(a => a.id === appId);
      const appNum = appData?.applicationNumber || "APP";

      updateGlobalApplication(appId, { assignedCounsellor: counsellorEmail, updatedAt: Date.now() });

      try {
        const appRef = doc(db, "applications", appId);
        await updateDoc(appRef, {
          assignedCounsellor: counsellorEmail,
          updatedAt: Date.now()
        });

        // Synchronize assigned counsellor on the associated student record
        if (appData?.studentId) {
          try {
            await updateDoc(doc(db, "students", appData.studentId), {
              assignedCounsellor: targetCounsellor?.displayName || counsellorEmail,
              assignedCounsellorId: targetCounsellor?.uid || counsellorEmail,
              updatedAt: Date.now(),
            });
          } catch (_) {}
        }

        await logAuditEvent(
          "APPLICATION_ASSIGNED",
          appUser?.email || "Unknown",
          "Application",
          `Bulk assigned application ${appNum} to counsellor ${counsellorEmail}`,
          appId,
          appUser?.role
        );
      } catch (err) {
        console.warn("Firestore update notice (persisted in local state):", err);
      }
    }
  }, [users, applications, appUser, updateGlobalApplication]);

  const assignLead = useCallback(async (leadId: string, counsellorEmailOrUid: string) => {
    const target = users.find(
      (u) => u.email === counsellorEmailOrUid || u.uid === counsellorEmailOrUid
    );
    const resolvedId = target ? target.uid : counsellorEmailOrUid;
    const resolvedEmail = target ? target.email : counsellorEmailOrUid;

    const leadData = leads.find(l => l.id === leadId);
    const leadName = leadData?.fullName || "Lead";

    updateGlobalLead(leadId, { assignedTo: resolvedId, updatedAt: Date.now() });

    try {
      const leadRef = doc(db, "leads", leadId);
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
    } catch (err) {
      console.warn("Firestore update notice (persisted in local state):", err);
    }
  }, [users, leads, appUser, updateGlobalLead]);

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
    const newTaskId = `task-${Date.now()}`;
    const rawTask: Task = {
      id: newTaskId,
      title,
      description,
      dueDate,
      priority,
      status: "Open",
      assignedTo: assignedToEmail,
      createdBy: appUser?.email || "Team Leader",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (linkedEntityId) rawTask.linkedEntityId = linkedEntityId;
    if (linkedEntityName) rawTask.linkedEntityName = linkedEntityName;
    if (linkedEntityType) rawTask.linkedEntityType = linkedEntityType;

    addTask(rawTask);

    try {
      const sanitizedPayload = cleanPayload(rawTask);
      const docRef = await addDoc(collection(db, "tasks"), sanitizedPayload);
      await logAuditEvent(
        "TASK_CREATED",
        appUser?.email || "Unknown",
        "Task",
        `Created and assigned task "${title}" to ${assignedToEmail}`,
        docRef.id,
        appUser?.role
      );
    } catch (err) {
      console.warn("Firestore task notice (persisted in local state):", err);
    }
  }, [appUser, addTask]);

  const toggleTask = useCallback(async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "Completed" ? "Open" : "Completed";
    updateGlobalTask(taskId, { status: newStatus, updatedAt: Date.now() });

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.warn("Firestore task notice (persisted in local state):", err);
    }
  }, [updateGlobalTask]);

  // SLA / High-priority Escalation (CRM.pdf 3.11.9)
  const escalateTask = useCallback(async (taskId: string) => {
    updateGlobalTask(taskId, { priority: "High", updatedAt: Date.now() });

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        priority: "High",
        updatedAt: Date.now()
      });
      await logAuditEvent(
        "TASK_ESCALATED",
        appUser?.email || "Team Leader",
        "Task",
        `Escalated task ${taskId} to High Priority (SLA Escalation)`,
        taskId,
        appUser?.role
      );
    } catch (err) {
      console.warn("Firestore task escalation notice:", err);
    }
  }, [appUser, updateGlobalTask]);

  // Workload Auto-Balancing (CRM.pdf Page 1 & 40)
  const autoBalanceWorkloads = useCallback(async (): Promise<number> => {
    const unassigned = applications.filter((a) => !a.assignedCounsellor);
    if (unassigned.length === 0 || counsellors.length === 0) return 0;

    // Track dynamic loads
    const loads = counsellors.map((c) => ({
      counsellor: c,
      count: applications.filter((a) => a.assignedCounsellor === c.email).length
    }));

    let distributed = 0;
    for (const app of unassigned) {
      loads.sort((a, b) => a.count - b.count);
      const target = loads[0];

      await assignApplication(app.id, target.counsellor.email);
      target.count++;
      distributed++;
    }

    return distributed;
  }, [applications, counsellors, assignApplication]);

  return {
    office,
    team,
    counsellors,
    applications: teamApplications,
    assignmentApplications: teamApplications,
    unassignedApplications,
    assignedApplications,
    leads: teamLeads,
    students: teamStudents,
    tasks: teamTasks,
    allApplications: applications,
    allStudents: students,
    allLeads: leads,
    loading,
    error,
    assignApplication,
    bulkAssignApplications,
    assignLead,
    createTask,
    toggleTask,
    escalateTask,
    autoBalanceWorkloads
  };
};
