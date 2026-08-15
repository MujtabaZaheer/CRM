import React, { useEffect, useState } from "react";
import { Search, X, Users, GraduationCap, FileText, FileCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGlobalData } from "../../contexts/GlobalDataContext";

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { leads, students, applications, documents } = useGlobalData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const q = query.trim().toLowerCase();

  const matchedLeads = q
    ? leads.filter(
        (l) =>
          l.fullName?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.stage?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedStudents = q
    ? students.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.countryOfResidence?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedApps = q
    ? applications.filter(
        (a) =>
          a.applicationNumber?.toLowerCase().includes(q) ||
          a.studentName?.toLowerCase().includes(q) ||
          a.universityName?.toLowerCase().includes(q) ||
          a.programmeName?.toLowerCase().includes(q) ||
          a.stage?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedDocs = q
    ? documents.filter(
        (d) =>
          d.fileName?.toLowerCase().includes(q) ||
          d.studentName?.toLowerCase().includes(q) ||
          (d.docType || (d as any).documentType)?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const totalMatches =
    matchedLeads.length + matchedStudents.length + matchedApps.length + matchedDocs.length;

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <>
      {/* Trigger Button in Topbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] sq-btn text-xs text-[var(--text-secondary)] transition-all"
        title="Global Search (Ctrl+K / Cmd+K)"
      >
        <Search className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden md:inline font-medium">Search records...</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-[var(--text-muted)] font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-default)] sq-modal shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-[var(--border-default)] flex items-center space-x-3 bg-[var(--bg-elevated)]">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leads, students, applications, or documents (e.g. 'John', 'UK', 'Visa')..."
                className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!q ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                  <p>Type keywords to search instantly across all EduCRM records.</p>
                  <p className="text-[10px]">Shortcuts: Esc to close, ⌘K to toggle</p>
                </div>
              ) : totalMatches === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No records found matching "{query}".
                </div>
              ) : (
                <>
                  {/* Leads Results */}
                  {matchedLeads.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center space-x-1.5 px-2">
                        <Users className="w-3 h-3" />
                        <span>Leads ({matchedLeads.length})</span>
                      </div>
                      {matchedLeads.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect("/leads")}
                          className="p-2.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)]">{item.fullName}</div>
                            <div className="text-[10px] text-[var(--text-secondary)]">{item.email} • {item.stage}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Students Results */}
                  {matchedStudents.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider flex items-center space-x-1.5 px-2">
                        <GraduationCap className="w-3 h-3" />
                        <span>Students ({matchedStudents.length})</span>
                      </div>
                      {matchedStudents.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect("/students")}
                          className="p-2.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)]">{item.fullName}</div>
                            <div className="text-[10px] text-[var(--text-secondary)]">{item.email} • {item.countryOfResidence}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Applications Results */}
                  {matchedApps.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center space-x-1.5 px-2">
                        <FileText className="w-3 h-3" />
                        <span>Applications ({matchedApps.length})</span>
                      </div>
                      {matchedApps.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect("/applications")}
                          className="p-2.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)]">
                              {item.applicationNumber} — {item.studentName}
                            </div>
                            <div className="text-[10px] text-[var(--text-secondary)]">
                              {item.universityName} • {item.programmeName} ({item.stage})
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documents Results */}
                  {matchedDocs.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center space-x-1.5 px-2">
                        <FileCheck className="w-3 h-3" />
                        <span>Documents ({matchedDocs.length})</span>
                      </div>
                      {matchedDocs.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect("/documents")}
                          className="p-2.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)]">{item.fileName}</div>
                            <div className="text-[10px] text-[var(--text-secondary)]">
                              {(item.docType || (item as any).documentType)} • {item.studentName} ({item.status})
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] text-[10px] text-[var(--text-muted)] flex justify-between items-center">
              <span>EduCRM Instant Global Search</span>
              <span>Press <kbd className="px-1 py-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
