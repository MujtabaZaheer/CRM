---
tags:
  - project/crm
  - architecture/overview
  - status/completed
date: 2026-08-10
---

# 🌐 EduCRM Complete System Overview & PDF Specifications Alignment

EduCRM is a multi-tenant education management platform designed to streamline student recruitment, academic application processing, document verification, financial invoicing, visa tracking, technical support, compliance auditing, and platform administration.

---

## 🚀 Live System Quick Links
- **Production Web Application**: **[https://education-crm-9fee2.web.app](https://education-crm-9fee2.web.app)**
- **Git Codebase Repository**: **[https://github.com/MujtabaZaheer/CRM.git](https://github.com/MujtabaZaheer/CRM.git)** (`main` branch)
- **Visual 2D Graph Diagram**: Open **`EduCRM System Graph.canvas`** in Obsidian

---

## 🎭 13 System Roles Breakdown & Specifications (CRM.pdf Section 2 & 3.3)

All 13 system roles defined in `CRM.pdf` are fully implemented with role-gated routes, specific navigation menus, data isolation, and quick demo login buttons:

### 1. 🛡️ Platform Super Admin (`platform_super_admin`)
- **Route**: `/super-admin/*`
- **Workspace**: `SuperAdminWorkspace.tsx`
- **Capabilities**: Onboards multi-tenant organizations (`TenantOrganization`), manages subscription tiers (Starter, Professional, Enterprise), reassigns user roles across all 13 system roles, monitors real-time database and service health metrics, and configures global platform toggles (MFA, Maintenance Mode, Public Registration).
- **Note**: [[Platform Super Admin Role]] | [[Platform Super Admin Portal]]

### 2. 🏢 Organization Admin (`org_admin`)
- **Route**: `/users`, `/audit-log`, `/`
- **Capabilities**: Manages organization branch offices, user accounts, master university/programme catalogs, lead assignment rules, document requirement templates, and organization audit logs.
- **Note**: [[Organization Admin Role]]

### 3. 🏢 Office Manager (`office_manager`)
- **Capabilities**: Oversees branch office operations, monitors branch lead and application queues, evaluates counsellor KPIs, and reallocates workloads between teams.
- **Note**: [[Office Manager Role]]

### 4. 👥 Team Leader (`team_leader`)
- **Route**: `/team-leader/*`
- **Workspace**: `TeamLeaderWorkspace.tsx`
- **Capabilities**: Manages team members, reassigns applications between counsellors, tracks team task completion, and reviews team lead conversion analytics.
- **Note**: [[Team Leader Role]] | [[Team Leader Module]]

### 5. 🎓 Counsellor (`counsellor`)
- **Route**: `/counsellor/*`
- **Workspace**: `CounsellorWorkspace.tsx`
- **Capabilities**: Frontline recruitment lead qualification, student profile management, document vault uploads, application drafting, and interactive programme entry requirement matching.
- **Note**: [[Counsellor Role]] | [[Counsellor Module]]

### 6. 🛡️ Admissions Officer (`admissions_officer`)
- **Route**: `/admissions/*`
- **Workspace**: `AdmissionsWorkspace.tsx`
- **Capabilities**: Evaluates applications across the complete **20 lifecycle stages**, performs document verification audits (Approve/Reject with remarks), issues Conditional and Unconditional offer letters, and tracks CAS/Visa milestones.
- **Note**: [[Admissions Officer Role]] | [[Admissions Officer Module]]

### 7. ✈️ Visa Officer (`visa_officer`)
- **Route**: `/visa-officer/*`
- **Workspace**: `RolePortal.tsx` (`role="visa"`)
- **Capabilities**: Manages visa cases (`Preparation`, `Documents Pending`, `Under Review`, `Appointment Scheduled`, `Submitted`, `Granted`, `Refused`), inspects visa documents, tracks embassy biometrics appointments, and updates visa outcomes.
- **Note**: [[Visa Officer Role]]

### 8. 💳 Finance Officer (`finance_officer`)
- **Route**: `/finance/*`
- **Workspace**: `FinanceWorkspace.tsx`
- **Capabilities**: Issues multi-currency invoices, records student payment receipts, approves student refund requests, manages external agent commission statements (`Pending`, `Eligible`, `Approved`, `Paid`), and exports 1-click accounting CSV data.
- **Note**: [[Finance Officer Role]] | [[Finance Officer Module]]

### 9. 🎧 Support User (`support_user`)
- **Route**: `/support/*`
- **Workspace**: `SupportWorkspace.tsx`
- **Capabilities**: Resolves support tickets (`TKT-2026-XXXX`), records internal agent notes, tracks SLA resolution benchmarks, and authors Knowledge Base articles.
- **Note**: [[Support User Role]] | [[Support User Module]]

### 10. 🕵️ Auditor (`auditor` / `compliance_officer`)
- **Route**: `/auditor/*`
- **Workspace**: `AuditorWorkspace.tsx`
- **Capabilities**: Immutable audit log inspection (200+ system events), application compliance verification (Pass/Flag), terminal security log monitoring, and read-only protection.
- **Note**: [[Auditor Role]] | [[Auditor Module]]

### 11. 🎓 Student Applicant (`student`)
- **Route**: `/student/*`
- **Workspace**: `RolePortal.tsx` (`role="student"`)
- **Capabilities**: Student self-service portal for updating profile details, tracking application stage progress, uploading document replacements, and submitting support requests.
- **Note**: [[Student Applicant Role]] | [[Student Self-Service Portal]]

### 12. 🤝 External Referral Agent (`external_agent`)
- **Route**: `/agent/*`
- **Workspace**: `AgentPortalWorkspace.tsx`
- **Capabilities**: External agent portal for generating unique referral tracking links (`?ref=agent123`), submitting student referrals, monitoring referral application progress, and viewing commission payouts.
- **Note**: [[External Agent Role]] | [[External Agent Portal]]

### 13. 🏛️ University Admissions Partner (`university_partner`)
- **Route**: `/university/*`
- **Workspace**: `UniversityPortalWorkspace.tsx`
- **Capabilities**: Direct university admissions portal for inspecting received student applications, issuing 1-click Conditional/Unconditional offers, rejecting applications, and releasing CAS/COE reference documents.
- **Note**: [[University Partner Role]] | [[University Partner Portal]]

---

## 🔄 The 20 Application Lifecycle Stages (CRM.pdf Section 3.7)

1. `Draft` — Application created in counsellor workspace.
2. `Submitted to Agency` — Submitted by counsellor to internal admissions team.
3. `Under Internal Review` — Document verification in progress by Admissions Officer.
4. `Pending Student Documents` — Additional transcripts or test scores requested.
5. `Internal Verification Complete` — Passed internal document audit.
6. `Submitted to University` — Dispatched to partner university.
7. `Under University Review` — University admissions reviewing file.
8. `Conditional Offer Issued` — Conditional offer letter generated.
9. `Pending Conditions` — Student clearing deposit or English test conditions.
10. `Unconditional Offer Issued` — Full unconditional offer letter issued.
11. `Deposit Paid` — Tuition deposit confirmed by Finance Officer.
12. `CAS Issued` / `COE Issued` — Official CAS reference number generated.
13. `Visa Documents Prepared` — Financial and GTE documents verified by Visa Officer.
14. `Visa Application Submitted` — Submitted to embassy/immigration portal.
15. `Visa Granted` — Official visa issuance confirmed.
16. `Enrolled` — Student arrived at university and completed enrolment.
17. `Deferred` — Intake deferred to future term.
18. `Withdrawn` — Application cancelled by student.
19. `Rejected by University` — Application declined by university.
20. `Visa Refused` — Visa application rejected by embassy.

---

## 📄 Key Document Categories (CRM.pdf Section 3.8)
- `Passport` — Passport bio page copy.
- `Academic Transcript` — High school & undergraduate mark sheets.
- `Degree Certificate` — Official degree diploma.
- `English Proficiency` — IELTS, TOEFL, PTE, Duolingo, MOI certificate.
- `Statement of Purpose (SOP)` — Personal statement essay.
- `Letter of Recommendation (LOR)` — Academic and professional reference letters.
- `CV / Resume` — Updated work history.
- `Financial Proof` — Bank balance certificates and sponsor affidavits.
- `GTE / Genuine Student Form` — Visa compliance statement.
- `Portfolio / Research Proposal` — PhD or creative course requirement.
- `Offer Letter` — University conditional/unconditional offer document.
- `CAS / COE Document` — Official confirmation of acceptance for studies.

---

## 🗺️ System Navigation Map

```
                                  ┌───────────────────────────┐
                                  │   EduCRM Platform Core    │
                                  └─────────────┬─────────────┘
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          ▼                                           ▼
               🔑 Authentication (/login)                 📊 Main System Navigation
                          │                                           │
       ┌──────────────────┼──────────────────┐            ┌───────────┼───────────┐
       ▼                  ▼                  ▼            ▼           ▼           ▼
  🛡️ Super Admin     🎓 Counsellor     💳 Finance    📁 Leads    🎓 Students  📄 Apps
  (/super-admin/*)   (/counsellor/*)   (/finance/*)   (/leads)    (/students) (/applications)
       │                  │                  │
       ▼                  ▼                  ▼
  🎧 Support User   🛡️ Admissions     ✈️ Visa Officer
  (/support/*)      (/admissions/*)   (/visa-officer/*)
       │                  │                  │
       ▼                  ▼                  ▼
  🕵️ Auditor        🤝 External Agent  🏛️ University Partner
  (/auditor/*)      (/agent/*)        (/university/*)
```
