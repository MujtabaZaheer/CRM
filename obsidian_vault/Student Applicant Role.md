---
tags:
  - role/studentapplicant
  - status/completed
date: 2026-08-31
---

# 🎓 Student Applicant Role

**Status**: 🟢 Implemented & Live in Production (`/student/*`, `/student-register`)

Students who register their own accounts, log in to the Student Portal to complete profiles, submit new university applications directly, upload documents, track application milestones, and communicate with counsellors.

## 📋 Responsibilities & Scope (CRM.pdf Section 2 & 3.3)
- **Self-Registration**: Create account at `/student-register` with email verification, password strength validation, nationality, and GDPR consent.
- **Profile Completion**: Update personal information, academic transcript records, and passport details.
- **Direct Application Submission**: Submit new university applications from the student portal specifying university, programme, intake, country, personal statement, and supporting documents. Applications start at `Draft` stage.
- **Document Self-Upload**: Upload missing transcripts, English test certificates, SOPs, and replacement documents.
- **Milestone Tracking**: View real-time application stage updates, offer letters, deposit requirements, and visa progress.
- **Support Requests**: Submit direct support inquiries to assigned counsellors.

## 🔗 Connected Modules & Entities
- [[Student Self-Service Portal]]
- [[Student Entity]]
- [[Application Entity]]
- [[Document Entity]]
