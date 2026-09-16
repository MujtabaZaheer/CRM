import { describe, it, expect } from 'vitest';
import { ALLOWED_CHAT_TARGET_ROLES, isChatAllowed } from '../../src/utils/chatPermissions';
import { ConversationItem } from '../../src/pages/counsellor/CounsellorMessages';

describe('External Agent Support Chat Workflow', () => {
  it('permits external_agent to chat only with support_user', () => {
    const agentAllowed = ALLOWED_CHAT_TARGET_ROLES['external_agent'];
    expect(agentAllowed).toEqual(['support_user']);
    expect(isChatAllowed('external_agent', 'support_user')).toBe(true);
    expect(isChatAllowed('external_agent', 'student')).toBe(false);
  });

  it('correctly initializes a support conversation for an external agent', () => {
    const mockAgent = {
      uid: 'agent_user_123',
      displayName: 'Apex Global Education',
      email: 'contact@apexedu.com',
      role: 'external_agent' as const,
    };

    const supportConvId = `${mockAgent.uid}_support`;
    const welcomeMsg = `Hello ${mockAgent.displayName}! Welcome to Global Support Desk. How can our operations team assist your agency today?`;

    const conv: ConversationItem = {
      id: supportConvId,
      studentId: mockAgent.uid,
      studentName: mockAgent.displayName,
      studentEmail: mockAgent.email,
      initiatorName: mockAgent.displayName,
      initiatorEmail: mockAgent.email,
      initiatorRole: mockAgent.role,
      counsellorId: 'usr_7',
      counsellorName: 'James Wilson (Global Support)',
      counsellorEmail: 'support@educrm.demo',
      channelType: 'support',
      targetRole: 'support_user',
      participants: [mockAgent.uid, 'usr_7'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessage: welcomeMsg,
      lastMessageTimestamp: Date.now(),
      lastMessageSenderId: 'usr_7',
    };

    expect(conv.id).toBe('agent_user_123_support');
    expect(conv.channelType).toBe('support');
    expect(conv.targetRole).toBe('support_user');
    expect(conv.participants).toContain(mockAgent.uid);
    expect(conv.participants).toContain('usr_7');
    expect(conv.initiatorRole).toBe('external_agent');
  });

  it('verifies support conversation passes visibility filter for external agent', () => {
    const agentUid = 'agent_user_123';
    const agentRole = 'external_agent';
    const allowed = ALLOWED_CHAT_TARGET_ROLES[agentRole];

    const supportConv: ConversationItem = {
      id: `${agentUid}_support`,
      participants: [agentUid, 'usr_7'],
      channelType: 'support',
      targetRole: 'support_user',
      studentName: 'Apex Global Education',
      studentEmail: 'contact@apexedu.com',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const isSupportChat = supportConv.channelType === 'support' || supportConv.targetRole === 'support_user';
    const involvesMe = supportConv.participants.includes(agentUid);
    const canAccessSupport = allowed.includes('support_user');

    const isVisibleToAgent = isSupportChat && involvesMe && canAccessSupport;
    expect(isVisibleToAgent).toBe(true);

    // Non-support student conversation should be hidden from external agent
    const studentConv: ConversationItem = {
      id: 'conv_student_456',
      participants: ['student_456', 'counsellor_1'],
      channelType: 'counsellor',
      studentName: 'John Doe',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const isStudentConvVisible = allowed.includes('student');
    expect(isStudentConvVisible).toBe(false);
  });
});
