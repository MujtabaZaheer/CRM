import React from "react";
import { Check, Clock, AlertCircle } from "lucide-react";

export interface LifecycleMilestone {
  id: string;
  title: string;
  description?: string;
  stageMatches: string[];
}

export const LIFECYCLE_STEPS: LifecycleMilestone[] = [
  {
    id: "profile",
    title: "Profile Submitted",
    description: "Personal and academic information verified",
    stageMatches: [
      "Draft",
      "Initial Review",
      "Documents Pending",
      "Ready for Submission",
      "Submitted",
      "University Reviewing",
      "Additional Info Requested",
      "Conditional Offer",
      "Unconditional Offer",
      "Approved",
      "Deposit Pending",
      "Deposit Paid",
      "CAS / COE Pending",
      "CAS Issued",
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Enrolled",
    ],
  },
  {
    id: "documents",
    title: "Documents Submitted",
    description: "Transcripts, passport, and SOP lodged",
    stageMatches: [
      "Ready for Submission",
      "Submitted",
      "University Reviewing",
      "Additional Info Requested",
      "Conditional Offer",
      "Unconditional Offer",
      "Approved",
      "Deposit Pending",
      "Deposit Paid",
      "CAS / COE Pending",
      "CAS Issued",
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Enrolled",
    ],
  },
  {
    id: "submitted",
    title: "Application Submitted",
    description: "Official dossier lodged with university",
    stageMatches: [
      "Submitted",
      "University Reviewing",
      "Additional Info Requested",
      "Conditional Offer",
      "Unconditional Offer",
      "Approved",
      "Deposit Pending",
      "Deposit Paid",
      "CAS / COE Pending",
      "CAS Issued",
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Enrolled",
    ],
  },
  {
    id: "reviewing",
    title: "University Reviewing",
    description: "Admissions committee evaluating qualifications",
    stageMatches: [
      "University Reviewing",
      "Additional Info Requested",
      "Conditional Offer",
      "Unconditional Offer",
      "Approved",
      "Deposit Pending",
      "Deposit Paid",
      "CAS / COE Pending",
      "CAS Issued",
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Enrolled",
    ],
  },
  {
    id: "offer",
    title: "Offer Received",
    description: "Conditional or Unconditional Offer issued",
    stageMatches: [
      "Conditional Offer",
      "Unconditional Offer",
      "Approved",
      "Deposit Pending",
      "Deposit Paid",
      "CAS / COE Pending",
      "CAS Issued",
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Enrolled",
    ],
  },
  {
    id: "deposit",
    title: "Deposit & CAS Release",
    description: "Tuition deposit confirmed & CAS/COE generated",
    stageMatches: [
      "Deposit Paid",
      "CAS / COE Pending",
      "CAS Issued",
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Enrolled",
    ],
  },
  {
    id: "visa",
    title: "Visa Preparation",
    description: "Financial proof, biometrics & clearance",
    stageMatches: [
      "Visa Preparation",
      "Visa Submitted",
      "Visa Approved",
      "Enrolled",
    ],
  },
  {
    id: "enrolled",
    title: "Enrolled & Cleared",
    description: "Arrival, registration & orientation complete",
    stageMatches: ["Enrolled"],
  },
];

export interface ApplicationLifecycleTimelineProps {
  currentStage: string;
  className?: string;
}

export const ApplicationLifecycleTimeline: React.FC<ApplicationLifecycleTimelineProps> = ({
  currentStage,
  className = "",
}) => {
  const isRejected = currentStage === "Rejected" || currentStage === "Withdrawn";

  // Determine current active step index
  let activeIndex = 0;
  if (isRejected) {
    activeIndex = -1;
  } else {
    for (let i = LIFECYCLE_STEPS.length - 1; i >= 0; i--) {
      if (LIFECYCLE_STEPS[i].stageMatches.includes(currentStage)) {
        activeIndex = i;
        break;
      }
    }
  }

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-surface border border-subtle ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-heading font-bold text-sm sm:text-base text-primary">
            Application Lifecycle Progress
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Stage {activeIndex + 1} of {LIFECYCLE_STEPS.length} · Current Stage:{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {currentStage}
            </span>
          </p>
        </div>

        {isRejected ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{currentStage}</span>
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Journey</span>
          </span>
        )}
      </div>

      {/* Progress Track for Desktop/Tablet */}
      <div className="relative mt-6">
        <div className="hidden lg:grid grid-cols-8 gap-2 relative">
          {/* Connector Line behind steps */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-input border-t border-subtle pointer-events-none" />

          {LIFECYCLE_STEPS.map((step, idx) => {
            const isDone = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={step.id} className="relative flex flex-col items-center text-center group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 z-10 ${
                    isDone
                      ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-emerald-500 text-zinc-950 ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30 animate-pulse"
                      : "bg-elevated text-muted border border-subtle"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : isCurrent ? <Clock className="w-4 h-4" /> : idx + 1}
                </div>
                <p
                  className={`mt-2.5 text-[11px] font-bold leading-snug truncate max-w-full ${
                    isDone
                      ? "text-primary"
                      : isCurrent
                      ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                      : "text-muted"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile / Compact Stepper */}
        <div className="lg:hidden space-y-3">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isDone = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${
                  isCurrent
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : isDone
                    ? "bg-elevated/40 border-subtle/50"
                    : "opacity-60 border-transparent"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    isDone
                      ? "bg-emerald-500 text-zinc-950"
                      : isCurrent
                      ? "bg-emerald-500 text-zinc-950 ring-2 ring-emerald-500/30"
                      : "bg-elevated text-muted border border-subtle"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isDone
                          ? "text-primary"
                          : "text-muted"
                      }`}
                    >
                      {step.title}
                    </p>
                    <span className="text-[10px] text-muted uppercase font-bold shrink-0">
                      {isDone ? "Completed" : isCurrent ? "Current" : "Pending"}
                    </span>
                  </div>
                  {step.description && (
                    <p className="text-[11px] text-secondary mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
