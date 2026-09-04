import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, isDemoMode } from "../firebase/config";
import { AppUser, UserRole } from "../types/role";

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  isDemoMode: boolean;
  loginAsDemoRole: (role: UserRole) => void;
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

  const loginAsDemoRole = async (role: UserRole) => {
    const demoUser: AppUser = {
      uid: `demo_${role}`,
      email: `${role}@educrm.demo`,
      displayName: `Demo ${role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      role: role,
      createdAt: Date.now(),
      office: "London HQ",
      branchId: "branch-london",
      tenantId: "tenant-demo",
      partnerUniversityId: role === "university_partner" ? "univ-oxford" : undefined,
    };
    try {
      localStorage.setItem("educrm_demo_user", JSON.stringify(demoUser));
    } catch (e) {
      console.warn("Failed to persist demo user:", e);
    }
    setAppUser(demoUser);
    setLoading(false);

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
        ...(demoUser.partnerUniversityId ? { partnerUniversityId: demoUser.partnerUniversityId } : {}),
      }, { merge: true });
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
            if (docSnap.exists()) {
              setAppUser(docSnap.data() as AppUser);
            } else {
              // Auto-provision basic profile if missing so live sign-in succeeds
              const defaultProfile: AppUser = {
                uid: user.uid,
                email: user.email || "user@educrm.app",
                displayName: user.displayName || user.email?.split("@")[0] || "EduCRM User",
                // A missing profile must never grant administrative access. Staff are
                // provisioned by an administrator; a newly discovered account starts
                // with the least-privileged student role.
                role: "student",
                createdAt: Date.now(),
                office: "Main Office",
                branchId: "branch-main",
                tenantId: "tenant-default",
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
