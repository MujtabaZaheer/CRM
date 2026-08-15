import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, isDemoMode } from "../firebase/config";
import { AppUser, UserRole } from "../types/role";

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  isDemoMode: boolean;
  loginAsDemoRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  isDemoMode: false,
  loginAsDemoRole: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(() => {
    if (!isDemoMode) return null;
    try {
      const stored = localStorage.getItem("educrm_demo_user");
      if (stored) return JSON.parse(stored) as AppUser;
    } catch (e) {
      console.warn("Failed to load stored demo user:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loginAsDemoRole = (role: UserRole) => {
    if (!isDemoMode) return;
    const demoUser: AppUser = {
      uid: `demo_${role}`,
      email: `${role}@educrm.demo`,
      displayName: `Demo ${role.replace(/_/g, " ").toUpperCase()}`,
      role: role,
      createdAt: Date.now(),
      office: "Main HQ",
    };
    try {
      localStorage.setItem("educrm_demo_user", JSON.stringify(demoUser));
    } catch (e) {
      console.warn("Failed to persist demo user:", e);
    }
    setAppUser(demoUser);
    setLoading(false);
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

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setAppUser(docSnap.data() as AppUser);
            } else {
              // A Firebase account without a provisioned profile has no application role.
              // Never infer administrative access on the client.
              console.warn("Signed-in account has no EduCRM profile:", user.uid);
              setAppUser(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user document:", error);
            setLoading(false);
          }
        );
      } else {
        // If not logged in via Firebase Auth, check if demo user is stored
        const storedDemo = isDemoMode ? localStorage.getItem("educrm_demo_user") : null;
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
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, isDemoMode, loginAsDemoRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
