# 📘 EduCRM — Master System Architecture & Project Technical Report

> **Project Name**: EduCRM — Enterprise Multi-Tenant Global Higher Education Admissions & CRM Platform  
> **Author & Lead Engineer**: Mujtaba Zaheer (BS Software Engineering, Capital University of Science and Technology - CUST)  
> **Primary Technology Stack**: React 19, TypeScript 5.7, Tailwind CSS v4, Vite 6.0, Firebase (Auth, Firestore, Storage, Hosting), Google Gemini 3.8 Flash AI, Vitest, Playwright  
> **Live Production URL**: [education-crm-9fee2.web.app](https://education-crm-9fee2.web.app)  
> **Repository Target**: `MujtabaZaheer/CRM`  
> **Document Purpose**: Exhaustive technical and architectural dossier designed for AI context ingestion, technical evaluations, academic defenses, and developer onboarding.

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [End-to-End System Architecture & Tech Stack](#2-end-to-end-system-architecture--tech-stack)
3. [Multi-Tenant Architecture & Organizational Isolation](#3-multi-tenant-architecture--organizational-isolation)
4. [User Roles & Fine-Grained RBAC Access Matrix (13 Roles)](#4-user-roles--fine-grained-rbac-access-matrix-13-roles)
5. [The 20-Stage Application Lifecycle Pipeline (Finite State Machine)](#5-the-20-stage-application-lifecycle-pipeline-finite-state-machine)
6. [Deep-Dive Module & Feature Breakdown](#6-deep-dive-module--feature-breakdown)
   - 6.1 Authentication, Onboarding Guard & Multi-Role Demo Launcher
   - 6.2 Top-of-Funnel Lead Management, Dynamic Form Builder & Scoring
   - 6.3 Student Self-Service Portal & 11-Step Application Wizard
   - 6.4 Gemini 3.8 Flash AI Engine & Client-Side Document Ingestion
   - 6.5 Admissions Desk & 1-Click Offer Issuance
   - 6.6 Finance Desk, Fee Challans & Automated Invoicing
   - 6.7 Visa & Immigration Workspace (CAS / I-20 Clearance)
   - 6.8 External Agent Referral Network & Commission Engine
   - 6.9 University Partner Direct Admissions Portal
   - 6.10 Auditor & Compliance Desk (Immutable Logs & GDPR)
   - 6.11 Support Desk & Self-Service Knowledge Base
7. [Cloud Firestore NoSQL Database Schema & Collections](#7-cloud-firestore-nosql-database-schema--collections)
8. [Security Governance & Firestore Declarative Rules](#8-security-governance--firestore-declarative-rules)
9. [Automated Quality Assurance & Testing Suite](#9-automated-quality-assurance--testing-suite)
10. [Directory Structure & Codebase Organization](#10-directory-structure--codebase-organization)
11. [Local Development, Environment Setup & Deployment Guide](#11-local-development-environment-setup--deployment-guide)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Industry Problem
International higher education recruitment consultancies and university placement agencies operate in an environment fraught with operational friction:
- **Spreadsheet Fragmentation**: Counselors and branch offices track candidate dossiers on disconnected spreadsheets, resulting in data loss, duplicated contacts, and missed intake deadlines.
- **Verification Bottlenecks**: Academic transcripts, English proficiency test reports (IELTS, PTE, TOEFL, Duolingo), and passports require manual review, consuming hours per applicant.
- **Inter-Departmental Hand-off Failures**: Friction between counseling, admissions, finance (deposits/tuition), and visa teams creates blind spots; status updates are often days late.
- **Compliance & GDPR Exposures**: Handling sensitive identity and financial proofs without strict access controls risks privacy breaches and immigration authority sanctions.
- **Opaque Commission Accounting**: External recruitment sub-agents face delayed commission reconciliations, damaging partner relationships.

### 1.2 The EduCRM Solution
**EduCRM** resolves these challenges through a unified, cloud-native, multi-tenant admissions lifecycle management system. Built on **React 19**, **TypeScript**, and **Google Firebase**, augmented by **Google Gemini 3.8 Flash AI**, EduCRM automates the entire student journey:
1. Top-of-funnel lead acquisition via embeddable dynamic forms and algorithmic scoring (0–100).
2. Instant student CV/resume parsing via multimodal AI with zero manual typing.
3. Self-service student portal with an 11-step interactive university application lodgement wizard.
4. Deterministic 20-stage state machine segregating tasks across four dedicated operational desks: Counselling, Admissions (1-click offers), Finance (automated challans), and Visa (CAS/I-20 readiness).
5. Multi-tier external agent referral network with automated tiered commission disbursement.
6. Direct university partner portal access for accelerated offer letters and CAS number releases.
7. Strict role-based access control (RBAC) supporting 13 distinct roles with immutable audit logging and GDPR compliance logging.

---

## 2. End-to-End System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                          |
|  React 19 SPA (Vite 6)  *  TypeScript 5.7  *  Tailwind CSS v4  *  Lucide React Icons    |
|  Recharts Analytics  *  PDF.js Client Extractor  *  Mammoth.js DOCX Parser              |
+-----------------------------------------------------------------------------------------+
                                      │                     │
                       HTTPS / WSS    │                     │  REST / Client SDK
                                      ▼                     ▼
+-----------------------------------------------------------------------------------------+
|                                  AI & PARSING TIER                                      |
|  Google Gemini 3.8 Flash API (Multimodal prompt engineering)                            |
|  Multi-model automatic fallback (gemini-1.5-flash / gemini-1.5-pro)                      |
|  1,200+ Line Heuristic Regex & Demonym Extraction Fallback Engine (Offline Mode)        |
+-----------------------------------------------------------------------------------------+
                                      │
                                      ▼
+-----------------------------------------------------------------------------------------+
|                           BACKEND-AS-A-SERVICE (BAAS) TIER                              |
|  Google Firebase Authentication  (JWT session tokens, custom claims, email verify)     |
|  Cloud Firestore NoSQL (Realtime listeners via onSnapshot, composite indexes)           |
|  Firebase Cloud Storage (Encrypted student documents, passports, offer PDFs)            |
|  Declarative Security Rules (firestore.rules, storage.rules enforcing multi-tenancy)    |
|  Firebase Cloud Hosting (Global CDN edge caching, sub-second TTFB)                     |
+-----------------------------------------------------------------------------------------+
```

### Detailed Tech Stack Matrix:
| Domain | Technology | Version | Purpose in EduCRM |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.0.0 | High-concurrency UI rendering, Hooks, Contexts |
| **Language** | TypeScript | ~5.7.2 | End-to-end type safety, strict null checking |
| **Build & Dev Tool** | Vite | 6.0.11 | Fast HMR, Rollup vendor chunking, sub-second builds |
| **Styling** | Tailwind CSS | 4.0.0 | Modern utility styling, glassmorphism, responsive grid |
| **Icons** | Lucide React | 0.474.0 | Consistent modern iconography |
| **Database** | Cloud Firestore | 11.2.0 | Reactive NoSQL document store with live subscriptions |
| **Authentication** | Firebase Auth | 11.2.0 | Email/Password, email verification, session persistence |
| **Cloud Storage** | Firebase Storage | 11.2.0 | Secure file storage for student dossiers and letters |
| **Generative AI** | Google Gemini API | 3.8 Flash | Resume OCR, auto-filling, eligibility matching |
| **Client Document OCR** | PDF.js + Mammoth | 6.3 / 1.12 | In-browser parsing of `.pdf` and `.docx` CVs |
| **Data Visualization** | Recharts | 3.10.1 | Application funnels, monthly intake velocity charts |
| **Unit / Integration Testing**| Vitest + RTL | 4.1.10 | 27 test suites, 188 automated unit/integration tests |
| **End-to-End Testing** | Playwright | 1.63.0 | Headless browser simulations for full user journeys |
| **Deployment / Edge** | Firebase Hosting | Production | Global CDN, SSL termination, custom domain routing |

---

## 3. Multi-Tenant Architecture & Organizational Isolation

EduCRM is designed from the ground up as a **multi-tenant SaaS platform**:
1. **Tenant Isolation Model**: Every core record (`leads`, `students`, `applications`, `documents`, `invoices`, `tasks`) contains a `tenantId` field corresponding to an organization (e.g. `tenant-london`, `tenant-dubai`, `tenant-islamabad`).
2. **Organizational Hierarchy**:
   - `Platform Super Admin` operates above all tenants with global visibility.
   - `Organization Admin` manages their specific agency tenant, branch offices, and staff.
   - `Office Manager` supervises an assigned regional branch office (`campusCity` / `branchId`).
   - `Team Leader` balances workloads for specific counselor teams within an office.
   - `Counsellor` accesses only assigned leads, students, and applications.
3. **Database Rules Enforcement**:
   In `firestore.rules`, every read, write, update, and delete operation validates tenant ownership:
   ```javascript
   function userTenant() {
     return hasUserDoc() && ('tenantId' in profile()) ? profile().tenantId : 'tenant-london';
   }
   function matchesTenant(data) {
     return isPlatformAdmin() || (!('tenantId' in data) || data.tenantId == userTenant());
   }
   ```
   Cross-tenant writes are strictly blocked at the database engine level.

---

## 4. User Roles & Fine-Grained RBAC Access Matrix (13 Roles)

EduCRM supports 13 strictly isolated user roles:

| Role Identifier | Role Label | Department / Scope | Primary Capabilities & Permissions |
| :--- | :--- | :--- | :--- |
| `platform_super_admin` | Platform Super Admin | Global Infrastructure | Full system root read/write, tenant provisioning, system health latency monitoring, user role overrides, audit trail oversight. |
| `org_admin` | Organization Admin | Agency HQ | Agency-wide user management, branch office creation, university catalog management, commission tier configuration. |
| `office_manager` | Office Manager | Branch Office | Branch team workload balancing, unassigned lead triage, regional KPI monitoring, counselor attendance/activity tracking. |
| `team_leader` | Team Leader | Admissions Team | Counselor application reassignment, team pipeline velocity analysis, counselor workload distribution, interview prep tasks. |
| `counsellor` | Education Counsellor | Front-Desk Counseling | Lead intake, student profile building, program matching, document collection, application draft preparation. |
| `admissions_officer` | Admissions Officer | Admissions Desk | 20-stage application queue review, credential verification, 1-click Conditional & Unconditional offer letter generation, university dispatch. |
| `visa_officer` | Visa Officer | Visa & Immigration Desk | CAS/I-20 tracking, proof-of-funds bank statement audit, GTE assessment, mock visa interviews, biometrics and visa outcome recording. |
| `finance_officer` | Finance & Accounts | Finance Desk | Fee challan and invoice creation (USD, GBP, EUR, AUD, CAD), student deposit reconciliation, refund review, agent commission settlement. |
| `compliance_officer` | Compliance Officer | Audit & Legal | GDPR consent verification, document authenticity auditing, immigration compliance verification, compliance badge issuance. |
| `support_user` | Support Specialist | Technical Support | Ticket queue management (`TKT-2026-XXXX`), public replies, internal agent troubleshooting notes, Knowledge Base publishing, SLA breach monitoring. |
| `auditor` | Auditor / Read-Only | Compliance & Oversight | Read-only inspection across all collections, immutable audit log searches (200+ event types), compliance certificate exports. |
| `external_agent` | External Referral Agent | External Partner Network | Referral link generator (`?ref=agent123`), student lead referral submission, read-only tracking of referred applications, commission ledger. |
| `university_partner` | University Partner Rep | University Admissions | Direct partner portal review for submitted dossiers, 1-click offer issuance, CAS reference code entry, institutional intake seat updates. |
| `student` | Student / Applicant | Self-Service Portal | Account creation at `/register`, AI CV auto-fill, 4-stage onboarding, 11-step application wizard, real-time application tracker, document vault. |

---

## 5. The 20-Stage Application Lifecycle Pipeline (Finite State Machine)

The application lifecycle follows a deterministic, 20-stage Finite State Machine (FSM) governed by `stageAuthorization.ts`. Premature or unauthorized status transitions are blocked both on the client and in `firestore.rules`.

```
====================================================================================================
COUNSELLING DESK (Counsellor / Team Leader / Office Manager)
[1. Draft] ──> [2. Initial Review] ──> [3. Documents Pending] ──> [4. Ready for Submission] ──> [5. Submitted]
====================================================================================================
                                      │
                                      ▼
====================================================================================================
ADMISSIONS DESK (Admissions Officer / University Partner)
[6. University Reviewing] ──> [7. Additional Info Requested] ──> [8. Conditional Offer] ──> [9. Unconditional Offer]
====================================================================================================
                                      │
                                      ▼
====================================================================================================
FINANCE DESK (Finance Officer)
[10. Deposit Pending (Fee Challan Issued)] ──> [11. Deposit Paid (Payment Cleared)]
====================================================================================================
                                      │
                                      ▼
====================================================================================================
VISA DESK (Visa & Immigration Officer)
[12. CAS / COE Pending] ──> [13. CAS Issued] ──> [14. Visa Preparation] ──> [15. Visa Submitted] ──> [16. Visa Approved]
====================================================================================================
                                      │
                                      ▼
====================================================================================================
FINAL OUTCOME
[17. Enrolled]  (Terminal Success Milestone)
----------------------------------------------------------------------------------------------------
Terminal Exception Stages: [18. Deferred] | [19. Withdrawn] | [20. Rejected]
====================================================================================================
```

### Stage Authorization Matrix:
| Stage Name | Department | Authorized Roles | Automated Trigger / System Effect |
| :--- | :--- | :--- | :--- |
| **Draft** | Counselling | Counsellor, Team Leader, Agent, Admin | Creates application record in `applications` |
| **Initial Review** | Counselling | Counsellor, Team Leader, Admin | Counselor audits academic eligibility |
| **Documents Pending** | Counselling | Counsellor, Team Leader, Agent, Admin | Sends document request notification to student |
| **Ready for Submission** | Counselling | Counsellor, Team Leader, Admin | Locks student self-editing; ready for admissions triage |
| **Submitted** | Counselling | Counsellor, Team Leader, Admin | Dispatches application to Admissions Desk queue |
| **University Reviewing** | Admissions | Admissions Officer, Partner, Admin | Marks portfolio under university faculty evaluation |
| **Additional Info Requested** | Admissions | Admissions Officer, Partner, Admin | Prompts counselor/student for supplementary evidence |
| **Conditional Offer** | Admissions | Admissions Officer, Partner, Admin | 1-Click generates Conditional Offer letter; sets deadline |
| **Unconditional Offer** | Admissions | Admissions Officer, Partner, Admin | Pre-requisites cleared; automatically routes to Finance |
| **Deposit Pending** | Finance | Finance Officer, Admin | Automatically generates tuition deposit invoice / fee challan |
| **Deposit Paid** | Finance | Finance Officer, Admin | Clears deposit receipt; unlocks CAS/COE request queue |
| **CAS / COE Pending** | Visa | Visa Officer, Admin | Prompts partner university for CAS/I-20 issuance |
| **CAS Issued** | Visa | Visa Officer, Partner, Admin | Records CAS Reference Number and issuance date |
| **Visa Preparation** | Visa | Visa Officer, Admin | Financial statements & mock interview checklists active |
| **Visa Submitted** | Visa | Visa Officer, Admin | Embassy visa application reference recorded |
| **Visa Approved** | Visa | Visa Officer, Admin | Visa grant confirmation logged; prepares arrival checklist |
| **Enrolled** | Admissions | Admissions Officer, Team Leader, Admin | Final enrolment confirmed; triggers agent commission payout |
| **Deferred** | Admissions | Admissions Officer, Counsellor, Admin | Shifts application target intake to future term |
| **Withdrawn** | Counselling | Counsellor, Admissions Officer, Admin | Records withdrawal reason and archives file |
| **Rejected** | Admissions | Admissions Officer, Partner, Visa, Admin | Logs rejection grounds (academic deficiency or visa refusal) |

---

## 6. Deep-Dive Module & Feature Breakdown

### 6.1 Authentication, Onboarding Guard & Multi-Role Demo Launcher
- **Universal Sign-In (`/login`)**: Supports email/password authentication via Firebase Auth with session persistence and error sanitization.
- **One-Click Demo Launcher**: Floating bottom-right speed-dial granting instantaneous access to all 12 platform roles without typing credentials.
- **Student Onboarding Guard (`StudentOnboardingGuard.tsx`)**: Intercepts authenticated student sessions. If profile completeness or required onboarding stages are incomplete, automatically routes the user to `/student/onboarding/step-1` through `step-4` before allowing dashboard access.
- **Email Verification (`/verify-email`)**: Handles verification state with an instant demo pass-through bypass for frictionless testing.

### 6.2 Top-of-Funnel Lead Management, Dynamic Form Builder & Scoring
- **Dynamic Form Builder (`/form-builder`)**: Drag-and-drop designer allowing agency administrators to configure lead intake questionnaires with custom field types (text, dropdown, file upload, country picker).
- **Public Landing Page (`/public/forms/:formId`)**: High-performance, unauthenticated public endpoints that validate and ingest student inquiries directly into Cloud Firestore (`leads` collection).
- **Algorithmic Lead Scoring (0–100) (`LeadScoringConfig.tsx`)**: Evaluates incoming leads based on:
  - English language proficiency test presence (+25 points)
  - Completed academic qualification details (+25 points)
  - Proximity of desired intake (+20 points)
  - Financial sponsorship readiness (+20 points)
  - Valid international phone and verified email (+10 points)
- **Automated Deduplication & Routing**: Matches normalized phone numbers and emails to prevent duplicate entries; implements round-robin counselor routing weighted by destination country specialty.

### 6.3 Student Self-Service Portal & 11-Step Application Wizard
- **Student Dashboard (`/student/dashboard`)**: Displays real-time application cards, stage milestone indicators, profile completeness progress bar, pending document requests, and invoice summaries.
- **11-Step Application Wizard (`StudentApplicationWizard.tsx`)**:
  - *Step 1: Programme Overview*: Tuition fees, intake cycles, minimum academic criteria, and English requirements.
  - *Step 2: Personal Details Verification*: Auto-populated from student profile with inline editing.
  - *Step 3: Academic History*: Multiple qualification records (High School, Bachelor's, Master's) with GPA and passing years.
  - *Step 4: English Language Proficiency*: Interactive selector (IELTS, PTE, TOEFL, Duolingo, MOI) comparing applicant scores against university thresholds.
  - *Step 5: Programme Prerequisites*: Validates specific degree entry requirements.
  - *Step 6: University-Specific Questions*: Intake-specific questionnaires.
  - *Step 7: Document Upload Vault*: Drag-and-drop file ingestion for transcripts, passports, and CVs.
  - *Step 8: Country & Visa History*: Captures previous visa refusals, study gaps, and immigration history.
  - *Step 9: Application Review*: Summary dossier verification.
  - *Step 10: Legal Declaration & GDPR Consent*: Timestamped declaration agreement.
  - *Step 11: Submission & Two-Way Profile Sync*: Writes the application document while synchronizing new details back to the master student profile (`students/{uid}`).

### 6.4 Gemini 3.8 Flash AI Engine & Client-Side Document Ingestion
- **Dual-Engine Architecture (`cvExtractor.ts`)**:
  1. *Primary Engine*: Google Gemini 3.8 Flash API (`geminiClient.ts`) consuming parsed document text with strict JSON schema instructions.
  2. *Offline Heuristic Engine*: A 1,200+ line local regex and parsing pipeline that executes if no API key is present or if offline, extracting names, emails, phones, education history, and English scores.
- **Zero-Server In-Browser Extraction**: Uses `pdfjs-dist` to extract text from PDFs and `mammoth.js` for DOCX files directly inside the client browser, eliminating server-side file upload bottlenecks.
- **Extracted Fields**:
  - First, Last, and Full Name
  - Cleaned Email & International E.164 Phone
  - Country of Residence & Nationality Demonym normalization
  - Complete Academic Qualification records
  - English proficiency tests with scores and validity dates
  - Desired study level (Undergraduate, Postgraduate, PhD)

### 6.5 Admissions Desk & 1-Click Offer Issuance
- **Admissions Queue (`/admissions/applications`)**: Filterable workspace listing submitted student dossiers sorted by urgency, intake date, and university partner.
- **Document Verification Hub**: Side-by-side document previewer enabling admissions officers to verify transcripts and mark documents as `verified` or `rejected` with remarks.
- **1-Click Offer Generation**: Generates official **Conditional** or **Unconditional** offer letters, computes required deposit amounts, establishes response deadlines, and updates Firestore in real-time.

### 6.6 Finance Desk, Fee Challans & Automated Invoicing
- **Multi-Currency Invoicing (`/finance/invoices`)**: Creates structured invoices across USD, GBP, EUR, AUD, CAD, and PKR.
- **Automated Fee Challan Generation**: Triggered automatically upon issuance of an Unconditional Offer, producing student fee payment slips with unique reference codes.
- **Payment Reconciliation (`/finance/payments`)**: Records payment receipts (Bank Transfer, Credit Card, Cash, Online Gateway) and updates balance-due states.
- **Student Refunds**: Formal workflow for review, approval, and rejection of student deposit refunds.

### 6.7 Visa & Immigration Workspace (CAS / I-20 Clearance)
- **CAS / I-20 Tracking**: Manages Confirmation of Acceptance for Studies (CAS) reference numbers, university release timestamps, and expiration dates.
- **Financial Proof & Genuine Temporary Entrant (GTE) Audit**: Verifies 28-day bank balance holding periods, sponsor affidavits, and source-of-income documentation.
- **Biometrics & Embassy Preparation**: Tracks appointment dates, records mock visa interview scores, and logs final visa grant or refusal outcomes.

### 6.8 External Agent Referral Network & Commission Engine
- **Agent Portal (`/agent/*`)**: External recruitment partners log in to track their student pipeline in read-only mode, submit new prospective candidate dossiers, and copy unique referral links.
- **Commission Engine (`/finance/commissions`, `CommissionManager.tsx`)**:
  - Automatically calculates partner commissions once a referred student reaches `Enrolled` status.
  - Multi-tier structure: **Bronze** (10%), **Silver** (12.5%), **Gold** (15%), and **Platinum** (17.5%).
  - Tracks commission status: `Pending` → `Eligible` → `Approved` → `Paid`.

### 6.9 University Partner Direct Admissions Portal
- **University Workspace (`/university/*`)**: Dedicated portal for admissions representatives of partner institutions (e.g., University of Hertfordshire, Coventry University).
- **Direct Actions**:
  - Review applications routed specifically to their university ID.
  - Issue admission decisions (Unconditional Offer, Conditional Offer, Rejection) directly into the CRM.
  - Upload official CAS reference numbers to candidate files.
  - Monitor institutional turnaround times and agent placement velocity.

### 6.10 Auditor & Compliance Desk (Immutable Logs & GDPR)
- **Immutable Audit Trail (`/auditor/audit-trail`, `/audit-log`)**: Streams 200+ distinct system actions (logins, role updates, stage progressions, document deletions, financial payouts) with actor email, timestamp, IP address, and changed fields.
- **Compliance Certification**: Compliance officers inspect student files and apply tamper-evident verification badges (`AUDIT_COMPLIANCE_PASSED` / `AUDIT_COMPLIANCE_FLAGGED`).
- **GDPR Consent Architecture**: Every registration and profile modification logs immutable consent records in `consent_records` capturing IP, user agent, consent version, and timestamp.

### 6.11 Support Desk & Self-Service Knowledge Base
- **Support Ticket Queue (`/support/tickets`)**: Manages technical and operational tickets (`TKT-2026-XXXX`) across Low, Medium, High, and Urgent priority tiers.
- **Two-Way Threading**: Supports public responses delivered to user dashboards and private internal notes visible only to support staff.
- **Knowledge Base (`/support/knowledge-base`)**: Article authoring and categorization engine for self-service problem resolution.

---

## 7. Cloud Firestore NoSQL Database Schema & Collections

| Collection Name | Document ID Pattern | Key Fields & Types | Purpose in EduCRM |
| :--- | :--- | :--- | :--- |
| `users` | `{uid}` (Firebase Auth UID) | `uid`, `email`, `role`, `displayName`, `tenantId`, `office`, `accountStatus`, `createdAt`, `updatedAt` | Core user identity, role-based claims, tenant association |
| `students` | `{studentId}` (or `{uid}`) | `id`, `fullName`, `email`, `phone`, `nationality`, `countryOfResidence`, `academicHistory[]`, `englishProficiency`, `profileCompleteness`, `tenantId`, `assignedCounsellorId` | Comprehensive student profile, qualifications, language scores |
| `applications` | `APP-{year}-{random}` / Auto | `id`, `applicationNumber`, `studentId`, `studentName`, `universityId`, `programmeId`, `intake`, `stage`, `assignedOfficer`, `assignedCounsellor`, `offerType`, `depositAmount`, `casRefNumber`, `tenantId` | Core 20-stage application record, status history, offers |
| `leads` | Auto-generated ID | `id`, `fullName`, `email`, `phone`, `source`, `status`, `readinessScore`, `assignedCounsellorId`, `tenantId`, `createdAt` | Top-of-funnel inquiries before conversion to students |
| `universities` | `uni-{slug}` / Auto | `id`, `name`, `country`, `city`, `ranking`, `logoUrl`, `programmes[]`, `intakes[]`, `isActive` | Master catalog of global partner higher education institutions |
| `documents` | Auto-generated ID | `id`, `studentId`, `applicationId`, `docType`, `fileName`, `fileUrl`, `fileSize`, `status`, `verifiedBy`, `verifiedAt` | Vault metadata for passports, transcripts, and certificates |
| `invoices` | `INV-{year}-{seq}` | `id`, `invoiceNumber`, `studentId`, `applicationId`, `amount`, `currency`, `dueDate`, `status`, `items[]`, `tenantId` | Tuition deposit challans, application fees, agent invoices |
| `payments` | `PAY-{year}-{seq}` | `id`, `invoiceId`, `studentName`, `amount`, `currency`, `method`, `reference`, `paidAt`, `receiptNumber` | Payment clearance and reconciliation ledger |
| `commissions` | Auto-generated ID | `id`, `agentId`, `agentName`, `studentId`, `applicationId`, `rateApplied`, `amount`, `currency`, `status`, `payoutBatchId` | Sub-agent commission earnings and payout tracking |
| `audit_logs` | Auto-generated ID | `id`, `action`, `actorEmail`, `actorRole`, `targetEntity`, `entityId`, `details`, `timestamp`, `ipAddress` | Immutable compliance and security event trail |
| `support_tickets`| `TKT-2026-{seq}` | `id`, `ticketNumber`, `subject`, `description`, `status`, `priority`, `requesterEmail`, `assignedTo`, `messages[]` | Technical support and operational inquiries |
| `consent_records`| Auto-generated ID | `id`, `userId`, `email`, `consentType`, `consentVersion`, `ipAddress`, `userAgent`, `timestamp` | Legal GDPR data processing consent logs |

---

## 8. Security Governance & Firestore Declarative Rules

EduCRM enforces security declaratively inside `firestore.rules`:
1. **Self-Elevation Prevention**: Non-admin users are strictly forbidden from modifying their own `role`, `tenantId`, `partnerUniversityId`, or administrative privileges.
2. **Student Record Ownership**: Students can only read or update student files where `student.email == request.auth.token.email` or `student.id == request.auth.uid`.
3. **Agent Boundary Scoping**: External agents can only query and view student dossiers and applications where `agentUid == request.auth.uid`.
4. **University Partner Scoping**: University representatives can only view applications matching their assigned `partnerUniversityId`.
5. **Stage Progression Gatekeeping**: Departmental staff can only transition applications into stages owned by their respective department (e.g. only Finance can mark `Deposit Paid`).

---

## 9. Automated Quality Assurance & Testing Suite

The EduCRM codebase is covered by an automated test harness designed to guarantee regression-free releases:

### 9.1 Vitest Unit & Integration Suites (27 Suites, 188 Tests)
- **RBAC & Authorization Tests (`tests/security/`)**:
  - Verifies that counselors cannot mark invoices as paid.
  - Verifies that external agents cannot access internal admissions notes.
  - Verifies that students cannot inspect other students' dossiers.
- **AI CV Extractor Tests (`tests/unit/cvExtractor.test.ts`)**:
  - Tests PDF.js text stream normalization.
  - Validates demonym conversion (e.g., "Pakistani" → "Pakistan").
  - Verifies multi-degree academic qualification extraction and grading scale detection.
- **State Machine Tests (`tests/unit/stageAuthorization.test.ts`)**:
  - Verifies that non-finance users are rejected when transitioning to `Deposit Paid`.
  - Verifies valid transitions from `Draft` through `Enrolled`.

### 9.2 Playwright End-to-End Browser Tests
- Simulates automated browser user journeys:
  - *Journey 1*: Student self-registration at `/register`, AI CV auto-fill upload, email verification, and onboarding completion.
  - *Journey 2*: 11-Step Application Wizard submission for a Master's degree at a UK partner university.
  - *Journey 3*: Admissions Officer login, transcript review, and 1-Click Conditional Offer letter issuance.
  - *Journey 4*: Finance Officer challan generation and payment clearance.

---

## 10. Directory Structure & Codebase Organization

```
CRM/
├── .firebase/                    # Firebase deployment cache
├── .firebaserc                   # Firebase project binding (education-crm-9fee2)
├── firebase.json                 # Firebase Hosting, Firestore, and Storage deployment rules
├── firestore.rules               # Production declarative Firestore security rules
├── storage.rules                 # Cloud Storage bucket access rules
├── package.json                  # Dependencies, test scripts, and build tasks
├── vite.config.ts                # Vite 6 configuration and manual vendor chunk splitting
├── tsconfig.json                 # Root TypeScript project references
├── tsconfig.app.json             # Application TypeScript configuration
├── public/                       # Static public assets, favicon, campus demo imagery
├── docs/                         # Project reports, gap analyses, and architectural specs
├── obsidian_vault/               # Comprehensive system notes, sequence diagrams, and role specs
├── tests/                        # Vitest unit, security, and integration test suites
│   ├── security/                 # RBAC and tenant boundary test specifications
│   └── unit/                     # State machine, parser, and component test specifications
└── src/
    ├── main.tsx                  # React 19 application entry point
    ├── App.tsx                   # Master React Router routing table & role gates
    ├── index.css                 # Tailwind CSS v4 design system and custom utilities
    ├── contexts/                 # Global React contexts
    │   ├── AuthContext.tsx       # Authentication state, current user claims, demo launcher
    │   ├── ThemeContext.tsx      # Dark / light atmospheric theme toggling
    │   ├── GlobalDataContext.tsx # Cached master data (universities, programmes, countries)
    │   └── NotificationProvider.tsx # Real-time toaster alerts
    ├── types/                    # TypeScript domain models and interfaces
    │   ├── role.ts               # 13 user roles and AppUser model
    │   ├── student.ts            # Student profile, academic records, and test scores
    │   ├── application.ts        # 20-stage Application model and transfer history
    │   ├── finance.ts            # Invoices, payments, refunds, and commission rules
    │   ├── university.ts         # University and academic programme catalogs
    │   └── lead.ts               # Lead acquisition and scoring models
    ├── utils/                    # Core business logic and helper engines
    │   ├── cvExtractor.ts        # Gemini AI & client-side heuristic resume extractor
    │   ├── geminiClient.ts       # Google Gemini REST client with automatic fallback
    │   ├── stageAuthorization.ts # 20-stage state machine permission validator
    │   ├── eligibility.ts        # Academic GPA & English test score evaluation logic
    │   └── documentStorage.ts    # Secure file upload and cloud storage abstraction
    ├── components/               # Modular reusable UI components
    │   ├── ai/                   # StudentCVUploader and resume parser dropzones
    │   ├── layout/               # ProtectedLayout, RoleGate, Navbars, Sidebars, Guards
    │   ├── portal/               # RolePortal, UniversityPortalWorkspace, AgentPortalWorkspace
    │   ├── visa/                 # VisaWorkspace and embassy milestone components
    │   └── ui/                   # Buttons, modal dialogs, status badges, stat cards
    └── pages/                    # Core application views and role workspaces
        ├── Login.tsx             # Universal sign-in with fast demo credentials launcher
        ├── Register.tsx          # Multi-role registration with instant AI CV auto-fill
        ├── VerifyEmail.tsx       # Email verification landing page
        ├── Dashboard.tsx         # Unified analytics and operations overview
        ├── Leads.tsx             # Lead management board and pipeline
        ├── Students.tsx          # Master student directory
        ├── Applications.tsx      # Cross-departmental Kanban application board
        ├── Documents.tsx         # Document compliance audit vault
        ├── FormBuilder.tsx       # Drag-and-drop dynamic lead form designer
        ├── PublicFormPage.tsx    # Unauthenticated public lead capture endpoint
        ├── CommissionManager.tsx # Automated agent commission settlement desk
        ├── admissions/           # Admissions Officer workspace, offers, verifications
        ├── agent/                # External Agent referral desk and commission ledger
        ├── auditor/              # Compliance inspection and immutable audit trail views
        ├── counsellor/           # Counselor lead triage, students, and program matcher
        ├── finance/              # Invoices, student fee challans, payments, refunds
        ├── portal/               # Student onboarding (Stages 1-4) & 11-step application wizard
        ├── superadmin/           # Multi-tenant provisioning, system health, user overrides
        ├── support/              # Ticketing system, private notes, knowledge base
        └── university/           # University Partner direct admissions and CAS release
```

---

## 11. Local Development, Environment Setup & Deployment Guide

### 11.1 Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm** or **yarn**
- **Git**

### 11.2 Environment Configuration
Create a `.env` file in the project root:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=education-crm-9fee2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=education-crm-9fee2
VITE_FIREBASE_STORAGE_BUCKET=education-crm-9fee2.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=324490740107
VITE_FIREBASE_APP_ID=1:324490740107:web:bad87398d3b03e8c0a6f8e

# Gemini AI Engine Configuration (Optional for Deep AI; heuristic engine functions offline)
VITE_GEMINI_API_KEY=your_google_gemini_api_key
VITE_GEMINI_MODEL=gemini-3.8-flash

# Operational Flags
VITE_DEMO_MODE=false
VITE_REQUIRE_VERIFIED_EMAIL=true
```

### 11.3 Installation & Dev Server Execution
```bash
# 1. Install all dependencies
npm install

# 2. Run local Vite development server
npm run dev
# The application will start at http://localhost:5173

# 3. Execute automated test suites
npm run test:unit       # Runs 188 Vitest unit & integration tests
npm run test:e2e        # Runs Playwright browser journeys
npm run typecheck       # Validates strict TypeScript compilation
npm run lint            # Runs ESLint code style and best practice checks

# 4. Compile optimized production bundle
npm run build

# 5. Deploy to Firebase Cloud Hosting
npx firebase deploy --only hosting
```

---

## 12. Summary for AI Ingestion

When providing this report to another AI system, you can use the following prompt prefix:

> *"The attached document is the complete, production-grade technical specification and architecture report for **EduCRM**, an enterprise multi-tenant higher education admissions and CRM platform developed in React 19, TypeScript, Tailwind CSS, and Google Firebase with Gemini 3.8 Flash AI. It details all 13 user roles, the 20-stage application finite state machine, Cloud Firestore NoSQL schemas, declarative security rules, and testing strategies. Please use this document as the ground truth context for answering questions, generating documentation, evaluating the system, or writing features."*
