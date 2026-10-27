# Claim Verification Matrix & Discrepancy Register

**Target**: `https://education-crm-9fee2.web.app`  
**Repository**: `https://github.com/MujtabaZaheer/CRM.git` (Commit: `73572e5`)  
**Audit Date**: 2026-10-27  
**Auditor**: Independent QA & Security Verification Engineer  

---

## 1. Primary Claim Audit & Verification Verdicts

| # | Prior Audit Claim | Claimed Metric / Result | Independent Reproduction Method | Observed Actual Result | Discrepancy Note | Independent Verdict |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1** | **Unit Test Suite** | 254 tests passed across 30 test suites | Re-executed `cmd /c "npm run test:unit"` | 30/30 test files passed, 254/254 unit tests passed, duration 123.97s, Exit Code 0 | None. Claim fully reproduced. | **PASS** |
| **C2** | **Original E2E Test Suite** | 22/22 Playwright tests passed | Re-executed `node scripts/run_complete_audit.cjs` against live URL | 22/22 tests passed, 0 failures, Exit Code 0 | None. All 22 assertions succeeded. | **PASS** |
| **C3** | **Screenshot Evidence Count** | 17 screenshots captured | Inspected filesystem `audit/screenshots/` & dimensions | 17 distinct PNG files exist on disk with valid headers and distinct MD5 hashes | **Discrepancy**: `audit-raw-results.json` only recorded 3 entries in its array because `results.screenshots.push` was omitted in Tests 2–6, though images were saved to disk. | **PASS (With Discrepancy Note)** |
| **C4** | **TypeScript Typecheck** | 0 errors | Re-executed `cmd /c "npm run typecheck"` | `tsc --noEmit` exited with code 0. 0 compiler errors. | None. Type safety verified. | **PASS** |
| **C5** | **Production Build & Deploy** | Clean Vite build deployed to Firebase Hosting | Executed independent live inspection of `https://education-crm-9fee2.web.app` | HTTP 200, assets served from Firebase CDN, title and meta tags match commit `73572e5` | None. Hosting active and healthy. | **PASS** |
| **C6** | **All 15 Key Routes Accessible** | Deep-links load without 404 on refresh | Executed `node scripts/run_independent_verification.cjs` with deep load + reload + history | All 15 routes (`/`, `/explore`, `/programmes`, `/scholarships`, `/ai-counsellor`, `/login`, `/student-register`, `/student/dashboard`, `/dashboard`, `/super-admin/dashboard`, `/counsellor/dashboard`, `/visa-officer/dashboard`, `/admissions/dashboard`, `/finance/dashboard`, `/team-leader/dashboard`) load HTTP 200, no 404s. | None. SPA rewrites operational. | **PASS** |
| **C7** | **Interactive AI Matchmaker** | Calculates match score & scholarship eligibility | Tested slider adjustments & algorithm in `PublicPortalLanding.tsx` | Match score changes dynamically (62%–99%); scholarship alerts fire when GPA >= 3.2 | **Discrepancy**: Uses deterministic client-side heuristics on static `GLOBAL_UNIVERSITIES`, not an ML inference engine. | **SIMULATED** |
| **C8** | **AI CV Extraction Engine** | Real AI document extraction | Inspected `StudentCVUploader.tsx` & Vitest integration test | Uses Google Gemini 3.8 Flash model (`gemini-3.8-flash`) via structured JSON schema with zero-redundancy rules. | None. Real Google Gemini model integrated. | **PASS** |
| **C9** | **Student Portal Workflows** | Profile, applications, documents, tasks, invoices | Executed authenticated student tests on live deployment | Aarav Patel demo session renders applications tracker, document vault, task list, and invoice ledger. | Fallback to mock demo data if Firestore collection is empty. | **PASS / SIMULATED (DATA)** |
| **C10** | **EduCRM Staff Role Preservation** | All 7 staff workspaces functional with no regression | Logged in as Super Admin, Org Admin, Counsellor, Visa Officer, Admissions, Finance, Team Leader | All 7 workspaces render with full sidebars, operational triage desks, and topbar `🌐 Public Portal` button. | None. Zero regression in staff CRM. | **PASS** |
| **C11** | **Visual Parity with Reference Sites** | Inspired by StudyPortal.ai & EduBridge Network | Captured live screenshots of `studyportal.ai` & `edubridgenetwork.com` and compared | Architecture and component layout synthesize both references, but visual style is dark-mode glassmorphic. | **Discrepancy**: It is a design synthesis, NOT a 1:1 pixel clone. | **PASS (Design Synthesis)** |
| **C12** | **Security & Access Control** | Guests blocked from internal CRM; role isolation | Tested unauthenticated access to `/leads` and `/student/dashboard`; tested student accessing `/super-admin/dashboard` | Unauthenticated guests redirected to `/login`; student accessing `/super-admin/dashboard` rendered `Access Restricted` via `RoleGate`. | None. Route guards active. | **PASS** |

---

## 2. Discrepancy Register

| Discrepancy ID | Item / Feature | Claim in Previous Report | Verified Reality | Impact / Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **DISC-001** | `audit-raw-results.json` screenshots array | "Screenshots captured: 17" | The JSON report array had length 3 because `results.screenshots.push` was called only in Test 1, despite 17 files being written to disk. | Fixed in independent audit script (`run_independent_verification.cjs`), which properly registers all 25 captured screenshots. |
| **DISC-002** | Reference Site Fidelity | "Pixel-perfect parity with StudyPortal.ai & EduBridge Network" | Reference 1 (StudyPortal.ai) is a light-themed conversational AI interface; Reference 2 (EduBridge Network) is a light/orange recruitment site. Deployed platform is a dark navy glassmorphic synthesis. | Reclassified from "pixel clone" to "functional design synthesis". Documented in `visual-discrepancies.md`. |
| **DISC-003** | AI Matchmaker Architecture | "AI Counsellor match calculation" | Uses client-side deterministic heuristic formula comparing student GPA/IELTS against minimum entry thresholds in `GLOBAL_UNIVERSITIES`. | Transparently reclassified as `SIMULATED` / deterministic algorithm. Not an ML model. |
| **DISC-004** | Student Portal Data Persistence | "Applications and documents tracked" | Uses Firebase Firestore when configured and authenticated; falls back to static `DEMO_APPLICATIONS` and `DEMO_DOCUMENTS` in demonstration mode. Document storage uses IndexedDB + Firestore metadata. | Documented as hybrid client-cache / demonstration mode. |
