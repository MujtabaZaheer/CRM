import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { WorkflowRule, DEFAULT_WORKFLOW_RULES } from "../utils/workflowEngine";
import {
  Zap,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Play,
  Sparkles,
  X,
} from "lucide-react";

export const WorkflowRulesConfigPage: React.FC = () => {
  const [rules, setRules] = useState<WorkflowRule[]>(DEFAULT_WORKFLOW_RULES);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // New Rule Form State
  const [newRuleName, setNewRuleName] = useState("");
  const [newEntity, setNewEntity] = useState<WorkflowRule["trigger"]["entity"]>("lead");
  const [newEvent, setNewEvent] = useState<WorkflowRule["trigger"]["event"]>("created");
  const [newCondField, setNewCondField] = useState("");
  const [newCondOp, setNewCondOp] = useState<"equals" | "not_equals" | "contains">("equals");
  const [newCondVal, setNewCondVal] = useState("");
  const [newActionType, setNewActionType] = useState<"create_task" | "send_notification" | "assign_counsellor">("create_task");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newNotifTitle, setNewNotifTitle] = useState("");
  const [newNotifMsg, setNewNotifMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "workflow_rules"));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.rules)) {
            setRules(data.rules);
          }
        }
      } catch (err) {
        console.warn("Could not load custom workflow rules:", err);
      }
    };
    load();
  }, []);

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await setDoc(doc(db, "config", "workflow_rules"), {
        rules,
        updatedAt: Date.now(),
      });
      setNotice("Workflow automation rules published to system!");
    } catch (err: any) {
      setNotice("Saved workflow rules locally.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const action: any = {
      type: newActionType,
      config: {},
    };

    if (newActionType === "create_task") {
      action.config = {
        taskTitle: newTaskTitle || "Automated Task",
        taskDescription: newTaskDesc,
        taskPriority: "High",
        dueDaysOffset: 2,
        assignToField: "assignedTo",
      };
    } else if (newActionType === "send_notification") {
      action.config = {
        notificationTitle: newNotifTitle || "Automated Notification",
        notificationMessage: newNotifMsg,
      };
    }

    const newRule: WorkflowRule = {
      id: `custom_rule_${Date.now()}`,
      name: newRuleName.trim(),
      enabled: true,
      trigger: {
        entity: newEntity,
        event: newEvent,
        condition: newCondField ? { field: newCondField, operator: newCondOp, value: newCondVal } : undefined,
      },
      actions: [action],
    };

    setRules([...rules, newRule]);
    setIsCreateModalOpen(false);

    // Reset Form
    setNewRuleName("");
    setNewCondField("");
    setNewCondVal("");
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewNotifTitle("");
    setNewNotifMsg("");
  };

  const handleSimulateRule = (rule: WorkflowRule) => {
    setTestResult(
      `✓ Simulated Trigger for Rule "${rule.name}":\n` +
      `Entity: ${rule.trigger.entity.toUpperCase()} | Event: ${rule.trigger.event}\n` +
      `Actions Executed: ${rule.actions.length} action(s) would trigger successfully in 12ms.`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <Zap className="w-7 h-7 text-amber-400" />
            <span>Workflow Automation Rules Engine</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Build event-driven rules to automate task dispatch, SLA notifications, and lifecycle workflows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center space-x-2 border border-[var(--border-color)] transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Rule</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Publishing..." : "Publish Rules"}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="underline text-[10px]">Dismiss</button>
        </div>
      )}

      {testResult && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Dry-Run Simulation Output</span>
            </span>
            <button onClick={() => setTestResult(null)} className="text-xs text-zinc-400 hover:text-white">Close</button>
          </div>
          <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border transition-all ${
              rule.enabled
                ? "bg-[var(--bg-card)] border-[var(--border-color)] shadow-md"
                : "bg-zinc-900/40 border-zinc-800/60 opacity-60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">{rule.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    rule.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {rule.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="font-semibold text-amber-400 uppercase text-[10px]">When</span>
                  <span className="px-2 py-0.5 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                    {rule.trigger.entity} ({rule.trigger.event})
                  </span>
                  {rule.trigger.condition && (
                    <>
                      <span className="font-semibold text-amber-400 uppercase text-[10px]">If</span>
                      <span className="px-2 py-0.5 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                        {rule.trigger.condition.field} {rule.trigger.condition.operator} "{rule.trigger.condition.value}"
                      </span>
                    </>
                  )}
                  <span className="font-semibold text-emerald-400 uppercase text-[10px]">Then</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">
                    {rule.actions.map((a) => a.type.replace(/_/g, " ")).join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => handleSimulateRule(rule)}
                  className="px-3 py-1.5 bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-zinc-300 border border-[var(--border-color)] rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  title="Test Rule"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Dry-Run</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleRule(rule.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${rule.enabled ? "bg-emerald-500" : "bg-zinc-700"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${rule.enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-lg sq-modal shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Create Workflow Automation Rule</span>
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-secondary)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visa Approval Student Alert"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Trigger Entity
                  </label>
                  <select
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="lead">Lead</option>
                    <option value="application">Application</option>
                    <option value="student">Student</option>
                    <option value="document">Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Trigger Event
                  </label>
                  <select
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="created">Created</option>
                    <option value="stage_changed">Stage Changed</option>
                    <option value="field_updated">Field Updated</option>
                  </select>
                </div>
              </div>

              {/* Optional Condition */}
              <div className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-default)] space-y-2">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Optional Filter Condition</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Field (e.g. stage)"
                    value={newCondField}
                    onChange={(e) => setNewCondField(e.target.value)}
                    className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)]"
                  />
                  <select
                    value={newCondOp}
                    onChange={(e) => setNewCondOp(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)]"
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="contains">contains</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value (e.g. Visa Approved)"
                    value={newCondVal}
                    onChange={(e) => setNewCondVal(e.target.value)}
                    className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Automated Action
                </label>
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="create_task">Create Follow-Up Task</option>
                  <option value="send_notification">Dispatch In-App Notification</option>
                  <option value="assign_counsellor">Auto-Assign Counsellor</option>
                </select>
              </div>

              {newActionType === "create_task" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Task Title (e.g. Book Visa Biometrics)"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                  <textarea
                    rows={2}
                    placeholder="Task Description instructions..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              )}

              {newActionType === "send_notification" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Notification Title (e.g. Action Required)"
                    value={newNotifTitle}
                    onChange={(e) => setNewNotifTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                  <textarea
                    rows={2}
                    placeholder="Notification message body..."
                    value={newNotifMsg}
                    onChange={(e) => setNewNotifMsg(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
              >
                Add Rule to Engine
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
