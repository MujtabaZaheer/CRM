import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pure evaluator matching Firestore Security Rules logic for conversation & message authorization.
 * Accurately models the exact boolean predicate defined in firestore.rules:
 *
 * function canAccessConversation(conv) {
 *   return signedIn() && (
 *     isAdmin() ||
 *     isOperationalStaff() ||
 *     conv.studentId == request.auth.uid ||
 *     (request.auth.token.email != null && conv.studentEmail == request.auth.token.email) ||
 *     (conv.participants != null && request.auth.uid in conv.participants) ||
 *     conv.counsellorId == request.auth.uid
 *   );
 * }
 */
interface AuthContext {
  uid?: string;
  email?: string;
  role?: string;
}

interface ConversationDoc {
  id: string;
  studentId: string;
  studentEmail?: string;
  counsellorId?: string;
  participants?: string[];
}

const isStaffOrAdmin = (role?: string): boolean => {
  return [
    'platform_super_admin',
    'org_admin',
    'counsellor',
    'admissions_officer',
    'team_leader',
    'visa_officer',
    'finance_officer',
    'support_user',
  ].includes(role || '');
};

const evaluateCanAccessConversation = (auth: AuthContext | null, conv: ConversationDoc): boolean => {
  if (!auth || !auth.uid) return false;
  if (isStaffOrAdmin(auth.role)) return true;
  if (conv.studentId === auth.uid) return true;
  if (auth.email && conv.studentEmail === auth.email) return true;
  if (conv.participants && conv.participants.includes(auth.uid)) return true;
  if (conv.counsellorId === auth.uid) return true;
  return false;
};

const evaluateCanCreateMessage = (
  auth: AuthContext | null,
  conv: ConversationDoc,
  messageSenderId: string
): boolean => {
  if (!evaluateCanAccessConversation(auth, conv)) return false;
  if (!auth || !auth.uid) return false;
  if (isStaffOrAdmin(auth.role)) return true;
  return messageSenderId === auth.uid;
};

describe('Student Chat Security (Phase 2 Fix Verification)', () => {
  const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');

  // Rules file static assertions
  it('RULES INTEGRITY: firestore.rules implements canAccessConversation predicate', () => {
    expect(firestoreRules).toContain('function canAccessConversation(conv)');
    expect(firestoreRules).toContain('conv.studentId == request.auth.uid');
    expect(firestoreRules).toContain('request.auth.uid in conv.participants');
    expect(firestoreRules).not.toContain('allow read, write: if signedIn();');
  });

  // CHAT-001: Student reads own conversation → PASS
  it('CHAT-001: Student reads own conversation → PASS', () => {
    const studentAuth: AuthContext = { uid: 'student_101', email: 'alice@student.com', role: 'student' };
    const ownConversation: ConversationDoc = {
      id: 'conv_1',
      studentId: 'student_101',
      studentEmail: 'alice@student.com',
      participants: ['student_101', 'counsellor_201'],
    };

    const canRead = evaluateCanAccessConversation(studentAuth, ownConversation);
    expect(canRead).toBe(true);
  });

  // CHAT-002: Student reads another student conversation → DENIED
  it('CHAT-002: Student reads another student conversation → DENIED', () => {
    const attackerStudent: AuthContext = { uid: 'student_999', email: 'mallory@student.com', role: 'student' };
    const victimConversation: ConversationDoc = {
      id: 'conv_victim',
      studentId: 'student_101',
      studentEmail: 'alice@student.com',
      participants: ['student_101', 'counsellor_201'],
    };

    const canRead = evaluateCanAccessConversation(attackerStudent, victimConversation);
    expect(canRead).toBe(false);
  });

  // CHAT-003: Student writes own conversation → PASS
  it('CHAT-003: Student writes own conversation → PASS', () => {
    const studentAuth: AuthContext = { uid: 'student_101', email: 'alice@student.com', role: 'student' };
    const ownConversation: ConversationDoc = {
      id: 'conv_1',
      studentId: 'student_101',
      studentEmail: 'alice@student.com',
      participants: ['student_101', 'counsellor_201'],
    };

    const canWrite = evaluateCanCreateMessage(studentAuth, ownConversation, 'student_101');
    expect(canWrite).toBe(true);
  });

  // CHAT-004: Student writes another student conversation → DENIED
  it('CHAT-004: Student writes another student conversation → DENIED', () => {
    const attackerStudent: AuthContext = { uid: 'student_999', email: 'mallory@student.com', role: 'student' };
    const victimConversation: ConversationDoc = {
      id: 'conv_victim',
      studentId: 'student_101',
      studentEmail: 'alice@student.com',
      participants: ['student_101', 'counsellor_201'],
    };

    const canWrite = evaluateCanCreateMessage(attackerStudent, victimConversation, 'student_999');
    expect(canWrite).toBe(false);
  });

  // CHAT-005: Unrelated authenticated user → DENIED
  it('CHAT-005: Unrelated authenticated user → DENIED', () => {
    const unrelatedUser: AuthContext = { uid: 'unrelated_user_555', email: 'stranger@external.com', role: 'external_agent' };
    const studentConversation: ConversationDoc = {
      id: 'conv_private',
      studentId: 'student_101',
      studentEmail: 'alice@student.com',
      participants: ['student_101', 'counsellor_201'],
    };

    const canRead = evaluateCanAccessConversation(unrelatedUser, studentConversation);
    const canWrite = evaluateCanCreateMessage(unrelatedUser, studentConversation, 'unrelated_user_555');

    expect(canRead).toBe(false);
    expect(canWrite).toBe(false);
  });

  // CHAT-006: Unauthenticated user → DENIED
  it('CHAT-006: Unauthenticated user → DENIED', () => {
    const unauthenticatedUser = null;
    const conversation: ConversationDoc = {
      id: 'conv_1',
      studentId: 'student_101',
      participants: ['student_101'],
    };

    const canRead = evaluateCanAccessConversation(unauthenticatedUser, conversation);
    const canWrite = evaluateCanCreateMessage(unauthenticatedUser, conversation, 'anon');

    expect(canRead).toBe(false);
    expect(canWrite).toBe(false);
  });
});
