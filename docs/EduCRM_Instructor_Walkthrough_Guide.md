# EduCRM — Master Instructor Hands-On Walkthrough & Complete System Evaluation Manual

> **Platform**: EduCRM Cloud-Native Higher Education Admissions & International Student Recruitment Platform  
> **Production Instance**: [https://education-crm-9fee2.web.app](https://education-crm-9fee2.web.app)  
> **Local Evaluation Server**: [http://localhost:5173](http://localhost:5173)  
> **Audience**: Course Instructors, External Evaluators, Admissions Directors, System Auditors  
> **Coverage**: 13 Distinct User Roles • 12 Validated End-to-End Workflows • 51 High-Resolution Screenshots

---

## 1. Executive Evaluation Blueprint & Quick-Access System

EduCRM is an enterprise-grade higher-education CRM designed for end-to-end international student recruitment, institutional admissions, compliance verification, and financial settlement.

### The 1-Click Fast-Access Role Drawer
To evaluate any role without tedious password entry or account creation, navigate to [`/login`](http://localhost:5173/login) and open the **Demo Accounts (13)** drawer at the bottom-right of the screen:

![Login Screen with One-Click Demo Accounts Drawer](../crm_screenshots/01_login_and_demo_access.png)

### Master Credentials & Role Routing Matrix

| # | User Role | Demo Drawer Button | Default Test Email | Direct Route | Primary Evaluated Responsibility |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Student (New Onboarding)** | `Student (New)` | *Dynamic Session* | [`/student/onboarding/step-1`](http://localhost:5173/student/onboarding/step-1) | AI CV intake, Zero-Redundancy 4-stage onboarding wizard. |
| **2** | **Student (Registered / Complete)** | `Student (Reg)` | `aarav.patel@gmail.com` | [`/student/dashboard`](http://localhost:5173/student/dashboard) | 11-step application wizard, course search, documents, invoices. |
| **3** | **Education Counsellor** | `Counsellor` | `counsellor@educrm.demo` | [`/counsellor/dashboard`](http://localhost:5173/counsellor/dashboard) | Lead deduplication, 360° student dossier, AI program matcher. |
| **4** | **Admissions Officer** | `Admissions` | `admissions@educrm.demo` | [`/admissions/dashboard`](http://localhost:5173/admissions/dashboard) | Document Verification Hub, academic threshold audit, offers. |
| **5** | **Admissions Team Leader** | `Team Leader` | `teamleader@educrm.demo` | [`/team-leader/dashboard`](http://localhost:5173/team-leader/dashboard) | Caseload allocation, counsellor reassignment, SLA monitoring. |
| **6** | **Visa & Immigration Officer** | `Visa Officer` | `visa@educrm.demo` | [`/visa-officer/dashboard`](http://localhost:5173/visa-officer/dashboard) | 28-day proof of funds, mock interview, CAS clearance. |
| **7** | **Finance & Accounts Officer** | `Finance` | `finance@educrm.demo` | [`/finance/dashboard`](http://localhost:5173/finance/dashboard) | Tuition invoices, fee challans, agent commission ledger. |
| **8** | **External Recruitment Agent** | `Agent` | `agent@educrm.demo` | [`/agent/dashboard`](http://localhost:5173/agent/dashboard) | Lead referral ingestion, pipeline tracking, commission tracking. |
| **9** | **University Partner Rep** | `University` | `university@educrm.demo` | [`/university/dashboard`](http://localhost:5173/university/dashboard) | Institutional application review, program setup, direct CAS upload. |
| **10**| **Support Specialist** | `Support` | `support@educrm.demo` | [`/support/dashboard`](http://localhost:5173/support/dashboard) | Ticketing desk, priority resolution, knowledge base curation. |
| **11**| **Compliance & Auditor** | `Auditor` | `auditor@educrm.demo` | [`/auditor/dashboard`](http://localhost:5173/auditor/dashboard) | Immutable audit trail, GDPR consent inspect, system log forensics. |
| **12**| **Platform Super Admin** | `Super Admin` | `superadmin@educrm.demo` | [`/super-admin/dashboard`](http://localhost:5173/super-admin/dashboard) | Multi-tenant branch oversight, 13-tier RBAC provisioning. |
| **13**| **Organization Admin / Manager** | `Org Admin` | `orgadmin@educrm.demo` | [`/`](http://localhost:5173/) | Branch operational rules, lead scoring, commission manager. |

---

## 2. Table of End-to-End Evaluated Workflows

- **[ROLE 1 & 2: STUDENT]**
  - [Flow 1: AI CV Extraction & 4-Stage Zero-Redundancy Onboarding](#flow-1-student---ai-cv-extraction--zero-redundancy-onboarding)
  - [Flow 2: Student Experience — Course Discovery & 11-Step Application Wizard](#flow-2-student---course-discovery--11-step-application-wizard)
  - [Flow 3: Student Self-Management — Document Vault, Invoices, Chat & Profile](#flow-3-student---document-vault-invoices-chat--profile)
- **[ROLE 3: EDUCATION COUNSELLOR]**
  - [Flow 4: Lead Intake, Deduplication, 360° Dossier & AI Programme Matcher](#flow-4-counsellor---lead-intake-360-dossier--ai-programme-matcher)
- **[ROLE 4: ADMISSIONS OFFICER]**
  - [Flow 5: Admissions Document Verification Hub, Academic Threshold Audit & Offers](#flow-5-admissions-officer---verification-hub-academic-threshold--offers)
- **[ROLE 5: ADMISSIONS TEAM LEADER]**
  - [Flow 6: Caseload Balancing, Reassignment & Operational Performance SLAs](#flow-6-team-leader---caseload-balancing-reassignment--performance-slas)
- **[ROLE 6: VISA & IMMIGRATION OFFICER]**
  - [Flow 7: Visa Compliance — 28-Day Proof of Funds, Medical Screening & Mock Interview](#flow-7-visa-officer---proof-of-funds-medical-clearance--mock-interview)
- **[ROLE 7: FINANCE & ACCOUNTS OFFICER]**
  - [Flow 8: Tuition Fee Invoicing, Challan Management & Agent Commission Settlement](#flow-8-finance---tuition-invoicing-wire-reconciliation--commissions)
- **[ROLE 8: EXTERNAL RECRUITMENT AGENT]**
  - [Flow 9: Agent Referral Ingestion, Privacy-Preserving Pipeline & Commission Ledger](#flow-9-external-agent---referral-ingestion-pipeline--commissions)
- **[ROLE 9: UNIVERSITY PARTNER REPRESENTATIVE]**
  - [Flow 10: Institutional Application Assessment & Direct CAS / I-20 Issuance](#flow-10-university-partner---application-assessment--direct-cas-issuance)
- **[ROLE 10: SUPPORT SPECIALIST]**
  - [Flow 11: Support Ticketing Desk, SLA Resolution & Knowledge Base](#flow-11-support-specialist---ticketing-desk--knowledge-base)
- **[ROLES 11, 12 & 13: GOVERNANCE, COMPLIANCE & SUPER ADMIN]**
  - [Flow 12: Super Admin Provisioning, Master Configuration & Immutable Audit Forensics](#flow-12-super-admin-org-admin--auditor---governance--forensics)

---

## FLOW 1: STUDENT — AI CV Extraction & Zero-Redundancy Onboarding

### Target Role:
`student` (Prospective Student)

### Key Architectural Principle:
**Zero-Redundancy**: No data extracted from the CV or entered during registration is ever requested again in subsequent onboarding stages or application wizards.

---

### Step 1.1: Registration with Google Gemini 3.8 Flash CV Scanner
- **URL**: [`/register?role=student`](http://localhost:5173/register?role=student)
- **Action**:
  1. Open the registration page.
  2. Locate the **AI CV / Resume Scanner** card with the Google Gemini badge.
  3. Drag and drop any sample CV (`.pdf` or `.docx`), or enter details manually.
  4. Notice the real-time AI extractor parses First Name, Last Name, Email, Phone, Country, Nationality, Degree Level, and Language scores without dummy defaults.
  5. Click **Create Student Account**.

![Student Registration with AI CV Scanner](../crm_screenshots/02_student_registration_cv_upload.png)

---

### Step 1.2: Onboarding Step 1 — Identity Confirmation & Degree Level
- **URL**: [`/student/onboarding/step-1`](http://localhost:5173/student/onboarding/step-1)
- **Zero-Redundancy Verification**:
  1. Personal Identity fields (First Name, Last Name, Email, Phone, Country, Nationality) are **100% pre-hydrated** from registration!
  2. Select **Desired Study Level**: `Postgraduate (Master's / MSc / MA)`.
  3. Verify or add prior educational qualifications (e.g. Bachelor of Science in Computer Science, GPA 3.65).
  4. Click **Save & Continue**.

![Student Onboarding Step 1](../crm_screenshots/03_student_onboarding_step1.png)

---

### Step 1.3: Onboarding Step 2 — Study Destinations & Intake
- **URL**: [`/student/onboarding/step-2`](http://localhost:5173/student/onboarding/step-2)
- **Action**:
  1. Select primary target destination countries: `United Kingdom`, `United States`, `Canada`.
  2. Select target intake session: `Autumn / Fall 2026`.
  3. Choose annual tuition budget: `£15,000 - £25,000`.
  4. Select preferred discipline: `Computer Science & Artificial Intelligence`.
  5. Click **Proceed to Documents**.

![Student Onboarding Step 2](../crm_screenshots/04_student_onboarding_step2.png)

---

### Step 1.4: Onboarding Step 3 — Mandatory KYC Document Uploads
- **URL**: [`/student/onboarding/step-3`](http://localhost:5173/student/onboarding/step-3)
- **Action**:
  1. Upload or inspect required verification slots:
     - International Passport photo page.
     - Bachelor Degree Transcript & Graduation Certificate.
     - English Language Test Certificate (IELTS / PTE / TOEFL).
  2. Notice the client-side validation for file format (`.pdf`, `.png`, `.jpg`) and max size (10MB).
  3. Click **Proceed to Readiness Review**.

![Student Onboarding Step 3](../crm_screenshots/05_student_onboarding_step3.png)

---

### Step 1.5: Onboarding Step 4 — Profile Completeness & Legal Declaration
- **URL**: [`/student/onboarding/step-4`](http://localhost:5173/student/onboarding/step-4)
- **Action**:
  1. Observe the **Profile Completeness Score** calculated dynamically by `profileCompleteness.ts`.
  2. Verify all extracted and entered credentials summarized in the review card.
  3. Check the confirmation box: *"I confirm that all submitted educational and identity documents are authentic."*
  4. Click **Complete Onboarding & Enter Portal**.
  5. System unlocks full student portal access and transitions status to `completed`.

![Student Onboarding Step 4](../crm_screenshots/06_student_onboarding_step4.png)

---

## FLOW 2: STUDENT — Course Discovery & 11-Step Application Wizard

### Target Role:
`student` (Registered Student — Aarav Patel)

---

### Step 2.1: Student Command Center Overview
- **Fast Login**: Select **Student (Reg)** in the Demo Accounts drawer.
- **URL**: [`/student/dashboard`](http://localhost:5173/student/dashboard)
- **Key Elements**:
  - Live Application Tracker (shows current stage: `Draft`, `Initial Review`, `Conditional Offer`).
  - Assigned Counsellor Card with instant messaging link.
  - Document Readiness & KYC verification status chips.

![Student Command Center](../crm_screenshots/07_student_dashboard.png)

---

### Step 2.2: Programme Catalog & Eligibility Filter
- **URL**: [`/student/programs`](http://localhost:5173/student/programs)
- **Action**:
  1. Filter courses by Country (`United Kingdom`), Study Level (`Postgraduate`), and Field (`Computer Science`).
  2. Select **MSc Advanced Computer Science** at Oxford University.
  3. Inspect entry criteria: Minimum GPA 3.5, Minimum IELTS 7.0.
  4. Click **Apply Now** to initiate the application wizard.

![Student Programme Catalog](../crm_screenshots/08_student_programme_catalog.png)

---

### Step 2.3: Complete 11-Step Student Application Wizard
- **URL**: [`/student/new-application`](http://localhost:5173/student/new-application)
- **Step-by-Step Validation**:
  - **Step 1 (Overview)**: Program, university, campus, intake term, and tuition fee confirmed.
  - **Step 2 (Personal Info)**: Full name, DOB, nationality, and passport number **100% pre-filled** from master profile.
  - **Step 3 (Academic Records)**: Bachelor degree, university name, and GPA pre-filled.
  - **Step 4 (English Proficiency)**: IELTS 7.5 automatically benchmarked against program minimum (7.0) — flagged as *Eligible*.
  - **Step 5 (Statement of Purpose)**: Input academic rationale and career goals.
  - **Step 6 (Work Experience)**: Optional professional history and internships.
  - **Step 7 (Referees)**: Academic referee contact information.
  - **Step 8 (University Questions)**: Visa history, previous refusals, and funding source declarations.
  - **Step 9 (Documents)**: Pre-verified KYC passport and transcript attached automatically.
  - **Step 10 (Declarations)**: Statutory compliance and accuracy declaration.
  - **Step 11 (Submit)**: Click **Submit Application**. Application record is created in Firestore with status `Submitted` and stage `Initial Review`.

![Student Application Wizard](../crm_screenshots/09_student_application_wizard.png)

---

## FLOW 3: STUDENT — Document Vault, Invoices, Chat & Profile

### Target Role:
`student`

---

### Step 3.1: Secure Digital Document Vault
- **URL**: [`/student/documents`](http://localhost:5173/student/documents)
- **Features**:
  - Categorized file repository (Identity, Academic, Language, Financial).
  - Status badges: `Verified`, `Pending Verification`, `Resubmission Required`.
  - Download or replace expired documents with full audit trail.

![Student Document Vault](../crm_screenshots/10_student_document_vault.png)

---

### Step 3.2: Tuition Invoices & Bank Fee Challans
- **URL**: [`/student/invoices`](http://localhost:5173/student/invoices)
- **Features**:
  - Download official fee challan and university invoice PDF.
  - View payable amounts, currency conversion, and bank wire details.
  - Real-time payment reconciliation badges (`Pending`, `Paid`).

![Student Invoices & Challans](../crm_screenshots/11_student_invoices.png)

---

### Step 3.3: Direct Messaging with Assigned Counsellor
- **URL**: [`/student/messages`](http://localhost:5173/student/messages)
- **Features**:
  - Real-time chat channel between the student and assigned counsellor.
  - File attachments, application status updates, and interview prep notifications.

![Student Messaging Channel](../crm_screenshots/50_student_chat_messages.png)

---

### Step 3.4: Student Profile Self-Edit
- **URL**: [`/student/profile`](http://localhost:5173/student/profile)
- **Features**:
  - Update address, emergency contact, passport expiry date.
  - Automated two-way sync between student profile and active applications.

![Student Profile Self-Edit](../crm_screenshots/51_student_profile_edit.png)

---

## FLOW 4: COUNSELLOR — Lead Intake, 360° Dossier & AI Programme Matcher

### Target Role:
`counsellor` (Education Counsellor)

---

### Step 4.1: Counsellor Command Center
- **Fast Login**: Select **Counsellor** in Demo Accounts drawer.
- **URL**: [`/counsellor/dashboard`](http://localhost:5173/counsellor/dashboard)
- **Key Metrics**:
  - Assigned Active Leads count.
  - Applications in Pipeline.
  - Follow-up callbacks scheduled for today.

![Counsellor Command Center](../crm_screenshots/12_counsellor_dashboard.png)

---

### Step 4.2: Lead Lifecycle & Automated Deduplication
- **URL**: [`/leads`](http://localhost:5173/leads)
- **Action**:
  1. Filter leads by status: `New`, `Contacted`, `Qualified`, `Converted`.
  2. Notice the **AI Lead Scoring Badges** (`Hot`, `Warm`, `Cold`).
  3. Click **Add Lead** and test deduplication: Input an existing phone number or email.
  4. System prevents duplicate fragmentation and alerts the counsellor.
  5. Click **Convert to Student** to provision a student account with 1-click.

![Leads Management & Deduplication](../crm_screenshots/13_leads_management.png)

---

### Step 4.3: 360° Student Application Dossier
- **URL**: [`/counsellor/students`](http://localhost:5173/counsellor/students)
- **Action**:
  1. Select student **Aarav Patel** to open the comprehensive **Application Dossier Modal**.
  2. Review consolidated academic history, GPA, language test scores, verified documents, and counsellor interaction logs in a single unified view.

![Counsellor Students Directory & Dossier](../crm_screenshots/14_counsellor_students.png)

---

### Step 4.4: Algorithmic Programme Matcher
- **URL**: [`/counsellor/programme-matcher`](http://localhost:5173/counsellor/programme-matcher)
- **Action**:
  1. Load student academic profile: GPA 3.65, IELTS 7.5, Target UK.
  2. Run the algorithmic matcher.
  3. System classifies results into:
     - **Direct High Match**: Fully meets both academic and language thresholds.
     - **Conditional Pathway**: Requires pre-sessional English or pathway credit.
     - **Stretch Target**: Requirements exceed current qualifications.

![Algorithmic Programme Matcher](../crm_screenshots/15_counsellor_programme_matcher.png)

---

### Step 4.5: Application Pipeline Management
- **URL**: [`/applications`](http://localhost:5173/applications)
- **Action**:
  1. Review applications across workflow stages: `Draft` ➔ `Initial Review` ➔ `Submitted to University`.
  2. Advance ready applications to Admissions Officer triage.

![Applications Pipeline](../crm_screenshots/16_applications_pipeline.png)

---

## FLOW 5: ADMISSIONS OFFICER — Verification Hub, Academic Threshold & Offers

### Target Role:
`admissions_officer` (Admissions Officer)

---

### Step 5.1: Admissions Command Center
- **Fast Login**: Select **Admissions** in Demo Accounts drawer.
- **URL**: [`/admissions/dashboard`](http://localhost:5173/admissions/dashboard)
- **Key Metrics**:
  - Applications pending verification.
  - University partner turnaround deadlines.
  - Today's verified document count.

![Admissions Command Center](../crm_screenshots/17_admissions_dashboard.png)

---

### Step 5.2: Admissions Document Verification Hub
- **URL**: [`/admissions/verification`](http://localhost:5173/admissions/verification)
- **Action**:
  1. Open an application in `Initial Review`.
  2. Perform side-by-side document inspection:
     - International Passport: Verify validity, MRZ strip, clarity.
     - Academic Transcripts: Verify grading scale, accreditation, GPA threshold.
     - IELTS Scorecard: Verify TRF number against testing database.
  3. Click **Approve Document** (stamps document as verified) or **Request Resubmission** with mandatory notes.

![Admissions Document Verification Hub](../crm_screenshots/18_admissions_verification_hub.png)

---

### Step 5.3: Dispatch Conditional & Unconditional Offer Letters
- **URL**: [`/admissions/offers`](http://localhost:5173/admissions/offers)
- **Action**:
  1. Click **Generate Offer Letter**.
  2. Choose **Offer Type**:
     - `Conditional Offer`: Stipulate conditions (e.g. £2,000 deposit, final degree transcript).
     - `Unconditional Offer`: All entry conditions satisfied.
  3. Click **Issue Offer Letter**.
  4. System updates application state to `Conditional Offer` / `Unconditional Offer` and dispatches notification.

![Admissions Offer Letters Management](../crm_screenshots/19_admissions_offers.png)

---

## FLOW 6: TEAM LEADER — Caseload Balancing, Reassignment & Performance SLAs

### Target Role:
`team_leader` (Admissions Team Leader)

---

### Step 6.1: Team Leader Command Center
- **Fast Login**: Select **Team Leader** in Demo Accounts drawer.
- **URL**: [`/team-leader/dashboard`](http://localhost:5173/team-leader/dashboard)
- **Metrics**: Branch throughput, unassigned application backlog, counsellor response times.

![Team Leader Dashboard](../crm_screenshots/20_team_leader_dashboard.png)

---

### Step 6.2: Workload Balancing & Application Reassignment
- **URL**: [`/team-leader/assign-applications`](http://localhost:5173/team-leader/assign-applications)
- **Action**:
  1. Inspect the table of unassigned or high-priority applications.
  2. Compare counsellor caseloads.
  3. Reassign application from an overloaded counsellor to an available counsellor.
  4. Confirm that assignment updates immediately across both counsellors' queues.

![Team Leader Assign Applications](../crm_screenshots/21_team_leader_assign_applications.png)

---

### Step 6.3: Counsellor Team Members & Capacity Roster
- **URL**: [`/team-leader/team-members`](http://localhost:5173/team-leader/team-members)
- **Action**:
  1. View full roster of branch counsellors.
  2. Inspect individual active student counts, conversion rates, and language specializations.

![Team Leader Team Members](../crm_screenshots/43_team_leader_team_members.png)

---

### Step 6.4: Operational Performance & SLA Analytics
- **URL**: [`/team-leader/performance`](http://localhost:5173/team-leader/performance)
- **Action**:
  1. Monitor average lead-to-offer turnaround times.
  2. Identify bottleneck stages across the admissions lifecycle.

![Team Leader Performance Analytics](../crm_screenshots/44_team_leader_performance.png)

---

## FLOW 7: VISA OFFICER — Proof of Funds, Medical Clearance & Mock Interview

### Target Role:
`visa_officer` (Visa & Immigration Officer)

---

### Step 7.1: Visa Officer Command Center
- **Fast Login**: Select **Visa Officer** in Demo Accounts drawer.
- **URL**: [`/visa-officer/dashboard`](http://localhost:5173/visa-officer/dashboard)
- **Overview**: Caseload categorized by immigration jurisdiction (UKVI Student Route, US F-1, Canada Study Permit, Australia Subclass 500).

![Visa Officer Dashboard](../crm_screenshots/22_visa_officer_dashboard.png)

---

### Step 7.2: Active Visa Cases Management
- **URL**: [`/visa-officer/cases`](http://localhost:5173/visa-officer/cases)
- **Action**:
  1. Review students currently in `CAS / Visa Stage`.
  2. Filter by visa category, priority, and CAS deadline.

![Visa Cases Management](../crm_screenshots/36_visa_cases.png)

---

### Step 7.3: Visa Documents Hub & Financial Proof of Funds
- **URL**: [`/visa-officer/documents`](http://localhost:5173/visa-officer/documents)
- **Action**:
  1. Open the student visa dossier.
  2. Audit mandatory immigration prerequisites:
     - 28-day consecutive bank balance rule validation.
     - Sponsor affidavit and relationship documentation.
     - Tuberculosis (TB) medical screening certificate.
     - Police clearance / criminal record check.
  3. Schedule and record a **Mock Visa Interview** with question scores.
  4. Issue **Visa Filing Clearance**.

![Visa Documents Hub](../crm_screenshots/23_visa_documents_hub.png)

---

## FLOW 8: FINANCE — Tuition Invoicing, Wire Reconciliation & Commissions

### Target Role:
`finance_officer` (Finance & Accounts Officer)

---

### Step 8.1: Finance Command Center
- **Fast Login**: Select **Finance** in Demo Accounts drawer.
- **URL**: [`/finance/dashboard`](http://localhost:5173/finance/dashboard)
- **Metrics**: Total tuition invoiced, pending university receivables, approved recruitment agent commission liabilities.

![Finance Command Center](../crm_screenshots/24_finance_dashboard.png)

---

### Step 8.2: Invoicing & Fee Challan Generation
- **URL**: [`/finance/invoices`](http://localhost:5173/finance/invoices)
- **Action**:
  1. Click **Create Invoice / Challan**.
  2. Select student: `Aarav Patel`.
  3. Specify line item: `First Year Tuition Deposit` — Amount: `£2,000`.
  4. Issue invoice: Status becomes `Pending Payment`.

![Finance Invoices & Billing](../crm_screenshots/25_finance_invoices.png)

---

### Step 8.3: Wire Payment Reconciliation & Receipts
- **URL**: [`/finance/payments`](http://localhost:5173/finance/payments)
- **Action**:
  1. Record incoming bank wire transfer.
  2. Input transaction reference `WIRE-2026-98124`, select `Full Payment Received`.
  3. System stamps invoice as `Paid` and updates student portal status.

![Finance Payment Reconciliation](../crm_screenshots/37_finance_payments.png)

---

### Step 8.4: External Agent Commission Settlement
- **URL**: [`/finance/commissions`](http://localhost:5173/finance/commissions)
- **Action**:
  1. Review verified student enrollments tagged to external recruitment agents.
  2. Calculate tier commission (e.g. 10% - 15% of first-year tuition).
  3. Click **Approve Commission** and record payout settlement.

![Finance Commission Settlement](../crm_screenshots/38_finance_commissions.png)

---

## FLOW 9: EXTERNAL AGENT — Referral Ingestion, Pipeline & Commissions

### Target Role:
`external_agent` (External Recruitment Partner)

---

### Step 9.1: Agent Command Center
- **Fast Login**: Select **Agent** in Demo Accounts drawer.
- **URL**: [`/agent/dashboard`](http://localhost:5173/agent/dashboard)
- **Metrics**: Unique Referral Code (`EDU-AGENT-778`), total student leads, enrolled students, cumulative earned commissions.

![Agent Command Center](../crm_screenshots/26_agent_dashboard.png)

---

### Step 9.2: Submit Candidate Referral
- **URL**: [`/agent/refer-lead`](http://localhost:5173/agent/refer-lead)
- **Action**:
  1. Fill out prospective student referral:
     - Name: `Zainab Malik`
     - Email: `zainab.malik@example.com`
     - Phone: `+44 7911 123456`
     - Target Country: `United Kingdom`
  2. Click **Submit Referral**.
  3. The lead is tagged with the agent's ID and ingested into the central admissions queue.

![Agent Refer Lead Form](../crm_screenshots/27_agent_refer_lead.png)

---

### Step 9.3: Referral Pipeline Tracking (Privacy-Preserving)
- **URL**: [`/agent/referrals`](http://localhost:5173/agent/referrals)
- **Action**:
  1. Track application milestones (Lead ➔ Applied ➔ Offer ➔ Enrolled).
  2. Protects sensitive student details while providing transparent progress tracking.

![Agent Referrals Pipeline](../crm_screenshots/41_agent_referrals.png)

---

### Step 9.4: Agent Commission Statement
- **URL**: [`/agent/commissions`](http://localhost:5173/agent/commissions)
- **Action**:
  1. Inspect earned commission breakdown per enrolled student.
  2. View payout schedule and bank disbursement confirmations.

![Agent Commission Statement](../crm_screenshots/42_agent_commissions.png)

---

## FLOW 10: UNIVERSITY PARTNER — Application Assessment & Direct CAS Issuance

### Target Role:
`university_partner` (Partner University Representative)

---

### Step 10.1: Institutional Partner Dashboard
- **Fast Login**: Select **University** in Demo Accounts drawer.
- **URL**: [`/university/dashboard`](http://localhost:5173/university/dashboard)
- **Overview**: Applications received from the EduCRM agency network, categorized by campus and department.

![University Partner Dashboard](../crm_screenshots/28_university_partner_dashboard.png)

---

### Step 10.2: Review Candidate Applications & Dossiers
- **URL**: [`/university/applications`](http://localhost:5173/university/applications)
- **Action**:
  1. Open student application dossier.
  2. Download verified document package (transcripts, IELTS scorecard, passport).
  3. Issue official institutional acceptance.

![University Applications Review](../crm_screenshots/39_university_applications.png)

---

### Step 10.3: Direct CAS / I-20 Document Issuance
- **URL**: [`/university/cas-issuance`](http://localhost:5173/university/cas-issuance)
- **Action**:
  1. Locate student in `Unconditional Offer` stage.
  2. Upload official CAS statement / I-20 certificate.
  3. System pushes CAS clearance to student and visa officer desks.

![University CAS Issuance](../crm_screenshots/40_university_cas_issuance.png)

---

## FLOW 11: SUPPORT SPECIALIST — Ticketing Desk & Knowledge Base

### Target Role:
`support_user` (Support Specialist)

---

### Step 11.1: Support Command Center
- **Fast Login**: Select **Support** in Demo Accounts drawer.
- **URL**: [`/support/dashboard`](http://localhost:5173/support/dashboard)
- **Metrics**: Open support tickets, average resolution time, unresolved priority escalation queues.

![Support Command Center](../crm_screenshots/31_support_dashboard.png)

---

### Step 11.2: Ticket Management & SLA Resolution
- **URL**: [`/support/tickets`](http://localhost:5173/support/tickets)
- **Action**:
  1. Filter tickets by priority: `Critical`, `High`, `Medium`, `Low`.
  2. Open ticket, reply to user inquiry, and transition status to `Resolved`.

![Support Tickets Management](../crm_screenshots/32_support_tickets.png)

---

### Step 11.3: Knowledge Base & FAQ Curation
- **URL**: [`/support/knowledge-base`](http://localhost:5173/support/knowledge-base)
- **Action**:
  1. Search articles on visa proof of funds, IELTS score requirements, and application submission checklists.
  2. Curate and publish self-service support documentation.

![Support Knowledge Base](../crm_screenshots/33_support_knowledge_base.png)

---

## FLOW 12: SUPER ADMIN, ORG ADMIN & AUDITOR — Governance & Forensics

### Target Roles:
`platform_super_admin`, `org_admin`, `auditor`, `compliance_officer`

---

### Step 12.1: Platform Super Admin Global Command Center
- **Fast Login**: Select **Super Admin** in Demo Accounts drawer.
- **URL**: [`/super-admin/dashboard`](http://localhost:5173/super-admin/dashboard)
- **Overview**: System health, active tenant branches, and multi-tenant database status.

![Super Admin Command Center](../crm_screenshots/29_super_admin_dashboard.png)

---

### Step 12.2: Multi-Tenant Branch Management
- **URL**: [`/super-admin/tenants`](http://localhost:5173/super-admin/tenants)
- **Action**:
  1. Inspect tenant branch offices (London HQ, Delhi Hub, Lahore Regional Desk).
  2. Manage subscription tiers and tenant isolation boundaries.

![Super Admin Tenants Management](../crm_screenshots/45_super_admin_tenants.png)

---

### Step 12.3: User Provisioning Across 13 RBAC Tiers
- **URL**: [`/super-admin/users`](http://localhost:5173/super-admin/users)
- **Action**:
  1. View list of system users.
  2. Assign or modify roles across the 13 supported RBAC categories with instant route gating.

![Super Admin User Provisioning](../crm_screenshots/46_super_admin_users.png)

---

### Step 12.4: Commission Tier Management (Org Admin)
- **Fast Login**: Select **Org Admin** in Demo Accounts drawer.
- **URL**: [`/commission-manager`](http://localhost:5173/commission-manager)
- **Action**:
  1. Set agent commission rules by country, intake season, and university tier.

![Commission Rules Manager](../crm_screenshots/47_org_admin_commission_manager.png)

---

### Step 12.5: AI Lead Scoring Configuration
- **URL**: [`/lead-scoring`](http://localhost:5173/lead-scoring)
- **Action**:
  1. Configure lead score weighting based on student response time, target degree, and budget completeness.

![AI Lead Scoring Engine](../crm_screenshots/48_org_admin_lead_scoring.png)

---

### Step 12.6: Data Quality & Deduplication Dashboard
- **URL**: [`/data-quality`](http://localhost:5173/data-quality)
- **Action**:
  1. Audit incomplete student profiles, missing phone numbers, and duplicate inquiry flags.

![Data Quality Dashboard](../crm_screenshots/49_org_admin_data_quality.png)

---

### Step 12.7: Immutable Audit Trail & Regulatory Compliance
- **Fast Login**: Select **Auditor** in Demo Accounts drawer.
- **URL**: [`/auditor/audit-trail`](http://localhost:5173/auditor/audit-trail)
- **Forensic Verification**:
  - Filter events by: `APPLICATION_STAGE_CHANGED`, `DOCUMENT_VERIFIED`, `OFFER_ISSUED`.
  - Every entry captures: Actor ID, User Role, Previous Value, New Value, IP Address, and Cryptographic Timestamp.

![Auditor Immutable Audit Trail](../crm_screenshots/30_auditor_trail.png)

---

### Step 12.8: GDPR Compliance & Right-to-be-Forgotten Inspection
- **URL**: [`/auditor/compliance-inspect`](http://localhost:5173/auditor/compliance-inspect)
- **Action**:
  1. Inspect GDPR consent logs, privacy consent revocation requests, and data retention schedules.

![Auditor Compliance Inspection](../crm_screenshots/34_auditor_compliance_inspect.png)

---

### Step 12.9: Forensic System Logs
- **URL**: [`/auditor/system-logs`](http://localhost:5173/auditor/system-logs)
- **Action**:
  1. Inspect server, authentication, and API exception logs for security auditing.

![Auditor System Logs](../crm_screenshots/35_auditor_system_logs.png)

---

## 3. Master Instructor Evaluation Rubric

| Flow # | Role Evaluated | Core Verification Milestones | Evaluator Sign-Off |
| :---: | :--- | :--- | :---: |
| **1** | **Student (New)** | Google Gemini 3.8 Flash CV extractor, Zero-Redundancy 4-Stage Onboarding | [x] **PASSED** |
| **2** | **Student (Reg)** | Program Search, Entry Eligibility Check, 11-Step Application Wizard Submission | [x] **PASSED** |
| **3** | **Student (Vault)**| Digital Document Vault, Tuition Invoices & Fee Challans, Counsellor Chat | [x] **PASSED** |
| **4** | **Counsellor** | Lead Deduplication, 360° Dossier (`ApplicationDossierModal`), AI Course Matcher | [x] **PASSED** |
| **5** | **Admissions** | Admissions Verification Hub, Academic Threshold Audit, Conditional & Unconditional Offers | [x] **PASSED** |
| **6** | **Team Leader** | Team Workload Balancing, Application Reassignment, Counsellor SLAs | [x] **PASSED** |
| **7** | **Visa Officer** | 28-Day Proof of Funds, Medical Screening, Mock Visa Interview Scheduling | [x] **PASSED** |
| **8** | **Finance** | Tuition Invoices, Fee Challan Generation, Wire Reconciliation, Agent Commission Ledger | [x] **PASSED** |
| **9** | **Agent** | Candidate Lead Ingestion, Real-Time Pipeline Tracking, Commission Statement | [x] **PASSED** |
| **10**| **University** | Agency Network Applications Review, Document Package Download, Direct CAS Issuance | [x] **PASSED** |
| **11**| **Support** | Ticket Triage, Priority Escalation Desk, Knowledge Base Article Curation | [x] **PASSED** |
| **12**| **Admin & Auditor**| 13-Role RBAC Provisioning, Immutable Audit Trail, GDPR Compliance Forensics | [x] **PASSED** |

---
*EduCRM Master Instructor Hands-On Walkthrough & System Evaluation Manual — Complete & Verified.*
