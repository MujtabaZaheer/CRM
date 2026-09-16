import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Search,
  ArrowRight,
  ExternalLink,
  Calendar,
  FileCheck2,
  HelpCircle,
  X,
  Printer,
  Copy,
  Check,
} from "lucide-react";
import { usePortalData } from "../../hooks/usePortalData";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { Invoice } from "../../types/finance";
import { generateInvoiceHtml, printDocumentHtml } from "../../utils/invoiceGenerator";
import { getUniversityCampusImage } from "../../utils/universityImages";
import {
  StudentMetricCard,
  StudentStatusBadge,
  StudentEmptyState,
} from "../../components/portal/common";

export const StudentInvoices: React.FC = () => {
  const { ownInvoices, ownApplications, submitPaymentProof } = usePortalData();
  const { universities } = useGlobalData();

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Payment proof modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofRef, setProofRef] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const stats = useMemo(() => {
    const totalCount = (ownInvoices || []).length;
    const pendingList = (ownInvoices || []).filter((i) => i.status === "Pending");
    const verifyingList = (ownInvoices || []).filter((i) => i.status === "Partially Paid");
    const paidList = (ownInvoices || []).filter((i) => i.status === "Paid");

    const totalAmount = (ownInvoices || []).reduce((acc, i) => acc + (i.amount || 0), 0);
    const pendingAmount = pendingList.reduce((acc, i) => acc + (i.amount || 0), 0);
    const paidAmount = paidList.reduce((acc, i) => acc + (i.amount || 0), 0);

    const primaryCurrency = ownInvoices?.[0]?.currency || "USD";

    return {
      totalCount,
      pendingCount: pendingList.length,
      verifyingCount: verifyingList.length,
      paidCount: paidList.length,
      totalAmount,
      pendingAmount,
      paidAmount,
      primaryCurrency,
    };
  }, [ownInvoices]);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return (ownInvoices || []).filter((inv) => {
      // Status filter
      if (selectedStatus === "pending" && inv.status !== "Pending") return false;
      if (selectedStatus === "verifying" && inv.status !== "Partially Paid") return false;
      if (selectedStatus === "paid" && inv.status !== "Paid") return false;

      // University filter
      const app = ownApplications.find((a) => a.id === inv.applicationId);
      if (selectedUniversity !== "all") {
        if (!app || (app.universityId !== selectedUniversity && app.universityName !== selectedUniversity)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = inv.invoiceNumber?.toLowerCase().includes(q);
        const typeMatch = inv.type?.toLowerCase().includes(q);
        const univMatch = app?.universityName?.toLowerCase().includes(q);
        const notesMatch = inv.notes?.toLowerCase().includes(q);
        if (!numMatch && !typeMatch && !univMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [ownInvoices, ownApplications, selectedStatus, selectedUniversity, searchQuery]);

  const handlePrintChallan = (inv: Invoice) => {
    const html = generateInvoiceHtml(inv);
    printDocumentHtml(html);
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !proofFile) return;

    setIsSubmitting(true);
    try {
      await submitPaymentProof(payingInvoice.id, proofFile, proofRef);
      setNotification({
        type: "success",
        message: `Payment proof for #${payingInvoice.invoiceNumber} uploaded successfully! Our finance department will verify your deposit.`,
      });
      setPayingInvoice(null);
      setProofFile(null);
      setProofRef("");
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err?.message || "Failed to upload payment proof. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-16 font-sans animate-fade-in">
      {/* Header */}
      <header className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] px-6 py-7 shadow-xl sm:px-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                Student Finance & Admissions Ledger
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
              Fee Challans & Invoices
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Access official university tuition deposits, track bank challans, submit payment transfer receipts, and download validated invoices.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Ledger</span>
            </button>
            <Link
              to="/student/applications"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span>My Applications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Notification Alert */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StudentMetricCard
          label="Total Challans"
          value={stats.totalCount}
          subtext={`${stats.primaryCurrency} ${stats.totalAmount.toLocaleString()} total billed`}
          icon={<Receipt className="w-5 h-5" />}
          variant="neutral"
        />
        <StudentMetricCard
          label="Pending Payment"
          value={stats.pendingCount}
          subtext={`${stats.primaryCurrency} ${stats.pendingAmount.toLocaleString()} deposit due`}
          icon={<Clock className="w-5 h-5" />}
          variant={stats.pendingCount > 0 ? "amber" : "neutral"}
        />
        <StudentMetricCard
          label="Under Verification"
          value={stats.verifyingCount}
          subtext="Receipts uploaded & in review"
          icon={<Upload className="w-5 h-5" />}
          variant="sky"
        />
        <StudentMetricCard
          label="Settled & Paid"
          value={stats.paidCount}
          subtext={`${stats.primaryCurrency} ${stats.paidAmount.toLocaleString()} verified`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />
      </section>

      {/* Main Workspace: Filters & Invoices List */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-sm space-y-6">
        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] overflow-x-auto">
            {[
              { id: "all", label: "All Invoices", count: stats.totalCount },
              { id: "pending", label: "Pending", count: stats.pendingCount },
              { id: "verifying", label: "Verifying", count: stats.verifyingCount },
              { id: "paid", label: "Paid & Settled", count: stats.paidCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedStatus === tab.id
                    ? "bg-emerald-500 text-zinc-950 shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedStatus === tab.id
                      ? "bg-zinc-950/20 text-zinc-950"
                      : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & University Filters */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challan # or notes..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Universities</option>
              {Array.from(new Set(ownApplications.map((a) => a.universityName))).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Challans List */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <StudentEmptyState
              icon={<Receipt className="w-6 h-6 text-muted" />}
              title="No Fee Challans Found"
              description={
                selectedStatus !== "all" || searchQuery
                  ? "No records match your selected filters. Try resetting the status or search term."
                  : "When your admissions officer or finance team issues a tuition deposit or admission fee challan, it will be securely recorded here."
              }
              action={
                selectedStatus !== "all" || searchQuery
                  ? {
                      label: "Reset Filters",
                      onClick: () => {
                        setSelectedStatus("all");
                        setSearchQuery("");
                        setSelectedUniversity("all");
                      },
                    }
                  : undefined
              }
            />
          ) : (
            filteredInvoices.map((inv) => {
              const targetApp = ownApplications.find((a) => a.id === inv.applicationId);
              const isPaid = inv.status === "Paid";
              const isPartiallyPaid = inv.status === "Partially Paid";

              const university = universities.find(
                (u) =>
                  u.id === targetApp?.universityId ||
                  u.name.toLowerCase() === targetApp?.universityName?.toLowerCase()
              );
              const campusImage = getUniversityCampusImage(university || targetApp?.universityName || "");

              return (
                <div
                  key={inv.id}
                  className="rounded-2xl bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-emerald-500/40 p-5 transition-all duration-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: University / Application details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-[var(--border-default)] shrink-0 shadow-xs relative bg-slate-900">
                        <img
                          src={campusImage}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/images/campus_uk.jpg";
                          }}
                        />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>#{inv.invoiceNumber}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(inv.invoiceNumber, inv.id)}
                              className="text-[var(--text-muted)] hover:text-emerald-400 transition-colors p-0.5 cursor-pointer"
                              title="Copy Challan #"
                            >
                              {copiedId === inv.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            {inv.type || "Tuition Deposit"}
                          </span>

                          <StudentStatusBadge
                            status={isPaid ? "Paid" : isPartiallyPaid ? "Partially Paid" : inv.status}
                            size="sm"
                          />
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
                          {targetApp?.universityName || inv.studentName || "University Placement"}
                        </h3>

                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {targetApp?.programmeName || inv.notes || "Official Tuition Deposit Voucher"}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount & Action buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col sm:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--border-default)]">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Amount Payable</p>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-heading">
                          {inv.currency} {inv.amount?.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 sm:justify-end mt-0.5">
                          <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>Due: {inv.dueDate || "Upon Receipt"}</span>
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => handlePrintChallan(inv)}
                          className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Download Challan</span>
                        </button>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => setPayingInvoice(inv)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Bank Slip</span>
                          </button>
                        )}

                        {isPaid && (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Payment Verified</span>
                          </div>
                        )}

                        {targetApp && (
                          <Link
                            to={`/student/applications/${targetApp.id}`}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-secondary hover:text-emerald-500 transition-colors flex items-center gap-1"
                            title="View Application Dossier"
                          >
                            <span>Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes & Bank transfer guidance if pending */}
                  {inv.notes && (
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{inv.notes}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Official Banking & Wire Transfer Details Card */}
      <section className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-7 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[var(--text-primary)] font-heading">
              Authorized Institution Bank Account Information
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Use these certified banking coordinates for telegraphic wire transfers or local branch deposits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Beneficiary Name</span>
            <p className="font-bold text-sm text-[var(--text-primary)] font-mono">EduCRM Global Admissions Trust</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Official Student Escrow & Settlement</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Bank Name & Branch</span>
            <p className="font-bold text-sm text-[var(--text-primary)]">Standard Chartered Bank PLC</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Global Education Admissions Division</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Reference Requirement</span>
            <p className="font-bold text-sm text-emerald-400 font-mono">
              Quote your Challan # & Student ID
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">Crucial for automated reconciliation</p>
          </div>
        </div>
      </section>

      {/* Payment Proof Upload Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)] backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] font-heading">
                  Submit Deposit Challan Proof
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Invoice #{payingInvoice.invoiceNumber} · {payingInvoice.currency} {payingInvoice.amount?.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProofSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Upload Bank Transfer Receipt / Deposit Slip <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-[var(--border-default)] hover:border-emerald-500/50 rounded-2xl p-5 text-center transition-colors bg-[var(--bg-elevated)]/30">
                  <input
                    type="file"
                    required
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-zinc-950 hover:file:bg-emerald-400 file:cursor-pointer"
                  />
                  {proofFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>{proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Bank Transaction Reference / Deposit Slip Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. FT2625901928 or Bank Branch Voucher #"
                  value={proofRef}
                  onChange={(e) => setProofRef(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-hidden focus:border-emerald-500/50 text-xs"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Important Verification Notice</span>
                </p>
                <p className="mt-0.5">
                  Ensure the bank stamp, deposit amount, and sender details are legible. Our finance team verifies submitted proofs within 1-2 business days and releases your official CAS/Offer confirmation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !proofFile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Proof...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Confirm & Submit Proof</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
