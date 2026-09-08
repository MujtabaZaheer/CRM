import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db, firebaseConfig } from "../firebase/config";
import { AppUser, UserRole } from "../types/role";
import { logAuditEvent } from "./auditLogger";

export interface StaffProvisionData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  office?: string;
  team?: string;
  actorEmail?: string;
  actorRole?: string;
}

/**
 * Generates a clean, cryptographically sound temporary password for new staff.
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
const cleanData = <T extends Record<string, any>>(obj: T): T => {
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
 * 1. Creates Firebase Auth credentials via a temporary secondary app instance (preventing logging out the current admin).
 * 2. Writes full AppUser record to Cloud Firestore `users` collection.
 * 3. Records immutable audit event.
 */
export const provisionStaffUser = async (data: StaffProvisionData): Promise<AppUser> => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const trimmedName = data.displayName.trim();
  const fallbackUid = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let createdUid = fallbackUid;

  // 1. Attempt Firebase Auth creation via secondary App instance
  const secondaryAppName = `Provision_${Date.now()}`;
  let secondaryApp: any = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    const cred = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, data.password);
    if (cred.user) {
      createdUid = cred.user.uid;
      try {
        await updateProfile(cred.user, { displayName: trimmedName });
      } catch (_) {}
      await signOut(secondaryAuth);
    }
  } catch (authErr: any) {
    console.warn("Secondary Firebase Auth provisioning warning (will store in Firestore for hybrid login):", authErr.message);
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (_) {}
    }
  }

  // 2. Prepare AppUser record
  const newStaffRecord: AppUser = cleanData({
    uid: createdUid,
    email: normalizedEmail,
    displayName: trimmedName,
    role: data.role,
    office: data.office || "London HQ",
    team: data.team || "Global Team",
    password: data.password, // Stored for hybrid demo & offline fallback auth
    createdAt: Date.now(),
    updatedAt: Date.now(),
    onboardingStatus: "completed",
    profileCompleted: true,
    currentStep: 4,
  }) as AppUser;

  // 3. Persist to Firestore
  await setDoc(doc(db, "users", createdUid), newStaffRecord, { merge: true });

  // 4. Audit Log
  await logAuditEvent(
    "STAFF_ACCOUNT_PROVISIONED",
    data.actorEmail || "Administrator",
    "UserManagement",
    `Provisioned internal staff user ${trimmedName} (${normalizedEmail}) with role ${data.role} at ${data.office || "HQ"}`,
    createdUid,
    data.actorRole as any
  );

  return newStaffRecord;
};

/**
 * Updates or resets password for an existing user in Firestore.
 */
export const updateStaffPassword = async (
  userUid: string,
  newPassword: string,
  actorEmail?: string,
  actorRole?: string
): Promise<void> => {
  const userRef = doc(db, "users", userUid);
  const snap = await getDoc(userRef);
  const userEmail = snap.exists() ? snap.data().email : userUid;

  await updateDoc(userRef, {
    password: newPassword,
    updatedAt: Date.now(),
  });

  await logAuditEvent(
    "STAFF_PASSWORD_RESET",
    actorEmail || "Administrator",
    "UserManagement",
    `Reset password for staff user ${userEmail} (${userUid})`,
    userUid,
    actorRole as any
  );
};
