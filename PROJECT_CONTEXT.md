# EduCRM — Project Master Context & Architectural Reference

This document serves as the persistent, single source of truth for **EduCRM**. When starting any new AI assistant session, this file contains the comprehensive architecture, design patterns, end-to-end flows, and critical conventions of this repository.

---

## 1. Project High-Level Identity

- **Name**: EduCRM (Education CRM)
- **Domain**: Cloud-Native Enterprise Higher Education Admissions & International Student Recruitment Platform
- **Live Deployment**: [https://education-crm-9fee2.web.app](https://education-crm-9fee2.web.app)
- **Repository**: [https://github.com/MujtabaZaheer/CRM.git](https://github.com/MujtabaZaheer/CRM.git)
- **Tech Stack**: React 19, TypeScript 5.7, Vite 6.0, Tailwind CSS 4.0, Firebase (Auth, Firestore, Hosting), Google Gemini 3.8 Flash AI, Vitest.

---

## 2. Authentication, Roles & RBAC Architecture

The system supports **10+ distinct user roles** with strict tenant isolation and role-guarded routes:

| Role Identifier | Role Name | Primary Responsibility | Default Landing Route |
| :--- | :--- | :--- | :--- |
| `platform_super_admin` | Platform Super Admin | Global multi-tenant administration, system logs, branch oversight | `/` (Dashboard) |
| `org_admin` | Organization Admin | Branch management, staff provisioning, commission tiers | `/` (Dashboard) |
| `counsellor` | Education Counsellor | Student lead advisory, university matching, application reviews | `/counsellor/leads` |
| `office_manager` | Regional Office Manager | Regional hub performance, counsellor assignment | `/counsellor/dashboard` |
| `team_leader` | Admissions Team Leader | Workload balancing, application triage, lead reassignment | `/team-leader` |
| `admissions_officer` | Admissions Officer | Document validation, academic threshold audit, university submission | `/admissions` |
| `finance_officer` | Finance & Accounts Officer | University commission invoicing, agent payouts | `/finance` |
| `visa_officer` | Visa & Immigration Officer | Proof of funds, CAS/I-20 clearance, mock visa interviews | `/visa` |
| `compliance_officer` | Compliance & Auditor | GDPR consent records audit, fraud prevention | `/compliance` |
| `support_user` | Support Specialist | User issue tickets, platform assistance | `/support` |
| `external_agent` | External Recruitment Agent | Student referrals, referral code tracking, commission tier | `/agent/dashboard` |
| `university_partner` | University Partner Rep | Partner institution application reviews, offer letters | `/partner/dashboard` |
| `student` | International Student | Master profile, AI CV parsing, application wizard | `/student/dashboard` |

---

## 3. End-to-End Application Lifecycle & State Machine

Every student application transitions through deterministic stages configured in [`src/utils/applicationWorkflowConfig.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/utils/applicationWorkflowConfig.ts):

```
Draft ──> Initial Review ──> Submitted to University ──> Conditional Offer ──> Unconditional Offer ──> CAS / Visa Stage ──> Enrolled ──> Commission Settled
```

1. **Draft**: Student or Agent initiates application. AI CV auto-fill populates identity, education, and language test records.
2. **Initial Review**: Admissions Officer & Counsellor verify documents in the Admissions Document Verification Hub.
3. **Submitted to University**: Forwarded to the University Partner portal.
4. **Conditional / Unconditional Offer**: Partner issues official offer letters directly through the platform.
5. **CAS / Visa Stage**: Visa Officer verifies bank statements, tuberculosis screening, and issues CAS/I-20 clearance.
6. **Enrolled & Commission**: Finance logs enrolment, bills university, and releases commission to recruitment agents.

---

## 4. Student Onboarding & Zero-Redundancy Principle

### The Core Rule:
**Never ask the student for the same information twice.**

1. **Registration (`/register?role=student`)**:
   - Accepts manual input OR 1-click **AI CV / Resume scanner**.
   - Gemini 3.8 Flash extracts: First Name, Last Name, Email, Phone, Country, Nationality, Date of Birth, Gender, City, Passport Number, Academic History, and English Test Scores.
   - Data is stored in:
     - Firestore: `users/{uid}` and `students/{uid}`
     - Browser: `sessionStorage` (`student_registration_first_name`, `student_registration_last_name`, `student_registration_phone`, `student_registration_country`, `student_registration_nationality`, `student_extracted_cv`).

2. **Onboarding Stage 1 (`/student/onboarding/step-1`)**:
   - Loads from `students/{uid}`, fallback to `users/{uid}`, fallback to `sessionStorage` cache.
   - All personal information fields (First Name, Last Name, Email, Phone, Country, Nationality) are **pre-hydrated**.
   - Student only needs to select their **Desired Study Level** and confirm/add academic qualifications.

3. **Application Wizard (`/student/applications/wizard`)**:
   - Multi-step wizard (Overview → Personal Info → Academic History → English Test → SOP → University Questions → Documents → Declarations → Submit).
   - In Step 2 (Personal Info) & Step 3 (Academic History), data is **100% pre-filled** from the student master profile.
   - Step 2 includes the **Passport Number** field.
   - Step 4 (English Proficiency) pre-fills test scores (IELTS, PTE, TOEFL, Duolingo, MOI) and checks live against program requirements.
   - Submitting an application automatically triggers two-way sync back to `students/{uid}` master profile.

---

## 5. AI Engine & CV Extraction Pipeline

- **File**: [`src/utils/cvExtractor.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/utils/cvExtractor.ts)
- **Primary Parser**: Multi-modal Google Gemini 3.8 Flash (`gemini-3.8-flash`) parsing PDF/Word documents using `pdfjs-dist` (with dedicated web worker) and `mammoth`.
- **Offline / Fallback Parser**: 1,000+ line deterministic heuristic regex engine capable of full client-side parsing without API keys:
  - Name cleaning & prefix stripping (`Mr`, `Ms`, `Dr`, etc.)
  - Demonym-to-country normalization (`Pakistani` → `Pakistan`, `British` → `United Kingdom`, etc.)
  - Anti-binary junk phone filter (rejects repeating binary strings e.g. `222222222222222`)
  - Multi-degree table & text parser (extracts LUMS, NUST, FAST, Punjab University, High School, etc.)
  - Standardized English test detection (IELTS, PTE, TOEFL, Duolingo, MOI)
  - Passport number detection (`[A-Za-z][0-9]{7,8}`)
- **No Mock Defaults**: Real parsed fields are returned. Empty fields remain empty rather than populated with placeholder test data.

---

## 6. Directory Structure & Key Files

```
CRM/
├── PROJECT_CONTEXT.md                <-- THIS FILE (Complete Project Knowledge & Context)
├── AGENTS.md                         <-- AI Agent Instructions & Guidelines
├── package.json                      <-- Project Dependencies (React 19, Vite 6, Tailwind 4, Zod, Firebase)
├── firebase.json                     <-- Firebase Hosting (public: "dist", SPA rewrites to /index.html)
├── firestore.rules                   <-- Firestore Security Rules (Tenant Scoping, Role Authorization)
│
├── src/
│   ├── components/
│   │   ├── ai/
│   │   │   └── StudentCVUploader.tsx         # AI CV Upload widget (Gemini 3.8 Flash badge)
│   │   ├── admissions/
│   │   │   └── AdmissionsDocumentVerificationHub.tsx # Admissions triage and doc verification
│   │   ├── counsellor/
│   │   │   └── ApplicationDossierModal.tsx   # Comprehensive student dossier for counsellors
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                   # Role-filtered navigation sidebar
│   │   │   └── Topbar.tsx                    # Header with notifications & profile
│   │   └── portal/
│   │       ├── AgentPortalWorkspace.tsx      # Agent portal dashboard
│   │       └── UniversityPortalWorkspace.tsx # University partner dashboard
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx                   # Auth state, appUser, impersonation, demo login
│   │   └── GlobalDataContext.tsx            # Realtime Firestore listeners & caches
│   │
│   ├── pages/
│   │   ├── Register.tsx                      # Multi-role registration with CV scanner
│   │   ├── VerifyEmail.tsx                   # Email verification screen with demo bypass
│   │   ├── Applications.tsx                  # Staff applications management
│   │   ├── Leads.tsx                         # Lead lifecycle and deduplication
│   │   ├── portal/
│   │   │   ├── onboarding/
│   │   │   │   └── StudentOnboardingStage1.tsx # Step 1 of student onboarding
│   │   │   └── StudentApplicationWizard.tsx   # 11-step complete application wizard
│   │
│   ├── schemas/
│   │   └── studentAdmissionSchema.ts         # Zod schemas for application admission validation
│   │
│   ├── types/
│   │   ├── student.ts                        # Student, AcademicRecord, QualificationLevel interfaces
│   │   ├── application.ts                    # Application, Stage, and Status interfaces
│   │   ├── user.ts                           # AppUser and UserRole definitions
│   │   └── registrationConfig.ts             # Role-specific registration field configurations
│   │
│   └── utils/
│       ├── cvExtractor.ts                    # Gemini AI + Heuristic CV extractor engine
│       ├── geminiClient.ts                   # Gemini API client & fallback caller
│       ├── profileCompleteness.ts            # Scoring algorithm for student profile completeness
│       └── applicationWorkflowConfig.ts      # Stage transitions, permissions, and pipeline engine
│
└── tests/
    └── unit/
        └── cvExtractor.test.ts               # Automated Vitest test suite for CV parser
```

---

## 7. Developer Rules & Commands Cheatsheet

- **Development Server**: `npm run dev` (Runs locally on `http://localhost:5173`)
- **Type-Check**: `npm run typecheck` (`tsc --noEmit`)
- **Unit Testing**: `npm test -- --run` (`vitest run --pool=forks --no-file-parallelism`)
- **Production Build**: `npm run build` (`tsc -b && vite build`)
- **Deploy Live to Firebase**: `npx firebase-tools deploy --only hosting`
- **Windows Terminal Note**: PowerShell execution policy may restrict `npm.ps1`. Always use `cmd /c "npm ..."` or `npx.cmd` if PowerShell throws script execution errors.

---

*Keep this file updated whenever new architectural features, routes, or workflows are added.*
