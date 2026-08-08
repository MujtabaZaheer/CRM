---
tags:
  - project/crm
  - architecture/overview
  - status/active
date: 2026-08-09
---

# EduCRM Enterprise System Overview

EduCRM is a multi-tenant education management platform connecting recruitment leads, student profiles, university applications, document verification, financial processing, support ticketing, compliance auditing, and role-gated administration.

## 🕸️ Core System Graph

- **Architecture & Global State**: [[Core Architecture]]
- **Authentication & Security**: [[Authentication & RBAC]]
- **Live Status Matrix**: [[Implementation Status Dashboard]]

### 🎭 User Roles (10 System Roles)
- [[Platform Super Admin Portal]] (`platform_super_admin`)
- [[Organization Admin Role]] (`org_admin`)
- [[Team Leader Module]] (`team_leader`)
- [[Counsellor Module]] (`counsellor`)
- [[Admissions Officer Module]] (`admissions_officer`)
- [[Finance Officer Module]] (`finance_officer`)
- [[Support User Module]] (`support_user`)
- [[Auditor Module]] (`auditor` / `compliance_officer`)

### 📦 Operational Modules
- [[Platform Super Admin Portal]]
- [[Admissions Officer Module]]
- [[Finance Officer Module]]
- [[Support User Module]]
- [[Auditor Module]]
- [[Counsellor Module]]
- [[Team Leader Module]]

### 💾 Data Entities
- [[Lead Entity]]
- [[Student Entity]]
- [[Application Entity]]
- [[Document Entity]]
- [[Invoice Entity]]
- [[Payment Entity]]
- [[Commission Entity]]
- [[Task Entity]]
- [[Audit Log Entity]]

## 🎨 Visual Canvas Map
Open `EduCRM System Graph.canvas` in Obsidian to view the interactive 2D diagram map.
