import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import {
  MessageSquare,
  Search,
  Send,
  Lock,
  CheckSquare,
  Loader2,
  Check,
  CheckCheck,
  ExternalLink,
  X,
  Paperclip,
  FileText,
  Eye,
  Download,
  LifeBuoy,
  GraduationCap,
  Plane,
} from "lucide-react";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { logAuditEvent } from "../../utils/auditLogger";
import { Task, TaskPriority } from "../../types/task";
import { Link } from "react-router-dom";
import { ChatAttachment } from "../../utils/aiCounselEngine";
import {
  cacheDocumentFile,
  getCachedDocumentFile,
  getDocumentBlobOrUrl,
} from "../../utils/documentStorage";
import { UserRole } from "../../types/role";
import { ALLOWED_CHAT_TARGET_ROLES, COUNTERPART_ROLE_LABELS } from "../../utils/chatPermissions";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "counsellor" | "staff";
  content: string;
  timestamp: number;
  read: boolean;
  isInternalNote?: boolean;
  attachments?: ChatAttachment[];
}

// Helper to recursively remove undefined properties before writing to Firestore
const sanitizeForFirestore = <T,>(data: T): T => {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
};

interface ConversationItem {
  id: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  counsellorId?: string;
  counsellorName?: string;
  counsellorEmail?: string;
  participants: string[];
  channelType?: "counsellor" | "admissions" | "visa" | "support" | "internal" | string;
  targetRole?: UserRole | string;
  initiatorRole?: UserRole | string;
  initiatorName?: string;
  initiatorEmail?: string;
  targetStaffName?: string;
  lastMessage?: string;
  lastMessageTimestamp?: number;
  lastMessageSenderId?: string;
  createdAt: number;
  updatedAt: number;
  unreadCount?: number;
}

function getConversationMeta(
  conv: ConversationItem,
  currentUserRole?: UserRole | string,
  _currentUserId?: string
) {
  const isSupportChat = conv.channelType === "support" || conv.targetRole === "support_user";

  if (isSupportChat) {
    if (currentUserRole === "support_user") {
      const name = conv.initiatorName || conv.studentName || "Platform User";
      const email = conv.initiatorEmail || conv.studentEmail || "";
      const role = (conv.initiatorRole || "student") as UserRole;
      const roleLabel = COUNTERPART_ROLE_LABELS[role] || role.replace(/_/g, " ");
      return {
        title: name,
        subtitle: email,
        badge: roleLabel,
        badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        avatar: name.split(" ").map((n) => n[0]).slice(0, 2).join("") || "U",
        isStudent: role === "student",
        isSupport: false,
      };
    } else {
      return {
        title: "Global Support Desk",
        subtitle: "James Wilson • Global Support Officer",
        badge: "Support Officer",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        avatar: "GS",
        isStudent: false,
        isSupport: true,
      };
    }
  }

  return {
    title: conv.studentName || "Student",
    subtitle: conv.studentEmail || "student@educrm.demo",
    badge: "Student",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    avatar: (conv.studentName || "S").split(" ").map((n) => n[0]).slice(0, 2).join("") || "S",
    isStudent: true,
    isSupport: false,
  };
}

export const CounsellorMessages: React.FC = () => {
  const { appUser } = useAuth();
  const { addTask } = useGlobalData();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "mine" | "unread">("all");

  // Follow-up task modal state (CRM.pdf Section 3.12.12)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("Medium");
  const [taskDescription, setTaskDescription] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  // Attachments & Lightbox state
  const [stagedAttachments, setStagedAttachments] = useState<{
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    dataUrl: string;
    isImage: boolean;
  }[]>([]);
  const [lightboxAttachment, setLightboxAttachment] = useState<ChatAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list: typeof stagedAttachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 15MB limit.`);
        continue;
      }
      const isImage = file.type.startsWith("image/");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      list.push({
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || (isImage ? "image/jpeg" : "application/pdf"),
        dataUrl,
        isImage,
      });
    }

    setStagedAttachments((prev) => [...prev, ...list]);
    e.target.value = "";
  };

  const handleRemoveStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleOpenAttachment = async (att: ChatAttachment) => {
    if (att.type.startsWith("image/")) {
      let fullData = att.dataUrl || att.fileUrl || "";
      if (!fullData || fullData.length < 5000) {
        const cached = await getCachedDocumentFile(att.id);
        if (cached) fullData = cached;
      }
      setLightboxAttachment({ ...att, dataUrl: fullData || att.dataUrl });
      return;
    }

    try {
      const blobUrl = await getDocumentBlobOrUrl(att.id, att.fileUrl);
      if (blobUrl) {
        window.open(blobUrl, "_blank");
      } else if (att.fileUrl) {
        window.open(att.fileUrl, "_blank");
      } else if (att.dataUrl) {
        window.open(att.dataUrl, "_blank");
      } else {
        alert(`Opening ${att.name}...`);
      }
    } catch (err) {
      console.warn("Could not open document attachment:", err);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Listen to all conversations in real-time with local fallback
  useEffect(() => {
    setLoadingList(true);

    const getMergedLocal = (cloudList: ConversationItem[]): ConversationItem[] => {
      try {
        const raw = localStorage.getItem("educrm_local_conversations");
        if (!raw) return cloudList;
        const localList: ConversationItem[] = JSON.parse(raw);
        const map = new Map<string, ConversationItem>();
        // Add cloud first
        cloudList.forEach((c) => map.set(c.id, c));
        // Add or update local (if local is newer or not present)
        localList.forEach((c) => {
          if (!map.has(c.id) || ((c.updatedAt || 0) > (map.get(c.id)?.updatedAt || 0))) {
            map.set(c.id, c);
          }
        });
        return Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      } catch (_) {
        return cloudList;
      }
    };

    const convQuery = query(
      collection(db, "conversations"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      convQuery,
      (snapshot) => {
        const cloudList: ConversationItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ConversationItem[];
        const merged = getMergedLocal(cloudList);
        setConversations(merged);
        setLoadingList(false);

        // Auto-select first conversation if none selected
        if (!selectedConvId && merged.length > 0) {
          setSelectedConvId(merged[0].id);
        }
      },
      (err) => {
        console.warn("Firestore notice for conversations (loading active local registry):", err.message);
        const fallback = getMergedLocal([]);
        setConversations(fallback);
        if (!selectedConvId && fallback.length > 0) {
          setSelectedConvId(fallback[0].id);
        }
        setLoadingList(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Active selected conversation object
  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // 2. Real-time listener on active conversation messages with local fallback
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    // Immediately load local messages if available
    const localMsgsKey = `educrm_msgs_${selectedConvId}`;
    try {
      const stored = localStorage.getItem(localMsgsKey);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (_) {}

    const msgQuery = query(
      collection(db, "conversations", selectedConvId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      msgQuery,
      (snapshot) => {
        const msgs: ChatMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatMessage[];
        if (msgs.length > 0) {
          setMessages(msgs);
          try {
            localStorage.setItem(localMsgsKey, JSON.stringify(msgs));
          } catch (_) {}
        }
        setLoadingMessages(false);

        // Mark student messages as read
        snapshot.docs.forEach((d) => {
          const data = d.data() as ChatMessage;
          if (data.senderRole === "student" && !data.read) {
            updateDoc(doc(db, "conversations", selectedConvId, "messages", d.id), {
              read: true,
            }).catch(() => {});
          }
        });
      },
      (err) => {
        console.warn("Realtime Firestore notice for messages (using active local cache):", err.message);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [selectedConvId]);

  const allowedRoles = useMemo(() => {
    if (!appUser?.role) return [];
    return ALLOWED_CHAT_TARGET_ROLES[appUser.role] || [];
  }, [appUser?.role]);

  // Connect or open support thread
  const handleConnectSupport = async () => {
    if (!appUser?.uid) return;
    const supportConvId = `${appUser.uid}_support`;
    const existing = conversations.find(
      (c) =>
        c.id === supportConvId ||
        ((c.channelType === "support" || c.targetRole === "support_user") &&
          c.participants?.includes(appUser.uid))
    );
    if (existing) {
      setSelectedConvId(existing.id);
      return;
    }

    const userName =
      appUser.displayName ||
      appUser.email?.split("@")[0] ||
      (appUser.role === "external_agent" ? "External Agent" : "User");

    const welcomeMsg: ChatMessage = {
      id: `msg_welcome_${Date.now()}`,
      senderId: "usr_7",
      senderName: "James Wilson (Global Support)",
      senderRole: "staff",
      content: `Hello ${userName}! Welcome to Global Support Desk. How can our operations team assist your agency today?`,
      timestamp: Date.now(),
      read: true,
    };

    const newSupportData: ConversationItem = {
      id: supportConvId,
      studentId: appUser.uid,
      studentName: userName,
      studentEmail: appUser.email || "",
      initiatorName: userName,
      initiatorEmail: appUser.email || "",
      initiatorRole: appUser.role,
      counsellorId: "usr_7",
      counsellorName: "James Wilson (Global Support)",
      counsellorEmail: "support@educrm.demo",
      channelType: "support",
      targetRole: "support_user",
      participants: [appUser.uid, "usr_7"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessage: welcomeMsg.content,
      lastMessageTimestamp: Date.now(),
      lastMessageSenderId: "usr_7",
    };

    // 1. Immediately update in-memory conversations state
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === supportConvId);
      if (idx >= 0) return prev;
      return [newSupportData, ...prev];
    });

    // 2. Immediately cache in localStorage for instant responsiveness
    try {
      const raw = localStorage.getItem("educrm_local_conversations");
      const list: ConversationItem[] = raw ? JSON.parse(raw) : [];
      if (!list.some((c) => c.id === supportConvId)) {
        list.unshift(newSupportData);
        localStorage.setItem("educrm_local_conversations", JSON.stringify(list));
      }
      const msgsKey = `educrm_msgs_${supportConvId}`;
      const existingMsgs = localStorage.getItem(msgsKey);
      if (!existingMsgs) {
        localStorage.setItem(msgsKey, JSON.stringify([welcomeMsg]));
        setMessages([welcomeMsg]);
      }
    } catch (_) {}

    // 3. Immediately select conversation
    setSelectedConvId(supportConvId);

    // 4. Sync to Firestore in background
    try {
      await setDoc(doc(db, "conversations", supportConvId), newSupportData, { merge: true });
      await addDoc(
        collection(db, "conversations", supportConvId, "messages"),
        sanitizeForFirestore(welcomeMsg)
      );
    } catch (err) {
      console.warn("Notice: Support conversation stored locally, cloud notice:", err);
    }
  };

  // Auto-connect support desk for roles whose only permitted chat channel is support
  useEffect(() => {
    if (!appUser?.uid || loadingList) return;
    const isSupportOnlyRole =
      appUser.role === "external_agent" ||
      appUser.role === "university_partner" ||
      appUser.role === "auditor";

    if (isSupportOnlyRole) {
      const supportConvId = `${appUser.uid}_support`;
      const hasSupport = conversations.some(
        (c) =>
          c.id === supportConvId ||
          ((c.channelType === "support" || c.targetRole === "support_user") &&
            c.participants?.includes(appUser.uid))
      );
      if (!hasSupport) {
        handleConnectSupport();
      } else if (!selectedConvId) {
        const found = conversations.find(
          (c) =>
            c.id === supportConvId ||
            ((c.channelType === "support" || c.targetRole === "support_user") &&
              c.participants?.includes(appUser.uid))
        );
        setSelectedConvId(found?.id || supportConvId);
      }
    }
  }, [appUser?.uid, appUser?.role, loadingList, conversations.length, selectedConvId]);

  // Filter conversations strictly adhering to role permissions
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const isSupportChat = c.channelType === "support" || c.targetRole === "support_user";

      // 1. Strict Role-Based Visibility Check
      if (appUser?.role === "support_user") {
        // Support officer sees all support inquiries from all users,
        // and any conversation they are a participant in.
        if (!isSupportChat && !c.participants?.includes(appUser.uid)) {
          return false;
        }
      } else {
        // All other roles:
        if (isSupportChat) {
          // Must involve appUser
          const involvesMe =
            c.participants?.includes(appUser?.uid || "") ||
            c.studentId === appUser?.uid ||
            c.studentEmail === appUser?.email;
          if (!involvesMe) return false;
          // Must be allowed to chat with support
          if (!allowedRoles.includes("support_user")) return false;
        } else {
          // Counterpart is a student
          if (!allowedRoles.includes("student")) return false;

          // Department-specific checks
          if (appUser?.role === "counsellor") {
            if (c.channelType && c.channelType !== "counsellor") return false;
          } else if (appUser?.role === "admissions_officer") {
            if (c.channelType && c.channelType !== "admissions") return false;
          } else if (appUser?.role === "visa_officer") {
            if (c.channelType && c.channelType !== "visa") return false;
          } else {
            // Other roles (team_leader, auditor, super_admin, org_admin, agent, university)
            // CANNOT see student chats! (per user prompt: other user chat not show)
            return false;
          }
        }
      }

      // Search filtering
      const meta = getConversationMeta(c, appUser?.role, appUser?.uid);
      const matchSearch =
        meta.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === "mine") {
        return (
          c.counsellorId === appUser?.uid ||
          c.counsellorEmail === appUser?.email ||
          c.studentId === appUser?.uid ||
          (c.participants && appUser?.uid && c.participants.includes(appUser.uid))
        );
      }

      if (filterTab === "unread") {
        return (
          c.lastMessageSenderId &&
          c.lastMessageSenderId !== appUser?.uid
        );
      }

      return true;
    });
  }, [conversations, searchQuery, filterTab, appUser, allowedRoles]);

  // Auto-select first conversation if selectedConvId is not valid or empty
  useEffect(() => {
    if (filteredConversations.length > 0) {
      const exists = filteredConversations.some((c) => c.id === selectedConvId);
      if (!exists) {
        setSelectedConvId(filteredConversations[0].id);
      }
    } else if (selectedConvId && !conversations.some((c) => c.id === selectedConvId)) {
      setSelectedConvId(null);
    }
  }, [filteredConversations, selectedConvId, conversations]);

  // Send message or internal note handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawText = inputText.trim();
    const hasAttachments = stagedAttachments.length > 0;
    if ((!rawText && !hasAttachments) || !selectedConvId || !activeConv || sending) return;

    setSending(true);
    const now = Date.now();
    const isSupportChat = activeConv.channelType === "support" || activeConv.targetRole === "support_user";
    const senderRole = appUser?.role || "counsellor";
    const senderName =
      appUser?.displayName ||
      appUser?.email?.split("@")[0] ||
      (appUser?.role === "external_agent"
        ? "External Agent"
        : appUser?.role === "counsellor"
        ? "Education Counsellor"
        : "Staff");

    const text = rawText || (hasAttachments ? `📎 Attached ${stagedAttachments.length} file(s): ${stagedAttachments.map((a) => a.name).join(", ")}` : "");

    try {
      // Process attachments
      const finalAttachments: ChatAttachment[] = [];
      for (const att of stagedAttachments) {
        await cacheDocumentFile(att.id, att.dataUrl, att.name, att.type);
        const cleanItem: ChatAttachment = {
          id: att.id,
          name: att.name,
          type: att.type || (att.isImage ? "image/jpeg" : "application/pdf"),
          size: typeof att.size === "number" ? att.size : 0,
        };
        if (att.isImage && att.dataUrl) {
          cleanItem.dataUrl = att.dataUrl.slice(0, 10000);
        }
        finalAttachments.push(cleanItem);
      }

      const newMsg: Record<string, any> = {
        senderId: appUser?.uid || "staff",
        senderName,
        senderRole,
        content: text,
        timestamp: now,
        read: false,
        isInternalNote: Boolean(isInternalNote),
      };
      if (finalAttachments.length > 0) {
        newMsg.attachments = finalAttachments;
      }

      // 1. Immediately update UI and local storage
      const msgWithId: ChatMessage = {
        id: `staff_msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...newMsg,
      } as ChatMessage;

      setMessages((prev) => {
        const next = [...prev, msgWithId];
        try {
          localStorage.setItem(`educrm_msgs_${selectedConvId}`, JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      // Update parent in local conversations
      if (!isInternalNote) {
        try {
          const raw = localStorage.getItem("educrm_local_conversations");
          const allList: ConversationItem[] = raw ? JSON.parse(raw) : [];
          const idx = allList.findIndex((c) => c.id === selectedConvId);
          const updatedItem: ConversationItem = {
            ...activeConv,
            lastMessage: text,
            lastMessageTimestamp: now,
            lastMessageSenderId: appUser?.uid || "staff",
            updatedAt: now,
          };
          if (idx >= 0) {
            allList[idx] = updatedItem;
          } else {
            allList.unshift(updatedItem);
          }
          localStorage.setItem("educrm_local_conversations", JSON.stringify(allList));
        } catch (_) {}
      }

      setStagedAttachments([]);

      // 2. Cloud Firestore sync
      try {
        await addDoc(
          collection(db, "conversations", selectedConvId, "messages"),
          sanitizeForFirestore(newMsg)
        );

        if (!isInternalNote) {
          const updateFields: any = {
            lastMessage: text,
            lastMessageTimestamp: now,
            lastMessageSenderId: appUser?.uid || "staff",
            updatedAt: now,
          };
          if (!isSupportChat) {
            updateFields.counsellorId = appUser?.uid || activeConv.counsellorId;
            updateFields.counsellorName = senderName;
            updateFields.counsellorEmail = appUser?.email || activeConv.counsellorEmail;
          }
          await updateDoc(doc(db, "conversations", selectedConvId), updateFields);
        }
      } catch (cloudErr) {
        console.warn("Notice: Message saved locally, cloud sync notice:", cloudErr);
      }

      // 3. If it's NOT an internal note, notify student
      if (!isInternalNote) {

        // 3. Notify student
        if (activeConv.studentId) {
          try {
            await addDoc(collection(db, "notifications"), {
              targetUser: activeConv.studentId,
              type: "chat_reply",
              title: `New reply from ${senderName}`,
              message: text.length > 90 ? text.slice(0, 87) + "..." : text,
              read: false,
              createdAt: now,
              link: `/student/messages`,
            });
          } catch (nErr) {
            console.warn("Could not send student notification:", nErr);
          }
        }
      }

      // Log internal audit
      await logAuditEvent(
        isInternalNote ? "COMMUNICATION_INTERNAL_NOTE" : "COMMUNICATION_SENT",
        appUser?.email || "Staff",
        "Communication",
        isInternalNote
          ? `Added internal note to student ${activeConv.studentName} thread`
          : `Sent advisory message to student ${activeConv.studentName}`,
        selectedConvId,
        appUser?.role
      );

      setInputText("");
      setIsInternalNote(false);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert(err.message || "Failed to deliver message.");
    } finally {
      setSending(false);
    }
  };

  // Create Follow-up Task (CRM.pdf Section 3.12.12)
  const handleCreateFollowUpTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !activeConv) return;

    setSavingTask(true);
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title: taskTitle,
      description:
        taskDescription ||
        `Follow-up regarding conversation with student ${activeConv.studentName}`,
      dueDate: taskDueDate,
      priority: taskPriority,
      status: "Open",
      recurrence: "none",
      reminderMinutes: 30,
      linkedEntityType: "student",
      linkedEntityName: activeConv.studentName,
      assignedTo: appUser?.email || "Counsellor",
      createdBy: appUser?.email || "Staff",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTask(newTask);

    try {
      await addDoc(collection(db, "tasks"), newTask);
      await logAuditEvent(
        "TASK_CREATED",
        appUser?.email || "Staff",
        "Task",
        `Created follow-up task "${taskTitle}" from chat thread with ${activeConv.studentName}`,
        newTaskId,
        appUser?.role
      );
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
    } catch (err: any) {
      console.error("Failed to create task:", err);
      alert("Could not save task: " + err.message);
    } finally {
      setSavingTask(false);
    }
  };

  // Helper date/time formatters
  const formatTime = (ts?: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (ts?: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            {appUser?.role === "support_user" ? (
              <>
                <LifeBuoy className="w-6 h-6 text-amber-400" />
                Global Support Communications Desk
              </>
            ) : appUser?.role === "visa_officer" ? (
              <>
                <Plane className="w-6 h-6 text-purple-400" />
                Visa Communications &amp; Support
              </>
            ) : appUser?.role === "admissions_officer" ? (
              <>
                <GraduationCap className="w-6 h-6 text-sky-400" />
                Admissions Messages &amp; Support
              </>
            ) : appUser?.role === "team_leader" ? (
              <>
                <LifeBuoy className="w-6 h-6 text-emerald-400" />
                Team Leader Support Communications
              </>
            ) : appUser?.role === "auditor" || appUser?.role === "compliance_officer" ? (
              <>
                <LifeBuoy className="w-6 h-6 text-emerald-400" />
                Auditor Support Desk
              </>
            ) : appUser?.role === "platform_super_admin" ? (
              <>
                <LifeBuoy className="w-6 h-6 text-emerald-400" />
                Super Admin Support Desk
              </>
            ) : (
              <>
                <MessageSquare className="w-6 h-6 text-emerald-400" />
                Communications &amp; Support Hub
              </>
            )}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {appUser?.role === "support_user"
              ? "Live incoming inquiries and two-way conversations from students, counsellors, admissions, visa officers, and all platform staff."
              : appUser?.role === "team_leader" ||
                appUser?.role === "auditor" ||
                appUser?.role === "platform_super_admin" ||
                appUser?.role === "org_admin" ||
                appUser?.role === "external_agent" ||
                appUser?.role === "university_partner"
              ? "Direct two-way channel with the Global Support Desk for account questions, system tickets, and operational support."
              : "Role-governed communications with students and direct connection to the Global Support Desk."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {appUser?.role !== "support_user" && (
            <button
              type="button"
              onClick={handleConnectSupport}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/10 cursor-pointer"
              title="Open direct live chat with Global Support Desk"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Contact Support Desk</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Encrypted &amp; Logged</span>
          </div>
        </div>
      </header>

      {/* Main Two-Pane Chat Layout */}
      <div className="grid lg:grid-cols-12 gap-6 h-[740px]">
        {/* Left Pane: Conversation List */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] overflow-hidden shadow-sm h-full">
          {/* Search and Tabs */}
          <div className="p-4 border-b border-[var(--border-default)] space-y-3 bg-[var(--bg-elevated)]">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students, emails, messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs">
              <button
                onClick={() => setFilterTab("all")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                  filterTab === "all"
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterTab("mine")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                  filterTab === "mine"
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                My Assigned
              </button>
              <button
                onClick={() => setFilterTab("unread")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                  filterTab === "unread"
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Needs Reply
              </button>
            </div>
          </div>

          {/* Conversation List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
            {loadingList ? (
              <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] space-y-3">
                <LifeBuoy className="w-10 h-10 mx-auto text-amber-400 opacity-60" />
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {appUser?.role === "support_user" ? "No Support Conversations" : "No Conversations Found"}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {appUser?.role === "support_user"
                    ? "Incoming support inquiries from users across the platform will appear here."
                    : "You can start a direct consultation with the Global Support Desk."}
                </p>
                {appUser?.role !== "support_user" && (
                  <button
                    type="button"
                    onClick={handleConnectSupport}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>Connect with Support Desk</span>
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const meta = getConversationMeta(conv, appUser?.role, appUser?.uid);
                const isUnread =
                  conv.lastMessageSenderId &&
                  conv.lastMessageSenderId !== appUser?.uid;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3.5 group cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 border-l-4 border-emerald-500"
                        : "hover:bg-[var(--bg-hover)] border-l-4 border-transparent"
                    }`}
                  >
                    {/* Initials Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center shadow ${
                          meta.isSupport
                            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950"
                            : "bg-gradient-to-br from-emerald-600 to-teal-700 text-white"
                        }`}
                      >
                        {meta.avatar}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[var(--bg-card)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {meta.title}
                          </h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${meta.badgeColor}`}>
                            {meta.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                          {formatDate(conv.lastMessageTimestamp || conv.updatedAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                        {meta.subtitle}
                      </p>

                      <p
                        className={`text-xs mt-1 truncate ${
                          isUnread
                            ? "text-emerald-400 font-semibold"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Room */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] overflow-hidden shadow-sm h-full">
          {activeConv ? (
            <>
              {/* Chat Room Top Bar */}
              <div className="p-4 px-6 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-center justify-between">
                {(() => {
                  const activeMeta = getConversationMeta(activeConv, appUser?.role, appUser?.uid);
                  return (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center shadow ${
                          activeMeta.isSupport
                            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950"
                            : "bg-gradient-to-br from-emerald-600 to-teal-700 text-white"
                        }`}
                      >
                        {activeMeta.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">
                            {activeMeta.title}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${activeMeta.badgeColor}`}>
                            {activeMeta.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {activeMeta.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Actions (Task & Link) */}
                <div className="flex items-center gap-2">
                  {appUser?.role === "counsellor" && (
                    <>
                      <button
                        onClick={() => {
                          setTaskTitle(`Follow up with ${activeConv.studentName}`);
                          setIsTaskModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-main)] border border-[var(--border-default)] hover:border-emerald-500/30 text-[var(--text-secondary)] hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                        title="Create follow-up task (CRM.pdf 3.12.12)"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Create Task</span>
                      </button>

                      <Link
                        to="/counsellor/students"
                        className="p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="View Student Profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </>
                  )}
                  {(activeConv.channelType === "support" || activeConv.targetRole === "support_user") && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold flex items-center gap-1">
                      <LifeBuoy className="w-3 h-3" /> Priority Support Active
                    </span>
                  )}
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto text-[var(--text-muted)]">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No messages in this thread yet</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                      Type a response below to greet the student or record an internal note.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isStaff = msg.senderRole === "counsellor" || msg.senderRole === "staff";
                    const isInternal = !!msg.isInternalNote;

                    if (isInternal) {
                      // Internal Note Card (CRM.pdf 3.12.15)
                      return (
                        <div
                          key={msg.id}
                          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1 my-2 max-w-xl mx-auto"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" /> INTERNAL STAFF NOTE (Hidden from Student)
                            </span>
                            <span>{formatTime(msg.timestamp)} &bull; {msg.senderName}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      );
                    }

                    const isMyMessage =
                      msg.senderId === appUser?.uid ||
                      (!msg.senderId && msg.senderRole === appUser?.role) ||
                      (appUser?.role === "counsellor" && (msg.senderRole === "counsellor" || msg.senderRole === "staff"));

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          isMyMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMyMessage && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow">
                            {msg.senderName[0] || "S"}
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] rounded-2xl p-4 space-y-1 shadow-sm ${
                            isMyMessage
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none"
                              : "bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[11px]">
                            <span
                              className={`font-semibold ${
                                isStaff ? "text-emerald-100" : "text-emerald-400"
                              }`}
                            >
                              {msg.senderName}
                            </span>
                            <span
                              className={`${
                                isStaff ? "text-emerald-200" : "text-[var(--text-muted)]"
                              }`}
                            >
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>

                          {/* Render Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="pt-2 mt-1 border-t border-white/15 space-y-1.5">
                              <div className="flex flex-wrap gap-2">
                                {msg.attachments.map((att) => {
                                  const isImg = att.type?.startsWith("image/");
                                  return isImg ? (
                                    <div
                                      key={att.id}
                                      onClick={() => handleOpenAttachment(att)}
                                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/20 hover:border-emerald-400 bg-black/20 transition-all shadow-sm"
                                    >
                                      <img
                                        src={att.dataUrl || att.fileUrl || "/placeholder-image.png"}
                                        alt={att.name}
                                        className="w-28 h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 text-[9px] text-white">
                                        <span className="truncate">{att.name}</span>
                                        <span className="flex items-center gap-1 text-emerald-300">
                                          <Eye className="w-2.5 h-2.5" /> View
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      key={att.id}
                                      onClick={() => handleOpenAttachment(att)}
                                      className="flex items-center gap-2 p-2 rounded-xl bg-black/25 hover:bg-black/40 border border-white/15 hover:border-emerald-400/60 cursor-pointer transition-all text-[11px] text-white"
                                    >
                                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                                        <FileText className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0 max-w-[140px]">
                                        <p className="font-medium truncate">{att.name}</p>
                                        <p className="text-[9px] text-emerald-200/80">
                                          {att.size ? `${(att.size / 1024).toFixed(0)} KB` : "Doc"}
                                        </p>
                                      </div>
                                      <Download className="w-3 h-3 text-emerald-300/70 ml-1 shrink-0" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {isStaff && (
                            <div className="flex justify-end text-emerald-200 pt-0.5">
                              {msg.read ? (
                                <CheckCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer & Note Toggle */}
              <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] space-y-3">
                {/* Mode Selector (Student Reply vs Internal Note) */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        !isInternalNote
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Reply to Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isInternalNote
                          ? "bg-amber-500 text-zinc-950 shadow-sm"
                          : "bg-[var(--bg-main)] text-amber-400 hover:bg-amber-500/10 border border-amber-500/20"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      Internal Staff Note
                    </button>
                  </div>

                  {isInternalNote && (
                    <span className="text-[11px] text-amber-400 font-medium">
                      Note is visible only to internal counsellors and staff
                    </span>
                  )}
                </div>

                {/* Staged Attachments Preview Strip */}
                {stagedAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-[var(--border-subtle)]">
                    {stagedAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[var(--bg-card)] border border-emerald-500/40 text-xs text-[var(--text-primary)] shadow-sm"
                      >
                        {att.isImage ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 max-w-[120px]">
                          <p className="text-[11px] font-semibold truncate">{att.name}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">
                            {(att.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedAttachment(att.id)}
                          className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove attachment"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] hover:border-emerald-500/40 text-[var(--text-muted)] hover:text-emerald-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                    title="Attach document or photo"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        isInternalNote
                          ? "Type internal note for counselling team... (Hidden from student)"
                          : "Type your reply to student... (Press Enter to send)"
                      }
                      rows={2}
                      className={`w-full p-3 rounded-xl border text-xs text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] resize-none focus:outline-none transition-colors ${
                        isInternalNote
                          ? "bg-amber-500/5 border-amber-500/30 focus:border-amber-400"
                          : "bg-[var(--bg-input)] border-[var(--border-default)] focus:border-emerald-500"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={(!inputText.trim() && stagedAttachments.length === 0) || sending}
                    className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0 active:scale-95 ${
                      isInternalNote
                        ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                        : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                    }`}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{isInternalNote ? "Save Note" : "Send Reply"}</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)] space-y-3">
              <LifeBuoy className="w-12 h-12 mb-1 text-emerald-400 opacity-30" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {appUser?.role === "support_user" ? "Support Inquiry Workspace" : "No Conversation Selected"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                {appUser?.role === "support_user"
                  ? "Choose an incoming inquiry from the left panel to respond to users."
                  : "Choose a conversation thread from the left or connect directly with our 24/7 Global Support Desk."}
              </p>
              {appUser?.role !== "support_user" && (
                <button
                  type="button"
                  onClick={handleConnectSupport}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Start Live Support Chat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Task Modal (CRM.pdf Section 3.12.12) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                Create Follow-up Task
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUpTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Verify SOP draft and schedule mock visa interview"
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-medium mb-1">
                  Task Description / Context
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Additional context from conversation..."
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold flex items-center gap-1.5"
                >
                  {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Modal for Image Preview */}
      {lightboxAttachment && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxAttachment(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                  {lightboxAttachment.name}
                </span>
                {lightboxAttachment.size && (
                  <span className="text-xs text-[var(--text-muted)] shrink-0">
                    ({(lightboxAttachment.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = lightboxAttachment.dataUrl || lightboxAttachment.fileUrl;
                    if (url) {
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = lightboxAttachment.name;
                      a.click();
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxAttachment(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-rose-400 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-60px)] bg-black/40">
              <img
                src={lightboxAttachment.dataUrl || lightboxAttachment.fileUrl}
                alt={lightboxAttachment.name}
                className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounsellorMessages;
