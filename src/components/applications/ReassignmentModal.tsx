import React, { useState, useMemo } from "react";
import { Application } from "../../types/application";
import { AppUser } from "../../types/role";
import { TENANT_DEFINITIONS, getTenantById } from "../../utils/tenantScoping";
import {
  bulkReassignApplications,
  canReassignApplications,
} from "../../utils/applicationReassignment";
import {
  Users,
  Send,
  Building,
  AlertCircle,
  X,
  ShieldAlert,
  ArrowRightLeft,
  Briefcase,
  FileText,
} from "lucide-react";

interface ReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  availableStaff: AppUser[];
  currentActor: AppUser | null;
  onSuccess: (updatedApps: Application[], message: string) => void;
}

export const ReassignmentModal: React.FC<ReassignmentModalProps> = ({
  isOpen,
  onClose,
  applications,
  availableStaff,
  currentActor,
  onSuccess,
}) => {
  if (!isOpen || applications.length === 0) return null;

  const [selectedStaffEmail, setSelectedStaffEmail] = useState<string>("");
  const [department, setDepartment] = useState<string>("Counselling");
  const [team, setTeam] = useState<string>("");
  const [isCrossTenant, setIsCrossTenant] = useState<boolean>(false);
  const [targetTenantId, setTargetTenantId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const isBulk = applications.length > 1;
  const isAuthorized = canReassignApplications(currentActor);
  const canAuthorizeCrossTenant =
    currentActor?.role === "platform_super_admin" ||
    currentActor?.role === "org_admin" ||
    currentActor?.role === "office_manager";

  // Filter staff who can receive applications
  const assignableStaff = useMemo(() => {
    return availableStaff.filter((s) =>
      ["counsellor", "admissions_officer", "team_leader", "office_manager", "visa_officer"].includes(s.role)
    );
  }, [availableStaff]);

  const selectedStaff = useMemo(() => {
    return assignableStaff.find((s) => s.email.toLowerCase() === selectedStaffEmail.toLowerCase());
  }, [assignableStaff, selectedStaffEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isAuthorized) {
      setErrorMsg("You do not possess the required RBAC privileges to reassign applications.");
      return;
    }

    if (!selectedStaffEmail || !selectedStaff) {
      setErrorMsg("Please select a target officer to receive the application(s).");
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg("Please provide a substantive justification for the transfer (minimum 5 characters).");
      return;
    }

    if (isCrossTenant && !targetTenantId) {
      setErrorMsg("Please select the destination tenant for this institutional transfer.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await bulkReassignApplications(
        applications,
        {
          newAssigneeEmail: selectedStaff.email,
          newAssigneeName: selectedStaff.displayName || selectedStaff.email,
          newTeam: team || selectedStaff.team || "Admissions Operations",
          newDepartment: department,
          isCrossTenant,
          targetTenantId: isCrossTenant ? targetTenantId : undefined,
          reason: reason.trim(),
        },
        currentActor!
      );

      if (!result.success) {
        setErrorMsg(result.error || "Reassignment transaction failed.");
        setSubmitting(false);
        return;
      }

      // Compute updated applications for optimistic UI state
      const now = Date.now();
      const updatedApps: Application[] = applications.map((app) => ({
        ...app,
        assignedOfficer: selectedStaff.displayName || selectedStaff.email,
        assignedOfficerEmail: selectedStaff.email,
        assignedOfficerName: selectedStaff.displayName || selectedStaff.email,
        assignedCounsellor: selectedStaff.email,
        assignedTeam: team || selectedStaff.team || app.assignedTeam,
        assignedDepartment: department,
        tenantId: isCrossTenant && targetTenantId ? targetTenantId : app.tenantId,
        history: [
          ...(app.history || []),
          {
            stage: app.stage,
            updatedBy: currentActor?.email || "System",
            timestamp: now,
            note: `Reassigned to ${selectedStaff.displayName || selectedStaff.email}. Reason: ${reason.trim()}`,
          },
        ],
        updatedAt: now,
      }));

      const msg = isBulk
        ? `Successfully routed ${applications.length} applications to ${selectedStaff.displayName || selectedStaff.email}.`
        : `Application #${applications[0].applicationNumber} reassigned to ${selectedStaff.displayName || selectedStaff.email}.`;

      onSuccess(updatedApps, msg);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during reassignment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {isBulk ? `Bulk Reassign (${applications.length} Applications)` : "Application Reassignment"}
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Transfer custody with audit logging, automated alerts, and boundary governance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Applications Summary Preview */}
          <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] space-y-2">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dossier Selected for Handoff</span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
              {applications.map((app) => {
                const tenant = getTenantById(app.tenantId || "tenant-london");
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between text-xs p-1.5 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]"
                  >
                    <div>
                      <span className="font-mono font-bold text-emerald-400 mr-2">
                        {app.applicationNumber || `#${app.id.slice(-6)}`}
                      </span>
                      <span className="text-[var(--text-primary)] font-medium">{app.studentName}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center space-x-2">
                      <span>{app.universityName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {tenant?.name || "London HQ"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Officer Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Officer / Caseworker *</span>
            </label>
            <select
              value={selectedStaffEmail}
              onChange={(e) => {
                setSelectedStaffEmail(e.target.value);
                const staff = assignableStaff.find((s) => s.email.toLowerCase() === e.target.value.toLowerCase());
                if (staff?.assignedDepartment) setDepartment(staff.assignedDepartment);
                if (staff?.team) setTeam(staff.team);
              }}
              required
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select recipient caseworker...</option>
              {assignableStaff.map((staff) => (
                <option key={staff.uid} value={staff.email}>
                  {staff.displayName || staff.email} ({staff.role.replace("_", " ")}) - {staff.office || "HQ"}
                </option>
              ))}
            </select>
          </div>

          {/* Department & Team Routing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 text-teal-400" />
                <span>Target Department *</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500"
              >
                <option value="Counselling">Counselling & Advisory</option>
                <option value="Admissions">Admissions Processing Desk</option>
                <option value="Visa Desk">Visa & Immigration Compliance</option>
                <option value="Finance">Student Accounts & Finance</option>
                <option value="Executive Review">Senior Leadership & Appeals</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)]">Specialized Queue / Team</label>
              <input
                type="text"
                placeholder="e.g. UK STEM Priority Desk"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Cross-Tenant Boundary Escalation Section */}
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCrossTenant}
                  disabled={!canAuthorizeCrossTenant}
                  onChange={(e) => setIsCrossTenant(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-0 mr-1"
                />
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>Cross-Tenant Institutional Transfer</span>
              </label>
              {!canAuthorizeCrossTenant && (
                <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Admin Clearance Required</span>
                </span>
              )}
            </div>

            {isCrossTenant && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-medium text-zinc-300">
                  Select Destination Tenant Partition *
                </label>
                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  required={isCrossTenant}
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-amber-500/30 rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select destination tenant...</option>
                  {TENANT_DEFINITIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type === "university" ? "University Partner" : "City Hub"} - {t.city})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-300/70">
                  Escalating across institutional boundaries updates data partitioning boundaries and records an immutable cross-tenant transfer event in audit logs.
                </p>
              </div>
            )}
          </div>

          {/* Reason for Transfer (Mandatory for audit trail) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Reason for Transfer / Administrative Justification *
            </label>
            <textarea
              rows={3}
              placeholder="Provide a mandatory justification (e.g. Caseworker capacity rebalancing, student relocated to Manchester, tier-2 compliance review)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              {submitting ? (
                <span>Executing Transfer...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Handoff</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
