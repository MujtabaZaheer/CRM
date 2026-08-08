---
tags:
  - role/superadmin
  - status/completed
date: 2026-08-09
---

# 🛡️ Platform Super Admin Role

**Status**: 🟢 Implemented & Live in Production (`/super-admin/*`)

The **Platform Super Admin** has ultimate root privileges across the entire multi-tenant EduCRM infrastructure.

## 📋 Responsibilities & Scope (CRM.pdf Section 2 & 3.3)
- **Tenant Management**: Create, onboard, suspend, or reactivate multi-tenant organizations (`TenantOrganization`).
- **Global Configuration**: Manage platform-wide parameters, maintenance mode, public user registration toggles, and enforce Multi-Factor Authentication (MFA).
- **User Role Management**: Inspect and reassign system roles for all registered user accounts across all 10 system roles.
- **Infrastructure Health**: Real-time latency and uptime monitoring for Firebase Auth, Cloud Firestore, Firebase Hosting, and Document Processing Services.
- **Root Audit Trail**: Full access to platform-wide administrative audit logs (`logAuditEvent`).

## 🔗 Connected Modules & Entities
- [[Platform Super Admin Portal]]
- [[Auditor Module]]
- [[Tenant Entity]]
- [[Audit Log Entity]]
