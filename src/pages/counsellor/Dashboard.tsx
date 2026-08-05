import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import {
  Users2,
  GraduationCap,
  FileText,
  CheckSquare,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Search,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

export const CounsellorDashboard: React.FC = () => {
  const {
    leads,
    students,
    applications,
    tasks,
    loading,
    error,
    toggleTask,
    createTask
  } = useCounsellorData();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");

  const openTasks = tasks.filter((t) => t.status === "Open");
  const overdueTasks = openTasks.filter((t) => new Date(t.dueDate) < new Date());

  const convertedLeadsCount = leads.filter((l) => l.stage === "Converted").length;
  const leadConversionRate = leads.length > 0 ? Math.round((convertedLeadsCount / leads.length) * 100) : 0;

  const handleQuickCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    await createTask(taskTitle, "Quick dashboard task", taskDueDate, taskPriority);
    setTaskTitle("");
    setIsTaskModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">Loading counsellor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 sq-card text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sq-card relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono mb-2">
            <span>Role: Education Counsellor</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Counsellor Command Center</h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-xl">
            Track prospective students, manage university applications, handle document verification, and manage daily student follow-ups.
          </p>
        </div>
        <div className="flex items-center space-x-3 z-10">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          <Link
            to="/counsellor/programme-matcher"
            className="flex items-center space-x-2 px-4 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] font-semibold sq-btn text-xs transition-all"
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Course Matcher</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/counsellor/leads"
          className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-emerald-500/30 sq-card space-y-2 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
            <span>My Assigned Leads</span>
            <Users2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">{leads.length}</div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-medium">{leads.filter((l) => l.stage === "New").length} New inquiries</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-emerald-400" />
          </div>
        </Link>

        <Link
          to="/counsellor/students"
          className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-teal-500/30 sq-card space-y-2 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
            <span>My Active Students</span>
            <GraduationCap className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">{students.length}</div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-teal-400 font-medium">Student profiles</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-teal-400" />
          </div>
        </Link>

        <Link
          to="/counsellor/applications"
          className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-sky-500/30 sq-card space-y-2 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
            <span>My Applications</span>
            <FileText className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">{applications.length}</div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-sky-400 font-medium">University submissions</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-sky-400" />
          </div>
        </Link>

        <Link
          to="/counsellor/tasks"
          className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-amber-500/30 sq-card space-y-2 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
            <span>Pending Tasks</span>
            <CheckSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">{openTasks.length}</div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-400 font-medium">{overdueTasks.length} Overdue items</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-amber-400" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Tasks & Lead Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actionable Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">My Priority Follow-ups</h3>
              </div>
              <Link to="/counsellor/tasks" className="text-xs text-emerald-400 hover:underline flex items-center space-x-1">
                <span>View all tasks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {openTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                🎉 No open follow-up tasks! You are all caught up.
              </div>
            ) : (
              <div className="space-y-2">
                {openTasks.slice(0, 5).map((task) => {
                  const isOverdue = new Date(task.dueDate) < new Date();
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card flex items-center justify-between hover:border-[var(--border-hover)] transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => toggleTask(task.id, task.status)}
                          className="mt-1 accent-emerald-500 rounded cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">{task.title}</div>
                          {task.linkedEntityName && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              Re: {task.linkedEntityName} ({task.linkedEntityType})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 sq-badge text-[10px] font-mono ${
                            isOverdue
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Applications Pipeline Quick Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">My Recent Applications</h3>
              </div>
              <Link to="/counsellor/applications" className="text-xs text-sky-400 hover:underline flex items-center space-x-1">
                <span>View all applications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase">
                  <tr>
                    <th className="px-3 py-2">App Number</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">University</th>
                    <th className="px-3 py-2">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-[var(--text-muted)]">
                        No applications assigned yet.
                      </td>
                    </tr>
                  ) : (
                    applications.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hover:bg-[var(--bg-hover)]">
                        <td className="px-3 py-2 font-mono text-[var(--text-primary)]">{app.applicationNumber}</td>
                        <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{app.studentName}</td>
                        <td className="px-3 py-2 truncate max-w-[150px]">{app.universityName}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 sq-badge bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px]">
                            {app.stage}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Performance Summary & Shortcuts */}
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-5 space-y-4">
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2 border-b border-[var(--border-default)] pb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Conversion Funnel</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--text-secondary)]">Lead-to-Student Conversion</span>
                  <span className="font-mono text-emerald-400">{leadConversionRate}%</span>
                </div>
                <div className="w-full bg-[var(--bg-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border-default)]">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, leadConversionRate)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text-muted)]">Active Leads</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{leads.length}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text-muted)]">Active Students</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{students.length}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text-muted)]">Submitted Applications</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {applications.filter((a) => a.stage === "Submitted" || a.stage === "Unconditional Offer").length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-5 space-y-3">
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] border-b border-[var(--border-default)] pb-2">
              Counsellor Workspaces
            </h3>
            <div className="space-y-1.5 text-xs">
              <Link
                to="/counsellor/leads"
                className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] sq-btn text-[var(--text-primary)] transition-colors"
              >
                <span>Lead Pipeline & Follow-up</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
              <Link
                to="/counsellor/students"
                className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] sq-btn text-[var(--text-primary)] transition-colors"
              >
                <span>Student Profiles & Scores</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
              <Link
                to="/counsellor/documents"
                className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] sq-btn text-[var(--text-primary)] transition-colors"
              >
                <span>Document Vault & Verification</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
              <Link
                to="/counsellor/programme-matcher"
                className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] sq-btn text-[var(--text-primary)] transition-colors"
              >
                <span>Course Search & Matcher</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Quick Task */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              Add Personal Follow-up Task
            </h3>
            <form onSubmit={handleQuickCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Call Alex re: IELTS test booking"
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
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
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
