import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db, firebaseConfig } from "../firebase/config";
import { AppUser } from "../types/role";

interface AdminBootstrapConfig {
  email: string;
  password: string;
  displayName: string;
  role: "platform_super_admin" | "org_admin";
  office: string;
}

const ADMIN_ACCOUNTS: AdminBootstrapConfig[] = [
  {
    email: "superadmin@crm.com",
    password: "superadmin123",
    displayName: "Platform Super Admin",
    role: "platform_super_admin",
    office: "Main Office",
  },
  {
    email: "orgadmin@crm.com",
    password: "orgadmin123",
    displayName: "Organization Admin",
    role: "org_admin",
    office: "Main Office",
  },
];

let bootstrapRan = false;

/**
 * Bootstraps the required admin accounts on first app load.
 * Idempotent — skips accounts that already exist in Firestore.
 * Uses a secondary Firebase app to avoid logging out the current user.
 */
export const bootstrapAdminAccounts = async (): Promise<void> => {
  if (bootstrapRan) return;
  bootstrapRan = true;

  for (const admin of ADMIN_ACCOUNTS) {
    try {
      // Check if Firestore profile already exists (by email lookup)
      // We'll check by a known doc convention — search by email in users collection
      const existingUsers = await import("firebase/firestore").then(({ collection, query, where, getDocs }) =>
        getDocs(query(collection(db, "users"), where("email", "==", admin.email)))
      );

      if (!existingUsers.empty) {
        // Account already exists in Firestore, skip
        continue;
      }

      // Create Firebase Auth account via secondary app
      const secondaryAppName = `Bootstrap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      let secondaryApp: any = null;
      let createdUid = `admin_${admin.role}_${Date.now()}`;

      try {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, admin.email, admin.password);
        if (cred.user) {
          createdUid = cred.user.uid;
          await signOut(secondaryAuth);
        }
      } catch (authErr: any) {
        if (authErr?.code === "auth/email-already-in-use") {
          // Auth account exists but Firestore doc is missing — we'll create it
          // Try to find the uid from auth (we can't easily without admin SDK)
          // Use a deterministic fallback uid
          console.info(`Admin auth account ${admin.email} already exists, syncing Firestore profile.`);
        } else {
          console.warn(`Bootstrap auth error for ${admin.email}:`, authErr?.message);
        }
      } finally {
        if (secondaryApp) {
          try { await deleteApp(secondaryApp); } catch (_) {}
        }
      }

      // Create Firestore user profile
      const adminProfile: AppUser = {
        uid: createdUid,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        office: admin.office,
        createdAt: Date.now(),
        onboardingStatus: "completed",
        profileCompleted: true,
      };

      await setDoc(doc(db, "users", createdUid), adminProfile, { merge: true });
      console.info(`Bootstrapped admin account: ${admin.email} (${admin.role})`);
    } catch (err: any) {
      console.warn(`Failed to bootstrap ${admin.email}:`, err?.message);
    }
  }
};
