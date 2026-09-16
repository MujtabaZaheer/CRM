import { describe, it, expect } from 'vitest';
import {
  canUserSetStage,
  getStageOwnerLabel,
  getStageSelectOptionLabel,
  STAGE_AUTHORIZATION_MAP,
} from '../../src/utils/stageAuthorization';
import { Application, ApplicationStage } from '../../src/types/application';

describe('Visa Officer Rejection Authorization', () => {
  it('allows visa_officer to set stage to Rejected', () => {
    const isAllowed = canUserSetStage('visa_officer', 'Rejected');
    expect(isAllowed).toBe(true);
  });

  it('STAGE_AUTHORIZATION_MAP.Rejected includes visa_officer in allowedRoles', () => {
    const config = STAGE_AUTHORIZATION_MAP['Rejected'];
    expect(config.allowedRoles).toContain('visa_officer');
    expect(config.allowedRoles).toContain('admissions_officer');
  });

  it('displays accurate owner label and option label for visa_officer', () => {
    const owner = getStageOwnerLabel('Rejected');
    expect(owner).toContain('Visa Officer');

    const label = getStageSelectOptionLabel('Rejected', 'visa_officer');
    expect(label).not.toContain('🔒');
    expect(label).toBe('Rejected');
  });

  it('simulates visa officer rejection on an application in Visa Submitted stage', () => {
    const sampleApp: Application = {
      id: 'app_1001',
      studentId: 'std_99',
      studentName: 'Ali Khan',
      studentEmail: 'ali@example.com',
      universityId: 'uni_1',
      universityName: 'University of Oxford',
      programmeId: 'prog_1',
      programmeName: 'MSc Computer Science',
      stage: 'Visa Submitted',
      createdAt: Date.now() - 100000,
      updatedAt: Date.now() - 1000,
      history: [
        {
          stage: 'Visa Submitted',
          updatedBy: 'Visa Officer',
          timestamp: Date.now() - 50000,
          note: 'Visa file submitted',
        },
      ],
    };

    // Verify visa officer can transition this app
    expect(canUserSetStage('visa_officer', 'Rejected')).toBe(true);

    const historyItem = {
      stage: 'Rejected' as ApplicationStage,
      updatedBy: 'Visa Officer',
      timestamp: Date.now(),
      note: 'Visa Officer: Visa application refused / rejected by immigration authority.',
    };

    const updatedApp: Application = {
      ...sampleApp,
      stage: 'Rejected',
      updatedAt: Date.now(),
      history: [...(sampleApp.history || []), historyItem],
    };

    expect(updatedApp.stage).toBe('Rejected');
    expect(updatedApp.history[updatedApp.history.length - 1].updatedBy).toBe('Visa Officer');
    expect(updatedApp.history[updatedApp.history.length - 1].note).toContain('immigration authority');
  });
});
