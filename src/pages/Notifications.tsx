import React, { useState } from "react";
import { Bell, CheckCheck, Trash2, ShieldAlert, Clock, FileText, CheckCircle2 } from "lucide-react";
import { useNotifications } from "../contexts/NotificationProvider";

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = notifications.filter((n) => {
    if (filterType === "all") return true;
    return n.type === filterType;
  });

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <Bell className="w-7 h-7 text-emerald-400" />
            <span>Notifications & SLA Alerts</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time activity feed, deadline alerts, SLA escalation warnings, and stage changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { key: "all", label: `All (${notifications.length})` },
          { key: "escalation", label: `⚠️ SLA Escalations (${notifications.filter(n => n.type === "escalation").length})` },
          { key: "reminder", label: `🔔 Reminders (${notifications.filter(n => n.type === "reminder").length})` },
          { key: "stage_change", label: `🔄 Stage Changes (${notifications.filter(n => n.type === "stage_change").length})` },
          { key: "document_expiry", label: `📄 Doc Expiries (${notifications.filter(n => n.type === "document_expiry").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filterType === tab.key
                ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-zinc-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p>You are all caught up! No notifications matching this filter.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const isEscalation = n.type === "escalation";
            return (
              <div
                key={n.id}
                onClick={() => n.id && markAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between space-x-3 cursor-pointer ${
                  !n.read
                    ? isEscalation
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-emerald-500/5 border-emerald-500/30 shadow-md shadow-emerald-500/5"
                    : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isEscalation
                        ? "bg-rose-500/20 text-rose-400"
                        : n.type === "document_expiry"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {isEscalation ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : n.type === "document_expiry" ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-sm ${isEscalation ? "text-rose-300" : "text-[var(--text-primary)]"}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{n.message}</p>
                  </div>
                </div>

                {n.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id!);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

