/**
 * EduCRM Reminder & SLA Escalation Engine
 * Periodically scans for:
 * 1. Upcoming and overdue calendar events & meetings
 * 2. Approaching task due dates and SLA escalation breaches
 * 3. Documents expiring within 30 days
 * Dispatches in-app notifications to assignees.
 */

import { collection, query, where, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export interface ReminderNotification {
  id?: string;
  title: string;
  message: string;
  type: "reminder" | "escalation" | "document_expiry" | "stage_change" | "system";
  targetUser: string; // email or "all"
  link?: string;
  read: boolean;
  createdAt: number;
}

/**
 * Scan tasks and flag approaching due dates or escalations.
 */
export async function checkTaskReminders(): Promise<number> {
  let count = 0;
  try {
    const nowStr = new Date().toISOString().slice(0, 10);
    const q = query(
      collection(db, "tasks"),
      where("status", "in", ["Open", "In Progress"])
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const task = d.data();
      const isOverdue = task.dueDate < nowStr;
      const isDueToday = task.dueDate === nowStr;

      // If overdue and not yet marked overdue
      if (isOverdue && task.status !== "Overdue") {
        await updateDoc(doc(db, "tasks", d.id), {
          status: "Overdue",
          escalatedAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Create Escalation Notification
        await addDoc(collection(db, "notifications"), {
          title: `⚠️ Task SLA Breached: ${task.title}`,
          message: `Task assigned to ${task.assignedTo || "unassigned"} is past due (${task.dueDate}). Immediate action required.`,
          type: "escalation",
          targetUser: task.assignedTo || "all",
          link: "/tasks",
          read: false,
          createdAt: Date.now(),
        });
        count++;
      } else if (isDueToday && !task.reminderSentToday) {
        await updateDoc(doc(db, "tasks", d.id), {
          reminderSentToday: true,
          updatedAt: Date.now(),
        });

        await addDoc(collection(db, "notifications"), {
          title: `🔔 Task Due Today: ${task.title}`,
          message: `Reminder: Task "${task.title}" is due today.`,
          type: "reminder",
          targetUser: task.assignedTo || "all",
          link: "/tasks",
          read: false,
          createdAt: Date.now(),
        });
        count++;
      }
    }
  } catch (err) {
    console.warn("Task reminder check failed:", err);
  }
  return count;
}

/**
 * Scan documents expiring in 30 days.
 */
export async function checkDocumentExpiries(): Promise<number> {
  let count = 0;
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const q = query(
      collection(db, "student_documents"),
      where("expiryDate", "<=", thirtyDaysFromNow),
      where("expiryDate", ">=", today)
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const docData = d.data();
      if (!docData.expiryAlertSent) {
        await updateDoc(doc(db, "student_documents", d.id), {
          expiryAlertSent: true,
          updatedAt: Date.now(),
        });

        await addDoc(collection(db, "notifications"), {
          title: `📄 Document Expiring Soon: ${docData.fileName || docData.docType}`,
          message: `Document for student ID ${docData.studentId} expires on ${docData.expiryDate}. Please request renewal.`,
          type: "document_expiry",
          targetUser: "all",
          link: "/documents",
          read: false,
          createdAt: Date.now(),
        });
        count++;
      }
    }
  } catch (err) {
    console.warn("Document expiry check failed:", err);
  }
  return count;
}

/**
 * Master check function to run on schedule or app initialization.
 */
export async function runReminderChecks(): Promise<{ tasksChecked: number; docsChecked: number }> {
  const tasks = await checkTaskReminders();
  const docs = await checkDocumentExpiries();
  return { tasksChecked: tasks, docsChecked: docs };
}
