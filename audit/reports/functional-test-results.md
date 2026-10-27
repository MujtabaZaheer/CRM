# Automated Functional Test Results Report

**Target URL**: [https://education-crm-9fee2.web.app](https://education-crm-9fee2.web.app)  
**Execution Timestamp**: 2026-10-27T16:20:00+05:00  
**Test Harness**: Vitest 4.1.10 (Unit & Logic) + Playwright 1.63 (E2E Browser Automation)  
**Engine**: Chromium / Google Chrome Channel  

---

## 1. High-Level Summary

| Metric | Result |
| :--- | :--- |
| **Total Test Suites Executed** | 31 suites (30 Vitest suites + 1 Playwright Live E2E suite) |
| **Total Unit Tests Executed** | 254 tests |
| **Total Live E2E Tests Executed** | 22 tests |
| **Total Passed** | **276 tests (100% Pass Rate)** |
| **Total Failed** | **0** |
| **Total Blocked** | **0** |
| **TypeScript Typecheck Status** | `tsc --noEmit` &rarr; **0 errors** (Exit Code 0) |
| **Vite Production Build Status** | `tsc -b && vite build` &rarr; **Success** (12.98s) |

---

## 2. Playwright Live Production E2E Test Suite Results

Executed directly against `https://education-crm-9fee2.web.app`:

```text
================ AUDIT SUMMARY ================
Target: https://education-crm-9fee2.web.app
Total tests: 22 | Passed: 22 | Failed: 0
Screenshots captured: 17
===============================================
```

### Detailed Breakdown of E2E Test Cases:

| # | Test Identifier | Target | Scope / Assertion | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Landing page render (desktop)` | `/` (1440x900) | Validates title, brand tag, hero headline, and 0 console errors | **PASS** |
| 2 | `Landing page render (tablet)` | `/` (768x1024) | Validates responsive tablet layout, navigation, and hero visibility | **PASS** |
| 3 | `Landing page render (mobile)` | `/` (390x844) | Validates mobile drawer trigger, touch layout, and stacked cards | **PASS** |
| 4 | `Course search filtering` | `#programmes` | Types "Computer Science" into search; verifies catalog filter updates | **PASS** |
| 5 | `AI Matchmaker calculation & output` | `#ai-counsellor` | Adjusts GPA/IELTS sliders; validates score output & shortlist generation | **PASS** |
| 6 | `Student registration page` | `/student-register`| Verifies registration form and Gemini CV scanner availability | **PASS** |
| 7 | `Login page role tabs` | `/login` | Confirms `Student Portal` vs `Staff / EduCRM` tab switching | **PASS** |
| 8 | `Student dashboard view & metrics` | `/student/dashboard` | Authenticates demo student Aarav Patel; verifies metrics & tasks | **PASS** |
| 9 | `Staff EduCRM: Education Counsellor` | `/counsellor/dashboard` | Verifies counsellor workspace, triage desk, and public portal toggle | **PASS** |
| 10 | `Staff EduCRM: Visa Officer` | `/visa-officer/dashboard` | Verifies visa case queue, CAS clearance desk, and sidebar | **PASS** |
| 11 | `Staff EduCRM: Admissions Officer` | `/admissions/dashboard` | Verifies Admissions Verification Hub and offer management desk | **PASS** |
| 12 | `Staff EduCRM: Organization Admin` | `/dashboard` | Verifies executive conversion funnel, total leads, and branch controls | **PASS** |
| 13 | `Staff EduCRM: Platform Super Admin` | `/super-admin/dashboard`| Verifies global tenant list, multi-branch overview, and system logs | **PASS** |
| 14 | `Staff EduCRM: Finance Officer` | `/finance/dashboard` | Verifies commission invoicing ledger and university payment tracking | **PASS** |
| 15 | `Staff EduCRM: Branch Team Leader` | `/team-leader/dashboard`| Verifies caseload balancing desk and counselor performance charts | **PASS** |
| 16 | `Direct route load & refresh: /` | `/` | Reloads browser at root; validates no 404 or infinite spinner | **PASS** |
| 17 | `Direct route load & refresh: /explore` | `/explore` | Verifies SPA hosting rewrite to index.html without error | **PASS** |
| 18 | `Direct route load & refresh: /programmes` | `/programmes` | Verifies direct deep-link to programmes catalog | **PASS** |
| 19 | `Direct route load & refresh: /scholarships` | `/scholarships` | Verifies direct deep-link to scholarships radar | **PASS** |
| 20 | `Direct route load & refresh: /login` | `/login` | Verifies clean reload of login interface | **PASS** |
| 21 | `Direct route load & refresh: /student-register`| `/student-register` | Verifies deep-link to student onboarding registration | **PASS** |
| 22 | `Security Guard: Unauthorized Access` | `/leads` | Unauthenticated guest attempt to open `/leads` redirects to `/login` | **PASS** |

---

## 3. Vitest Unit Test Suite Results

Executed across the entire project repository (`vitest run --pool=forks --no-file-parallelism`):

```text
 Test Files  30 passed (30)
      Tests  254 passed (254)
   Duration  73.64s
```

### Verified Test Suites:
1. `tests/unit/portal-architecture-triage-dossier-verification.test.ts` (14 tests passed)
2. `tests/unit/agent-intake-wizard.test.ts` (26 tests passed)
3. `tests/unit/pipeline-workflow-engine.test.ts` (26 tests passed)
4. `src/utils/cityTenantRouting.test.ts` (16 tests passed)
5. `src/pages/public/ApplicationWizard.test.ts` (14 tests passed)
6. `src/utils/cvExtractor.test.ts` (10 tests passed)
7. `src/utils/agentTriage.test.ts` (11 tests passed)
8. `tests/unit/wizard-states.test.ts` (8 tests passed)
9. `tests/security/rules-analysis.test.ts` (15 tests passed)
10. `tests/unit/student-registration-autofill.test.ts` (8 tests passed)
11. `tests/security/chat-rules.test.ts` (7 tests passed)
12. `tests/unit/student-cv-application-flow.test.ts` (8 tests passed)
13. `tests/unit/streamlined-onboarding.test.ts` (6 tests passed)
14. `src/utils/studentAssignment.test.ts` (6 tests passed)
15. `src/utils/applicationReassignment.test.ts` (8 tests passed)
16. `src/utils/tenantScoping.test.ts` (8 tests passed)
17. `tests/unit/lifecycle-and-flows.test.ts` (10 tests passed)
18. `tests/security/privilege-escalation.test.ts` (5 tests passed)
19. `tests/unit/role-redirect-onboarding.test.ts` (11 tests passed)
20. `tests/unit/agent-support-chat.test.ts` (3 tests passed)
21. `src/utils/roleMigration.test.ts` (5 tests passed)
22. `src/utils/leadConversionFlow.test.ts` (2 tests passed)
23. `src/utils/applicationReadiness.test.ts` (5 tests passed)
24. `tests/unit/student-registration-nationality.test.ts` (5 tests passed)
25. `src/components/ai/StudentCVUploader.integration.test.tsx` (1 test passed)
26. `tests/unit/visa-officer-rejection.test.ts` (4 tests passed)
27. `src/utils/dataQuality.test.ts` (3 tests passed)
28. `src/utils/staffProvisioningSecurity.test.ts` (3 tests passed)
29. `src/utils/universityImages.test.ts` (2 tests passed)
30. `src/utils/documentStorage.test.ts` (4 tests passed)

---

## 4. Known Limitations & Deliberate Architectural Decisions

1. **AI Matchmaker Client Simulation**: The eligibility calculator runs client-side based on the real dataset of universities in `GLOBAL_UNIVERSITIES`. It computes deterministic matches against actual published minimum GPAs and IELTS bands.
2. **Offline CV Extractor Heuristic Engine**: The Gemini 3.8 Flash CV extractor features a client-side regex engine that operates offline when no Gemini API key is configured.
3. **Demo Mode Isolation**: The 13 one-click demo accounts operate via mocked state stored in browser storage, allowing risk-free demonstration without polluting production Firestore collections.
