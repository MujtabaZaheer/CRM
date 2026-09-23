# EduCRM — Enterprise Multi-Tenant Global Higher Education Admissions & CRM Platform

[![Live Application](https://img.shields.io/badge/Live%20App-education--crm--9fee2.web.app-10b981?style=for-the-badge&logo=firebase)](https://education-crm-9fee2.web.app)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Hosting-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![AI Powered](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20Flash-0ea5e9?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Tests](https://img.shields.io/badge/Test%20Suite-27%20Passed%20%7C%20188%20Tests-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

## 📌 Overview

**EduCRM** is an enterprise-grade, cloud-native higher education admissions management and CRM platform. Built for global university recruitment agencies, educational consultancies, and multi-campus institutions, EduCRM orchestrates the entire international student journey—from first contact and AI-assisted CV evaluation, to university partner admissions, visa clearance, commission distribution, and compliance auditing.

---

## 🚀 Key Platform Capabilities

### 1. 🤖 Gemini 3.8 Flash AI Student & CV Engine
- **Multimodal Document Parsing**: Ingests student CVs, résumés, and academic transcripts in PDF, Word (`.docx`), text (`.txt`), or raw pasted text.
- **Client-Side Fallback Engine**: Uses a combination of Google Gemini 3.8 Flash and a 1,000+ line local heuristic regex parser for 100% reliable offline extraction.
- **Automated Field Population**: Instantly populates:
  - First Name, Last Name, Full Name
  - Cleaned Email & International Phone
  - Country of Residence & Nationality Demonyms
  - Date of Birth, Gender, City
  - Complete Academic Qualification Records (Institution, Degree, GPA/Grade, Completion Year)
  - English Language Proficiency Tests (IELTS, PTE, TOEFL, Duolingo, MOI) with Scores and Expiry Dates
- **Zero-Manual Data Entry**: Available on Registration, Onboarding Stage 1, and Application Wizard.

### 2. 🔐 Fine-Grained Role-Based Access Control (RBAC)
The platform supports **10+ distinct user roles** with strict tenant and boundary isolation:

| Role Identifier | Role Label | Description & Access Scope |
| :--- | :--- | :--- |
| `platform_super_admin` | Platform Super Admin | Full system access across all tenants, offices, roles, audit logs, and global configuration. |
| `org_admin` | Organization Admin | Manages branch offices, staff provisioning, commission tiers, and operational pipelines. |
| `counsellor` | Education Counsellor | Manages assigned student leads, schedules sessions, and assists in university applications. |
| `office_manager` | Regional Office Manager | Oversees regional hub performance, counsellor workload, and local lead assignments. |
| `team_leader` | Admissions Team Leader | Reassigns applications, monitors admissions triage, and balances counsellor bandwidth. |
| `admissions_officer` | Admissions Officer | Reviews submitted applications, validates academic credentials, and communicates with universities. |
| `finance_officer` | Finance & Accounts Officer | Manages university commission invoices, student fees, agency payouts, and commission tiers. |
| `compliance_officer` | Compliance & Audit Officer | Audits GDPR data processing consents, document authenticity, and security compliance. |
| `visa_officer` | Visa & Immigration Officer | Evaluates financial proofs, CAS/I-20 readiness, visa compliance, and mocks interviews. |
| `external_agent` | External Recruitment Partner | Submits student referrals, tracks application statuses, and monitors commission earnings. |
| `university_partner` | University Admissions Rep | Reviews candidate portfolios, issues conditional/unconditional offers, and manages program seats. |
| `student` | Prospective International Student | Builds master profile, auto-applies with AI CV scanner, uploads documents, and tracks admissions. |

---

### 3. 🎓 Unified Student Lifecycle & Multi-Stage Portals

```mermaid
graph TD
    A[Public Registration / Role Selector] -->|AI CV Fast-Track| B[Student Profile Ingestion]
    B --> C[Email Verification / Demo Mode Bypass]
    C --> D[4-Stage Master Onboarding Wizard]
    D --> E[Student Dashboard & Document Vault]
    E -->|Select Programme & University| F[6-Step Application Wizard]
    F -->|AI CV & Transcript Extraction| G[Document & Language Verification]
    G --> H[Admissions & Partner Review]
    H --> I[Visa Officer Evaluation]
    I --> J[Enrolment & Commission Settlement]
```

#### A. Multi-Stage Student Onboarding (`/student/onboarding/*`)
1. **Stage 1 — Personal & Academic History**: Captures identity, contact numbers, country of residence, desired study level, and multiple qualification records. Includes integrated AI CV scanner.
2. **Stage 2 — Study Preferences**: Destination countries (UK, USA, Canada, Australia, Germany, Ireland, etc.), preferred intakes, budgets, and study modes.
3. **Stage 3 — English Proficiency & Documents**: Test scores (IELTS/PTE/TOEFL/Duolingo), passport validation, and initial credential uploads.
4. **Stage 4 — Final Review & Verification**: Profile completeness meter, GDPR declaration, and instant redirection to Student Dashboard.

#### B. Application Wizard (`/student/apply/:programmeId`)
1. **Step 1 — Programme Selection & Eligibility**: Displays minimum IELTS score, tuition fees, intake dates, and academic grade thresholds.
2. **Step 2 — Document Upload & AI Scanner**: Ingests transcripts and resumes with immediate data extraction.
3. **Step 3 — Personal Details Verification**: Two-way synced with the student's master profile.
4. **Step 4 — English Language Proficiency**: Interactive form comparing student scores directly against program minimums with real-time pass/fail eligibility badges.
5. **Step 5 — Statements & Visa History**: Statement of Purpose (SOP) guidance, study gap explanation, and immigration history.
6. **Step 6 — Final Review & Submit**: Summary card, declaration acceptance, and automatic profile sync (`syncProfileWithApplication()`).

---

### 4. 🏢 Multi-Tenant & Multi-Branch Architecture
- **Multi-Branch Support**: London HQ, Manchester, Birmingham, Dubai, Toronto, Sydney, Lahore, Islamabad, Delhi, and Regional Desks.
- **Tenant Scoping**: All leads, students, applications, and documents are scoped by tenant ID and branch ID.
- **Cross-Branch Transfers**: Reassignment utility allows team leaders to transfer leads with full audit trails.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | High-performance, strictly typed component architecture |
| **Build Tool** | Vite 6.0 | Sub-second HMR, optimized multi-vendor chunking |
| **Styling & Design** | Tailwind CSS + Lucide React | Glassmorphism, tailored dark/light theme, modern typography |
| **Database & Realtime** | Firebase Cloud Firestore | NoSQL realtime synchronization, security rules, indexes |
| **Authentication** | Firebase Authentication | Email/Password, Email Verification, Session Persistence |
| **AI Evaluation** | Google Gemini 3.8 Flash | Large Language Model for deep document & CV information parsing |
| **Client Document Processing** | PDF.js + Mammoth | In-browser PDF & DOCX text extraction without server latency |
| **Testing** | Vitest + React Testing Library | 27 automated test suites with 188 unit & integration tests |
| **Hosting & CI/CD** | Firebase Hosting + GitHub | Global CDN edge caching with automated deployment pipelines |

---

## 📂 Project Structure

```
CRM/
├── .github/                      # CI/CD Workflows
├── src/
│   ├── components/               # Reusable UI & Business Components
│   │   ├── ai/                   # AI CV Uploader & Document Scanners
│   │   ├── applications/         # Application Cards & Stage Trackers
│   │   ├── layout/               # Navbars, Sidebar, ProtectedLayout & OnboardingGuards
│   │   ├── student/              # Student Profile, Documents & Readiness Badges
│   │   └── ui/                   # Buttons, Modals, Forms & Stat Cards
│   ├── contexts/                 # React Contexts (AuthContext, ThemeContext)
│   ├── data/                     # Demo Data, University Catalogs & Programme Specs
│   ├── firebase/                 # Firebase SDK initialization & Config
│   ├── pages/                    # Core Route Pages
│   │   ├── admin/                # Super Admin, Tenant Config, User Management
│   │   ├── portal/               # Student, Agent & Partner Portals
│   │   │   ├── onboarding/       # 4-Stage Student Onboarding Pages
│   │   │   ├── StudentApplicationWizard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentDocumentVault.tsx
│   │   │   └── StudentNewApplication.tsx
│   │   ├── public/               # Public Programme Search & Wizard
│   │   ├── Login.tsx             # Universal Sign-In with Demo Fast-Login
│   │   ├── Register.tsx          # Multi-Role Registration with AI CV Auto-Fill
│   │   └── VerifyEmail.tsx       # Email Verification & Instant Demo Pass
│   ├── types/                    # TypeScript Data Models (Student, Application, Role, etc.)
│   └── utils/                    # Business Logic, AI Parsers, Readiness & Security Helpers
│       ├── cvExtractor.ts        # Gemini AI & Heuristic CV Engine
│       ├── geminiClient.ts       # Gemini API client
│       ├── profileCompleteness.ts# Profile scoring calculation
│       └── roleBackgrounds.ts    # Ambient atmospheric backgrounds
├── tests/                        # Vitest Unit & Integration Test Suites
│   ├── security/                 # RBAC, Firestore security & privilege tests
│   └── unit/                     # Registration, Onboarding & Wizard tests
├── firebase.json                 # Firebase Hosting & Firestore configuration
├── firestore.rules               # Production Firestore Security Rules
├── package.json                  # Dependencies & Scripts
└── vite.config.ts                # Vite build & chunking configuration
```

---

## ⚙️ Installation & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/MujtabaZaheer/CRM.git
cd CRM
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=education-crm-9fee2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=education-crm-9fee2
VITE_FIREBASE_MESSAGING_SENDER_ID=324490740107
VITE_FIREBASE_APP_ID=1:324490740107:web:bad87398d3b03e8c0a6f8e

# Gemini AI Configuration (Optional for deep AI; local heuristic fallback is built-in)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Mode Settings
VITE_DEMO_MODE=false
VITE_REQUIRE_VERIFIED_EMAIL=true
```

### 4. Run Development Server
```bash
npm run dev
```
The application will start on `http://localhost:5173`.

---

## 🧪 Testing Suite

EduCRM contains a comprehensive automated test suite covering security rules, role boundaries, registration auto-fill, CV extraction, and application state transitions.

```bash
# Run all tests once
npm test -- --run

# Run in watch mode for development
npm test
```

### Test Coverage Highlights:
- ✅ **CV Extraction & AI Engine**: PDF parsing, multi-degree detection, name cleaning, and demonym normalization.
- ✅ **Registration Auto-Fill**: Verifies `Register.tsx` and `StudentOnboardingStage1.tsx` CV data binding.
- ✅ **RBAC & Security**: Privilege escalation prevention, role impersonation guards, and chat permission rules.
- ✅ **Tenant & Branch Scoping**: Lead assignment, city routing, and regional desk isolation.

---

## 🚢 Production Build & Deployment

### Build Bundle
```bash
npm run build
```
Creates an optimized, minified production build in the `dist/` directory with code-split vendor chunks.

### Deploy to Firebase Hosting
```bash
npx firebase deploy --only hosting
```

---

## 🔒 Security & Data Compliance

1. **Firestore Security Rules**: Strict schema validation preventing unauthorized role elevation or cross-tenant data access.
2. **GDPR Consent Logging**: Every student registration and profile update records an immutable timestamped consent record in `consent_records`.
3. **Document Privacy**: Student passports, financial statements, and academic transcripts are isolated with role-restricted viewing permissions.

---

## 📄 License

This software is proprietary and confidential. Developed for EduCRM Global International Education Placements. All rights reserved.
