import React, { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { Task, TaskPriority, TaskStatus } from "../types/task";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { logAuditEvent } from "../utils/auditLogger";
import { CheckSquare, Plus, Search, Calendar, AlertCircle, X, Check } from "lucide-react";

export const Tasks: React.FC = () => {
  const { appUser } = useAuth();
  const { tasks, addTask, updateTask, initialLoading: loading } = useGlobalData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [linkedEntityType] = useState<"lead" | "student" | "application">("student");
  const [linkedEntityName, setLinkedEntityName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      setErrorMsg("Task title and due date are required.");
      return;
    }

    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title,
      description,
      dueDate,
      priority,
      status: "Open",
      recurrence,
      reminderMinutes,
      linkedEntityType,
      linkedEntityName: linkedEntityName || "General",
      assignedTo: appUser?.email || "Counsellor",
      createdBy: appUser?.email || "User",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic local update
    addTask(newTask);

    try {
      const docRef = await addDoc(collection(db, "tasks"), newTask);
      await logAuditEvent(
        "TASK_CREATED",
        appUser?.email || "Unknown",
        "Task",
        `Created task: ${title}`,
        docRef.id,
        appUser?.role
      );
    } catch (err: any) {
      console.warn("Task saved locally:", err);
    } finally {
      // Reset
      setTitle("");
      setDescription("");
      setRecurrence("none");
      setReminderMinutes(30);
      setLinkedEntityName("");
      setErrorMsg("");
      setIsAddModalOpen(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "Completed" ? "Open" : "Completed";
    updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === "Completed" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });

    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: newStatus,
        completedAt: newStatus === "Completed" ? Date.now() : undefined,
        updatedAt: Date.now(),
      });

      // If completing a recurring task, automatically generate the next occurrence
      if (newStatus === "Completed" && task.recurrence && task.recurrence !== "none") {
        const currentDue = new Date(task.dueDate);
        let nextDueDate = new Date(currentDue);
        if (task.recurrence === "daily") {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (task.recurrence === "weekly") {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (task.recurrence === "monthly") {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        await addDoc(collection(db, "tasks"), {
          title: task.title,
          description: task.description,
          dueDate: nextDueDate.toISOString().slice(0, 10),
          priority: task.priority,
          status: "Open",
          recurrence: task.recurrence,
          linkedEntityType: task.linkedEntityType,
          linkedEntityName: task.linkedEntityName,
          assignedTo: task.assignedTo,
          createdBy: "Recurring Schedule Engine",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("Failed to toggle task status:", err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.linkedEntityName && t.linkedEntityName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Tasks & Reminders</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Follow-up reminders, document requests, and student appointment deadlines.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)]"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-6">
              No tasks found. Click "Create Task" to schedule your reminders.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex items-center justify-between transition-all ${
                  t.status === "Completed" ? "opacity-60" : "hover:border-emerald-500/30"
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <button
                    onClick={() => handleToggleTaskStatus(t)}
                    className={`w-6 h-6 sq-avatar border flex items-center justify-center transition-colors ${
                      t.status === "Completed"
                        ? "bg-emerald-500 text-zinc-950 border-emerald-500"
                        : "border-[var(--border-default)] hover:border-emerald-500 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <div>
                    <h4 className={`font-bold text-sm text-[var(--text-primary)] ${t.status === "Completed" ? "line-through text-[var(--text-muted)]" : ""}`}>
                      {t.title}
                    </h4>
                    <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)] mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-teal-400" />
                        <span>Due: {t.dueDate}</span>
                      </span>
                      {t.linkedEntityName && (
                        <span className="bg-[var(--bg-elevated)] px-2 py-0.5 sq-badge border border-[var(--border-default)] font-medium">
                          {t.linkedEntityType}: {t.linkedEntityName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 sq-badge text-[10px] font-bold border ${
                      t.priority === "Urgent" || t.priority === "High"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Add Task */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                  <span>Create Task / Reminder</span>
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 sq-badge text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Call Sarah regarding IELTS document submission"
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Recurrence</label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value as any)}
                      className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    >
                      <option value="none">One-time Task</option>
                      <option value="daily">Daily Recurring</option>
                      <option value="weekly">Weekly Recurring</option>
                      <option value="monthly">Monthly Recurring</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Reminder Notification</label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value={15}>15 minutes before due</option>
                    <option value={30}>30 minutes before due</option>
                    <option value={60}>1 hour before due</option>
                    <option value={1440}>1 day before due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Linked Entity Name</label>
                  <input
                    type="text"
                    value={linkedEntityName}
                    onChange={(e) => setLinkedEntityName(e.target.value)}
                    placeholder="e.g. Student Name or Application ID"
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium sq-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                  >
                    Schedule Reminder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
