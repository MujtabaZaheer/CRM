import React, { useState } from "react";
import { useCounsellorData } from "../../hooks/useCounsellorData";
import { Lead, LeadStage } from "../../types/lead";
import {
  Users2,
  Search,
  Phone,
  Mail,
  ArrowRight
} from "lucide-react";

export const CounsellorLeads: React.FC = () => {
  const { leads, updateLeadStage, convertLeadToStudent, loading } = useCounsellorData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("All");

  // Stage update modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [targetStage, setTargetStage] = useState<LeadStage>("Contacted");
  const [lostReason, setLostReason] = useState("");
  const [stageNote, setStageNote] = useState("");

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      (l.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.phone || "").includes(searchQuery);
    const matchesStage = selectedStage === "All" || l.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const handleUpdateStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    await updateLeadStage(selectedLead.id, targetStage, targetStage === "Lost" ? lostReason : undefined, stageNote);
    setSelectedLead(null);
    setLostReason("");
    setStageNote("");
  };

  const handleConvert = async (lead: Lead) => {
    if (window.confirm(`Convert lead "${lead.fullName}" into an active student profile?`)) {
      await convertLeadToStudent(lead);
      alert(`Successfully created student profile for ${lead.fullName}!`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">Loading assigned leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">My Assigned Leads</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Nurture prospective student inquiries, track stage progress, and convert leads to student applications.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-[var(--bg-card)] border border-[var(--border-default)] px-3 py-1.5 sq-card text-xs">
          <span className="text-[var(--text-muted)]">Total Assigned:</span>
          <span className="font-mono font-bold text-emerald-400">{leads.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["All", "New", "Contacted", "Qualified", "Counselling", "Converted", "Lost"].map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1.5 sq-badge text-xs transition-all whitespace-nowrap ${
                selectedStage === stage
                  ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Lead Name</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Program Interest</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                    No leads found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center space-x-2">
                        <Users2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs">{lead.fullName}</div>
                          {lead.nationality && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {lead.nationality} ({lead.countryOfResidence || "Global"})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 space-y-1">
                      <div className="flex items-center space-x-1.5 text-[var(--text-primary)]">
                        <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[var(--text-muted)]">
                        <Phone className="w-3 h-3" />
                        <span>{lead.phone}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div>{lead.programInterest || "General Inquiry"}</div>
                      {lead.destinationCountry && (
                        <span className="text-[10px] text-teal-400 font-mono">Dest: {lead.destinationCountry}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 sq-badge font-semibold text-[10px] ${
                          lead.stage === "Converted"
                            ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                            : lead.stage === "Lost"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {lead.stage}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">{lead.source}</td>

                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setTargetStage(lead.stage);
                        }}
                        className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] sq-btn text-[11px]"
                      >
                        Update Stage
                      </button>

                      {lead.stage !== "Converted" && (
                        <button
                          onClick={() => handleConvert(lead)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-[11px] inline-flex items-center space-x-1"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Update Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              Update Stage for {selectedLead.fullName}
            </h3>

            <form onSubmit={handleUpdateStageSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Select New Stage *</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as LeadStage)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Counselling">Counselling</option>
                  <option value="Documents Pending">Documents Pending</option>
                  <option value="Application Initiated">Application Initiated</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                  <option value="Unresponsive">Unresponsive</option>
                </select>
              </div>

              {targetStage === "Lost" && (
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Reason for Lost Lead *</label>
                  <input
                    type="text"
                    required
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="e.g. Budget constraints, Selected local university, No response"
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Counsellor Call/Follow-up Note</label>
                <textarea
                  rows={3}
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="Record summary of discussion with student..."
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] sq-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                >
                  Save Stage Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
