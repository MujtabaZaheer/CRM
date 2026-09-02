---
tags:
  - role/studentapplicant
  - status/completed
date: 2026-09-03
---

# 🎓 Student Applicant Role

**Status**: 🟢 Implemented & Live in Production (`/student/*`, `/register`)

Students who register their own accounts via the unified multi-role registration page, log in to the Student Portal to complete profiles, submit new university applications directly, upload documents, track application milestones across the 20-stage pipeline in real-time, and communicate with counsellors.

## 📋 Responsibilities & Scope (CRM.pdf Section 2 & 3.3)
- **Self-Registration**: Create account at `/register` by selecting the "Student / Applicant" role card. Includes email verification, password strength validation (5 rules: length, uppercase, lowercase, digit, special character), nationality dropdown, country of residence, and GDPR data processing consent.
- **Profile Completion**: Update personal information, phone number, academic transcript records, passport details, and emergency contacts via `/student/profile`.
- **Direct Application Submission**: Submit new university applications from `/student/new-application` specifying university (autocomplete from catalog), programme, intake, target country, personal statement (up to 5000 chars), and supporting documents. Applications start at `Draft` stage with `applicationNumber: "APP-2026-XXXX"`.
- **Document Self-Upload**: Upload transcripts, English test certificates, SOPs, passport copies, and replacement documents from `/student/documents`. Files stored in Firebase Storage, metadata tracked in `student_documents` collection.
- **Milestone Tracking**: View real-time application stage updates across the 20-stage pipeline via Firestore `onSnapshot`. See offer letters, deposit requirements, CAS issuance, and visa progress.
- **Support Requests**: Submit direct support inquiries to assigned counsellors from `/student/requests`.

## 🔄 Complete Registration-to-Application Flow
1. Visit `/register` → select Student role → fill form → create account
2. Verify email → login at `/login` → redirect to `/student/dashboard`
3. Complete profile at `/student/profile`
4. Upload documents at `/student/documents`
5. Submit application at `/student/new-application`
6. Track application at `/student/applications` (real-time updates)
7. Application processed by Counsellor → Admissions → University → Visa → Enrolled

See [[Student Application Lifecycle]] for the complete 10-phase detailed flow.

## 🔗 Connected Modules & Entities
- [[Student Self-Service Portal]]
- [[Student Application Lifecycle]]
- [[Student Entity]]
- [[Application Entity]]
- [[Document Entity]]
