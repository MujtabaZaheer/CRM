import { Bell } from "lucide-react";

export const NotificationsPage: React.FC = () => {
  const dummyNotifications = [
    {
      id: "1",
      title: "New Student Lead Registered",
      description: "Sarah Jenkins submitted a lead via Website form.",
      time: "10 mins ago",
      type: "info",
    },
    {
      id: "2",
      title: "Application Stage Update",
      description: "Application APP-2026-4819 changed to Conditional Offer.",
      time: "1 hour ago",
      type: "success",
    },
    {
      id: "3",
      title: "Task Overdue Reminder",
      description: "Follow up with Michael Regarding IELTS Test Result is overdue.",
      time: "3 hours ago",
      type: "alert",
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Notifications & Alerts</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Real-time activity alerts, task deadlines, and application status updates.
        </p>
      </div>

      <div className="space-y-3">
        {dummyNotifications.map((n) => (
          <div key={n.id} className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card flex items-start space-x-3.5">
            <div className="p-2 sq-avatar bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[var(--text-primary)]">{n.title}</h4>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{n.time}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{n.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
