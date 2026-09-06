/**
 * EduCRM — Immigration & Country Intelligence Data
 * Provides structured visa, financial, and compliance advisories
 * for 9 global study destinations, plus a dynamic document
 * checklist generator based on country + study level.
 */

import type { ImmigrationAdvisory } from '../types/country';
import type { DocumentChecklistItem } from '../types/application';

/* ================================================================== */
/*  Immigration Advisory Records — 9 Countries                        */
/* ================================================================== */

export const IMMIGRATION_DATA: Record<string, ImmigrationAdvisory> = {
  'United Kingdom': {
    country: 'United Kingdom',
    visaType: 'Student Visa (formerly Tier 4)',
    financialProof: {
      amount: '£1,334 / month',
      description:
        'Must show funds for up to 9 months (£12,006 total) for London, or £1,023/mo for outside London. Funds must be held for 28 consecutive days.',
    },
    pswvRights: {
      duration: '2–3 Years',
      description:
        'Graduate Route allows 2 years post-study work for Bachelor\'s/Master\'s, and 3 years for PhD graduates. No sponsor required.',
    },
    languageAcceptance: [
      'IELTS (UKVI or Academic) — min 6.0 overall',
      'PTE Academic — min 54 overall',
      'TOEFL iBT — min 72 overall',
      'MOI (Selective universities only)',
    ],
    intakeMilestones: [
      'September (Main) — Apply by June',
      'January (Secondary) — Apply by October',
      'May (Limited) — Apply by February',
    ],
    complianceWarnings: [
      'Strict gap limit: Gaps over 2–3 years require strong justification with supporting evidence.',
      'Biometric Residence Permit (BRP) transitioning to eVisas — check latest UKVI guidance.',
      'Visa refusal history from any country must be disclosed and may require additional explanation.',
    ],
    partnerCount: 142,
    biometricRequired: true,
    studyGapLimitYears: 3,
    healthInsuranceRequired: false,
    tuitionAffordabilityTier: '$$',
    estimatedMonthlyLiving: '£1,200 – £1,500',
    minIeltsOverall: 6.0,
  },

  Canada: {
    country: 'Canada',
    visaType: 'Study Permit',
    financialProof: {
      amount: 'CAD 20,635 / year',
      description:
        'Guaranteed Investment Certificate (GIC) of CAD 20,635 required. Must also show funds for first year tuition and return transportation.',
    },
    pswvRights: {
      duration: '1–3 Years',
      description:
        "Post-Graduation Work Permit (PGWP). Duration matches program length (min 8 months). Master's graduates eligible for 3-year PGWP.",
    },
    languageAcceptance: [
      'IELTS Academic — min 6.0 overall',
      'PTE Academic — min 56 overall',
      'Duolingo — declining acceptance at many DLIs',
      'CELPIP — accepted for immigration, not all academic programs',
    ],
    intakeMilestones: [
      'September (Fall) — Apply by April',
      'January (Winter) — Apply by September',
      'May (Summer) — Apply by January',
    ],
    complianceWarnings: [
      'Provincial Attestation Letter (PAL) required for undergraduate study permit applications.',
      'Spousal Open Work Permits (SOWP) restricted primarily to Master\'s & PhD students.',
      'Study permit processing times vary significantly by country of origin.',
    ],
    partnerCount: 89,
    biometricRequired: true,
    studyGapLimitYears: 5,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$$',
    estimatedMonthlyLiving: 'CAD 1,000 – 1,500',
    minIeltsOverall: 6.0,
  },

  'United States': {
    country: 'United States',
    visaType: 'F-1 Student Visa',
    financialProof: {
      amount: 'USD 25,000 – 45,000',
      description:
        'I-20 issuance requires liquid funds covering exactly 1 year of total tuition + living costs. Bank statements must be recent (within 3 months).',
    },
    pswvRights: {
      duration: '1–3 Years',
      description:
        '1 year OPT (Optional Practical Training) + 24-month STEM OPT extension for STEM-designated degrees. Total up to 3 years.',
    },
    languageAcceptance: [
      'IELTS Academic — min 6.5 overall',
      'TOEFL iBT — min 80 overall',
      'Duolingo English Test — min 105',
    ],
    intakeMilestones: [
      'August (Fall) — Apply by March',
      'January (Spring) — Apply by September',
    ],
    complianceWarnings: [
      'Rigorous F-1 Visa interview process at US Embassy required.',
      'Must maintain full-time enrollment to keep SEVIS record active.',
      'On-campus employment limited to 20 hrs/week during academic term.',
    ],
    partnerCount: 205,
    biometricRequired: true,
    studyGapLimitYears: 5,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$$$',
    estimatedMonthlyLiving: 'USD 1,200 – 2,000',
    minIeltsOverall: 6.5,
  },

  Australia: {
    country: 'Australia',
    visaType: 'Student Visa (Subclass 500)',
    financialProof: {
      amount: 'AUD 29,710 / year',
      description:
        'Required for living costs under Subclass 500 visa. Must also demonstrate tuition + travel costs. Genuine Student (GS) requirement applies.',
    },
    pswvRights: {
      duration: '2–4 Years',
      description:
        'Temporary Graduate visa (subclass 485). 2 years for Bachelor, 3 years for Master (coursework), 4 years for Master (research)/PhD. Durations reduced in 2024 policy update.',
    },
    languageAcceptance: [
      'IELTS Academic — min 6.0 overall',
      'PTE Academic — min 50 overall',
      'TOEFL iBT — recently reinstated for some categories',
    ],
    intakeMilestones: [
      'February (Semester 1) — Apply by November',
      'July (Semester 2) — Apply by April',
      'November (Summer) — Limited availability',
    ],
    complianceWarnings: [
      'Genuine Student (GS) requirement replaced the GTE requirement in 2024.',
      'High scrutiny on concurrent enrollments and provider transfers.',
      'OSHC (Overseas Student Health Cover) mandatory for entire visa duration.',
    ],
    partnerCount: 41,
    biometricRequired: true,
    studyGapLimitYears: 4,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$$$',
    estimatedMonthlyLiving: 'AUD 1,800 – 2,500',
    minIeltsOverall: 6.0,
  },

  Germany: {
    country: 'Germany',
    visaType: 'National Visa (Student Visa Type D)',
    financialProof: {
      amount: '€11,208 / year',
      description:
        'Must be deposited into a German Blocked Account (Sperrkonto). Released monthly at €934. Additional proof may be needed for private universities.',
    },
    pswvRights: {
      duration: '18 Months',
      description:
        'Job-seeking visa granted after graduation to find employment related to your degree. Can convert to a work visa upon job offer.',
    },
    languageAcceptance: [
      'IELTS Academic — min 6.0 overall',
      'TOEFL iBT — min 80 overall',
      'Goethe/Telc certificates — required for German-taught programs',
      'TestDaF — Level 4 in all sections for German-medium',
    ],
    intakeMilestones: [
      'October (Winter Semester) — Apply by July',
      'April (Summer Semester) — Apply by January',
    ],
    complianceWarnings: [
      'APS Certificate mandatory for applicants from India, China, and Vietnam.',
      'Public universities often have very high academic standing requirements.',
      'Part-time work limited to 120 full days or 240 half days per year.',
    ],
    partnerCount: 28,
    biometricRequired: true,
    studyGapLimitYears: 3,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$',
    estimatedMonthlyLiving: '€800 – €1,100',
    minIeltsOverall: 6.0,
  },

  Ireland: {
    country: 'Ireland',
    visaType: 'Study Visa (Stamp 2)',
    financialProof: {
      amount: '€10,000 / year',
      description:
        'Required immediately available funds for immigration registration upon arrival. Must show proof of tuition payment separately.',
    },
    pswvRights: {
      duration: '1–2 Years',
      description:
        "Third Level Graduate Scheme: 1 year for Bachelor's, 2 years for Master's and PhD graduates.",
    },
    languageAcceptance: [
      'IELTS Academic — min 6.0 overall',
      'PTE Academic — min 56 overall',
      'Duolingo English Test — accepted by most institutions',
      'TOEFL iBT — min 72 overall',
    ],
    intakeMilestones: [
      'September (Autumn) — Apply by June',
      'January (Spring) — Apply by October',
    ],
    complianceWarnings: [
      'Stamp 2 permission required to work part-time (20h during term, 40h during holidays).',
      'Must attend at least 85% of classes to maintain immigration status.',
    ],
    partnerCount: 15,
    biometricRequired: false,
    studyGapLimitYears: 4,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$$',
    estimatedMonthlyLiving: '€900 – €1,400',
    minIeltsOverall: 6.0,
  },

  'New Zealand': {
    country: 'New Zealand',
    visaType: 'Fee Paying Student Visa',
    financialProof: {
      amount: 'NZD 20,000 / year',
      description:
        'Must show NZD 20,000 per year for living costs, plus evidence of tuition fee payment or scholarship confirmation.',
    },
    pswvRights: {
      duration: '1–3 Years',
      description:
        "Post-Study Work Visa: 1 year for Bachelor's, 2 years for Master's, 3 years for PhD. Must study in New Zealand for at least 30 weeks.",
    },
    languageAcceptance: [
      'IELTS Academic — min 6.0 overall',
      'PTE Academic — min 50 overall',
      'TOEFL iBT — min 80 overall',
      'Cambridge (CAE/CPE) — score 169+',
    ],
    intakeMilestones: [
      'February (Semester 1) — Apply by November',
      'July (Semester 2) — Apply by April',
    ],
    complianceWarnings: [
      'Student visa holders can work up to 20 hours per week during term.',
      'Must maintain satisfactory academic progress as defined by institution.',
      'Health insurance (medical and travel) is mandatory for visa approval.',
    ],
    partnerCount: 12,
    biometricRequired: false,
    studyGapLimitYears: 5,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$$',
    estimatedMonthlyLiving: 'NZD 1,200 – 1,600',
    minIeltsOverall: 6.0,
  },

  'United Arab Emirates': {
    country: 'United Arab Emirates',
    visaType: 'Student Residence Visa',
    financialProof: {
      amount: 'AED 36,000 / year',
      description:
        'Proof of financial support covering tuition and living costs. Sponsor letter or bank statements required. University typically sponsors the visa.',
    },
    pswvRights: {
      duration: '1 Year',
      description:
        'Job-seeking visa available for graduates of accredited UAE institutions. Golden Visa available for outstanding graduates.',
    },
    languageAcceptance: [
      'IELTS Academic — min 5.5 overall',
      'TOEFL iBT — min 61 overall',
      'EmSAT English — min 1400',
      'PTE Academic — min 42 overall',
    ],
    intakeMilestones: [
      'September (Fall) — Apply by July',
      'January (Spring) — Apply by November',
    ],
    complianceWarnings: [
      'Student visa is typically sponsored by the university — cannot freelance or work outside approved hours.',
      'Medical fitness test required upon arrival for visa stamping.',
      'Emirates ID registration mandatory within 30 days of visa issuance.',
    ],
    partnerCount: 18,
    biometricRequired: true,
    studyGapLimitYears: 5,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$$$',
    estimatedMonthlyLiving: 'AED 3,000 – 5,000',
    minIeltsOverall: 5.5,
  },

  Singapore: {
    country: 'Singapore',
    visaType: "Student's Pass",
    financialProof: {
      amount: 'SGD 20,000 – 30,000',
      description:
        "Proof of sufficient funds to cover tuition and living expenses. Applicants may apply through ICA's Student's Pass Online Application & Registration (SOLAR).",
    },
    pswvRights: {
      duration: '1 Year',
      description:
        'Long-Term Visit Pass (LTVP) for job search post-graduation. Employment Pass or S Pass for full-time work once an offer is secured.',
    },
    languageAcceptance: [
      'IELTS Academic — min 6.5 overall',
      'TOEFL iBT — min 85 overall',
      'PTE Academic — min 58 overall',
      'Cambridge (CAE) — min score 176',
    ],
    intakeMilestones: [
      'August (Semester 1) — Apply by March',
      'January (Semester 2) — Apply by September',
    ],
    complianceWarnings: [
      "Student's Pass holders may work part-time up to 16 hours per week during term.",
      'Must maintain minimum 90% attendance to retain pass validity.',
      'Medical examination required before pass issuance.',
    ],
    partnerCount: 8,
    biometricRequired: false,
    studyGapLimitYears: 4,
    healthInsuranceRequired: false,
    tuitionAffordabilityTier: '$$$',
    estimatedMonthlyLiving: 'SGD 1,000 – 1,800',
    minIeltsOverall: 6.5,
  },
};

/* ================================================================== */
/*  Lookup Helper                                                      */
/* ================================================================== */

export const getImmigrationData = (countryName: string): ImmigrationAdvisory => {
  const exact = IMMIGRATION_DATA[countryName];
  if (exact) return exact;
  const match = Object.values(IMMIGRATION_DATA).find(
    (c) => c.country.toLowerCase() === countryName.toLowerCase(),
  );
  if (match) return match;

  return {
    country: countryName,
    visaType: `${countryName} Student Visa`,
    financialProof: {
      amount: '$12,000 – $22,000 / year',
      description: `Must demonstrate verifiable liquid maintenance funds covering first-year tuition plus living expenses in ${countryName}.`,
    },
    pswvRights: {
      duration: '1–2 Years',
      description: `Post-study work rights subject to national immigration policies, study level, and local employment criteria in ${countryName}.`,
    },
    languageAcceptance: [
      'IELTS Academic — min 6.0 overall',
      'TOEFL iBT — min 78 overall',
      'PTE Academic — min 56 overall',
      'Medium of Instruction (MOI) waiver (institution dependent)',
    ],
    intakeMilestones: [
      'Fall Term (September/October) — Primary Intake',
      'Spring Term (January/February) — Secondary Intake',
      'Summer Term (May/June) — Selected Programs',
    ],
    complianceWarnings: [
      'Genuine student intent and authentic academic transcripts required.',
      'Study gaps exceeding 2 years require employment proof or formal justification.',
      'Verify national biometric and health clearance protocols before visa submission.',
    ],
    partnerCount: 15,
    biometricRequired: true,
    studyGapLimitYears: 3,
    healthInsuranceRequired: true,
    tuitionAffordabilityTier: '$$',
    estimatedMonthlyLiving: '$900 – $1,500',
    minIeltsOverall: 6.0,
  };
};

/* ================================================================== */
/*  Dynamic Document Checklist Generator                               */
/* ================================================================== */

/**
 * Generates a country- and level-specific document checklist.
 * Returns all required & optional documents a student must prepare.
 */
export function getDocumentChecklist(
  country: string,
  level: string,
): DocumentChecklistItem[] {
  const base: DocumentChecklistItem[] = [
    { docType: 'passport', label: 'Passport Bio-Page (valid 6+ months)', status: 'missing', required: true },
    { docType: 'academic_transcript', label: 'Academic Transcripts (all years)', status: 'missing', required: true },
    { docType: 'degree_certificate', label: 'Provisional / Final Degree Certificate', status: 'missing', required: true },
    { docType: 'english_scorecard', label: 'English Language Test Scorecard (IELTS/PTE/TOEFL)', status: 'missing', required: true },
    { docType: 'sop', label: 'Statement of Purpose (SOP)', status: 'missing', required: true },
    { docType: 'cv', label: 'Updated CV / Résumé', status: 'missing', required: true },
    { docType: 'photo', label: 'Passport-Size Photographs (white background)', status: 'missing', required: true },
  ];

  const countryLower = country.toLowerCase();

  // Country-specific financial documents
  if (countryLower.includes('united kingdom') || countryLower === 'uk') {
    base.push(
      { docType: 'financial_evidence', label: 'Bank Statements (28-day rule) — Maintenance Funds', status: 'missing', required: true },
      { docType: 'tb_test', label: 'Tuberculosis (TB) Test Certificate', status: 'missing', required: true, notes: 'Required from certain countries' },
    );
  } else if (countryLower.includes('canada') || countryLower === 'ca') {
    base.push(
      { docType: 'gic', label: 'Guaranteed Investment Certificate (GIC)', status: 'missing', required: true },
      { docType: 'pal', label: 'Provincial Attestation Letter (PAL)', status: 'missing', required: level.includes('Under') || level.includes('Bachelor'), notes: 'Required for undergraduate programs' },
      { docType: 'financial_evidence', label: 'Proof of First-Year Tuition Payment', status: 'missing', required: true },
    );
  } else if (countryLower.includes('germany') || countryLower === 'de') {
    base.push(
      { docType: 'blocked_account', label: 'German Blocked Account (Sperrkonto) — €11,208', status: 'missing', required: true },
      { docType: 'aps', label: 'APS Certificate', status: 'missing', required: false, notes: 'Required for applicants from India, China, Vietnam' },
    );
  } else if (countryLower.includes('australia') || countryLower === 'au') {
    base.push(
      { docType: 'financial_evidence', label: 'Financial Declaration — AUD 29,710 / year', status: 'missing', required: true },
      { docType: 'oshc', label: 'Overseas Student Health Cover (OSHC)', status: 'missing', required: true },
      { docType: 'gs_statement', label: 'Genuine Student (GS) Statement', status: 'missing', required: true },
    );
  } else if (countryLower.includes('united states') || countryLower === 'us') {
    base.push(
      { docType: 'financial_evidence', label: 'Financial Affidavit & Bank Statements (I-20 Support)', status: 'missing', required: true },
      { docType: 'sevis_fee', label: 'SEVIS Fee Receipt (I-901)', status: 'missing', required: true },
    );
  } else if (countryLower.includes('united arab emirates') || countryLower === 'ae' || countryLower.includes('uae')) {
    base.push(
      { docType: 'financial_evidence', label: 'Sponsor Letter / Bank Statements', status: 'missing', required: true },
      { docType: 'medical_fitness', label: 'Medical Fitness Test Report', status: 'missing', required: true },
    );
  } else {
    base.push(
      { docType: 'financial_evidence', label: 'Financial Evidence / Bank Statements', status: 'missing', required: true },
    );
  }

  // Common optional documents
  base.push(
    { docType: 'national_id', label: 'National ID Card (if applicable)', status: 'missing', required: false },
    { docType: 'reference_letter', label: 'Academic Reference Letter(s)', status: 'missing', required: true },
    { docType: 'work_experience', label: 'Employment / Work Experience Letters', status: 'missing', required: level.includes('MBA') || level.includes('Doctorate') || level.includes('PhD'), notes: level.includes('MBA') ? 'Typically required for MBA applications' : undefined },
    { docType: 'gap_justification', label: 'Study Gap Justification Letter', status: 'missing', required: false, notes: 'Required if gap exceeds 1–2 years' },
  );

  return base;
}
