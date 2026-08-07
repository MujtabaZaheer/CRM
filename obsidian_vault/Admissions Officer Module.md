---
tags:
  - module/admissions
  - status/completed
---

# Admissions Officer Module

Handles academic eligibility, application processing, document verification audits, offer letter issuance, and CAS/Visa milestones.

## 🔗 Connections & Dependencies
- **Role**: [[Admissions Officer Role]]
- **Data Hook**: `useAdmissionsData.ts`
- **Route Guard**: `AdmissionsRoute.tsx`
- **Main Workspace**: `AdmissionsWorkspace.tsx`

## 📑 Core Entities Handled
- [[Application Entity]] (20 Lifecycle Stages)
- [[Document Entity]] (Verification Statuses: Pending, Verified, Rejected)
- [[Task Entity]] (Admission Tasks)
- [[Audit Log Entity]] (`ADMISSIONS_DECISION_RECORDED`, `DOCUMENT_VERIFICATION_UPDATED`)

## 🛠️ Subpages
1. **Admissions Dashboard**: [[EduCRM System Overview]] metrics & live queue feed.
2. **Application Queue**: Stage management across 20 stages.
3. **Document Verification**: Audit hub for transcripts, passports, and IELTS scores.
4. **Offer & CAS Tracking**: Conditional/Unconditional offer issuance and CAS reference tracking.
5. **Admissions Tasks**: Follow-ups with counsellors and students.
6. **Analytics & Reports**: Turn-around time and conversion reporting.
