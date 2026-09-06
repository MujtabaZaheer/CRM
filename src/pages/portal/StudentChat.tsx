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
} from "lucide-react";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { usePortalData } from "../../hooks/usePortalData";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "counsellor" | "staff";
  content: string;
  timestamp: number;
  read: boolean;
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

const STARTER_PROMPTS = [
  "Can you review my profile and recommend top matching universities?",
  "What are the upcoming application deadlines for the September intake?",
  "Could you please check my documents and verify if anything is missing?",
  "I have a question regarding visa requirements and financial proof.",
];

export const StudentChat: React.FC = () => {
  const { appUser } = useAuth();
  const { ownStudent } = usePortalData();

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
  }, [messages]);

  // 1. Resolve Counsellor & Find/Create Conversation
  useEffect(() => {
    if (!appUser?.uid) return;

    let isMounted = true;

    const initConversation = async () => {
      setLoadingConv(true);
      setErrorMessage(null);

      try {
        // Step A: Determine assigned counsellor
        let assignedId = ownStudent?.assignedCounsellorId;
        let assignedName = "Admissions Advisory Team";
        let assignedEmail = "admissions@crm.internal";
        let assignedRole = "Senior Academic Advisor";

        // Try to fetch counsellor profile from users collection
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
          // If no assigned counsellor, query for any available counsellor or staff
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

        // Step B: Check for existing conversation with this student
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
          // Create new conversation
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
        const list: ChatMessage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatMessage[];
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

  // 3. Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || !conversation?.id || !appUser?.uid || sending) return;

    setSending(true);
    setErrorMessage(null);

    const senderName =
      appUser.displayName ||
      ownStudent?.fullName ||
      appUser.email?.split("@")[0] ||
      "Student";

    try {
      const now = Date.now();
      const newMsg = {
        senderId: appUser.uid,
        senderName,
        senderRole: "student" as const,
        content,
        timestamp: now,
        read: false,
      };

      // Add to subcollection
      await addDoc(
        collection(db, "conversations", conversation.id, "messages"),
        newMsg
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
            link: `/counsellor/students`,
          });
        } catch (notifErr) {
          // Non-blocking notification error
          console.warn("Could not dispatch counsellor notification:", notifErr);
        }
      }

      setInputText("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setErrorMessage(err.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp helper
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

  // Group messages by calendar day
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
      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            Counsellor Advisory Desk
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Connect directly with your dedicated education counsellor for application guidance, document reviews, and interview prep.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Active Advisory Channel
        </div>
      </header>

      {/* Main Chat Grid */}
      <div className="grid lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Sidebar / Counsellor Info Card */}
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
                <span>Specialized in UK, Canada, Australia & USA</span>
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
                  <span>Program matching & eligibility pre-screening</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Statement of Purpose (SOP) critique & editing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Document verification before university submission</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Visa interview preparation & guidance</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Need urgent assistance?
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Messages posted here are tracked with priority notifications to our admissions office.
              </p>
            </div>
          </div>
        </div>

        {/* Right Area: Conversation Messages & Input Area */}
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
                  Have questions about universities, program requirements, or document submissions? Send a message below or pick a quick starter prompt.
                </p>

                {/* Quick Starter Chips */}
                <div className="grid gap-2 w-full text-left">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={sending}
                      className="p-3 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-emerald-500/40 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-between group disabled:opacity-50"
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
              {STARTER_PROMPTS.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(prompt)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/30 whitespace-nowrap transition-colors"
                >
                  {prompt.length > 40 ? prompt.slice(0, 37) + "..." : prompt}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Form */}
          <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-3"
            >
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
                disabled={!inputText.trim() || sending}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/20 active:scale-95 shrink-0"
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
      </div>
    </div>
  );
};

export default StudentChat;
