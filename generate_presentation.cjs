const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "EduCRM Team";
pres.company = "EduCRM Enterprise";
pres.title = "EduCRM — End-to-End System & Demo Flow Walkthrough";

// Color Palette Tokens
const BG_DARK = "0D1117";
const CARD_BG = "161B22";
const CARD_BORDER = "30363D";
const EMERALD = "10B981";
const TEAL = "14B8A6";
const CYAN = "06B6D4";
const AMBER = "F59E0B";
const PURPLE = "A855F7";
const TEXT_WHITE = "FFFFFF";
const TEXT_MUTED = "8B949E";

function addHeader(slide, title, subtitle, category = "EDUCRM SYSTEM WALKTHROUGH") {
  // Category Pill
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 0.5,
    w: 3.2,
    h: 0.35,
    fill: { color: "10B981", transparency: 85 },
    line: { color: EMERALD, width: 1 },
    rectRadius: 0.08
  });
  slide.addText(category, {
    x: 0.8,
    y: 0.5,
    w: 3.2,
    h: 0.35,
    fontSize: 9,
    bold: true,
    color: EMERALD,
    align: "center",
    valign: "middle"
  });

  // Title & Subtitle
  slide.addText(title, {
    x: 0.8,
    y: 0.95,
    w: 11.5,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: TEXT_WHITE,
    fontFace: "Arial"
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8,
      y: 1.5,
      w: 11.5,
      h: 0.4,
      fontSize: 12,
      color: TEXT_MUTED,
      fontFace: "Arial"
    });
  }
}

// ==========================================
// SLIDE 1: Title Slide
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  // Decorative Accent Bar
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.8,
    w: 0.15,
    h: 3.2,
    fill: { color: EMERALD }
  });

  slide.addText("EduCRM", {
    x: 1.2,
    y: 1.8,
    w: 10,
    h: 0.9,
    fontSize: 44,
    bold: true,
    color: TEXT_WHITE,
    fontFace: "Arial"
  });

  slide.addText("Enterprise Education Management Platform", {
    x: 1.2,
    y: 2.7,
    w: 10,
    h: 0.6,
    fontSize: 20,
    color: EMERALD,
    bold: true,
    fontFace: "Arial"
  });

  slide.addText("Complete End-to-End System Demo Flow & Role Architecture Walkthrough\n14 Dedicated User Roles • 5 Gemini 2.0 Flash AI Tools • Real-Time Firestore Engine", {
    x: 1.2,
    y: 3.4,
    w: 10.5,
    h: 0.9,
    fontSize: 14,
    color: TEXT_MUTED,
    fontFace: "Arial"
  });

  // Highlights Card
  slide.addShape(pres.ShapeType.rect, {
    x: 1.2,
    y: 4.6,
    w: 10.5,
    h: 1.5,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 },
    rectRadius: 0.1
  });

  slide.addText("🌐 Live Production URL: https://education-crm-9fee2.web.app\n🚀 Presentation Mode: 1-Click Role Quick-Access • Dynamic Demo Data Toggle (Show/Hide)\n⚡ Database: Live Cloud Firestore Real-Time Synchronized Engine", {
    x: 1.5,
    y: 4.8,
    w: 9.8,
    h: 1.1,
    fontSize: 12,
    color: TEXT_WHITE,
    bold: false,
    fontFace: "Arial"
  });
}

// ==========================================
// SLIDE 2: Executive Overview
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Executive Overview: What is EduCRM?", "A unified, multi-tenant digital ecosystem powering international education agencies & universities.");

  const cards = [
    { title: "14 User Roles", desc: "Dedicated portals for Counsellors, Team Leaders, Admissions, Visa, Finance, Students, Agents, Universities & Auditors.", color: EMERALD },
    { title: "Gemini 2.0 AI Suite", desc: "Built-in AI Course Matcher, SOP Drafter, Visa Risk Calculator, Document OCR Extractor & Readiness Auditor.", color: CYAN },
    { title: "Dynamic Demo Engine", desc: "Instant Topbar toggle to switch seamlessly between rich pre-seeded data and clean live Firestore state.", color: AMBER },
    { title: "Enterprise Compliance", desc: "Immutable audit logging, multi-branch scoping, GDPR privacy export & multi-tenant isolation.", color: PURPLE }
  ];

  cards.forEach((c, idx) => {
    const x = 0.8 + idx * 2.95;
    slide.addShape(pres.ShapeType.rect, {
      x,
      y: 2.1,
      w: 2.75,
      h: 4.5,
      fill: { color: CARD_BG },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.1
    });

    slide.addText(c.title, {
      x: x + 0.2,
      y: 2.4,
      w: 2.35,
      h: 0.6,
      fontSize: 16,
      bold: true,
      color: c.color,
      fontFace: "Arial"
    });

    slide.addText(c.desc, {
      x: x + 0.2,
      y: 3.1,
      w: 2.35,
      h: 3.2,
      fontSize: 12,
      color: TEXT_MUTED,
      fontFace: "Arial"
    });
  });
}

// ==========================================
// SLIDE 3: The Demo Narrative & Flow
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "The Presentation Flow: Student Lifecycle Story", "Demonstrating the entire CRM through a coherent student journey: 'Aarav Patel'.");

  const steps = [
    { step: "Act 1", title: "Agent Capture", desc: "External Recruiter submits student referral & tracks commission.", role: "External Agent" },
    { step: "Act 2", title: "Counselling & AI", desc: "Lead scoring, Gemini Course Matcher & instant SOP drafter.", role: "Counsellor" },
    { step: "Act 3", title: "Team Leadership", desc: "Conversion funnels, caseload balancing & lead reallocation.", role: "Team Leader" },
    { step: "Act 4", title: "Admissions & Uni", desc: "Credential QA, 1-click app cloner & direct university decision.", role: "Admissions & University" },
    { step: "Act 5", title: "Student Experience", desc: "Self-service application tracking, document vault & profile edit.", role: "Student Portal" },
    { step: "Act 6", title: "Visa & Finance", desc: "AI Visa Probability tool, tuition invoices, receipts & payouts.", role: "Visa & Finance Officers" },
    { step: "Act 7", title: "Support & Audit", desc: "Helpdesk resolution, tamper-proof audit trails & GDPR export.", role: "Support & Auditor" }
  ];

  steps.forEach((s, idx) => {
    const y = 2.1 + idx * 0.68;
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y,
      w: 11.5,
      h: 0.58,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 },
      rectRadius: 0.08
    });

    slide.addText(s.step, { x: 1.0, y, w: 1.0, h: 0.58, fontSize: 11, bold: true, color: EMERALD, valign: "middle" });
    slide.addText(s.title, { x: 2.1, y, w: 2.2, h: 0.58, fontSize: 12, bold: true, color: TEXT_WHITE, valign: "middle" });
    slide.addText(s.desc, { x: 4.4, y, w: 5.2, h: 0.58, fontSize: 11, color: TEXT_MUTED, valign: "middle" });
    slide.addText(s.role, { x: 9.7, y, w: 2.4, h: 0.58, fontSize: 10, bold: true, color: CYAN, align: "right", valign: "middle" });
  });
}

// ==========================================
// SLIDE 4: Act 1 - External Agent Portal
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 1: External Agent Portal", "Role: external_agent • Route: /agent/dashboard", "ACT 1: LEAD INGESTION");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });

  slide.addText("Key Capabilities & UI Highlights", { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: EMERALD });
  slide.addText("• Branded Self-Service Portal for Global Recruiters\n• Unique Agent Referral Tracking Link generator\n• Multi-Tier Sub-Agent Hierarchy & Management\n• Real-Time Commission Ledger & Payout Transparency\n• Direct Student Dossier Lodgement into Agency Pipeline", {
    x: 1.1, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_WHITE, lineSpacing: 24
  });

  slide.addText("Live Demo Speaking Points", { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: CYAN });
  slide.addText("1. Click 'Agent' on Login page ➔ Show live metrics ($4,850 commission, 12 referred students).\n2. Click 'Copy Referral Link' to demonstrate seamless multi-channel prospect acquisition.\n3. Show how referrals immediately synchronize into the central counsellor queue without manual data entry.", {
    x: 7.0, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_MUTED, lineSpacing: 22
  });
}

// ==========================================
// SLIDE 5: Act 2 - Counsellor & Gemini AI Suite
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 2: Counselling & Gemini AI Suite", "Role: counsellor • Route: /counsellor/dashboard & /leads", "ACT 2: COUNSELLING & AI");

  const aiTools = [
    { name: "AI Course Matcher", desc: "Matches GPA, budget & destination against global catalog with 0-100% score." },
    { name: "AI Personal Statement Drafter", desc: "Generates 500-word university-ready Statement of Purpose in 2 seconds." },
    { name: "Document OCR Extractor", desc: "Vision AI extracts transcripts/passports & creates student profiles automatically." },
    { name: "Lead Scoring & Deduplication", desc: "Algorithmic engagement scoring & automatic duplicate cluster detection." }
  ];

  aiTools.forEach((tool, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 5.9;
    const y = 2.1 + row * 2.3;

    slide.addShape(pres.ShapeType.rect, { x, y, w: 5.6, h: 2.1, fill: { color: CARD_BG }, line: { color: EMERALD, width: 1 }, rectRadius: 0.1 });
    slide.addText(tool.name, { x: x + 0.3, y: y + 0.25, w: 5.0, h: 0.35, fontSize: 14, bold: true, color: TEXT_WHITE });
    slide.addText(tool.desc, { x: x + 0.3, y: y + 0.65, w: 5.0, h: 1.2, fontSize: 11, color: TEXT_MUTED });
  });
}

// ==========================================
// SLIDE 6: Act 3 - Team Leader Operations
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 3: Team Leader Operations & Workload", "Role: team_leader • Route: /team-leader/dashboard", "ACT 3: OPERATIONS & SLA");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });

  slide.addText("Operational Capabilities", { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: AMBER });
  slide.addText("• Real-Time Conversion Funnel Analytics\n• Counsellor Caseload & Workload Heatmap\n• 1-Click Application Reallocation (`/team-leader/applications`)\n• Branch SLA & Lead Response Time Monitoring\n• Team Performance Scorecards & Conversion Rankings", {
    x: 1.1, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_WHITE, lineSpacing: 24
  });

  slide.addText("Demo Highlight Flow", { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: CYAN });
  slide.addText("1. Show Team Leader Dashboard with live metrics across Americas & London branches.\n2. Open Application Allocation table ➔ Assign pending application to David Kim.\n3. Show how workload charts update optimistically and persist in Firestore.", {
    x: 7.0, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_MUTED, lineSpacing: 22
  });
}

// ==========================================
// SLIDE 7: Act 4 - Admissions & University Partner
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 4: Admissions & University Partner Decisioning", "Roles: admissions_officer & university_partner • Routes: /admissions & /university", "ACT 4: ADMISSIONS & OFFERS");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });

  slide.addText("Admissions Officer Desk", { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: EMERALD });
  slide.addText("• Academic Credential & Transcript Verification\n• Document QA Status (Verified, Pending, Rejected)\n• Offer Condition Management (Conditional / Unconditional)\n• 1-Click Application Cloner for backup institution submissions", {
    x: 1.1, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_WHITE, lineSpacing: 24
  });

  slide.addText("University Partner Portal", { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: CYAN });
  slide.addText("• Direct Institutional Portal for partner universities\n• Review international cohort dossiers in real-time\n• Issue CAS / I-20 documentation directly on the platform\n• Synchronized status updates eliminating email bottlenecks", {
    x: 7.0, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_WHITE, lineSpacing: 24
  });
}

// ==========================================
// SLIDE 8: Act 5 - Student Self-Service Portal
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 5: Student Self-Service Experience", "Role: student • Route: /student/dashboard & /student/profile", "ACT 5: STUDENT EXPERIENCE");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });

  slide.addText("Student Portal Features", { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: CYAN });
  slide.addText("• Visual Application Milestone Tracker (Lodged ➔ Offer ➔ Visa)\n• Mobile-Ready Document Upload Vault (Passport, IELTS, Diplomas)\n• Self-Service Profile & Academic History Editor\n• Direct Support Request & Query System", {
    x: 1.1, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_WHITE, lineSpacing: 24
  });

  slide.addText("Key Business Value", { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: EMERALD });
  slide.addText("1. Complete transparency over admission progress reduces student anxiety.\n2. Eliminates 70% of repetitive status-inquiry calls to counsellors.\n3. Allows students to submit missing documents directly from any device 24/7.", {
    x: 7.0, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_MUTED, lineSpacing: 22
  });
}

// ==========================================
// SLIDE 9: Act 6 - Visa Processing & AI Risk Calculator
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 6: Visa Processing & Risk Analytics", "Role: visa_officer • Route: /visa-officer/dashboard", "ACT 6: VISA & COMPLIANCE");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });

  slide.addText("Visa Officer Workspace", { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: AMBER });
  slide.addText("• Embassy Case Dossier Tracking (UK Tier 4, Canada SDS, USA F-1)\n• CAS / I-20 Verification & Biometric Appointment Scheduling\n• Financial Proof & Liquid Fund Adequacy Checks\n• Mock Interview Task Allocation", {
    x: 1.1, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_WHITE, lineSpacing: 24
  });

  slide.addText("Gemini Visa Risk Engine", { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: PURPLE });
  slide.addText("• Analyzes study gaps, English test scores, and financial backing.\n• Outputs quantifiable Approval Probability Percentage (0-100%).\n• Provides tailored Risk Mitigation Checklist before embassy submission to prevent costly visa refusals.", {
    x: 7.0, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_MUTED, lineSpacing: 22
  });
}

// ==========================================
// SLIDE 10: Act 7 - Financial Management & Invoicing
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 7: Financial Management & Invoicing", "Role: finance_officer • Route: /finance/dashboard", "ACT 7: FINANCE & COMMISSIONS");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 2.1, w: 5.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.1 });

  slide.addText("Financial Operations", { x: 1.1, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: EMERALD });
  slide.addText("• Multi-Currency Receivables & Tuition Invoicing (GBP, USD, AUD)\n• 1-Click Printable PDF Invoices & Branded Payment Receipts\n• Payment Gateway / Wire Transfer Reconciliation\n• Refund Processing & Approval Workflow", {
    x: 1.1, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_WHITE, lineSpacing: 24
  });

  slide.addText("Agent Commission Settlement", { x: 7.0, y: 2.3, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: CYAN });
  slide.addText("• Automated Commission Calculation linked to enrolled students.\n• Status lifecycle: Eligible ➔ Approved ➔ Paid ➔ Statement Generated.\n• Full accounting export (CSV / Print) for external bookkeeping.", {
    x: 7.0, y: 2.8, w: 5.0, h: 3.6, fontSize: 12, color: TEXT_MUTED, lineSpacing: 22
  });
}

// ==========================================
// SLIDE 11: Act 8 & 9 - Governance, Audit & Super Admin
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Act 8 & 9: Governance, Audit & Multi-Tenancy", "Roles: auditor, org_admin, platform_super_admin", "ACT 8 & 9: GOVERNANCE & AUDIT");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 3.6, h: 4.6, fill: { color: CARD_BG }, line: { color: EMERALD, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 4.75, y: 2.1, w: 3.6, h: 4.6, fill: { color: CARD_BG }, line: { color: CYAN, width: 1 }, rectRadius: 0.1 });
  slide.addShape(pres.ShapeType.rect, { x: 8.7, y: 2.1, w: 3.6, h: 4.6, fill: { color: CARD_BG }, line: { color: PURPLE, width: 1 }, rectRadius: 0.1 });

  slide.addText("Auditor & Compliance", { x: 1.0, y: 2.3, w: 3.2, h: 0.4, fontSize: 13, bold: true, color: EMERALD });
  slide.addText("• Immutable Audit Trail (`/auditor/audit-trail`)\n• Append-only event logger\n• Compliance Health Metrics\n• Flag non-compliant dossiers", {
    x: 1.0, y: 2.8, w: 3.2, h: 3.6, fontSize: 11, color: TEXT_WHITE, lineSpacing: 20
  });

  slide.addText("Org Admin & Rules", { x: 4.95, y: 2.3, w: 3.2, h: 0.4, fontSize: 13, bold: true, color: CYAN });
  slide.addText("• Master Data (`/master-data`)\n• Automated Lead Routing\n• SLA Workflow Triggers\n• Multi-Branch Switcher", {
    x: 4.95, y: 2.8, w: 3.2, h: 3.6, fontSize: 11, color: TEXT_WHITE, lineSpacing: 20
  });

  slide.addText("Platform Super Admin", { x: 8.9, y: 2.3, w: 3.2, h: 0.4, fontSize: 13, bold: true, color: PURPLE });
  slide.addText("• Multi-Tenant Management\n• Subscription Tier Controls\n• GDPR JSON Data Export\n• Right-to-be-Forgotten purge", {
    x: 8.9, y: 2.8, w: 3.2, h: 3.6, fontSize: 11, color: TEXT_WHITE, lineSpacing: 20
  });
}

// ==========================================
// SLIDE 12: Summary & Reference Matrix
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "1-Page Demo Reference Card", "Quick cheat-sheet for running the demo smoothly tomorrow.");

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.1, w: 11.5, h: 4.6, fill: { color: CARD_BG }, line: { color: EMERALD, width: 1.5 }, rectRadius: 0.1 });

  slide.addText("Live Presentation URL: https://education-crm-9fee2.web.app\nGitHub Repository: https://github.com/MujtabaZaheer/CRM.git", {
    x: 1.1, y: 2.3, w: 10.9, h: 0.6, fontSize: 13, bold: true, color: EMERALD
  });

  const tips = [
    "1. Start with Demo Data ON to show fully populated analytics charts and queues across all departments.",
    "2. Toggle 'Demo Data: ON' to 'Live Only' in the top bar if asked to show clean live data or start from scratch.",
    "3. Use the Login Page 'Role Quick-Access' buttons to switch instantly between any of the 14 roles.",
    "4. Test the Gemini AI Vision Extractor with the sample transcript at /sample_transcript.jpg.",
    "5. Every create, edit, and status change persists in real-time to Google Cloud Firestore."
  ];

  slide.addText(tips.join("\n\n"), {
    x: 1.1, y: 3.1, w: 10.9, h: 3.3, fontSize: 12, color: TEXT_WHITE, lineSpacing: 18
  });
}

const outputPath = path.join(__dirname, "EduCRM_Master_Demo_Flow.pptx");
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log(`Presentation generated successfully at: ${outputPath}`);
});
