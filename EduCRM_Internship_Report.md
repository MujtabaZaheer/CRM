# Summer Internship Report

<br/>

**Name:** Mujtaba Zaheer  
**Reg No:** [BSE21XXXX / Enter Your Reg No]  
**Internship Duration:** 6 Weeks  

<br/>

### DEPARTMENT OF SOFTWARE ENGINEERING  
### CAPITAL UNIVERSITY OF SCIENCE AND TECHNOLOGY, ISLAMABAD  

<div style="page-break-after: always;"></div>

---

# 1. Document Control

| Item | Details |
| :--- | :--- |
| **Report Title** | Internship Progress Report — Comprehensive Education CRM and Student Application Lifecycle Management Platform (EduCRM) |
| **Student Name** | Mujtaba Zaheer |
| **Registration No.** | [BSE21XXXX / Enter Your Reg No] |
| **Degree Program** | Bachelor of Science in Software Engineering (BSSE) |
| **Department** | Department of Software Engineering |
| **University** | Capital University of Science and Technology (CUST), Islamabad |
| **Host Organization** | [Enter Host Organization / e.g., EduGlobal Solutions / Yuni (SMC-Pvt) Limited] |
| **Internship Position** | Full-Stack Software Engineering Intern |
| **Internship Start Date** | [03 August 2026 / Enter Start Date] |
| **Internship Duration** | Six (6) Weeks |
| **Internship Course** | SE4100 - Software Engineering Internship |
| **Academic Supervisor** | [Enter Faculty Supervisor Name / Department Coordinator] |
| **Industry Supervisor** | [Enter Industry Supervisor Name / Chief Technology Officer] |

<div style="page-break-after: always;"></div>

---

# Table of Contents

1. [Document Control](#1-document-control)
2. [Executive Summary](#2-executive-summary)
3. [Acknowledgement](#3-acknowledgement)
4. [Introduction](#4-introduction)
   - 4.1 [Internship Overview](#41-internship-overview)
   - 4.2 [Internship Objectives](#42-internship-objectives)
   - 4.3 [Role and Responsibilities](#43-role-and-responsibilities)
5. [Organization Overview](#5-organization-overview)
   - 5.1 [Host Organization Profile](#51-host-organization-profile)
   - 5.2 [Internship Environment and Agile Workflow](#52-internship-environment-and-agile-workflow)
6. [Technical Areas and Tools](#6-technical-areas-and-tools)
7. [Detailed Internship Progress](#7-detailed-internship-progress)
   - 7.1 [Week 1 – Multi-Tenant Architecture, Security Rules & RBAC Foundation](#71-week-1--multi-tenant-architecture-security-rules--rbac-foundation)
   - 7.2 [Week 2 – Lead Lifecycle, Dynamic Form Builder & Intelligent Routing](#72-week-2--lead-lifecycle-dynamic-form-builder--intelligent-routing)
   - 7.3 [Week 3 – Student Self-Service Portal & Application Lodgement Wizard](#73-week-3--student-self-service-portal--application-lodgement-wizard)
   - 7.4 [Week 4 – The 20-Stage Application Pipeline & Departmental Desks](#74-week-4--the-20-stage-application-pipeline--departmental-desks)
   - 7.5 [Week 5 – AI Counsellor Suite Integration & Document Intelligence](#75-week-5--ai-counsellor-suite-integration--document-intelligence)
   - 7.6 [Week 6 – Partner Agent Network, Commission Engine & Comprehensive QA](#76-week-6--partner-agent-network-commission-engine--comprehensive-qa)
   - 7.7 [System Verification, Performance Optimization, and Technical Documentation](#77-system-verification-performance-optimization-and-technical-documentation)
8. [Learning Outcomes and Skills Developed](#8-learning-outcomes-and-skills-developed)
   - 8.1 [Technical Skills](#81-technical-skills)
   - 8.2 [Software Engineering Methodologies](#82-software-engineering-methodologies)
   - 8.3 [Professional & Collaborative Competencies](#83-professional--collaborative-competencies)
9. [Challenges and Problem-Solving](#9-challenges-and-problem-solving)
10. [Professional and Workplace Development](#10-professional-and-workplace-development)
11. [Conclusion](#11-conclusion)
12. [Annexure A: Internship Offer Letter](#12-annexure-a-internship-offer-letter)
13. [Annexure B: Completion Certificate](#13-annexure-b-completion-certificate)
14. [Annexure C: Internship Evaluation Form](#14-annexure-c-internship-evaluation-form)

<div style="page-break-after: always;"></div>

---

# 2. Executive Summary

This internship progress report documents the engineering achievements and technical competencies developed during a six-week professional Software Engineering internship. The role was designated as **Full-Stack Software Engineering Intern**, focused on architecting and delivering **EduCRM**, a modern, multi-tenant Education Customer Relationship Management (CRM) and Student Application Lifecycle Management Platform.

International student recruitment and university admissions operations are historically plagued by fragmented spreadsheets, manual document verification bottlenecks, lack of role clarity between counselling, admissions, finance, and visa teams, and slow turnaround times. EduCRM was conceptualized and developed to solve these operational pain points through a unified, cloud-native web application built using **React 19, TypeScript, Tailwind CSS, Vite, and Google Firebase (Authentication, Cloud Firestore, and Cloud Storage)**, augmented with an **AI Counsellor Suite powered by the Google Gemini API**.

The six-week internship was structured into systematic engineering sprints:
1. **Week 1** established the multi-tenant architectural foundation, role-based access control (RBAC) supporting 13 distinct user roles, Firestore document models, and security rules guarding organizational boundaries.
2. **Week 2** engineered the lead acquisition pipeline, including an embeddable public Form Builder, automated lead scoring, deduplication algorithms, and workload-balanced routing.
3. **Week 3** delivered the self-service Student Portal, featuring student onboarding, profile completeness tracking, and a dynamic university application lodgement wizard.
4. **Week 4** implemented the flagship 20-stage application lifecycle pipeline, connecting four dedicated departmental desks (Counselling Desk, Admissions Desk with 1-click offer generation, Finance Desk with automated fee challan generation, and Visa/Immigration Desk).
5. **Week 5** integrated the AI Counsellor Suite, delivering OCR and document information extraction (CV/Resume parsing), statement of purpose evaluation, and zero-cost document storage integration.
6. **Week 6** finalized the External Agent Referral Portal, multi-tier commission disbursement engine, end-to-end testing suite (Playwright and Vitest), responsive UI polish, and production cloud deployment on Firebase Hosting.

The project provided extensive real-world exposure to cloud architecture, distributed state management, asynchronous data streams via Firestore real-time listeners (`onSnapshot`), rigorous software testing, and enterprise access governance.

---

# 3. Acknowledgement

I would like to express my sincere appreciation to my industry supervisor and the software engineering team at the host organization for their invaluable mentorship, technical guidance, and constructive architectural reviews throughout the internship. Their continuous support provided profound insights into enterprise web architecture, secure multi-tenant design, and agile software development standards.

I also extend my deepest gratitude to the **Department of Software Engineering at Capital University of Science and Technology (CUST), Islamabad**, for establishing a rigorous academic curriculum and maintaining the SE4100 Internship Program. This academic framework facilitated the seamless transition of theoretical concepts—such as software design patterns, database normalization, distributed systems, and security engineering—into tangible, high-impact industry software.

Finally, I wish to thank my peers, faculty members, and family whose constant encouragement and feedback fueled my dedication throughout this six-week professional journey.

<div style="page-break-after: always;"></div>

---

# 4. Introduction

## 4.1 Internship Overview
The internship was undertaken as part of the compulsory **SE4100 Software Engineering Internship** course under the Department of Software Engineering, Capital University of Science and Technology (CUST). The program bridges academia and industry by immersing students in high-velocity software engineering teams to solve complex, real-world problems.

The primary project assigned during this tenure was **EduCRM**—an enterprise-grade education consultancy and admissions management software platform. The system is engineered to digitize the complete lifecycle of international student recruitment, encompassing prospective lead intake, automated document ingestion, university matching, conditional/unconditional offer issuance, tuition deposit processing, visa filing, and agent commission settlement.

## 4.2 Internship Objectives
The primary technical and educational goals of the internship included:
- **Enterprise Architecture Application:** Implement clean, modular, and maintainable software architecture using modern React 19, TypeScript, and functional programming patterns.
- **Granular Security & Multi-Tenancy:** Engineer robust Role-Based Access Control (RBAC) and tenant isolation rules in Cloud Firestore to enforce strict data privacy across competing education agencies.
- **State Machine & Pipeline Engineering:** Design a deterministic 20-stage application progression state machine with validation gates preventing premature or unauthorized status transitions.
- **Artificial Intelligence Integration:** Integrate the Google Gemini generative AI API to automate CV data extraction, match candidate profiles with academic prerequisites, and reduce counsellor administrative overhead.
- **Quality Assurance & Verification:** Establish comprehensive automated test coverage spanning unit tests (Vitest) and end-to-end browser journeys (Playwright).
- **Professional Engineering Practices:** Adhere to version control protocols (Git), sprint estimation, technical documentation, code reviews, and production release management.

## 4.3 Role and Responsibilities
As a Full-Stack Software Engineering Intern, key responsibilities comprised:
- Architecting frontend views, component libraries, and custom React hooks for reactive state management.
- Writing and testing Firebase Security Rules (`firestore.rules` and `storage.rules`) to prevent unauthorized document reads and privilege escalation.
- Building domain-specific workflows for Counsellors, Admissions Officers, Finance Officers, and Visa Officers.
- Implementing student self-service onboarding and application submission workflows.
- Integrating external RESTful services, including Google Gemini AI endpoints and file conversion parsers.
- Profiling performance, resolving layout regressions across mobile and desktop viewports, and generating comprehensive architecture specifications and UML sequence diagrams.

<div style="page-break-after: always;"></div>

---

# 5. Organization Overview

## 5.1 Host Organization Profile
The host organization operates at the intersection of educational technology, digital transformation, and software engineering consultancy. Committed to building scalable cloud solutions, the enterprise develops digital ecosystems that empower educational institutions, consultancy agencies, and university recruitment offices worldwide.

The organization's engineering culture champions engineering autonomy, test-driven reliability, user-centric interface design, and modern serverless paradigms. Operating under agile principles, the tech division prioritizes modular codebases, rapid prototyping, and high security standards.

## 5.2 Internship Environment and Agile Workflow
The internship operated under a structured **hybrid agile software engineering workflow**:
- **Sprint Cadence:** Development was planned in weekly sprint cycles with defined user stories, acceptance criteria, and milestone deliverables.
- **Technical Standups:** Regular sync-ups with team leaders to resolve technical blockers, review pull requests, and audit edge cases.
- **Version Control & CI/CD:** Source code was maintained within a centralized Git repository, leveraging trunk-based development with feature branches, code formatting standards, and automated pre-commit linting.
- **Documentation Standards:** Architectural decisions, data schemas, and API contracts were formally documented to ensure team-wide alignment and future extensibility.

<div style="page-break-after: always;"></div>

---

# 6. Technical Areas and Tools

The following table summarizes the core technical domains, tools, and libraries utilized throughout the development of EduCRM:

| Domain / Technical Area | Technologies & Tools | Application & Purpose in EduCRM |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite | Core single-page application framework delivering reactive UI components, strict type-safety, and rapid hot-module replacement (HMR). |
| **Styling & Design System** | Tailwind CSS v4, Lucide React | Curated, responsive component styling, custom color-coded department themes, and modern iconographic representations. |
| **Backend as a Service (BaaS)** | Google Cloud Firestore (NoSQL) | Real-time document database storing multi-tenant organizations, leads, applications, student records, notifications, and audit logs. |
| **Authentication & IAM** | Firebase Authentication | Email/password authentication, email verification flows, role claims, and session persistence across browser sessions. |
| **Cloud Storage** | Firebase Cloud Storage | Secure repository for student passports, academic transcripts, offer letters, fee challans, and visa grants. |
| **Artificial Intelligence (AI)** | Google Gemini API (REST) | Extraction of student details from resumes/CVs, statement of purpose grammar auditing, and programme recommendation heuristics. |
| **Data Parsing & Ingestion** | PDF.js, Mammoth.js | Browser-based parsing of `.pdf` and `.docx` student files for client-side text extraction prior to AI processing. |
| **Data Visualization & Analytics** | Recharts | Interactive conversion funnel charts, monthly application trends, counsellor workload distributions, and financial forecasts. |
| **Testing & Quality Assurance** | Vitest, Playwright, Testing Library | Unit testing of authorization logic, end-to-end automated testing of student lodgement journeys, and regression prevention. |
| **Application Hosting & CI** | Firebase Hosting, Vercel | Production cloud deployment with SSL certification, global CDN caching, and custom domain routing. |

<div style="page-break-after: always;"></div>

---

# 7. Detailed Internship Progress

```
+---------------------------------------------------------------------------------------------------+
|                                  SIX-WEEK SPRINT ROADMAP: EduCRM                                  |
+---------------------------------------------------------------------------------------------------+
|  Week 1: Multi-Tenant Architecture, Security Rules & RBAC Foundation                              |
|  Week 2: Lead Acquisition, Intelligent Routing, Scoring & Deduplication Engine                    |
|  Week 3: Student Self-Service Portal & Application Lodgement Wizard                               |
|  Week 4: The 20-Stage Application Pipeline, Inter-Desk Handoffs & 1-Click Actions                 |
|  Week 5: AI Counsellor Suite Integration, Document Parsing & Google Drive Integration             |
|  Week 6: External Agent Management, Commission Engine, End-to-End QA Testing & Cloud Deployment   |
+---------------------------------------------------------------------------------------------------+
```

## 7.1 Week 1 – Multi-Tenant Architecture, Security Rules & RBAC Foundation

The opening week established the architectural bedrock of EduCRM. The challenge was to support multi-tenant operational isolation—allowing distinct education consulting agencies to operate securely on a single platform instance without data leakage.

### Key Engineering Accomplishments:
- **Domain Modeling & Firestore Schema Design:** Designed normalized schemas for `organizations`, `offices`, `users`, `leads`, `students`, `applications`, `universities`, and `audit_logs`.
- **Role-Based Access Control (RBAC) System:** Formulated 13 configurable user roles, including Platform Super Admin, Organization Admin, Office Manager, Team Leader, Counsellor, Admissions Officer, Compliance Officer, Finance Officer, External Agent, University Partner, Student, Auditor, and Support User.
- **Declarative Security Rules:** Wrote comprehensive rules in `firestore.rules` enforcing tenant isolation (`request.auth.token.orgId == resource.data.orgId`) and role-based permissions preventing unauthorized privilege escalation.
- **Global Authentication Context:** Engineered `AuthContext.tsx` and custom routing guards (`RoleRoute.tsx`) to sanitize user sessions, handle password recovery, and enforce email verification.

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 1 - Architecture & Security RBAC Flow Diagram]                         |
| File to use: diagrams_png/SD1_Authentication_and_Impersonation.png                                |
+---------------------------------------------------------------------------------------------------+
```
*Figure 1: Authentication lifecycle, token validation, and multi-tenant security boundary enforcement.*

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 2 - Cloud Firestore Console & Collections Architecture]                |
| Capture: Screenshot of Firebase Console showing Firestore Database collections:                  |
|          "organizations", "users", "applications", "leads", and security rules tab.               |
+---------------------------------------------------------------------------------------------------+
```
*Figure 2: Cloud Firestore NoSQL collection hierarchy and multi-tenant document schemas.*

<div style="page-break-after: always;"></div>

---

## 7.2 Week 2 – Lead Lifecycle, Dynamic Form Builder & Intelligent Routing

Week 2 focused on top-of-funnel student acquisition. Consultancy agencies capture leads from education expos, online advertisements, and referrals; EduCRM needed automated mechanisms to ingest, score, deduplicate, and assign these leads.

### Key Engineering Accomplishments:
- **Dynamic Form Builder (`FormBuilder.tsx`):** Built a drag-and-drop dynamic form designer enabling agency admins to create custom inquiry questionnaires with validation rules.
- **Public Form Landing Engine (`PublicFormPage.tsx`):** Implemented high-performance public form endpoints that allow anonymous visitors to submit inquiries without authentication.
- **Intelligent Lead Scoring Engine (`LeadScoringConfig.tsx`):** Programmed algorithmic heuristics that compute lead readiness scores (0–100) based on academic qualifications, English language proficiency test scores (IELTS/PTE), target intake proximity, and financial readiness.
- **Automated Deduplication & Routing:** Developed duplicate-detection logic matching normalized email addresses and phone numbers. Integrated round-robin and workload-balanced routing algorithms assigning incoming leads to available counsellors based on destination country specialization.

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 3 - Lead Management Pipeline & Deduplication System]                   |
| Screen: Navigate to /leads page in EduCRM.                                                        |
| Details: Capture the Lead Board showing lead cards, status filters (New, Contacted, Qualified),    |
|          and lead scoring badges. Alternatively use SD2_Lead_Lifecycle_and_Deduplication.png      |
+---------------------------------------------------------------------------------------------------+
```
*Figure 3: Lead Management Pipeline displaying lead qualification stages and algorithmic readiness scores.*

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 4 - Public Form Builder & Dynamic Lead Capture View]                    |
| Screen: Navigate to /form-builder or open a generated public form (/forms/:formId).               |
| Details: Show the form builder fields configuration panel alongside the live responsive preview.  |
+---------------------------------------------------------------------------------------------------+
```
*Figure 4: Dynamic Form Builder interface allowing custom inquiry creation and automated lead routing.*

<div style="page-break-after: always;"></div>

---

## 7.3 Week 3 – Student Self-Service Portal & Application Lodgement Wizard

During Week 3, the focus shifted to applicant empowerment. Previously, counsellors manually entered every student detail. We introduced a dedicated Student Portal enabling self-service onboarding and application tracking.

### Key Engineering Accomplishments:
- **Multi-Stage Student Onboarding (`StudentOnboardingStage1.tsx`, `Stage3.tsx`):** Created a progressive profiling wizard capturing personal identity, educational history, test scores, and emergency contacts.
- **Self-Service Application Lodgement (`StudentNewApplication.tsx`):** Engineered a form where authenticated students select partner universities, choose degree programmes, pick target intakes (e.g., Fall 2026), and attach prerequisites.
- **Reactive Student Dashboard (`RolePortal.tsx`):** Implemented a personalized student view showing submitted applications, pending document requests, real-time stage progress bars, and direct counsellor messaging.
- **Document Dossier Manager:** Built a secure file uploader supporting format validation, size checks, and instant preview of uploaded PDF/Word documents.

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 5 - Student Self-Service Portal Dashboard]                             |
| Screen: Log in as a student user and navigate to /student/dashboard.                              |
| Details: Show active student profile, application progress indicators, and document status cards.|
+---------------------------------------------------------------------------------------------------+
```
*Figure 5: Student Portal Dashboard showing application status, profile completeness, and notifications.*

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 6 - Multi-Stage Student Application Lodgement Form]                    |
| Screen: Navigate to /student/new-application.                                                     |
| Details: Capture the application form with University selector, Programme dropdown, Intake date,  |
|          and document attachment zone.                                                            |
+---------------------------------------------------------------------------------------------------+
```
*Figure 6: Student Application Lodgement Wizard with institutional programme lookup and document upload.*

<div style="page-break-after: always;"></div>

---

## 7.4 Week 4 – The 20-Stage Application Pipeline & Departmental Desks

Week 4 comprised the most complex engineering module: implementing the 20-stage application lifecycle pipeline and segregating operational tasks into departmental desks with 1-click approvals and strict RBAC authorization guards.

### Key Engineering Accomplishments:
- **The 20-Stage Finite State Machine:** Enforced state progression in `stageAuthorization.ts`:
  1. *Counselling Desk:* Draft → Initial Review → Documents Pending → Ready for Submission → Submitted.
  2. *Admissions Desk:* University Reviewing → Additional Info Requested → Conditional Offer ⚡ → Unconditional Offer ⚡.
  3. *Finance Desk:* Deposit Pending (Challan Issued) → Deposit Paid ⚡ (Payment Cleared).
  4. *Visa Desk:* CAS / COE Pending → CAS Issued ⚡ → Visa Preparation → Visa Submitted ⚡ → Visa Approved ⚡.
  5. *Outcome:* Enrolled ✅ (or Rejected / Withdrawn / Deferred).
- **Stage Ownership & Guard Utility (`canUserSetStage`):** Coded granular ownership rules preventing unauthorized staff from transitioning applications (e.g., only Finance Officers can mark "Deposit Paid"; only Admissions can issue offers).
- **Admissions Desk & 1-Click Offers (`/admissions`):** Built quick-action modals allowing Admissions Officers to review uploaded transcripts and issue institutional offers with a single click, automatically generating and routing the fee challan to the Finance Desk.
- **Finance Desk & Fee Challan Generation (`/finance`):** Implemented invoice generation, student fee challan dispatching, and deposit reconciliation.
- **Visa Desk Management (`/visa`):** Created the CAS tracking module and embassy visa filing checklist.

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 7 - System Sequence Diagram: 20-Stage Cross-Desk Progression]          |
| File to use: diagrams_png/SSD_System_Sequence_Diagram.png                                         |
+---------------------------------------------------------------------------------------------------+
```
*Figure 7: System Sequence Diagram (SSD) demonstrating inter-desk handoffs across Counselling, Admissions, Finance, and Visa desks.*

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 8 - Applications Kanban Pipeline View]                                 |
| Screen: Navigate to /applications in the Staff/Counsellor view.                                   |
| Details: Capture the full horizontal Kanban board showing application cards categorized under     |
|          Draft, Submitted, Conditional Offer, Deposit Paid, Visa Approved, etc.                   |
+---------------------------------------------------------------------------------------------------+
```
*Figure 8: Enterprise Applications Kanban Board illustrating real-time stage distribution and filters.*

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 9 - Admissions Desk 1-Click Offer Issuance Modal]                      |
| Screen: Open an application in /admissions and click "Issue Conditional Offer" or detail modal.   |
| Details: Show the modal displaying applicant qualifications and the 1-Click Approval action.      |
+---------------------------------------------------------------------------------------------------+
```
*Figure 9: Admissions Desk modal featuring verified student credentials and 1-Click Offer Approval.*

<div style="page-break-after: always;"></div>

---

## 7.5 Week 5 – AI Counsellor Suite Integration & Document Intelligence

Week 5 focused on intelligent automation by building the **AI Counsellor Suite**, reducing repetitive manual data entry through client-side document parsing and Google Gemini generative AI.

### Key Engineering Accomplishments:
- **Client-Side Document Ingestion:** Integrated `pdfjs-dist` and `mammoth.js` to parse `.pdf` and `.docx` student CVs directly inside the client browser, mitigating server load and preserving bandwidth.
- **Gemini AI Prompt Engineering & Data Extraction:** Formulated structured JSON prompts submitted to the Gemini API (`gemini-1.5-flash`), extracting candidate Name, Contact Information, Academic Qualifications, GPA/Percentage, Language Scores, and Work Experience.
- **Automated Profile Pre-Filling:** Programmed data binding logic that populates student profile fields automatically from extracted AI results upon user confirmation.
- **AI Rate-Limiting & Cost Optimization:** Designed a debounce and rate-limiting wrapper preventing runaway API consumption and mitigating quota exhaustion.
- **Zero-Cost Storage Architecture:** Implemented cloud storage upload pipelines supporting fallback to Google Drive links to minimize storage costs for large portfolios.

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 10 - AI Counsellor Suite Extraction Architecture]                       |
| File to use: diagrams_png/SD3_Gemini_AI_Counsellor_Suite.png                                      |
+---------------------------------------------------------------------------------------------------+
```
*Figure 10: Component Sequence Diagram for document upload, client-side extraction, and Gemini AI processing.*

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 11 - AI CV Auto-Fill & Extraction Modal in Action]                     |
| Screen: Trigger the "AI CV Auto-Fill" modal on the applicant registration or counsellor page.     |
| Details: Capture the file upload area, parsed text snippet, and extracted structured JSON fields. |
+---------------------------------------------------------------------------------------------------+
```
*Figure 11: AI Counsellor interface demonstrating real-time resume parsing and auto-fill data extraction.*

<div style="page-break-after: always;"></div>

---

## 7.6 Week 6 – Partner Agent Network, Commission Engine & Comprehensive QA

The final development week centered on external business partnerships, financial reconciliation, automated quality assurance testing, and production deployment.

### Key Engineering Accomplishments:
- **External Partner Agent Portal (`Agents.tsx`, `agent/`):** Developed an external partner desk enabling sub-agents to submit referred student dossiers, track admissions status in read-only mode, and upload invoices.
- **Automated Commission Management (`CommissionManager.tsx`):** Implemented commission calculation algorithms computing percentage and fixed payouts upon a student reaching the "Enrolled" milestone.
- **Comprehensive Quality Assurance Suite:**
  - *Unit & Security Tests (Vitest):* Executed privilege escalation tests verifying that lower roles cannot write to admin or finance documents.
  - *End-to-End Tests (Playwright):* Authored automated browser test scripts simulating complete user journeys from student registration to offer acceptance.
- **Production Build & Cloud Hosting:** Configured Vite production optimization (tree-shaking, vendor chunking), deployed Firebase Security Rules, and launched the live build on Firebase Hosting.

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 12 - Agent Network & Commission Disbursement Management]               |
| Screen: Navigate to /commissions or /agents page.                                                 |
| Details: Capture the agent listing, commission rates table, and payout calculation breakdown.     |
|          Alternatively use SD6_Agent_Network_and_Commissions.png                                  |
+---------------------------------------------------------------------------------------------------+
```
*Figure 12: Partner Agent Portal and Automated Commission Disbursement Management interface.*

<br/>

```
+---------------------------------------------------------------------------------------------------+
| [IMAGE PLACEHOLDER: Figure 13 - Automated Test Execution Terminal (Playwright & Vitest)]          |
| Screen: Terminal screenshot of running "npm run test:unit" and "npm run test:e2e".                |
| Details: Display green passing checkmarks across test suites and Playwright HTML test report.      |
+---------------------------------------------------------------------------------------------------+
```
*Figure 13: Terminal test execution log demonstrating 100% passing suites across unit and E2E specs.*

<div style="page-break-after: always;"></div>

---

## 7.7 System Verification, Performance Optimization, and Technical Documentation

Across all sprint milestones, continuous optimization and testing were conducted to ensure system robustness:

1. **State Machine Integrity Testing:** Verified that non-privileged users attempting direct REST calls or client modifications to bypass stage progression are halted by Firestore security rules.
2. **Responsive Viewport Verification:** Tested layout rendering across mobile (375px), tablet (768px), and high-resolution desktop viewports (1920px) using Chrome DevTools.
3. **Firestore Listener Cleanup:** Audited all `useEffect` hooks subscribing to Firestore `onSnapshot` queries, ensuring unsubscriber functions execute on component unmount to eliminate memory leaks.
4. **Architectural & UML Documentation:** Authored complete system documentation, user guides, and Mermaid-based UML sequence diagrams compiling the technical blueprint into a production specification.

<div style="page-break-after: always;"></div>

---

# 8. Learning Outcomes and Skills Developed

## 8.1 Technical Skills
- **Modern Single-Page Application Architecture:** Mastered React 19 functional patterns, custom hook design, strict TypeScript typing, and Vite build tooling.
- **NoSQL Schema & Distributed Data Design:** Gained proficiency in structuring Cloud Firestore collections, subcollections, denormalization strategies for fast reads, and composite indices.
- **Cloud Security & Fine-Grained Authorization:** Acquired expertise in authoring declarative Firebase Security Rules that validate request schemas and evaluate user claims.
- **Generative AI Integration:** Gained practical knowledge in prompt engineering, schema-constrained LLM output generation, and handling API rate limits.
- **Automated Verification:** Deepened skills in authoring unit tests with Vitest and simulating browser interactions with Playwright.

## 8.2 Software Engineering Methodologies
- **State Machine Modeling:** Learned how to decompose complex business processes into deterministic finite state machines, preventing invalid states.
- **Defensive Programming:** Implemented robust form validation, type guards, and error boundary handling.
- **Domain-Driven Design (DDD):** Translated real-world education consultancy processes into structured software components and clear domain models.
- **Performance Profiling:** Learned to identify render bottlenecks, optimize React re-renders with memoization, and prevent listener memory leaks.

## 8.3 Professional & Collaborative Competencies
- **Sprint Management & Autonomy:** Developed discipline in breaking ambiguous system requirements into concrete engineering tasks and meeting delivery deadlines.
- **Technical Communication:** Improved ability to articulate architectural decisions, document API boundaries, and create visual UML diagrams.
- **Regulatory & Compliance Awareness:** Understood the software implications of data privacy (GDPR), student confidentiality, and immutable audit trails.

<div style="page-break-after: always;"></div>

---

# 9. Challenges and Problem-Solving

Throughout the six weeks, several non-trivial engineering challenges were encountered and methodically solved:

### Challenge 1: Enforcing Granular RBAC Across 20 Diverse Application Stages
- **Problem:** Different departments needed write permissions on specific application fields without granting blanket write access to the entire record. For example, a Finance Officer must approve payments but must not alter academic offer letters.
- **Solution:** Designed a centralized authorization map (`stageAuthorization.ts`) paired with field-level validations in `firestore.rules`. Transition permissions are verified both client-side (to disable unauthorized UI buttons) and server-side (to reject malicious requests).

### Challenge 2: AI Counsellor Latency and Quota Rate-Limiting
- **Problem:** Repetitive testing and multiple rapid CV uploads caused the client to hit Gemini API rate limits (HTTP 429), resulting in failed extractions and poor user feedback.
- **Solution:** Implemented client-side text pre-processing using `pdfjs-dist` to strip non-text elements before sending compact payloads to the LLM. Added an 8-second debounce limiter with localStorage locks and graceful fallback messaging.

### Challenge 3: Heavy File Uploads and Storage Costs
- **Problem:** Students frequently uploaded multiple high-resolution scans of certificates, consuming storage quotas rapidly.
- **Solution:** Built client-side image compression and document validation before upload. Additionally engineered an alternate upload pipeline supporting zero-cost Google Drive link attachment.

### Challenge 4: Lead Deduplication in Asynchronous Multi-Channel Capture
- **Problem:** Prospective students submitting inquiries through both public forms and agent referrals risked creating duplicate lead entries, causing multiple counsellors to contact the same applicant.
- **Solution:** Developed an automated deduplication service querying Firestore for matching normalized email and phone hashes prior to lead insertion, merging inquiry histories into existing records when duplicates are found.

### Challenge 5: Memory Leaks from Unmanaged Real-Time Listeners
- **Problem:** As users navigated between multiple dashboard tabs, active Firestore `onSnapshot` listeners remained open in memory, causing degraded browser performance.
- **Solution:** Conducted a comprehensive memory audit, refactoring hooks to return cleanup unsubscribe functions in `useEffect`, ensuring all subscriptions terminate immediately on unmount.

<div style="page-break-after: always;"></div>

---

# 10. Professional and Workplace Development

Beyond core technical programming, the six-week internship provided invaluable exposure to enterprise workplace dynamics:

- **Engineering Self-Reliance:** Gained the ability to explore official documentation, analyze open-source codebases, and debug complex integration failures autonomously.
- **Empathy for End-Users:** Designed user interfaces with distinct cognitive loads in mind—ensuring counsellors have dense data tables while students experience an intuitive onboarding flow.
- **Code Maintainability & Hygiene:** Developed strict habits around meaningful Git commit messages, modular file organization, and inline TypeScript interface documentation.
- **Ownership of Product Outcomes:** Learned to take accountability not merely for writing code, but for ensuring that deployed features function reliably in production environments.

<div style="page-break-after: always;"></div>

---

# 11. Conclusion

The six-week Software Engineering Internship at the host organization provided a comprehensive, real-world capstone experience in modern full-stack web engineering. Through the development of the **EduCRM Platform**, academic software engineering principles were transformed into a commercially viable, production-grade cloud application.

Starting from architectural requirements and multi-tenant security foundations, the project progressed systematically through lead acquisition engines, student self-service onboarding, the flagship 20-stage application pipeline, AI document extraction, and partner commission networks. The successful delivery of the platform highlights the synthesis of reactive frontend paradigms, serverless database architecture, and artificial intelligence integration.

This internship has solidified my technical proficiency, enhanced my analytical problem-solving abilities, and reinforced my professional readiness to excel in high-impact software engineering roles.

<br/><br/><br/>

```
___________________________________                  ___________________________________
Mujtaba Zaheer                                       [Industry Supervisor Name]
Student / Software Engineering Intern                Chief Technology Officer / Tech Lead
Registration No: [BSE21XXXX]                         [Host Organization Name]
Department of Software Engineering                   Official Stamp & Signature
Capital University of Science and Technology (CUST)
```

<div style="page-break-after: always;"></div>

---

# 12. Annexure A: Internship Offer Letter

```
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                                [INSERT OFFICIAL OFFER LETTER HERE]                                |
|                                                                                                   |
|  Instructions:                                                                                    |
|  Scan or export your official Internship Offer Letter issued by your host organization            |
|  and paste the high-resolution image or PDF page here.                                            |
|                                                                                                   |
|  Key Details that should be legible:                                                              |
|  - Host Organization Letterhead / NASTP Logo                                                      |
|  - Intern Name: Mujtaba Zaheer                                                                    |
|  - Position: Software Engineering / Web Development Intern                                        |
|  - Duration: Six Weeks                                                                            |
|  - Date of Issuance and Authorized Signature                                                      |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

<div style="page-break-after: always;"></div>

---

# 13. Annexure B: Completion Certificate

```
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                           [INSERT INTERNSHIP COMPLETION CERTIFICATE HERE]                         |
|                                                                                                   |
|  Instructions:                                                                                    |
|  Insert the official Internship Completion Certificate awarded by your employer                   |
|  upon the successful completion of the six-week tenure.                                           |
|                                                                                                   |
|  Key Details that should be legible:                                                              |
|  - Certificate of Achievement / Completion Title                                                  |
|  - Recipient Name: Mujtaba Zaheer                                                                 |
|  - Role: Full-Stack Web Development / Tech Team Intern                                            |
|  - Formal Date of Award and Organization Stamp / CEO Signature                                    |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

<div style="page-break-after: always;"></div>

---

# 14. Annexure C: Internship Evaluation Form

```
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                       [INSERT SIGNED CUST INTERNSHIP EVALUATION FORM HERE]                        |
|                                                                                                   |
|  Instructions:                                                                                    |
|  Insert the official Capital University of Science and Technology (CUST)                          |
|  Department of Software Engineering Internship Evaluation Form.                                   |
|                                                                                                   |
|  Must include:                                                                                    |
|  - Performance rating matrix (Scale 0-10 on knowledge, initiative, punctuality, teamwork)        |
|  - Percentage of assigned project completed: 80% to 100% (Checked)                                |
|  - Qualitative supervisor remarks regarding technical competence and delivery                    |
|  - Supervisor Name, Official Designation, Stamp, Signature, and Date                              |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```
