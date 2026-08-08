---
tags:
  - module/superadmin
  - status/completed
date: 2026-08-09
---

# Platform Super Admin Portal

Enterprise multi-tenant management portal for organization onboarding, user role assignments, platform security, and infrastructure monitoring.

## 🔗 Connections & Dependencies
- **Role**: `platform_super_admin`
- **Data Hook**: `useSuperAdminData.ts`
- **Route Guard**: `SuperAdminRoute.tsx`
- **Main Workspace**: `SuperAdminWorkspace.tsx`

## 📑 Core Entities & Features
- **Tenant Management**: Multi-tenant organization onboarding (`TenantOrganization`), domain assignment, tier management (Starter, Professional, Enterprise), and activation toggles.
- **User Role Management**: Platform-wide user account management and instant role reassignments.
- **System Health Monitor**: Live latency and uptime metrics across Firebase Auth, Firestore, Hosting, and Document Verification Engine.
- **Global Settings**: Public registration toggles, MFA enforcement, and maintenance mode controls.
