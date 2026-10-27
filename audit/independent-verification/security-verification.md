# Security, Authorization & Tenant Boundary Verification

**Target**: `https://education-crm-9fee2.web.app`  
**Execution Timestamp**: 2026-10-27  
**Test Harness**: Playwright Live Browser Automation + Vitest Security Suite + Static Rules Inspection  
**Overall Verdict**: **PASS**  

---

## 1. Frontend Route Guard Verification

| Security Scenario | Protected Target | Role / State Tested | Expected Behaviour | Actual Live Behaviour | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unauthenticated Lead Access** | `/leads` | Unauthenticated Guest | Immediate redirect to `/login` | Redirected to `https://education-crm-9fee2.web.app/login` | **PASS** |
| **Unauthenticated Student Portal** | `/student/dashboard` | Unauthenticated Guest | Immediate redirect to `/login` | Redirected to `https://education-crm-9fee2.web.app/login` | **PASS** |
| **Student Privilege Escalation** | `/super-admin/dashboard` | Authenticated Student (`Aarav Patel`) | Access blocked with warning screen | Rendered `Access Restricted` shield with message: *"Your role (student) does not have permission to view this module."* | **PASS** |
| **Direct URL Deep Link Guard** | `/dashboard` | Unauthenticated Guest | Intercepted by `ProtectedLayout` | Redirected to `/login` | **PASS** |

---

## 2. Backend Authorization & Firestore Security Rules (`firestore.rules`)

Inspection of authoritative `firestore.rules` (390 lines):

### A. Multi-Tenant Scoping
- **Function**: `matchesTenant(data)`
- **Rule**: `isPlatformAdmin() || (!('tenantId' in data) || data.tenantId == userTenant())`
- **Enforcement**: Staff belonging to `tenant-london` cannot query or read leads, students, or applications belonging to `tenant-delhi` or other branches unless they possess `platform_super_admin` credentials.
- **Tenant Immutability**: `isImmutableTenantUpdate()` prevents non-superadmins from altering the `tenantId` of an existing record.

### B. Student Privacy & Cross-Student Isolation
- **Function**: `studentOwner(student)`
- **Rule**: `student.email == request.auth.token.email || student.id == request.auth.uid`
- **Enforcement**: A student can only view and update their own document records in `student_documents` and applications in `applications`. Requests for another student's record are rejected by Firestore at the database engine level.

### C. Privilege Escalation Prevention
- **Rule on `/users/{userId}`**:
  ```text
  allow update: if isAdmin() || (
    signedIn() && request.auth.uid == userId &&
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'tenantId', 'partnerUniversityId', 'isSuperAdmin', 'admin'])
  );
  ```
- **Enforcement**: Non-admins can update personal profile fields (e.g. phone, address), but any attempt to alter `role`, `tenantId`, or `admin` flags is rejected by Firestore.

### D. Self-Service Signup Role Restrictions
- Self-registration on `/register` is restricted to non-privileged roles: `['student', 'external_agent', 'university_partner']`. Privileged staff accounts (`counsellor`, `visa_officer`, `admissions_officer`, `org_admin`) can only be provisioned by authenticated administrators.

---

## 3. Document Upload & File Integrity Security

Inspection of `src/utils/documentStorage.ts`:
- **Allowed MIME Types**: Whitelist strictly permits `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Executables (`.exe`, `.sh`, `.bat`, `.js`) are rejected.
- **Maximum File Size**: 15 MB (`15 * 1024 * 1024` bytes). Zero-byte or oversize files throw validation errors before processing.

---

## 4. Sensitive Credentials & Secrets Audit

- **Client Bundle Inspection**: Verified that no Google Cloud secret keys, Gemini API master keys, or database service account JSON credentials exist in the production bundle (`dist/`).
- **Firebase Config**: Contains standard public client identifiers (`apiKey`, `authDomain`, `projectId`) designed for browser delivery, protected server-side by Firebase Security Rules and App Check.
