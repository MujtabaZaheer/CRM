import React, { useEffect, useState } from "react";
import { Mail, Plus, Edit3, Trash2, Eye, Copy, Check, Sparkles, X } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";

export interface EmailTemplate {
  id: string;
  name: string;
  category: "Admissions" | "Visa" | "Finance" | "General Inquiry" | "Follow-up";
  subject: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

const DEFAULT_TEMPLATES: Omit<EmailTemplate, "id">[] = [
  {
    name: "Conditional Offer Acceptance",
    category: "Admissions",
    subject: "Congratulations! Conditional Offer Issued for {{university_name}}",
    body: "Dear {{student_name}},\n\nWe are pleased to inform you that {{university_name}} has issued a Conditional Offer for your application to {{programme_name}}.\n\nPlease review your portal checklist to upload the remaining documents before {{deadline}}.\n\nBest regards,\n{{counsellor_name}}\nEduCRM Admissions Team",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    createdBy: "System Template",
  },
  {
    name: "Visa Document Preparation Notice",
    category: "Visa",
    subject: "Action Required: Visa Document Check for {{country_name}}",
    body: "Hi {{student_name}},\n\nYour visa file preparation for {{country_name}} is now active. Please schedule a document audit with your Visa Officer.\n\nRequired documents:\n1. Financial Proof & Bank Statements\n2. Passport Bio Page\n3. Academic Transcripts\n\nRegards,\nEduCRM Visa Desk",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    createdBy: "System Template",
  },
];

export const EmailTemplatesPage: React.FC = () => {
  const { appUser } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "Admissions" as EmailTemplate["category"],
    subject: "",
    body: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "email_templates"), orderBy("createdAt", "desc")),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmailTemplate);
        setTemplates(list.length > 0 ? list : (DEFAULT_TEMPLATES as unknown as EmailTemplate[]));
      },
      () => setTemplates(DEFAULT_TEMPLATES as unknown as EmailTemplate[])
    );
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateDoc(doc(db, "email_templates", editingTemplate.id), {
          ...form,
          updatedAt: Date.now(),
        });
        await logAuditEvent(
          "EMAIL_TEMPLATE_UPDATED",
          appUser?.email || "Admin",
          "Template",
          `Updated email template ${form.name}`,
          editingTemplate.id,
          appUser?.role
        );
      } else {
        const docRef = await addDoc(collection(db, "email_templates"), {
          ...form,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: appUser?.email || "Admin",
        });
        await logAuditEvent(
          "EMAIL_TEMPLATE_CREATED",
          appUser?.email || "Admin",
          "Template",
          `Created email template ${form.name}`,
          docRef.id,
          appUser?.role
        );
      }

      setShowEditor(false);
      setEditingTemplate(null);
      setForm({ name: "", category: "Admissions", subject: "", body: "" });
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteDoc(doc(db, "email_templates", id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const insertVariable = (variable: string) => {
    setForm((prev) => ({ ...prev, body: prev.body + ` {{${variable}}}` }));
  };

  const copyTemplateBody = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderPreviewText = (text: string) => {
    return text
      .replace(/{{student_name}}/g, "Sarah Jenkins")
      .replace(/{{university_name}}/g, "University of Manchester")
      .replace(/{{programme_name}}/g, "MSc Data Science")
      .replace(/{{deadline}}/g, "2026-09-15")
      .replace(/{{counsellor_name}}/g, appUser?.displayName || "Alex Counsellor")
      .replace(/{{country_name}}/g, "United Kingdom");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Email & Message Templates</h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Standardized email templates with dynamic tags for admissions, visa reminders, and fee invoices.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTemplate(null);
            setForm({ name: "", category: "Admissions", subject: "", body: "" });
            setShowEditor(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sq-btn shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((item) => (
          <div
            key={item.id}
            className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card space-y-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  {item.category}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">{item.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium truncate">Subject: {item.subject}</p>
              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-xs text-[var(--text-muted)] font-mono line-clamp-3 whitespace-pre-wrap">
                {item.body}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)] text-xs">
              <button
                onClick={() => setShowPreview(item)}
                className="text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyTemplateBody(item.id, item.body)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-400 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-btn"
                  title="Copy Content"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setEditingTemplate(item);
                    setForm({
                      name: item.name,
                      category: item.category,
                      subject: item.subject,
                      body: item.body,
                    });
                    setShowEditor(true);
                  }}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-white bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-btn"
                  title="Edit Template"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-rose-400 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-btn"
                  title="Delete Template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                {editingTemplate ? "Edit Template" : "Create Email Template"}
              </h2>
              <button onClick={() => setShowEditor(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[var(--text-secondary)] font-medium">
                  Template Name
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. CAS Release Notification"
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  />
                </label>

                <label className="block text-[var(--text-secondary)] font-medium">
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as EmailTemplate["category"] })}
                    className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                  >
                    <option value="Admissions">Admissions</option>
                    <option value="Visa">Visa</option>
                    <option value="Finance">Finance</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </label>
              </div>

              <label className="block text-[var(--text-secondary)] font-medium">
                Subject Line
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Update regarding your application {{application_number}}"
                  className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input"
                />
              </label>

              {/* Dynamic Variables Quick Buttons */}
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-semibold block mb-1">
                  Click to insert dynamic tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["student_name", "university_name", "programme_name", "deadline", "counsellor_name", "country_name"].map(
                    (v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono"
                      >
                        +{v}
                      </button>
                    )
                  )}
                </div>
              </div>

              <label className="block text-[var(--text-secondary)] font-medium">
                Message Body
                <textarea
                  required
                  rows={8}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Compose template text..."
                  className="w-full mt-1 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input font-mono"
                />
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] sq-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn">
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Template Sample Preview</span>
              </h3>
              <button onClick={() => setShowPreview(null)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded space-y-3 font-mono">
              <div className="text-emerald-400 font-bold">Subject: {renderPreviewText(showPreview.subject)}</div>
              <div className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                {renderPreviewText(showPreview.body)}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowPreview(null)} className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
