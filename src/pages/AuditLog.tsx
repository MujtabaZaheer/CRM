import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { AuditLog } from "../types/audit";
import { RoleGate } from "../components/layout/RoleGate";
import { Search } from "lucide-react";

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: AuditLog[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as AuditLog);
      });
      setLogs(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">System Audit Log</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Immutable security trail of administrative actions, profile updates, and workflow events.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Filter audit logs by action, user email, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Audit Log Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Event Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">
                      Loading security audit trail...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 sq-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-[var(--text-primary)]">
                        {log.performedBy}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        {log.targetEntity}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-primary)] font-medium">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGate>
  );
};
