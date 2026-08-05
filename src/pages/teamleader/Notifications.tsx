import React, { useState, useMemo } from "react";
import { useTeamLeaderData } from "../../hooks/useTeamLeaderData";
import { RoleGate } from "../../components/layout/RoleGate";
import { 
  Bell, 
  Check, 
  Trash2, 
  FileText, 
  FolderOpen, 
  UserCheck, 
  AlertCircle,
  Inbox,
  CheckSquare
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "unread" | "assignments" | "tasks" | "deadlines" | "documents" | "applications";
  isRead: boolean;
}

export const TeamLeaderNotifications: React.FC = () => {
  const {
    applications,
    tasks,
    loading
  } = useTeamLeaderData();

  // Simulated notifications that can be marked read
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [deletedNotifIds, setDeletedNotifIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");

  // Dynamically compute notification items based on real-time task & application state
  const computedNotifications = useMemo(() => {
    const items: NotificationItem[] = [];

    // 1. Task Deadline / Overdue Alerts
    const nowStr = new Date().toISOString().split("T")[0];
    tasks.forEach(t => {
      if (t.status !== "Completed" && t.dueDate < nowStr) {
        items.push({
          id: `task-overdue-${t.id}`,
          title: "Overdue Task Alert",
          description: `Task "${t.title}" assigned to ${t.assignedTo?.split("@")[0]} was due on ${t.dueDate} and is now overdue.`,
          time: "Overdue Alert",
          type: "deadlines",
          isRead: false
        });
      } else if (t.status !== "Completed" && t.dueDate === nowStr) {
        items.push({
          id: `task-today-${t.id}`,
          title: "Task Due Today",
          description: `Counsellor task "${t.title}" is scheduled for completion today.`,
          time: "Due Today",
          type: "tasks",
          isRead: false
        });
      }
    });

    // 2. Application Document Pending Alerts
    applications.forEach(a => {
      if (a.stage === "Documents Pending") {
        items.push({
          id: `app-docs-${a.id}`,
          title: "Pending Documents Review",
          description: `Application ${a.applicationNumber} for ${a.studentName} requires document submissions.`,
          time: "Docs Needed",
          type: "documents",
          isRead: false
        });
      } else if (["Conditional Offer", "Unconditional Offer"].includes(a.stage)) {
        items.push({
          id: `app-offer-${a.id}`,
          title: "Offer Letter Received",
          description: `Application ${a.applicationNumber} status changed to ${a.stage}.`,
          time: "Offer Issued",
          type: "applications",
          isRead: false
        });
      }
    });

    // 3. Static historical notifications for allocation
    const staticItems: NotificationItem[] = [
      {
        id: "static-1",
        title: "New Recruiter Assigned to Team",
        description: "An administrator updated counsellor profiles. Marcus Aurelius was assigned to Vancouver Office, Pacific Counsel.",
        time: "Yesterday",
        type: "assignments",
        isRead: false
      },
      {
        id: "static-2",
        title: "Visa Application Approved",
        description: "Great news! Student application APP-2026-7841 has received official Visa Approval.",
        time: "2 days ago",
        type: "applications",
        isRead: false
      },
      {
        id: "static-3",
        title: "Global Course Catalogue Updated",
        description: "New Master of Business Administration options added under UK university programs.",
        time: "3 days ago",
        type: "documents",
        isRead: false
      }
    ];

    // Combine all notifications
    const allItems = [...items, ...staticItems];

    // Map read status and filter deleted
    return allItems
      .map(item => ({
        ...item,
        isRead: readNotifIds.includes(item.id) ? true : item.isRead
      }))
      .filter(item => !deletedNotifIds.includes(item.id));
  }, [tasks, applications, readNotifIds, deletedNotifIds]);

  const handleMarkAllRead = () => {
    const unreadIds = computedNotifications.filter(n => !n.isRead).map(n => n.id);
    setReadNotifIds(prev => [...prev, ...unreadIds]);
  };

  const handleMarkOneRead = (id: string) => {
    setReadNotifIds(prev => [...prev, id]);
  };

  const handleDeleteOne = (id: string) => {
    setDeletedNotifIds(prev => [...prev, id]);
  };

  // Filtered Notifications based on active tab
  const filteredNotifications = computedNotifications.filter(n => {
    if (activeTab === "All") return true;
    if (activeTab === "Unread") return !n.isRead;
    return n.type === activeTab.toLowerCase();
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "assignments":
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case "tasks":
        return <CheckSquare className="w-4 h-4 text-teal-400" />;
      case "deadlines":
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case "documents":
        return <FolderOpen className="w-4 h-4 text-amber-400" />;
      case "applications":
        return <FileText className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  const unreadCount = computedNotifications.filter(n => !n.isRead).length;

  return (
    <RoleGate allowedRoles={["team_leader"]}>
      <div className="space-y-6 text-xs max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Team Notification Center</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Recruiter task reminders, university offer updates, and workload capacity alerts.
            </p>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 sq-btn transition-all font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex overflow-x-auto border-b border-[var(--border-default)] pb-1 space-x-3 scrollbar-none">
          {["All", "Unread", "Assignments", "Tasks", "Deadlines", "Documents", "Applications"].map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === "All" 
              ? computedNotifications.length 
              : tab === "Unread" 
              ? unreadCount 
              : computedNotifications.filter(n => n.type === tab.toLowerCase()).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-3 border-b-2 font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab} <span className="ml-1 text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              Loading active alerts...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card text-center text-[var(--text-muted)] flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 sq-avatar bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)]">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm text-[var(--text-primary)]">All Caught Up!</span>
                <p className="text-[10px]">No active notifications match this category.</p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 bg-[var(--bg-card)] border sq-card flex items-start justify-between gap-3.5 transition-all ${
                  n.isRead 
                    ? "opacity-60 border-[var(--border-default)]" 
                    : "border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent shadow-sm"
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div className="p-2 sq-avatar bg-[var(--bg-elevated)] border border-[var(--border-default)] flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-bold text-sm text-[var(--text-primary)] ${n.isRead ? "" : "text-emerald-400"}`}>
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{n.description}</p>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono block mt-1.5">{n.time}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkOneRead(n.id)}
                      className="p-1.5 bg-[var(--bg-elevated)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 border border-[var(--border-default)] sq-btn"
                      title="Mark as Read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteOne(n.id)}
                    className="p-1.5 bg-[var(--bg-elevated)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-400 border border-[var(--border-default)] sq-btn"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </RoleGate>
  );
};
export default TeamLeaderNotifications;
