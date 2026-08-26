const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "EduCRM Architecture & Compliance Team";
pres.company = "EduCRM Enterprise";
pres.title = "EduCRM — Comprehensive Master Specification & System Flow Presentation";

// Color Palette Tokens
const BG_DARK = "090D16";
const CARD_BG = "121824";
const CARD_BORDER = "1F293D";
const EMERALD = "10B981";
const TEAL = "14B8A6";
const CYAN = "06B6D4";
const AMBER = "F59E0B";
const PURPLE = "A855F7";
const ROSE = "F43F5E";
const TEXT_WHITE = "FFFFFF";
const TEXT_MUTED = "94A3B8";

function addHeader(slide, title, subtitle, sectionTag = "SPECIFICATION & ARCHITECTURE") {
  // Category Pill
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 0.4,
    w: 3.5,
    h: 0.32,
    fill: { color: "10B981", transparency: 85 },
    line: { color: EMERALD, width: 1 },
    rectRadius: 0.06
  });
  slide.addText(sectionTag, {
    x: 0.8,
    y: 0.4,
    w: 3.5,
    h: 0.32,
    fontSize: 8.5,
    bold: true,
    color: EMERALD,
    align: "center",
    valign: "middle"
  });

  // Title
  slide.addText(title, {
    x: 0.8,
    y: 0.82,
    w: 11.5,
    h: 0.55,
    fontSize: 20,
    bold: true,
    color: TEXT_WHITE,
    fontFace: "Arial"
  });

  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8,
      y: 1.35,
      w: 11.5,
      h: 0.35,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: "Arial"
    });
  }
}

function add2CardLayout(slide, leftTitle, leftItems, rightTitle, rightItems, leftColor = EMERALD, rightColor = CYAN) {
  // Left Card
  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 1.85, w: 5.6, h: 4.85, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08 });
  slide.addText(leftTitle, { x: 1.1, y: 2.05, w: 5.0, h: 0.4, fontSize: 13, bold: true, color: leftColor });
  slide.addText(leftItems, { x: 1.1, y: 2.5, w: 5.0, h: 4.0, fontSize: 10.5, color: TEXT_WHITE, lineSpacing: 18 });

  // Right Card
  slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 1.85, w: 5.6, h: 4.85, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08 });
  slide.addText(rightTitle, { x: 7.0, y: 2.05, w: 5.0, h: 0.4, fontSize: 13, bold: true, color: rightColor });
  slide.addText(rightItems, { x: 7.0, y: 2.5, w: 5.0, h: 4.0, fontSize: 10.5, color: TEXT_WHITE, lineSpacing: 18 });
}

function add3CardLayout(slide, cards) {
  cards.forEach((c, idx) => {
    const x = 0.8 + idx * 3.95;
    slide.addShape(pres.ShapeType.rect, { x, y: 1.85, w: 3.65, h: 4.85, fill: { color: CARD_BG }, line: { color: c.color || CARD_BORDER, width: 1 }, rectRadius: 0.08 });
    slide.addText(c.title, { x: x + 0.25, y: 2.05, w: 3.15, h: 0.4, fontSize: 12.5, bold: true, color: c.color || EMERALD });
    slide.addText(c.items, { x: x + 0.25, y: 2.5, w: 3.15, h: 4.0, fontSize: 10, color: TEXT_WHITE, lineSpacing: 17 });
  });
}

function add4CardLayout(slide, cards) {
  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 5.9;
    const y = 1.85 + row * 2.45;

    slide.addShape(pres.ShapeType.rect, { x, y, w: 5.6, h: 2.3, fill: { color: CARD_BG }, line: { color: c.color || CARD_BORDER, width: 1 }, rectRadius: 0.08 });
    slide.addText(c.title, { x: x + 0.3, y: y + 0.2, w: 5.0, h: 0.35, fontSize: 13, bold: true, color: c.color || EMERALD });
    slide.addText(c.items, { x: x + 0.3, y: y + 0.6, w: 5.0, h: 1.55, fontSize: 10, color: TEXT_WHITE, lineSpacing: 16 });
  });
}

// ==========================================
// 1. TITLE SLIDE
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 1.6, w: 0.15, h: 3.6, fill: { color: EMERALD } });
  slide.addText("EduCRM Master Platform Specification", { x: 1.2, y: 1.6, w: 10.5, h: 0.8, fontSize: 36, bold: true, color: TEXT_WHITE, fontFace: "Arial" });
  slide.addText("Comprehensive Multi-Tenant Architecture & End-to-End System Flow", { x: 1.2, y: 2.45, w: 10.5, h: 0.5, fontSize: 18, color: EMERALD, bold: true, fontFace: "Arial" });
  slide.addText("Complete PDF Requirements Mapping (§3.1 - §3.27 & §4.1 - §4.15)\n14 Dedicated User Roles • 5 Active Gemini AI Engines • Real-Time Firestore Synchronization", { x: 1.2, y: 3.05, w: 10.5, h: 0.8, fontSize: 13, color: TEXT_MUTED, fontFace: "Arial" });

  slide.addShape(pres.ShapeType.rect, { x: 1.2, y: 4.2, w: 10.5, h: 1.9, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08 });
  slide.addText("🌐 Live Web App: https://education-crm-9fee2.web.app\n🐙 GitHub Repository: https://github.com/MujtabaZaheer/CRM.git (main)\n⚡ Features: Dynamic Demo Toggle (Show/Hide Sample Data) • 1-Click Role Quick-Access • Google Drive OCR Storage", {
    x: 1.5, y: 4.4, w: 9.9, h: 1.5, fontSize: 11.5, color: TEXT_WHITE, lineSpacing: 20, fontFace: "Arial"
  });
}

// ==========================================
// 2. SYSTEM OBJECTIVES (§1)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "1. System Objectives & Core Mission", "Strategic vision and core capabilities defined in Section 1 of the specification.", "SECTION 1: SYSTEM OBJECTIVES");

  add2CardLayout(slide,
    "Core Functional Objectives",
    "• Capture & manage prospective-student leads from multiple channels.\n• Convert qualified leads into university applications seamlessly.\n• Track applications through multi-stage configurable workflows.\n• Manage student documents with strict regulatory and KYC compliance.\n• Maintain university, campus, programme, intake, fee & eligibility catalog.\n• Coordinate work among counsellors, agents, branch offices & teams.",
    "Intelligence & Enterprise Capabilities",
    "• Omnichannel communication: Email, WhatsApp, SMS & internal messaging.\n• Gemini 2.0 AI Suite: Course matching, SOP drafting, OCR & visa risk.\n• Financial oversight: Invoicing, payments, refunds & agent commissions.\n• Advanced Analytics: Operational, financial, funnel & conversion reports.\n• Security & Governance: RBAC, GDPR privacy center & immutable audit logs.",
    EMERALD, CYAN
  );
}

// ==========================================
// 3. 14 USER ROLES MATRIX (§2)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "2. User Roles & Responsibilities Matrix", "Complete mapping of all 14 configurable user roles (§2 of specification).", "SECTION 2: 14 USER ROLES");

  const roles = [
    { title: "Governance & Admin", color: PURPLE, items: "• Platform Super Admin: Multi-tenant, subscriptions & health.\n• Org Admin: Office setups, master data, workflows & roles.\n• Office Manager: Branch operations, counsellor workload.\n• Auditor / Read-Only: Immutable audit inspection & logs." },
    { title: "Operations & Processing", color: EMERALD, items: "• Team Leader: Application allocation, SLAs & team KPIs.\n• Counsellor: Lead conversion, student profiles & AI matching.\n• Admissions Officer: Document verification & offer decisions.\n• Compliance Officer: Regulatory, KYC & financial verification." },
    { title: "External & Partner Portals", color: CYAN, items: "• External Agent: Sub-agents, referrals & commission ledger.\n• University Partner: Cohort review & direct admissions decisions.\n• Student / Applicant: Milestone tracker, doc vault & profile edit.\n• Support User: Helpdesk ticketing, knowledge base & SLAs." }
  ];
  add3CardLayout(slide, roles);
}

// ==========================================
// 4. AUTHENTICATION & MULTI-TENANCY (§3.1 - §3.2)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.1 - 3.2 Authentication & Multi-Tenant Architecture", "Enterprise identity management, SSO, and strict organizational isolation.", "SECTION 3.1 & 3.2: AUTH & TENANCY");

  add2CardLayout(slide,
    "§3.1 Authentication & Security Controls",
    "• Multi-Channel Registration: Staff invitation, agent onboarding, student signup.\n• Multi-Provider Auth: Email/Password, Google, Microsoft, Organization SSO.\n• Multi-Factor Authentication (MFA) & configurable password complexity.\n• Session Management: Device history, IP tracking, automatic session timeout.\n• Account Lockout: Brute-force protection with configurable failed attempt limit.\n• Super Admin Impersonation: Authorized user impersonation with audit trails.",
    "§3.2 Multi-Tenant Organization Structure",
    "• Logical Tenant Isolation: Isolated users, leads, applications, documents & settings.\n• Multi-Branch Hierarchy: Branch offices (London, Manchester, Delhi, Sydney).\n• Per-Tenant Customization: Name, logo, custom domain/subdomain, theme.\n• Localization Tokens: Timezone, currency (USD, GBP, AUD, EUR), date formats.\n• Business Rules: Custom working hours, public holidays & academic cycles.\n• Subscription Controls: User seats, storage quotas & Gemini AI credits.",
    EMERALD, AMBER
  );
}

// ==========================================
// 5. RBAC & DASHBOARD ANALYTICS (§3.3 - §3.4)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.3 - 3.4 Granular RBAC & Analytics Engine", "Fine-grained permission matrices and comprehensive business intelligence dashboards.", "SECTION 3.3 & 3.4: RBAC & ANALYTICS");

  add2CardLayout(slide,
    "§3.3 Granular Access Control (RBAC)",
    "• 5-Level Permissions: Module, Screen, Record, Field & Action level permissions.\n• Scoped Constraints: Restrict users to assigned office, team, countries or universities.\n• Approval Gates: Dual-control approval required for sensitive overrides.\n• Time-Bound Access: Temporary role grants with automated expiration dates.\n• Segregation of Duties (SoD): Prevents counsellors from approving own commissions.\n• Audit Trail: Every permission and role change logged permanently in Firestore.",
    "§3.4 Real-Time Analytics & Dashboards",
    "• Core Funnel KPIs: Fresh leads, active apps, pending docs, offers & enrolments.\n• Conversion Percentages: Lead-to-application and offer-to-enrolment ratios.\n• Workload & Ageing: Counsellor caseload heatmap & application turnaround time.\n• Dimensional Breakdowns: By country, university, intake, lead source & office.\n• Interactive Capabilities: Multi-filter slicing, metric drill-down & CSV exports.\n• Anomaly Alerts: Instant notifications on conversion drops or missed SLA targets.",
    PURPLE, CYAN
  );
}

// ==========================================
// 6. LEAD MANAGEMENT & SCORING (§3.5)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.5 Lead Ingestion, Scoring & Auto-Routing", "Omnichannel lead capture with algorithmic scoring and automated duplicate detection.", "SECTION 3.5: LEAD MANAGEMENT");

  add2CardLayout(slide,
    "Lead Capture & Deduplication Engine",
    "• Omnichannel Ingestion: Web forms, Facebook/IG ads, Google Ads, CSV, WhatsApp, API.\n• Comprehensive Lead Dossier: Contact, nationality, residence, budget, intake, interest.\n• Algorithmic Duplicate Detection: Multi-field fuzzy clustering (Email, Phone, Passport).\n• 1-Click Cluster Merge: Consolidates duplicate inquiries into a single master lead.\n• Complete Activity History: Logs every phone call, WhatsApp, email, meeting & note.",
    "Lead Pipeline & Automated Routing",
    "• Configurable Pipeline Stages: New ➔ Contacted ➔ Qualified ➔ Counselling ➔ Converted.\n• Engagement Lead Scoring: Real-time calculation based on profile & activity frequency.\n• Intelligent Lead Router: Workload-balanced, round-robin, geographic & program routing.\n• Lost Lead Governance: Categorized lost reasons (Budget, Visa Refusal, Competitor).\n• Bulk Operations: Mass counsellor reassignment, tagging, archiving & communications.",
    EMERALD, AMBER
  );
}

// ==========================================
// 7. STUDENT PROFILE & 360° DOSSIER (§3.6)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.6 Student & Applicant 360° Profile", "Comprehensive applicant repository with dynamic completeness scoring.", "SECTION 3.6: STUDENT PROFILE");

  const cards = [
    { title: "Personal & Academic History", color: EMERALD, items: "• Legal & preferred name, DOB, gender, nationality, passport details.\n• Emergency contact, disability & accessibility accommodations.\n• Institution history, GPA/Grades, graduation year, backlogs & gap explanations." },
    { title: "English & Employment", color: CYAN, items: "• Standardized Tests: IELTS, PTE, TOEFL, Duolingo, MOI evidence.\n• Test dates, component band scores (L/R/W/S), overall score & TRF numbers.\n• Work history: Employer, designation, duration, salary & gap justification." },
    { title: "Financial & Declarations", color: AMBER, items: "• Financial Sponsor: Name, relationship, annual income, liquid funds & bank proof.\n• Declarations: Previous visa refusals, immigration history, criminal declarations.\n• Dynamic Profile Completeness: Real-time 0-100% calculation identifying missing data." }
  ];
  add3CardLayout(slide, cards);
}

// ==========================================
// 8. APPLICATION & WORKFLOW ENGINE (§3.7 - §3.8)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.7 - 3.8 Application Lifecycle & Workflow Engine", "Multi-application support, stage transitions, and automated SLA rules.", "SECTION 3.7 & 3.8: APPLICATION WORKFLOW");

  add2CardLayout(slide,
    "§3.7 Application Management",
    "• Multi-Application Architecture: 1 student profile links to multiple university apps.\n• Unique Identifiers: Auto-generated sequential tracking numbers (`APP-2026-XXXX`).\n• Deep Linking: Mapped to Student, University, Campus, Programme & Intake Season.\n• 1-Click Application Cloner: Duplicate applications across backup universities.\n• Offer Management: Conditional, Unconditional, CAS Issued, Enrolled, Withdrawn, Rejected.",
    "§3.8 Configurable Workflow Engine",
    "• Configurable Stage Pipelines: Custom stages per country or partner institution.\n• Automated Stage Triggers: Auto-creates tasks, sends student emails on stage change.\n• SLA Turnaround Monitoring: Warning alerts on stalled applications exceeding SLA.\n• Stage Transition Conditions: Blocks stage progression if mandatory docs are missing.\n• Comprehensive Audit Log: Every status transition records timestamp, actor & notes.",
    EMERALD, PURPLE
  );
}

// ==========================================
// 9. DOCUMENT MANAGEMENT & VERIFICATION (§3.9)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.9 Document Vault, OCR & QA Verification", "Secure multi-format repository with Gemini Vision OCR and verification workflows.", "SECTION 3.9: DOCUMENT MANAGEMENT");

  add2CardLayout(slide,
    "Document Vault & Storage",
    "• Categorized Taxonomy: Passports, Transcripts, Degree Certificates, IELTS, Financials.\n• Multi-Format Support: PDF, JPG, PNG with secure cloud storage integration.\n• Version Control: Tracks document replacements, resubmissions & expiry dates.\n• Missing Document Checker: Highlights outstanding mandatory items per program.\n• Watermarking & Security: Download permission enforcement and tamper prevention.",
    "QA Verification & Vision OCR",
    "• Verification Workflow: Status tracking (Pending ➔ Verified ➔ Rejected with feedback).\n• Gemini Vision OCR Extractor: Parses transcripts and identity docs automatically.\n• Metadata Extraction: Reads Name, DOB, GPA, Degree & Institution into profile fields.\n• Rejection Reason Templates: Instant feedback to students on illegible/invalid files.\n• Audit Trail: Logs which admissions officer verified each document and when.",
    CYAN, EMERALD
  );
}

// ==========================================
// 10. UNIVERSITY DATABASE & MATCHER (§3.10 - §3.11)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.10 - 3.11 University Database & Eligibility Matcher", "Global course catalog with Gemini AI recommendation and filtering engine.", "SECTION 3.10 & 3.11: UNIVERSITY & MATCHER");

  add2CardLayout(slide,
    "§3.10 University & Programme Catalog",
    "• Global Directory: Partner institutions across UK, USA, Canada, Australia & Europe.\n• Campus & Programme Database: Undergraduate, Postgraduate, Diploma & PhD courses.\n• Rich Metadata: Annual tuition fees, currency, duration, intake months & deadlines.\n• Entry Criteria: Minimum GPA, academic requirements, backlogs allowed & work exp.\n• English Language Criteria: Minimum overall IELTS/PTE and individual band cutoffs.",
    "§3.11 Gemini AI Course Matcher",
    "• Multi-Criteria Matching: Evaluates student GPA, English score, budget & destination.\n• Ranked Recommendations: Outputs top matched courses with quantifiable match %.\n• Admission Likelihood Categorization: Flags courses as High, Medium, or Reach.\n• Rationale Breakdown: Explains why each course matches the applicant's profile.\n• 1-Click Application Drafting: Initiates university application directly from recommendation.",
    EMERALD, PURPLE
  );
}

// ==========================================
// 11. COUNSELLOR WORKSPACE & TASKS (§3.12)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.12 Counsellor Workspace & Task Management", "Dedicated portal for frontline student engagement, reminders, and daily workflows.", "SECTION 3.12: COUNSELLOR WORKSPACE");

  add2CardLayout(slide,
    "Counsellor Portal Capabilities",
    "• My Assigned Leads & Students: Scoped queues showing active student cases.\n• Interaction Logging: 1-click logging of phone calls, WhatsApp chats, emails & notes.\n• Pipeline Management: Move leads through stages with reason capture for lost leads.\n• Student Conversion: 1-click transition of qualified leads to formal student profiles.\n• Document Upload: Direct document attachment on behalf of students during counselling.",
    "Task Management & Calendar",
    "• Task Queue: Filter by priority (Urgent, High, Medium, Low) and due date.\n• Linked Entities: Tasks link directly to Students, Leads, or Applications.\n• Recurring Tasks: Automated follow-up task generation based on lead stage.\n• Calendar Sync: Schedule counselling appointments and university interview sessions.\n• Workload Protection: Scoped views prevent unauthorized data access across teams.",
    CYAN, AMBER
  );
}

// ==========================================
// 12. TEAM LEADER OPERATIONS (§3.13)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.13 Team Leader Management & Allocation", "Branch operations, team supervision, workload balancing, and SLA tracking.", "SECTION 3.13: TEAM LEADER");

  add2CardLayout(slide,
    "Supervision & Caseload Balancing",
    "• Team Member Overview: Real-time status of all counsellors within the branch/team.\n• Caseload Heatmap: Identifies overloaded and underutilized counsellors.\n• 1-Click Application Reallocation: Reassign incoming applications to balance workload.\n• Unassigned Application Pool: Central queue of unallocated cases for instant distribution.\n• Team Task Monitoring: View, reassign, or escalate stalled team action items.",
    "Performance & SLA Governance",
    "• Real-Time Conversion Funnel: Stage-by-stage progression across the entire team.\n• SLA Response Monitoring: Flags inquiries exceeding first-contact response thresholds.\n• Counsellor Performance Scorecards: Conversion rates, applications lodged & offers.\n• Branch Performance Comparison: Benchmark branch conversion against global targets.\n• Optimistic UI Updates: Immediate visual feedback on reassignments backed by Firestore.",
    AMBER, EMERALD
  );
}

// ==========================================
// 13. ADMISSIONS & UNIVERSITY PORTAL (§3.14, §3.17)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.14 & 3.17 Admissions & University Partner Portal", "Institutional assessment desk and dedicated university portal for direct decisions.", "SECTION 3.14 & 3.17: ADMISSIONS & UNIVERSITY");

  add2CardLayout(slide,
    "§3.14 Admissions Officer Desk",
    "• Application Verification Desk: Comprehensive audit of submitted academic files.\n• Document QA Actions: Mark individual files as Verified, Pending, or Rejected.\n• Decision Management: Issue Conditional Offer, Unconditional Offer, Deferral, Rejection.\n• Condition Tracking: Manage required items (e.g. final semester transcript, tuition deposit).\n• Application Cloner: Clone verified profiles to alternative partner universities.",
    "§3.17 University Partner Portal",
    "• Dedicated Institutional Login: Branded portal for partner university representatives.\n• Cohort Dossier Review: Access student applications lodged specifically for their institution.\n• Direct Decision Lodgement: Universities record offers and upload official offer letters.\n• CAS / I-20 Document Issuance: Track visa support documents issued by the university.\n• Direct Collaboration: Reduces admission turnaround from weeks to days.",
    EMERALD, CYAN
  );
}

// ==========================================
// 14. VISA & PRE-DEPARTURE MANAGEMENT (§3.15)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.15 Visa Processing & Gemini Risk Engine", "Embassy dossier tracking, CAS/I-20 checklists, and AI visa approval probability.", "SECTION 3.15: VISA MANAGEMENT");

  add2CardLayout(slide,
    "Visa Case Management",
    "• Multi-Country Visa Tracking: UK Student Visa (Tier 4), Canada SDS, USA F-1, Australia.\n• Pre-Departure Checklist: CAS/I-20 verification, TB certificate, biometric appointment.\n• Financial Adequacy Audits: Liquid funds calculation, sponsor affidavits & 28-day rule.\n• Mock Interview Scheduling: Prep sessions for embassy interviews with outcome notes.\n• Post-Visa Support: Flight bookings, accommodation confirmation & arrival briefing.",
    "Gemini AI Visa Risk Calculator",
    "• Multi-Factor Risk Assessment: Evaluates study gap, finances, English score & country.\n• Approval Probability Score: Quantifiable 0-100% predictive approval probability.\n• Risk Classification: Categorizes case risk level as Low, Medium, or High.\n• Risk Factor Identification: Pinpoints potential rejection triggers before submission.\n• Actionable Mitigation Checklist: Step-by-step guidance to strengthen the visa file.",
    PURPLE, AMBER
  );
}

// ==========================================
// 15. EXTERNAL AGENT PORTAL (§3.16)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.16 External Agent & Partner Network Portal", "Dedicated portal for recruitment partners, sub-agents, and commission tracking.", "SECTION 3.16: AGENT PORTAL");

  add2CardLayout(slide,
    "Agent Operations & Referrals",
    "• Self-Service Agent Portal: Dedicated login at `/agent/dashboard` for global recruiters.\n• Unique Referral Link Generator: Copy trackable registration links for student acquisition.\n• Direct Student Lodgement: Agents submit student referrals directly into agency pipeline.\n• Multi-Tier Sub-Agent Hierarchy: Manage branch agents and downstream sub-recruiters.\n• Application Milestone Visibility: Track referred student progress without calling staff.",
    "Commission Transparency",
    "• Commission Ledger: Real-time overview of earned, pending, and paid commissions.\n• Automated Calculation: Commission amounts linked to enrolled students and agreements.\n• Payout Approval Workflow: Status lifecycle (Eligible ➔ Approved ➔ Paid).\n• Statement Generation: Downloadable accounting statements and invoice matching.\n• Performance Metrics: Conversion rate rankings and high-performing partner badges.",
    CYAN, EMERALD
  );
}

// ==========================================
// 16. STUDENT SELF-SERVICE PORTAL (§3.18)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.18 Student Self-Service Portal", "Empowering international students with milestone visibility and mobile document upload.", "SECTION 3.18: STUDENT PORTAL");

  add2CardLayout(slide,
    "Student Experience Features",
    "• Visual Progress Timeline: Interactive milestone tracker (Lodged ➔ Offer ➔ Visa ➔ Travel).\n• Mobile-Optimized Document Vault: Upload passports and mark sheets from any phone.\n• Profile Self-Service (`/student/profile`): Edit contact details and academic background.\n• Direct Support Request Desk: Submit help inquiries directly to assigned counsellor.\n• Task Checklist: View outstanding tasks and deadlines assigned by the agency.",
    "Business & Operational Impact",
    "• Anxiety Reduction: Total transparency over application progress reassures students.\n• 70% Reduction in Status Calls: Students self-serve application status 24/7.\n• Faster Document Turnaround: Push notifications prompt instant missing file uploads.\n• GDPR Compliance: Students can view and update their own stored profile data.\n• Multi-Device Accessibility: Responsive Liquid Glass UI on iOS, Android & Desktop.",
    EMERALD, CYAN
  );
}

// ==========================================
// 17. OMNICHANNEL COMMUNICATIONS (§3.19)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.19 Omnichannel Communication Engine", "Unified messaging infrastructure across Email, WhatsApp, SMS, and templates.", "SECTION 3.19: COMMUNICATIONS");

  add2CardLayout(slide,
    "Communication Channels & Triggers",
    "• Multi-Channel Gateway: Centralized sending across Email, WhatsApp & SMS.\n• Dynamic Merge Fields: Personalizes messages with `{StudentName}`, `{University}`, `{Stage}`.\n• Automated Stage Notifications: Trigger automated emails upon offer or visa updates.\n• Scheduled Broadcasts: Schedule communication blasts for intake deadlines & fairs.\n• Central Communication Log: Every sent email and message recorded in student profile.",
    "Email Template Builder",
    "• Template Repository: Pre-built templates for Welcome, Offer Notice, Visa Checklist.\n• Rich Text & HTML Support: Professional branded agency letterheads and styles.\n• Channel Categorization: Specific template categories for Marketing, Operations & Finance.\n• Role-Based Permissions: Restrict who can create, edit, or broadcast templates.\n• Activity Attribution: Logs author, timestamp, and target recipient for every dispatch.",
    AMBER, PURPLE
  );
}

// ==========================================
// 18. 5 ACTIVE GEMINI AI TOOLS (§3.20)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.20 Gemini 2.0 Flash AI Intelligence Suite", "5 client-side AI tools embedded directly in Topbar and operational modules.", "SECTION 3.20: AI SUITE");

  const aiSuite = [
    { title: "1. AI Course Matcher", color: EMERALD, items: "• Evaluates GPA, budget & destination.\n• Outputs ranked courses with match %.\n• High / Medium / Reach likelihood.\n• 1-Click Application Drafting." },
    { title: "2. AI SOP Drafter", color: CYAN, items: "• Synthesizes academic background.\n• Generates 500-word university SOP.\n• Structured paragraphs & motivations.\n• Word count & highlight extraction." },
    { title: "3. AI Visa Risk Calculator", color: AMBER, items: "• Assesses study gap, funds & scores.\n• Outputs Approval Probability (0-100%).\n• Identifies hidden rejection risks.\n• Tailored pre-embassy checklist." },
    { title: "4. Document OCR & Readiness", color: PURPLE, items: "• Vision AI parses transcript/passport.\n• Auto-drafts student Firestore profiles.\n• Readiness Auditor scores app 0-100%.\n• Highlights missing mandatory files." }
  ];
  add4CardLayout(slide, aiSuite);
}

// ==========================================
// 19. CALENDAR & TASK AUTOMATION (§3.21)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.21 Calendar, Appointments & Task Automation", "Time management, recurring task triggers, and interactive event scheduling.", "SECTION 3.21: CALENDAR & TASKS");

  add2CardLayout(slide,
    "Calendar & Appointment Management",
    "• Multi-View Interactive Calendar: Day, Week, and Month scheduling views.\n• Appointment Types: In-person Counselling, Mock Visa Prep, University Interview.\n• Lead & Student Association: Calendar appointments link directly to student dossiers.\n• Multi-Counsellor Scheduling: View branch calendar availability to prevent double-booking.\n• Automated Reminders: In-app alerts before scheduled consultation sessions.",
    "Automated Task Triggers",
    "• Dynamic Task Creation: Auto-generates tasks upon stage changes (e.g. 'Verify CAS').\n• Priority & SLA Routing: Flags overdue tasks in amber/rose based on deadline.\n• Multi-Role Assignment: Assign tasks between Counsellor, Admissions, Visa & Finance.\n• Audit History: Records task creation, completion timestamp, and notes.\n• Recurring Action Items: Daily, weekly, or intake-cycle recurring reminders.",
    CYAN, EMERALD
  );
}

// ==========================================
// 20. INVOICING, PAYMENTS & COMMISSIONS (§3.22)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.22 Invoicing, Payments, Refunds & Commissions", "Comprehensive multi-currency financial ledger and receipt generation.", "SECTION 3.22: FINANCE ENGINE");

  add2CardLayout(slide,
    "Invoicing & Receipt Generation",
    "• Multi-Currency Receivables: Generate invoices in USD, GBP, AUD, CAD, EUR.\n• Invoice Types: Application Fees, Tuition Deposits, Service Charges, Visa Fees.\n• 1-Click Printable PDF Documents: Formats branded invoices & payment receipts.\n• Payment Reconciliation: Log Card, Bank Wire, Cash, Cheque & Online Gateway.\n• Refund Workflow: Submit, review, and approve refund requests with reason capture.",
    "Agent Commission Management",
    "• Automated Commission Calculation: Mapped to enrolled student agreements.\n• Status Lifecycle: Pending ➔ Eligible ➔ Approved ➔ Paid ➔ Reversed.\n• Statement Generation: Generates accounting statements for external partners.\n• Financial BI Metrics: Total Paid Revenue, Outstanding Balances, Refund Exposure.\n• Audit Attribution: Every financial transaction logs author, timestamp & invoice ID.",
    EMERALD, AMBER
  );
}

// ==========================================
// 21. REPORTING & BUSINESS INTELLIGENCE (§3.23)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.23 Reporting & Business Intelligence", "Dimensional analytics, conversion metrics, and AI natural language querying.", "SECTION 3.23: REPORTING & BI");

  add2CardLayout(slide,
    "Dimensional Analytics & Visualizations",
    "• Funnel Progression Reports: Track conversion loss across each pipeline transition.\n• Counsellor & Branch Scorecards: Measure lead conversion rates and response time.\n• Intake & Country Yield: Analyze popular destination countries and top programs.\n• Revenue & Receivables Forecast: Forecast incoming tuition fees and commission payouts.\n• CSV Data Export: 1-click export of filtered datasets for external accounting.",
    "Natural Language Querying & KPIs",
    "• AI Natural Language BI Query: Query reports in plain English via Gemini AI.\n• Period-over-Period Comparison: Compare month-over-month and year-over-year growth.\n• Anomaly Detection: Visual alerts on unusual drops in applications or missed targets.\n• Scoped Access: Staff members view only reports permitted by their role/office.\n• Custom Saved Views: Save filtered reporting layouts for recurring board presentations.",
    PURPLE, CYAN
  );
}

// ==========================================
// 22. AUDIT TRAIL & SYSTEM LOGS (§3.24)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.24 Tamper-Proof Audit Trail & System Logs", "Immutable event logging for regulatory compliance and institutional governance.", "SECTION 3.24: AUDIT TRAIL");

  add2CardLayout(slide,
    "Immutable Audit Stream",
    "• Append-Only Log Architecture: Logs cannot be edited or deleted by browser users.\n• Granular Actor Attribution: Records User ID, Email, Role, Timestamp & IP.\n• Action Logging: Tracks Logins, Stage Changes, Profile Updates, Deletions, Exports.\n• Entity Traceability: Deep links audit entries to specific Lead, Student, or Invoice IDs.\n• Search & Filter: Filter logs by Actor, Action Type, Entity, Date Range & Severity.",
    "Compliance Health & Oversight",
    "• Auditor Workspace (`/auditor/dashboard`): Dedicated read-only compliance portal.\n• Compliance Check Records: Pass/Fail auditing of student visa and financial dossiers.\n• System Integrity Metrics: Compliance Pass Rate % and Critical Security Event alerts.\n• Security Event Monitoring: Detects unauthorized permission escalation attempts.\n• Exportable Audit Records: Generate compliance export dossiers for university audits.",
    EMERALD, ROSE
  );
}

// ==========================================
// 23. MASTER DATA CONFIGURATION (§3.25)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.25 Master Data Configuration Center", "Centralized administrative management of global CRM taxonomy and business rules.", "SECTION 3.25: MASTER DATA");

  add2CardLayout(slide,
    "Administrative Taxonomy Management",
    "• Destination Countries & Currencies: Configure supported study destinations.\n• Qualification Hierarchy: High School, Bachelor's, Master's, Postgraduate, PhD.\n• Intake Season Master: September, January, May, July intakes with deadline dates.\n• Rejection & Lost Reasons: Standardized categorization for continuous analytics.\n• Custom Field Definition: Add custom attributes to Leads, Students & Applications.",
    "Workflow & Routing Rules",
    "• Automated Lead Routing Rules (`/lead-routing`): Rule builder for destination & score.\n• Lead Scoring Weightages (`/lead-scoring`): Configure points for GPA, IELTS & source.\n• Automated SLA Workflow Triggers (`/workflow-rules`): Define trigger actions per stage.\n• Branch Office Configuration: Add new branch hubs with specific operating teams.\n• Multi-Branch Switcher: Switch active branch context dynamically from top bar.",
    CYAN, AMBER
  );
}

// ==========================================
// 24. DATA MIGRATION & BULK IMPORT (§3.26)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.26 Data Migration & Bulk Import/Export", "Enterprise CSV/Excel ingestion tools with column mapping and validation.", "SECTION 3.26: DATA MIGRATION");

  add2CardLayout(slide,
    "CSV / Excel Import Engine",
    "• Dedicated Migration Center: Accessible at `/import-export` for bulk data loading.\n• Multi-Entity Support: Import Leads, Students, Universities, Programmes & Invoices.\n• Interactive Column Mapping: Maps CSV headers to CRM data model attributes.\n• Real-Time Validation: Pre-validates emails, phone formats & mandatory attributes.\n• Error Isolation: Skips invalid rows with error logs while importing valid records.",
    "Data Export & Governance",
    "• Comprehensive Data Export: 1-click CSV generation across all tabular views.\n• Encrypted Data Transmission: Secure download over TLS with RBAC export gating.\n• Rollback & Batch Tracking: Tracks batch import IDs for rollback capabilities.\n• Template Downloads: Download formatted CSV sample templates for easy onboarding.\n• Data Quality Governance (`/data-quality`): Scans database health and data completeness.",
    EMERALD, PURPLE
  );
}

// ==========================================
// 25. FORM BUILDER & LEAD CAPTURE (§3.27)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "3.27 Public Form Builder & Lead Ingestion", "Visual drag-and-drop web form builder generating public lead capture links.", "SECTION 3.27: PUBLIC FORMS");

  add2CardLayout(slide,
    "Visual Drag-and-Drop Form Builder",
    "• Visual Builder (`/form-builder`): Create custom inquiry forms for websites and ads.\n• Rich Form Fields: Text, Email, Phone, Country Select, Program Dropdown, File Upload.\n• Custom Styling & Theming: Branded headers, descriptions, and submit buttons.\n• Shareable Public URLs: Generates unique standalone link `/public/forms/:formId`.\n• Embeddable Widgets: Copy responsive iframe embed snippet for external landing pages.",
    "Automated Lead Ingestion & Analytics",
    "• Zero-Auth Submission: Public prospects submit inquiries without logging in.\n• Direct Pipeline Ingestion: Submissions auto-create Lead records in Firestore.\n• Auto-Assign & Score: Applies lead scoring and routing rules instantly on submission.\n• Form Performance Analytics: Tracks View Count, Start Count & Submit Conversion Rate %.\n• Success Landing Page: Redirects to customizable `/public/form-success` confirmation.",
    AMBER, CYAN
  );
}

// ==========================================
// 26. NON-FUNCTIONAL REQUIREMENTS (§4.1 - §4.8)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "4.1 - 4.8 Security, Performance & GDPR Privacy", "Enterprise non-functional architecture benchmarks and regulatory compliance.", "SECTION 4: NON-FUNCTIONAL REQS");

  add2CardLayout(slide,
    "§4.1 - §4.4 Security, Privacy & GDPR",
    "• HTTPS / TLS 1.3 Encryption: End-to-end encryption in transit and AES-256 at rest.\n• GDPR Privacy Center: 1-click JSON Data Export & Right-to-be-Forgotten erasure.\n• OWASP Top 10 Hardened: XSS sanitation, CSRF tokens, strict parameter limits.\n• Consent Management: Versioned terms acceptance and consent audit records.\n• Client Privilege Enforcement: Security rules validated server-side on Cloud Firestore.",
    "§4.5 - §4.8 Performance, Reliability & Cloud",
    "• Sub-Second UI Rendering: Optimistic state updates with real-time Firestore sync.\n• 99.9% Cloud Availability: Powered by Google Cloud Platform & Firebase Hosting CDN.\n• Automated Scalability: Serverless Firestore auto-scales across concurrent global users.\n• Responsive Design: Liquid Glass UI optimized across Mobile, Tablet & 4K Displays.\n• Automated Offline Recovery: Graceful fallback and error retry mechanisms.",
    EMERALD, PURPLE
  );
}

// ==========================================
// 27. NON-FUNCTIONAL ARCHITECTURE (§4.9 - §4.15)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "4.9 - 4.15 API, Accessibility & Quality Assurance", "Integration standards, accessibility guidelines, and automated verification.", "SECTION 4: QUALITY ASSURANCE");

  add2CardLayout(slide,
    "§4.9 - §4.12 Integration & Usability",
    "• RESTful API Architecture: Modular data hooks structured for third-party webhook sync.\n• Zero-Cost Document Storage: Google Drive and Cloud Storage integration architecture.\n• Multi-Branch Workspace Scoping: Instant branch switching without session resets.\n• High-Contrast Design Tokens: Accessible color contrast ratios matching WCAG 2.1.\n• Dynamic Demo Toggle: Instant toggle between sample data and clean live Firestore.",
    "§4.13 - §4.15 Testing & Verification",
    "• TypeScript Static Compilation: 100% strictly typed codebase with 0 build errors.\n• Automated Vitest Test Suite: Unit tests verifying deduplication and scoring algorithms.\n• Production Bundle Optimization: Tree-shaken chunks compiled via Vite in <6 seconds.\n• Continuous Deployment: Live automated deployment to Firebase Hosting.\n• Git Version Control: 78+ structured phase commits on GitHub `main` branch.",
    CYAN, EMERALD
  );
}

// ==========================================
// 28. THE MASTER DEMO STORY FLOW
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Master Demo Story: Student 'Aarav Patel' Lifecycle", "Chronological 10-minute presentation covering all 14 roles seamlessly.", "MASTER DEMO STORY");

  const steps = [
    { num: "1", title: "Agent Capture", desc: "Agent lodges Aarav Patel via referral link.", role: "External Agent" },
    { num: "2", title: "Counselling & AI", desc: "Counsellor runs AI Course Matcher & SOP Drafter.", role: "Counsellor" },
    { num: "3", title: "Operations", desc: "Team Leader balances caseload & reallocates app.", role: "Team Leader" },
    { num: "4", title: "Admissions & Uni", desc: "Admissions verifies transcripts; Uni issues offer.", role: "Admissions & Uni" },
    { num: "5", title: "Student Portal", desc: "Aarav tracks milestone & uploads passport from phone.", role: "Student" },
    { num: "6", title: "Visa & Finance", desc: "AI Visa Risk Score calculated; Invoice & receipt printed.", role: "Visa & Finance" },
    { num: "7", title: "Audit & Governance", desc: "Auditor checks logs; Super Admin reviews GDPR.", role: "Auditor & Admin" }
  ];

  steps.forEach((s, idx) => {
    const y = 1.85 + idx * 0.7;
    slide.addShape(pres.ShapeType.rect, { x: 0.8, y, w: 11.5, h: 0.6, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 }, rectRadius: 0.08 });
    slide.addShape(pres.ShapeType.rect, { x: 1.0, y: y + 0.1, w: 0.4, h: 0.4, fill: { color: EMERALD }, rectRadius: 0.2 });
    slide.addText(s.num, { x: 1.0, y: y + 0.1, w: 0.4, h: 0.4, fontSize: 11, bold: true, color: BG_DARK, align: "center", valign: "middle" });
    slide.addText(s.title, { x: 1.6, y, w: 2.5, h: 0.6, fontSize: 12, bold: true, color: TEXT_WHITE, valign: "middle" });
    slide.addText(s.desc, { x: 4.2, y, w: 5.3, h: 0.6, fontSize: 10.5, color: TEXT_MUTED, valign: "middle" });
    slide.addText(s.role, { x: 9.6, y, w: 2.5, h: 0.6, fontSize: 10, bold: true, color: CYAN, align: "right", valign: "middle" });
  });
}

// ==========================================
// 29. LIVE DEMO EXECUTION CHEAT SHEET
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Live Demo Execution Cheat Sheet", "Step-by-step role buttons, exact clicks, and key talking points.", "EXECUTION CHEAT SHEET");

  const tableData = [
    [
      { text: "Step", options: { bold: true, fill: { color: CARD_BORDER }, color: EMERALD } },
      { text: "Role Button", options: { bold: true, fill: { color: CARD_BORDER }, color: TEXT_WHITE } },
      { text: "Where to Click", options: { bold: true, fill: { color: CARD_BORDER }, color: TEXT_WHITE } },
      { text: "What to Demonstrate", options: { bold: true, fill: { color: CARD_BORDER }, color: TEXT_WHITE } }
    ],
    [
      { text: "1" }, { text: "Header" }, { text: "Topbar Toggle" }, { text: "Flip 'Demo Data: ON' to 'Live Only' to prove dynamic state." }
    ],
    [
      { text: "2" }, { text: "Agent" }, { text: "/agent/dashboard" }, { text: "Show referral tracking link, student pipeline & $4,850 commission." }
    ],
    [
      { text: "3" }, { text: "Counsellor" }, { text: "/leads & AI Tools" }, { text: "Add lead, run Gemini Course Matcher & generate instant SOP." }
    ],
    [
      { text: "4" }, { text: "Team Leader" }, { text: "/team-leader/applications" }, { text: "Reassign application to counsellor; show workload heatmap update." }
    ],
    [
      { text: "5" }, { text: "Admissions" }, { text: "/admissions/dashboard" }, { text: "Verify academic transcripts; issue Conditional/Unconditional offer." }
    ],
    [
      { text: "6" }, { text: "University" }, { text: "/university/dashboard" }, { text: "Show institution portal and direct university cohort decisioning." }
    ],
    [
      { text: "7" }, { text: "Student" }, { text: "/student/dashboard" }, { text: "Show visual milestone progress timeline & profile self-edit." }
    ],
    [
      { text: "8" }, { text: "Visa Officer" }, { text: "/visa-officer/dashboard" }, { text: "Run Gemini Visa Risk tool; show approval % and CAS checklist." }
    ],
    [
      { text: "9" }, { text: "Finance" }, { text: "/finance/invoices" }, { text: "Click 'Print Invoice / Receipt'; approve partner agent commission." }
    ],
    [
      { text: "10" }, { text: "Auditor" }, { text: "/auditor/dashboard" }, { text: "Show append-only audit trail and compliance pass rate metrics." }
    ],
    [
      { text: "11" }, { text: "Super Admin" }, { text: "/super-admin/dashboard" }, { text: "Show multi-tenant subscription tiers & GDPR JSON export." }
    ]
  ];

  slide.addTable(tableData, {
    x: 0.8,
    y: 1.85,
    w: 11.5,
    h: 4.85,
    fontSize: 9.5,
    color: TEXT_WHITE,
    fill: { color: CARD_BG },
    border: { pt: 1, color: CARD_BORDER },
    align: "left",
    valign: "middle"
  });
}

// ==========================================
// 30. CONCLUSION & DEPLOYMENT SUMMARY
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, "Conclusion & Production Verification", "100% complete, fully verified, compiled, and deployed live to production.", "SYSTEM COMPLETION SUMMARY");

  add2CardLayout(slide,
    "Verified Implementation Deliverables",
    "• 100% Requirement Coverage: Every section (§3.1 - §3.27 & §4.1 - §4.15) wired.\n• 14 Configurable Roles: Dedicated workspaces and instant login shortcuts.\n• 5 Active Gemini AI Engines: Course Matcher, SOP Drafter, Visa Risk, OCR, Auditor.\n• Dynamic Demo Switch: Global Show/Hide Demo Data toggle in Topbar.\n• Codebase Scale: ~23,000 lines of TypeScript across 78 GitHub commits.",
    "Live Production Links & Verification",
    "• Live Web App: https://education-crm-9fee2.web.app\n• GitHub Repository: https://github.com/MujtabaZaheer/CRM.git\n• TypeScript Compile Check: 0 Errors (Strictly Typed)\n• Production Build: Clean Vite build in 5.49 seconds\n• Cloud Database: Live Google Cloud Firestore with real-time listeners.",
    EMERALD, CYAN
  );
}

const outputPath = path.join(__dirname, "EduCRM_Master_Demo_Flow.pptx");
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log(`Master 30-Slide Presentation generated successfully at: ${outputPath}`);
});
