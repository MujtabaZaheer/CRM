# Role & Authorization Permission Matrix

This matrix establishes the expected vs. actual authorization enforcement across the frontend router (`RoleGate`, `RoleRoute`, `StudentOnboardingGuard`) and backend database/storage rules (`firestore.rules`, `storage.rules`).

## 1. Role Inventory & Scope

The application defines **14 distinct roles**:

1. `platform_super_admin` - Global multi-tenant master administrator
2. `org_admin` - Organization-level administrator
3. `office_manager` - Regional branch and office administrator
4. `team_leader` - Operational workload and counsellor supervisor
5. `counsellor` - Frontline student mentor and lead converter
6. `admissions_officer` - University application reviewer and document verifier
7. `compliance_officer` - Risk, visa, and regulatory reviewer
8. `finance_officer` - Invoicing, payment ledger, and commissions accountant
9. `visa_officer` - CAS/COE and immigration case specialist
10. `student` - Applicant with self-service portal and onboarding wizard
11. `auditor` - Read-only oversight for compliance and system trails
12. `support_user` - Helpdesk ticketing and customer support agent
13. `external_agent` - Commission-based student recruitment referral partner
14. `university_partner` - University admissions representative reviewing direct submissions

---

## 2. Comprehensive Role-Permission Matrix

| Resource / Route | Student | Counsellor | Team Leader | Admissions | Finance | Visa Off. | Ext. Agent | Uni. Partner | Auditor | Org Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Student Dashboard** (`/student/dashboard`) |  |  |  |  |  |  |  |  |  |  |  |
| **Student Profile Edit** (`/student/profile`) |  (Own) |  |  |  |  |  |  |  |  |  |  |
| **Universities / Courses** (`/universities`) |  |  |  |  |  |  |  |  |  |  |  |
| **Leads Queue** (`/leads`, `/counsellor/leads`) | ❌ |  |  |  |  |  | ❌ (Referred) | ❌* |  (RO) |  |  |
| **Applications Desk** (`/applications`) | ❌ |  |  |  |  |  | ❌ (Own) | ❌ (Target) |  (RO) |  |  |
| **Admissions Verification** (`/admissions/*`) | ❌ | ❌ |  |  | ❌ | ❌ | ❌ | ❌ |  (RO) |  |  |
| **Finance Invoices/Refunds** (`/finance/*`) | ❌ | ❌ | ❌ | ❌ |  | ❌ | ❌ | ❌ |  (RO) |  |  |
| **Visa Operations** (`/visa-officer/*`) | ❌ | ❌ | ❌ | ❌ | ❌ |  | ❌ | ❌ |  (RO) |  |  |
| **Agent Ledger** (`/agent/*`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  | ❌ |  (RO) |  |  |
| **University Partner Desk** (`/university/*`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |  (RO) |  |  |
| **Support Helpdesk** (`/support/*`) | ❌ (Tickets) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  (RO) |  |  |
| **Auditor Trail** (`/auditor/*`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |  |
| **Super Admin Multi-Tenant** (`/super-admin/*`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |
| **User Management** (`/users`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  |  |
| **Master Audit Logs** (`/audit-log`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |  (RO) |  |  |

*\*Security Flaw Flagged: `/leads` is hidden in the sidebar from University Partners, but direct URL navigation is not blocked by a route guard.*

---

## 3. Security Evaluation: Frontend vs Backend Enforcement

### Frontend Router Enforcement
- **ProtectedLayout**: Enforces authentication session (`auth.currentUser` or active demo session in `localStorage`).
- **RoleGate & RoleRoute**: Effectively denies non-permitted roles for `/super-admin`, `/finance`, `/team-leader`, `/admissions`, `/counsellor`, `/auditor`, `/support`, `/agent`, `/university`, and `/visa-officer` by rendering the `Access Restricted` shield.
- **StudentOnboardingGuard**: Actively intercepts student routes and redirects users with incomplete profiles to `/student/onboarding/step-1`.

### Backend Rules Enforcement (`firestore.rules`)
- **Users**: Signed-in read; Admin/Operational staff listing; User update restricted to self; Delete strictly restricted to `isPlatformAdmin()`.
- **Audit Logs**: Append-only for all signed-in accounts (`allow create: if signedIn(); allow update, delete: if false;`). This ensures non-repudiation.
- **Critical Vulnerability**: `isPlatformAdmin()` contains `request.auth.token.email.matches('.*super_admin.*')`. Any email containing `super_admin` receives database platform admin powers!
- **High Vulnerability**: Conversations and messages allow unrestricted cross-tenant read/write (`allow read, write: if signedIn();`).
