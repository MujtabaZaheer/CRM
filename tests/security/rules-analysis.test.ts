import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Firestore & Firebase Storage Security Rules Audit', () => {
  const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');

  const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');
  const storageRules = fs.readFileSync(storageRulesPath, 'utf8');

  describe('Firestore Security Rules Vulnerability Analysis', () => {
    it('SEC-FIX-001: Regex-based privilege escalation is completely eliminated from role helpers', () => {
      // Must NOT contain regex pattern matching for administrative or staff roles
      const hasSuperAdminRegex = firestoreRules.includes("matches('.*super_admin.*')") || firestoreRules.includes("matches('.*superadmin.*')");
      const hasCounsellorRegex = firestoreRules.includes("matches('.*counsellor.*')");
      const hasAdmissionsRegex = firestoreRules.includes("matches('.*admissions.*')");
      const hasStudentRegex = firestoreRules.includes("matches('.*student.*')");

      expect(hasSuperAdminRegex).toBe(false);
      expect(hasCounsellorRegex).toBe(false);
      expect(hasAdmissionsRegex).toBe(false);
      expect(hasStudentRegex).toBe(false);
    });

    it('SEC-FIX-002: Hardcoded email bypasses are eliminated from security rules', () => {
      expect(firestoreRules.includes("'aarav.patel@gmail.com'")).toBe(false);
      expect(firestoreRules.includes("'admin@educrm.com'")).toBe(false);
    });

    it('SEC-FIX-003: User directory strictly prevents self-elevation of roles and permissions', () => {
      const userBlock = firestoreRules.match(/match \/users\/\{userId\} \{[\s\S]*?allow delete: if isPlatformAdmin\(\);[\s\S]*?\}/);
      expect(userBlock).not.toBeNull();
      if (userBlock) {
        expect(userBlock[0]).toContain("affectedKeys().hasAny(['role', 'tenantId', 'partnerUniversityId'");
      }
    });

    it('SEC-FIX-004: Student conversations & messages enforce participant and role authorization', () => {
      const convBlock = firestoreRules.match(/match \/conversations\/\{conversationId\} \{[\s\S]*?match \/messages\/\{messageId\} \{[\s\S]*?\}[\s\S]*?\}/);
      expect(convBlock).not.toBeNull();
      if (convBlock) {
        // Open signedIn() access must NOT exist
        expect(convBlock[0]).not.toContain('allow read, write: if signedIn();');
        expect(convBlock[0]).toContain('canAccessConversation(resource.data)');
        expect(convBlock[0]).toContain('canAccessConversation(get(');
      }
    });

    it('VERIFICATION: Audit logs collection is strictly append-only (tamper proof)', () => {
      const auditLogBlock = firestoreRules.match(/match \/audit_logs\/\{logId\} \{[\s\S]*?\}/);
      expect(auditLogBlock).not.toBeNull();
      if (auditLogBlock) {
        expect(auditLogBlock[0]).toContain('allow update, delete: if false;');
        expect(auditLogBlock[0]).toContain('allow create: if signedIn();');
      }
    });

    it('VERIFICATION: User collection delete requires platform admin', () => {
      const userBlock = firestoreRules.match(/match \/users\/\{userId\} \{[\s\S]*?\}/);
      expect(userBlock).not.toBeNull();
      if (userBlock) {
        expect(userBlock[0]).toContain('allow delete: if isPlatformAdmin();');
      }
    });

    it('VERIFICATION: Default deny is present at root fallback', () => {
      const hasDefaultDeny = /match \/\{document=\*\*\}\s*\{\s*allow read, write:\s*if false;\s*\}/.test(firestoreRules);
      expect(hasDefaultDeny).toBe(true);
    });
  });

  describe('Storage Security Rules Audit', () => {
    it('VERIFICATION: File size is strictly capped at 15MB', () => {
      expect(storageRules).toContain('15 * 1024 * 1024');
    });

    it('VERIFICATION: Content-Type is restricted to valid documents and images', () => {
      expect(storageRules).toContain("contentType.matches('application/pdf|image/.*|application/msword|application/vnd.openxmlformats-officedocument.*')");
    });

    it('VERIFICATION: File storage path enforces student isolation', () => {
      expect(storageRules).toContain('match /student_documents/{studentId}/{documentId}');
      expect(storageRules).toContain('isStudentOwner(studentId)');
    });

    it('VERIFICATION: File deletion requires administrative privileges', () => {
      expect(storageRules).toContain("allow delete: if hasRole('platform_super_admin') || hasRole('org_admin');");
    });

    it('VERIFICATION: Storage default deny is present', () => {
      expect(storageRules).toContain('match /{allPaths=**} { allow read, write: if false; }');
    });
  });
});
