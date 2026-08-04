import { db } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";

export const logAuditEvent = async (
  action: string,
  performedBy: string,
  targetEntity: string,
  details: string,
  targetId?: string,
  performedByRole?: string
) => {
  try {
    await addDoc(collection(db, "audit_logs"), {
      action,
      performedBy,
      performedByRole: performedByRole || "counsellor",
      targetEntity,
      targetId: targetId || "",
      details,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};
