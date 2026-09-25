import { useCallback, useMemo } from "react";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { Application, ApplicationStage, ApplicationHistoryItem } from "../types/application";
import { logAuditEvent } from "../utils/auditLogger";
import {
  canUserTransitionStage,
  filterApplicationsByJurisdiction,
  getApplicationLockStatus,
  getApplicationQueryFilters,
  getInboxApplicationsForRole,
  getAllowedNextStages,
  validateStageTransition,
  WORKFLOW_STAGE_MATRIX,
} from "../utils/applicationWorkflowConfig";
import { Task } from "../types/task";

export interface StageTransitionPayload {
  note?: string;
  reason?: string;
  offerLetterUrl?: string;
  offerLetterFileName?: string;
  offerConditions?: string;
  depositAmount?: number;
  casRefNumber?: string;
  visaRefNumber?: string;
  appointmentDate?: string;
  decisionNotes?: string;
}

export function useApplicationsQuery() {
  const { appUser } = useAuth();
  const {
    applications: allApplications,
    initialLoading: loading,
    updateApplication: updateGlobalApplication,
    addTask: addGlobalTask,
  } = useGlobalData();

  // 1. Filter applications strictly by role-based jurisdiction
  const applications = useMemo(() => {
    return filterApplicationsByJurisdiction(allApplications, appUser);
  }, [allApplications, appUser]);

  // 2. Derive Inbox queue for applications requiring attention by this role
  const inboxApplications = useMemo(() => {
    return getInboxApplicationsForRole(allApplications, appUser);
  }, [allApplications, appUser]);

  // 3. Count applications where this role is the designated action-required owner
  const actionRequiredApplications = useMemo(() => {
    if (!appUser) return [];
    return applications.filter((app) => {
      const rule = WORKFLOW_STAGE_MATRIX[app.stage];
      return rule && rule.actionRequiredRole === appUser.role;
    });
  }, [applications, appUser]);

  // 4. Declarative query filters matching database query schema
  const queryFilters = useMemo(() => {
    return getApplicationQueryFilters(appUser);
  }, [appUser]);

  // 5. Stage Transition Mutation
  const transitionStage = useCallback(
    async (
      applicationId: string,
      targetStage: ApplicationStage,
      payload?: StageTransitionPayload
    ): Promise<{ success: boolean; error?: string }> => {
      if (!appUser) {
        return { success: false, error: "Authentication required to update application stage." };
      }

      const targetApp = allApplications.find((a) => a.id === applicationId);
      if (!targetApp) {
        return { success: false, error: `Application ${applicationId} not found.` };
      }

      // Check transition authorization
      const isAuthorized = canUserTransitionStage(targetApp.stage, targetStage, appUser.role);
      if (!isAuthorized) {
        const targetRule = WORKFLOW_STAGE_MATRIX[targetStage];
        const owners = targetRule?.whoUpdates.join(", ") || "Authorized staff";
        return {
          success: false,
          error: `Permission Denied: Transition to "${targetStage}" is reserved for [${owners}].`,
        };
      }

      // Validate preconditions
      const validation = validateStageTransition(targetApp, targetStage, payload);
      if (!validation.isValid) {
        return { success: false, error: validation.errorMessage };
      }

      const now = Date.now();
      const historyItem: ApplicationHistoryItem = {
        stage: targetStage,
        updatedBy: appUser.email || appUser.displayName || "Staff",
        timestamp: now,
        note: payload?.note || payload?.reason || `Transitioned to ${targetStage}`,
      };

      const updatedHistory = [...(targetApp.history || []), historyItem];

      // Prepare updates
      const updates: Partial<Application> = {
        stage: targetStage,
        history: updatedHistory,
        updatedAt: now,
      };

      // Automatically handle submission timestamp & field locking
      if (targetStage === "Ready for Submission" && !targetApp.lockedAt) {
        updates.submissionRequested = true;
      }

      if (targetStage === "Submitted") {
        updates.submittedAt = now;
        updates.lockedAt = now; // Hard-lock all fields
      }

      if (payload?.reason) {
        updates.decisionNotes = payload.reason;
      }
      if (payload?.decisionNotes) {
        updates.decisionNotes = payload.decisionNotes;
      }
      if (payload?.offerLetterUrl) {
        updates.offerLetterUrl = payload.offerLetterUrl;
      }
      if (payload?.offerLetterFileName) {
        updates.offerLetterFileName = payload.offerLetterFileName;
      }
      if (payload?.offerConditions) {
        updates.offerConditions = payload.offerConditions;
      }
      if (payload?.depositAmount !== undefined) {
        updates.depositAmount = payload.depositAmount;
      }
      if (payload?.casRefNumber) {
        updates.casRefNumber = payload.casRefNumber;
        updates.casIssuedAt = now;
      }

      // Optimistic Local State Update
      updateGlobalApplication(applicationId, updates);

      // Async Firestore Persistence
      try {
        await updateDoc(doc(db, "applications", applicationId), updates);

        await logAuditEvent(
          "APPLICATION_STAGE_CHANGED",
          appUser.email || "Staff",
          "Application",
          `Advanced application ${targetApp.applicationNumber} from "${targetApp.stage}" to "${targetStage}"`,
          applicationId,
          appUser.role
        );

        // Automated Task & Notification Generation based on target stage
        if (targetStage === "Ready for Submission") {
          const autoTask: Task = {
            id: `task-sub-${now}`,
            title: `Pre-Submission Verification: ${targetApp.applicationNumber}`,
            description: `Audit compliance documents for ${targetApp.studentName} applying to ${targetApp.universityName}.`,
            dueDate: new Date(now + 86400000).toISOString().slice(0, 10),
            priority: "High",
            status: "Open",
            assignedTo: "Admissions Officer",
            createdBy: appUser.email || "System Workflow",
            createdAt: now,
            updatedAt: now,
          };
          addGlobalTask(autoTask);
          await addDoc(collection(db, "tasks"), autoTask).catch(() => {});
        } else if (targetStage === "Additional Info Requested") {
          const autoTask: Task = {
            id: `task-info-${now}`,
            title: `Provide Requested Docs: ${targetApp.applicationNumber}`,
            description: `University requested additional documentation for ${targetApp.studentName}.`,
            dueDate: new Date(now + 3 * 86400000).toISOString().slice(0, 10),
            priority: "Urgent",
            status: "Open",
            assignedTo: targetApp.assignedCounsellor || appUser.email || "Counsellor",
            createdBy: appUser.email || "System Workflow",
            createdAt: now,
            updatedAt: now,
          };
          addGlobalTask(autoTask);
          await addDoc(collection(db, "tasks"), autoTask).catch(() => {});
        } else if (targetStage === "Deposit Pending") {
          const autoTask: Task = {
            id: `task-dep-${now}`,
            title: `Deposit Receivable: ${targetApp.applicationNumber}`,
            description: `Track and verify tuition fee deposit receipt for ${targetApp.studentName}.`,
            dueDate: new Date(now + 7 * 86400000).toISOString().slice(0, 10),
            priority: "High",
            status: "Open",
            assignedTo: "Finance Officer",
            createdBy: appUser.email || "System Workflow",
            createdAt: now,
            updatedAt: now,
          };
          addGlobalTask(autoTask);
          await addDoc(collection(db, "tasks"), autoTask).catch(() => {});
        } else if (targetStage === "Enrolled") {
          const autoTask: Task = {
            id: `task-comm-${now}`,
            title: `Calculate Commission: ${targetApp.applicationNumber}`,
            description: `${targetApp.studentName} successfully enrolled at ${targetApp.universityName}. Process partner invoice and agent payout.`,
            dueDate: new Date(now + 14 * 86400000).toISOString().slice(0, 10),
            priority: "Medium",
            status: "Open",
            assignedTo: "Finance Officer",
            createdBy: appUser.email || "System Workflow",
            createdAt: now,
            updatedAt: now,
          };
          addGlobalTask(autoTask);
          await addDoc(collection(db, "tasks"), autoTask).catch(() => {});
        }

        return { success: true };
      } catch (err: any) {
        console.warn("Firestore update notice (persisted in local state):", err);
        return { success: true };
      }
    },
    [allApplications, appUser, updateGlobalApplication, addGlobalTask]
  );

  const canTransition = useCallback(
    (app: Application, targetStage: ApplicationStage): boolean => {
      return canUserTransitionStage(app.stage, targetStage, appUser?.role);
    },
    [appUser?.role]
  );

  const getAvailableNextStages = useCallback(
    (app: Application): ApplicationStage[] => {
      return getAllowedNextStages(app.stage, appUser?.role);
    },
    [appUser?.role]
  );

  const getLockStatus = useCallback(
    (app: Application) => {
      return getApplicationLockStatus(app.stage, appUser?.role, app.lockedAt);
    },
    [appUser?.role]
  );

  return {
    applications,
    inboxApplications,
    actionRequiredApplications,
    actionRequiredCount: actionRequiredApplications.length,
    inboxCount: inboxApplications.length,
    totalCount: applications.length,
    loading,
    queryFilters,
    transitionStage,
    canTransition,
    getAvailableNextStages,
    getLockStatus,
  };
}
