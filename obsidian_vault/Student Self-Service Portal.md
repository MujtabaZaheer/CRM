---
tags:
  - module/studentportal
  - status/completed
date: 2026-09-03
---

# 🎓 Student Self-Service Portal

**Status**: 🟢 Implemented & Live in Production (`/student/*`)

Dedicated student-facing portal enabling applicants to register, log in, submit new university applications, manage profiles, upload verification documents, track application progress in real-time, and submit support requests.

## 📋 PDF Requirements & Features (CRM.pdf Section 5.1)
- **Multi-Role Registration**: Self-service account creation at `/register` (unified registration page supporting Student, External Agent, and University Partner roles) with email verification, password strength validation (5 rules), nationality dropdown, and GDPR consent recording.
- **Student Login**: Email/password authentication with automatic redirect to `/student/dashboard` for `role: "student"`. Unverified emails are blocked with re-verification prompt.
- **Student Dashboard**: Live summary of submitted applications, documents, pending tasks, visa updates, and a prominent "Submit a New Application" quick-action card.
- **New Application Submission**: Students can directly submit applications at `/student/new-application` specifying university (with autocomplete from catalog), programme, intake, target country, personal statement (up to 5000 chars), and supporting documents. Applications enter the pipeline at `Draft` stage.
- **My Profile**: Update personal details, phone number, country of residence, and emergency contacts via `/student/profile`.
- **My Applications**: Real-time stage tracking across all submitted university applications with live Firestore `onSnapshot` updates across the 20-stage pipeline.
- **Document Uploader**: Upload transcripts, passports, English test certificates, SOPs, and replacement documents from `/student/documents`. Documents are stored in Firebase Storage and tracked in Firestore `student_documents` collection.
- **Support Requests**: Submit direct inquiries to assigned counsellors and support officers from `/student/requests`.

## 🔄 Complete Student Registration & Application Flow

### Phase 1: Registration & Account Setup
1. Student visits `/register` → selects "Student / Applicant" role card
2. Fills: Full Name, Email, Phone, Nationality (dropdown), Country of Residence, Password (5-rule strength meter), Confirm Password
3. Checks GDPR consent checkbox → clicks "Create Student Account"
4. **System**: Creates Firebase Auth account → `createUserWithEmailAndPassword()`
5. **System**: Creates `users/{uid}` in Firestore with `role: "student"`
6. **System**: Creates `students/{uid}` in Firestore with `profileCompleteness: 30%`
7. **System**: Records consent in `consent_records` collection
8. **System**: Sends email verification link → signs out user
9. Shows "Check Your Email" success screen

### Phase 2: Email Verification & Login
10. Student checks email → clicks verification link → `emailVerified = true`
11. Student visits `/login` → enters email + password
12. System checks `emailVerified` flag (unverified → resend link + block)
13. `AuthContext.onAuthStateChanged()` → loads `users/{uid}` from Firestore
14. `ProtectedLayout` renders → student-specific sidebar navigation loads
15. Student redirected to `/student/dashboard`

### Phase 3: Profile Completion & Document Upload
16. Student sees dashboard (Applications: 0, Documents: 0, Pending actions: 0)
17. Navigates to `/student/profile` → updates phone, country, emergency contacts
18. Navigates to `/student/documents` → uploads transcripts, passport, test certificates
19. Documents stored in Firebase Storage + `student_documents/{docId}` with `status: "Pending"`

### Phase 4: Application Submission
20. Student clicks "New Application" → navigates to `/student/new-application`
21. Fills: University Name, Programme, Intake, Target Country, Personal Statement, Supporting Documents
22. Clicks "Submit Application"
23. **System**: `usePortalData.createApplication()` creates `applications/{appId}` with:
    - `applicationNumber: "APP-2026-XXXX"`, `stage: "Draft"`
    - `history: [{ stage: "Draft", note: "Application submitted by student via self-service portal." }]`
24. Success screen shown → student navigates to "My Applications" to track

### Phase 5: Application Processing Through System
25. Application appears in **Counsellor** queue → reviewed and advanced through stages
26. Application appears in **Admissions Officer** queue → document verification, offer issuance
27. Application appears in **University Partner** portal → admissions decision
28. **Finance Officer** records deposits/payments
29. **Visa Officer** creates visa case and tracks biometrics/appointment
30. Application reaches `Enrolled` 🏆 → student sees final status in real-time

## 🏗️ Technical Implementation Files
| File | Purpose |
|------|---------|
| [`Register.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/Register.tsx) | Unified multi-role registration page |
| [`RolePortal.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/components/portal/RolePortal.tsx) | Student dashboard, applications, documents, tasks, requests pages |
| [`StudentNewApplication.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/portal/StudentNewApplication.tsx) | Application submission form |
| [`StudentProfileSelfEdit.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/portal/StudentProfileSelfEdit.tsx) | Full profile editor |
| [`usePortalData.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/hooks/usePortalData.ts) | Data hook: createApplication, uploadDocument, saveProfile |
| [`registrationConfig.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/types/registrationConfig.ts) | Registration role configs & getRoleDashboardPath() |

## 🔗 Connected Modules & Entities
- [[Student Applicant Role]]
- [[Student Application Lifecycle]]
- [[Counsellor Module]]
- [[Admissions Officer Module]]
- [[Support User Module]]
- [[Document Entity]]
- [[Application Entity]]
- [[External Agent Portal]]
- [[University Partner Portal]]
