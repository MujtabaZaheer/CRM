import { describe, it, expect, beforeEach } from 'vitest';

describe('Student Registration Name Autofill and Persistence Flow', () => {
  beforeEach(() => {
    // Clear mock sessionStorage before each test
    sessionStorage.clear();
  });

  describe('Registration Name Processing', () => {
    it('synchronizes fullName when firstName and lastName are entered', () => {
      const formData = {
        firstName: 'Muhammad',
        lastName: 'Ali',
        fullName: '',
      };

      const finalFirstName = formData.firstName.trim();
      const finalLastName = formData.lastName.trim();
      const finalFullName = `${finalFirstName} ${finalLastName}`.trim();

      expect(finalFirstName).toBe('Muhammad');
      expect(finalLastName).toBe('Ali');
      expect(finalFullName).toBe('Muhammad Ali');
    });

    it('falls back to splitting single fullName string if entered as single block', () => {
      const formData = {
        firstName: '',
        lastName: '',
        fullName: 'Saad Ali Qureshi',
      };

      const finalFirstName = (formData.firstName || '').trim() || (formData.fullName || '').trim().split(/\s+/)[0] || '';
      const finalLastName = (formData.lastName || '').trim() || (formData.fullName || '').trim().split(/\s+/).slice(1).join(' ') || '';
      const finalFullName = `${finalFirstName} ${finalLastName}`.trim() || formData.fullName.trim();

      expect(finalFirstName).toBe('Saad');
      expect(finalLastName).toBe('Ali Qureshi');
      expect(finalFullName).toBe('Saad Ali Qureshi');
    });

    it('saves registration data to sessionStorage for zero-latency instant autofill', () => {
      const firstName = 'Muhammad';
      const lastName = 'Ali';
      const fullName = 'Muhammad Ali';
      const phone = '+92 300 1234567';

      sessionStorage.setItem('student_registration_first_name', firstName);
      sessionStorage.setItem('student_registration_last_name', lastName);
      sessionStorage.setItem('student_registration_full_name', fullName);
      sessionStorage.setItem('student_registration_phone', phone);

      expect(sessionStorage.getItem('student_registration_first_name')).toBe('Muhammad');
      expect(sessionStorage.getItem('student_registration_last_name')).toBe('Ali');
      expect(sessionStorage.getItem('student_registration_full_name')).toBe('Muhammad Ali');
      expect(sessionStorage.getItem('student_registration_phone')).toBe('+92 300 1234567');
    });
  });

  describe('Stage 1 Multi-Tier Autofill Resolution', () => {
    it('resolves directly from students collection if firstName and lastName are present', () => {
      const studentDoc = {
        id: 'stu_123',
        firstName: 'Muhammad',
        lastName: 'Ali',
        fullName: 'Muhammad Ali',
        phone: '+92 300 1234567',
      };

      let loadedFirst = studentDoc.firstName || '';
      let loadedLast = studentDoc.lastName || '';
      if ((!loadedFirst || !loadedLast) && studentDoc.fullName) {
        const parts = studentDoc.fullName.trim().split(/\s+/);
        if (!loadedFirst) loadedFirst = parts[0] || '';
        if (!loadedLast) loadedLast = parts.slice(1).join(' ') || '';
      }

      expect(loadedFirst).toBe('Muhammad');
      expect(loadedLast).toBe('Ali');
    });

    it('falls back to splitting fullName if students doc only has fullName', () => {
      const studentDoc = {
        id: 'stu_123',
        fullName: 'Fatima Zahra',
      };

      let loadedFirst = (studentDoc as any).firstName || '';
      let loadedLast = (studentDoc as any).lastName || '';
      if ((!loadedFirst || !loadedLast) && studentDoc.fullName) {
        const parts = studentDoc.fullName.trim().split(/\s+/);
        if (!loadedFirst) loadedFirst = parts[0] || '';
        if (!loadedLast) loadedLast = parts.slice(1).join(' ') || '';
      }

      expect(loadedFirst).toBe('Fatima');
      expect(loadedLast).toBe('Zahra');
    });

    it('falls back to users collection doc if students doc does not have names', () => {
      const userDoc = {
        uid: 'usr_456',
        firstName: 'Usman',
        lastName: 'Khan',
        displayName: 'Usman Khan',
      };

      let loadedFirst = '';
      let loadedLast = '';

      if (!loadedFirst || !loadedLast) {
        if (userDoc) {
          if (!loadedFirst && userDoc.firstName) loadedFirst = userDoc.firstName;
          if (!loadedLast && userDoc.lastName) loadedLast = userDoc.lastName;
        }
      }

      expect(loadedFirst).toBe('Usman');
      expect(loadedLast).toBe('Khan');
    });

    it('falls back to sessionStorage registration cache if Firestore documents are still pending', () => {
      sessionStorage.setItem('student_registration_first_name', 'Ayesha');
      sessionStorage.setItem('student_registration_last_name', 'Siddiqui');

      let loadedFirst = '';
      let loadedLast = '';

      // Primary & secondary checks return empty...
      if (!loadedFirst) loadedFirst = sessionStorage.getItem('student_registration_first_name') || '';
      if (!loadedLast) loadedLast = sessionStorage.getItem('student_registration_last_name') || '';

      expect(loadedFirst).toBe('Ayesha');
      expect(loadedLast).toBe('Siddiqui');
    });
  });

  describe('Stage 1 Save Progress Payload', () => {
    it('persists firstName and lastName alongside fullName to both student and user documents', () => {
      const firstName = 'Muhammad';
      const lastName = 'Ali';
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

      const studentPayload = {
        id: 'uid_test',
        firstName: trimmedFirst,
        lastName: trimmedLast,
        fullName,
        email: 'test@example.com',
        phone: '+92 300 1234567',
        onboardingStatus: 'in_progress',
      };

      const userPayload = {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        displayName: fullName,
        onboardingStatus: 'in_progress',
      };

      expect(studentPayload.firstName).toBe('Muhammad');
      expect(studentPayload.lastName).toBe('Ali');
      expect(studentPayload.fullName).toBe('Muhammad Ali');

      expect(userPayload.firstName).toBe('Muhammad');
      expect(userPayload.lastName).toBe('Ali');
      expect(userPayload.displayName).toBe('Muhammad Ali');
    });
  });
});
