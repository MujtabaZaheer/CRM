const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  ShadingType
} = require("docx");
const fs = require("fs");
const path = require("path");

const screenshotsDir = path.join(__dirname, "..", "crm_screenshots");
const outputDocxPath = path.join(__dirname, "..", "EduCRM_Instructor_Walkthrough_Guide.docx");
const docsDocxPath = path.join(__dirname, "..", "docs", "EduCRM_Instructor_Walkthrough_Guide.docx");

// Color Palette Constants
const COLOR_PRIMARY = "10B981"; // Emerald
const COLOR_DARK = "0F172A";    // Slate 900
const COLOR_MUTED = "64748B";   // Slate 500
const COLOR_ACCENT = "0284C7";  // Sky 600
const COLOR_BORDER = "CBD5E1";  // Slate 300
const COLOR_BG_LIGHT = "F8FAFC"; // Slate 50
const COLOR_CALLOUT_BG = "ECFDF5"; // Emerald 50

function createHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: "EduCRM — Master Instructor Walkthrough & Evaluation Manual",
            size: 16,
            color: COLOR_MUTED,
            font: "Arial"
          })
        ]
      })
    ]
  });
}

function createFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.SPACE_BETWEEN,
        children: [
          new TextRun({
            text: "Confidential • Enterprise Higher Education Admissions Platform",
            size: 16,
            color: COLOR_MUTED,
            font: "Arial"
          }),
          new TextRun({
            text: "Page ",
            size: 16,
            color: COLOR_MUTED,
            font: "Arial"
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 16,
            color: COLOR_PRIMARY,
            bold: true,
            font: "Arial"
          }),
          new TextRun({
            text: " of ",
            size: 16,
            color: COLOR_MUTED,
            font: "Arial"
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 16,
            color: COLOR_MUTED,
            font: "Arial"
          })
        ]
      })
    ]
  });
}

function titleP(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text,
        size: 46,
        bold: true,
        color: COLOR_DARK,
        font: "Arial"
      })
    ]
  });
}

function subtitleP(text) {
  return new Paragraph({
    spacing: { after: 240 },
    children: [
      new TextRun({
        text,
        size: 24,
        color: COLOR_PRIMARY,
        bold: true,
        font: "Arial"
      })
    ]
  });
}

function h1P(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 180 },
    children: [
      new TextRun({
        text,
        size: 30,
        bold: true,
        color: COLOR_DARK,
        font: "Arial"
      })
    ]
  });
}

function h2P(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({
        text,
        size: 24,
        bold: true,
        color: COLOR_PRIMARY,
        font: "Arial"
      })
    ]
  });
}

function bodyP(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        size: 20,
        color: options.color || "334155",
        bold: options.bold || false,
        italics: options.italics || false,
        font: "Arial"
      })
    ]
  });
}

function bulletP(text, boldPrefix = "") {
  const children = [];
  if (boldPrefix) {
    children.push(
      new TextRun({
        text: boldPrefix + " ",
        size: 20,
        bold: true,
        color: COLOR_DARK,
        font: "Arial"
      })
    );
  }
  children.push(
    new TextRun({
      text,
      size: 20,
      color: "334155",
      font: "Arial"
    })
  );

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children
  });
}

function calloutBox(title, body) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: COLOR_CALLOUT_BG },
            margins: { top: 160, bottom: 160, left: 240, right: 240 },
            borders: {
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY }
            },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    size: 20,
                    bold: true,
                    color: COLOR_PRIMARY,
                    font: "Arial"
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: body,
                    size: 19,
                    color: "1E293B",
                    font: "Arial"
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function imageFigure(filename, caption) {
  const imgPath = path.join(screenshotsDir, filename);
  if (!fs.existsSync(imgPath)) {
    console.warn(`[WARN] Missing screenshot: ${filename}`);
    return [
      bodyP(`[Image missing: ${filename}]`, { color: "DC2626", bold: true })
    ];
  }

  const imgData = fs.readFileSync(imgPath);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 80 },
      children: [
        new ImageRun({
          data: imgData,
          transformation: {
            width: 580,
            height: 362
          }
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: `Figure: `,
          size: 18,
          bold: true,
          color: COLOR_PRIMARY,
          font: "Arial"
        }),
        new TextRun({
          text: caption,
          size: 18,
          italics: true,
          color: COLOR_MUTED,
          font: "Arial"
        })
      ]
    })
  ];
}

function createTable(headers, rows, colWidths = []) {
  const tableRows = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: COLOR_DARK },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: h,
                  size: 18,
                  bold: true,
                  color: "FFFFFF",
                  font: "Arial"
                })
              ]
            })
          ]
        })
      )
    })
  );

  // Data Rows
  rows.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    tableRows.push(
      new TableRow({
        children: row.map((cellText, i) =>
          new TableCell({
            shading: isEven ? { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT } : undefined,
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    size: 18,
                    color: "1E293B",
                    font: "Arial"
                  })
                ]
              })
            ]
          })
        )
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
    },
    rows: tableRows
  });
}

async function buildWordDocument() {
  console.log("Compiling unified Word walkthrough document dynamically...");

  const content = [];

  // COVER / TITLE
  content.push(titleP("EduCRM — Master Instructor Hands-On Walkthrough & Complete System Evaluation Manual"));
  content.push(subtitleP("Cloud-Native Higher Education Admissions CRM & Student Recruitment Platform"));
  content.push(calloutBox(
    "System Architecture & Live Deployment",
    "Production Web URL: https://education-crm-9fee2.web.app\nLocal Development Server: http://localhost:5173\nCore Tech Stack: React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Firebase (Firestore, Auth, Storage, Hosting), Google Gemini 3.8 Flash AI.\nCoverage: 13 Configurable Roles, 12 Validated Flows, 51 High-Resolution Screenshots."
  ));
  content.push(bodyP(""));

  // SECTION 1: EXECUTIVE EVALUATION BLUEPRINT
  content.push(h1P("1. Executive Evaluation Blueprint & Quick-Access System"));
  content.push(bodyP(
    "EduCRM is an enterprise-grade platform engineered to streamline the entire international student recruitment lifecycle. The system coordinates 13 distinct user roles with strict tenant isolation, automated regulatory auditing, and real-time state machine transitions."
  ));
  content.push(bodyP(
    "To evaluate any role without manual credential entry, EduCRM includes a persistent One-Click Demo Access Drawer located at the bottom-right of the login screen (/login). Clicking any role button instantly provisions a real Firebase Auth session and pre-hydrates realistic operational data."
  ));
  content.push(...imageFigure(
    "01_login_and_demo_access.png",
    "Login Screen with Collapsible 13-Role One-Click Demo Access Drawer"
  ));

  content.push(h2P("Master Role Routing & Test Access Matrix"));
  content.push(bodyP(
    "The following matrix outlines every evaluated persona, their quick-access trigger button, default test identity, and primary landing URL:"
  ));
  content.push(createTable(
    ["User Role", "Demo Drawer Button", "Default Test Email", "Primary Route", "Evaluated Responsibility"],
    [
      ["Student (New)", "Student (New)", "Dynamic Session", "/student/onboarding/step-1", "AI CV intake, Zero-Redundancy 4-stage onboarding wizard"],
      ["Student (Reg)", "Student (Reg)", "aarav.patel@gmail.com", "/student/dashboard", "11-step application wizard, course discovery, vault, invoices"],
      ["Counsellor", "Counsellor", "counsellor@educrm.demo", "/counsellor/dashboard", "Lead deduplication, 360° student dossier, AI program matcher"],
      ["Admissions", "Admissions", "admissions@educrm.demo", "/admissions/dashboard", "Document Verification Hub, academic threshold audit, offers"],
      ["Team Leader", "Team Leader", "teamleader@educrm.demo", "/team-leader/dashboard", "Caseload allocation, counsellor reassignment, SLA monitoring"],
      ["Visa Officer", "Visa Officer", "visa@educrm.demo", "/visa-officer/dashboard", "28-day proof of funds, mock visa interview, CAS clearance"],
      ["Finance", "Finance", "finance@educrm.demo", "/finance/dashboard", "Tuition invoices, fee challans, agent commission ledger"],
      ["Agent", "Agent", "agent@educrm.demo", "/agent/dashboard", "Lead referral ingestion, pipeline tracking, commission tracking"],
      ["University", "University", "university@educrm.demo", "/university/dashboard", "Institutional application review, program setup, direct CAS upload"],
      ["Support", "Support", "support@educrm.demo", "/support/dashboard", "Ticketing desk, priority resolution, knowledge base curation"],
      ["Auditor", "Auditor", "auditor@educrm.demo", "/auditor/dashboard", "Immutable audit trail, GDPR consent inspect, system log forensics"],
      ["Super Admin", "Super Admin", "superadmin@educrm.demo", "/super-admin/dashboard", "Multi-tenant branch oversight, 13-tier RBAC provisioning"],
      ["Org Admin", "Org Admin", "orgadmin@educrm.demo", "/", "Branch operational rules, lead scoring, commission manager"]
    ],
    [16, 16, 22, 22, 24]
  ));
  content.push(bodyP(""));

  // FLOW 1: STUDENT ONBOARDING
  content.push(h1P("FLOW 1: Student Intake — AI CV Scanner & Zero-Redundancy Onboarding"));
  content.push(calloutBox(
    "The Zero-Redundancy Principle",
    "Core Architectural Rule: Any data extracted from a student CV or entered during registration is NEVER requested again. All subsequent wizard stages are 100% pre-hydrated from Firestore and session cache."
  ));
  content.push(h2P("Step 1.1: Registration with Gemini 3.8 Flash CV Scanner"));
  content.push(bulletP("Access Route: /register?role=student or click 'Create New Account' from login.", "URL:"));
  content.push(bulletP("Locate the AI CV / Resume Scanner featuring the Google Gemini badge. Drag and drop any sample CV (.pdf or .docx) or type details manually.", "Action:"));
  content.push(bulletP("The multimodal AI engine extracts First Name, Last Name, Email, Phone, Country, Nationality, Degree Level, and Language scores without placeholder defaults.", "Expected Behavior:"));
  content.push(...imageFigure(
    "02_student_registration_cv_upload.png",
    "Student Registration with Multimodal Gemini 3.8 Flash AI CV Scanner"
  ));

  content.push(h2P("Step 1.2: Onboarding Step 1 — Identity Confirmation & Degree Level"));
  content.push(bulletP("Access Route: /student/onboarding/step-1.", "URL:"));
  content.push(bulletP("Verify Zero-Redundancy: All personal identity fields are already pre-filled from registration. Select Desired Study Level (Postgraduate / Master's) and confirm prior academic qualifications (e.g., Bachelor of Computer Science, GPA 3.65).", "Verification:"));
  content.push(bulletP("Click 'Save & Continue' to advance to destination preferences.", "Action:"));
  content.push(...imageFigure(
    "03_student_onboarding_step1.png",
    "Student Onboarding Step 1 — Identity Confirmation and Academic Qualification"
  ));

  content.push(h2P("Step 1.3: Onboarding Step 2 — Study Destinations & Intake Term"));
  content.push(bulletP("Access Route: /student/onboarding/step-2.", "URL:"));
  content.push(bulletP("Select target destination countries (United Kingdom, United States, Canada), target intake (Autumn / Fall 2026), and annual tuition budget (£15,000 - £25,000).", "Action:"));
  content.push(bulletP("Click 'Proceed to Documents'.", "Action:"));
  content.push(...imageFigure(
    "04_student_onboarding_step2.png",
    "Student Onboarding Step 2 — Study Destinations, Intake Session, and Tuition Budget"
  ));

  content.push(h2P("Step 1.4: Onboarding Step 3 — Mandatory KYC Document Repository"));
  content.push(bulletP("Access Route: /student/onboarding/step-3.", "URL:"));
  content.push(bulletP("Upload or inspect mandatory document slots: International Passport, Bachelor Degree Transcript, and English Language Test Certificate (IELTS/PTE).", "Action:"));
  content.push(bulletP("Client-side validation verifies file types (.pdf, .png, .jpg) and file sizes (<10MB). Click 'Proceed to Readiness Review'.", "Action:"));
  content.push(...imageFigure(
    "05_student_onboarding_step3.png",
    "Student Onboarding Step 3 — Secure KYC and Academic Document Upload Repository"
  ));

  content.push(h2P("Step 1.5: Onboarding Step 4 — Profile Completeness & Legal Declaration"));
  content.push(bulletP("Access Route: /student/onboarding/step-4.", "URL:"));
  content.push(bulletP("Observe the Profile Completeness Score computed dynamically by profileCompleteness.ts. Check the declaration box confirming document authenticity.", "Action:"));
  content.push(bulletP("Click 'Complete Onboarding & Enter Portal'. The system sets onboardingStatus to completed and unlocks full student privileges.", "Action:"));
  content.push(...imageFigure(
    "06_student_onboarding_step4.png",
    "Student Onboarding Step 4 — Profile Completeness Scoring and Final Declaration"
  ));

  // FLOW 2: STUDENT COURSE DISCOVERY & APPLICATION
  content.push(h1P("FLOW 2: Student Experience — Course Discovery & 11-Step Application Wizard"));
  content.push(h2P("Step 2.1: Student Command Center"));
  content.push(bulletP("Fast Login: Click 'Student (Reg)' in Demo Accounts drawer or login with aarav.patel@gmail.com.", "Trigger:"));
  content.push(bulletP("URL: /student/dashboard.", "Route:"));
  content.push(bulletP("Inspect the real-time application tracker card, assigned counsellor card with direct chat link, and document readiness status chips.", "Overview:"));
  content.push(...imageFigure(
    "07_student_dashboard.png",
    "Student Command Center — Application Tracker, Assigned Counsellor, and Profile Readiness"
  ));

  content.push(h2P("Step 2.2: Programme Catalog & Entry Requirement Filter"));
  content.push(bulletP("Access Route: /student/programs.", "URL:"));
  content.push(bulletP("Filter courses by Country (United Kingdom), Level (Postgraduate), and Discipline (Computer Science). Select MSc Advanced Computer Science at Oxford University.", "Action:"));
  content.push(bulletP("Verify entry criteria: Minimum GPA 3.5, Minimum IELTS 7.0. Click 'Apply Now'.", "Action:"));
  content.push(...imageFigure(
    "08_student_programme_catalog.png",
    "Student Course Discovery & Searchable Programme Catalog with Entry Criteria"
  ));

  content.push(h2P("Step 2.3: Complete 11-Step Student Application Wizard"));
  content.push(bulletP("Access Route: /student/new-application.", "URL:"));
  content.push(bulletP("Step 1: Programme Overview and campus selection.", "Wizard Steps:"));
  content.push(bulletP("Step 2: Personal Details — 100% pre-filled from master profile (Zero Redundancy).", "Wizard Steps:"));
  content.push(bulletP("Step 3: Academic Qualifications — Degree and GPA pre-filled.", "Wizard Steps:"));
  content.push(bulletP("Step 4: English Language Proficiency — IELTS 7.5 automatically benchmarked against program threshold.", "Wizard Steps:"));
  content.push(bulletP("Steps 5-10: Statement of Purpose (SOP), work experience, referee contacts, university-specific questions, and KYC documents.", "Wizard Steps:"));
  content.push(bulletP("Step 11: Submit Application. Application record is stored with status 'Submitted' and stage 'Initial Review'.", "Submission:"));
  content.push(...imageFigure(
    "09_student_application_wizard.png",
    "11-Step Comprehensive Student Application Wizard"
  ));

  // FLOW 3: STUDENT VAULT, INVOICES, CHAT & PROFILE
  content.push(h1P("FLOW 3: Student Self-Management — Vault, Invoices, Chat & Profile"));
  content.push(h2P("Step 3.1: Secure Digital Document Vault"));
  content.push(bulletP("Access Route: /student/documents.", "URL:"));
  content.push(bulletP("View categorized documents with verification stamps (Verified, Pending, Resubmission Required).", "Features:"));
  content.push(...imageFigure(
    "10_student_document_vault.png",
    "Student Digital Document Vault with Verification Stamps"
  ));

  content.push(h2P("Step 3.2: Tuition Invoices & Bank Fee Challans"));
  content.push(bulletP("Access Route: /student/invoices.", "URL:"));
  content.push(bulletP("Download official tuition deposit fee challan and university invoice PDF with bank wire details.", "Features:"));
  content.push(...imageFigure(
    "11_student_invoices.png",
    "Student Tuition Invoices, Fee Challans, and Bank Wire Instructions"
  ));

  content.push(h2P("Step 3.3: Direct Messaging with Assigned Counsellor"));
  content.push(bulletP("Access Route: /student/messages.", "URL:"));
  content.push(bulletP("Engage in direct real-time communication with the assigned education counsellor.", "Features:"));
  content.push(...imageFigure(
    "50_student_chat_messages.png",
    "Student Direct Messaging Channel with Assigned Counsellor"
  ));

  content.push(h2P("Step 3.4: Student Profile Self-Edit"));
  content.push(bulletP("Access Route: /student/profile.", "URL:"));
  content.push(bulletP("Update residential address, emergency contact, or passport number with bidirectional profile sync.", "Features:"));
  content.push(...imageFigure(
    "51_student_profile_edit.png",
    "Student Profile Self-Edit and Master Contact Update"
  ));

  // FLOW 4: COUNSELLOR
  content.push(h1P("FLOW 4: Education Counsellor — Lead Intake, 360° Dossier & AI Matcher"));
  content.push(h2P("Step 4.1: Counsellor Command Center"));
  content.push(bulletP("Fast Login: Click 'Counsellor' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /counsellor/dashboard.", "Route:"));
  content.push(bulletP("Review assigned active leads, applications in pipeline, and scheduled student callbacks due today.", "KPIs:"));
  content.push(...imageFigure(
    "12_counsellor_dashboard.png",
    "Counsellor Command Center — Active Lead Metrics, Application Pipeline, and Due Callbacks"
  ));

  content.push(h2P("Step 4.2: Lead Lifecycle & Automated Deduplication"));
  content.push(bulletP("Access Route: /leads.", "URL:"));
  content.push(bulletP("Filter leads by status (New, Contacted, Qualified, Converted). Review AI Lead Score Badges (Hot, Warm, Cold).", "Action:"));
  content.push(bulletP("Click 'Add Lead' and enter an existing email (e.g., aarav.patel@gmail.com). System flags duplicate inquiry and prevents fragmentation.", "Deduplication Test:"));
  content.push(bulletP("Click 'Convert to Student' on any qualified lead to provision student portal access.", "Conversion:"));
  content.push(...imageFigure(
    "13_leads_management.png",
    "Leads Lifecycle Management with AI Lead Scoring and Deduplication Prevention"
  ));

  content.push(h2P("Step 4.3: 360° Student Application Dossier"));
  content.push(bulletP("Access Route: /counsellor/students.", "URL:"));
  content.push(bulletP("Select Aarav Patel to launch the Application Dossier Modal. Review unified academic history, test scores, verified KYC documents, and interaction history.", "Action:"));
  content.push(...imageFigure(
    "14_counsellor_students.png",
    "Counsellor Students Directory and Unified 360° Student Dossier"
  ));

  content.push(h2P("Step 4.4: Algorithmic Programme Matcher"));
  content.push(bulletP("Access Route: /counsellor/programme-matcher.", "URL:"));
  content.push(bulletP("Input student credentials (GPA 3.65, IELTS 7.5, Target UK) and run algorithmic matching.", "Action:"));
  content.push(bulletP("System categorizes universities into High Match (fully eligible), Conditional Pathway, and Stretch Target.", "Output:"));
  content.push(...imageFigure(
    "15_counsellor_programme_matcher.png",
    "Algorithmic Course & University Matcher with Entry Benchmark Classification"
  ));

  content.push(h2P("Step 4.5: Application Pipeline Management"));
  content.push(bulletP("Access Route: /applications.", "URL:"));
  content.push(bulletP("Advance application stage from 'Draft' to 'Initial Review' to forward to Admissions Officer triage.", "Action:"));
  content.push(...imageFigure(
    "16_applications_pipeline.png",
    "Staff Application Pipeline Management and Stage Transition Tracker"
  ));

  // FLOW 5: ADMISSIONS OFFICER
  content.push(h1P("FLOW 5: Admissions Officer — Verification Hub, Academic Threshold & Offers"));
  content.push(h2P("Step 5.1: Admissions Command Center"));
  content.push(bulletP("Fast Login: Click 'Admissions' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /admissions/dashboard.", "Route:"));
  content.push(bulletP("Review applications pending document verification, SLA deadlines, and offers issued today.", "Overview:"));
  content.push(...imageFigure(
    "17_admissions_dashboard.png",
    "Admissions Command Center — Pending Document Verifications and Intake Deadlines"
  ));

  content.push(h2P("Step 5.2: Admissions Document Verification Hub"));
  content.push(bulletP("Access Route: /admissions/verification.", "URL:"));
  content.push(bulletP("Open candidate in 'Initial Review' stage. Conduct side-by-side inspection of Passport, Academic Transcript, and IELTS Scorecard.", "Action:"));
  content.push(bulletP("Click 'Approve Document' to stamp as verified, or 'Request Resubmission' with mandatory corrective instructions.", "Action:"));
  content.push(...imageFigure(
    "18_admissions_verification_hub.png",
    "Admissions Document Verification Hub — Side-by-Side Academic & Identity Credential Audit"
  ));

  content.push(h2P("Step 5.3: Dispatch Conditional & Unconditional Offer Letters"));
  content.push(bulletP("Access Route: /admissions/offers.", "URL:"));
  content.push(bulletP("Click 'Generate Offer Letter'. Select Conditional Offer (stipulating conditions such as deposit payment or final certificate) or Unconditional Offer.", "Action:"));
  content.push(bulletP("Click 'Issue Offer Letter'. System updates application state and dispatches formal acceptance notification to student.", "Action:"));
  content.push(...imageFigure(
    "19_admissions_offers.png",
    "Admissions Offer Letters Management — Conditional & Unconditional Acceptance Issuance"
  ));

  // FLOW 6: TEAM LEADER
  content.push(h1P("FLOW 6: Team Leader — Caseload Balancing, Reassignment & Performance SLAs"));
  content.push(h2P("Step 6.1: Team Leader Command Center"));
  content.push(bulletP("Fast Login: Click 'Team Leader' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /team-leader/dashboard.", "Route:"));
  content.push(bulletP("Monitor branch throughput, unassigned leads queue, and counsellor turnaround SLAs.", "Overview:"));
  content.push(...imageFigure(
    "20_team_leader_dashboard.png",
    "Team Leader Dashboard — Workload Metrics, Branch Throughput, and Turnaround SLAs"
  ));

  content.push(h2P("Step 6.2: Workload Balancing & Application Reassignment"));
  content.push(bulletP("Access Route: /team-leader/assign-applications.", "URL:"));
  content.push(bulletP("Compare counsellor caseloads. Reassign high-priority or unallocated applications from overloaded staff to available counsellors.", "Action:"));
  content.push(...imageFigure(
    "21_team_leader_assign_applications.png",
    "Team Leader Workload Allocation and Counsellor Reassignment Desk"
  ));

  content.push(h2P("Step 6.3: Counsellor Team Members & Capacity Roster"));
  content.push(bulletP("Access Route: /team-leader/team-members.", "URL:"));
  content.push(bulletP("View roster of active branch counsellors, current student caseloads, and historical conversion ratios.", "Action:"));
  content.push(...imageFigure(
    "43_team_leader_team_members.png",
    "Team Leader Counsellor Team Roster and Individual Caseload Capacities"
  ));

  content.push(h2P("Step 6.4: Operational Performance & SLA Analytics"));
  content.push(bulletP("Access Route: /team-leader/performance.", "URL:"));
  content.push(bulletP("Audit average lead-to-offer velocity, funnel drop-off points, and staff performance metrics.", "Action:"));
  content.push(...imageFigure(
    "44_team_leader_performance.png",
    "Team Leader Performance Analytics — Lead Conversion Funnel and Turnaround Time"
  ));

  // FLOW 7: VISA OFFICER
  content.push(h1P("FLOW 7: Visa Officer — Proof of Funds, Medical Clearance & Mock Interview"));
  content.push(h2P("Step 7.1: Visa Officer Command Center"));
  content.push(bulletP("Fast Login: Click 'Visa Officer' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /visa-officer/dashboard.", "Route:"));
  content.push(bulletP("Review caseload partitioned by immigration jurisdiction (UKVI Student Route, US F-1, Canada Study Permit, Australia Subclass 500).", "Overview:"));
  content.push(...imageFigure(
    "22_visa_officer_dashboard.png",
    "Visa Officer Command Center — Caseload Categorized by Immigration Jurisdiction"
  ));

  content.push(h2P("Step 7.2: Active Visa Cases Management"));
  content.push(bulletP("Access Route: /visa-officer/cases.", "URL:"));
  content.push(bulletP("Audit active applicants currently in CAS / Visa stage. Filter by CAS deadline and embassy interview date.", "Action:"));
  content.push(...imageFigure(
    "36_visa_cases.png",
    "Visa Cases Management — Priority Queue and Embassy Timeline Tracking"
  ));

  content.push(h2P("Step 7.3: Visa Documents Hub & Financial Proof of Funds"));
  content.push(bulletP("Access Route: /visa-officer/documents.", "URL:"));
  content.push(bulletP("Audit 28-day consecutive bank balance rule, sponsor affidavit, TB medical certificate, and police clearance.", "Action:"));
  content.push(bulletP("Schedule Mock Visa Interview with prep questionnaire. Mark case as 'Cleared for CAS Issuance'.", "Action:"));
  content.push(...imageFigure(
    "23_visa_documents_hub.png",
    "Visa Documents Hub — 28-Day Proof of Funds Audit, TB Clearance, and Mock Interview Scheduling"
  ));

  // FLOW 8: FINANCE OFFICER
  content.push(h1P("FLOW 8: Finance — Tuition Invoicing, Wire Reconciliation & Commissions"));
  content.push(h2P("Step 8.1: Finance Command Center"));
  content.push(bulletP("Fast Login: Click 'Finance' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /finance/dashboard.", "Route:"));
  content.push(bulletP("Monitor gross invoiced tuition, outstanding receivables, and pending agent commission liabilities.", "Overview:"));
  content.push(...imageFigure(
    "24_finance_dashboard.png",
    "Finance Command Center — Invoiced Tuition, Receivables, and Commission Liabilities"
  ));

  content.push(h2P("Step 8.2: Invoicing & Fee Challan Generation"));
  content.push(bulletP("Access Route: /finance/invoices.", "URL:"));
  content.push(bulletP("Click 'Create Invoice / Challan' for Aarav Patel. Select 'Tuition Deposit' (£2,000) and issue invoice.", "Action:"));
  content.push(...imageFigure(
    "25_finance_invoices.png",
    "Finance Invoices & Fee Challan Generation Desk"
  ));

  content.push(h2P("Step 8.3: Wire Payment Reconciliation & Receipts"));
  content.push(bulletP("Access Route: /finance/payments.", "URL:"));
  content.push(bulletP("Record bank wire payment with transaction reference WIRE-2026-98124. Invoice status transitions to 'Paid'.", "Action:"));
  content.push(...imageFigure(
    "37_finance_payments.png",
    "Finance Payment Reconciliation and Wire Transfer Receipt Generation"
  ));

  content.push(h2P("Step 8.4: External Agent Commission Settlement"));
  content.push(bulletP("Access Route: /finance/commissions.", "URL:"));
  content.push(bulletP("Audit verified student enrollments tagged to external recruitment agents. Calculate 10-15% commission tier and record disbursement.", "Action:"));
  content.push(...imageFigure(
    "38_finance_commissions.png",
    "Finance Commission Settlement Ledger for Recruitment Agency Partners"
  ));

  // FLOW 9: EXTERNAL AGENT
  content.push(h1P("FLOW 9: External Agent — Referral Ingestion, Pipeline & Commissions"));
  content.push(h2P("Step 9.1: Agent Command Center"));
  content.push(bulletP("Fast Login: Click 'Agent' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /agent/dashboard.", "Route:"));
  content.push(bulletP("View unique referral link/code (EDU-AGENT-778), active referrals, enrolled students, and commission ledger balance.", "Overview:"));
  content.push(...imageFigure(
    "26_agent_dashboard.png",
    "External Agent Command Center — Referral Code, Active Pipeline, and Earnings Balance"
  ));

  content.push(h2P("Step 9.2: Submit Candidate Referral"));
  content.push(bulletP("Access Route: /agent/refer-lead.", "URL:"));
  content.push(bulletP("Submit student lead (Zainab Malik, UK destination). Lead is tagged with agent code and ingested into admissions queue.", "Action:"));
  content.push(...imageFigure(
    "27_agent_refer_lead.png",
    "External Agent Lead Referral Submission Form"
  ));

  content.push(h2P("Step 9.3: Referral Pipeline Tracking (Privacy-Preserving)"));
  content.push(bulletP("Access Route: /agent/referrals.", "URL:"));
  content.push(bulletP("Track student progress (Lead to Applied to Offer to Enrolled) without breaching student confidential records.", "Action:"));
  content.push(...imageFigure(
    "41_agent_referrals.png",
    "External Agent Referral Status Pipeline Tracker"
  ));

  content.push(h2P("Step 9.4: Agent Commission Statement"));
  content.push(bulletP("Access Route: /agent/commissions.", "URL:"));
  content.push(bulletP("Audit approved commissions, pending invoice verifications, and historical payout disbursements.", "Action:"));
  content.push(...imageFigure(
    "42_agent_commissions.png",
    "External Agent Commission Statement and Payout Ledger"
  ));

  // FLOW 10: UNIVERSITY PARTNER
  content.push(h1P("FLOW 10: University Partner — Application Assessment & Direct CAS Issuance"));
  content.push(h2P("Step 10.1: Institutional Partner Dashboard"));
  content.push(bulletP("Fast Login: Click 'University' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /university/dashboard.", "Route:"));
  content.push(bulletP("Review applicants received from EduCRM partner agency network, categorized by campus and intake season.", "Overview:"));
  content.push(...imageFigure(
    "28_university_partner_dashboard.png",
    "University Partner Dashboard — Applicant Throughput from Agency Network"
  ));

  content.push(h2P("Step 10.2: Review Candidate Applications & Dossiers"));
  content.push(bulletP("Access Route: /university/applications.", "URL:"));
  content.push(bulletP("Inspect candidate academic credentials and download verified document package (transcripts, IELTS score, passport).", "Action:"));
  content.push(...imageFigure(
    "39_university_applications.png",
    "University Partner Applications Review and Candidate Credential Assessment"
  ));

  content.push(h2P("Step 10.3: Direct CAS / I-20 Document Issuance"));
  content.push(bulletP("Access Route: /university/cas-issuance.", "URL:"));
  content.push(bulletP("Upload official Confirmation of Acceptance for Studies (CAS) / I-20 clearance document for unconditional offer holders.", "Action:"));
  content.push(...imageFigure(
    "40_university_cas_issuance.png",
    "University Direct CAS / I-20 Document Issuance and Visa Clearance Upload"
  ));

  // FLOW 11: SUPPORT SPECIALIST
  content.push(h1P("FLOW 11: Support Specialist — Ticketing Desk & Knowledge Base"));
  content.push(h2P("Step 11.1: Support Command Center"));
  content.push(bulletP("Fast Login: Click 'Support' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /support/dashboard.", "Route:"));
  content.push(bulletP("Monitor open ticket volume, resolution times, and urgent escalation queues.", "Overview:"));
  content.push(...imageFigure(
    "31_support_dashboard.png",
    "Support Command Center — Ticket Volume, Resolution Times, and Escalation Queues"
  ));

  content.push(h2P("Step 11.2: Ticket Management & SLA Resolution"));
  content.push(bulletP("Access Route: /support/tickets.", "URL:"));
  content.push(bulletP("Filter by priority (Critical, High, Medium, Low). Reply to student or agent inquiries and mark as Resolved.", "Action:"));
  content.push(...imageFigure(
    "32_support_tickets.png",
    "Support Tickets Management Desk and SLA Priority Queue"
  ));

  content.push(h2P("Step 11.3: Knowledge Base & FAQ Curation"));
  content.push(bulletP("Access Route: /support/knowledge-base.", "URL:"));
  content.push(bulletP("Curate and publish self-service support documentation on visa requirements, IELTS thresholds, and fee challans.", "Action:"));
  content.push(...imageFigure(
    "33_support_knowledge_base.png",
    "Support Knowledge Base and Self-Service FAQ Documentation Repository"
  ));

  // FLOW 12: SUPER ADMIN, ORG ADMIN & AUDITOR
  content.push(h1P("FLOW 12: Super Admin, Org Admin & Auditor — Governance & Forensics"));
  content.push(h2P("Step 12.1: Platform Super Admin Global Command Center"));
  content.push(bulletP("Fast Login: Click 'Super Admin' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /super-admin/dashboard.", "Route:"));
  content.push(bulletP("Inspect global system health, branch office licenses, and tenant database performance.", "Overview:"));
  content.push(...imageFigure(
    "29_super_admin_dashboard.png",
    "Platform Super Admin Command Center — Global System Health and Tenant Oversight"
  ));

  content.push(h2P("Step 12.2: Multi-Tenant Branch Management"));
  content.push(bulletP("Access Route: /super-admin/tenants.", "URL:"));
  content.push(bulletP("Manage regional branch hubs (London HQ, Delhi Hub, Lahore Regional Desk) with strict tenant isolation.", "Action:"));
  content.push(...imageFigure(
    "45_super_admin_tenants.png",
    "Super Admin Multi-Tenant Branch Management and Subscription Tiers"
  ));

  content.push(h2P("Step 12.3: User Provisioning Across 13 RBAC Tiers"));
  content.push(bulletP("Access Route: /super-admin/users.", "URL:"));
  content.push(bulletP("Provision or update staff permissions across all 13 supported RBAC categories with real-time route guarding.", "Action:"));
  content.push(...imageFigure(
    "46_super_admin_users.png",
    "Super Admin User Access Provisioning across 13 RBAC Tiers"
  ));

  content.push(h2P("Step 12.4: Commission Rules Manager (Org Admin)"));
  content.push(bulletP("Fast Login: Click 'Org Admin' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /commission-manager.", "Route:"));
  content.push(bulletP("Configure agent commission percentages based on destination country, university tier, and intake term.", "Action:"));
  content.push(...imageFigure(
    "47_org_admin_commission_manager.png",
    "Organization Admin Commission Rules and Payout Tier Configuration"
  ));

  content.push(h2P("Step 12.5: AI Lead Scoring Configuration Engine"));
  content.push(bulletP("Access Route: /lead-scoring.", "URL:"));
  content.push(bulletP("Adjust algorithmic score weights for budget readiness, response velocity, and academic qualifications.", "Action:"));
  content.push(...imageFigure(
    "48_org_admin_lead_scoring.png",
    "AI Lead Scoring Configuration Engine and Behavioral Weight Matrix"
  ));

  content.push(h2P("Step 12.6: Data Quality & Deduplication Dashboard"));
  content.push(bulletP("Access Route: /data-quality.", "URL:"));
  content.push(bulletP("Audit profile completeness, identify invalid phone numbers, and resolve duplicate prospective leads.", "Action:"));
  content.push(...imageFigure(
    "49_org_admin_data_quality.png",
    "Data Quality & Record Deduplication Dashboard"
  ));

  content.push(h2P("Step 12.7: Immutable Audit Trail & Regulatory Compliance"));
  content.push(bulletP("Fast Login: Click 'Auditor' in Demo Accounts drawer.", "Trigger:"));
  content.push(bulletP("URL: /auditor/audit-trail.", "Route:"));
  content.push(bulletP("Audit events (APPLICATION_STAGE_CHANGED, DOCUMENT_VERIFIED, OFFER_ISSUED). Every entry records actor ID, role, previous value, new value, IP address, and cryptographic timestamp.", "Forensics:"));
  content.push(...imageFigure(
    "30_auditor_trail.png",
    "Auditor Immutable Audit Trail — Tamper-Evident System Event Forensics"
  ));

  content.push(h2P("Step 12.8: GDPR Compliance & Right-to-be-Forgotten Inspection"));
  content.push(bulletP("Access Route: /auditor/compliance-inspect.", "URL:"));
  content.push(bulletP("Inspect GDPR consent logs, data deletion requests, and privacy consent tracking.", "Action:"));
  content.push(...imageFigure(
    "34_auditor_compliance_inspect.png",
    "Auditor Compliance Inspection — GDPR Consent Records and Data Privacy Logs"
  ));

  content.push(h2P("Step 12.9: Forensic System Logs"));
  content.push(bulletP("Access Route: /auditor/system-logs.", "URL:"));
  content.push(bulletP("Inspect application exception logs, authentication failures, and API status monitoring.", "Action:"));
  content.push(...imageFigure(
    "35_auditor_system_logs.png",
    "Auditor Forensic System Logs and Security Event Monitoring"
  ));

  // SECTION 13: EVALUATION RUBRIC
  content.push(h1P("13. Master Instructor Evaluation Rubric & Sign-Off Checklist"));
  content.push(bodyP(
    "Instructors and evaluators can verify each milestone against the live system and mark their assessment:"
  ));
  content.push(createTable(
    ["Milestone", "Evaluated Role", "Core System Capability Verified", "Status"],
    [
      ["Milestone 1", "Student (New)", "Google Gemini AI CV Extractor, Zero-Redundancy 4-Stage Onboarding", "PASSED [x]"],
      ["Milestone 2", "Student (Reg)", "Course Catalog Search, Entry Criteria Benchmark, 11-Step Wizard", "PASSED [x]"],
      ["Milestone 3", "Student (Vault)", "Document Vault KYC Verification, Fee Challans, Counsellor Chat", "PASSED [x]"],
      ["Milestone 4", "Counsellor", "Lead Deduplication, 360° Student Dossier, Algorithmic Matcher", "PASSED [x]"],
      ["Milestone 5", "Admissions", "Admissions Verification Hub, GPA/IELTS Audit, Conditional Offers", "PASSED [x]"],
      ["Milestone 6", "Team Leader", "Team Workload Balancing, Application Reassignment, Counsellor SLAs", "PASSED [x]"],
      ["Milestone 7", "Visa Officer", "28-Day Proof of Funds Rule, TB Medical, Mock Visa Interview Prep", "PASSED [x]"],
      ["Milestone 8", "Finance", "Tuition Challans, Wire Payment Reconciliation, Agent Commission Ledger", "PASSED [x]"],
      ["Milestone 9", "Agent", "Lead Ingestion Form, Non-Disclosive Pipeline, Commission Statement", "PASSED [x]"],
      ["Milestone 10", "University", "Agency Application Review, Document Package Download, CAS Upload", "PASSED [x]"],
      ["Milestone 11", "Support", "Ticket SLA Resolution, Priority Escalation Desk, Knowledge Base FAQ", "PASSED [x]"],
      ["Milestone 12", "Admin & Auditor", "13-Tier RBAC Provisioning, Immutable Audit Trail, GDPR Forensics", "PASSED [x]"]
    ],
    [16, 20, 50, 14]
  ));
  content.push(bodyP(""));
  content.push(bodyP(
    "Evaluator Signature: _______________________      Date: ______________      Evaluation Result: [ PASS / DISTINCTION ]",
    { bold: true, color: COLOR_DARK }
  ));

  const doc = new Document({
    sections: [
      {
        headers: { default: createHeader() },
        footers: { default: createFooter() },
        children: content
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputDocxPath, buffer);
  fs.writeFileSync(docsDocxPath, buffer);
  console.log(`Successfully generated DOCX files!`);
  console.log(`  -> Root: ${outputDocxPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  -> Docs: ${docsDocxPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

buildWordDocument().catch(err => {
  console.error("Error building Word document:", err);
  process.exit(1);
});
