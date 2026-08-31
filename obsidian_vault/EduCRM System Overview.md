---
tags:
  - project/crm
  - architecture/overview
  - status/completed
date: 2026-08-10
---

# 🌐 EduCRM System Master Overview & Role Specifications

EduCRM is a multi-tenant education recruitment and application management platform designed to connect internal agency teams, external referral agents, university admissions representatives, compliance auditors, and student applicants inside one single unified database system.

---

## 📌 Executive High-Level Role Matrix (Brief Summary Outside)

Quick summary of all 13 user roles operating across the platform:

| Role Name | Scope & Purpose | Access Level | Primary Output / Value |
|---|---|---|---|
| 🛡️ **Platform Super Admin** | Global multi-tenant cloud infrastructure root | Root Access across all tenants | Tenant onboarding, global settings, system health |
| 🏢 **Organization Admin** | Organization setup, office setup & user management | Org-wide Read/Write/Delete | User role assignments, university catalogs |
| 🏢 **Office Manager** | Branch office workload & lead distribution | Branch-wide Read/Write | Office KPI tracking, branch lead balancing |
| 👥 **Team Leader** | Team application reassignments & workload balancing | Team-wide Read/Write | Counsellor application allocation & performance |
| 🎓 **Counsellor** | Lead qualification, student profiles & programme matching | Assigned Leads/Students/Apps | Lead conversion, student profile completion |
| 🛡️ **Admissions Officer** | 20-stage application queue, document verification & offers | All Applications/Documents | Offer letter issuance, CAS/Visa tracking |
| ✈️ **Visa Officer** | Embassy appointment tracking, biometrics & visa cases | Visa cases & Student documents | Visa grant/refusal decision tracking |
| 💳 **Finance Officer** | Invoicing, payment receipts, refunds & commissions | Financial collections only | Revenue collection, agent payout approval |
| 🎧 **Support User** | Technical support tickets & knowledge base articles | Support ticket queue & KB | Ticket resolution, SLA compliance tracking |
| 🕵️ **Auditor / Compliance** | Compliance verification & immutable audit trails | System-wide Read-Only | Compliance inspection pass/flag certification |
| 🎓 **Student Applicant** | Self-registration, application submission & tracking | Self Student Record only | Profile completion, direct application submission, document self-upload |
| 🤝 **External Agent** | Student referral submissions & commission tracking | Referred Students only | Referral links, referral lead creation |
| 🏛️ **University Partner** | Direct university admissions review & offer issuance | University Applications only | 1-Click offer issuance, CAS reference release |

---

## 🔍 Deep-Dive Detailed Specifications for Each User Role (Detailed Inside)

---

### 1. 🛡️ Platform Super Admin (`platform_super_admin`)
- **Primary Workspace**: `/super-admin/*` (`SuperAdminWorkspace.tsx`)
- **Description**: Possesses root administration rights across all tenant organizations and system infrastructure.
- **Detailed Responsibilities**:
  - **Tenant Organization Onboarding**: Create new multi-tenant organizations (`TenantOrganization`), assign primary domains, configure subscription tiers (`Starter`, `Professional`, `Enterprise`, `Custom`), and toggle tenant statuses (`Active`, `Suspended`, `Trial`).
  - **Platform User Management**: Inspect all registered user accounts and reassign system roles instantly across any of the 13 active system roles.
  - **System Health Infrastructure Monitor**: Live latency (ms) and uptime percentage (%) monitoring for Firebase Auth, Cloud Firestore, Firebase Hosting, and Document Verification Engine.
  - **Global Configuration**: Toggle Maintenance Mode, enforce Multi-Factor Authentication (MFA), allow/disallow public user registrations, and configure platform default currency/timezone.
  - **Root Security Audit**: Stream platform-wide administrative events in real-time.
- **Security Rules**: Granted root read/write/delete permissions across all Firestore collections.

---

### 2. 🏢 Organization Admin (`org_admin`)
- **Primary Workspace**: `/users`, `/audit-log`, `/`
- **Description**: Manages an individual agency tenant organization, its branch offices, user management, and master catalogs.
- **Detailed Responsibilities**:
  - **Branch Office Setup**: Create branch office locations and assign Office Managers.
  - **User Account Management**: Create user accounts, reassign roles within the organization, set office scopes, and deactivate users.
  - **Master University Catalog**: Manage university partner profiles, course entry requirements, intake dates, and tuition fee structures.
  - **Workflow Rules**: Define automated lead assignment rules and required document templates per country.
- **Security Rules**: Full read/write access to organization-wide data (`/users`, `/leads`, `/applications`, `/students`, `/documents`).

---

### 3. 🏢 Office Manager (`office_manager`)
- **Description**: Oversees operations, lead queues, and team workloads for an assigned branch office.
- **Detailed Responsibilities**:
  - **Branch Workload Balancing**: Monitor unassigned leads and incoming applications across the branch office.
  - **Counsellor Oversight**: Track daily activity logs, follow-up tasks, and student interaction notes for branch counsellors.
  - **Branch KPIs**: Analyze branch conversion rates, document processing turnaround, and revenue targets.
- **Security Rules**: Read/write access scoped to assigned branch office users and leads.

---

### 4. 👥 Team Leader (`team_leader`)
- **Primary Workspace**: `/team-leader/*` (`TeamLeaderWorkspace.tsx`)
- **Description**: Supervises a team of counsellors, managing workload distribution and application flow.
- **Detailed Responsibilities**:
  - **Application Reassignment**: Reallocate student applications between counsellors to prevent bottlenecks (`updateDoc` on `assignedCounsellor`).
  - **Team Performance Analytics**: Track team conversion funnels, response times, and monthly targets.
  - **Task Tracking**: Assign and review team follow-up reminders and student interview preparation tasks.
- **Security Rules**: Read/write access to assigned team members and team applications.

---

### 5. 🎓 Counsellor (`counsellor`)
- **Primary Workspace**: `/counsellor/*` (`CounsellorWorkspace.tsx`)
- **Description**: Student-facing advisor who qualifies leads, builds student profiles, uploads documents, matches entry requirements, and prepares application drafts.
- **Detailed Responsibilities**:
  - **Lead Management**: Qualify recruitment leads across stages (`New`, `Contacted`, `Qualified`, `Counselling`, `Application Initiated`, `Lost`).
  - **Student Profile Creation**: Convert qualified leads into full student profiles with academic GPA, test scores (IELTS/TOEFL/PTE/Duolingo), and passport bio details.
  - **Document Vault**: Upload student transcripts, degree certificates, SOPs, LORs, and financial proof.
  - **Programme Entry Requirement Matcher**: Run the interactive Programme Matcher to evaluate student GPA and English scores against university criteria.
  - **Application Submission**: Prepare and submit application packages to the Admissions Desk.
- **Security Rules**: Create and update access for assigned leads, students, applications, and documents.

---

### 6. 🛡️ Admissions Officer (`admissions_officer`)
- **Primary Workspace**: `/admissions/*` (`AdmissionsWorkspace.tsx`)
- **Description**: Evaluates submitted application packages, audits student verification documents, issues offer letters, and manages CAS/Visa milestones.
- **Detailed Responsibilities**:
  - **20-Stage Application Queue**: Process applications through all 20 lifecycle stages (`Draft` to `Enrolled`).
  - **Document Verification Hub**: Audit submitted academic and identity documents. Approve or reject documents with explicit remarks.
  - **Decision & Offer Issuance**: Generate and issue official **Conditional Offer** and **Unconditional Offer** letters specifying conditions and deposit deadlines.
  - **CAS & Visa Milestone Desk**: Track CAS/COE reference releases, deposit verification, and visa document readiness.
- **Security Rules**: Read/write access to all application queues, verification hubs, and offer tracking records.

---

### 7. ✈️ Visa Officer (`visa_officer`)
- **Primary Workspace**: `/visa-officer/*` (`RolePortal.tsx` `role="visa"`)
- **Description**: Manages embassy visa applications, document checklists, biometrics appointments, and visa outcome decisions.
- **Detailed Responsibilities**:
  - **Visa Case Management**: Track active visa cases across stages (`Preparation`, `Documents Pending`, `Under Review`, `Appointment Scheduled`, `Submitted`, `Granted`, `Refused`, `Escalated`).
  - **Visa Document Review**: Inspect financial bank statements, sponsor affidavits, GTE proof, and medical health check certificates.
  - **Embassy Appointment Tracking**: Record biometrics appointment dates and interview reminders.
  - **Visa Outcome Reporting**: Record final visa grant decisions or refusal reasons.
- **Security Rules**: Scoped access to `/visa_cases`, `/student_documents`, and `/applications`.

---

### 8. 💳 Finance Officer (`finance_officer`)
- **Primary Workspace**: `/finance/*` (`FinanceWorkspace.tsx`)
- **Description**: Manages all financial operations including invoicing, payment receipts, student refund approvals, agent commissions, and accounting exports.
- **Detailed Responsibilities**:
  - **Invoicing Desk**: Create service fee, deposit, and application fee invoices in multiple currencies (`USD`, `GBP`, `EUR`, `AUD`, `CAD`).
  - **Payment Collection**: Record student payments (Card, Bank Transfer, Cash, Online Gateway, Cheque), generate receipts, and update balance due.
  - **Refund Approvals**: Review student refund applications, verify withdrawal reasons, and process refund payouts.
  - **Agent Commission Statements**: Calculate and approve external referral agent commissions (`Pending`, `Eligible`, `Approved`, `Paid`, `Disputed`).
  - **Accounting Export**: Export real-time financial statements in CSV format.
- **Security Rules**: Exclusive access to financial collections (`/invoices`, `/payments`, `/refunds`, `/commissions`).

---

### 9. 🎧 Support User (`support_user`)
- **Primary Workspace**: `/support/*` (`SupportWorkspace.tsx`)
- **Description**: Handles technical inquiries, ticket resolution, SLA compliance, knowledge base publishing, and system troubleshooting.
- **Detailed Responsibilities**:
  - **Support Ticket Queue**: Inspect and resolve technical tickets (`TKT-2026-XXXX`) across priority levels (`Low`, `Medium`, `High`, `Urgent`).
  - **Communication Thread**: Provide public responses to users and record private internal agent troubleshooting notes.
  - **Knowledge Base Publishing**: Author, tag, and publish self-service KB articles (`SupportArticle`).
  - **SLA Monitoring**: Track average resolution hours and manage SLA breach notifications.
- **Security Rules**: Access to `/support_tickets`, `/support_articles`, and `/audit_logs`.

---

### 10. 🕵️ Auditor (`auditor` / `compliance_officer`)
- **Primary Workspace**: `/auditor/*` (`AuditorWorkspace.tsx`)
- **Description**: Performs compliance verification, immutable audit log inspections, and security monitoring with strict read-only protection.
- **Detailed Responsibilities**:
  - **Immutable Audit Trail**: Search and filter 200+ system activity events by date, user email, action, and entity ID.
  - **Compliance Inspection**: Inspect student application records and issue compliance certifications (`AUDIT_COMPLIANCE_PASSED` / `AUDIT_COMPLIANCE_FLAGGED`).
  - **System Security Feed**: Monitor terminal-style authentication and security events.
  - **Audit Exports**: Generate formal compliance certificates for regulatory inspection.
- **Security Rules**: Immutable read-only permissions across all system collections (`/audit_logs`, `/applications`, `/students`, `/documents`, `/invoices`, `/payments`).

---

### 11. 🎓 Student Applicant (`student`)
- **Primary Workspace**: `/student/*` (`RolePortal.tsx` `role="student"`) + `/student-register` (public registration)
- **Description**: Dedicated self-service portal for student applicants to register accounts, complete profiles, submit new university applications directly, track applications, upload documents, and contact counsellors.
- **Detailed Responsibilities**:
  - **Self-Registration**: Students create accounts at `/student-register` with email verification, password strength validation, nationality selection, and GDPR data processing consent.
  - **Direct Application Submission**: Students submit new university applications via `/student/new-application` specifying university, programme, intake, target country, personal statement, and supporting documents. Applications enter the 20-stage pipeline at `Draft` and are visible to Counsellors, Admissions Officers, and Team Leaders for processing.
  - **My Profile**: Update personal details, phone number, country of residence, and emergency contacts.
  - **My Applications**: Track real-time progress across all submitted university applications in the 20-stage pipeline via Firestore `onSnapshot`.
  - **My Documents**: Upload replacement transcripts, passports, and English test certificates.
  - **Support Requests**: Submit inquiries to assigned agency counsellors.
- **Security Rules**: Access strictly limited to records matching their authenticated email (`ownsStudent(studentId)`).


---

### 12. 🤝 External Referral Agent (`external_agent`)
- **Primary Workspace**: `/agent/*` (`AgentPortalWorkspace.tsx`)
- **Description**: Portal for sub-agents and external educational agencies to submit student referrals and track commission payouts.
- **Detailed Responsibilities**:
  - **Referral Link Generator**: Copy and share unique referral tracking links (`https://education-crm-9fee2.web.app/register?ref=agent123`).
  - **Submit Referral**: Register new student leads directly into the CRM (`AgentReferLeadPage`).
  - **My Referrals Queue**: Monitor application progress and status updates for referred students.
  - **Commission Ledger**: Track earned referral commissions ($4,850 USD) and payout eligibility.
- **Security Rules**: Scoped read/create access for referred student leads and earned commission records.

---

### 13. 🏛️ University Admissions Partner (`university_partner`)
- **Primary Workspace**: `/university/*` (`UniversityPortalWorkspace.tsx`)
- **Description**: Portal for university partner admissions representatives to directly review applications and issue admission decisions.
- **Detailed Responsibilities**:
  - **Received Applications Desk**: Inspect student application packages submitted to their university.
  - **1-Click Admissions Decision**: Issue **Unconditional Offer**, **Conditional Offer**, or **Rejected** decisions directly to the CRM.
  - **CAS / COE Release**: Upload official CAS/COE reference numbers directly to agency student files.
  - **Turnaround Analytics**: Monitor average application decision times (e.g. 2.4 days).
- **Security Rules**: Scoped access strictly to applications and documents submitted to their university partner ID.

---

## 🔄 Complete 20-Stage Application Lifecycle Matrix

```
[Draft] ➔ [Submitted to Agency] ➔ [Under Internal Review] ➔ [Pending Student Documents]
   │
   ▼
[Internal Verification Complete] ➔ [Submitted to University] ➔ [Under University Review]
   │
   ▼
[Conditional Offer Issued] ➔ [Pending Conditions] ➔ [Unconditional Offer Issued]
   │
   ▼
[Deposit Paid] ➔ [CAS Issued / COE Issued] ➔ [Visa Documents Prepared]
   │
   ▼
[Visa Application Submitted] ➔ [Visa Granted] ➔ [Enrolled] 🏆
```

*Terminal Outcome Stages*: `Deferred`, `Withdrawn`, `Rejected by University`, `Visa Refused`.
