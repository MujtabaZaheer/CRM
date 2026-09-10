# Security Vulnerability & Code Audit Report

**Application**: Education CRM / Student Application Management Platform  
**Audit Date**: September 9, 2026  
**Auditors**: Antigravity Automated QA & Security Inspection Agent  
**Environment**: Local Test Suite & Deployed Production (`https://education-crm-9fee2.web.app/`)  

---

## 1. Executive Security Summary

The codebase demonstrates solid architectural foundations (append-only audit trails, MIME-type and size-capped storage rules, role-gated UI modules). However, our static, dynamic, and automated rules audits revealed **critical privilege escalation vectors in Firestore security rules**, **an unrestricted cross-tenant chat exposure**, **missing route guards on operational queues**, and **vulnerable npm dependencies**.

---

## 2. Vulnerability Findings

### SEC-001: Critical Firestore Privilege Escalation via Email Regex
- **Severity**: **CRITICAL** (CVSS 9.1)
- **Category**: Authorization / Privilege Escalation
- **Affected File**: [`firestore.rules`](file:///c:/Users/m/OneDrive/Desktop/CRM/firestore.rules#L10-L38)
- **Description**: The helper functions `isPlatformAdmin()`, `isCounsellor()`, and `isAdmissionsOfficer()` grant roles by testing whether `request.auth.token.email` matches generic regex expressions:
  ```javascript
  function isPlatformAdmin() {
    return signedIn() && (
      hasRole('platform_super_admin') ||
      (request.auth.token.email != null && (
        request.auth.token.email.matches('.*super_admin.*') ||
        request.auth.token.email.matches('.*superadmin.*')
      ))
    );
  }
  ```
- **Impact**: Any malicious user who signs up with a public email address containing `super_admin` (e.g. `attacker_super_admin@gmail.com` or `hacker.superadmin@outlook.com`) is granted complete administrative access to create/update/delete any database document, including deleting users, wiping tenants, and altering global settings.
- **Recommended Fix**: Remove all regex email pattern matching. Enforce authorization exclusively through verified Firestore user documents or Firebase Auth custom claims (`request.auth.token.role == 'platform_super_admin'`).

---

### SEC-002: High Risk Student Conversations & Messages Unrestricted Access
- **Severity**: **HIGH** (CVSS 8.2)
- **Category**: Data Privacy / Information Disclosure
- **Affected File**: [`firestore.rules`](file:///c:/Users/m/OneDrive/Desktop/CRM/firestore.rules#L197-L203)
- **Description**: The security rules for student chat messages read:
  ```javascript
  match /conversations/{conversationId} {
    allow read, write: if signedIn();
    match /messages/{messageId} {
      allow read, write: if signedIn();
    }
  }
  ```
- **Impact**: Any logged-in user (including any student or external partner) can read or tamper with private communications between any other student and their counsellor.
- **Recommended Fix**: Restrict conversation reads and writes to the student participant (`request.auth.uid in resource.data.participantIds`) and assigned staff.

---

### SEC-003: High Risk Hardcoded Personal Email Bypass
- **Severity**: **HIGH** (CVSS 7.5)
- **Category**: Insecure Defaults
- **Affected File**: [`firestore.rules`](file:///c:/Users/m/OneDrive/Desktop/CRM/firestore.rules#L38)
- **Description**: Line 38 grants student permissions and bypasses ownership checks if `request.auth.token.email == 'aarav.patel@gmail.com'`:
  ```javascript
  function isStudent() { 
    return hasRole('student') || (signedIn() && request.auth.token.email != null && (
      request.auth.token.email.matches('.*student.*') || request.auth.token.email == 'aarav.patel@gmail.com'
    )); 
  }
  ```
- **Impact**: Hardcoding real-world email addresses in security rules introduces account takeover risks if an attacker controls or registers that email.
- **Recommended Fix**: Purge all hardcoded email addresses from security rules; rely strictly on role profiles.

---

### SEC-004: Medium Risk Missing Route Guard on `/leads`
- **Severity**: **MEDIUM** (CVSS 5.8)
- **Category**: Frontend Access Control
- **Affected File**: [`src/App.tsx`](file:///c:/Users/m/OneDrive/Desktop/CRM/src/App.tsx#L175)
- **Description**: The `/leads` route is registered under `ProtectedLayout` without a `RoleGate`:
  ```tsx
  <Route path="/leads" element={<Leads />} />
  ```
- **Impact**: While the sidebar hides the link from non-staff roles, any authenticated external agent or university partner who navigates directly to `/leads` is presented with the internal leads view.
- **Recommended Fix**: Wrap the `/leads` route in a `RoleGate` or `CounsellorRoute` specifying `allowedRoles={["counsellor", "team_leader", "org_admin", "platform_super_admin"]}`.

---

### SEC-005: Known Vulnerabilities in Third-Party NPM Dependencies
- **Severity**: **HIGH** (2 High, 2 Moderate)
- **Category**: Dependency Security
- **Affected Packages**: `js-yaml`, `nanoid`, `@vitest/mocker`
- **Audit Findings**:
  1. `js-yaml` (4.0.0 - 4.3.1): High severity Denial of Service (GHSA-2883-xcg3-v3hh).
  2. `nanoid` (<3.3.18): High severity CPU infinite loop (GHSA-2v37-7h3g-55p8).
  3. `@vitest/mocker` (2.1.0 - 4.1.10): Moderate severity arbitrary file read (GHSA-82fw-gwwq-j7x9).
- **Recommended Fix**: Execute targeted package updates: `npm install nanoid@latest js-yaml@latest`.

---

## 3. Storage Security Rules Evaluation

| Storage Path | Access Rule | Implemented Safeguards | Assessment |
| :--- | :--- | :--- | :---: |
| `/student_documents/{studentId}/{documentId}` | Read | Operational Staff OR Student Owner | **SECURE** |
| `/student_documents/{studentId}/{documentId}` | Create | Operational Staff OR Student Owner + 15MB Size Cap + MIME filter | **SECURE** |
| `/student_documents/{studentId}/{documentId}` | Delete | Strictly `platform_super_admin` OR `org_admin` | **SECURE** |
| `/{allPaths=**}` | Fallback | `allow read, write: if false;` | **SECURE** |

---

## 4. Remediation Prioritization

1. **Priority 1**: Immediately update `firestore.rules` to remove `.*super_admin.*` regex and hardcoded emails.
2. **Priority 2**: Lock down `match /conversations/{conversationId}` so participants can only access their own messages.
3. **Priority 3**: Add `RoleGate` to `<Route path="/leads" />` in `App.tsx`.
4. **Priority 4**: Update dependencies via `npm audit fix`.
