import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { runReminderChecks, ReminderNotification } from "../utils/reminderEngine";

interface NotificationContextType {
  notifications: ReminderNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<ReminderNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Run reminder check once on mount
    runReminderChecks().catch((err) => console.warn("Initial reminder check:", err));

    // Periodic reminder check every 5 minutes
    const interval = setInterval(() => {
      runReminderChecks().catch((err) => console.warn("Periodic reminder check:", err));
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const notifRef = collection(db, "notifications");
    const q = query(notifRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all: ReminderNotification[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as ReminderNotification));

        // Filter notifications relevant to current user
        const userEmail = appUser?.email?.toLowerCase();
        const userRole = appUser?.role;
        const filtered = all.filter((n) => {
          if (!n.targetUser || n.targetUser === "all") return true;
          if (userEmail && n.targetUser.toLowerCase() === userEmail) return true;
          if (userRole && n.targetUser === userRole) return true;
          return false;
        });

        setNotifications(filtered);
        setLoading(false);
      },
      (error) => {
        console.warn("Notifications listener warning:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.warn("Failed to mark notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read && n.id).forEach((n) => {
        if (n.id) {
          batch.update(doc(db, "notifications", n.id), { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.warn("Failed to mark all notifications read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
