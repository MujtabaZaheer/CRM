import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, updateDoc, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { Loader2, Send, AlertCircle, FileUp, ShieldCheck } from "lucide-react";

interface ConditionalRule {
  dependsOnField: string;
  equalsValue: string;
}

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "file" | "date" | "textarea";
  required: boolean;
  options?: string[];
  placeholder?: string;
  conditionalRules?: ConditionalRule[];
}

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  published?: boolean;
  viewCount?: number;
  startCount?: number;
  submitCount?: number;
}

const DEFAULT_PUBLIC_FORM: FormTemplate = {
  id: "ug-intake-2026",
  title: "International Student Direct Application 2026",
  description: "Complete your official application form to receive fast-track university matching, scholarship guidance, and visa support.",
  published: true,
  fields: [
    { id: "fullName", label: "Full Legal Name (as on passport)", type: "text", required: true, placeholder: "e.g. Amina Khan" },
    { id: "email", label: "Email Address", type: "email", required: true, placeholder: "e.g. amina.khan@example.com" },
    { id: "phone", label: "WhatsApp / Phone Number", type: "text", required: true, placeholder: "+44 7123 456789" },
    { id: "nationality", label: "Country of Citizenship", type: "text", required: true, placeholder: "e.g. Nigeria, Pakistan, India" },
    { id: "targetCountry", label: "Preferred Study Destination", type: "select", required: true, options: ["United Kingdom", "Canada", "Australia", "United States", "Germany"] },
    { id: "targetDegree", label: "Desired Degree Level", type: "select", required: true, options: ["Undergraduate (BSc/BA)", "Postgraduate (MSc/MA)", "Doctorate (PhD)", "Foundation Pathway"] },
    { id: "programmeInterest", label: "Area of Study / Major", type: "text", required: true, placeholder: "e.g. Computer Science, MBA, Artificial Intelligence" },
    { id: "intake", label: "Intended Intake", type: "select", required: true, options: ["September 2026", "January 2027", "May 2027"] },
    { id: "notes", label: "Additional Questions or Scholarship Inquiries", type: "textarea", required: false, placeholder: "Tell us about your background or scholarship needs..." }
  ]
};

export const PublicFormPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [fileUploads, setFileUploads] = useState<Record<string, File>>({});
  const [hasStarted, setHasStarted] = useState(false);

  // Math CAPTCHA
  const [captchaA] = useState(() => Math.floor(Math.random() * 10) + 1);
  const [captchaB] = useState(() => Math.floor(Math.random() * 10) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) {
        setTemplate(DEFAULT_PUBLIC_FORM);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "form_templates", formId));
        if (snap.exists()) {
          const data = snap.data();
          setTemplate({ id: snap.id, ...data } as FormTemplate);
          try {
            await updateDoc(doc(db, "form_templates", formId), { viewCount: increment(1) });
          } catch (_) { /* ignore */ }
        } else {
          setTemplate({ ...DEFAULT_PUBLIC_FORM, id: formId });
        }
      } catch (err) {
        console.warn("Using default public form:", err);
        setTemplate({ ...DEFAULT_PUBLIC_FORM, id: formId });
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [formId]);

  // Track first interaction
  const handleFirstInteraction = async () => {
    if (!hasStarted && formId) {
      setHasStarted(true);
      try {
        await updateDoc(doc(db, "form_templates", formId), { startCount: increment(1) });
      } catch (_) { /* ignore */ }
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    handleFirstInteraction();
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: string, file: File | null) => {
    handleFirstInteraction();
    if (file) {
      setFileUploads((prev) => ({ ...prev, [fieldId]: file }));
    } else {
      setFileUploads((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Evaluate conditional visibility
  const visibleFields = useMemo(() => {
    if (!template) return [];
    return template.fields.filter((field) => {
      if (!field.conditionalRules || field.conditionalRules.length === 0) return true;
      return field.conditionalRules.every((rule) => {
        const depValue = fieldValues[rule.dependsOnField];
        return depValue === rule.equalsValue;
      });
    });
  }, [template, fieldValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // CAPTCHA check
    if (parseInt(captchaAnswer) !== captchaA + captchaB) {
      setError("Incorrect CAPTCHA answer. Please try again.");
      return;
    }

    // Validate required fields
    for (const field of visibleFields) {
      if (field.required && field.type !== "file") {
        if (!fieldValues[field.id] || String(fieldValues[field.id]).trim() === "") {
          setError(`"${field.label}" is required.`);
          return;
        }
      }
      if (field.required && field.type === "file" && !fileUploads[field.id]) {
        setError(`"${field.label}" is required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Upload files
      const fileUrls: string[] = [];
      for (const [fieldId, file] of Object.entries(fileUploads)) {
        const path = `public_form_submissions/${formId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        fileUrls.push(url);
        fieldValues[fieldId] = url;
      }

      // Write form submission
      const submissionRef = await addDoc(collection(db, "form_submissions"), {
        formId,
        formTitle: template?.title || "",
        fieldValues,
        fileUrls,
        submittedAt: Date.now(),
        ipFingerprint: typeof navigator !== "undefined" ? btoa(navigator.userAgent).slice(0, 32) : "unknown",
        referralSource: new URLSearchParams(window.location.search).get("ref") || "direct",
      });

      // Also create a lead from the submission
      const emailField = template?.fields.find((f) => f.type === "email");
      const nameField = template?.fields.find((f) => f.label.toLowerCase().includes("name") && f.type === "text");
      const phoneField = template?.fields.find((f) => f.label.toLowerCase().includes("phone") || f.label.toLowerCase().includes("whatsapp"));

      const leadData: Record<string, any> = {
        fullName: nameField ? fieldValues[nameField.id] || "Unknown" : "Form Submission",
        email: emailField ? fieldValues[emailField.id] || "" : "",
        phone: phoneField ? fieldValues[phoneField.id] || "" : "",
        source: "Website" as const,
        stage: "New" as const,
        notes: `Auto-captured from public form: ${template?.title}. Submission ID: ${submissionRef.id}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const leadRef = await addDoc(collection(db, "leads"), leadData);

      // Update submission with lead reference
      await updateDoc(doc(db, "form_submissions", submissionRef.id), {
        convertedToLeadId: leadRef.id,
      });

      // Increment submit count
      if (formId) {
        try {
          await updateDoc(doc(db, "form_templates", formId), { submitCount: increment(1) });
        } catch (_) { /* ignore */ }
      }

      navigate(`/public/form-success?ref=${submissionRef.id}`);
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-zinc-400 text-sm">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Form Not Found</h1>
          <p className="text-zinc-400 text-sm">
            This form may have been removed or the link is invalid. Please contact the organization for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-zinc-950 font-extrabold text-2xl mx-auto shadow-lg shadow-emerald-500/20 mb-4">
            E
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-tight">
            {template?.title}
          </h1>
          {template?.description && (
            <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">{template.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 backdrop-blur-md">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {visibleFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                {field.label} {field.required && <span className="text-rose-400">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-all"
                />
              ) : field.type === "select" ? (
                <select
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                >
                  <option value="">Select {field.label}...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === "file" ? (
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(field.id, e.target.files?.[0] || null)}
                    className="hidden"
                    id={`file-${field.id}`}
                  />
                  <label
                    htmlFor={`file-${field.id}`}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-400 cursor-pointer hover:border-emerald-500/50 transition-all"
                  >
                    <FileUp className="w-4 h-4" />
                    <span>{fileUploads[field.id]?.name || "Choose file..."}</span>
                  </label>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={fieldValues[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              )}
            </div>
          ))}

          {/* Math CAPTCHA */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security Verification *</span>
            </label>
            <p className="text-sm text-zinc-400">
              What is <span className="text-emerald-400 font-bold">{captchaA}</span> + <span className="text-emerald-400 font-bold">{captchaB}</span>?
            </p>
            <input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Your answer"
              className="w-32 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              required
            />
          </div>

          {/* Consent */}
          <div className="flex items-start space-x-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
            <input type="checkbox" required id="consent" className="mt-1 accent-emerald-500" />
            <label htmlFor="consent" className="text-[11px] text-zinc-400 leading-relaxed">
              I confirm that the information provided is accurate and I consent to my data being processed for educational placement services. I have read and agree to the Privacy Policy.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
            ) : (
              <><Send className="w-4 h-4" /><span>Submit Application</span></>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Powered by <span className="text-emerald-500 font-semibold">EduCRM</span> — Enterprise Education Management
        </p>
      </div>
    </div>
  );
};
