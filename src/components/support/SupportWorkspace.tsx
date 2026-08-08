import React, { useState } from "react";
import { useSupportData } from "../../hooks/useSupportData";
import { SupportCategory, TicketPriority, TicketStatus } from "../../types/support";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  HelpCircle,
  LifeBuoy,
  Plus,
  Search,
  Send,
  ShieldCheck
} from "lucide-react";

export type SupportSubPage =
  | "dashboard"
  | "tickets"
  | "create-ticket"
  | "knowledge-base"
  | "reports"
  | "notifications";

const ALL_CATEGORIES: SupportCategory[] = [
  "Technical Issue",
  "Account Access",
  "Data Discrepancy",
  "Application Bug",
  "Feature Request",
  "General Query",
];

const PriorityBadge: React.FC<{ value: TicketPriority }> = ({ value }) => {
  let color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (value === "Medium") color = "bg-sky-500/10 text-sky-400 border-sky-500/20";
  else if (value === "High") color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  else if (value === "Urgent") color = "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${color}`}>{value}</span>;
};

const StatusBadge: React.FC<{ value: TicketStatus }> = ({ value }) => {
  let color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (value === "In Progress") color = "bg-sky-500/10 text-sky-400 border-sky-500/20";
  else if (value === "Resolved" || value === "Closed") color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${color}`}>{value}</span>;
};

export const SupportWorkspace: React.FC<{ page: SupportSubPage }> = ({ page }) => {
  const support = useSupportData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [notice, setNotice] = useState("");

  // Create ticket state
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketCat, setTicketCat] = useState<SupportCategory>("Technical Issue");
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>("Medium");

  // Selected ticket detail state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<TicketStatus>("In Progress");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Article creation state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [artTitle, setArtTitle] = useState("");
  const [artContent, setArtContent] = useState("");
  const [artCat, setArtCat] = useState<SupportCategory>("Technical Issue");
  const [artTags, setArtTags] = useState("faq, troubleshooting");

  const filteredTickets = support.tickets.filter((t) => {
    const matchesSearch =
      `${t.ticketNumber} ${t.title} ${t.userEmail} ${t.category}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatusFilter === "All" || t.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredArticles = support.articles.filter((a) =>
    `${a.title} ${a.content} ${a.category}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTicket = support.tickets.find((t) => t.id === selectedTicketId);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle || !ticketDesc) return;
    try {
      await support.createTicket({
        title: ticketTitle,
        description: ticketDesc,
        category: ticketCat,
        priority: ticketPriority,
      });
      setNotice(`Support Ticket submitted successfully.`);
      setTicketTitle("");
      setTicketDesc("");
    } catch (err: any) {
      setNotice(`Failed to submit ticket: ${err.message}`);
    }
  };

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    try {
      await support.updateTicketStatus(selectedTicketId, newStatus, resolutionNotes);
      setNotice(`Ticket ${selectedTicket?.ticketNumber} updated to ${newStatus}`);
      setResolutionNotes("");
    } catch (err: any) {
      setNotice(`Status update failed: ${err.message}`);
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !commentText) return;
    try {
      await support.addTicketComment(selectedTicketId, commentText, isInternalComment);
      setCommentText("");
      setNotice(`Response added to ticket.`);
    } catch (err: any) {
      setNotice(`Failed to add comment: ${err.message}`);
    }
  };

  const handleCreateArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artContent) return;
    try {
      await support.createArticle({
        title: artTitle,
        content: artContent,
        category: artCat,
        tags: artTags.split(",").map((s) => s.trim()),
      });
      setNotice(`Knowledge Base article published.`);
      setShowArticleModal(false);
      setArtTitle("");
      setArtContent("");
    } catch (err: any) {
      setNotice(`Article publication failed: ${err.message}`);
    }
  };

  if (support.loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-emerald-400" />
            Support Operations — {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Technical and operational ticket resolution, SLA compliance, knowledge base, and user support.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {page === "knowledge-base" && (
            <button
              onClick={() => setShowArticleModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Article
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Open Tickets</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{support.metrics.totalOpen}</p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>In Progress</span>
                <HelpCircle className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{support.metrics.inProgress}</p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>High Priority</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{support.metrics.highPriorityCount}</p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Resolved Today</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{support.metrics.resolvedToday}</p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Avg SLA Target</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{support.metrics.avgResolutionHours}h</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center justify-between">
                <span>Recent Support Inquiries</span>
                <span className="text-xs text-emerald-400 font-medium">Live Feed</span>
              </h2>
              <div className="divide-y divide-[var(--border-default)]">
                {support.tickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{t.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {t.ticketNumber} • {t.userEmail} ({t.category})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge value={t.priority} />
                      <StatusBadge value={t.status} />
                      <button
                        onClick={() => setSelectedTicketId(t.id)}
                        className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-xs rounded"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-sm text-[var(--text-primary)]">Featured KB Articles</h2>
              <div className="divide-y divide-[var(--border-default)]">
                {support.articles.slice(0, 5).map((a) => (
                  <div key={a.id} className="py-3 space-y-1">
                    <div className="font-bold text-[var(--text-primary)]">{a.title}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{a.content}</div>
                  </div>
                ))}
                {support.articles.length === 0 && (
                  <div className="p-4 text-center text-[var(--text-muted)]">No articles created yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TICKETS PAGE */}
      {page === "tickets" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets by ID, user, title, category..."
                className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending User">Pending User</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Subject / Issue</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-mono font-bold text-emerald-400">{t.ticketNumber}</td>
                    <td className="p-3 font-bold text-[var(--text-primary)]">{t.title}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{t.category}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{t.userEmail}</td>
                    <td className="p-3">
                      <PriorityBadge value={t.priority} />
                    </td>
                    <td className="p-3">
                      <StatusBadge value={t.status} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTicketId(t.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-md"
                      >
                        Inspect / Respond
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TICKET FORM PAGE */}
      {page === "create-ticket" && (
        <div className="max-w-2xl mx-auto p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">Submit New Support Ticket</h2>
          <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Issue Title *</label>
              <input
                required
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="e.g. Unable to upload transcript PDF for student APP-4021"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Category</label>
                <select
                  value={ticketCat}
                  onChange={(e) => setTicketCat(e.target.value as SupportCategory)}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Priority</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Detailed Description *</label>
              <textarea
                required
                rows={5}
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                placeholder="Provide steps to reproduce, error codes, and student/application IDs..."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-5 py-2.5 bg-emerald-500 text-zinc-950 font-bold rounded-lg">
                Submit Support Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KNOWLEDGE BASE PAGE */}
      {page === "knowledge-base" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search KB articles and FAQs..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredArticles.map((art) => (
              <div key={art.id} className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-teal-400">{art.category}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">By {art.authorEmail}</span>
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">{art.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line">{art.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS PAGE */}
      {page === "reports" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
            <BookOpen className="w-8 h-8 text-emerald-400" />
            <h2 className="font-bold text-base text-[var(--text-primary)]">Support SLA & Resolution Analytics</h2>
            <p className="text-[var(--text-secondary)]">
              Turn-around time tracking, escalation frequency, and user satisfaction indicators.
            </p>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Support Report
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-sm text-[var(--text-primary)]">Urgent Ticket Escalations</h2>
          <div className="space-y-2">
            {support.tickets
              .filter((t) => t.priority === "Urgent" || t.priority === "High")
              .map((t) => (
                <div key={t.id} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>
                      Ticket <strong>{t.ticketNumber}</strong> ({t.title}) marked high priority.
                    </span>
                  </div>
                  <PriorityBadge value={t.priority} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL: TICKET INSPECTION & RESPONSE */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <div className="w-full max-w-2xl p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[var(--border-default)] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">{selectedTicket.ticketNumber}</span>
                <h2 className="font-bold text-base text-[var(--text-primary)]">{selectedTicket.title}</h2>
                <div className="text-xs text-[var(--text-secondary)]">From {selectedTicket.userEmail} ({selectedTicket.category})</div>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="font-bold text-xs hover:underline">
                Close
              </button>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-xs">
              <span className="font-bold block mb-1">Issue Details:</span>
              <p className="whitespace-pre-line">{selectedTicket.description}</p>
            </div>

            {/* Status Update Controls */}
            <form onSubmit={handleStatusChangeSubmit} className="p-3 border border-[var(--border-default)] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs">Update Ticket Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="p-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending User">Pending User</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Resolution details or closing summary..."
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              />
              <button className="px-3 py-1.5 bg-emerald-500 text-zinc-950 font-bold rounded text-xs">
                Save Status
              </button>
            </form>

            {/* Response Thread */}
            <div className="space-y-2">
              <span className="font-bold text-xs block">Communication Thread</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(selectedTicket.comments || []).map((cmt) => (
                  <div
                    key={cmt.id}
                    className={`p-2.5 rounded-lg border ${
                      cmt.isInternal
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        : "bg-[var(--bg-elevated)] border-[var(--border-default)]"
                    }`}
                  >
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                      <span>{cmt.authorEmail} {cmt.isInternal ? "(Internal Note)" : ""}</span>
                      <span>{new Date(cmt.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs">{cmt.comment}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddCommentSubmit} className="space-y-2 pt-2">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type your response or internal agent note..."
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                    />
                    <span>Internal Agent Note Only</span>
                  </label>
                  <button className="px-4 py-1.5 bg-emerald-500 text-zinc-950 font-bold rounded text-xs flex items-center gap-1">
                    <Send className="w-3 h-3" /> Send Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ARTICLE */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleCreateArticleSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-3"
          >
            <h2 className="font-bold text-base">Publish Knowledge Base Article</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Title *</label>
              <input
                required
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
                placeholder="e.g. How to verify student transcripts"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={artCat}
                onChange={(e) => setArtCat(e.target.value as SupportCategory)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Content / Instructions *</label>
              <textarea
                required
                rows={4}
                value={artContent}
                onChange={(e) => setArtContent(e.target.value)}
                placeholder="Step-by-step guide..."
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tags (comma separated)</label>
              <input
                value={artTags}
                onChange={(e) => setArtTags(e.target.value)}
                placeholder="e.g. faq, troubleshooting, transcripts"
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="px-3 py-1.5 bg-[var(--bg-hover)] rounded text-xs"
              >
                Cancel
              </button>
              <button className="px-4 py-1.5 bg-emerald-500 text-zinc-950 font-bold rounded text-xs">
                Publish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
