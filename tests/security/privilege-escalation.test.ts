import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Privilege Escalation Prevention (Phase 1 Fix Verification)', () => {
  const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');

  it('MANDATORY REGRESSION: Email containing super_admin does NOT receive Super Admin privileges in rules', () => {
    // 1. Ensure email regex pattern matching is absent — these patterns grant privilege by email substring
    expect(firestoreRules).not.toContain("email.matches('.*super_admin.*')");
    expect(firestoreRules).not.toContain("email.matches('.*superadmin.*')");
    // The hardcoded admin email list must also be gone
    expect(firestoreRules).not.toContain("'admin@educrm.com'");
    expect(firestoreRules).not.toContain("'superadmin@educrm.demo'");

    // 2. Ensure role helpers strictly use hasRole — not email-based inference
    const isPlatformAdminMatch = firestoreRules.match(/function isPlatformAdmin\(\)\s*\{[\s\S]*?\}/);
    expect(isPlatformAdminMatch).not.toBeNull();
    if (isPlatformAdminMatch) {
      const fnBody = isPlatformAdminMatch[0];
      // Must not contain email regex or hardcoded email pattern
      expect(fnBody).not.toContain("email.matches");
      expect(fnBody).not.toContain("email in [");
      // Must use role-based check (the role name itself contains 'super_admin' — that is correct)
      expect(fnBody).toContain("hasRole('platform_super_admin')");
    }
  });

  it('MANDATORY REGRESSION: Email containing counsellor/admissions does NOT infer staff privileges', () => {
    const isCounsellorMatch = firestoreRules.match(/function isCounsellor\(\)\s*\{[\s\S]*?\}/);
    expect(isCounsellorMatch).not.toBeNull();
    if (isCounsellorMatch) {
      expect(isCounsellorMatch[0]).not.toContain("email.matches");
      expect(isCounsellorMatch[0]).toContain("hasRole('counsellor')");
    }

    const isAdmissionsMatch = firestoreRules.match(/function isAdmissionsOfficer\(\)\s*\{[\s\S]*?\}/);
    expect(isAdmissionsMatch).not.toBeNull();
    if (isAdmissionsMatch) {
      expect(isAdmissionsMatch[0]).not.toContain("email.matches");
      expect(isAdmissionsMatch[0]).toContain("hasRole('admissions_officer')");
    }
  });

  it('ANTI-SELF-ELEVATION: Authenticated users cannot promote themselves to privileged roles on user document update', () => {
    const userUpdateMatch = firestoreRules.match(/match \/users\/\{userId\} \{[\s\S]*?allow update:[\s\S]*?;/);
    expect(userUpdateMatch).not.toBeNull();
    if (userUpdateMatch) {
      const rule = userUpdateMatch[0];
      // Must protect sensitive fields from self-update
      expect(rule).toContain("!request.resource.data.diff(resource.data).affectedKeys().hasAny(");
      expect(rule).toContain("'role'");
      expect(rule).toContain("'tenantId'");
      expect(rule).toContain("'partnerUniversityId'");
    }
  });

  it('ANTI-SELF-PROVISIONING: Non-admins cannot create accounts with administrative roles', () => {
    const userCreateMatch = firestoreRules.match(/match \/users\/\{userId\} \{[\s\S]*?allow create:[\s\S]*?;/);
    expect(userCreateMatch).not.toBeNull();
    if (userCreateMatch) {
      const rule = userCreateMatch[0];
      // Only admins or unprivileged roles allowed on creation
      expect(rule).toContain("isAdmin()");
      expect(rule).toContain("request.resource.data.role == 'student'");
    }
  });

  it('FRONTEND LOGIN: Demo login role mapping rejects arbitrary emails containing super_admin substring', () => {
    const loginPath = path.resolve(process.cwd(), 'src/pages/Login.tsx');
    const loginSource = fs.readFileSync(loginPath, 'utf8');

    // Substring inclusion of super_admin or admin must not be used for role elevation
    expect(loginSource).not.toContain('lowerEmail.includes("super_admin")');
    expect(loginSource).not.toContain('lowerEmail.includes("superadmin")');

    // Strict dictionary mapping must be used
    expect(loginSource).toContain('EXACT_DEMO_ROLE_MAP');
  });
});
