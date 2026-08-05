import React, { useState } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useGlobalData } from "../contexts/GlobalDataContext";
import { Lead, LeadSource, LeadStage } from "../types/lead";
import { RoleGate } from "../components/layout/RoleGate";
import { Plus, X, UserPlus, Search, Filter, Mail, Phone, Globe, BookOpen, Download, RotateCcw, Eye } from "lucide-react";

const LEAD_STAGES: LeadStage[] = [
  "New",
  "Contacted",
  "Qualified",
  "Counselling",
  "Documents Pending",
  "Application Initiated",
  "Converted",
  "Lost",
  "Unresponsive",
];

const LEAD_SOURCES: LeadSource[] = [
  "Website",
  "Referral",
  "Walk-in",
  "Social Media",
  "Agent",
  "Other",
];

export const LeadsContent: React.FC = () => {
  const { leads, initialLoading: loading } = useGlobalData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form State & Validation
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [programInterest, setProgramInterest] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [source, setSource] = useState<LeadSource>("Website");
  const [stage, setStage] = useState<LeadStage>("New");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All");

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]{7,}$/;

    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim() || !emailRegex.test(email)) errors.email = "Valid email address required";
    if (!phone.trim() || !phoneRegex.test(phone)) errors.phone = "Valid phone number required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      await addDoc(collection(db, "leads"), {
        fullName,
        email,
        phone,
        nationality: nationality || undefined,
        countryOfResidence: countryOfResidence || undefined,
        programInterest: programInterest || undefined,
        destinationCountry: destinationCountry || undefined,
        source,
        stage,
        notes: notes || undefined,
        createdAt: Date.now(),
      });

      // Reset Form
      setFullName("");
      setEmail("");
      setPhone("");
      setNationality("");
      setCountryOfResidence("");
      setProgramInterest("");
      setDestinationCountry("");
      setSource("Website");
      setStage("New");
      setNotes("");
      setFormErrors({});
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding lead:", err);
      alert("Failed to create lead. Please check console.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageQuickChange = async (leadId: string, newStage: LeadStage) => {
    try {
      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, { stage: newStage });
    } catch (err) {
      console.error("Error updating lead stage:", err);
      alert("Failed to update lead stage.");
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = ["ID", "Full Name", "Email", "Phone", "Nationality", "Residence", "Program Interest", "Destination", "Source", "Stage", "Created At"];
    const rows = leads.map(l => [
      l.id,
      `"${l.fullName}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${l.nationality || ""}"`,
      `"${l.countryOfResidence || ""}"`,
      `"${l.programInterest || ""}"`,
      `"${l.destinationCountry || ""}"`,
      `"${l.source}"`,
      `"${l.stage}"`,
      new Date(l.createdAt).toISOString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduCRM_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);

    const matchesStage = stageFilter === "All" || lead.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight">Leads & Enquiries</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage student inquiries, lead stages, and quick actions</p>
        </div>
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            disabled={leads.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-default)] text-xs font-semibold sq-btn transition-all disabled:opacity-50"
            title="Export Leads to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sq-btn shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 sq-card flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>

        {/* Stage Dropdown Filter & Clear */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {(searchQuery || stageFilter !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStageFilter("All");
              }}
              className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 sq-btn bg-rose-500/10 border border-rose-500/20"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="All" className="bg-[var(--bg-card)] text-[var(--text-primary)]">All Stages ({leads.length})</option>
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Preferences</th>
                <th className="py-3.5 px-4">Stage (Quick Switch)</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    Loading lead records from Firestore...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                      {lead.fullName}
                      {lead.nationality && (
                        <span className="block text-[11px] text-[var(--text-muted)] font-normal">
                          {lead.nationality}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div className="text-[var(--text-primary)] font-medium flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="text-[var(--text-secondary)] flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{lead.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {lead.programInterest ? (
                        <div className="text-[var(--text-primary)] font-medium flex items-center space-x-1">
                          <BookOpen className="w-3 h-3 text-emerald-400" />
                          <span>{lead.programInterest}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                      {lead.destinationCountry && (
                        <div className="text-[var(--text-secondary)] text-[11px] flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{lead.destinationCountry}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Inline Quick Stage Changer */}
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageQuickChange(lead.id, e.target.value as LeadStage)}
                        className="px-2.5 py-1 sq-pill text-[11px] font-semibold border bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {LEAD_STAGES.map((s) => (
                          <option key={s} value={s} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)]">{lead.source}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 sq-btn transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-lg sq-modal shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">{selectedLead.fullName}</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Lead Record #{selectedLead.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 sq-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block">EMAIL ADDRESS</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedLead.email}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block">PHONE NUMBER</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedLead.phone}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block">NATIONALITY</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedLead.nationality || "Not specified"}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1">
                <span className="text-[var(--text-muted)] block">RESIDENCE</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedLead.countryOfResidence || "Not specified"}</span>
              </div>
            </div>

            {selectedLead.notes && (
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-1 text-xs">
                <span className="text-[var(--text-muted)] block">NOTES</span>
                <p className="text-[var(--text-secondary)] italic">{selectedLead.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-emerald-500 text-zinc-950 text-xs font-bold sq-btn"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-xl sq-modal shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Create New Lead Entry</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 sq-btn hover:bg-[var(--bg-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full px-3.5 py-2.5 bg-[var(--bg-input)] border sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none ${
                      formErrors.fullName ? "border-rose-500" : "border-[var(--border-default)] focus:border-emerald-500"
                    }`}
                  />
                  {formErrors.fullName && <p className="text-[11px] text-rose-400 mt-1">{formErrors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className={`w-full px-3.5 py-2.5 bg-[var(--bg-input)] border sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none ${
                      formErrors.email ? "border-rose-500" : "border-[var(--border-default)] focus:border-emerald-500"
                    }`}
                  />
                  {formErrors.email && <p className="text-[11px] text-rose-400 mt-1">{formErrors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className={`w-full px-3.5 py-2.5 bg-[var(--bg-input)] border sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none ${
                      formErrors.phone ? "border-rose-500" : "border-[var(--border-default)] focus:border-emerald-500"
                    }`}
                  />
                  {formErrors.phone && <p className="text-[11px] text-rose-400 mt-1">{formErrors.phone}</p>}
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. Canadian"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Country of Residence */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Country of Residence
                  </label>
                  <input
                    type="text"
                    value={countryOfResidence}
                    onChange={(e) => setCountryOfResidence(e.target.value)}
                    placeholder="e.g. UAE"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Program Interest */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Program Interest
                  </label>
                  <input
                    type="text"
                    value={programInterest}
                    onChange={(e) => setProgramInterest(e.target.value)}
                    placeholder="e.g. MSc Computer Science"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Destination Country */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Destination Country
                  </label>
                  <input
                    type="text"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Lead Source *
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Lead Stage *
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as LeadStage)}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  >
                    {LEAD_STAGES.map((st) => (
                      <option key={st} value={st} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Initial Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter student background details, intake goals..."
                    className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs font-semibold sq-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold sq-btn shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? "Saving Entry..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const Leads: React.FC = () => {
  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <LeadsContent />
    </RoleGate>
  );
};
