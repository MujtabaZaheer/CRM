import { addDoc, collection } from "firebase/firestore";
import { db, isDemoMode } from "../firebase/config";

export const logAuditEvent = async (
  action: string,
  performedBy: string,
  targetEntity: string,
  details: string,
  targetId?: string,
  performedByRole?: string
) => {
  if (isDemoMode) return;
  try {
    await addDoc(collection(db, "audit_logs"), {
      action,
      performedBy: performedBy || "Unknown",
      performedByRole: performedByRole || "Unknown",
      targetEntity,
      targetId: targetId || "",
      details,
      timestamp: Date.now(),
      source: "client_direct",
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

