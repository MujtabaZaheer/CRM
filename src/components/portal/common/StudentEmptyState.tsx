import React from "react";
import { Link } from "react-router-dom";
import { FolderSearch, Plus, ArrowRight } from "lucide-react";

export interface StudentEmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  icon?: React.ReactNode | React.ElementType;
  className?: string;
}

export const StudentEmptyState: React.FC<StudentEmptyStateProps> = ({
  title,
  description,
  actionText,
  actionHref,
  onActionClick,
  action,
  icon,
  className = "",
}) => {
  const finalActionText = action?.label || actionText;
  const finalActionHref = action?.href || actionHref;
  const finalActionClick = action?.onClick || onActionClick;

  const renderIcon = () => {
    if (!icon) return <FolderSearch className="w-6 h-6 text-muted" />;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === "function" ||
      (typeof icon === "object" && icon !== null && ("$$typeof" in icon || "render" in icon))
    ) {
      const IconComp = icon as React.ElementType;
      return <IconComp className="w-6 h-6 text-muted" />;
    }
    return <FolderSearch className="w-6 h-6 text-muted" />;
  };

  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-2xl border border-dashed border-subtle bg-surface/50 space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-elevated border border-subtle flex items-center justify-center text-muted mx-auto shadow-inner">
        {renderIcon()}
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="font-heading font-bold text-base text-primary">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
          {description}
        </p>
      </div>
      {(finalActionText && (finalActionHref || finalActionClick)) && (
        <div className="pt-2">
          {finalActionHref ? (
            <Link
              to={finalActionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>{finalActionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={finalActionClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>{finalActionText}</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
