import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Mail, MessageCircle, Send, Smartphone } from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";

type Channel = "Email" | "SMS" | "WhatsApp" | "Internal";
type Communication = { id: string; channel: Channel; recipient: string; subject?: string; body: string; status: "Queued" | "Sent" | "Failed"; scheduledFor?: string; createdAt: number; createdBy: string };
const icons: Record<Channel, React.ReactNode> = { Email: <Mail className="w-4 h-4" />, SMS: <Smartphone className="w-4 h-4" />, WhatsApp: <MessageCircle className="w-4 h-4" />, Internal: <Send className="w-4 h-4" /> };

export const Communications: React.FC = () => {
  const { appUser } = useAuth();
  const [messages, setMessages] = useState<Communication[]>([]);
  const [channel, setChannel] = useState<Channel>("Email");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => onSnapshot(query(collection(db, "communications"), orderBy("createdAt", "desc")), (snapshot) => setMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Communication)), () => setNotice("Message history could not be loaded. Check your permissions.")), []);
  const summary = useMemo(() => ({ queued: messages.filter((item) => item.status === "Queued").length, sent: messages.filter((item) => item.status === "Sent").length, failed: messages.filter((item) => item.status === "Failed").length }), [messages]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setNotice(""); setSending(true);
    try {
      const status: Communication["status"] = "Queued";
      const document = await addDoc(collection(db, "communications"), { channel, recipient: recipient.trim(), subject: subject.trim() || null, body: body.trim(), scheduledFor: scheduledFor || null, status, createdAt: Date.now(), createdBy: appUser?.email || "Unknown" });
      await logAuditEvent("COMMUNICATION_QUEUED", appUser?.email || "Unknown", "Communication", `${channel} message queued for ${recipient.trim()}`, document.id, appUser?.role);
      setRecipient(""); setSubject(""); setBody(""); setScheduledFor(""); setNotice("Message queued. It will be delivered only after an approved channel provider is connected.");
    } catch (error: any) { setNotice(error.message || "Unable to queue message."); } finally { setSending(false); }
  };

  return <div className="space-y-6"><header><h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Communications</h1><p className="mt-1 text-sm text-[var(--text-secondary)]">Queue outbound communications and keep a permission-controlled history. Delivery integrations are configured separately.</p></header>
    <section className="grid grid-cols-3 gap-3">{[["Queued", summary.queued, "text-amber-300"], ["Sent", summary.sent, "text-emerald-400"], ["Failed", summary.failed, "text-rose-300"]].map(([label, value, style]) => <div key={label as string} className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card"><p className="text-xs text-[var(--text-muted)]">{label as string}</p><p className={`mt-2 text-2xl font-bold ${style as string}`}>{value as number}</p></div>)}</section>
    <div className="grid xl:grid-cols-5 gap-6"><form onSubmit={submit} className="xl:col-span-2 p-5 space-y-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card"><h2 className="font-bold text-sm">Compose message</h2><div className="grid grid-cols-2 gap-3"><label className="text-xs text-[var(--text-secondary)]">Channel<select value={channel} onChange={(event) => setChannel(event.target.value as Channel)} className="mt-1 w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input">{(["Email", "SMS", "WhatsApp", "Internal"] as Channel[]).map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs text-[var(--text-secondary)]">Schedule (optional)<input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} className="mt-1 w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input" /></label></div><label className="block text-xs text-[var(--text-secondary)]">Recipient email or phone<input required value={recipient} onChange={(event) => setRecipient(event.target.value)} className="mt-1 w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input" /></label>{channel === "Email" && <label className="block text-xs text-[var(--text-secondary)]">Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input" /></label>}<label className="block text-xs text-[var(--text-secondary)]">Message<textarea required rows={6} value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input" /></label><button disabled={sending} className="w-full py-2.5 bg-emerald-500 text-zinc-950 font-bold sq-btn disabled:opacity-50">{sending ? "Queueing..." : "Queue message"}</button>{notice && <p className="text-xs text-[var(--text-secondary)]">{notice}</p>}</form>
      <section className="xl:col-span-3 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden"><h2 className="p-5 font-bold text-sm">Message history</h2>{messages.length === 0 ? <p className="p-10 text-center text-[var(--text-muted)]">No messages have been queued yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase"><tr><th className="p-3">Channel</th><th className="p-3">Recipient</th><th className="p-3">Message</th><th className="p-3">Status</th><th className="p-3">Created</th></tr></thead><tbody className="divide-y divide-[var(--border-default)]">{messages.slice(0, 30).map((item) => <tr key={item.id}><td className="p-3"><span className="inline-flex items-center gap-1">{icons[item.channel]}{item.channel}</span></td><td className="p-3">{item.recipient}</td><td className="p-3 max-w-xs truncate">{item.subject || item.body}</td><td className="p-3"><span className="sq-badge px-2 py-1 bg-[var(--bg-elevated)]">{item.status}</span></td><td className="p-3">{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}</section></div></div>;
};
