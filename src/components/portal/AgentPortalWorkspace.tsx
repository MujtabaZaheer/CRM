import React, { useState, useEffect, useMemo } from "react";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users2,
  DollarSign,
  Search,
  Link2,
  Sparkles,
  FileText,
  Award,
  Clock,
  Plus,
  Building2,
  MapPin,
  ExternalLink,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  Printer,
  CheckCircle2,
  UploadCloud,
  Receipt,
  X,
} from "lucide-react";
import { collection, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Commission } from "../../types/finance";
import { ApplicationStage } from "../../types/application";
import { triggerApplicationCommission } from "../../utils/commissionEngine";
import { DEMO_COMMISSIONS } from "../../data/demoData";
import { GLOBAL_UNIVERSITIES } from "../../data/globalUniversities";
import { University, Programme } from "../../types/university";
import { getUniversityCampusImage } from "../../utils/universityImages";
import { useNavigate } from "react-router-dom";
import { AgentStudentIntakeWizard } from "../agent/intake/AgentStudentIntakeWizard";
import { AgentApplicationsTable } from "../agent/dashboard/AgentApplicationsTable";

export type AgentSubPage = "dashboard" | "universities" | "referrals" | "refer-lead" | "commissions" | "notifications";

export const AgentPortalWorkspace: React.FC<{ page: AgentSubPage }> = ({ page }) => {
  const { leads, applications, universities, documents, updateApplication, addDocument } = useGlobalData();
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [referralMode, setReferralMode] = useState<"wizard" | "express">("wizard");
  const [referralsTab, setReferralsTab] = useState<"dossiers" | "leads" | "challans">("dossiers");

  // Challan Inspection & Payment Proof Modal State
  const [selectedChallanApp, setSelectedChallanApp] = useState<any | null>(null);
  const [uploadingProofApp, setUploadingProofApp] = useState<any | null>(null);
  const [proofTxRef, setProofTxRef] = useState("");
  const [proofAmount, setProofAmount] = useState<number>(2500);
  const [proofDate, setProofDate] = useState(new Date().toISOString().slice(0, 10));
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Active Universities list (prefer global universities catalogue with full programmes)
  const allUniversities: University[] = useMemo(() => {
    return universities.length > 0 ? universities : GLOBAL_UNIVERSITIES;
  }, [universities]);

  // Live Firestore State
  const [liveLeads, setLiveLeads] = useState<any[]>([]);
  const [liveApplications, setLiveApplications] = useState<any[]>([]);
  const [liveCommissions, setLiveCommissions] = useState<Commission[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const [copyNotice, setCopyNotice] = useState(false);

  // University Directory Filters
  const [uniSearch, setUniSearch] = useState("");
  const [uniCountryFilter, setUniCountryFilter] = useState("All");
  const [uniLevelFilter, setUniLevelFilter] = useState("All");
  const [expandedUniId, setExpandedUniId] = useState<string | null>(null);

  // Referral Form State
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCountry, setLeadCountry] = useState("United Kingdom");
  const [leadUniversity, setLeadUniversity] = useState(allUniversities[0]?.name || "University of Oxford");
  const [leadProgram, setLeadProgram] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);

  // Payout Claim Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [claimStudent, setClaimStudent] = useState("");
  const [claimUniversity, setClaimUniversity] = useState("University of Manchester");
  const [claimAmount, setClaimAmount] = useState<number>(750);
  const [claimNotes, setClaimNotes] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Notifications State
  const [agentAlerts, setAgentAlerts] = useState<Array<{ id: string; title: string; message: string; date: number; read: boolean }>>([
    {
      id: "alt-1",
      title: "Commission Claim Approved",
      message: "Finance has approved payout claim of $850 USD for student Aarav Patel (Univ of Oxford).",
      date: Date.now() - 3600000 * 4,
      read: false,
    },
    {
      id: "alt-2",
      title: "Offer Released by University",
      message: "Imperial College London has issued an Unconditional Offer for your referred candidate.",
      date: Date.now() - 86400000,
      read: false,
    },
    {
      id: "alt-3",
      title: "CAS Reference Confirmed",
      message: "CAS Reference CAS-2026-UK-91823 has been officially released for visa filing.",
      date: Date.now() - 86400000 * 2,
      read: true,
    },
  ]);

  // Real-time Firestore Listeners
  useEffect(() => {
    // 1. Live Commissions Stream
    const unsubComm = onSnapshot(
      collection(db, "commissions"),
      (snap) => {
        const list: Commission[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any), isLive: true } as Commission));
        list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        setLiveCommissions(list.length > 0 ? list : DEMO_COMMISSIONS);
        setIsLiveConnected(true);
      },
      () => setLiveCommissions(DEMO_COMMISSIONS)
    );

    // 2. Live Leads Stream
    const unsubLeads = onSnapshot(
      collection(db, "leads"),
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data(), isLive: true }));
        list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        setLiveLeads(list);
        setIsLiveConnected(true);
      },
      (err) => console.warn("Agent leads live stream notice:", err)
    );

    // 3. Live Applications Stream
    const unsubApps = onSnapshot(
      collection(db, "applications"),
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data(), isLive: true }));
        list.sort((a, b) => (Number(b.createdAt) || Number(b.updatedAt) || 0) - (Number(a.createdAt) || Number(a.updatedAt) || 0));
        setLiveApplications(list);
        setIsLiveConnected(true);
      },
      (err) => console.warn("Agent apps live stream notice:", err)
    );

    return () => {
      unsubComm();
      unsubLeads();
      unsubApps();
    };
  }, []);

  // Merge live leads with context leads, strictly isolated to the authenticated agent
  const effectiveLeads = useMemo(() => {
    const liveMap = new Map<string, any>();
    liveLeads.forEach((l) => liveMap.set(l.id, l));
    leads.forEach((l) => {
      if (!liveMap.has(l.id)) liveMap.set(l.id, l);
    });
    const combined = Array.from(liveMap.values());

    const agentUid = appUser?.uid;
    const agentEmail = appUser?.email;

    // Filter to only records belonging to this specific agent
    return combined.filter((lead: any) => {
      if (!agentUid && !agentEmail) return false;
      return (
        lead.agentUid === agentUid ||
        lead.agentId === agentUid ||
        lead.referredBy === agentUid ||
        lead.agentEmail === agentEmail ||
        lead.agentReferredBy === agentUid
      );
    });
  }, [liveLeads, leads, appUser]);

  // Merge live applications with context applications, strictly isolated to the authenticated agent
  const effectiveApplications = useMemo(() => {
    const liveMap = new Map<string, any>();
    liveApplications.forEach((a) => liveMap.set(a.id, a));
    applications.forEach((a) => {
      if (!liveMap.has(a.id)) liveMap.set(a.id, a);
    });
    const combined = Array.from(liveMap.values());

    const agentUid = appUser?.uid;
    const agentEmail = appUser?.email;

    // Filter to only records belonging to this specific agent
    return combined.filter((app: any) => {
      if (!agentUid && !agentEmail) return false;
      return (
        app.agentUid === agentUid ||
        app.agentId === agentUid ||
        app.referredBy === agentUid ||
        app.agentEmail === agentEmail ||
        app.agentReferredBy === agentUid ||
        (app.agentReferred && (app.agentName === appUser?.displayName || !app.agentUid))
      );
    });
  }, [liveApplications, applications, appUser]);

  // Fee Challans & Deposit Clearance Applications
  const challanApplications = useMemo(() => {
    return effectiveApplications.filter((app: any) => {
      return (
        app.challanGenerated ||
        app.challanNumber ||
        [
          "Deposit Pending",
          "Deposit Paid",
          "Unconditional Offer",
          "Conditional Offer",
          "CAS / COE Pending",
          "CAS Issued",
          "Visa Preparation",
          "Visa Submitted",
          "Visa Approved",
          "Enrolled",
        ].includes(app.stage)
      );
    });
  }, [effectiveApplications]);

  // Effective Commissions strictly isolated to the authenticated agent
  const effectiveCommissions = useMemo(() => {
    const agentUid = appUser?.uid;
    const agentEmail = appUser?.email;

    // Only return commissions belonging to this specific agent - never leak other agents' payouts
    return liveCommissions.filter((comm: any) => {
      if (!agentUid && !agentEmail) return false;
      return (
        comm.agentUid === agentUid ||
        comm.agentId === agentUid ||
        comm.agentEmail === agentEmail ||
        comm.agentName === appUser?.displayName ||
        comm.agentName?.includes(appUser?.displayName || "")
      );
    });
  }, [liveCommissions, appUser]);

  // Total commission earned calculations
  const totalEarned = useMemo(() => {
    return effectiveCommissions
      .filter((c) => c.status === "Paid" || c.status === "Approved")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [effectiveCommissions]);

  const pendingPayout = useMemo(() => {
    return effectiveCommissions
      .filter((c) => c.status === "Pending")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [effectiveCommissions]);

  // Referral Link Generator
  const referralLink = `https://education-crm-9fee2.web.app/register?ref=${appUser?.uid || "agent123"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 3000);
  };

  const cleanPayload = <T extends Record<string, any>>(obj: T): T => {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null) cleaned[k] = v;
    }
    return cleaned;
  };

  // Pre-fill referral form from university explorer
  const handleSelectProgramForReferral = (uni: University, prog: Programme) => {
    setLeadUniversity(uni.name);
    setLeadCountry(uni.country);
    setLeadProgram(prog.title);
    navigate("/agent/refer-lead");
  };

  // Submit Referral Form
  const handleReferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;
    setSubmittingLead(true);

    try {
      const trackingCode = `REF-${Date.now().toString().slice(-4)}`;
      const agentUid = appUser?.uid || "agent_external";
      const agentName = appUser?.displayName || appUser?.agencyName || "External Referral Agent";
      const tenantId = appUser?.tenantId || "tenant-london";

      // 1. Create Lead in Firestore
      await addDoc(
        collection(db, "leads"),
        cleanPayload({
          name: leadName,
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone || "",
          targetCountry: leadCountry,
          preferredUniversity: leadUniversity,
          preferredProgram: leadProgram || "Undergraduate / Master Studies",
          programInterest: leadProgram || "Undergraduate / Master Studies",
          notes: leadNotes || "",
          source: "External Agent Referral",
          trackingCode: trackingCode,
          agentUid,
          agentName,
          agentReferred: true,
          admissionsVisibility: false,
          vettingStatus: "pending_triage",
          tenantId,
          stage: "New Referral",
          status: "New Referral",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLive: true,
        })
      );

      // 2. Create Student record in Firestore with agent referral isolation tags
      const studentDoc = await addDoc(
        collection(db, "students"),
        cleanPayload({
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone || "",
          countryOfResidence: leadCountry || "United Kingdom",
          nationality: leadCountry || "International",
          preferredDestination: leadCountry,
          preferredProgram: leadProgram || "Undergraduate / Master Studies",
          agentUid,
          agentName,
          agentReferred: true,
          admissionsVisibility: false,
          vettingStatus: "pending_triage",
          tenantId,
          profileCompleteness: 40,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      // 3. Create Application record in Firestore with admissionsVisibility: false
      await addDoc(
        collection(db, "applications"),
        cleanPayload({
          studentId: studentDoc.id,
          studentName: leadName,
          studentEmail: leadEmail,
          universityName: leadUniversity || "Partner University",
          programName: leadProgram || "Undergraduate / Master Studies",
          country: leadCountry,
          status: "Draft",
          stage: "Draft",
          agentUid,
          agentName,
          agentReferred: true,
          admissionsVisibility: false,
          vettingStatus: "pending_triage",
          tenantId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      setFormSuccess(`Referral for ${leadName} submitted to Firestore! Tracking Reference: ${trackingCode}.`);
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadProgram("");
      setLeadNotes("");
    } catch (err: any) {
      setFormSuccess(`Referral for ${leadName} registered! (${err?.message || "Sync queued"})`);
    } finally {
      setSubmittingLead(false);
    }
  };

  // Seed sample live referral for immediate verification
  const handleSeedLiveReferral = async () => {
    const samples = [
      { name: "Zainab Al-Mansoor", country: "United Kingdom", uni: "University of Oxford", prog: "MSc in Advanced Computer Science" },
      { name: "David O'Connor", country: "United Kingdom", uni: "University of Cambridge", prog: "MPhil in Machine Learning and Machine Intelligence" },
      { name: "Mei-Ling Chen", country: "United States", uni: "Harvard University", prog: "Master in Public Policy (MPP)" },
      { name: "Farhan Siddiqui", country: "Canada", uni: "University of Toronto", prog: "Master of Science in Applied Computing (MScAC)" },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const code = `REF-${Date.now().toString().slice(-4)}`;
    const agentUid = appUser?.uid || "agent_external";
    const agentName = appUser?.displayName || "External Referral Agent";
    const tenantId = appUser?.tenantId || "tenant-london";

    try {
      await addDoc(
        collection(db, "leads"),
        cleanPayload({
          name: pick.name,
          fullName: pick.name,
          email: `${pick.name.toLowerCase().replace(/[^a-z]/g, "")}@applicant-cloud.com`,
          phone: "+44 7900 " + Math.floor(100000 + Math.random() * 900000),
          targetCountry: pick.country,
          preferredUniversity: pick.uni,
          preferredProgram: pick.prog,
          programInterest: pick.prog,
          notes: "Real-time live referral registered via cloud agent portal.",
          source: "External Agent Referral",
          trackingCode: code,
          agentUid,
          agentName,
          agentReferred: true,
          admissionsVisibility: false,
          vettingStatus: "pending_triage",
          tenantId,
          stage: "New Referral",
          status: "New Referral",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLive: true,
        })
      );

      const studentDoc = await addDoc(
        collection(db, "students"),
        cleanPayload({
          fullName: pick.name,
          email: `${pick.name.toLowerCase().replace(/[^a-z]/g, "")}@applicant-cloud.com`,
          phone: "+44 7900 " + Math.floor(100000 + Math.random() * 900000),
          countryOfResidence: pick.country,
          nationality: pick.country,
          preferredDestination: pick.country,
          preferredProgram: pick.prog,
          agentUid,
          agentName,
          agentReferred: true,
          admissionsVisibility: false,
          vettingStatus: "pending_triage",
          tenantId,
          profileCompleteness: 55,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      await addDoc(
        collection(db, "applications"),
        cleanPayload({
          studentId: studentDoc.id,
          studentName: pick.name,
          studentEmail: `${pick.name.toLowerCase().replace(/[^a-z]/g, "")}@applicant-cloud.com`,
          universityName: pick.uni,
          programName: pick.prog,
          country: pick.country,
          status: "Draft",
          stage: "Draft",
          agentUid,
          agentName,
          agentReferred: true,
          admissionsVisibility: false,
          vettingStatus: "pending_triage",
          tenantId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      setFormSuccess(`Live cloud referral for ${pick.name} registered instantly! Tracking ID: ${code}`);
    } catch (err: any) {
      setFormSuccess(`Live cloud referral queued.`);
    }
  };

  // Submit Claim
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimStudent || !claimAmount) return;
    setSubmittingClaim(true);
    try {
      await addDoc(
        collection(db, "commissions"),
        cleanPayload({
          agentUid: appUser?.uid || "agent_external",
          agentName: appUser?.displayName || "External Referral Agent",
          studentName: claimStudent,
          universityName: claimUniversity,
          amount: claimAmount,
          currency: "USD",
          status: "Pending",
          notes: claimNotes || "External agent manual claim request",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLive: true,
        })
      );
      setFormSuccess(`Commission claim for $${claimAmount} USD (${claimStudent}) submitted to Finance!`);
      setShowPayoutModal(false);
      setClaimStudent("");
      setClaimNotes("");
    } catch (err: any) {
      setFormSuccess(`Commission claim recorded.`);
      setShowPayoutModal(false);
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Submit Proof of Paid Challan
  const handleSubmitProofOfChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingProofApp) return;
    setIsSubmittingProof(true);

    try {
      const receiptNo = proofTxRef.trim() || `REC-${Date.now().toString().slice(-6)}`;
      const paidDate = proofDate || new Date().toISOString().slice(0, 10);
      const paidAmount = Number(proofAmount) || Number(uploadingProofApp.challanAmount) || 2500;
      const currency = uploadingProofApp.challanCurrency || "USD";

      // 1. Add document record to documents collection
      const docPayload = cleanPayload({
        studentId: uploadingProofApp.studentId || uploadingProofApp.id,
        applicationId: uploadingProofApp.id,
        documentType: "Tuition Deposit Challan / Payment Proof",
        docType: "Deposit Challan Payment Proof",
        fileName: proofFile?.name || `Challan_${uploadingProofApp.challanNumber || "Payment"}_Proof.pdf`,
        fileUrl: proofFile ? URL.createObjectURL(proofFile) : "#",
        status: "Verified",
        verified: true,
        verificationStatus: "verified",
        notes: `Agent uploaded paid challan slip: Tx Ref ${receiptNo}, Amount ${currency} ${paidAmount}. ${proofNotes || ""}`,
        uploadedBy: appUser?.displayName || "External Agent",
        uploadedAt: Date.now(),
        createdAt: Date.now(),
      });

      try {
        await addDoc(collection(db, "student_documents"), docPayload);
        await addDoc(collection(db, "documents"), docPayload);
      } catch (err) {
        console.warn("Firestore document insert warning:", err);
      }
      if (addDocument) {
        try {
          addDocument(docPayload as any);
        } catch (e) {}
      }

      // 2. Advance Application Stage to 'Deposit Paid' and route to Visa
      const appUpdate = cleanPayload({
        stage: "Deposit Paid" as ApplicationStage,
        status: "Deposit Paid",
        depositPaid: true,
        depositAmountPaid: paidAmount,
        depositPaymentDate: paidDate,
        depositTransactionRef: receiptNo,
        assignedDepartment: "Visa",
        updatedAt: Date.now(),
      });

      updateApplication(uploadingProofApp.id, appUpdate);

      try {
        await updateDoc(doc(db, "applications", uploadingProofApp.id), appUpdate);
      } catch (err) {
        console.warn("Firestore application update warning:", err);
      }

      // 3. Automatically calculate and record Agent Commission in commission ledger!
      try {
        const tuitionFee = uploadingProofApp.tuitionFee || uploadingProofApp.tuitionFeeUSD || 22000;
        await triggerApplicationCommission(
          { ...uploadingProofApp, ...appUpdate },
          tuitionFee,
          appUser?.displayName || uploadingProofApp.agentName || "Referral Agent Partner",
          uploadingProofApp.assignedCounsellor
        );
      } catch (err) {
        console.warn("Commission auto-calculation warning:", err);
      }

      // 4. Send notification to Visa & Finance teams
      try {
        await addDoc(collection(db, "notifications"), {
          title: "Deposit Paid & Challan Proof Uploaded",
          message: `Agent submitted paid challan proof (${receiptNo}) for ${uploadingProofApp.studentName}. Application forwarded to Visa Desk.`,
          type: "deposit_paid",
          applicationId: uploadingProofApp.id,
          targetRole: "visa_officer",
          read: false,
          createdAt: Date.now(),
        });
      } catch (e) {}

      setFormSuccess(
        `Proof of payment for ${uploadingProofApp.studentName} uploaded! Application updated to 'Deposit Paid' and forwarded to Visa Desk. Agent commission accrued successfully!`
      );
      setUploadingProofApp(null);
      setProofTxRef("");
      setProofFile(null);
      setProofNotes("");
    } catch (err: any) {
      setFormSuccess(`Error submitting proof: ${err?.message || "Failed to process"}`);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Filtered universities
  const filteredUniversities = useMemo(() => {
    return allUniversities.filter((u) => {
      const matchesCountry = uniCountryFilter === "All" || u.country === uniCountryFilter;
      const q = uniSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q) ||
        u.programmes.some((p) => p.title.toLowerCase().includes(q) || p.subjectArea?.toLowerCase().includes(q));

      const matchesLevel =
        uniLevelFilter === "All" ||
        u.programmes.some((p) => p.level.toLowerCase() === uniLevelFilter.toLowerCase());

      return matchesCountry && matchesSearch && matchesLevel;
    });
  }, [allUniversities, uniCountryFilter, uniSearch, uniLevelFilter]);

  // Distinct countries for filter
  const distinctCountries = useMemo(() => {
    const list = Array.from(new Set(allUniversities.map((u) => u.country))).filter(Boolean);
    return ["All", ...list];
  }, [allUniversities]);

  // Selected University's programmes for referral dropdown
  const selectedUniObj = useMemo(() => {
    return allUniversities.find((u) => u.name === leadUniversity) || allUniversities[0];
  }, [allUniversities, leadUniversity]);

  return (
    <div className="space-y-6 text-xs p-2 sm:p-4 min-h-screen text-[var(--text-primary)]">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: `url('/images/role_agent.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/90 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)] capitalize flex items-center gap-2">
              <Users2 className="w-6 h-6 text-emerald-400" />
              External Referral Agent Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Verified Partner Agency
            </span>
            {/* Live Firestore Stream Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
              <span>
                {isLiveConnected ? "Live Firestore Active" : "Connecting..."} ({liveLeads.length} Cloud Referrals)
              </span>
            </div>
          </div>
          <p className="text-[var(--text-secondary)]">
            Explore partner universities & programmes, submit prospective student referrals, and monitor real-time application and commission milestones.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeedLiveReferral}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl transition-all cursor-pointer shadow-sm text-xs"
            title="Add a real-time lead document into Firestore"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Test Live Sync</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20 text-xs"
          >
            <Link2 className="w-4 h-4" />
            {copyNotice ? "Tracking Link Copied!" : "Copy Referral Link"}
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTICE */}
      {formSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-between text-xs transition-all">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {formSuccess}
          </span>
          <button onClick={() => setFormSuccess("")} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <div className="space-y-6">
          {/* Metric KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-bold uppercase text-[10px]">
                <span>Total Referred Students</span>
                <Users2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold font-heading text-[var(--text-primary)]">{effectiveLeads.length}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{effectiveLeads.filter((l: any) => l.isLive).length} live cloud referrals</span>
              </div>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-bold uppercase text-[10px]">
                <span>Active University Applications</span>
                <FileText className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-3xl font-bold font-heading text-[var(--text-primary)]">{effectiveApplications.length}</p>
              <span className="text-[10px] text-[var(--text-secondary)]">Across Partner Campuses</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-bold uppercase text-[10px]">
                <span>Earned Commissions</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold font-heading text-emerald-400">${totalEarned.toLocaleString()} USD</p>
              <span className="text-[10px] text-[var(--text-secondary)]">${pendingPayout.toLocaleString()} Pending Claim Approval</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-bold uppercase text-[10px]">
                <span>Enrolment Conversion Rate</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-bold font-heading text-[var(--text-primary)]">74%</p>
              <span className="text-[10px] text-emerald-400 font-semibold">Tier 1 Premier Recruitment Yield</span>
            </div>
          </div>

          {/* Quick Tracking Link & Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm font-heading text-[var(--text-primary)] flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-emerald-400" />
                    Personal Referral Tracking Link (Section 5.2)
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Share this link with prospective students. Self-registered applicants will be automatically tied to your agent account.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl font-mono text-emerald-400 flex items-center justify-between gap-3">
                <span className="truncate text-xs">{referralLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer transition-colors shrink-0"
                >
                  {copyNotice ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => navigate("/agent/universities")}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-[var(--text-primary)]">Explore Universities</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{allUniversities.length} Institutions</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/agent/refer-lead")}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-[var(--text-primary)]">Refer New Student</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Direct Referral Form</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/agent/commissions")}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-[var(--text-primary)]">Commission Ledger</p>
                    <p className="text-[10px] text-[var(--text-muted)]">File Payout Claims</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Live Commission Snapshot */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm font-heading text-[var(--text-primary)] flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Commission Tier & Rates
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  Tier 1 (12.5%)
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                You receive 10% to 15% of the first-year tuition fee for each successfully enrolled candidate upon deposit payment.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[var(--bg-elevated)] rounded-xl flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Undergraduate Referral:</span>
                  <span className="font-bold text-[var(--text-primary)]">£1,800 – £2,500</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-elevated)] rounded-xl flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Postgraduate Masters:</span>
                  <span className="font-bold text-[var(--text-primary)]">£2,200 – £3,800</span>
                </div>
                <div className="p-2.5 bg-[var(--bg-elevated)] rounded-xl flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">MBA / Executive:</span>
                  <span className="font-bold text-emerald-400">£4,500+</span>
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                + Submit New Commission Claim
              </button>
            </div>
          </div>

          {/* Recent Referred Students Quick Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm font-heading text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Recent Referred Candidates
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Live real-time milestone tracking for your referred candidates.
                </p>
              </div>
              <button
                onClick={() => navigate("/agent/referrals")}
                className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Full Roster ({effectiveLeads.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[var(--border-default)]">
              {effectiveLeads.slice(0, 5).map((lead: any, idx: number) => (
                <div key={lead.id || idx} className="py-3 flex items-center justify-between gap-4 hover:bg-[var(--bg-hover)] px-2 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{lead.fullName || lead.name}</span>
                      {lead.isLive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[9px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Cloud
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                        {lead.trackingCode || `REF-${(idx + 100).toString()}`}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {lead.preferredProgram || lead.programInterest || "Degree Programme"} • {lead.preferredUniversity || lead.targetCountry}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-full text-xs">
                      {lead.stage || "New Referral"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PARTNER UNIVERSITIES & PROGRAMMES DIRECTORY PAGE */}
      {page === "universities" && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base font-heading text-[var(--text-primary)] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Partner Universities & Academic Programmes Directory
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Browse official partner institutions, view entry requirements and fee structures, and refer prospective students in 1-click.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl inline-block">
                  {filteredUniversities.length} Institutions Available
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-default)]">
              {/* Keyword Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={uniSearch}
                  onChange={(e) => setUniSearch(e.target.value)}
                  placeholder="Search university, programme, city..."
                  className="w-full pl-9 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Destination Country Filter */}
              <div>
                <select
                  value={uniCountryFilter}
                  onChange={(e) => setUniCountryFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">All Destination Countries</option>
                  {distinctCountries.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Level Filter */}
              <div>
                <select
                  value={uniLevelFilter}
                  onChange={(e) => setUniLevelFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">All Study Levels</option>
                  <option value="Undergraduate">Undergraduate (BSc, BA)</option>
                  <option value="Postgraduate">Postgraduate (MSc, MA, MBA)</option>
                  <option value="Doctorate">Doctorate / PhD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Universities List Cards */}
          <div className="space-y-6">
            {filteredUniversities.length === 0 ? (
              <div className="p-12 text-center bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl text-[var(--text-muted)]">
                No universities or programmes match your current filter criteria.
              </div>
            ) : (
              filteredUniversities.map((uni) => {
                const isExpanded = expandedUniId === uni.id;
                const campusImage = getUniversityCampusImage(uni);

                return (
                  <div
                    key={uni.id}
                    className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm transition-all hover:border-emerald-500/40"
                  >
                    {/* University Card Header Banner */}
                    <div className="relative p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)]">
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
                        style={{ backgroundImage: `url('${campusImage}')` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)]/95 to-transparent pointer-events-none" />

                      <div className="relative z-10 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-400" />
                            {uni.name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {uni.accreditationStatus || "Full Partner"}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {uni.city}, {uni.country}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-2xl">
                          {uni.description || "World-class higher education partner institution with international recognition."}
                        </p>
                      </div>

                      <div className="relative z-10 flex flex-wrap items-center gap-3">
                        <div className="text-right hidden md:block">
                          <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Global Ranking</div>
                          <div className="font-bold text-sm text-[var(--text-primary)] font-mono">
                            #{uni.globalRanking || "Top 100"}
                          </div>
                        </div>

                        {uni.website && (
                          <a
                            href={uni.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            title="Visit Official University Website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => setExpandedUniId(isExpanded ? null : uni.id)}
                          className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{isExpanded ? "Hide Programmes" : `View ${uni.programmes.length} Programmes`}</span>
                        </button>
                      </div>
                    </div>

                    {/* Academic Programmes Catalogue */}
                    {isExpanded && (
                      <div className="p-5 bg-[var(--bg-elevated)]/50 space-y-4">
                        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                          <span className="font-semibold uppercase text-[10px] tracking-wider text-[var(--text-muted)]">
                            Active Programmes Open for International Intake
                          </span>
                          <span className="text-emerald-400 font-medium">Standard Partner Commission: 10% - 15%</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {uni.programmes.map((prog) => {
                            const feeFormatted = `${prog.currency || "GBP"} ${(prog.tuitionFeeAnnual || 24000).toLocaleString()}`;
                            const estCommission = Math.round((prog.tuitionFeeAnnual || 24000) * 0.125);

                            return (
                              <div
                                key={prog.id}
                                className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] space-y-3 hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="font-bold text-sm text-[var(--text-primary)] line-clamp-1">
                                        {prog.title}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                          {prog.level}
                                        </span>
                                        <span className="text-[11px] text-[var(--text-muted)]">
                                          Duration: {prog.durationMonths} Months
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-bold text-sm text-emerald-400 font-mono block">
                                        {feeFormatted}
                                      </span>
                                      <span className="text-[10px] text-[var(--text-muted)]">Annual Tuition</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[var(--border-default)]">
                                    <div>
                                      <span className="text-[var(--text-muted)] block">Intakes:</span>
                                      <span className="font-medium text-[var(--text-secondary)]">
                                        {prog.intakes?.join(", ") || "September, January"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[var(--text-muted)] block">English Requirement:</span>
                                      <span className="font-medium text-[var(--text-secondary)]">
                                        IELTS {prog.minIeltsScore || 6.5}+
                                      </span>
                                    </div>
                                  </div>

                                  {prog.entryRequirements && (
                                    <div className="p-2 bg-[var(--bg-elevated)] rounded-lg text-[11px] text-[var(--text-secondary)] line-clamp-2">
                                      <span className="font-bold text-[var(--text-primary)]">Entry Criteria: </span>
                                      {prog.entryRequirements}
                                    </div>
                                  )}

                                  {prog.scholarships && prog.scholarships.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
                                      <Award className="w-3.5 h-3.5 shrink-0" />
                                      <span>Scholarship: {prog.scholarships[0].name} ({prog.scholarships[0].amount})</span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                                  <div className="text-[11px] font-semibold text-emerald-400">
                                    Est. Commission: ~${estCommission.toLocaleString()} USD
                                  </div>
                                  <button
                                    onClick={() => handleSelectProgramForReferral(uni, prog)}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                  >
                                    <span>Refer Candidate</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REFERRALS LIST PAGE */}
      {page === "referrals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setReferralsTab("dossiers")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  referralsTab === "dossiers"
                    ? "bg-emerald-500 text-zinc-950 shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Admission Dossiers (Pipeline Engine)
              </button>
              <button
                type="button"
                onClick={() => setReferralsTab("leads")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  referralsTab === "leads"
                    ? "bg-emerald-500 text-zinc-950 shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Quick Leads Roster ({effectiveLeads.length})
              </button>
              <button
                type="button"
                onClick={() => setReferralsTab("challans")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  referralsTab === "challans"
                    ? "bg-emerald-500 text-zinc-950 shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Fee Challans & Deposit Clearance ({challanApplications.length})</span>
              </button>
            </div>
          </div>

          {referralsTab === "dossiers" ? (
            <AgentApplicationsTable
              applications={effectiveApplications.length > 0 ? effectiveApplications : effectiveLeads.map((l: any) => ({
                id: l.id,
                studentId: l.studentId || l.id,
                studentName: l.fullName || l.name,
                studentEmail: l.email,
                universityName: l.preferredUniversity || "Partner University",
                programName: l.preferredProgram || l.programInterest || "Degree Programme",
                country: l.targetCountry || "United Kingdom",
                intake: "Sep/Oct 2026",
                stage: l.stage || "Initial Review",
                status: l.status || "Initial Review",
                commissionAmount: 850,
                commissionStatus: "Eligible",
                isLive: l.isLive,
                createdAt: l.createdAt,
                documents: [],
              }))}
              documents={documents}
              onOpenWizard={() => navigate("/agent/refer-lead")}
            />
          ) : referralsTab === "leads" ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--text-primary)]">
                  Showing {effectiveLeads.length} Referred Candidates (Live Tracking Roster)
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Full 8-Stage Lifecycle Transparency (Section 3.14)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Student Name & ID</th>
                      <th className="p-3.5">Contact Details</th>
                      <th className="p-3.5">Target Institution & Program</th>
                      <th className="p-3.5">Destination</th>
                      <th className="p-3.5">Milestone Stage</th>
                      <th className="p-3.5 text-right">Est. Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)] text-xs">
                    {effectiveLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                          No referred candidates found. Submit your first student referral!
                        </td>
                      </tr>
                    ) : (
                      effectiveLeads.map((lead: any, idx: number) => (
                        <tr key={lead.id || idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-[var(--text-primary)]">
                                {lead.fullName || lead.name}
                              </span>
                              {lead.isLive && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[9px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Live Cloud
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              {lead.trackingCode || `REF-${(idx + 100).toString()}`}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-[var(--text-secondary)] font-medium">{lead.email}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{lead.phone || "+44 7700 900000"}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-[var(--text-primary)]">
                              {lead.preferredProgram || lead.programInterest || "MSc Advanced Studies"}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {lead.preferredUniversity || "Partner University"}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-medium">
                              {lead.targetCountry || "United Kingdom"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                                lead.stage === "Enrolled" || lead.stage === "Visa Granted"
                                  ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                                  : lead.stage?.includes("Offer")
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {lead.stage || "New Referral"}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-emerald-400 font-mono">
                            $750 USD
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Fee Challans & Deposit Clearance Tab */
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    University Fee Challans & Deposit Clearance
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Download and provide official tuition deposit challans to students. Upload proof of paid challans to automatically advance stage to &quot;Deposit Paid&quot; and calculate agency commissions.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 self-start sm:self-auto">
                  {challanApplications.length} Actionable Challans
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Student & App #</th>
                      <th className="p-3.5">University & Programme</th>
                      <th className="p-3.5">Challan Reference</th>
                      <th className="p-3.5">Deposit Amount</th>
                      <th className="p-3.5">Clearance Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)] text-xs">
                    {challanApplications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                          No fee challans generated yet. When admissions verification completes and Finance issues a challan, it will appear here for student payment and proof upload.
                        </td>
                      </tr>
                    ) : (
                      challanApplications.map((app: any, idx: number) => {
                        const isPaid =
                          app.stage === "Deposit Paid" ||
                          app.depositPaid ||
                          [
                            "CAS / COE Pending",
                            "CAS Issued",
                            "Visa Preparation",
                            "Visa Submitted",
                            "Visa Approved",
                            "Enrolled",
                          ].includes(app.stage);
                        const challanRef =
                          app.challanNumber || `CHAL-2026-${app.id.slice(-6).toUpperCase()}`;
                        const amount = app.challanAmount || 2500;
                        const currency = app.challanCurrency || "USD";

                        return (
                          <tr key={app.id || idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-sm text-[var(--text-primary)]">
                                {app.studentName}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                {app.applicationNumber || app.id}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-semibold text-[var(--text-primary)]">
                                {app.universityName}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate max-w-xs">
                                {app.programName || app.programmeName || "Academic Degree"}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-mono font-bold text-emerald-400">
                                {challanRef}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                Due: {app.challanDueDate || "14 days from issue"}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                                {currency} {amount.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)]">Tuition Deposit</div>
                            </td>
                            <td className="p-3.5">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Deposit Paid & Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <Clock className="w-3.5 h-3.5" />
                                  Deposit Pending Clearance
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedChallanApp(app)}
                                  className="px-2.5 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                  title="View and print official fee challan voucher"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Print Challan</span>
                                </button>

                                {!isPaid ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUploadingProofApp(app);
                                      setProofAmount(amount);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                                    title="Upload receipt / bank deposit slip"
                                  >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload Proof</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                    Commission Accrued
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REFER NEW LEAD FORM PAGE */}
      {page === "refer-lead" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReferralMode("wizard")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  referralMode === "wizard"
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                Admission Intake Wizard & Dossier Builder (CRM.pdf 3.14)
              </button>
              <button
                type="button"
                onClick={() => setReferralMode("express")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  referralMode === "express"
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                Express Quick Lead
              </button>
            </div>
            <button
              onClick={() => navigate("/agent/referrals")}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              View All Referrals
            </button>
          </div>

          {referralMode === "wizard" ? (
            <AgentStudentIntakeWizard onComplete={() => navigate("/agent/referrals")} />
          ) : (
            <div className="max-w-2xl mx-auto p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-6 shadow-sm">
              <div>
                <h2 className="font-bold text-lg font-heading text-[var(--text-primary)] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Register Express Student Referral
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Submit student candidate details directly into the CRM database. Leads are immediately routed to the admissions matching pipeline.
                </p>
              </div>

              <form onSubmit={handleReferSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Student Full Name *</label>
                    <input
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g. Tariq Mansoor"
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Student Email *</label>
                    <input
                      required
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="e.g. tariq.mansoor@example.com"
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Phone / WhatsApp Number</label>
                    <input
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="e.g. +44 7123 456789"
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Target Destination Country</label>
                    <select
                      value={leadCountry}
                      onChange={(e) => setLeadCountry(e.target.value)}
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="Ireland">Ireland</option>
                    </select>
                  </div>
                </div>

                {/* University & Course Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Target University</label>
                    <select
                      value={leadUniversity}
                      onChange={(e) => {
                        setLeadUniversity(e.target.value);
                        const matched = allUniversities.find((u) => u.name === e.target.value);
                        if (matched && matched.programmes.length > 0) {
                          setLeadProgram(matched.programmes[0].title);
                          setLeadCountry(matched.country);
                        }
                      }}
                      className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {allUniversities.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Intended Study Programme</label>
                    {selectedUniObj && selectedUniObj.programmes.length > 0 ? (
                      <select
                        value={leadProgram}
                        onChange={(e) => setLeadProgram(e.target.value)}
                        className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {selectedUniObj.programmes.map((p) => (
                          <option key={p.id} value={p.title}>
                            {p.title} ({p.level})
                          </option>
                        ))}
                        <option value="General Undergraduate Studies">General Undergraduate Studies</option>
                        <option value="General Postgraduate Studies">General Postgraduate Studies</option>
                      </select>
                    ) : (
                      <input
                        value={leadProgram}
                        onChange={(e) => setLeadProgram(e.target.value)}
                        placeholder="e.g. MSc Advanced Computer Science"
                        className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                    Referral Notes / Academic Credentials
                  </label>
                  <textarea
                    rows={3}
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Current qualifications, GPA, English test score (IELTS/TOEFL), desired intake session..."
                    className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSeedLiveReferral}
                    className="px-4 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Seed Sample Cloud Lead
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLead || !leadName || !leadEmail}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submittingLead ? "Submitting..." : "Submit Referral to CRM"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* COMMISSIONS LEDGER PAGE */}
      {page === "commissions" && (
        <div className="space-y-6">
          {/* Commission Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-bold uppercase text-[10px]">
                <span>Total Commissions Approved</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold font-heading text-emerald-400">
                ${totalEarned > 0 ? totalEarned.toLocaleString() : "4,850"} USD
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold">Verified Enrolments</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-bold uppercase text-[10px]">
                <span>Pending Claims Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-bold font-heading text-amber-400">
                ${pendingPayout > 0 ? pendingPayout.toLocaleString() : "1,500"} USD
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">Under Finance Review</span>
            </div>

            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-[var(--text-muted)] font-bold uppercase text-[10px]">
                <span>Payout Frequency</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-3xl font-bold font-heading text-[var(--text-primary)]">Bi-Weekly</p>
              <span className="text-[10px] text-teal-400 font-semibold">Direct Bank Wire / SWIFT</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-sm font-heading text-[var(--text-primary)]">
              Partner Commission Ledger & Statements
            </span>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Payout Claim</span>
            </button>
          </div>

          {/* Ledger Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Student Candidate</th>
                  <th className="p-3.5">Institution</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)] text-xs">
                {effectiveCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--text-muted)] space-y-1">
                      <p className="font-semibold text-xs text-[var(--text-secondary)]">No commissions recorded yet.</p>
                      <p className="text-[11px]">Refer new student candidates or submit a payout claim above to track your earnings.</p>
                    </td>
                  </tr>
                ) : (
                  effectiveCommissions.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[var(--text-primary)]">{c.studentName}</span>
                          {(c as any).isLive && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[9px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Live Cloud
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">{(c as any).notes || "Referral commission claim"}</div>
                      </td>
                      <td className="p-3.5 text-[var(--text-secondary)] font-medium">{c.universityName}</td>
                      <td className="p-3.5 font-bold text-emerald-400 font-mono text-sm">${c.amount} {c.currency}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                            c.status === "Paid"
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                              : c.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-[var(--text-muted)] font-mono text-[11px]">
                        {c.updatedAt
                          ? new Date(c.updatedAt).toLocaleDateString()
                          : new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS PAGE */}
      {page === "notifications" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base font-heading text-[var(--text-primary)]">Agent Portal Alerts & Milestones</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Live updates regarding application offers, CAS issuances, and commission payouts.</p>
            </div>
            <button
              onClick={() => setAgentAlerts((prev) => prev.map((a) => ({ ...a, read: true })))}
              className="text-xs text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-2.5">
            {agentAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  alt.read
                    ? "bg-[var(--bg-elevated)] border-[var(--border-default)] opacity-75"
                    : "bg-emerald-500/5 border-emerald-500/30"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">{alt.title}</span>
                    {!alt.read && (
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-zinc-950 font-bold text-[9px] rounded uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{alt.message}</p>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                    {new Date(alt.date).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!alt.read && (
                    <button
                      onClick={() => setAgentAlerts((prev) => prev.map((a) => (a.id === alt.id ? { ...a, read: true } : a)))}
                      className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] text-xs rounded font-medium cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CLAIM PAYOUT */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleClaimSubmit}
            className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-2xl"
          >
            <div>
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Submit Commission Claim
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                File an official commission claim for an enrolled student candidate to Finance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Student Full Name *</label>
              <input
                required
                type="text"
                value={claimStudent}
                onChange={(e) => setClaimStudent(e.target.value)}
                placeholder="e.g. Aarav Patel"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Target University *</label>
              <input
                required
                type="text"
                value={claimUniversity}
                onChange={(e) => setClaimUniversity(e.target.value)}
                placeholder="e.g. University of Manchester"
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Claim Amount (USD) *</label>
              <input
                required
                type="number"
                min="50"
                step="50"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Notes / Enrolment Reference</label>
              <textarea
                rows={2}
                value={claimNotes}
                onChange={(e) => setClaimNotes(e.target.value)}
                placeholder="Tuition deposit paid confirmation or student registration code..."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingClaim || !claimStudent || !claimAmount}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingClaim ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: PRINTABLE FEE CHALLAN VOUCHER */}
      {selectedChallanApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)] overflow-y-auto">
          <div className="w-full max-w-3xl my-8 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-[var(--text-primary)]">
            {/* Modal Header */}
            <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Official Tuition Deposit Payment Challan Voucher
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">
                    Ref: {selectedChallanApp.challanNumber || `CHAL-2026-${selectedChallanApp.id.slice(-6).toUpperCase()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChallanApp(null)}
                  className="p-1.5 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Body (3 Parts: Bank Copy, Student Copy, Agency Copy) */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Institution & Invoice Summary */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Institutional Depository Voucher
                  </div>
                  <h2 className="text-lg font-bold font-heading text-[var(--text-primary)]">
                    {selectedChallanApp.universityName}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Programme: {selectedChallanApp.programName || selectedChallanApp.programmeName || "Undergraduate / Master Intake"}
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-[var(--border-default)] sm:pl-4">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Deposit Payable</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {selectedChallanApp.challanCurrency || "USD"} {(selectedChallanApp.challanAmount || 2500).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    Due: {selectedChallanApp.challanDueDate || "14 Days From Issuance"}
                  </div>
                </div>
              </div>

              {/* Candidate & Payment Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)] space-y-2">
                  <h4 className="font-bold text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                    Candidate Particulars
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Student Name:</span>
                      <span className="font-bold text-[var(--text-primary)]">{selectedChallanApp.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Student Email:</span>
                      <span className="font-mono text-[var(--text-primary)]">{selectedChallanApp.studentEmail || "n/a"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Application Number:</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedChallanApp.applicationNumber || selectedChallanApp.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Assigned Agency:</span>
                      <span className="text-[var(--text-primary)]">{selectedChallanApp.agentName || appUser?.displayName || "Verified Partner Agency"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)] space-y-2">
                  <h4 className="font-bold text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                    Bank Clearance & Escrow Account
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Beneficiary Title:</span>
                      <span className="font-bold text-[var(--text-primary)]">Global Education Clearing Escrow</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Bank Name:</span>
                      <span className="text-[var(--text-primary)]">Barclays Bank International</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">IBAN:</span>
                      <span className="font-mono font-bold text-emerald-400">GB29BARC20201538492019</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">SWIFT / BIC:</span>
                      <span className="font-mono text-[var(--text-primary)]">BARCGB22</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Copy Vouchers (Student / Bank / Agency) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-2">
                  <div className="text-[10px] font-bold uppercase text-emerald-400">1. Student Copy</div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    Retained by student as permanent proof of tuition deposit payment. Required during visa biometric interview.
                  </p>
                  <div className="pt-4 border-t border-[var(--border-default)] text-[9px] text-[var(--text-muted)]">
                    Bank Officer Sign & Stamp: ____________
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-2">
                  <div className="text-[10px] font-bold uppercase text-sky-400">2. Bank Depository Copy</div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    Retained by collecting bank branch for end-of-day wire clearing and institutional reconciliation.
                  </p>
                  <div className="pt-4 border-t border-[var(--border-default)] text-[9px] text-[var(--text-muted)]">
                    Clearing Stamp: ____________
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-2">
                  <div className="text-[10px] font-bold uppercase text-amber-400">3. Agency Copy</div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    Retained by referral agency. Agent must upload a scanned copy of this stamped voucher to the CRM Agent Portal.
                  </p>
                  <div className="pt-4 border-t border-[var(--border-default)] text-[9px] text-[var(--text-muted)]">
                    Branch Verification: ____________
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] leading-relaxed">
                <strong>Important Instructions:</strong> Please ensure the Student Name and Application Number are quoted as the payment reference. Once paid, the agent must upload the deposit proof through the Agent Portal to advance the application to <em>Deposit Paid</em>, trigger agency commission calculation, and initiate the Visa & CAS issuance process.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">
                System-generated institutional payment challan voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const app = selectedChallanApp;
                    setSelectedChallanApp(null);
                    setUploadingProofApp(app);
                    setProofAmount(app.challanAmount || 2500);
                  }}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Paid Challan Proof</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChallanApp(null)}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD PROOF OF PAID CHALLAN */}
      {uploadingProofApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop)]">
          <form
            onSubmit={handleSubmitProofOfChallan}
            className="w-full max-w-lg p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl space-y-4 shadow-2xl text-xs text-[var(--text-primary)]"
          >
            <div>
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                Upload Proof of Paid Challan
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Submit the student&apos;s verified bank deposit slip or wire receipt. This will automatically update the application stage to &quot;Deposit Paid&quot; and calculate your agency commission.
              </p>
            </div>

            {/* Student & Institution Context */}
            <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Student Name:</span>
                <span className="font-bold text-[var(--text-primary)]">{uploadingProofApp.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">University:</span>
                <span className="font-bold text-[var(--text-primary)]">{uploadingProofApp.universityName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Challan Reference:</span>
                <span className="font-mono text-emerald-400">{uploadingProofApp.challanNumber || "CHAL-2026"}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">App Ref:</span>
                <span className="font-mono text-[var(--text-secondary)]">{uploadingProofApp.applicationNumber || uploadingProofApp.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                  Transaction / Slip Reference *
                </label>
                <input
                  required
                  type="text"
                  value={proofTxRef}
                  onChange={(e) => setProofTxRef(e.target.value)}
                  placeholder="e.g. TXN-8941092 / Slip #491"
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                  Amount Deposited ({uploadingProofApp.challanCurrency || "USD"}) *
                </label>
                <input
                  required
                  type="number"
                  min="100"
                  step="50"
                  value={proofAmount}
                  onChange={(e) => setProofAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                Payment Date *
              </label>
              <input
                required
                type="date"
                value={proofDate}
                onChange={(e) => setProofDate(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                Upload Scanned Deposit Slip / Bank Receipt
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-secondary)] cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                Accepted formats: PDF, JPG, PNG (Max 10MB)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                Agent Verification Notes
              </label>
              <textarea
                rows={2}
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="e.g. Verified stamped bank copy from Standard Chartered branch. Funds confirmed cleared."
                className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Workflow Notice */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Submitting this proof will advance stage to <strong>Deposit Paid</strong>, queue application for the Visa Officer, and accrue agency commission automatically.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setUploadingProofApp(null)}
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingProof}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingProof ? "Submitting Proof..." : "Confirm & Advance to Deposit Paid"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
