import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Lead, LeadSource, LeadStage } from "../types/lead";
import { RoleGate } from "../components/layout/RoleGate";
import { Plus, X, UserPlus, Search, Filter, Mail, Phone, Globe, BookOpen, Download, RotateCcw, Eye, Copy, ShieldAlert, CheckCircle2, MessageSquarePlus, Clock, Flame } from "lucide-react";
import { detectDuplicateLeads, mergeDuplicateLeads, DuplicateCluster, LeadRecord } from "../utils/dataQuality";
import { autoAssignLead } from "../utils/leadRouter";
import { calculateLeadScore } from "../utils/leadScoring";

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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Deduplication State
  const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
  const [dedupClusters, setDedupClusters] = useState<DuplicateCluster[]>([]);
  const [mergingId, setMergingId] = useState<string | null>(null);

  // Interaction State
  const [interactionType, setInteractionType] = useState<"Call" | "Email" | "WhatsApp" | "Meeting" | "Note">("Call");
  const [interactionSummary, setInteractionSummary] = useState("");
  const [addingInteraction, setAddingInteraction] = useState(false);

  const handleAddInteraction = async (leadId: string) => {
    if (!interactionSummary.trim()) return;
    setAddingInteraction(true);
    try {
      const current = leads.find((l) => l.id === leadId);
      const existingLogs = current?.interactionLog || [];
      const newEntry = {
        id: `int_${Date.now()}`,
        timestamp: Date.now(),
        type: interactionType,
        summary: interactionSummary.trim(),
        performedBy: "Counsellor",
      };
      const updatedLogs = [newEntry, ...existingLogs];
      const recalculated = calculateLeadScore({ ...current, interactionLog: updatedLogs });

      await updateDoc(doc(db, "leads", leadId), {
        interactionLog: updatedLogs,
        leadScore: recalculated.totalScore,
        lastContactedAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => prev ? { ...prev, interactionLog: updatedLogs, leadScore: recalculated.totalScore } : null);
      }
      setInteractionSummary("");
    } catch (err) {
      console.error("Error adding interaction:", err);
    } finally {
      setAddingInteraction(false);
    }
  };

  const handleScanDuplicates = () => {
    const formattedRecords: LeadRecord[] = leads.map((l) => ({
      id: l.id,
      name: l.fullName,
      email: l.email,
      phone: l.phone,
      passportNumber: l.passportNumber,
      status: l.stage,
      countryInterest: l.destinationCountry,
      createdAt: l.createdAt,
    }));
    const clusters = detectDuplicateLeads(formattedRecords);
    setDedupClusters(clusters);
    setIsDedupModalOpen(true);
  };

  const handleMergeCluster = async (masterId: string, duplicateId: string) => {
    try {
      setMergingId(duplicateId);
      await mergeDuplicateLeads(masterId, duplicateId, { status: "Merged" });
      setDedupClusters((prev) =>
        prev
          .map((c) => ({
            ...c,
            duplicateLeads: c.duplicateLeads.filter((d) => d.id !== duplicateId),
          }))
          .filter((c) => c.duplicateLeads.length > 0)
      );
    } catch (e) {
      console.error("Merge error:", e);
    } finally {
      setMergingId(null);
    }
  };

  useEffect(() => {
    const leadsRef = collection(db, "leads");
    const q = query(leadsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const leadList: Lead[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Lead[];
        setLeads(leadList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching real-time leads:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
      // 1. Calculate Initial Lead Score
      const tempLead = {
        fullName,
        email,
        phone,
        nationality,
        countryOfResidence,
        programInterest,
        destinationCountry,
        source,
        stage,
        createdAt: Date.now(),
      };
      const scoreResult = calculateLeadScore(tempLead);

      // 2. Auto-Assign Counsellor
      let assignedCounsellorName: string | undefined = undefined;
      let assignedToUid: string | undefined = undefined;
      try {
        const assigned = await autoAssignLead(tempLead);
        if (assigned) {
          assignedToUid = assigned.counsellorId;
          assignedCounsellorName = assigned.counsellorName;
        }
      } catch (e) {
        console.warn("Auto-assignment failed:", e);
      }

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
        leadScore: scoreResult.totalScore,
        assignedTo: assignedToUid || undefined,
        assignedCounsellor: assignedCounsellorName || undefined,
        assignedAt: assignedToUid ? Date.now() : undefined,
        interactionLog: [
          {
            id: `init_${Date.now()}`,
            timestamp: Date.now(),
            type: "Stage Change",
            summary: "Lead entered system in 'New' stage.",
            performedBy: "System",
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
            onClick={handleScanDuplicates}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold sq-btn transition-all"
            title="Scan for Duplicate Leads"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deduplicate</span>
          </button>
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
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Preferences</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                    Loading lead records from Firestore...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const score = lead.leadScore ?? 50;
                  const scoreBadge =
                    score >= 70
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : score >= 40
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30";

                  return (
                    <tr key={lead.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono border ${scoreBadge}`}>
                          {score >= 70 && <Flame className="w-3 h-3 mr-1 text-emerald-400" />}
                          {score}
                        </span>
                      </td>
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
                      <td className="py-3.5 px-4 text-xs">
                        {lead.assignedCounsellor ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
                            {lead.assignedCounsellor}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] italic">Unassigned</span>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] w-full max-w-2xl sq-modal shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] flex items-center space-x-2">
                    <span>{selectedLead.fullName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Score: {selectedLead.leadScore ?? 50}/100
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Lead #{selectedLead.id.slice(0, 8)} • Stage: <span className="font-semibold text-emerald-400">{selectedLead.stage}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 sq-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-0.5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Email</span>
                <span className="text-[var(--text-primary)] font-medium truncate block">{selectedLead.email}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-0.5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Phone</span>
                <span className="text-[var(--text-primary)] font-medium truncate block">{selectedLead.phone}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-0.5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Destination</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedLead.destinationCountry || "Unset"}</span>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] sq-card border border-[var(--border-default)] space-y-0.5">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Counsellor</span>
                <span className="text-emerald-400 font-medium">{selectedLead.assignedCounsellor || "Unassigned"}</span>
              </div>
            </div>

            {/* Interaction Log Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Interaction Timeline ({selectedLead.interactionLog?.length || 0})</span>
                </h4>
              </div>

              {/* Add Interaction Form */}
              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Call">📞 Phone Call</option>
                    <option value="Email">✉️ Email Sent</option>
                    <option value="WhatsApp">💬 WhatsApp</option>
                    <option value="Meeting">🤝 Meeting / Video</option>
                    <option value="Note">📝 Internal Note</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Log interaction notes or discussion summary..."
                    value={interactionSummary}
                    onChange={(e) => setInteractionSummary(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddInteraction(selectedLead.id)}
                    disabled={addingInteraction || !interactionSummary.trim()}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 transition-all disabled:opacity-50"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </div>
              </div>

              {/* Timeline Items */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedLead.interactionLog && selectedLead.interactionLog.length > 0 ? (
                  selectedLead.interactionLog.map((log) => (
                    <div key={log.id} className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-default)] rounded-lg flex items-start justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded text-[10px]">
                            {log.type}
                          </span>
                          <span className="text-[var(--text-secondary)] text-[10px]">by {log.performedBy}</span>
                        </div>
                        <p className="text-[var(--text-primary)] mt-1">{log.summary}</p>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono whitespace-nowrap ml-2">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic py-2 text-center">No interactions logged yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold sq-btn"
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
      {/* Deduplication Engine Modal */}
      {isDedupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex items-center justify-between bg-amber-500/10">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                  Data Quality & Deduplication Engine
                </h3>
              </div>
              <button
                onClick={() => setIsDedupModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {dedupClusters.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">No Duplicate Leads Detected</h4>
                  <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    All lead records have unique emails, phone numbers, and passport identifiers. Your dataset is clean!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Found <strong className="text-amber-400">{dedupClusters.length}</strong> duplicate clusters matching by email, phone, or passport. You can merge duplicates into the master record.
                  </p>
                  {dedupClusters.map((cluster, idx) => (
                    <div key={idx} className="bg-[var(--bg-input)] border border-[var(--border-default)] p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">Master Record: {cluster.masterLead.name}</span>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-mono">
                          {cluster.matchReason}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] space-y-1">
                        <div>Email: {cluster.masterLead.email} | Phone: {cluster.masterLead.phone || "N/A"}</div>
                      </div>

                      <div className="border-t border-[var(--border-default)] pt-2 space-y-2">
                        <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          Duplicate Records ({cluster.duplicateLeads.length})
                        </div>
                        {cluster.duplicateLeads.map((dup) => (
                          <div key={dup.id} className="flex items-center justify-between bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-default)] text-xs">
                            <div>
                              <div className="font-medium text-[var(--text-primary)]">{dup.name}</div>
                              <div className="text-[11px] text-[var(--text-secondary)]">{dup.email} • {dup.phone || "No phone"}</div>
                            </div>
                            <button
                              onClick={() => handleMergeCluster(cluster.masterLead.id, dup.id)}
                              disabled={mergingId === dup.id}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {mergingId === dup.id ? "Merging..." : "Merge into Master"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] flex justify-end">
              <button
                onClick={() => setIsDedupModalOpen(false)}
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
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
