import React, { useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationProvider";

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] sq-btn transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500 text-zinc-950 rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal shadow-2xl z-50 overflow-hidden text-xs">
          <div className="p-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-elevated)]">
            <span className="font-bold text-[var(--text-primary)]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-default)]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)]">No active notifications</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => n.id && markAsRead(n.id)}
                  className={`p-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors flex items-start justify-between space-x-2.5 ${
                    !n.read ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <div className="flex items-start space-x-2.5 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !n.read ? "bg-emerald-400" : "bg-transparent"
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{n.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{n.message}</div>
                      <div className="text-[9px] text-[var(--text-muted)] mt-1 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  {n.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id!);
                      }}
                      className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] text-center">
            <button
              onClick={() => {
                setShowDropdown(false);
                navigate("/notifications");
              }}
              className="text-[11px] font-semibold text-emerald-400 hover:underline"
            >
              View all notifications page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

