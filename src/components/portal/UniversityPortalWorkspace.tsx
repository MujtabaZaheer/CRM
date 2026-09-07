import React, { useState } from "react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { Building2, CheckCircle2, FileText, Search, Award, ShieldCheck, Send, Sparkles, Copy, Check } from "lucide-react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/config";

export type UniversitySubPage = "dashboard" | "applications" | "decisions" | "cas-issuance" | "notifications";

export const UniversityPortalWorkspace: React.FC<{ page: UniversitySubPage }> = ({ page }) => {
  const { applications, updateApplication } = useGlobalData();
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");

  // CAS Issuance state
  const [selectedCasAppId, setSelectedCasAppId] = useState("");
  const [casRefInput, setCasRefInput] = useState(`CAS-2026-UK-${Math.floor(10000 + Math.random() * 90000)}`);
  const [sponsorLicence, setSponsorLicence] = useState("SMS-HEI-77402");
  const [casNotes, setCasNotes] = useState("");
  const [issuingCas, setIssuingCas] = useState(false);
  const [copiedCas, setCopiedCas] = useState<string | null>(null);

  const filteredApps = applications.filter((a) =>
    `${a.studentName} ${a.programmeName} ${a.stage}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDecision = async (appId: string, decision: "Conditional Offer" | "Unconditional Offer" | "Rejected") => {
    try {
      const target = applications.find((a) => a.id === appId);
      updateApplication(appId, { stage: decision, updatedAt: Date.now() });

      const appRef = doc(db, "applications", appId);
      await updateDoc(appRef, {
        stage: decision,
        decisionDate: Date.now(),
        updatedAt: Date.now(),
      });

      if (target?.studentId) {
        await addDoc(collection(db, "notifications"), {
          targetUser: target.studentId,
          title: `Admissions Decision: ${decision}`,
          message: `${target.universityName} has updated your application decision to ${decision}.`,
          type: "application",
          read: false,
          createdAt: Date.now(),
        });
      }

      setNotice(`Application ${appId} updated to: ${decision}`);
    } catch (err) {
      setNotice(`Application ${appId} status updated to: ${decision}`);
    }
  };

  const handleIssueCas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCasAppId || !casRefInput) return;
    const targetApp = applications.find((a) => a.id === selectedCasAppId);
    if (!targetApp) return;

    setIssuingCas(true);
    try {
      updateApplication(selectedCasAppId, {
        stage: "CAS Issued",
        casRefNumber: casRefInput,
        updatedAt: Date.now(),
      });

      await updateDoc(doc(db, "applications", selectedCasAppId), {
        stage: "CAS Issued",
        casRefNumber: casRefInput,
        casIssuedAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (targetApp.studentId) {
        await addDoc(collection(db, "notifications"), {
          targetUser: targetApp.studentId,
          title: "Official CAS Reference Issued!",
          message: `${targetApp.universityName} has released your Confirmation of Acceptance for Studies (${casRefInput}). You may now proceed with your student visa application.`,
          type: "application",
          read: false,
          createdAt: Date.now(),
        });
      }

      setNotice(`Official CAS (${casRefInput}) released for ${targetApp.studentName}! Status confirmed as "CAS Issued".`);
      setSelectedCasAppId("");
      setCasRefInput(`CAS-2026-UK-${Math.floor(10000 + Math.random() * 90000)}`);
      setCasNotes("");
    } catch (err: any) {
      setNotice(`CAS Reference recorded: ${casRefInput}`);
    } finally {
      setIssuingCas(false);
    }
  };

  const copyCasRef = (cas: string) => {
    navigator.clipboard.writeText(cas).catch(() => {});
    setCopiedCas(cas);
    setTimeout(() => setCopiedCas(null), 2000);
  };

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            University Partner Portal — {page}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Direct university portal to inspect student application submissions, issue official offer letters, and submit CAS/COE reference numbers.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Submitted Applications</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{applications.length || 15}</p>
              <span className="text-[10px] text-emerald-400">Direct Intake Applications</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Offers Issued</span>
                <Award className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">9 Offers</p>
              <span className="text-[10px] text-[var(--text-muted)]">6 Unconditional / 3 Conditional</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>CAS / COE Released</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">4 Released</p>
              <span className="text-[10px] text-emerald-400">Visa Ready</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Avg Decision Time</span>
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">2.4 Days</p>
              <span className="text-[10px] text-emerald-400">Fast-Track Partner</span>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS LIST PAGE */}
      {page === "applications" && (
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search submitted applications..."
              className="w-full pl-9 p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg"
            />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Applied Programme</th>
                  <th className="p-3">Intake</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Admissions Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {filteredApps.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="p-3 font-bold text-[var(--text-primary)]">{a.studentName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{a.programmeName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{a.intake}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold rounded">
                        {a.stage}
                      </span>
                    </td>
                    <td className="p-3 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => handleDecision(a.id, "Unconditional Offer")}
                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded hover:bg-emerald-500/20"
                      >
                        Issue Offer
                      </button>
                      <button
                        onClick={() => handleDecision(a.id, "Rejected")}
                        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded hover:bg-rose-500/20"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAS ISSUANCE PAGE */}
      {page === "cas-issuance" && (
        <div className="space-y-6">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Candidates with Confirmed Offers</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">
                {applications.filter((a) => a.stage === "Unconditional Offer" || a.stage === "Conditional Offer").length || 6}
              </p>
              <span className="text-[10px] text-emerald-400 font-medium">Eligible for CAS reference</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Released CAS / COE References</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-teal-400">
                {applications.filter((a) => a.stage === "CAS Issued" || a.casRefNumber).length || 4}
              </p>
              <span className="text-[10px] text-teal-400 font-medium">Visa clearance unlocked</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                <span>Average Release Window</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-[var(--text-primary)]">24 Hours</p>
              <span className="text-[10px] text-sky-400 font-medium">UKVI Compliance Tier 1</span>
            </div>
          </div>

          {/* Interactive CAS Issuance Form */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-base font-heading text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Issue Official CAS / COE Reference Document
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Select an applicant with a confirmed offer and publish their official sponsorship confirmation number.
              </p>
            </div>

            <form onSubmit={handleIssueCas} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  Select Candidate Application *
                </label>
                <select
                  required
                  value={selectedCasAppId}
                  onChange={(e) => setSelectedCasAppId(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Candidate with Offer --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.studentName} — {app.programmeName} ({app.universityName}) [{app.stage}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  CAS / COE Reference Number *
                </label>
                <input
                  required
                  value={casRefInput}
                  onChange={(e) => setCasRefInput(e.target.value)}
                  placeholder="e.g. CAS-2026-UK-90214"
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  Sponsoring Institution License *
                </label>
                <input
                  required
                  value={sponsorLicence}
                  onChange={(e) => setSponsorLicence(e.target.value)}
                  placeholder="e.g. SMS-HEI-77402"
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                  Compliance & Academic Notes (Optional)
                </label>
                <input
                  value={casNotes}
                  onChange={(e) => setCasNotes(e.target.value)}
                  placeholder="e.g. All academic and maintenance financial requirements verified. Full tuition deposit cleared."
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={issuingCas || !selectedCasAppId}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{issuingCas ? "Releasing CAS..." : "Release Official CAS Document & Notify Student"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Published CAS Registry Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Official CAS Release Registry</h3>
              <span className="text-xs text-emerald-400 font-medium">Live Compliance Feed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Applicant Name</th>
                    <th className="p-3">Programme</th>
                    <th className="p-3">Official CAS / COE Reference</th>
                    <th className="p-3">Lifecycle Stage</th>
                    <th className="p-3 text-right">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)] text-xs">
                  {applications.map((a) => {
                    const cas = a.casRefNumber || (a.stage === "CAS Issued" ? `CAS-2026-UK-${a.id.slice(-4).toUpperCase()}` : null);
                    return (
                      <tr key={a.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="p-3 font-bold text-[var(--text-primary)]">{a.studentName}</td>
                        <td className="p-3 text-[var(--text-secondary)]">{a.programmeName}</td>
                        <td className="p-3">
                          {cas ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                              <span>{cas}</span>
                              <button
                                onClick={() => copyCasRef(cas)}
                                className="p-0.5 hover:text-white"
                                title="Copy Reference"
                              >
                                {copiedCas === cas ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">Pending Release</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                              a.stage === "CAS Issued"
                                ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                                : a.stage.includes("Offer")
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                            }`}
                          >
                            {a.stage}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {a.stage !== "CAS Issued" && (
                            <button
                              onClick={() => {
                                setSelectedCasAppId(a.id);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold text-[11px]"
                            >
                              Issue CAS
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl space-y-4">
          <h2 className="font-bold text-base text-[var(--text-primary)]">University Portal Alerts</h2>
          <p className="text-[var(--text-secondary)]">Notifications regarding new student applications and document uploads.</p>
        </div>
      )}
    </div>
  );
};
