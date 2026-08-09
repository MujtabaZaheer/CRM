import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { AppUser, UserRole } from "../types/role";

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  loginAsDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  loginAsDemoRole: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loginAsDemoRole = (role: UserRole) => {
    const demoUser: AppUser = {
      uid: `demo_${role}`,
      email: `${role}@educrm.demo`,
      displayName: `Demo ${role.replace(/_/g, " ").toUpperCase()}`,
      role: role,
      createdAt: Date.now(),
      office: "Main HQ",
    };
    setAppUser(demoUser);
    setLoading(false);
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
              // Default to super admin if doc doesn't exist yet
              setAppUser({
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || "Admin User",
                role: "platform_super_admin",
                createdAt: Date.now(),
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user document:", error);
            setLoading(false);
          }
        );
      } else {
        // Keep demo user if currently logged in via demo button
        if (!appUser || !appUser.uid.startsWith("demo_")) {
          setAppUser(null);
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
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, loginAsDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
