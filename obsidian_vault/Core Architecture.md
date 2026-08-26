---
tags:
  - architecture/core
  - tech-stack
  - security/rbac
date: 2026-08-10
---

# 🏗️ EduCRM Core System Architecture

Comprehensive design reference for the EduCRM multi-tenant education management platform.

---

## 1. 💻 Tech Stack & Infrastructure

- **Frontend Framework**: React 18 with TypeScript & Vite build engine (`vite v6.4.3`).
- **Styling System**: High-contrast, dark-mode CSS Design Tokens (`--bg-card`, `--bg-elevated`, `--border-default`, `--text-primary`, `--text-secondary`, `--text-muted`) with Lucide React icons.
- **Routing & Guards**: React Router DOM (`v6.22.3`) with nested route layouts and role-gated route wrappers.
- **Database Backend**: Firebase Cloud Firestore (NoSQL Document Store) with multi-collection real-time listeners (`onSnapshot`).
- **Authentication**: Firebase Auth (Email/Password & Token Claims) + Quick Demo Mode context fallback.
- **Hosting & CDN**: Firebase Hosting deployed live at **`https://education-crm-9fee2.web.app`**.
- **Version Control**: Git & GitHub Repository at **`https://github.com/MujtabaZaheer/CRM.git`** (`main` branch).

---

## 2. ⚡ State Management & Context Providers

EduCRM utilizes a 3-tier Context Provider hierarchy wrapped inside `src/App.tsx`:

```tsx
<ThemeProvider>
  <AuthProvider>
    <GlobalDataProvider>
      <BrowserRouter>
        {/* All App Routes */}
      </BrowserRouter>
    </GlobalDataProvider>
  </AuthProvider>
</ThemeProvider>
```

### Context Breakdown:
1. **`ThemeProvider` (`src/contexts/ThemeContext.tsx`)**:
   - Manages light/dark theme toggles and system appearance tokens.
2. **`AuthProvider` (`src/contexts/AuthContext.tsx`)**:
   - Subscribes to `onAuthStateChanged(auth)`.
   - Fetches the active `AppUser` document from `users/{uid}` in Firestore.
   - Provides `loginAsDemoRole(role)` for instant role evaluation, automatically provisioning server-side user profiles to Firestore so security rules and queries resolve correctly.
3. **`GlobalDataProvider` (`src/contexts/GlobalDataContext.tsx`)**:
   - Subscribes to real-time `onSnapshot` streams across core collections: `leads`, `students`, `applications`, `student_documents`, `tasks`, `invoices`, `payments`, `refunds`, `commissions`, and `audit_logs`.
   - Provides `showDemoData` & `toggleDemoData()` state to dynamically switch between pre-seeded demo records and clean, real-time live data during presentations.
   - Provides instant global state accessibility across all role workspaces without re-fetching.

---

## 3. 🔐 Security & Role-Based Access Control (RBAC)

### Firestore Security Rules (`firestore.rules`):
Strict server-side validation using custom helper functions:

```javascript
function isSignedIn() { return request.auth != null; }
function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }

function isSuperAdmin() { return isSignedIn() && getUserData().role == 'platform_super_admin'; }
function isOrgAdmin() { return isSignedIn() && getUserData().role == 'org_admin'; }
function isCounsellor() { return isSignedIn() && getUserData().role == 'counsellor'; }
function isTeamLeader() { return isSignedIn() && getUserData().role == 'team_leader'; }
function isFinanceOfficer() { return isSignedIn() && getUserData().role == 'finance_officer'; }
function isAdmissionsOfficer() { return isSignedIn() && getUserData().role == 'admissions_officer'; }
function isVisaOfficer() { return isSignedIn() && getUserData().role == 'visa_officer'; }
function isSupportUser() { return isSignedIn() && getUserData().role == 'support_user'; }
function isAuditor() { return isSignedIn() && (getUserData().role == 'auditor' || getUserData().role == 'compliance_officer'); }
function isStudent() { return isSignedIn() && getUserData().role == 'student'; }
function ownsStudent(studentId) { return isStudent() && get(/databases/$(database)/documents/students/$(studentId)).data.email == request.auth.token.email; }
```

### Route Guards (`src/components/layout/`):
- **`RoleGate.tsx`**: Higher-order component restricting access based on `allowedRoles`.
- **`RoleRoute.tsx`**: Generic role wrapper for student, visa, and agent portals.
- **`SuperAdminRoute.tsx`**: Restricts `/super-admin/*` to `platform_super_admin`.
- **`SupportRoute.tsx`**: Restricts `/support/*` to `support_user`, `platform_super_admin`, `org_admin`.
- **`AuditorRoute.tsx`**: Restricts `/auditor/*` to `auditor`, `compliance_officer`, `platform_super_admin`, `org_admin`.
- **`AdmissionsRoute.tsx`**: Restricts `/admissions/*` to `admissions_officer`, `platform_super_admin`, `org_admin`.
- **`FinanceRoute.tsx`**: Restricts `/finance/*` to `finance_officer`, `platform_super_admin`, `org_admin`.

---

## 4. 📜 Audit Logging System (`auditLogger.ts`)

Every state mutation (lead created, application stage updated, offer letter issued, payment recorded, ticket status updated) automatically triggers `logAuditEvent`:

```typescript
export const logAuditEvent = async (
  action: string,
  userEmail: string,
  entityType: string,
  details: string,
  entityId?: string,
  userRole?: string
) => {
  await addDoc(collection(db, "audit_logs"), {
    action,
    userEmail,
    entityType,
    details,
    entityId: entityId || "",
    userRole: userRole || "Unknown",
    timestamp: Date.now(),
  });
};
```

Audit logs are stored immutably in Firestore under `/audit_logs` and streamed in real-time to the **Auditor Portal** (`/auditor/audit-trail`) and **Super Admin Portal** (`/super-admin/audit-logs`).
