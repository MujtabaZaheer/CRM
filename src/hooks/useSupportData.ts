import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";
import {
  SupportArticle,
  SupportCategory,
  SupportMetrics,
  SupportTicket,
  TicketComment,
  TicketPriority,
  TicketStatus,
} from "../types/support";

export const useSupportData = () => {
  const { appUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [articles, setArticles] = useState<SupportArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loaded = 0;
    const finish = () => {
      loaded += 1;
      if (loaded >= 2) setLoading(false);
    };

    const unsubTickets = onSnapshot(
      query(collection(db, "support_tickets"), orderBy("createdAt", "desc")),
      (snap) => {
        setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportTicket));
        finish();
      },
      (err) => {
        console.warn("Tickets subscription error:", err.message);
        finish();
      }
    );

    const unsubArticles = onSnapshot(
      query(collection(db, "support_articles"), orderBy("createdAt", "desc")),
      (snap) => {
        setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportArticle));
        finish();
      },
      (err) => {
        console.warn("Articles subscription error:", err.message);
        finish();
      }
    );

    return () => {
      unsubTickets();
      unsubArticles();
    };
  }, []);

  const createTicket = useCallback(
    async (ticketData: {
      title: string;
      description: string;
      category: SupportCategory;
      priority: TicketPriority;
    }) => {
      try {
        const ticketNumber = `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const payload: Omit<SupportTicket, "id"> = {
          ticketNumber,
          title: ticketData.title,
          description: ticketData.description,
          category: ticketData.category,
          priority: ticketData.priority,
          status: "Open",
          userEmail: appUser?.email || "Unknown User",
          userName: appUser?.displayName || appUser?.email || "CRM User",
          assignedTo: appUser?.email || "Unassigned",
          comments: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const docRef = await addDoc(collection(db, "support_tickets"), payload);

        await logAuditEvent(
          "SUPPORT_TICKET_CREATED",
          appUser?.email || "Support User",
          "Support",
          `Created support ticket ${ticketNumber}: ${ticketData.title}`,
          docRef.id,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to create support ticket.");
      }
    },
    [appUser]
  );

  const updateTicketStatus = useCallback(
    async (ticketId: string, status: TicketStatus, resolutionNotes?: string) => {
      try {
        const target = tickets.find((t) => t.id === ticketId);
        const updates: Partial<SupportTicket> = {
          status,
          updatedAt: Date.now(),
        };
        if (resolutionNotes) updates.resolutionNotes = resolutionNotes;
        if (status === "Resolved" || status === "Closed") updates.resolvedAt = Date.now();

        await updateDoc(doc(db, "support_tickets", ticketId), updates);

        await logAuditEvent(
          "SUPPORT_TICKET_STATUS_UPDATED",
          appUser?.email || "Support User",
          "Support",
          `Updated ticket ${target?.ticketNumber || ticketId} status to ${status}`,
          ticketId,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to update ticket status.");
      }
    },
    [appUser, tickets]
  );

  const addTicketComment = useCallback(
    async (ticketId: string, commentText: string, isInternal = false) => {
      try {
        const target = tickets.find((t) => t.id === ticketId);
        if (!target) return;

        const newComment: TicketComment = {
          id: `cmt-${Date.now()}`,
          authorEmail: appUser?.email || "Support Agent",
          authorRole: appUser?.role || "support_user",
          comment: commentText,
          isInternal,
          createdAt: Date.now(),
        };

        const updatedComments = [...(target.comments || []), newComment];

        await updateDoc(doc(db, "support_tickets", ticketId), {
          comments: updatedComments,
          updatedAt: Date.now(),
        });

        await logAuditEvent(
          "SUPPORT_TICKET_COMMENT_ADDED",
          appUser?.email || "Support User",
          "Support",
          `Added ${isInternal ? "internal note" : "response"} to ticket ${target.ticketNumber}`,
          ticketId,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to add comment.");
      }
    },
    [appUser, tickets]
  );

  const createArticle = useCallback(
    async (article: { title: string; category: SupportCategory; content: string; tags: string[] }) => {
      try {
        const payload: Omit<SupportArticle, "id"> = {
          title: article.title,
          category: article.category,
          content: article.content,
          authorEmail: appUser?.email || "Support Team",
          tags: article.tags,
          views: 0,
          helpfulCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const docRef = await addDoc(collection(db, "support_articles"), payload);

        await logAuditEvent(
          "SUPPORT_ARTICLE_CREATED",
          appUser?.email || "Support User",
          "Support",
          `Published Knowledge Base article: ${article.title}`,
          docRef.id,
          appUser?.role
        );
      } catch (err: any) {
        throw new Error(err.message || "Failed to publish article.");
      }
    },
    [appUser]
  );

  const metrics: SupportMetrics = useMemo(() => {
    const totalOpen = tickets.filter((t) => t.status === "Open" || t.status === "Pending User").length;
    const inProgress = tickets.filter((t) => t.status === "In Progress").length;
    const highPriorityCount = tickets.filter(
      (t) => (t.priority === "High" || t.priority === "Urgent") && t.status !== "Resolved" && t.status !== "Closed"
    ).length;

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const resolvedToday = tickets.filter(
      (t) => (t.status === "Resolved" || t.status === "Closed") && (t.resolvedAt || 0) >= todayStart
    ).length;

    return {
      totalOpen,
      inProgress,
      highPriorityCount,
      resolvedToday,
      avgResolutionHours: 4.2, // Benchmark SLA
    };
  }, [tickets]);

  return {
    tickets,
    articles,
    metrics,
    loading,
    createTicket,
    updateTicketStatus,
    addTicketComment,
    createArticle,
  };
};
