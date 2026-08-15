import { httpsCallable } from "firebase/functions";
import { functions, isDemoMode } from "../firebase/config";

export const logAuditEvent = async (
  action: string,
  _performedBy: string,
  targetEntity: string,
  details: string,
  targetId?: string,
  _performedByRole?: string
) => {
  // The callable function derives actor identity and role from its authenticated profile.
  // Keep these arguments temporarily for existing callers while intentionally ignoring them.
  void _performedBy;
  void _performedByRole;
  if (isDemoMode) return;
  try {
    const recordAuditEvent = httpsCallable(functions, "recordAuditEvent");
    await recordAuditEvent({
      action,
      targetEntity,
      targetId: targetId || "",
      details,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};
