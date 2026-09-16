import React from "react";

export interface StudentMetricCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode | React.ElementType;
  hint?: string;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "neutral" | "emerald" | "amber" | "sky" | "rose";
  onClick?: () => void;
}

export const StudentMetricCard: React.FC<StudentMetricCardProps> = ({
  label,
  value,
  icon,
  hint,
  subtext,
  variant = "default",
  onClick,
}) => {
  const displayHint = hint || subtext;
  const variantKey = variant === "neutral" ? "default" : variant;

  const variantStyles = {
    default: "border-subtle bg-surface hover:border-default",
    emerald: "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface to-surface hover:border-emerald-500/50",
    amber: "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-surface hover:border-amber-500/50",
    sky: "border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-surface to-surface hover:border-sky-500/50",
    rose: "border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-surface to-surface hover:border-rose-500/50",
  };

  const iconStyles = {
    default: "bg-elevated text-secondary",
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    sky: "bg-sky-500/15 text-sky-400",
    rose: "bg-rose-500/15 text-rose-400",
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === "function" ||
      (typeof icon === "object" && icon !== null && ("$$typeof" in icon || "render" in icon))
    ) {
      const IconComponent = icon as React.ElementType;
      return <IconComponent className="w-5 h-5" />;
    }
    if (typeof icon === "string" || typeof icon === "number") {
      return icon;
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-all duration-200 ${variantStyles[variantKey]} ${
        onClick ? "cursor-pointer active:scale-[0.99]" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          {label}
        </span>
        <div className={`p-2 rounded-xl border border-subtle/50 shrink-0 ${iconStyles[variantKey]}`}>
          {renderIcon()}
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-primary font-heading tracking-tight">
          {value}
        </span>
        {displayHint && (
          <span className="text-xs text-muted font-medium truncate">
            {displayHint}
          </span>
        )}
      </div>
    </div>
  );
};
