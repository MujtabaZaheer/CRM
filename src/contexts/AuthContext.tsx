import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { doc, onSnapshot, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, isDemoMode } from "../firebase/config";
import { AppUser, UserRole } from "../types/role";
import { DEMO_STUDENTS } from "../data/demoData";

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  isDemoMode: boolean;
  loginAsDemoRole: (role: UserRole, options?: { isRegisteredStudent?: boolean }) => void;
  logout: () => void;
  refreshFirebaseUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  isDemoMode: false,
  loginAsDemoRole: () => {},
  logout: () => {},
  refreshFirebaseUser: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem("educrm_demo_user");
      if (stored) return JSON.parse(stored) as AppUser;
    } catch (e) {
      console.warn("Failed to load stored demo user:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loginAsDemoRole = async (role: UserRole, options?: { isRegisteredStudent?: boolean }) => {
    let demoUser: AppUser;

    if (role === "student" && options?.isRegisteredStudent) {
      demoUser = {
        uid: "stu_1",
        email: "aarav.patel@gmail.com",
        displayName: "Aarav Patel",
        role: "student",
        createdAt: Date.now() - 86400000 * 10,
        office: "Delhi Hub",
        branchId: "branch-delhi",
        tenantId: "tenant-demo",
        onboardingStatus: "completed",
        profileCompleted: true,
        currentStep: 4,
      };
    } else {
      demoUser = {
        uid: `demo_${role}`,
        email: `${role}@educrm.demo`,
        displayName: `Demo ${role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
        role: role,
        createdAt: Date.now(),
        office: "London HQ",
        branchId: "branch-london",
        tenantId: "tenant-demo",
        partnerUniversityId: role === "university_partner" ? "univ-oxford" : undefined,
        ...(role === "student"
          ? { onboardingStatus: "not_started", profileCompleted: false, currentStep: 1 }
          : {}),
      };
    }

    try {
      localStorage.setItem("educrm_demo_user", JSON.stringify(demoUser));
    } catch (e) {
      console.warn("Failed to persist demo user:", e);
    }
    setAppUser(demoUser);
    setLoading(false);

    // Synchronize authoritative Firebase Auth session for demo role
    try {
      await signInWithEmailAndPassword(auth, demoUser.email, "EduCrmDemo2026!");
    } catch (authErr) {
      console.warn("Demo Firebase Auth session notice:", authErr);
    }

    try {
      await setDoc(doc(db, "users", demoUser.uid), {
        uid: demoUser.uid,
        email: demoUser.email,
        displayName: demoUser.displayName,
        role: demoUser.role,
        office: demoUser.office,
        branchId: demoUser.branchId,
        tenantId: demoUser.tenantId,
        createdAt: demoUser.createdAt,
        onboardingStatus: demoUser.onboardingStatus,
        profileCompleted: demoUser.profileCompleted,
        currentStep: demoUser.currentStep,
        ...(demoUser.partnerUniversityId ? { partnerUniversityId: demoUser.partnerUniversityId } : {}),
      }, { merge: true });

      if (role === "student" && options?.isRegisteredStudent) {
        const demoStudent = DEMO_STUDENTS[0];
        await setDoc(doc(db, "students", demoUser.uid), {
          ...demoStudent,
          id: demoUser.uid,
          onboardingStatus: "completed",
          profileCompleted: true,
          currentStep: 4,
          updatedAt: Date.now(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn("Could not write demo user profile to Firestore (app will still work locally):", err);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("educrm_demo_user");
    } catch (error) {
      console.warn("Failed to clear demo session:", error);
    }
    setAppUser(null);
    auth.signOut();
  };

  const refreshFirebaseUser = async () => {
    const current = auth.currentUser;
    if (!current) return null;
    await current.reload();
    setFirebaseUser(auth.currentUser);
    return auth.currentUser;
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        // Clear any leftover demo session when real auth is detected
        try { localStorage.removeItem("educrm_demo_user"); } catch {}

        const userDocRef = doc(db, "users", user.uid);
        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          async (docSnap) => {
            const normalizedEmail = (user.email || "").toLowerCase().trim();

            if (docSnap.exists()) {
              const uData = docSnap.data() as AppUser;

              // Auto-heal: If document was mistakenly created with role "student" but an invitation or
              // staff provision record exists for this email with a staff/non-student role, restore it.
              if (uData.role === "student" && normalizedEmail) {
                try {
                  const invQuery = query(
                    collection(db, "invitations"),
                    where("email", "==", normalizedEmail)
                  );
                  const invSnap = await getDocs(invQuery);
                  if (!invSnap.empty) {
                    const invData = invSnap.docs[0].data();
                    const properRole = invData.role as UserRole;
                    if (properRole && properRole !== "student") {
                      const healedUser: AppUser = {
                        ...uData,
                        role: properRole,
                        office: invData.office || uData.office || "Main Office",
                        onboardingStatus: "completed",
                        profileCompleted: true,
                        currentStep: 4,
                      };
                      await setDoc(userDocRef, healedUser, { merge: true });
                      setAppUser(healedUser);
                      setLoading(false);
                      return;
                    }
                  }
                } catch (healErr) {
                  console.warn("Could not check staff role auto-healing:", healErr);
                }
              }

              // Guarantee: Any non-student role (counsellor, etc.) always skips onboarding entirely
              if (uData.role && uData.role !== "student" && (uData.onboardingStatus !== "completed" || !uData.profileCompleted)) {
                const completedStaff: AppUser = {
                  ...uData,
                  onboardingStatus: "completed",
                  profileCompleted: true,
                  currentStep: 4,
                };
                try {
                  await setDoc(userDocRef, {
                    onboardingStatus: "completed",
                    profileCompleted: true,
                    currentStep: 4,
                  }, { merge: true });
                } catch (updErr) {
                  console.warn("Could not sync completed onboarding status to Firestore:", updErr);
                }
                setAppUser(completedStaff);
              } else {
                setAppUser(uData);
              }
            } else {
              // Auto-provision or link profile if doc(db, "users", user.uid) does not exist yet.
              let assignedRole: UserRole | null = null;
              let assignedOffice = "Main Office";
              let existingProfileData: Partial<AppUser> = {};

              // 1. Check if a pre-provisioned user record exists in 'users' with matching email
              try {
                const uQuery = query(
                  collection(db, "users"),
                  where("email", "==", normalizedEmail)
                );
                const uSnap = await getDocs(uQuery);
                if (!uSnap.empty) {
                  const matchDoc = uSnap.docs[0];
                  existingProfileData = matchDoc.data() as AppUser;
                  if (existingProfileData.role) {
                    assignedRole = existingProfileData.role;
                  }
                  if (existingProfileData.office) {
                    assignedOffice = existingProfileData.office;
                  }
                }
              } catch (uErr) {
                console.warn("Could not check existing users by email:", uErr);
              }

              // 2. Check 'invitations' collection if role not yet determined
              if (!assignedRole) {
                try {
                  const invQuery = query(
                    collection(db, "invitations"),
                    where("email", "==", normalizedEmail)
                  );
                  const invSnap = await getDocs(invQuery);
                  if (!invSnap.empty) {
                    const invData = invSnap.docs[0].data();
                    assignedRole = invData.role || null;
                    assignedOffice = invData.office || assignedOffice;
                  }
                } catch (invErr) {
                  console.warn("Could not check invitations:", invErr);
                }
              }

              // Default to student only if absolutely no staff record or invitation was found
              const finalRole: UserRole = assignedRole || "student";
              const isNonStudent = finalRole !== "student";

              const onboardingStatus: "not_started" | "in_progress" | "completed" = isNonStudent ? "completed" : "not_started";
              const profileCompleted = isNonStudent;
              const currentStep = isNonStudent ? 4 : 1;

              const defaultProfile: AppUser = {
                ...existingProfileData,
                uid: user.uid,
                email: user.email || "user@educrm.app",
                displayName: user.displayName || existingProfileData.displayName || user.email?.split("@")[0] || "EduCRM User",
                role: finalRole,
                createdAt: existingProfileData.createdAt || Date.now(),
                office: assignedOffice,
                branchId: existingProfileData.branchId || `branch-${assignedOffice.toLowerCase().replace(/\s+/g, "-")}`,
                tenantId: existingProfileData.tenantId || "tenant-default",
                onboardingStatus,
                profileCompleted,
                currentStep,
              };

              try {
                await setDoc(userDocRef, defaultProfile, { merge: true });
                setAppUser(defaultProfile);
              } catch (err) {
                console.warn("Could not auto-provision profile in Firestore:", err);
                setAppUser(defaultProfile);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user document:", error);
            const fallbackProfile: AppUser = {
              uid: user.uid,
              email: user.email || "user@educrm.app",
              displayName: user.displayName || user.email?.split("@")[0] || "EduCRM User",
              role: "student",
              createdAt: Date.now(),
              onboardingStatus: "not_started",
              profileCompleted: false,
              currentStep: 1,
            };
            setAppUser(fallbackProfile);
            setLoading(false);
          }
        );
      } else {
        // If not logged in via Firebase Auth, check if demo user is stored
        const storedDemo = localStorage.getItem("educrm_demo_user");
        if (storedDemo) {
          try {
            setAppUser(JSON.parse(storedDemo) as AppUser);
          } catch (error) {
            console.warn("Failed to restore demo session:", error);
            setAppUser(null);
          }
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, isDemoMode, loginAsDemoRole, logout, refreshFirebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
