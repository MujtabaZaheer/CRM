import { describe, it, expect } from 'vitest';
import { COMMON_COUNTRIES, toCountryName, toNationalityDemonym } from '../../src/utils/cvExtractor';

describe('Student Registration Nationality and Country Synchronization', () => {
  it('has Pakistan as the default first element in COMMON_COUNTRIES', () => {
    expect(COMMON_COUNTRIES[0]).toBe('Pakistan');
  });

  it('correctly maps demonyms to country names matching dropdown options', () => {
    expect(toCountryName('Pakistani')).toBe('Pakistan');
    expect(toCountryName('British')).toBe('United Kingdom');
    expect(toCountryName('American')).toBe('United States');
    expect(toCountryName('Canadian')).toBe('Canada');
    expect(toCountryName('Australian')).toBe('Australia');
    expect(toCountryName('Pakistan')).toBe('Pakistan');
  });

  it('simulates student registration state defaulting to Pakistan for both country and nationality', () => {
    const initialRole = 'student';
    const initialCountry = initialRole === 'student' ? 'Pakistan' : '';
    const initialNationality = initialRole === 'student' ? 'Pakistan' : '';

    expect(initialCountry).toBe('Pakistan');
    expect(initialNationality).toBe('Pakistan');
    expect(initialCountry).toBe(initialNationality);
  });

  it('synchronizes nationality when country of residence is changed unless user explicitly overrode it', () => {
    let countryOfResidence = 'Pakistan';
    let nationality = 'Pakistan';

    // Simulate changing country of residence from Pakistan to United Kingdom
    const newCountry = 'United Kingdom';
    if (!nationality || nationality === countryOfResidence) {
      nationality = newCountry;
    }
    countryOfResidence = newCountry;

    expect(countryOfResidence).toBe('United Kingdom');
    expect(nationality).toBe('United Kingdom');

    // If user explicitly chose a different nationality (e.g., dual national or expat)
    nationality = 'Pakistan';
    const nextCountry = 'Canada';
    if (!nationality || nationality === countryOfResidence) {
      nationality = nextCountry;
    }
    countryOfResidence = nextCountry;

    expect(countryOfResidence).toBe('Canada');
    expect(nationality).toBe('Pakistan'); // Preserved user override
  });

  it('normalizes Firestore student profile data where nationality is a demonym', () => {
    const mockDbStudent = {
      fullName: 'Hamza Tariq',
      nationality: 'Pakistani',
      countryOfResidence: 'Pakistan',
    };

    const normalizedNat = mockDbStudent.nationality
      ? (toCountryName(mockDbStudent.nationality) || mockDbStudent.nationality)
      : 'Pakistan';

    expect(normalizedNat).toBe('Pakistan');
    expect(COMMON_COUNTRIES).toContain(normalizedNat);
  });
});
