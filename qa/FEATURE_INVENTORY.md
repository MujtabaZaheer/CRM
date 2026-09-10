# Comprehensive Feature Inventory

This document provides an exhaustive inventory of all functional capabilities, modules, routes, and roles implemented in the Education CRM platform, assessed against the 43-page specification (`CRM.pdf` & `docs/requirements-matrix.md`).

| ID | Feature | Location | Role | Implemented? | Test Required? | Test Coverage Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-001** | User Registration & Role Selection | `/register` | Public | YES | YES | Automated (Playwright) - PASS |
| **AUTH-002** | Student Direct Registration | `/student-register` | Public | YES | YES | Automated (Playwright) - PASS |
| **AUTH-003** | Email/Password Sign-In | `/login` | Public | YES | YES | Automated (Playwright) - PASS |
| **AUTH-004** | Fast Role Demo Switcher | `/login` | Public / Dev | YES | YES | Automated (Playwright) - PASS |
| **AUTH-005** | Forgot Password Request | `/login` | Public | YES | YES | Automated (Playwright) - PASS |
| **AUTH-006** | Email Verification Gate | `/verify-email` | Authenticated | YES | YES | Automated (Playwright) - PASS |
| **AUTH-007** | Invitation Acceptance | `/accept-invitation` | Public | YES | YES | Automated (Playwright) - PASS |
| **AUTH-008** | Session Persistence & Refresh | App-wide | All Roles | YES | YES | Automated (Playwright) - PASS |
| **AUTH-009** | Session Termination / Sign Out | App-wide | All Roles | YES | YES | Automated (Playwright) - PASS |
| **STUD-001** | 4-Stage Onboarding Wizard | `/student/onboarding/*` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-002** | Student Dashboard Metrics | `/student/dashboard` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-003** | Student Profile Self-Edit | `/student/profile` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-004** | University Discovery Catalog | `/student/universities` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-005** | University Details & Campuses | `/student/universities/:id` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-006** | Programme Catalog & Search | `/student/programs` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-007** | Programme Details & Eligibility | `/student/programs/:id` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-008** | Direct & Guided Application | `/apply/:programmeId` | Student | PARTIAL | YES | Automated (Playwright) - BROKEN (Firestore timeout) |
| **STUD-009** | Application History & Status | `/student/applications` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-010** | Student Document Vault | `/student/documents` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-011** | Student Counsellor Chat | `/student/messages` | Student | YES | YES | Automated (Playwright) - PASS |
| **STUD-012** | Student Tasks & Deadlines | `/student/tasks` | Student | YES | YES | Automated (Playwright) - PASS |
| **COUNS-001**| Counsellor Pipeline Dashboard | `/counsellor/dashboard` | Counsellor | YES | YES | Automated (Playwright) - PASS |
| **COUNS-002**| Lead Queue & Allocation | `/counsellor/leads` | Counsellor | YES | YES | Automated (Playwright) - PASS |
| **COUNS-003**| Assigned Students Directory | `/counsellor/students` | Counsellor | YES | YES | Automated (Playwright) - PASS |
| **COUNS-004**| Student Message Console | `/counsellor/messages` | Counsellor | YES | YES | Automated (Playwright) - PASS |
| **COUNS-005**| Applications Tracking Pool | `/counsellor/applications`| Counsellor | YES | YES | Automated (Playwright) - PASS |
| **COUNS-006**| Document Vault & Verification | `/counsellor/documents` | Counsellor | YES | YES | Automated (Playwright) - PASS |
| **COUNS-007**| Tasks & Reminder Follow-ups | `/counsellor/tasks` | Counsellor | YES | YES | Automated (Playwright) - PASS |
| **COUNS-008**| AI Programme Matcher | `/counsellor/programme-matcher` | Counsellor | YES | YES | Automated (Playwright) - PASS |
| **LEAD-001** | Global Leads Management | `/leads` | Staff | YES | YES | Automated (Playwright) - PASS |
| **LEAD-002** | Lead Routing Rules Engine | `/lead-routing` | Admin / Team Leader | YES | YES | Automated (Vitest + UI) - PASS |
| **LEAD-003** | Lead Scoring Matrix Config | `/lead-scoring` | Admin / Team Leader | YES | YES | Automated (Vitest + UI) - PASS |
| **ADMIN-001**| Admissions Desk Dashboard | `/admissions/dashboard` | Admissions | YES | YES | Automated (Playwright) - PASS |
| **ADMIN-002**| Application Verification Desk| `/admissions/verification` | Admissions | YES | YES | Automated (Playwright) - PASS |
| **ADMIN-003**| Offer & CAS Tracking | `/admissions/offers` | Admissions | YES | YES | Automated (Playwright) - PASS |
| **TEAM-001** | Team Leader Dashboard | `/team-leader/dashboard` | Team Leader | YES | YES | Automated (Playwright) - PASS |
| **TEAM-002** | Team Workload Assignment | `/team-leader/assign-applications` | Team Leader | YES | YES | Automated (Playwright) - PASS |
| **TEAM-003** | Team Performance KPI | `/team-leader/performance` | Team Leader | YES | YES | Automated (Playwright) - PASS |
| **FIN-001**  | Finance Dashboard | `/finance/dashboard` | Finance Officer | YES | YES | Automated (Playwright) - PASS |
| **FIN-002**  | Invoicing Engine | `/finance/invoices` | Finance Officer | YES | YES | Automated (Playwright) - PASS |
| **FIN-003**  | Payments & Receipts | `/finance/payments` | Finance Officer | YES | YES | Automated (Playwright) - PASS |
| **FIN-004**  | Refund Processing | `/finance/refunds` | Finance Officer | YES | YES | Automated (Playwright) - PASS |
| **FIN-005**  | Commission Ledger | `/finance/commissions` | Finance Officer | YES | YES | Automated (Playwright) - PASS |
| **VISA-001** | Visa Case Tracking | `/visa-officer/dashboard`| Visa Officer | YES | YES | Automated (Playwright) - PASS |
| **AGENT-001**| Agent Partner Dashboard | `/agent/dashboard` | External Agent | YES | YES | Automated (Playwright) - PASS |
| **AGENT-002**| Student Referrals Ledger | `/agent/referrals` | External Agent | YES | YES | Automated (Playwright) - PASS |
| **AGENT-003**| New Referral Submission | `/agent/refer-lead` | External Agent | YES | YES | Automated (Playwright) - PASS |
| **AGENT-004**| Agent Commission Statements | `/agent/commissions` | External Agent | YES | YES | Automated (Playwright) - PASS |
| **UNIV-001** | University Partner Portal | `/university/dashboard` | University Partner | YES | YES | Automated (Playwright) - PASS |
| **UNIV-002** | Received Applications Desk | `/university/applications` | University Partner | YES | YES | Automated (Playwright) - PASS |
| **UNIV-003** | CAS / COE Issuance Console | `/university/cas-issuance` | University Partner | YES | YES | Automated (Playwright) - PASS |
| **SUPP-001** | Support Ticketing System | `/support/tickets` | Support User | YES | YES | Automated (Playwright) - PASS |
| **SUPP-002** | Support Knowledge Base | `/support/knowledge-base` | Support User | YES | YES | Automated (Playwright) - PASS |
| **AUD-001**  | Auditor Compliance Portal | `/auditor/dashboard` | Auditor | YES | YES | Automated (Playwright) - PASS |
| **AUD-002**  | Immutable Audit Log Viewer | `/audit-log` | Admin / Auditor | YES | YES | Automated (Playwright) - PASS |
| **SUPER-001**| Platform Super Admin Portal | `/super-admin/dashboard`| Super Admin | YES | YES | Automated (Playwright) - PASS |
| **SUPER-002**| Multi-Tenant Management | `/super-admin/tenants` | Super Admin | YES | YES | Automated (Playwright) - PASS |
| **SUPER-003**| User Account Administration | `/users` | Org/Super Admin | YES | YES | Automated (Playwright) - PASS |
| **SUPER-004**| System Health & Infrastructure | `/super-admin/system-health` | Super Admin | YES | YES | Automated (Playwright) - PASS |
| **DATA-001** | Data Quality Dashboard | `/data-quality` | Admin / Office Mgr | YES | YES | Automated (Vitest + UI) - PASS |
| **DATA-002** | CSV Bulk Import / Export | `/import-export` | Admin / Staff | YES | YES | Automated (Playwright) - PASS |
| **AI-001**   | CV & Resume OCR Extraction | `StudentCVUploader` | Student / Staff | YES | YES | Automated (Vitest Integration) - PASS |
| **AI-002**   | AI Intelligent Eligibility Check| `eligibility.ts` | Counsellor / Student| YES | YES | Automated (Vitest) - PASS |
| **COMM-001** | Multi-channel Communications| `/communications` | Staff | PARTIAL | YES | Automated (Playwright) - UI PASS |
| **FORM-001** | Public Form Builder & Submissions| `/form-builder`, `/public/*`| Public / Staff | PARTIAL | YES | Automated (Playwright) - PASS |
