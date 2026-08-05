import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { AppUser, UserRole } from "../types/role";

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  loginAsDemoRole: (role: UserRole, email?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  loginAsDemoRole: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Demo user state from localStorage
  const [demoUser, setDemoUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem("educrm_demo_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
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
                setAppUser({
                  uid: user.uid,
                  email: user.email || "user@crm.com",
                  displayName: user.displayName || "CRM User",
                  role: "platform_super_admin",
                  createdAt: Date.now(),
                });
              }
              setLoading(false);
            },
            (error) => {
              console.warn("Firestore snapshot error (using fallback user):", error);
              setAppUser({
                uid: user.uid,
                email: user.email || "user@crm.com",
                displayName: user.displayName || "CRM User",
                role: "platform_super_admin",
                createdAt: Date.now(),
              });
              setLoading(false);
            }
          );
        } else {
          setAppUser(null);
          setLoading(false);
        }
      },
      (err) => {
        console.warn("Firebase Auth listener error (using demo fallback mode):", err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const loginAsDemoRole = (role: UserRole, email?: string) => {
    const userEmail = email || `${role}@educrm.com`;
    const newDemoUser: AppUser = {
      uid: `demo-${role}-${Date.now()}`,
      email: userEmail,
      displayName: `${role.replace("_", " ").toUpperCase()} (Local Dev)`,
      role,
      office: "Toronto Office",
      team: "Americas Team",
      createdAt: Date.now(),
    };
    setDemoUser(newDemoUser);
    localStorage.setItem("educrm_demo_user", JSON.stringify(newDemoUser));
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      // ignore
    }
    setDemoUser(null);
    localStorage.removeItem("educrm_demo_user");
  };

  // Effective user is either real firebase user or local demo user
  const effectiveAppUser = appUser || demoUser;
  const effectiveFirebaseUser = firebaseUser || (demoUser ? ({ uid: demoUser.uid, email: demoUser.email } as User) : null);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser: effectiveFirebaseUser,
        appUser: effectiveAppUser,
        loading,
        loginAsDemoRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
