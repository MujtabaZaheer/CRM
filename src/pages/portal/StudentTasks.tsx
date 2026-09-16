import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  GraduationCap,
  Plane,
  ArrowRight,
  Filter,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { usePortalData } from "../../hooks/usePortalData";
import { REQUIRED_STANDARD_DOCS } from "./StudentDocumentVault";
import { isDocumentMatch } from "../../utils/applicationReadiness";
import {
  StudentMetricCard,
  StudentEmptyState,
} from "../../components/portal/common";

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  category: "document" | "payment" | "application" | "visa";
  priority: "urgent" | "high" | "medium" | "completed";
  dueDate?: string;
  link: string;
  linkText: string;
  completed: boolean;
}

export const StudentTasks: React.FC = () => {
  const { ownApplications, ownDocuments, ownInvoices } = usePortalData();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Derive dynamic actionable tasks from the live student data
  const derivedTasks = useMemo(() => {
    const list: ActionItem[] = [];

    // 1. Missing Mandatory Documents
    REQUIRED_STANDARD_DOCS.filter((r) => r.mandatory).forEach((req) => {
      const isPresent = ownDocuments.some((d) => {
        const t = d.documentType || (d as any).docType || (d as any).type || "";
        const n = d.fileName || (d as any).name || "";
        return isDocumentMatch(t, req.type) || isDocumentMatch(n, req.type);
      });

      if (!isPresent) {
        list.push({
          id: `doc-missing-${req.type}`,
          title: `Upload Mandatory: ${req.label}`,
          description: req.whyRequired,
          category: "document",
          priority: "urgent",
          dueDate: "Before Submission",
          link: "/student/documents",
          linkText: "Upload to Vault",
          completed: completedTaskIds.has(`doc-missing-${req.type}`),
        });
      }
    });

    // 2. Pending Invoices & Tuition Deposits
    ownInvoices.forEach((inv) => {
      if (inv.status === "Pending") {
        list.push({
          id: `inv-${inv.id}`,
          title: `Pay ${inv.type || "Tuition Deposit"}: ${inv.currency} ${inv.amount?.toLocaleString()}`,
          description: `Challan #${inv.invoiceNumber} is awaiting payment proof submission.`,
          category: "payment",
          priority: "urgent",
          dueDate: inv.dueDate || "Immediate",
          link: "/student/invoices",
          linkText: "Pay & Upload Slip",
          completed: completedTaskIds.has(`inv-${inv.id}`),
        });
      } else if (inv.status === "Partially Paid") {
        list.push({
          id: `inv-${inv.id}`,
          title: `Payment Verifying: ${inv.currency} ${inv.amount?.toLocaleString()}`,
          description: `Receipt uploaded for Challan #${inv.invoiceNumber}. Finance verification in progress.`,
          category: "payment",
          priority: "medium",
          dueDate: "Under Review",
          link: "/student/invoices",
          linkText: "View Receipt Status",
          completed: true,
        });
      }
    });

    // 3. Application Actions by Stage
    ownApplications.forEach((app) => {
      if (app.stage === "Conditional Offer") {
        list.push({
          id: `app-cond-${app.id}`,
          title: `Clear Conditions: ${app.universityName}`,
          description: `Review conditional offer requirements and upload supplementary certificates.`,
          category: "application",
          priority: "urgent",
          dueDate: "2 Weeks from Offer",
          link: `/student/applications/${app.id}`,
          linkText: "Review Offer",
          completed: completedTaskIds.has(`app-cond-${app.id}`),
        });
      } else if (app.stage === "Deposit Pending") {
        list.push({
          id: `app-dep-${app.id}`,
          title: `Accept Offer & Pay Deposit: ${app.universityName}`,
          description: `Official offer released! Settle deposit to unlock CAS issuance.`,
          category: "payment",
          priority: "urgent",
          dueDate: "10 Days",
          link: `/student/applications/${app.id}`,
          linkText: "View Application Deposit",
          completed: completedTaskIds.has(`app-dep-${app.id}`),
        });
      } else if (app.stage === "Visa Preparation") {
        list.push({
          id: `app-visa-${app.id}`,
          title: `Complete Visa Filing: ${app.universityName}`,
          description: `Prepare 28-day financial evidence and book embassy biometrics.`,
          category: "visa",
          priority: "high",
          dueDate: "Before Intake",
          link: `/student/applications/${app.id}`,
          linkText: "Visa Checklist",
          completed: completedTaskIds.has(`app-visa-${app.id}`),
        });
      } else if (app.stage === "Draft" || app.applicationStatus === "Draft") {
        list.push({
          id: `app-draft-${app.id}`,
          title: `Complete Draft Application: ${app.universityName}`,
          description: `Finish application sections and submit to admissions.`,
          category: "application",
          priority: "medium",
          dueDate: "Upcoming Intake",
          link: `/student/new-application?universityId=${app.universityId}&programmeId=${app.programmeId}&applicationId=${app.id}`,
          linkText: "Continue Draft",
          completed: completedTaskIds.has(`app-draft-${app.id}`),
        });
      }
    });

    return list;
  }, [ownApplications, ownDocuments, ownInvoices, completedTaskIds]);

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const filteredTasks = useMemo(() => {
    return derivedTasks.filter((item) => {
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (filterStatus === "pending" && item.completed) return false;
      if (filterStatus === "completed" && !item.completed) return false;
      return true;
    });
  }, [derivedTasks, filterCategory, filterStatus]);

  const pendingCount = derivedTasks.filter((t) => !t.completed).length;
  const urgentCount = derivedTasks.filter((t) => t.priority === "urgent" && !t.completed).length;
  const completedCount = derivedTasks.filter((t) => t.completed).length;

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-16 font-sans animate-fade-in">
      {/* Header */}
      <header className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-8 text-[var(--text-primary)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Admissions Checklist & Milestones
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text-primary)] mt-1">
            Tasks & Deadlines
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-xl">
            Live checklist of actionable milestones across your applications, documents vault, and tuition payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/student/applications"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>My Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StudentMetricCard
          label="Pending Tasks"
          value={pendingCount}
          subtext={pendingCount === 0 ? "All tasks cleared!" : "Action items pending"}
          trend={pendingCount === 0 ? "up" : "down"}
          icon={<Clock className="w-5 h-5" />}
          variant={pendingCount > 0 ? "amber" : "emerald"}
        />
        <StudentMetricCard
          label="Urgent / Deadlines"
          value={urgentCount}
          subtext={urgentCount > 0 ? "Requires immediate response" : "No urgent blocks"}
          icon={<AlertCircle className="w-5 h-5" />}
          variant={urgentCount > 0 ? "rose" : "neutral"}
        />
        <StudentMetricCard
          label="Completed"
          value={completedCount}
          subtext="Cleared milestones"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />
        <StudentMetricCard
          label="Admissions Readiness"
          value={
            derivedTasks.length > 0
              ? `${Math.round((completedCount / derivedTasks.length) * 100)}%`
              : "100%"
          }
          subtext="Profile and document sync"
          icon={<Sparkles className="w-5 h-5" />}
          variant="sky"
        />
      </div>

      {/* Filters & Task List */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] overflow-x-auto">
            {[
              { id: "all", label: "All Items" },
              { id: "document", label: "Documents" },
              { id: "payment", label: "Payments" },
              { id: "application", label: "Admissions" },
              { id: "visa", label: "Visa" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === tab.id
                    ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>
        </div>

        {/* Task Cards */}
        {filteredTasks.length === 0 ? (
          <StudentEmptyState
            icon={<CheckCircle2 className="w-6 h-6 text-muted" />}
            title={filterCategory !== "all" ? "No tasks in this category" : "All Tasks Caught Up!"}
            description={
              filterCategory !== "all"
                ? "You don't have any outstanding action items for this category."
                : "Great work! You have cleared all pending document uploads, deposit proofs, and admissions milestones."
            }
            action={
              filterCategory !== "all" || filterStatus !== "all"
                ? {
                    label: "Reset Filters",
                    onClick: () => {
                      setFilterCategory("all");
                      setFilterStatus("all");
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const CategoryIcon =
                task.category === "document"
                  ? FileText
                  : task.category === "payment"
                  ? CreditCard
                  : task.category === "visa"
                  ? Plane
                  : GraduationCap;

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    task.completed
                      ? "bg-[var(--bg-elevated)]/30 border-[var(--border-default)] opacity-70"
                      : task.priority === "urgent"
                      ? "bg-[var(--bg-elevated)]/70 border-rose-500/30 hover:border-rose-500/50"
                      : "bg-[var(--bg-elevated)]/70 border-[var(--border-default)] hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        task.completed
                          ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                          : "border-[var(--border-default)] hover:border-emerald-400 text-transparent"
                      }`}
                      title={task.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                          <CategoryIcon className="w-3.5 h-3.5" />
                        </span>

                        <h3
                          className={`text-sm font-bold text-[var(--text-primary)] ${
                            task.completed ? "line-through text-[var(--text-muted)]" : ""
                          }`}
                        >
                          {task.title}
                        </h3>

                        {task.priority === "urgent" && !task.completed && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                            Urgent
                          </span>
                        )}

                        {task.dueDate && (
                          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    <Link
                      to={task.link}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{task.linkText}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTasks;
