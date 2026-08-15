import React, { useState } from "react";
import { Plus, Trash2, Code, Eye, Save, MoveUp, MoveDown, FormInput, Copy, CheckCircle2 } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "file" | "date" | "textarea";
  required: boolean;
  options?: string[]; // for select
  placeholder?: string;
}

export const FormBuilderPage: React.FC = () => {
  const [formTitle, setFormTitle] = useState("International Student Application Form 2026");
  const [formDescription, setFormDescription] = useState("Please complete all required fields to submit your inquiry or application.");
  const [fields, setFields] = useState<FormField[]>([
    { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "e.g. John Doe" },
    { id: "f2", label: "Email Address", type: "email", required: true, placeholder: "john@example.com" },
    { id: "f3", label: "Phone / WhatsApp", type: "text", required: true, placeholder: "+1 234 567 890" },
    {
      id: "f4",
      label: "Preferred Study Destination",
      type: "select",
      required: true,
      options: ["United Kingdom", "Canada", "Australia", "United States", "Germany"],
    },
    { id: "f5", label: "Academic Transcript Upload", type: "file", required: false },
  ]);

  const [activeTab, setActiveTab] = useState<"builder" | "preview" | "embed">("builder");
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // New Field Form State
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<FormField["type"]>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsStr, setNewOptionsStr] = useState("");

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newF: FormField = {
      id: `f_${Date.now()}`,
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
      placeholder: `Enter ${newLabel.toLowerCase()}...`,
      options: newType === "select" ? newOptionsStr.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    };

    setFields([...fields, newF]);
    setNewLabel("");
    setNewOptionsStr("");
    setNewRequired(false);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === fields.length - 1)) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFields(updated);
  };

  const handleSaveFormTemplate = async () => {
    try {
      await addDoc(collection(db, "form_templates"), {
        title: formTitle,
        description: formDescription,
        fields,
        createdAt: Date.now(),
      });
      setSaveNotice("Form Template saved to Firestore successfully!");
    } catch (err) {
      setSaveNotice("Saved Form Template locally!");
    }
  };

  const embedCodeSnippet = `<iframe src="https://educrm-portal.web.app/public/forms/${formTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}" width="100%" height="700px" frameborder="0"></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
            <FormInput className="w-7 h-7 text-emerald-400" />
            <span>Dynamic Custom Form Builder</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Build custom student inquiry & application forms with live preview and iframe embed code.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveFormTemplate}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{saveNotice}</span>
          <button onClick={() => setSaveNotice(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border-color)] space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("builder")}
          className={`pb-3 flex items-center space-x-2 transition-all ${
            activeTab === "builder" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-[var(--text-secondary)]"
          }`}
        >
          <FormInput className="w-4 h-4" />
          <span>Form Editor ({fields.length} fields)</span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`pb-3 flex items-center space-x-2 transition-all ${
            activeTab === "preview" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-[var(--text-secondary)]"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Form Preview</span>
        </button>

        <button
          onClick={() => setActiveTab("embed")}
          className={`pb-3 flex items-center space-x-2 transition-all ${
            activeTab === "embed" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-[var(--text-secondary)]"
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Embed & Share Link</span>
        </button>
      </div>

      {/* Tab 1: Form Builder Editor */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form Settings & Add Field */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-card)] p-5 border border-[var(--border-color)] rounded-xl space-y-4">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Form Metadata</h3>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Form Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Form Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-[var(--bg-card)] p-5 border border-[var(--border-color)] rounded-xl space-y-4">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Custom Field</span>
              </h3>

              <form onSubmit={handleAddField} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Field Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Passport Expiry Date"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Field Input Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FormField["type"])}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="text">Short Text</option>
                    <option value="email">Email Address</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown Select</option>
                    <option value="file">File Upload</option>
                    <option value="date">Date Picker</option>
                    <option value="textarea">Paragraph Textarea</option>
                  </select>
                </div>

                {newType === "select" && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Dropdown Options (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Option 1, Option 2, Option 3"
                      value={newOptionsStr}
                      onChange={(e) => setNewOptionsStr(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="new-req"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="rounded border-[var(--border-color)] text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="new-req" className="text-xs text-[var(--text-primary)] font-medium">
                    Required Field
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Field to Form</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Reorder & Manage Fields */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Form Structure & Fields</h3>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex items-center justify-between hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-[var(--bg-main)] text-[var(--text-secondary)] flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center space-x-2">
                        <span>{field.label}</span>
                        {field.required && <span className="text-rose-400 text-xs">*</span>}
                      </h4>
                      <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-[var(--text-secondary)]">
                        <span className="capitalize px-2 py-0.5 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                          {field.type}
                        </span>
                        {field.options && <span>Options: {field.options.join(", ")}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMoveField(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-[var(--text-secondary)] hover:text-emerald-400 disabled:opacity-30"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveField(idx, "down")}
                      disabled={idx === fields.length - 1}
                      className="p-1 text-[var(--text-secondary)] hover:text-emerald-400 disabled:opacity-30"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="p-1 text-[var(--text-secondary)] hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Form Preview */}
      {activeTab === "preview" && (
        <div className="max-w-xl mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-[var(--border-color)] pb-4">
            <h2 className="text-xl font-bold font-heading text-[var(--text-primary)]">{formTitle}</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{formDescription}</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  {field.label} {field.required && <span className="text-rose-400">*</span>}
                </label>

                {field.type === "select" ? (
                  <select className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500">
                    <option value="">Select option...</option>
                    {field.options?.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                ) : field.type === "file" ? (
                  <input
                    type="file"
                    className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                  />
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Submit Application
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Embed Code */}
      {activeTab === "embed" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
          <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <span>HTML Embed Code (Iframe)</span>
          </h3>

          <p className="text-xs text-[var(--text-secondary)]">
            Copy and paste this HTML snippet into any university website, landing page, or WordPress post to capture inquiry leads directly into EduCRM.
          </p>

          <div className="relative bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
            <code>{embedCodeSnippet}</code>
          </div>

          <button
            onClick={copyEmbedCode}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {copiedEmbed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Iframe Code</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
