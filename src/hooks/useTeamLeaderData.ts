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
  const office = appUser?.office || "Toronto Office";
  const team = appUser?.team || "Americas Team";

  // Filter team members (Counsellors under the same office & team, with fallback to all counsellors)
  const scopedCounsellors = users.filter(
    (u) => u.role === "counsellor" && u.office === office && u.team === team
  );
  const counsellors = scopedCounsellors.length > 0 ? scopedCounsellors : users.filter((u) => u.role === "counsellor");

  const teamCounsellorEmails = counsellors.map((c) => c.email);
  const teamCounsellorUids = counsellors.map((c) => c.uid);

  // Filter Applications
  const filteredTeamApplications = applications.filter((app) => {
    if (!app.assignedCounsellor) return false;
    // Check if the application is assigned to one of the team's counsellors or the leader themselves
    return (
      teamCounsellorEmails.includes(app.assignedCounsellor) ||
      app.assignedCounsellor === appUser?.email
    );
  });
  const teamApplications = filteredTeamApplications.length > 0 ? filteredTeamApplications : applications;

  // Unassigned applications must be available to a leader for initial allocation.
  const assignmentApplications = applications.filter(
    (app) => !app.assignedCounsellor || teamApplications.some((teamApp) => teamApp.id === app.id)
  );

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
    const appData = applications.find(a => a.id === appId);
    const appNum = appData?.applicationNumber || "APP";

    // Optimistic update
    updateGlobalApplication(appId, { assignedCounsellor: counsellorEmail, updatedAt: Date.now() });

    try {
      const appRef = doc(db, "applications", appId);
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
    } catch (err) {
      console.warn("Firestore update notice (persisted in local state):", err);
    }
  }, [applications, appUser, updateGlobalApplication]);

  const bulkAssignApplications = useCallback(async (appIds: string[], counsellorEmail: string) => {
    const targetCounsellor = users.find((u) => u.email === counsellorEmail);
    if (!targetCounsellor) return;

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
      assignedTo: assignedToEmail,
      createdBy: appUser?.email || "Team Leader",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTask(newTask);

    try {
      const docRef = await addDoc(collection(db, "tasks"), newTask);
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
