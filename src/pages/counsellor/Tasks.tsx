import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { TaskPriority } from "../../types/task";
import {
  Plus,
  Calendar,
  Search,
  Users2,
  GraduationCap,
  FileText
} from "lucide-react";

export const CounsellorTasks: React.FC = () => {
  const { tasks, leads, students, applications, createTask, toggleTask, loading } = useCounsellorData();

  const [activeTab, setActiveTab] = useState<"Open" | "Overdue" | "Today" | "Completed">("Open");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("Medium");

  // Linked Entity Selection
  const [linkedEntityType, setLinkedEntityType] = useState<"none" | "lead" | "student" | "application">("none");
  const [linkedEntityId, setLinkedEntityId] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isOverdue = t.status === "Open" && t.dueDate < todayStr;
    const isToday = t.status === "Open" && t.dueDate === todayStr;

    if (!matchesSearch) return false;

    if (activeTab === "Open") return t.status === "Open";
    if (activeTab === "Overdue") return isOverdue;
    if (activeTab === "Today") return isToday;
    if (activeTab === "Completed") return t.status === "Completed";
    return true;
  });

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let entityName: string | undefined;
    let entityId: string | undefined;
    let entityType: "lead" | "student" | "application" | undefined;

    if (linkedEntityType === "lead" && linkedEntityId) {
      const l = leads.find((x) => x.id === linkedEntityId);
      entityName = l?.fullName;
      entityId = l?.id;
      entityType = "lead";
    } else if (linkedEntityType === "student" && linkedEntityId) {
      const s = students.find((x) => x.id === linkedEntityId);
      entityName = s?.fullName;
      entityId = s?.id;
      entityType = "student";
    } else if (linkedEntityType === "application" && linkedEntityId) {
      const a = applications.find((x) => x.id === linkedEntityId);
      entityName = `${a?.applicationNumber} (${a?.studentName})`;
      entityId = a?.id;
      entityType = "application";
    }

    try {
      await createTask(taskTitle, taskDesc, taskDueDate, taskPriority, entityId, entityName, entityType);
    } catch (err) {
      console.warn("Task created locally:", err);
    } finally {
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setLinkedEntityType("none");
      setLinkedEntityId("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">Loading follow-up tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">My Follow-ups & Tasks</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Personal counsellor task list for student follow-up calls, document collection reminders, and submission deadlines.
          </p>
        </div>
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Toolbar & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          {[
            { id: "Open", label: "Open Tasks" },
            { id: "Today", label: "Due Today" },
            { id: "Overdue", label: "Overdue" },
            { id: "Completed", label: "Completed" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 sq-badge text-xs transition-all ${
                activeTab === tab.id
                  ? "bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">
            No tasks found in current view. Click "New Task" to schedule a student follow-up.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue = task.status === "Open" && task.dueDate < todayStr;
            return (
              <div
                key={task.id}
                className={`p-4 bg-[var(--bg-card)] border sq-card flex items-center justify-between hover:border-[var(--border-hover)] transition-all ${
                  task.status === "Completed"
                    ? "opacity-60 border-[var(--border-default)]"
                    : isOverdue
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-[var(--border-default)]"
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <input
                    type="checkbox"
                    checked={task.status === "Completed"}
                    onChange={() => toggleTask(task.id, task.status)}
                    className="mt-1 accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className={`text-xs font-bold text-[var(--text-primary)] ${task.status === "Completed" ? "line-through text-[var(--text-muted)]" : ""}`}>
                      {task.title}
                    </div>
                    {task.description && <p className="text-[11px] text-[var(--text-secondary)]">{task.description}</p>}
                    {task.linkedEntityName && (
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px] text-[var(--text-muted)]">
                        {task.linkedEntityType === "lead" && <Users2 className="w-3 h-3 text-emerald-400" />}
                        {task.linkedEntityType === "student" && <GraduationCap className="w-3 h-3 text-teal-400" />}
                        {task.linkedEntityType === "application" && <FileText className="w-3 h-3 text-sky-400" />}
                        <span>{task.linkedEntityName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-1 sq-badge font-mono text-[10px] ${
                      task.priority === "High"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : task.priority === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {task.priority}
                  </span>

                  <span
                    className={`px-2.5 py-1 sq-badge font-mono text-[10px] flex items-center space-x-1 ${
                      isOverdue
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{task.dueDate}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              Create Follow-up Task
            </h3>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Call Alex regarding missing bank statement"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Task Details</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Additional context or notes..."
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Link to Record (Optional)</label>
                <select
                  value={linkedEntityType}
                  onChange={(e) => {
                    setLinkedEntityType(e.target.value as any);
                    setLinkedEntityId("");
                  }}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)] mb-2"
                >
                  <option value="none">-- No Linked Record --</option>
                  <option value="lead">Link to Lead</option>
                  <option value="student">Link to Student Profile</option>
                  <option value="application">Link to Application</option>
                </select>

                {linkedEntityType === "lead" && (
                  <select
                    value={linkedEntityId}
                    onChange={(e) => setLinkedEntityId(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.fullName} ({l.email})</option>
                    ))}
                  </select>
                )}

                {linkedEntityType === "student" && (
                  <select
                    value={linkedEntityId}
                    onChange={(e) => setLinkedEntityId(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>
                    ))}
                  </select>
                )}

                {linkedEntityType === "application" && (
                  <select
                    value={linkedEntityId}
                    onChange={(e) => setLinkedEntityId(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="">-- Choose Application --</option>
                    {applications.map((a) => (
                      <option key={a.id} value={a.id}>{a.applicationNumber} - {a.studentName}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] sq-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
