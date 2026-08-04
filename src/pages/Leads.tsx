import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { Lead, LeadSource, LeadStage } from "../types/lead";
import { RoleGate } from "../components/layout/RoleGate";
import { Plus, X, UserPlus, Search, Filter, Mail, Phone, Globe, BookOpen } from "lucide-react";

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

  // Form State
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

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All");

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

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding lead:", err);
      alert("Failed to create lead. Please check console.");
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Leads & Enquiries</h1>
          <p className="text-sm text-zinc-400">Manage student inquiries, lead stages, and source tracking</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>

        {/* Stage Dropdown Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:inline">
            Stage:
          </span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 w-full sm:w-auto"
          >
            <option value="All">All Stages ({leads.length})</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Preferences</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    Loading lead records from Firestore...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {lead.fullName}
                      {lead.nationality && (
                        <span className="block text-[11px] text-zinc-500 font-normal">
                          {lead.nationality}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div className="text-zinc-300 font-medium flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="text-zinc-400 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{lead.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {lead.programInterest ? (
                        <div className="text-zinc-300 font-medium flex items-center space-x-1">
                          <BookOpen className="w-3 h-3 text-emerald-400" />
                          <span>{lead.programInterest}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                      {lead.destinationCountry && (
                        <div className="text-zinc-500 text-[11px] flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-zinc-500" />
                          <span>{lead.destinationCountry}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          lead.stage === "New"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                            : lead.stage === "Counselling"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : lead.stage === "Converted"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : lead.stage === "Lost"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        {lead.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-400">{lead.source}</td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h2 className="font-heading text-lg font-bold text-white">Create New Lead Entry</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. Canadian"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Country of Residence */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Country of Residence
                  </label>
                  <input
                    type="text"
                    value={countryOfResidence}
                    onChange={(e) => setCountryOfResidence(e.target.value)}
                    placeholder="e.g. UAE"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Program Interest */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Program Interest
                  </label>
                  <input
                    type="text"
                    value={programInterest}
                    onChange={(e) => setProgramInterest(e.target.value)}
                    placeholder="e.g. MSc Computer Science"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Destination Country */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Destination Country
                  </label>
                  <input
                    type="text"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Lead Source *
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Lead Stage *
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as LeadStage)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  >
                    {LEAD_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Initial Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter student background details, intake goals..."
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
    <RoleGate>
      <LeadsContent />
    </RoleGate>
  );
};
