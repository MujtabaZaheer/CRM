import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  limit,
} from "firebase/firestore";
import {
  Send,
  MessageSquare,
  Sparkles,
  CheckCheck,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  GraduationCap,
  Clock,
  HelpCircle,
  Bot,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Paperclip,
  FileText,
  Download,
  Eye,
  X,
  FileCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { usePortalData } from "../../hooks/usePortalData";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import {
  getAICounselReply,
  AICounselMessage,
  ChatAttachment,
} from "../../utils/aiCounselEngine";
import {
  cacheDocumentFile,
  getCachedDocumentFile,
  getDocumentBlobOrUrl,
  uploadStudentDocument,
} from "../../utils/documentStorage";

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

interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  counsellorId: string;
  counsellorName: string;
  counsellorEmail?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: number;
  lastMessageSenderId?: string;
  createdAt: number;
  updatedAt: number;
}

interface PendingAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  isImage: boolean;
}

const STARTER_PROMPTS = [
  "how to choose best university across the world and select best program according to my qualification",
  "Could you please check my documents and verify if anything is missing?",
  "Can you review my profile and recommend top matching universities?",
  "What are the upcoming application deadlines for the September intake?",
];

// Helper to generate a small, lightweight thumbnail for fast rendering
const createThumbnail = (dataUrl: string, maxWidth = 260, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

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

export const StudentChat: React.FC = () => {
  const { appUser } = useAuth();
  const { ownStudent, ownApplications, ownDocuments } = usePortalData();
  const { universities } = useGlobalData();

  // Mode Switcher: Human Counsellor vs AI Advisor
  const [chatMode, setChatMode] = useState<"counsellor" | "ai">("counsellor");

  // Attachment Staging State (shared across modes or for currently active input)
  const [stagedAttachments, setStagedAttachments] = useState<PendingAttachment[]>([]);
  const [lightboxAttachment, setLightboxAttachment] = useState<ChatAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Chat State
  const [aiMessages, setAiMessages] = useState<AICounselMessage[]>([
    {
      id: "welcome-ai",
      sender: "ai",
      content: `Hello ${ownStudent?.fullName?.split(" ")[0] || "there"}! 👋 I am your **EduCRM AI Education Counsellor & System Guide**.\n\nI can counsel you on university selection, evaluate your qualification and uploaded documents, guide you on how to delete or resume draft applications, and help navigate every feature of this portal. You can also attach pictures or documents anytime. How can I assist your admissions journey today?`,
      timestamp: Date.now(),
      suggestions: [
        "how to choose best university across the world and select best program according to my qualification",
        "Could you please check my documents and verify if anything is missing?",
        "Recommend top universities matching my qualification",
        "How do I delete an unwanted draft application?",
      ],
    },
  ]);
  const [aiInputText, setAiInputText] = useState("");
  const [aiThinking, setAiThinking] = useState(false);

  // Human Counsellor State
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Counsellor details
  const [counsellorInfo, setCounsellorInfo] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>({
    id: "admissions_advisory",
    name: "Admissions Advisory Team",
    email: "admissions@crm.internal",
    role: "Senior Academic Advisor",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiMessages]);

  // Handle file selection from file picker
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: PendingAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 15MB limit.`);
        continue;
      }
      const isImage = file.type.startsWith("image/");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || (isImage ? "image/jpeg" : "application/pdf"),
        dataUrl,
        isImage,
      });
    }

    setStagedAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleRemoveStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Open / view attachment handler
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

    // Document (PDF, DOCX, TXT)
    try {
      const blobUrl = await getDocumentBlobOrUrl(att.id, att.fileUrl);
      if (blobUrl) {
        window.open(blobUrl, "_blank");
      } else if (att.fileUrl) {
        window.open(att.fileUrl, "_blank");
      } else if (att.dataUrl) {
        window.open(att.dataUrl, "_blank");
      } else {
        alert(`Opening ${att.name}... You can also find this file in your Document Vault.`);
      }
    } catch (err) {
      console.warn("Could not open document attachment:", err);
    }
  };

  // 1. Resolve Counsellor & Find/Create Conversation
  useEffect(() => {
    if (!appUser?.uid) return;

    let isMounted = true;

    const initConversation = async () => {
      setLoadingConv(true);
      setErrorMessage(null);

      try {
        let assignedId = ownStudent?.assignedCounsellorId;
        let assignedName = "Admissions Advisory Team";
        let assignedEmail = "admissions@crm.internal";
        let assignedRole = "Senior Academic Advisor";

        if (assignedId) {
          try {
            const userSnap = await getDocs(
              query(collection(db, "users"), where("uid", "==", assignedId), limit(1))
            );
            if (!userSnap.empty) {
              const uData = userSnap.docs[0].data();
              assignedName = uData.displayName || uData.fullName || assignedName;
              assignedEmail = uData.email || assignedEmail;
              assignedRole = uData.role === "counsellor" ? "Dedicated Education Counsellor" : "Admissions Advisor";
            }
          } catch (err) {
            console.warn("Could not fetch assigned counsellor document:", err);
          }
        } else {
          try {
            const staffSnap = await getDocs(
              query(collection(db, "users"), where("role", "in", ["counsellor", "team_leader", "org_admin"]), limit(1))
            );
            if (!staffSnap.empty) {
              const sData = staffSnap.docs[0].data();
              assignedId = sData.uid;
              assignedName = sData.displayName || sData.fullName || "Admissions Advisory";
              assignedEmail = sData.email || "counsellor@crm.internal";
              assignedRole = "Dedicated Education Counsellor";
            } else {
              assignedId = "central_admissions";
            }
          } catch (err) {
            console.warn("Could not fetch available staff:", err);
            assignedId = "central_admissions";
          }
        }

        if (isMounted) {
          setCounsellorInfo({
            id: assignedId || "central_admissions",
            name: assignedName,
            email: assignedEmail,
            role: assignedRole,
          });
        }

        const convQuery = query(
          collection(db, "conversations"),
          where("studentId", "==", appUser.uid),
          limit(1)
        );
        const convSnap = await getDocs(convQuery);

        if (!convSnap.empty) {
          const convDoc = convSnap.docs[0];
          const convData = { id: convDoc.id, ...convDoc.data() } as Conversation;
          if (isMounted) setConversation(convData);
        } else {
          const studentName =
            appUser.displayName ||
            ownStudent?.fullName ||
            appUser.email?.split("@")[0] ||
            "Student";
          const newConvId = `${appUser.uid}_${assignedId || "admissions"}`;
          const newConvData: Omit<Conversation, "id"> = {
            studentId: appUser.uid,
            studentName,
            studentEmail: appUser.email || "",
            counsellorId: assignedId || "central_admissions",
            counsellorName: assignedName,
            counsellorEmail: assignedEmail,
            participants: [appUser.uid, assignedId || "central_admissions"],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastMessage: "Conversation initialized",
            lastMessageTimestamp: Date.now(),
            lastMessageSenderId: "system",
          };

          const convDocRef = doc(db, "conversations", newConvId);
          await setDoc(convDocRef, newConvData, { merge: true });

          if (isMounted) {
            setConversation({ id: newConvId, ...newConvData });
          }
        }
      } catch (err: any) {
        console.error("Error initializing conversation:", err);
        if (isMounted) {
          setErrorMessage(err.message || "Failed to connect to counsellor chat.");
        }
      } finally {
        if (isMounted) setLoadingConv(false);
      }
    };

    initConversation();

    return () => {
      isMounted = false;
    };
  }, [appUser?.uid, ownStudent?.assignedCounsellorId]);

  // 2. Real-time Listener on Messages
  useEffect(() => {
    if (!conversation?.id) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    const messagesQuery = query(
      collection(db, "conversations", conversation.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const list: ChatMessage[] = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter((m: any) => !m.isInternalNote) as ChatMessage[];
        setMessages(list);
        setLoadingMessages(false);
      },
      (err) => {
        console.error("Failed to load messages:", err);
        setErrorMessage("Unable to sync messages. Please verify your connection.");
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [conversation?.id]);

  // 3. Send Message to Human Counsellor
  const handleSendMessage = async (textToSend?: string) => {
    const rawContent = (textToSend || inputText).trim();
    const hasAttachments = stagedAttachments.length > 0;
    if ((!rawContent && !hasAttachments) || !conversation?.id || !appUser?.uid || sending) return;

    setSending(true);
    setErrorMessage(null);

    const senderName =
      appUser.displayName ||
      ownStudent?.fullName ||
      appUser.email?.split("@")[0] ||
      "Student";

    const content = rawContent || (hasAttachments ? `📎 Attached ${stagedAttachments.length} file(s): ${stagedAttachments.map((a) => a.name).join(", ")}` : "");

    try {
      const now = Date.now();

      // Process and cache staged attachments
      const finalAttachments: ChatAttachment[] = [];
      for (const att of stagedAttachments) {
        let thumbnail = "";
        if (att.isImage) {
          thumbnail = await createThumbnail(att.dataUrl, 260, 0.75);
        }

        // Cache in local IndexedDB
        await cacheDocumentFile(att.id, att.dataUrl, att.name, att.type);

        // Also register in student_documents collection for permanent audit
        try {
          await uploadStudentDocument(
            appUser.uid,
            att.file,
            att.isImage ? "Chat Photo" : "Chat Document",
            undefined,
            att.id
          );
        } catch (uErr) {
          console.warn("Could not register attachment into student_documents:", uErr);
        }

        const cleanItem: ChatAttachment = {
          id: att.id,
          name: att.name,
          type: att.type || (att.isImage ? "image/jpeg" : "application/pdf"),
          size: typeof att.size === "number" ? att.size : 0,
        };
        if (att.isImage && thumbnail) {
          cleanItem.dataUrl = thumbnail;
        }
        finalAttachments.push(cleanItem);
      }

      const newMsg: Record<string, any> = {
        senderId: appUser.uid,
        senderName,
        senderRole: "student",
        content,
        timestamp: now,
        read: false,
      };
      if (finalAttachments.length > 0) {
        newMsg.attachments = finalAttachments;
      }

      // Add to subcollection with strict sanitization to prevent undefined errors
      await addDoc(
        collection(db, "conversations", conversation.id, "messages"),
        sanitizeForFirestore(newMsg)
      );

      // Update parent conversation
      const convRef = doc(db, "conversations", conversation.id);
      await updateDoc(convRef, {
        lastMessage: content,
        lastMessageTimestamp: now,
        lastMessageSenderId: appUser.uid,
        updatedAt: now,
      });

      // Optionally notify counsellor if staff UID exists
      if (
        conversation.counsellorId &&
        conversation.counsellorId !== "central_admissions" &&
        conversation.counsellorId !== "admissions_advisory"
      ) {
        try {
          await addDoc(collection(db, "notifications"), {
            targetUser: conversation.counsellorId,
            type: "chat_message",
            title: `New message from ${senderName}`,
            message: content.length > 80 ? content.slice(0, 77) + "..." : content,
            read: false,
            createdAt: now,
            link: `/counsellor/messages`,
          });
        } catch (notifErr) {
          console.warn("Could not dispatch counsellor notification:", notifErr);
        }
      }

      setInputText("");
      setStagedAttachments([]);
    } catch (err: any) {
      console.error("Error sending message:", err);
      setErrorMessage(err.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // 4. Send Message to AI Counsellor
  const handleSendAiMessage = async (customText?: string) => {
    const rawText = (customText || aiInputText).trim();
    const hasAttachments = stagedAttachments.length > 0;
    if ((!rawText && !hasAttachments) || aiThinking) return;

    const text = rawText || (hasAttachments ? `Please review the attached document(s): ${stagedAttachments.map((a) => a.name).join(", ")}` : "");

    // Process attachments for AI
    const formattedAttachments: ChatAttachment[] = [];
    for (const att of stagedAttachments) {
      let thumbnail = "";
      if (att.isImage) {
        thumbnail = await createThumbnail(att.dataUrl, 260, 0.75);
      }
      await cacheDocumentFile(att.id, att.dataUrl, att.name, att.type);

      if (appUser?.uid) {
        try {
          await uploadStudentDocument(
            appUser.uid,
            att.file,
            att.isImage ? "Chat Photo" : "Chat Document",
            undefined,
            att.id
          );
        } catch (uErr) {
          console.warn("Could not register attachment into student_documents:", uErr);
        }
      }

      formattedAttachments.push({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        dataUrl: att.isImage ? thumbnail : att.dataUrl,
      });
    }

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: AICounselMessage = {
      id: userMsgId,
      sender: "user",
      content: text,
      timestamp: Date.now(),
      ...(formattedAttachments.length > 0 ? { attachments: formattedAttachments } : {}),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInputText("");
    setStagedAttachments([]);
    setAiThinking(true);

    try {
      const history = aiMessages.map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      const context = {
        student: ownStudent,
        applications: ownApplications,
        universities,
        documents: ownDocuments,
        activeAttachments: formattedAttachments,
      };

      const result = await getAICounselReply(text, history, context);

      const aiMsg: AICounselMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        content: result.reply,
        timestamp: Date.now(),
        suggestions: result.suggestions,
        actionLink: result.actionLink,
      };

      setAiMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Counsellor reply error:", err);
      const errorMsg: AICounselMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        content:
          "I experienced a temporary network issue. Please ask again or feel free to switch to the **Dedicated Counsellor** tab to message our human advisory desk.",
        timestamp: Date.now(),
      };
      setAiMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAiThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatMode === "ai") {
        handleSendAiMessage();
      } else {
        handleSendMessage();
      }
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: ChatMessage[] }[] = [];
    messages.forEach((msg) => {
      const dateStr = formatDate(msg.timestamp);
      const existing = groups.find((g) => g.date === dateStr);
      if (existing) {
        existing.items.push(msg);
      } else {
        groups.push({ date: dateStr, items: [msg] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hidden file input for picture & document attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            {chatMode === "ai" ? (
              <>
                <Bot className="w-6 h-6 text-emerald-400" />
                AI Education Counsellor &amp; Guide
              </>
            ) : (
              <>
                <MessageSquare className="w-6 h-6 text-emerald-400" />
                Counsellor Advisory Desk
              </>
            )}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {chatMode === "ai"
              ? "Instant AI advising: Check your documents, explore program matching, evaluate targeted universities, and get comprehensive guidance."
              : "Connect directly with your dedicated education counsellor for application guidance, document reviews, and interview prep."}
          </p>
        </div>

        {/* Mode Selector Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-xs">
          <button
            type="button"
            onClick={() => setChatMode("counsellor")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chatMode === "counsellor"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Dedicated Counsellor</span>
          </button>
          <button
            type="button"
            onClick={() => setChatMode("ai")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chatMode === "ai"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Counsellor &amp; Guide</span>
          </button>
        </div>
      </header>

      {/* Main Chat Grid */}
      <div className="grid lg:grid-cols-12 gap-6 h-[740px]">
        {chatMode === "ai" ? (
          /* =================== AI COUNSELLOR SIDEBAR =================== */
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* AI Advisor Profile Card */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-emerald-500/30 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-zinc-950 font-bold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Bot className="w-8 h-8" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[var(--bg-card)] animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-[var(--text-primary)] truncate">
                      EduCRM AI Advisor
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      AI 2.5
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400 font-medium">
                    Personal Admissions &amp; System Guide
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active 24/7 &bull; Instant Help
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tailored recommendations based on your profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Analyzes uploaded documents &amp; attachments</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Deep database of global university programs</span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Step-by-step CRM portal assistance &amp; draft help</span>
                </div>
              </div>
            </div>

            {/* AI Quick Starters & Capabilities */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Quick Topics
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      label: "how to choose best university across the world and select best program according to my qualification",
                      display: "How to choose best university & program by qualification",
                      icon: "🎓",
                    },
                    {
                      label: "Could you please check my documents and verify if anything is missing?",
                      display: "Check my documents & application readiness",
                      icon: "📑",
                    },
                    {
                      label: "Review my targeted universities and active applications",
                      display: "Review my targeted universities",
                      icon: "🏛️",
                    },
                    {
                      label: "How do I delete an unwanted draft application?",
                      display: "How do I delete my draft applications?",
                      icon: "🗑️",
                    },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendAiMessage(item.label)}
                      disabled={aiThinking}
                      className="w-full text-left p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-emerald-500/40 hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)] hover:text-emerald-300 transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                    >
                      <span className="truncate pr-2">
                        <span className="mr-1.5">{item.icon}</span>
                        {item.display}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Need Official Human Review?
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Switch to the Dedicated Counsellor tab anytime to message your assigned counsellor directly.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* =================== HUMAN COUNSELLOR SIDEBAR =================== */
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Counsellor Profile Card */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
                    {counsellorInfo.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-[var(--text-primary)] truncate">
                    {counsellorInfo.name}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    {counsellorInfo.role}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {counsellorInfo.email}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified Education Consultant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Typical response time: within 2 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Specialized in UK, Canada, Australia &amp; USA</span>
                </div>
              </div>
            </div>

            {/* Quick Help & Guidance Box */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5 mb-3">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  How your counsellor helps
                </h4>
                <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>Program matching &amp; eligibility pre-screening</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>Statement of Purpose (SOP) critique &amp; editing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>Document &amp; picture verification before university submission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>Visa interview preparation &amp; guidance</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Need urgent assistance?
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Messages and documents posted here are tracked with priority notifications to our admissions office.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================== RIGHT AREA: CHAT TIMELINE & INPUT =================== */}
        {chatMode === "ai" ? (
          /* AI Chat Room */
          <div className="lg:col-span-8 flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm overflow-hidden h-full">
            {/* AI Room Top Bar */}
            <div className="px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    AI Counsellor &amp; Guide
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Live Intelligent Advisor
                    </span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Equipped with your profile, uploaded documents &amp; targeted universities
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAiMessages([
                    {
                      id: "welcome-ai",
                      sender: "ai",
                      content: `Hello ${
                        ownStudent?.fullName?.split(" ")[0] || "there"
                      }! 👋 I am your **EduCRM AI Education Counsellor & System Guide**.\n\nI can counsel you on university selection, evaluate your qualification and uploaded documents, guide you on how to delete or resume draft applications, and help navigate every feature of this portal. You can also attach pictures or documents anytime. How can I assist your admissions journey today?`,
                      timestamp: Date.now(),
                      suggestions: [
                        "how to choose best university across the world and select best program according to my qualification",
                        "Could you please check my documents and verify if anything is missing?",
                        "Recommend top universities matching my qualification",
                        "How do I delete an unwanted draft application?",
                      ],
                    },
                  ])
                }
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors cursor-pointer"
                title="Reset AI conversation"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* AI Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {aiMessages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow">
                        <Bot className="w-5 h-5 text-zinc-950" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 shadow-sm ${
                        isUser
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none"
                          : "bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[11px]">
                        <span
                          className={`font-semibold flex items-center gap-1.5 ${
                            isUser ? "text-emerald-100" : "text-emerald-400"
                          }`}
                        >
                          {isUser ? "You" : "AI Counsellor"}
                          {!isUser && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300">
                              AI
                            </span>
                          )}
                        </span>
                        <span
                          className={`${
                            isUser ? "text-emerald-200" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>

                      {/* Message Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-white/10 space-y-2">
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
                                    className="w-32 h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-[10px] text-white">
                                    <span className="truncate font-medium">{att.name}</span>
                                    <span className="flex items-center gap-1 text-emerald-300 mt-0.5">
                                      <Eye className="w-3 h-3" /> View image
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  key={att.id}
                                  onClick={() => handleOpenAttachment(att)}
                                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 hover:bg-black/40 border border-white/15 hover:border-emerald-400/60 cursor-pointer transition-all text-xs text-white"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 max-w-[160px]">
                                    <p className="font-semibold truncate">{att.name}</p>
                                    <p className="text-[10px] text-emerald-200/80">
                                      {att.size ? `${(att.size / 1024).toFixed(0)} KB` : "Document"} &bull; Click to open
                                    </p>
                                  </div>
                                  <Download className="w-3.5 h-3.5 text-emerald-300/70 ml-1 shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Link Button if present */}
                      {msg.actionLink && (
                        <div className="pt-2 border-t border-[var(--border-subtle)]">
                          <Link
                            to={msg.actionLink.url}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-sm"
                          >
                            <span>{msg.actionLink.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}

                      {/* Suggestions chips */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="pt-2 space-y-1.5 border-t border-[var(--border-subtle)]">
                          <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                            Suggested Next Steps:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleSendAiMessage(sug)}
                                disabled={aiThinking}
                                className="px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-card)] border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 text-emerald-300 text-left transition-all disabled:opacity-50 cursor-pointer"
                              >
                                💡 {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* AI Thinking Indicator */}
              {aiThinking && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0 shadow">
                    <Bot className="w-5 h-5 text-zinc-950 animate-bounce" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-tl-none flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Analyzing profile, documents &amp; formulating advice...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* AI Message Input Form */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] space-y-2.5">
              {/* Staged Attachments Preview Strip */}
              {stagedAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2.5 border-b border-[var(--border-subtle)]">
                  {stagedAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[var(--bg-card)] border border-emerald-500/40 text-xs text-[var(--text-primary)] shadow-sm"
                    >
                      {att.isImage ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 max-w-[140px]">
                        <p className="text-xs font-semibold truncate">{att.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {(att.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStagedAttachment(att.id)}
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="flex items-end gap-2.5"
              >
                {/* Attach Picture or Document button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] hover:border-emerald-500/40 text-[var(--text-muted)] hover:text-emerald-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  title="Attach picture or document (PDF, DOCX, JPG, PNG)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask AI: 'how to choose best university & program', 'check my documents', 'verify requirements'..."
                    rows={2}
                    className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] focus:border-emerald-500 focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] resize-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={(!aiInputText.trim() && stagedAttachments.length === 0) || aiThinking}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/20 active:scale-95 shrink-0 cursor-pointer"
                >
                  {aiThinking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Ask AI</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Human Counsellor Room */
          <div className="lg:col-span-8 flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm overflow-hidden h-full">
            {/* Chat Room Top Bar */}
            <div className="px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {counsellorInfo.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Direct Student Advisory Chat &bull; Encrypted &amp; Logged
                  </p>
                </div>
              </div>

              {conversation && (
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  Thread #{conversation.id.slice(-6)}
                </span>
              )}
            </div>

            {/* Error Banner if any */}
            {errorMessage && (
              <div className="px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingConv || loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm">Connecting to advisory channel...</p>
                </div>
              ) : messages.length === 0 ? (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Start a conversation with your counsellor
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-6">
                    Have questions about universities, program requirements, or document submissions? Send a message, attach documents, or pick a prompt below.
                  </p>

                  {/* Quick Starter Chips */}
                  <div className="grid gap-2 w-full text-left">
                    {STARTER_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        disabled={sending}
                        className="p-3 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-emerald-500/40 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                      >
                        <span className="truncate pr-2">{prompt}</span>
                        <Send className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message Timeline */
                groupedMessages.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-4">
                    {/* Date Separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                        {group.date}
                      </span>
                      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                    </div>

                    {group.items.map((msg) => {
                      const isOwn = msg.senderId === appUser?.uid;

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isOwn && (
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow">
                              {counsellorInfo.name[0] || "C"}
                            </div>
                          )}

                          <div
                            className={`max-w-[75%] rounded-2xl p-4 space-y-1.5 shadow-sm ${
                              isOwn
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none"
                                : "bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-none"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 text-[11px]">
                              <span
                                className={`font-semibold ${
                                  isOwn ? "text-emerald-100" : "text-emerald-400"
                                }`}
                              >
                                {isOwn ? "You" : msg.senderName}
                              </span>
                              <span
                                className={`${
                                  isOwn ? "text-emerald-200" : "text-[var(--text-muted)]"
                                }`}
                              >
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>

                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>

                            {/* Message Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="pt-2 mt-2 border-t border-white/10 space-y-2">
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
                                          className="w-32 h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-[10px] text-white">
                                          <span className="truncate font-medium">{att.name}</span>
                                          <span className="flex items-center gap-1 text-emerald-300 mt-0.5">
                                            <Eye className="w-3 h-3" /> View image
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        key={att.id}
                                        onClick={() => handleOpenAttachment(att)}
                                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 hover:bg-black/40 border border-white/15 hover:border-emerald-400/60 cursor-pointer transition-all text-xs text-white"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 max-w-[160px]">
                                          <p className="font-semibold truncate">{att.name}</p>
                                          <p className="text-[10px] text-emerald-200/80">
                                            {att.size ? `${(att.size / 1024).toFixed(0)} KB` : "Document"} &bull; Click to open
                                          </p>
                                        </div>
                                        <Download className="w-3.5 h-3.5 text-emerald-300/70 ml-1 shrink-0" />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {isOwn && (
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
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Drawer (when there are already messages) */}
            {messages.length > 0 && (
              <div className="px-6 py-2 bg-[var(--bg-main)] border-t border-[var(--border-subtle)] flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Quick ask:
                </span>
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(prompt)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/30 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    {prompt.length > 40 ? prompt.slice(0, 37) + "..." : prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Form */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] space-y-2.5">
              {/* Staged Attachments Preview Strip */}
              {stagedAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2.5 border-b border-[var(--border-subtle)]">
                  {stagedAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[var(--bg-card)] border border-emerald-500/40 text-xs text-[var(--text-primary)] shadow-sm"
                    >
                      {att.isImage ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 max-w-[140px]">
                        <p className="text-xs font-semibold truncate">{att.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {(att.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStagedAttachment(att.id)}
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2.5"
              >
                {/* Attach Picture or Document button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] hover:border-emerald-500/40 text-[var(--text-muted)] hover:text-emerald-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  title="Attach picture or document (PDF, DOCX, JPG, PNG)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] focus:border-emerald-500 focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] resize-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={(!inputText.trim() && stagedAttachments.length === 0) || sending}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/20 active:scale-95 shrink-0 cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Modal for Image Preview */}
      {lightboxAttachment && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxAttachment(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150"
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

export default StudentChat;
