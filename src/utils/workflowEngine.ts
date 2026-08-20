/**
 * EduCRM Workflow Automation Rules Engine
 * Evaluates entity events (Lead, Application, Student, Document) and executes
 * automated actions (create task, send notification, update field, assign counsellor, log audit).
 */

import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { autoAssignLead } from "./leadRouter";
import { logAuditEvent } from "./auditLogger";

export interface WorkflowCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: any;
}

export interface WorkflowAction {
  type: "create_task" | "send_notification" | "update_field" | "assign_counsellor" | "log_audit";
  config: {
    // For create_task
    taskTitle?: string;
    taskDescription?: string;
    taskPriority?: "Low" | "Medium" | "High" | "Urgent";
    dueDaysOffset?: number;
    assignToField?: string; // e.g. "assignedTo" or fixed email
    // For send_notification
    notificationTitle?: string;
    notificationMessage?: string;
    targetRole?: string;
    targetField?: string; // e.g. "email" or "assignedTo"
    // For update_field
    targetFieldToUpdate?: string;
    targetValueToSet?: any;
    // For log_audit
    auditAction?: string;
    auditDetails?: string;
  };
}

export interface WorkflowRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    entity: "lead" | "application" | "student" | "document";
    event: "created" | "stage_changed" | "field_updated";
    condition?: WorkflowCondition;
  };
  actions: WorkflowAction[];
}

export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "rule_new_lead_task",
    name: "New Lead Follow-Up (24h SLA)",
    enabled: true,
    trigger: {
      entity: "lead",
      event: "created",
    },
    actions: [
      {
        type: "create_task",
        config: {
          taskTitle: "Initial Student Discovery Call",
          taskDescription: "Contact the new inbound lead within 24 hours to assess study destination & qualification eligibility.",
          taskPriority: "High",
          dueDaysOffset: 1,
          assignToField: "assignedTo",
        },
      },
      {
        type: "log_audit",
        config: {
          auditAction: "WORKFLOW_TRIGGERED",
          auditDetails: "Triggered 24h discovery call task for new lead",
        },
      },
    ],
  },
  {
    id: "rule_doc_pending_tasks",
    name: "Application Documents Collection Checklist",
    enabled: true,
    trigger: {
      entity: "application",
      event: "stage_changed",
      condition: { field: "stage", operator: "equals", value: "Documents Pending" },
    },
    actions: [
      {
        type: "create_task",
        config: {
          taskTitle: "Collect Mandatory Application Documents",
          taskDescription: "Obtain certified passport copy, official academic transcripts, and English proficiency test certificate.",
          taskPriority: "Urgent",
          dueDaysOffset: 3,
          assignToField: "assignedCounsellor",
        },
      },
    ],
  },
  {
    id: "rule_conditional_offer_notification",
    name: "Conditional Offer Student Notification",
    enabled: true,
    trigger: {
      entity: "application",
      event: "stage_changed",
      condition: { field: "stage", operator: "equals", value: "Conditional Offer" },
    },
    actions: [
      {
        type: "send_notification",
        config: {
          notificationTitle: "🎉 Conditional Offer Issued!",
          notificationMessage: "University has issued a Conditional Offer letter. Please review academic conditions with your counsellor.",
          targetField: "studentEmail",
        },
      },
      {
        type: "create_task",
        config: {
          taskTitle: "Verify Conditional Offer Criteria with Student",
          taskDescription: "Schedule a session to explain deposit deadlines and condition fulfillment requirements.",
          taskPriority: "High",
          dueDaysOffset: 2,
          assignToField: "assignedCounsellor",
        },
      },
    ],
  },
  {
    id: "rule_cas_issued_visa_prep",
    name: "CAS Issued → Visa Preparation Task",
    enabled: true,
    trigger: {
      entity: "application",
      event: "stage_changed",
      condition: { field: "stage", operator: "equals", value: "CAS Issued" },
    },
    actions: [
      {
        type: "create_task",
        config: {
          taskTitle: "Initiate Student Visa Application Dossier",
          taskDescription: "CAS number received. Prepare financial maintenance statements, TB test, and book biometric visa appointment.",
          taskPriority: "Urgent",
          dueDaysOffset: 2,
          assignToField: "assignedCounsellor",
        },
      },
    ],
  },
];

/**
 * Fetch all enabled workflow rules from Firestore (or fallback to defaults).
 */
export async function getWorkflowRules(): Promise<WorkflowRule[]> {
  try {
    const snap = await getDoc(doc(db, "config", "workflow_rules"));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.rules)) {
        return data.rules;
      }
    }
  } catch (err) {
    console.warn("Using default workflow rules:", err);
  }
  return DEFAULT_WORKFLOW_RULES;
}

/**
 * Evaluate if a condition matches record data.
 */
function evaluateCondition(condition: WorkflowCondition, data: Record<string, any>): boolean {
  const val = data[condition.field];
  switch (condition.operator) {
    case "equals":
      return String(val) === String(condition.value);
    case "not_equals":
      return String(val) !== String(condition.value);
    case "contains":
      return String(val).toLowerCase().includes(String(condition.value).toLowerCase());
    case "greater_than":
      return Number(val) > Number(condition.value);
    case "less_than":
      return Number(val) < Number(condition.value);
    default:
      return false;
  }
}

/**
 * Execute automation rules for an entity lifecycle event.
 */
export async function executeWorkflowRules(
  entity: "lead" | "application" | "student" | "document",
  event: "created" | "stage_changed" | "field_updated",
  data: Record<string, any>,
  previousData?: Record<string, any>
): Promise<number> {
  const rules = await getWorkflowRules();
  let executedActionCount = 0;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.trigger.entity !== entity) continue;
    if (rule.trigger.event !== event) continue;

    // Check condition if specified
    if (rule.trigger.condition && !evaluateCondition(rule.trigger.condition, data)) {
      continue;
    }

    // For stage_changed, check if stage actually changed
    if (event === "stage_changed" && previousData && previousData.stage === data.stage) {
      continue;
    }

    // Execute actions
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case "create_task": {
            const dueOffset = action.config.dueDaysOffset || 1;
            const dueDate = new Date(Date.now() + dueOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const assignedTo = action.config.assignToField ? data[action.config.assignToField] : "Unassigned";

            await addDoc(collection(db, "tasks"), {
              title: action.config.taskTitle || "Automated Workflow Task",
              description: action.config.taskDescription || "",
              priority: action.config.taskPriority || "Medium",
              status: "Open",
              dueDate,
              assignedTo: assignedTo || "Unassigned",
              linkedEntityType: entity,
              linkedEntityId: data.id || "",
              linkedEntityName: data.fullName || data.studentName || data.title || "",
              createdBy: "Workflow Automation Engine",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            executedActionCount++;
            break;
          }

          case "send_notification": {
            const target = action.config.targetField ? data[action.config.targetField] : null;
            await addDoc(collection(db, "notifications"), {
              title: action.config.notificationTitle || "System Notification",
              message: action.config.notificationMessage || "",
              type: "stage_change",
              read: false,
              targetUser: target || "all",
              createdAt: Date.now(),
            });
            executedActionCount++;
            break;
          }

          case "update_field": {
            if (action.config.targetFieldToUpdate && data.id) {
              const colName = entity === "lead" ? "leads" : entity === "application" ? "applications" : entity === "student" ? "students" : "student_documents";
              await updateDoc(doc(db, colName, data.id), {
                [action.config.targetFieldToUpdate]: action.config.targetValueToSet,
                updatedAt: Date.now(),
              });
              executedActionCount++;
            }
            break;
          }

          case "assign_counsellor": {
            if (data.id && entity === "lead") {
              const assigned = await autoAssignLead(data);
              if (assigned) {
                await updateDoc(doc(db, "leads", data.id), {
                  assignedTo: assigned.counsellorId,
                  assignedCounsellor: assigned.counsellorName,
                  assignedAt: Date.now(),
                  updatedAt: Date.now(),
                });
                executedActionCount++;
              }
            }
            break;
          }

          case "log_audit": {
            await logAuditEvent(
              action.config.auditAction || "WORKFLOW_ACTION",
              "Workflow Engine",
              entity,
              action.config.auditDetails || `Triggered by rule '${rule.name}'`,
              data.id,
              "system"
            );
            executedActionCount++;
            break;
          }
        }
      } catch (actionErr) {
        console.warn(`Failed to execute action in rule '${rule.name}':`, actionErr);
      }
    }
  }

  return executedActionCount;
}
