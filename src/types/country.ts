/**
 * EduCRM — Country & Immigration Intelligence Types
 * Canonical type definitions for the Global Country Discovery Hub (Step 2).
 */

/* ------------------------------------------------------------------ */
/*  Destination Country                                                */
/* ------------------------------------------------------------------ */

export type TuitionAffordabilityTier = '$' | '$$' | '$$$';

export interface DestinationCountry {
  id: string;
  name: string;
  code: string;
  flag: string;
  currency: string;
  tuitionAffordabilityTier: TuitionAffordabilityTier;
  pswvLengthYears: number;
  popularIntakes: string[];
  partnerCount: number;
  averageTuition: string;
}

/* ------------------------------------------------------------------ */
/*  Immigration Advisory                                               */
/* ------------------------------------------------------------------ */

export interface ImmigrationAdvisory {
  country: string;
  visaType: string;
  financialProof: {
    amount: string;
    description: string;
  };
  pswvRights: {
    duration: string;
    description: string;
  };
  languageAcceptance: string[];
  intakeMilestones: string[];
  complianceWarnings: string[];
  partnerCount: number;
  biometricRequired: boolean;
  studyGapLimitYears: number;
  healthInsuranceRequired: boolean;
  tuitionAffordabilityTier: TuitionAffordabilityTier;
  estimatedMonthlyLiving?: string;
  minIeltsOverall?: number;
}

/* ------------------------------------------------------------------ */
/*  Default Destination Data                                           */
/* ------------------------------------------------------------------ */

export const DEFAULT_DESTINATIONS: DestinationCountry[] = [
  {
    id: 'uk',
    name: 'United Kingdom',
    code: 'UK',
    flag: '🇬🇧',
    currency: 'GBP',
    tuitionAffordabilityTier: '$$',
    pswvLengthYears: 2,
    popularIntakes: ['September', 'January'],
    partnerCount: 142,
    averageTuition: '£14,000 – £28,000',
  },
  {
    id: 'ca',
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    currency: 'CAD',
    tuitionAffordabilityTier: '$$',
    pswvLengthYears: 3,
    popularIntakes: ['September', 'January', 'May'],
    partnerCount: 89,
    averageTuition: 'CAD 18,000 – 35,000',
  },
  {
    id: 'us',
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    currency: 'USD',
    tuitionAffordabilityTier: '$$$',
    pswvLengthYears: 3,
    popularIntakes: ['Fall (Aug)', 'Spring (Jan)'],
    partnerCount: 205,
    averageTuition: '$20,000 – $45,000',
  },
  {
    id: 'au',
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    currency: 'AUD',
    tuitionAffordabilityTier: '$$$',
    pswvLengthYears: 2,
    popularIntakes: ['February', 'July'],
    partnerCount: 41,
    averageTuition: 'AUD 22,000 – 42,000',
  },
  {
    id: 'de',
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    currency: 'EUR',
    tuitionAffordabilityTier: '$',
    pswvLengthYears: 1.5,
    popularIntakes: ['Winter (Oct)', 'Summer (Apr)'],
    partnerCount: 28,
    averageTuition: '€0 – €16,000',
  },
  {
    id: 'ie',
    name: 'Ireland',
    code: 'IE',
    flag: '🇮🇪',
    currency: 'EUR',
    tuitionAffordabilityTier: '$$',
    pswvLengthYears: 2,
    popularIntakes: ['September', 'January'],
    partnerCount: 15,
    averageTuition: '€11,000 – €25,000',
  },
  {
    id: 'nz',
    name: 'New Zealand',
    code: 'NZ',
    flag: '🇳🇿',
    currency: 'NZD',
    tuitionAffordabilityTier: '$$',
    pswvLengthYears: 3,
    popularIntakes: ['February', 'July'],
    partnerCount: 12,
    averageTuition: 'NZD 24,000 – 38,000',
  },
  {
    id: 'ae',
    name: 'United Arab Emirates',
    code: 'AE',
    flag: '🇦🇪',
    currency: 'AED',
    tuitionAffordabilityTier: '$$$',
    pswvLengthYears: 1,
    popularIntakes: ['September', 'January'],
    partnerCount: 18,
    averageTuition: 'AED 40,000 – 80,000',
  },
  {
    id: 'sg',
    name: 'Singapore',
    code: 'SG',
    flag: '🇸🇬',
    currency: 'SGD',
    tuitionAffordabilityTier: '$$$',
    pswvLengthYears: 1,
    popularIntakes: ['August', 'January'],
    partnerCount: 8,
    averageTuition: 'SGD 25,000 – 50,000',
  },
];
