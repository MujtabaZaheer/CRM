# EduCRM Requirements Matrix

Source: `CRM.pdf` (43 pages), assessed on 2026-08-16.

Status definitions:

- **Implemented** - a production-capable workflow exists and is protected by appropriate access controls.
- **Partial** - a UI or limited workflow exists, but the complete requirement is not yet met.
- **Missing** - no implementation exists.
- **Blocked** - must wait for an external decision, credential, or service.

## Current baseline

| Area | Status | Acceptance criteria for completion |
| --- | --- | --- |
| Authentication and accounts | Partial | Invitation/student signup, verified email, reset, session management, MFA-ready providers, and trusted role provisioning. |
| Multi-tenancy and permissions | Partial | Every record and query is organization-scoped; rules enforce tenant, office, team, record, field, and action permissions. |
| Dashboards | Partial | Permission-filtered, filterable, drill-down metrics with exports, saved views, alerts, and performance targets. |
| Leads, students, applications | Partial | Complete lifecycle, duplicate prevention, histories, bulk actions, approvals, checklists, archiving, and import/export. |
| Documents | Partial | Storage-backed upload, verification, versioning, expiry, restricted access, malware scanning, retention, and download logging. |
| Universities and programmes | Partial | Full academic hierarchy, intake/fees/requirements, imports, versioning, availability, and source verification. |
| Programme search and recommendations | Partial | Counsellor-only matcher exists; global search, shortlisting, comparison, explanation, overrides, and history remain. |
| AI counsellor | Missing | OCR/extraction, drafting, scoring, governance, human approval, quotas, and audit records. |
| Communications | Missing | Email/SMS/WhatsApp/internal messaging, templates, consent, delivery status, scheduling, and automation. |
| Tasks, calendar, automation | Partial | Tasks exist; calendar, appointments, reminders, recurrence, workflow rules, escalation, and integration remain. |
| Agent, student, university portals | Partial | Basic portal views exist; full self-service, contracts, commissions, requests, payments, and permission-scoped workflows remain. |
| Finance and commissions | Partial | UI workflows exist; real payment processing, reconciliation, exchange rates, statements, approvals, accounting export, and audit controls remain. |
| Forms, integrations, APIs | Missing | Form builder, OAuth/API connections, sync logs, imports, webhooks, public API, and developer documentation. |
| Reports, data quality, search | Partial | Role pages exist; global search, report builder, scheduled exports, data-quality queue, and natural-language reporting remain. |
| Audit, privacy, security, operations | Partial | Trusted append-only audit writes, consent/retention/DSRs, testing, monitoring, backups, accessibility, localization, and incident procedures remain. |

## Delivery gates

1. **Secure core**: authentication, role provisioning, tenant isolation, document storage, audit backend, and automated rule tests.
2. **Operational core**: end-to-end CRM workflows and complete role portals.
3. **Automation and ecosystem**: communications, forms, integrations, reporting, search, data quality, and APIs.
4. **Advanced services**: AI counsellor, operational controls, and production resilience.

This matrix is the source of truth for implementation progress; the legacy status dashboard must not be treated as a verified completion record.
