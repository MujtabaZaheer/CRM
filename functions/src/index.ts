import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { randomUUID } from "node:crypto";

initializeApp();
const db = getFirestore();

const STAFF_ROLES = new Set([
  "org_admin",
  "office_manager",
  "team_leader",
  "counsellor",
  "admissions_officer",
  "compliance_officer",
  "finance_officer",
  "visa_officer",
  "auditor",
  "support_user",
  "external_agent",
  "university_partner",
]);
const MANAGED_ROLES = new Set(["student", ...STAFF_ROLES]);

type UserProfile = { role?: string; organizationId?: string; email?: string; displayName?: string };

const requireProfile = async (uid: string): Promise<UserProfile> => {
  const snapshot = await db.collection("users").doc(uid).get();
  if (!snapshot.exists) throw new HttpsError("permission-denied", "No EduCRM profile exists for this account.");
  return snapshot.data() as UserProfile;
};

const requireAdmin = (profile: UserProfile) => {
  if (profile.role !== "platform_super_admin" && profile.role !== "org_admin") {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }
};

const asText = (value: unknown, field: string, maxLength = 500) => {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new HttpsError("invalid-argument", `A valid ${field} is required.`);
  }
  return value.trim();
};

/**
 * Creates a one-time invitation record. Email delivery is intentionally delegated to the
 * organization’s selected email provider; no credentials are stored in this codebase.
 */
// Enable App Check enforcement in the Firebase deployment configuration once the client
// attestation provider and site key are configured for the production project.
export const createInvitation = onCall({ enforceAppCheck: false }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in before creating an invitation.");
  const caller = await requireProfile(request.auth.uid);
  requireAdmin(caller);

  const email = asText(request.data?.email, "email", 320).toLowerCase();
  const role = asText(request.data?.role, "role", 64);
  const requestedOrganizationId = typeof request.data?.organizationId === "string" ? request.data.organizationId.trim() : "";
  if (!STAFF_ROLES.has(role)) throw new HttpsError("invalid-argument", "The requested role cannot be invited.");

  const organizationId = caller.role === "platform_super_admin" ? requestedOrganizationId : caller.organizationId;
  if (!organizationId) throw new HttpsError("failed-precondition", "An organization is required for staff invitations.");

  const token = randomUUID();
  const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.collection("invitations").doc(token).set({
    email,
    role,
    organizationId,
    invitedBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    status: "pending",
  });

  return { token, expiresAt: expiresAt.toDate().toISOString() };
});

/** Accepts a one-time invitation and provisions the server-authoritative user profile. */
export const acceptInvitation = onCall({ enforceAppCheck: false }, async (request) => {
  if (!request.auth?.token.email) throw new HttpsError("unauthenticated", "A verified email account is required.");
  if (request.auth.token.email_verified !== true) throw new HttpsError("permission-denied", "Verify your email before accepting an invitation.");

  const token = asText(request.data?.token, "invitation token", 128);
  const invitationRef = db.collection("invitations").doc(token);
  const invitationSnapshot = await invitationRef.get();
  if (!invitationSnapshot.exists) throw new HttpsError("not-found", "Invitation not found.");
  const invitation = invitationSnapshot.data()!;
  if (invitation.status !== "pending" || invitation.expiresAt.toMillis() <= Date.now()) {
    throw new HttpsError("failed-precondition", "This invitation is no longer valid.");
  }
  if (invitation.email !== request.auth.token.email.toLowerCase()) {
    throw new HttpsError("permission-denied", "This invitation belongs to a different email address.");
  }

  const userRef = db.collection("users").doc(request.auth.uid);
  await db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    if (userSnapshot.exists) throw new HttpsError("already-exists", "This account already has an EduCRM profile.");
    transaction.set(userRef, {
      uid: request.auth!.uid,
      email: request.auth!.token.email!.toLowerCase(),
      displayName: request.auth!.token.name || request.auth!.token.email!.split("@")[0],
      role: invitation.role,
      organizationId: invitation.organizationId,
      createdAt: Date.now(),
      invitedBy: invitation.invitedBy,
    });
    transaction.update(invitationRef, { status: "accepted", acceptedAt: FieldValue.serverTimestamp(), acceptedBy: request.auth!.uid });
  });

  return { organizationId: invitation.organizationId, role: invitation.role };
});

/** Updates role, office, or team assignment without granting browser clients write access to user profiles. */
export const updateUserAccess = onCall({ enforceAppCheck: false }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in before updating user access.");
  const caller = await requireProfile(request.auth.uid);
  requireAdmin(caller);
  const userId = asText(request.data?.userId, "user ID", 128);
  const targetRef = db.collection("users").doc(userId);
  const targetSnapshot = await targetRef.get();
  if (!targetSnapshot.exists) throw new HttpsError("not-found", "User profile not found.");
  const target = targetSnapshot.data() as UserProfile;
  if (caller.role === "org_admin" && (!caller.organizationId || target.organizationId !== caller.organizationId)) {
    throw new HttpsError("permission-denied", "Organization administrators can only manage their own organization.");
  }

  const changes: Record<string, unknown> = { updatedAt: Date.now(), updatedBy: request.auth.uid };
  if (request.data?.role !== undefined) {
    const role = asText(request.data.role, "role", 64);
    if (!MANAGED_ROLES.has(role) || (caller.role === "org_admin" && role === "org_admin")) {
      throw new HttpsError("permission-denied", "You cannot assign the requested role.");
    }
    changes.role = role;
  }
  for (const field of ["office", "team"] as const) {
    if (request.data?.[field] !== undefined) {
      const value = request.data[field];
      if (value !== null && (typeof value !== "string" || value.length > 120)) {
        throw new HttpsError("invalid-argument", `A valid ${field} is required.`);
      }
      changes[field] = typeof value === "string" ? value.trim() || null : null;
    }
  }
  if (Object.keys(changes).length === 2) throw new HttpsError("invalid-argument", "At least one access field must be supplied.");
  await targetRef.update(changes);
  return { updated: true };
});

/** Server-authenticated, append-only audit writer used by browser clients. */
export const recordAuditEvent = onCall({ enforceAppCheck: false }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in before recording an audit event.");
  const profile = await requireProfile(request.auth.uid);
  const action = asText(request.data?.action, "action", 100);
  const targetEntity = asText(request.data?.targetEntity, "target entity", 100);
  const details = asText(request.data?.details, "details", 1_000);
  const targetId = typeof request.data?.targetId === "string" ? request.data.targetId.trim().slice(0, 200) : "";

  await db.collection("audit_logs").add({
    action,
    performedBy: profile.email || request.auth.token.email || request.auth.uid,
    performedByRole: profile.role || "unknown",
    organizationId: profile.organizationId || null,
    targetEntity,
    targetId,
    details,
    timestamp: Date.now(),
    source: "callable_function",
  });

  logger.info("Audit event recorded", { action, actor: request.auth.uid, targetEntity, targetId });
  return { recorded: true };
});
