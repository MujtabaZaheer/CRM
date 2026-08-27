import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, addDoc, query, orderBy } from "firebase/firestore";
import { University } from "../types/university";
import { RoleGate } from "../components/layout/RoleGate";
import { useAuth } from "../contexts/AuthContext";
import { logAuditEvent } from "../utils/auditLogger";
import { Building2, Plus, Search, Globe, MapPin, X, AlertCircle } from "lucide-react";

export const Universities: React.FC = () => {
  const { appUser } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUnivModalOpen, setIsAddUnivModalOpen] = useState(false);

  // University Form
  const [univName, setUnivName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const q = query(collection(db, "universities"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: University[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as University);
      });
      setUniversities(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!univName || !country || !city) {
      setErrorMsg("University Name, Country, and City are required.");
      return;
    }

    try {
      const newUniv: Omit<University, "id"> = {
        name: univName,
        country,
        city,
        website,
        programmes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "universities"), newUniv);
      await logAuditEvent(
        "UNIVERSITY_CREATED",
        appUser?.email || "Unknown",
        "University",
        `Added university ${univName} (${country})`,
        docRef.id,
        appUser?.role
      );

      // Reset
      setUnivName("");
      setCountry("");
      setCity("");
      setWebsite("");
      setErrorMsg("");
      setIsAddUnivModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create university.");
    }
  };

  const filteredUnivs = universities.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.country || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGate allowedRoles={["platform_super_admin", "org_admin", "counsellor", "office_manager", "admissions_officer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">University & Course Master Data</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Global institution partner profiles, courses, tuition fees, and entry criteria.
            </p>
          </div>
          <button
            onClick={() => setIsAddUnivModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add University</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search universities by name, country, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            Loading university database...
          </div>
        ) : filteredUnivs.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-6">
            No partner universities recorded. Click "Add University" to build your course directory.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnivs.map((univ) => (
              <div key={univ.id} className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card p-5 space-y-4 hover:border-emerald-500/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sq-avatar bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold font-heading text-[var(--text-primary)] text-sm">{univ.name}</h3>
                      <div className="flex items-center space-x-1 text-[11px] text-[var(--text-muted)] mt-0.5">
                        <MapPin className="w-3 h-3 text-teal-400" />
                        <span>{univ.city}, {univ.country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-default)] sq-card text-xs space-y-2">
                  <div className="flex justify-between items-center text-[var(--text-secondary)]">
                    <span>Programmes Offered</span>
                    <span className="font-mono font-bold text-emerald-400">{univ.programmes?.length || 0} Courses</span>
                  </div>
                  {univ.website && (
                    <a
                      href={univ.website.startsWith("http") ? univ.website : `https://${univ.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-teal-400 hover:underline flex items-center space-x-1 truncate"
                    >
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{univ.website}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add University */}
        {isAddUnivModalOpen && (
          <div className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span>Add Partner University</span>
                </h3>
                <button onClick={() => setIsAddUnivModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 sq-badge text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateUniversity} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">University Name *</label>
                  <input
                    type="text"
                    required
                    value={univName}
                    onChange={(e) => setUnivName(e.target.value)}
                    placeholder="e.g. University of Oxford"
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United Kingdom"
                      className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Oxford"
                      className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1">Official Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="www.ox.ac.uk"
                    className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setIsAddUnivModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium sq-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold sq-btn shadow-lg shadow-emerald-500/20"
                  >
                    Save Institution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
};
