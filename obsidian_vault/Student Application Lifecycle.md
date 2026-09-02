---
tags:
  - flow/studentlifecycle
  - architecture/sequence
  - status/completed
date: 2026-09-03
---

# 📋 Student Application Lifecycle — Complete End-to-End Flow

This document traces every step from when a new student first visits the EduCRM platform until their application reaches final enrollment. Every system interaction, Firestore write, and role handoff is documented.

---

## 🔄 High-Level Pipeline Overview

```
[Registration] → [Email Verification] → [Login] → [Profile Completion] → [Document Upload]
       ↓
[Application Submission] → [Counsellor Review] → [Admissions Processing] → [University Decision]
       ↓
[Deposit & CAS] → [Visa Processing] → [Enrolled 🏆]
```

---

## Phase 1: Registration & Account Setup

| Step | User Action | System Response | Firestore Write |
|------|------------|-----------------|-----------------|
| 1 | Visits `/register` | Displays 3 role selection cards | — |
| 2 | Clicks "Student / Applicant" card | Shows student-specific registration form | — |
| 3 | Fills: Full Name, Email, Phone, Nationality, Country, Password | Client-side validation (5 password rules) | — |
| 4 | Checks GDPR consent → clicks "Create Account" | `createUserWithEmailAndPassword()` | — |
| 5 | — | Creates base user profile | `users/{uid}` → `{ role: "student", email, displayName }` |
| 6 | — | Creates student profile | `students/{uid}` → `{ fullName, email, phone, nationality, countryOfResidence, academicHistory: [], profileCompleteness: 30 }` |
| 7 | — | Records GDPR consent | `consent_records/{auto}` → `{ userId, consentType: "data_processing", version: "v1.0" }` |
| 8 | — | Sends verification email | `sendEmailVerification(user)` |
| 9 | — | Signs out user, shows success screen | `signOut()` |

**Source**: [`Register.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/Register.tsx) lines 130–195

---

## Phase 2: Email Verification & Login

| Step | User Action | System Response |
|------|------------|-----------------|
| 10 | Clicks verification link in email | Firebase Auth marks `emailVerified = true` |
| 11 | Visits `/login`, enters email + password | `signInWithEmailAndPassword()` |
| 12 | — | Checks `emailVerified` flag → if false: re-sends link, blocks login |
| 13 | — | `AuthContext.onAuthStateChanged()` fires |
| 14 | — | Loads `users/{uid}` via Firestore `onSnapshot` → sets `appUser` |
| 15 | — | `ProtectedLayout` renders → `Sidebar` loads student-specific navigation |
| 16 | — | Redirects to `/student/dashboard` |

**Source**: [`Login.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/Login.tsx), [`AuthContext.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/contexts/AuthContext.tsx)

---

## Phase 3: Student Dashboard & Profile Completion

| Step | User Action | System Response |
|------|------------|-----------------|
| 17 | Views `/student/dashboard` | Shows cards: Applications (0), Documents (0), Pending actions (0), Visa updates (0) |
| 18 | Clicks "Submit a New Application" card | Links to `/student/new-application` |
| 19 | Navigates to `/student/profile` | Loads student profile from `students/{uid}` |
| 20 | Updates phone, country, emergency contacts | `usePortalData.saveProfile()` → `updateDoc("students/{uid}")` |

**Source**: [`RolePortal.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/components/portal/RolePortal.tsx), [`usePortalData.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/hooks/usePortalData.ts)

---

## Phase 4: Document Upload

| Step | User Action | System Response | Firestore Write |
|------|------------|-----------------|-----------------|
| 21 | Navigates to `/student/documents` | Lists uploaded documents with status badges |  |
| 22 | Clicks "Upload Document" | Modal appears: document type, file picker, deadline |  |
| 23 | Selects file + fills type + submits | `uploadStudentDocument()` → Firebase Storage | `student_documents/{docId}` → `{ studentId, documentType, fileName, fileUrl, status: "Pending" }` |
| 24 | — | Document appears in list with "Pending" badge |  |
| 25 | — | Counsellor/Admissions can view, verify, or reject the document |  |

**Source**: [`RolePortal.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/components/portal/RolePortal.tsx) Form modal, [`documentStorage.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/utils/documentStorage.ts)

---

## Phase 5: Application Submission

| Step | User Action | System Response | Firestore Write |
|------|------------|-----------------|-----------------|
| 26 | Navigates to `/student/new-application` | Shows application form with student info card |  |
| 27 | Fills: University (autocomplete), Programme, Intake, Country | Client-side validation |  |
| 28 | Writes personal statement (optional, up to 5000 chars) | Character counter shown |  |
| 29 | Attaches supporting documents (optional) | Files staged for upload |  |
| 30 | Clicks "Submit Application" | `createApplication()` runs | `applications/{appId}` → `{ applicationNumber: "APP-2026-XXXX", stage: "Draft", studentId, studentName, universityName, programmeName, intake, targetCountry, history: [{ stage: "Draft", note: "Application submitted by student via self-service portal." }] }` |
| 31 | — | Uploads attached documents | `student_documents/{docId}` for each file |
| 32 | Success screen shown | "Application Submitted Successfully!" |  |

**Source**: [`StudentNewApplication.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/portal/StudentNewApplication.tsx)

---

## Phase 6: Counsellor Review

| Step | Role | Action | Stage Transition |
|------|------|--------|-----------------|
| 33 | **Counsellor** | Sees application in `/counsellor/applications` queue | — |
| 34 | **Counsellor** | Reviews student profile, documents, personal statement | — |
| 35 | **Counsellor** | Advances application | `Draft` → `Initial Review` |
| 36 | **Counsellor** | Requests additional documents if needed | `Initial Review` → `Documents Pending` |
| 37 | **Student** | Sees real-time stage update in `/student/applications` | — |
| 38 | **Student** | Uploads requested documents from `/student/documents` | — |
| 39 | **Counsellor** | Verifies documents, prepares application package | `Documents Pending` → `Ready for Submission` |
| 40 | **Counsellor** | Submits to university | `Ready for Submission` → `Submitted` |

---

## Phase 7: Admissions Processing

| Step | Role | Action | Stage Transition |
|------|------|--------|-----------------|
| 41 | **Admissions Officer** | Sees application in `/admissions/applications` queue | — |
| 42 | **Admissions Officer** | Verifies all documents in `/admissions/verification` | — |
| 43 | **Admissions Officer** | Tracks application at university | `Submitted` → `University Reviewing` |
| 44 | **University** may request additional info | | `University Reviewing` → `Additional Info Requested` |

---

## Phase 8: University Decision

| Step | Role | Action | Stage Transition |
|------|------|--------|-----------------|
| 45 | **University Partner** | Reviews application in `/university/applications` | — |
| 46 | **University Partner** | Issues decision | `University Reviewing` → `Conditional Offer` / `Unconditional Offer` / `Rejected` |
| 47 | **Student** | Sees offer in `/student/applications` (real-time) | — |
| 48 | **Admissions Officer** | Tracks in `/admissions/offers` | — |

---

## Phase 9: Deposit, CAS & Visa

| Step | Role | Action | Stage Transition |
|------|------|--------|-----------------|
| 49 | **Student** | If conditional → fulfills conditions | `Conditional Offer` → `Unconditional Offer` |
| 50 | **Finance Officer** | Records deposit payment | `Deposit Pending` → `Deposit Paid` |
| 51 | **University Partner** | Releases CAS/COE at `/university/cas-issuance` | `CAS / COE Pending` → `CAS Issued` |
| 52 | **Visa Officer** | Creates visa case at `/visa-officer/cases` | `CAS Issued` → `Visa Preparation` |
| 53 | **Visa Officer** | Schedules biometrics, reviews visa documents | `Visa Preparation` → `Visa Submitted` |
| 54 | **Visa Officer** | Records visa decision | `Visa Submitted` → `Visa Approved` / `Visa Refused` |
| 55 | **Student** | Sees visa status updates in `/student/applications` | — |

---

## Phase 10: Enrollment 🏆

| Step | Role | Action | Stage Transition |
|------|------|--------|-----------------|
| 56 | **Admissions Officer** | Confirms enrollment | `Visa Approved` → `Enrolled` 🏆 |
| 57 | **Student** | Sees final "Enrolled" status in portal | — |
| 58 | **Finance Officer** | Records final payments, agent commissions | — |
| 59 | **Auditor** | Complete audit trail available for compliance inspection | — |

---

## ❌ Terminal Outcome Stages

Applications may exit the pipeline at any point to these terminal states:
- **`Deferred`** — Student defers to a future intake
- **`Withdrawn`** — Student withdraws application
- **`Rejected`** — University rejects application
- **`Visa Refused`** — Embassy refuses visa

---

## 📊 20-Stage Application Pipeline Summary

```
 1. Draft                    (Student self-submits)
 2. Initial Review           (Counsellor reviews)
 3. Documents Pending        (Counsellor requests docs)
 4. Ready for Submission     (Package prepared)
 5. Submitted                (Sent to university)
 6. University Reviewing     (Under assessment)
 7. Additional Info Requested (University needs more)
 8. Conditional Offer        (Offer with conditions)
 9. Unconditional Offer      (Full offer)
10. Deposit Pending          (Awaiting payment)
11. Deposit Paid             (Payment confirmed)
12. CAS / COE Pending        (Awaiting reference)
13. CAS Issued               (Reference released)
14. Visa Preparation         (Documents prepared)
15. Visa Submitted           (Application at embassy)
16. Visa Approved            (Visa granted)
17. Enrolled                 (Student enrolled 🏆)
18. Deferred                 (Terminal)
19. Withdrawn                (Terminal)
20. Rejected                 (Terminal)
```

---

## 🔗 Connected Modules & Entities
- [[Student Self-Service Portal]]
- [[Student Applicant Role]]
- [[Counsellor Module]]
- [[Admissions Officer Module]]
- [[University Partner Portal]]
- [[Finance Officer Module]]
- [[Visa Officer Role]]
- [[Application Entity]]
- [[Document Entity]]
- [[UML Sequence Diagrams & System Flow]]
