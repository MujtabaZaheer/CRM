import React, { useState } from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { db } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  Plus, 
  SlidersHorizontal,
  Inbox
} from "lucide-react";
import { Task, TaskPriority } from "../../types/task";

export const TeamLeaderTasks: React.FC = () => {
  const {
    counsellors,
    tasks,
    createTask,
    toggleTask
  } = useTeamLeaderData();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounsellor, setSelectedCounsellor] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");

  // Selection for bulk actions
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inspectedTask, setInspectedTask] = useState<Task | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Creation form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [linkedName, setLinkedName] = useState("");
  const linkedType = "student";

  // Categorize tasks
  const nowStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomStr = tomorrow.toISOString().split("T")[0];

  // Bulk Operations
  const handleBulkComplete = async () => {
    try {
      for (const id of selectedTasks) {
        const taskRef = doc(db, "tasks", id);
        await updateDoc(taskRef, {
          status: "Completed",
          updatedAt: Date.now()
        });
      }
      setSelectedTasks([]);
    } catch (err) {
      console.error(err);
      alert("Failed to complete tasks in bulk.");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate || !assignedTo) {
      setErrorMsg("Title, due date, and counsellor allocation are required.");
      return;
    }

    try {
      await createTask(
        title,
        description,
        dueDate,
        priority,
        assignedTo,
        undefined,
        linkedName || undefined,
        linkedName ? linkedType : undefined
      );

      // Reset Form
      setTitle("");
      setDescription("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setPriority("Medium");
      setAssignedTo("");
      setLinkedName("");
      setErrorMsg("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create task.");
    }
  };

  const handleReassignTask = async (taskId: string, newEmail: string) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        assignedTo: newEmail,
        updatedAt: Date.now()
      });
      if (inspectedTask) {
        setInspectedTask({ ...inspectedTask, assignedTo: newEmail });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reassign task.");
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchSearch = (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.linkedEntityName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchCounsellor = selectedCounsellor === "All" || t.assignedTo === selectedCounsellor;
    const matchPriority = selectedPriority === "All" || t.priority === selectedPriority;
    return matchSearch && matchCounsellor && matchPriority;
  });

  const overdue = filteredTasks.filter(t => t.status !== "Completed" && t.dueDate < nowStr);
  const today = filteredTasks.filter(t => t.status !== "Completed" && t.dueDate === nowStr);
  const tomorrowTasks = filteredTasks.filter(t => t.status !== "Completed" && t.dueDate === tomStr);
  const upcoming = filteredTasks.filter(t => t.status !== "Completed" && t.dueDate > tomStr);
  const completed = filteredTasks.filter(t => t.status === "Completed");

  const toggleSelectTask = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, id]);
    } else {
      setSelectedTasks(prev => prev.filter(item => item !== id));
    }
  };

  const renderTaskCard = (t: Task) => {
    const isChecked = selectedTasks.includes(t.id);
    return (
      <div 
        key={t.id} 
        className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card hover:border-emerald-500/20 flex items-start justify-between gap-3 text-xs"
      >
        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => toggleSelectTask(t.id, e.target.checked)}
            className="mt-1 rounded border-[var(--border-default)] text-emerald-500 bg-[var(--bg-input)] focus:ring-emerald-500"
          />
          <div className="flex-1 min-w-0">
            <h4 
              className="font-bold text-sm text-[var(--text-primary)] truncate cursor-pointer hover:text-emerald-400"
              onClick={() => setInspectedTask(t)}
            >
              {t.title}
            </h4>
            <p className="text-[var(--text-secondary)] text-[10px] truncate mt-0.5">{t.description || "No description provided."}</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center text-[10px] text-[var(--text-muted)] space-x-1">
                <Calendar className="w-3 h-3 text-teal-400" />
                <span>Due: {t.dueDate}</span>
              </span>
              {t.linkedEntityName && (
                <span className="px-1.5 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px]">
                  {t.linkedEntityType}: {t.linkedEntityName}
                </span>
              )}
              <span className="px-1.5 py-0.5 sq-badge bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px]">
                Recruiter: {t.assignedTo ? t.assignedTo.split("@")[0] : "None"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`px-2 py-0.5 sq-badge text-[9px] font-bold border ${
            t.priority === "Urgent" || t.priority === "High"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-teal-500/10 text-teal-400 border-teal-500/20"
          }`}>
            {t.priority}
          </span>
          <button
            onClick={() => toggleTask(t.id, t.status)}
            className="p-1 sq-avatar bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/30"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6 text-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Team Action Workload</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Create, allocate, and audit counsellor tasks and student follow-up reminders.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task Allocation</span>
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search tasks by title, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {selectedTasks.length > 0 && (
              <button
                onClick={handleBulkComplete}
                className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold sq-btn hover:bg-emerald-500/20 transition-all"
              >
                Mark Completed ({selectedTasks.length})
              </button>
            )}

            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                value={selectedCounsellor}
                onChange={(e) => setSelectedCounsellor(e.target.value)}
                className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
              >
                <option value="All">All Recruiters</option>
                {counsellors.map((c) => (
                  <option key={c.uid} value={c.email}>{c.displayName || c.email}</option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-2 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Layout Segments */}
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Overdue Tasks ({overdue.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overdue.map(renderTaskCard)}
              </div>
            </div>
          )}

          {/* Grid for categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2 border-b border-[var(--border-default)] pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Today's Actions ({today.length})</span>
              </h3>
              {today.length === 0 ? (
                <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card text-center text-[var(--text-muted)] flex flex-col items-center space-y-2">
                  <Inbox className="w-6 h-6" />
                  <span>No tasks due today.</span>
                </div>
              ) : (
                <div className="space-y-3">{today.map(renderTaskCard)}</div>
              )}
            </div>

            {/* Tomorrow */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2 border-b border-[var(--border-default)] pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span>Tomorrow ({tomorrowTasks.length})</span>
              </h3>
              {tomorrowTasks.length === 0 ? (
                <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card text-center text-[var(--text-muted)] flex flex-col items-center space-y-2">
                  <Inbox className="w-6 h-6" />
                  <span>No tasks due tomorrow.</span>
                </div>
              ) : (
                <div className="space-y-3">{tomorrowTasks.map(renderTaskCard)}</div>
              )}
            </div>
          </div>

          {/* Upcoming Section */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2 border-b border-[var(--border-default)] pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>Upcoming Scheduled Tasks ({upcoming.length})</span>
            </h3>
            {upcoming.length === 0 ? (
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card text-center text-[var(--text-muted)]">
                No future tasks scheduled.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(renderTaskCard)}
              </div>
            )}
          </div>

          {/* Completed Section */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-[var(--text-muted)] flex items-center space-x-2 border-b border-[var(--border-default)] pb-2">
              <Check className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Completed Tasks ({completed.length})</span>
            </h3>
            {completed.length === 0 ? (
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card text-center text-[var(--text-muted)]">
                No completed tasks in archive.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                {completed.map((t) => (
                  <div key={t.id} className="p-3 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-[var(--text-muted)] line-through truncate">{t.title}</h4>
                      <div className="flex items-center space-x-3 text-[10px] text-[var(--text-muted)] mt-1">
                        <span>Due: {t.dueDate}</span>
                        <span>Counsellor: {t.assignedTo ? t.assignedTo.split("@")[0] : "None"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTask(t.id, t.status)}
                      className="p-1 sq-avatar bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Task Modal Overlay */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Allocate Counsellor Task</span>
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

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 uppercase font-bold text-[10px]">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Request transcript files from Michael"
                    className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 uppercase font-bold text-[10px]">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed comments, target university details..."
                    className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 uppercase font-bold text-[10px]">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 uppercase font-bold text-[10px]">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 uppercase font-bold text-[10px]">Assign Recruiter *</label>
                    <select
                      value={assignedTo}
                      required
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    >
                      <option value="">-- Choose Counsellor --</option>
                      {counsellors.map((c) => (
                        <option key={c.uid} value={c.email}>{c.displayName || c.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 uppercase font-bold text-[10px]">Linked Student</label>
                    <input
                      type="text"
                      value={linkedName}
                      onChange={(e) => setLinkedName(e.target.value)}
                      placeholder="e.g. Student Name"
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold sq-btn hover:bg-[var(--bg-elevated)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn hover:bg-emerald-400"
                  >
                    Schedule Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail Inspector Drawer */}
        {inspectedTask && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex justify-end">
            <div className="bg-[var(--bg-card)] border-l border-[var(--border-default)] w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between animate-fade-in">
              <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div>
                    <span className={`px-2 py-0.5 sq-badge font-bold border ${
                      inspectedTask.priority === "Urgent" || inspectedTask.priority === "High"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                    }`}>
                      {inspectedTask.priority}
                    </span>
                    <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mt-1.5">
                      {inspectedTask.title}
                    </h2>
                  </div>
                  <button onClick={() => setInspectedTask(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 sq-btn">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info Fields */}
                <div className="space-y-3">
                  <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Details Description</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{inspectedTask.description || "No comment description details provided."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                      <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Due Date</span>
                      <span className="text-[var(--text-primary)] font-semibold">{inspectedTask.dueDate}</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                      <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Status</span>
                      <span className={`font-bold ${inspectedTask.status === "Completed" ? "text-emerald-400" : "text-amber-400"}`}>
                        {inspectedTask.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-2">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Assignee Recruiter</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-primary)] font-semibold">{inspectedTask.assignedTo}</span>
                      <select
                        value={inspectedTask.assignedTo || ""}
                        onChange={(e) => handleReassignTask(inspectedTask.id, e.target.value)}
                        className="px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-default)] sq-input text-[11px]"
                      >
                        <option value="">Reassign...</option>
                        {counsellors.map(c => (
                          <option key={c.uid} value={c.email}>{c.displayName || c.email.split("@")[0]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                      <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Created By</span>
                      <span className="text-[var(--text-secondary)] font-medium">{inspectedTask.createdBy}</span>
                    </div>
                    {inspectedTask.linkedEntityName && (
                      <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card space-y-1">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Linked Student</span>
                        <span className="text-[var(--text-primary)] font-semibold">{inspectedTask.linkedEntityName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex justify-end space-x-3">
                <button
                  onClick={async () => {
                    await toggleTask(inspectedTask.id, inspectedTask.status);
                    setInspectedTask(null);
                  }}
                  className={`px-4 py-2 font-bold sq-btn border ${
                    inspectedTask.status === "Completed"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                      : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  }`}
                >
                  {inspectedTask.status === "Completed" ? "Re-open Task" : "Mark Task Completed"}
                </button>
                <button
                  onClick={() => setInspectedTask(null)}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold sq-btn hover:bg-[var(--bg-elevated)]"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
export default TeamLeaderTasks;
