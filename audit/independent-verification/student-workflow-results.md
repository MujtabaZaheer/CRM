# Student Workflow & End-to-End Journey Verification

**Target**: `https://education-crm-9fee2.web.app`  
**Test Suite**: `scripts/run_independent_verification.cjs` (Section 2)  
**Execution Timestamp**: 2026-10-27T12:14:43Z  
**Overall Verdict**: **PASS (with transparent demonstration data labeling)**  

---

## 1. Journey Step 1: Course Discovery & Academic Search

### Tested Scenarios:
1. **Keyword Query Filtering**:
   - Query: `"Business"` &rarr; Filters 1,200+ course catalog to MBA, International Management, and Finance programmes.
   - Query: `"Computer Science"` &rarr; Filters catalog to Advanced MSc in Computer Science, Data Science & AI.
2. **Multi-Parameter Combinations**:
   - Destination: `"United Kingdom"` + Level: `"Postgraduate"` + Subject: `"Computing & AI"` &rarr; Displays Oxford, Manchester, Cambridge, UCL postgraduate computing degrees.
3. **Interactive Budget Slider**:
   - Dragging slider from £60,000 down to £25,000 immediately updates live result counter and excludes degrees with higher tuition fees.
4. **No-Results & Edge-Case State**:
   - Query: `"NonExistentProgrammeX999"` &rarr; Displays user-friendly empty state: *"No degree programmes found matching your search. Try resetting filters."*
5. **Clear & Reset Controls**:
   - Clicking "Reset Filters" restores full 1,200+ course view.

*Status*: **PASS**  
*Evidence*: Screenshot `audit/independent-verification/screenshots/student-flows/course_discovery_filtering.png`

---

## 2. Journey Step 2: Student Registration & AI CV Ingestion

### Tested Scenarios:
1. **Validation of Required Inputs**:
   - Submitting empty registration form triggers field validation preventing incomplete submission.
   - Password rule checks: 8+ characters, uppercase letter, lowercase letter, number, and special symbol.
2. **AI Resume & CV Scanner**:
   - Powered by `StudentCVUploader.tsx` utilizing Google Gemini 3.8 Flash model.
   - Extracts candidate name, email, phone, nationality, GPA, degree history, work experience, and IELTS bands.
   - **Zero-Redundancy Principle**: Extracted values are stored in `sessionStorage` and Firestore profile so applicants never need to re-enter their information in later onboarding steps.
3. **Fast-Track Redirection**:
   - Upon completion, students are routed to email verification (`/verify-email`) or their personal dashboard (`/student/dashboard`).

*Status*: **PASS**  
*Evidence*: Screenshot `audit/independent-verification/screenshots/student-flows/student_registration_validation.png`

---

## 3. Journey Step 3: Authenticated Student Portal Experience

Verified with authenticated student session (`Aarav Patel`, UID `stu_aarav`, Delhi Hub):

### Verified Modules:
| Module | Route | Actual Rendered Behaviour | Status |
| :--- | :--- | :--- | :--- |
| **Student Dashboard** | `/student/dashboard` | Renders applicant greeting, profile completeness meter (100%), quick actions, recent applications, document verification status, and invoice summaries. | **PASS** |
| **Applications Pipeline** | `/student/applications` | Displays multi-stage admissions tracker (Initial Review &rarr; Admissions Review &rarr; Conditional Offer &rarr; Unconditional Offer &rarr; CAS/Visa). Supports inspection of university offer details. | **PASS** |
| **Document Vault** | `/student/documents` | Lists uploaded dossiers (Academic Transcripts, IELTS Certificate, Passport, CV). Upload button accepts valid documents with client-side MIME & size validation. | **PASS** |
| **Invoices & Receipts** | `/student/invoices` | Displays tuition fee invoices, payment receipts, and download options. | **PASS** |
| **Direct Chat** | `/student/messages` | Real-time chat interface connecting student with their assigned counsellor. | **PASS** |

*Status*: **PASS**  
*Evidence*: Screenshot `audit/independent-verification/screenshots/student-flows/student_dashboard_overview.png`

---

## 4. Implementation Transparency Assessment

| Feature | Production Implementation Type | Data Source | Transparency Verdict |
| :--- | :--- | :--- | :--- |
| **Course Directory** | Reactive Client-Side Filtering | `GLOBAL_UNIVERSITIES` curated catalog (120+ institutions, 1,200+ programmes) | **PASS** (Real dataset) |
| **AI Matchmaker Scores** | Deterministic Heuristic Algorithm | Compared against minimum GPA & IELTS thresholds in university requirements | **SIMULATED** (Transparently labeled) |
| **CV Document Extraction** | Google Gemini 3.8 Flash AI | Live multimodal API extraction | **PASS** (Real AI pipeline) |
| **Student Record Storage** | Hybrid Firestore + IndexedDB Cache | Firebase Firestore with demo data fallback | **PASS** (Dual mode) |
