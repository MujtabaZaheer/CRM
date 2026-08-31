---
tags:
  - module/studentportal
  - status/completed
date: 2026-08-31
---

# 🎓 Student Self-Service Portal

**Status**: 🟢 Implemented & Live in Production (`/student/*`)

Dedicated student-facing portal enabling applicants to register, log in, submit new university applications, manage profiles, upload verification documents, track application progress, and submit support requests.

## 📋 PDF Requirements & Features (CRM.pdf Section 5.1)
- **Student Registration**: Self-service account creation at `/student-register` with email verification, password strength validation, and GDPR consent.
- **Student Login**: Email/password authentication with automatic redirect to `/student/dashboard` for `role: "student"`.
- **Student Dashboard**: Live summary of submitted applications, documents, pending tasks, and a prominent "Submit a New Application" quick-action card.
- **New Application Submission**: Students can directly submit applications specifying university, programme, intake, target country, personal statement, and supporting documents. Applications enter the pipeline at `Draft` stage.
- **My Profile**: Update personal details, phone number, country of residence, and emergency contacts.
- **My Applications**: Real-time stage tracking across all submitted university applications with live `onSnapshot` updates.
- **Document Uploader**: Upload transcripts, passports, English test certificates, and replacement documents.
- **Support Requests**: Submit direct inquiries to assigned counsellors and support officers.

## 🔄 Complete Student Flow
1. Student visits `/student-register` → fills registration form
2. Firebase Auth account created → student profile saved to Firestore
3. Email verification sent → student verifies email
4. Student logs in at `/login` → auto-redirected to `/student/dashboard`
5. Student clicks "New Application" → fills form with university/programme details
6. Application saved to Firestore `applications` collection with `stage: "Draft"`
7. Counsellor/Admissions staff review and process through 20-stage pipeline
8. Student sees real-time stage updates on "My Applications" page

## 🔗 Connected Modules & Entities
- [[Student Applicant Role]]
- [[Counsellor Module]]
- [[Support User Module]]
- [[Document Entity]]
- [[Application Entity]]
- [[Admissions Officer Module]]
