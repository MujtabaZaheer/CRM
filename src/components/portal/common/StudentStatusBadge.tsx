import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileCheck2,
  Award,
  Sparkles,
  Plane,
  ShieldCheck,
} from "lucide-react";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "neutral";

export interface StudentStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export const getStatusConfig = (
  rawStatus: string
): { label: string; variant: StatusVariant; icon: React.ReactNode } => {
  const status = rawStatus?.trim() || "Unknown";
  const s = status.toLowerCase();

  // Completed / Approved / Verified / Enrolled
  if (
    s === "verified" ||
    s === "approved" ||
    s === "enrolled" ||
    s === "unconditional offer" ||
    s === "visa approved" ||
    s === "cas issued" ||
    s === "paid" ||
    s === "completed"
  ) {
    let icon = <CheckCircle2 className="w-3 h-3" />;
    if (s === "visa approved") icon = <Plane className="w-3 h-3" />;
    if (s === "unconditional offer") icon = <Award className="w-3 h-3" />;
    if (s === "cas issued") icon = <ShieldCheck className="w-3 h-3" />;
    return { label: status, variant: "success", icon };
  }

  // Offers (Conditional)
  if (s === "conditional offer" || s === "offer received") {
    return {
      label: status,
      variant: "purple",
      icon: <Sparkles className="w-3 h-3" />,
    };
  }

  // Action Required / Warning / Missing / Overdue / Needs Info
  if (
    s.includes("action required") ||
    s.includes("missing") ||
    s.includes("deposit pending") ||
    s.includes("additional info") ||
    s.includes("overdue") ||
    s.includes("rejected") ||
    s === "refused"
  ) {
    if (s.includes("rejected") || s === "refused" || s.includes("overdue")) {
      return {
        label: status,
        variant: "danger",
        icon: <XCircle className="w-3 h-3" />,
      };
    }
    return {
      label: status,
      variant: "warning",
      icon: <AlertCircle className="w-3 h-3" />,
    };
  }

  // In Progress / Reviewing / Pending / Submitted / Draft
  if (
    s.includes("review") ||
    s.includes("pending") ||
    s.includes("submitted") ||
    s.includes("preparation") ||
    s === "draft"
  ) {
    if (s === "draft") {
      return {
        label: status,
        variant: "neutral",
        icon: <FileCheck2 className="w-3 h-3" />,
      };
    }
    if (s.includes("review") || s === "submitted") {
      return {
        label: status,
        variant: "info",
        icon: <Clock className="w-3 h-3" />,
      };
    }
    return {
      label: status,
      variant: "warning",
      icon: <Clock className="w-3 h-3" />,
    };
  }

  return {
    label: status,
    variant: "neutral",
    icon: <Clock className="w-3 h-3" />,
  };
};

export const StudentStatusBadge: React.FC<StudentStatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
  showIcon = true,
}) => {
  const { label, variant, icon } = getStatusConfig(status);

  const variantStyles: Record<StatusVariant, string> = {
    success:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    danger:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    info:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    purple:
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    neutral:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-[11px] px-2.5 py-1 gap-1.5",
    lg: "text-xs px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wide rounded-full border shadow-xs transition-colors shrink-0 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {showIcon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </span>
  );
};
