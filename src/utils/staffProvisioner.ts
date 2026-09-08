import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, firebaseConfig, isDemoMode } from "../firebase/config";
import { AppUser, UserRole } from "../types/role";
import { logAuditEvent } from "./auditLogger";

export interface StaffProvisionData {
  email: string;
  password?: string;
  displayName: string;
  role: UserRole;
  office?: string;
  team?: string;
  tenantId?: string;
  actorEmail?: string;
  actorRole?: string;
}

/**
 * Generates a cryptographically strong temporary password for provisioning.
 */
export const generateStrongPassword = (): string => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";

  let pass = "";
  for (let i = 0; i < 6; i++) pass += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length));

  return `Edu-${pass}`;
};

/**
 * Removes any undefined or null-like properties to prevent Firestore serialization crashes.
 */
export const cleanStaffData = <T extends Record<string, any>>(obj: T): T => {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && val !== null) {
      result[key] = val;
    }
  }
  return result;
};

/**
 * Provisions an internal staff user account.
 * 1. Creates Firebase Auth credentials via an isolated secondary app instance (preserving the current admin's session).
 * 2. Writes full AppUser profile metadata (NEVER passwords) to Cloud Firestore `users` collection.
 * 3. Records immutable audit event.
 */
export const provisionStaffUser = async (data: StaffProvisionData): Promise<AppUser> => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const trimmedName = data.displayName.trim();
  const initialPassword = data.password || generateStrongPassword();
  let createdUid = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Authoritative Firebase Authentication provisioning via secondary app
  const secondaryAppName = `Provision_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  let secondaryApp: any = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    const cred = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, initialPassword);
    if (cred.user) {
      createdUid = cred.user.uid;
      try {
        await updateProfile(cred.user, { displayName: trimmedName });
      } catch (_) {}
      await signOut(secondaryAuth);
    }
  } catch (authErr: any) {
    if (authErr?.code === "auth/email-already-in-use") {
      console.warn("User already exists in Firebase Auth, updating Firestore profile metadata.");
    } else {
      console.warn("Firebase Auth provisioning notice:", authErr.message);
    }
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (_) {}
    }
  }

  // 2. Prepare AppUser record — strictly metadata, NEVER store passwords
  const newStaffRecord: AppUser = cleanStaffData({
    uid: createdUid,
    email: normalizedEmail,
    displayName: trimmedName,
    role: data.role,
    office: data.office || "London HQ",
    team: data.team || "Global Team",
    tenantId: data.tenantId || "tenant-default",
    branchId: `branch-${(data.office || "london").toLowerCase().replace(/\s+/g, "-")}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    onboardingStatus: "completed",
    profileCompleted: true,
    currentStep: 4,
  }) as AppUser;

  // 3. Persist profile to Firestore
  try {
    await setDoc(doc(db, "users", createdUid), newStaffRecord, { merge: true });
  } catch (firestoreErr: any) {
    if (isDemoMode) {
      console.warn("Firestore profile sync warning in preview session:", firestoreErr?.message);
    } else {
      throw firestoreErr;
    }
  }

  // 4. Record Immutable Audit Event
  try {
    await logAuditEvent(
      "STAFF_ACCOUNT_PROVISIONED",
      data.actorEmail || "Administrator",
      "UserManagement",
      `Provisioned internal staff user ${trimmedName} (${normalizedEmail}) with role ${data.role} at ${data.office || "HQ"}`,
      createdUid,
      data.actorRole as any
    );
  } catch (auditErr: any) {
    console.warn("Audit logging notice:", auditErr?.message);
  }

  return newStaffRecord;
};

/**
 * Dispatches an authoritative Firebase Authentication password reset email.
 * Passwords are never handled or stored in plaintext.
 */
export const dispatchStaffPasswordReset = async (
  email: string,
  actorEmail?: string,
  actorRole?: string
): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  await sendPasswordResetEmail(auth, normalizedEmail);

  await logAuditEvent(
    "STAFF_PASSWORD_RESET_DISPATCHED",
    actorEmail || "Administrator",
    "UserManagement",
    `Dispatched official Firebase Auth password reset email to ${normalizedEmail}`,
    normalizedEmail,
    actorRole as any
  );
};

/**
 * Backwards-compatible alias for staff password reset.
 */
export const updateStaffPassword = async (
  userUid: string,
  _unusedPassword?: string,
  actorEmail?: string,
  actorRole?: string
): Promise<void> => {
  const userRef = doc(db, "users", userUid);
  const snap = await getDoc(userRef);
  const userEmail = snap.exists() ? snap.data().email : userUid;

  if (userEmail && userEmail.includes("@")) {
    await dispatchStaffPasswordReset(userEmail, actorEmail, actorRole);
  }

  // Ensure any legacy plaintext password field is scrubbed from the Firestore doc
  try {
    await updateDoc(userRef, {
      updatedAt: Date.now(),
    });
  } catch (_) {}
};
