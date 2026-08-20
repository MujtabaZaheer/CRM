/**
 * EduCRM Application Locking & Integrity Service
 * Prevents unauthorized changes to submitted application files once they
 * reach official review or university submission stages.
 */

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { logAuditEvent } from "./auditLogger";
import { AppUser } from "../types/role";

export function isApplicationLocked(lockedAt?: number): boolean {
  return typeof lockedAt === "number" && lockedAt > 0;
}

export function canUnlockApplication(user: AppUser | null): boolean {
  if (!user) return false;
  return (
    user.role === "platform_super_admin" ||
    user.role === "org_admin" ||
    user.role === "team_leader" ||
    user.role === "admissions_officer"
  );
}

export async function toggleApplicationLock(
  applicationId: string,
  currentLockedAt: number | undefined,
  user: AppUser | null
): Promise<boolean> {
  if (!user) throw new Error("Authentication required.");

  const shouldLock = !isApplicationLocked(currentLockedAt);

  if (!shouldLock && !canUnlockApplication(user)) {
    throw new Error("You do not have permission to unlock a submitted application.");
  }

  const lockedAtValue = shouldLock ? Date.now() : null;

  await updateDoc(doc(db, "applications", applicationId), {
    lockedAt: lockedAtValue,
    updatedAt: Date.now(),
  });

  await logAuditEvent(
    shouldLock ? "APPLICATION_LOCKED" : "APPLICATION_UNLOCKED",
    user.email,
    "Application",
    `${shouldLock ? "Locked" : "Unlocked"} application #${applicationId.slice(-6)}`,
    applicationId,
    user.role
  );

  return shouldLock;
}
