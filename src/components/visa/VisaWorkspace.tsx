import React, { useState } from "react";
import { Search, Plane, ShieldCheck, CheckCircle, FileText } from "lucide-react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { Application, ApplicationStage } from "../../types/application";
import { db } from "../../firebase/config";
import { updateDoc, doc } from "firebase/firestore";
import { ApplicationDetailModal } from "../common/ApplicationDetailModal";
import { canUserSetStage, getStageSelectOptionLabel } from "../../utils/stageAuthorization";

type VisaPage = "dashboard" | "cases";

export const VisaWorkspace: React.FC<{ page: VisaPage }> = ({ page }) => {
  const { applications, documents, updateApplication, initialLoading } = useGlobalData();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const visaApps = applications.filter((app) => 
    ["Deposit Paid", "CAS / COE Pending", "CAS Issued", "Visa Preparation", "Visa Submitted", "Visa Approved", "Enrolled"].includes(app.stage)
  );

  const filteredApps = visaApps.filter(app => 
    `${app.studentName} ${app.applicationNumber} ${app.universityName}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleStageChange = async (app: Application, newStage: ApplicationStage, note?: string) => {
    try {
      const historyItem = {
        stage: newStage,
        updatedBy: "Visa Officer",
        timestamp: Date.now(),
        note: note || `Stage updated to ${newStage}`,
      };
      const updatedHistory = [...(app.history || []), historyItem];
      updateApplication(app.id, { stage: newStage, updatedAt: Date.now(), history: updatedHistory });
      await updateDoc(doc(db, "applications", app.id), {
        stage: newStage,
        updatedAt: Date.now(),
        history: updatedHistory,
      });
      setNotice(`Application ${app.applicationNumber} moved to ${newStage}`);
    } catch {
      setNotice("Failed to update application stage.");
    }
  };

  if (initialLoading) return <div className="p-8 text-center text-emerald-500 animate-pulse font-bold">Loading Visa Workspace...</div>;

  return (
    <div className="space-y-6 text-xs">
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
          style={{ backgroundImage: `url('/images/role_visa.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/90 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize">Visa Officer {page}</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage CAS issuance and Visa processing for enrolled students.</p>
        </div>
      </div>

      {notice && <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 sq-card">{notice}</div>}

      {page === "dashboard" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">
              <div className="flex justify-between text-[var(--text-muted)] uppercase font-bold">
                <span>Pending CAS</span><FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-3">
                {visaApps.filter(a => a.stage === "Deposit Paid" || a.stage === "CAS / COE Pending").length}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">
              <div className="flex justify-between text-[var(--text-muted)] uppercase font-bold">
                <span>CAS Issued</span><ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-3">
                {visaApps.filter(a => a.stage === "CAS Issued" || a.stage === "Visa Preparation").length}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">
              <div className="flex justify-between text-[var(--text-muted)] uppercase font-bold">
                <span>Visa Submitted</span><Plane className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-3">
                {visaApps.filter(a => a.stage === "Visa Submitted").length}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-default)] sq-card">
              <div className="flex justify-between text-[var(--text-muted)] uppercase font-bold">
                <span>Visa Approved</span><CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-3">
                {visaApps.filter(a => a.stage === "Visa Approved").length}
              </p>
            </div>
          </div>
          
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden mt-6">
            <div className="p-4 font-bold text-sm text-[var(--text-primary)]">Recent Visa Activity</div>
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase">
                <tr>
                  <th className="p-3">App #</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">University</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {visaApps.slice(0, 5).map((app) => (
                  <tr key={app.id}>
                    <td className="p-3 font-mono font-bold text-emerald-400">{app.applicationNumber}</td>
                    <td className="p-3 text-[var(--text-secondary)] font-bold">{app.studentName}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{app.universityName}</td>
                    <td className="p-3 text-[var(--text-secondary)]"><span className="px-2 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{app.stage}</span></td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs rounded cursor-pointer transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {page === "cases" && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search applications..." className="w-full pl-9 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] sq-input" />
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] sq-card overflow-hidden">
            <div className="p-4 font-bold text-sm text-[var(--text-primary)]">Visa Processing Pipeline</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase">
                  <tr>
                    <th className="p-3">App #</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">University</th>
                    <th className="p-3">Intake</th>
                    <th className="p-3">Current Stage</th>
                    <th className="p-3">Update Stage</th>
                    <th className="p-3 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-[var(--bg-hover)]">
                      <td className="p-3 font-mono font-bold text-emerald-400">{app.applicationNumber}</td>
                      <td className="p-3 text-[var(--text-secondary)] font-bold">{app.studentName}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{app.universityName}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{app.intake}</td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        <span className="px-2 py-0.5 sq-badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{app.stage}</span>
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <select 
                            aria-label="Application Stage" 
                            value={app.stage} 
                            onChange={(e) => handleStageChange(app, e.target.value as ApplicationStage)} 
                            className="bg-[var(--bg-input)] border border-[var(--border-default)] sq-input p-1 text-xs"
                          >
                            {["Deposit Paid", "CAS / COE Pending", "CAS Issued", "Visa Preparation", "Visa Submitted", "Visa Approved"].map((stg) => {
                              const isAllowed = canUserSetStage("visa_officer", stg as ApplicationStage);
                              return (
                                <option key={stg} value={stg} disabled={!isAllowed}>
                                  {getStageSelectOptionLabel(stg as ApplicationStage, "visa_officer")}
                                </option>
                              );
                            })}
                          </select>

                          {/* Contextual Quick Action Button */}
                          {app.stage === "Deposit Paid" || app.stage === "CAS / COE Pending" ? (
                            <button
                              type="button"
                              onClick={() => handleStageChange(app, "CAS Issued", "Visa Officer: CAS / COE issued.")}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded text-[11px] shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="Advance to CAS Issued"
                            >
                              Issue CAS
                            </button>
                          ) : app.stage === "CAS Issued" || app.stage === "Visa Preparation" ? (
                            <button
                              type="button"
                              onClick={() => handleStageChange(app, "Visa Submitted", "Visa Officer: Visa application lodged.")}
                              className="px-2 py-1 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded text-[11px] shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="Advance to Visa Submitted"
                            >
                              Lodge Visa
                            </button>
                          ) : app.stage === "Visa Submitted" ? (
                            <button
                              type="button"
                              onClick={() => handleStageChange(app, "Visa Approved", "Visa Officer: Visa granted.")}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded text-[11px] shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="Advance to Visa Approved"
                            >
                              Grant Clearance
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-md cursor-pointer transition-colors"
                        >
                          Review & Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DETAIL & DOCUMENT VIEWER MODAL */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          documents={documents}
          onClose={() => setSelectedApp(null)}
          onStageChange={async (app, newStage, note) => {
            await handleStageChange(app, newStage, note);
            setSelectedApp(null);
          }}
          role="visa"
          userRole="visa_officer"
        />
      )}
    </div>
  );
};
