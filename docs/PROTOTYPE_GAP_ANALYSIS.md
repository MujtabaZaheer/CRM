# EduCRM Prototype Completeness Audit & Gap Analysis Report

**Document ID:** SEC-AUDIT-2026-09  
**Target Release:** Production Phase 1  
**Architecture Domain:** Full-Stack CRM, Data Isolation, RBAC & Compliance  
**Author:** Full-Stack CRM Architect & Security Systems Engineer  
**Date:** September 2026  

---

## 1. Executive Summary

This audit evaluates the architectural completeness, security boundaries, and user workflows of **EduCRM** across all primary operating modules:
1. **Lead Intake & Conversion Engine**
2. **Student Dossier & Document Management**
3. **Agent Referral Isolation & Triage Gateway**
4. **Application Routing, Tenant Partitioning & Reassignment**
5. **Commission & Financial Operations**
6. **RBAC, Role Deprecation & Access Controls**

While the core data structures, Firestore Row-Level Security (RLS) rules, multi-tenant partitioning, and recent Agent Triage & Team Lead authorization boundaries are securely established, the prototype currently exhibits several functional dead ends, client-side heuristic dependencies, simulated third-party integrations, and missing production error boundaries that must be resolved prior to enterprise production deployment.

---

## 2. Module-by-Module Audit & Gap Matrix

| Module | Component / Scope | Severity | Status | Gap Description & Production Prerequisite |
| :--- | :--- | :---: | :---: | :--- |
| **Intake & Leads** | Lead Conversion Pipeline | Medium | Partial | Client-side creation in `Leads.tsx`; lacks distributed transactional rollback if student creation succeeds but lead stage update fails. |
| **Intake & Leads** | Dynamic Form Routing | High | Draft | Form Builder and Public Form submissions persist to Firestore, but lead routing rules (`LeadRoutingConfig.tsx`) lack server-side Cloud Function execution for auto-assignment. |
| **Intake & Leads** | Duplicate Detection | Medium | Simulated | Scans duplicates in-memory via Jaro-Winkler/Levenshtein; does not scale to datasets > 2,000 leads without a dedicated Firestore search index (Algolia/Typesense). |
| **Student Dossier** | Document Upload & Storage | High | Fallback | `documentStorage.ts` gracefully falls back to base64 Data URIs when Firebase Storage bucket credentials are unset; multi-page PDF watermarking is restricted to page 1. |
| **Student Dossier** | Automated Document QA | Medium | Mock Heuristic | `documentQA.ts` uses client-side Canvas pixel analysis for blur and dimension checks; lacks genuine cloud OCR (Google Cloud Vision/Tesseract) for MRZ checksum verification. |
| **Student Dossier** | Counsellor Intake Assignment | Low | **SECURED** | Primary intake counsellor assignment is strictly gated to `office_manager`, `org_admin`, and `platform_super_admin`; Team Leads are restricted with informative tooltips. |
| **Agent Gateway** | Triage & Admissions Isolation | Low | **SECURED** | RLS in `firestore.rules` blocks unvetted agent dossiers from Admissions Officers. Triage Desk allows verified sign-off with audit logging. |
| **Agent Gateway** | Re-Triage on Document Mutation | High | Missing | If an external agent uploads new transcripts or alters personal details *after* triage approval, the record does not automatically reset to `pending_triage`. |
| **Applications** | Multi-Tenant Partitioning | Low | **SECURED** | Strict row-level security isolates tenant records. Super Admin switcher facilitates cross-branch governance without leakage. |
| **Applications** | Batch Reassignment Engine | Medium | Partial | Chunked batching executes 100 records per transaction; lacks persistent background queue worker (Cloud Tasks) if user terminates browser mid-flight on 500+ transfers. |
| **Finance** | Payment Gateway Integration | High | Simulated | Invoices and fee challans are generated with print/download support, but credit card/bank transfer processing lacks live Stripe/Razorpay webhook listeners. |
| **Finance** | Sub-Agent Commission Split | Medium | UI-Only | Master Agent and Sub-Agent commission hierarchy is visually modeled in `AgentSubAgentManager.tsx`, but automated percentage split execution in `finance.createCommission` is missing. |
| **RBAC & Auth** | Role Deprecation & Fallbacks | Low | **SECURED** | Fallback matrix maps deprecated `admissions_officer` to `counsellor` capabilities without permission gaps. |
| **System Reliability** | Global Error Boundaries | Critical | Missing | Root `App.tsx` lacks a React Error Boundary; runtime exceptions (e.g., malformed Firestore timestamp) can crash the whole interface to a blank page. |

---

## 3. Deep Dive: Architectural Gaps & Edge Cases

### 3.1. Lead Intake & Conversion Handoff
- **Current State:** In [src/pages/Leads.tsx](file:///c:/Users/m/OneDrive/Desktop/CRM/src/pages/Leads.tsx), converting a lead calls `addStudent()` followed by `setDoc(doc(db, "students", newStudentId))`, and updates `leads/{leadId}` with `stage: "Converted"`.
- **Edge Cases & Gaps:**
  1. *Lack of Atomicity:* If network latency or client disruption interrupts the sequential Firestore writes, an orphaned student record may exist while the lead remains in "Qualified" stage.
  2. *Duplicate Intake:* Converting the same lead in rapid succession can generate duplicate student profiles.
  3. *Recommendation:* Wrap lead conversion in a Firestore `runTransaction()` or Cloud Function (`convertLeadToStudentCallable`) ensuring atomic status flip and audit trail creation.

### 3.2. Student Dossier & Document Management
- **Current State:** In [src/pages/Documents.tsx](file:///c:/Users/m/OneDrive/Desktop/CRM/src/pages/Documents.tsx) and [src/utils/documentStorage.ts](file:///c:/Users/m/OneDrive/Desktop/CRM/src/utils/documentStorage.ts), documents support upload, versioning, expiry tracking, watermarking, and AI QA auditing.
- **Edge Cases & Gaps:**
  1. *PDF Multi-page Watermarking:* [src/utils/documentWatermark.ts](file:///c:/Users/m/OneDrive/Desktop/CRM/src/utils/documentWatermark.ts) converts images to canvas. For multi-page academic transcripts in PDF format, browser canvas only renders a rasterized snapshot of the first page.
  2. *MRZ Checksum & OCR:* [src/utils/documentQA.ts](file:///c:/Users/m/OneDrive/Desktop/CRM/src/utils/documentQA.ts) detects resolution and aspect ratio, but cannot confirm if an uploaded passport has valid Machine Readable Zone (MRZ) characters.
  3. *Recommendation:* Deploy a Firebase Cloud Storage extension invoking Cloud Vision API to parse MRZ codes and stamp PDF documents with `pdf-lib` on the server before storage finalization.

### 3.3. Agent Referral & Triage Isolation Gate
- **Current State:** Gated via [src/utils/agentTriage.ts](file:///c:/Users/m/OneDrive/Desktop/CRM/src/utils/agentTriage.ts), [src/pages/counsellor/AgentTriageDesk.tsx](file:///c:/Users/m/OneDrive/Desktop/CRM/src/pages/counsellor/AgentTriageDesk.tsx), and [firestore.rules](file:///c:/Users/m/OneDrive/Desktop/CRM/firestore.rules).
- **Edge Cases & Gaps:**
  1. *Post-Approval Modification Vulnerability:* While agents are blocked from modifying `admissionsVisibility`, an external agent could update their student's address, nationality, or upload substitute documents while `admissionsVisibility == true`.
  2. *Automated Invalidation:* The system currently lacks an automatic trigger that resets `admissionsVisibility: false` and `vettingStatus: "pending_triage"` whenever a student dossier's critical academic or identity fields are modified post-submission.
  3. *Recommendation:* In `firestore.rules`, enforce that if `resource.data.admissionsVisibility == true`, external agents cannot mutate core student identity fields without resetting `admissionsVisibility: false`.

### 3.4. Team Lead Student Assignment Boundary (Implemented)
- **Current State:** [src/utils/studentAssignment.ts](file:///c:/Users/m/OneDrive/Desktop/CRM/src/utils/studentAssignment.ts) and [firestore.rules](file:///c:/Users/m/OneDrive/Desktop/CRM/firestore.rules) now strictly enforce that only `office_manager`, `org_admin`, and `platform_super_admin` can assign primary intake counsellors.
- **UI Enforcement:** In [src/pages/Students.tsx](file:///c:/Users/m/OneDrive/Desktop/CRM/src/pages/Students.tsx), Team Leads see disabled triggers accompanied by the tooltip: *"Assigning counsellors to students requires Office Manager or Admin authorization."*
- **Caseworker Decoupling:** [src/hooks/useTeamLeaderData.ts](file:///c:/Users/m/OneDrive/Desktop/CRM/src/hooks/useTeamLeaderData.ts) decouples application-level caseworker assignment from student intake ownership.

### 3.5. Application Routing & Reassignment Pipeline
- **Current State:** [src/utils/applicationReassignment.ts](file:///c:/Users/m/OneDrive/Desktop/CRM/src/utils/applicationReassignment.ts) and [src/components/applications/ReassignmentModal.tsx](file:///c:/Users/m/OneDrive/Desktop/CRM/src/components/applications/ReassignmentModal.tsx) process single and chunked batch transfers.
- **Edge Cases & Gaps:**
  1. *Browser Disconnection During Large Transfers:* If an Office Manager reassigns 600 applications and closes their browser after chunk 2, remaining chunks (3 through 6) are lost because execution relies on client-side `for (const chunk of chunks)` loops.
  2. *Recommendation:* Transition bulk reassignments exceeding 50 records to a Firestore `reassignment_jobs` document processed asynchronously by a background Cloud Function.

### 3.6. Commission & Financial Operations
- **Current State:** [src/components/finance/FinanceWorkspace.tsx](file:///c:/Users/m/OneDrive/Desktop/CRM/src/components/finance/FinanceWorkspace.tsx) handles invoice creation, fee challan generation, payment logging, and commission claims.
- **Edge Cases & Gaps:**
  1. *Live Payment Gateway:* Payment recording is manual. Students cannot enter a debit/credit card or bank authorization online.
  2. *Foreign Exchange Fluctuations:* Amounts are stored in nominal currencies without capturing real-time exchange rates at transaction time.
  3. *Recommendation:* Implement Stripe Elements in the Student Portal for fee deposits and record `exchangeRateToUSD` on payment records.

---

## 4. Cross-Cutting Production Gaps

### 4.1. React Error Boundaries
- **Issue:** No `<ErrorBoundary>` component wraps the main application routes in [src/App.tsx](file:///c:/Users/m/OneDrive/Desktop/CRM/src/App.tsx).
- **Risk:** A single `TypeError: Cannot read properties of undefined` in any subcomponent will unmount the entire React DOM tree, presenting the user with an unrecoverable blank screen.
- **Fix Required:** Implement a production-grade React Error Boundary with a user-friendly recovery UI and automatic Sentry / LogRocket telemetry integration.

### 4.2. Form Validation & Sanitization
- **Issue:** Many modal inputs rely solely on HTML5 `required` attributes without Zod schema validation.
- **Risk:** Whitespace-only submissions or malformed phone numbers can pollute the database.
- **Fix Required:** Standardize all data entry modals using `react-hook-form` paired with `zod` schema resolvers.

### 4.3. Offline State & Distributed Optimistic Locking
- **Issue:** The CRM uses optimistic updates via `GlobalDataContext`. If two counsellors edit the same student simultaneously, the last writer wins without notice.
- **Fix Required:** Introduce an integer `version` field or compare `updatedAt` timestamps in Firestore transactions before committing updates.

---

## 5. Prioritized Production Remediation Roadmap

### Phase 1: Stability & Security Hardening (Immediate Sprint)
- [x] **Strict Student Intake Gating:** Restrict student counsellor assignment to Office Managers and Admins (Completed).
- [x] **Agent Referral Isolation Gate:** Isolate unvetted agent student dossiers from Admissions Officers (Completed).
- [ ] **Global Error Boundary:** Wrap `ProtectedLayout` in a resilient Error Boundary with reload and diagnostics fallback.
- [ ] **Post-Approval Agent Invalidation:** Automatically revoke `admissionsVisibility` if an agent mutates core student documents after triage sign-off.

### Phase 2: Transactional Integrity (Sprint 2)
- [ ] **Atomic Lead Conversion:** Replace sequential Firestore writes in `Leads.tsx` with a Cloud Function or batch transaction.
- [ ] **Background Bulk Reassignment:** Move batch transfers > 50 applications to Cloud Tasks / Cloud Functions.
- [ ] **Zod Input Validation:** Introduce unified Zod schemas for student creation, lead intake, and invoice creation.

### Phase 3: Live Integrations (Sprint 3)
- [ ] **Live Payment Gateway:** Integrate Stripe PaymentIntents for deposit challans and fee receipts.
- [ ] **Cloud Document Pipeline:** Server-side PDF watermarking and Google Cloud Vision OCR for passport MRZ verification.
- [ ] **Algolia / Typesense Search:** Replace client-side string filtering with server-side indexed search for datasets exceeding 5,000 records.

---

*End of Report. Architectural sign-off required prior to production cutover.*
