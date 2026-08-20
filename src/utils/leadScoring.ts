/**
 * EduCRM Lead Scoring Engine
 * Evaluates lead data quality, profile completeness, and engagement level
 * to calculate a numerical lead score (0-100) and priority classification.
 */

import { Lead } from "../types/lead";
import { Student } from "../types/student";

export interface LeadScoringWeights {
  hasEmail: number;
  hasPhone: number;
  hasNationality: number;
  hasDestinationCountry: number;
  hasProgramInterest: number;
  hasPassportNumber: number;
  hasEnglishProficiency: number;
  hasAcademicHistory: number;
  hasFinancialProof: number;
  pointsPerInteraction: number;
  maxInteractionPoints: number;
  stalePenaltyPerWeek: number;
}

export const DEFAULT_SCORING_WEIGHTS: LeadScoringWeights = {
  hasEmail: 10,
  hasPhone: 10,
  hasNationality: 5,
  hasDestinationCountry: 10,
  hasProgramInterest: 10,
  hasPassportNumber: 10,
  hasEnglishProficiency: 10,
  hasAcademicHistory: 15,
  hasFinancialProof: 10,
  pointsPerInteraction: 5,
  maxInteractionPoints: 20,
  stalePenaltyPerWeek: 2,
};

export interface LeadScoreBreakdown {
  totalScore: number; // 0-100
  tier: "Hot" | "Warm" | "Cold";
  factors: { factor: string; points: number; earned: boolean }[];
}

/**
 * Calculates a lead score (0-100) based on weighted profile fields and engagement.
 */
export function calculateLeadScore(
  lead: Partial<Lead>,
  student?: Partial<Student> | null,
  weights: LeadScoringWeights = DEFAULT_SCORING_WEIGHTS
): LeadScoreBreakdown {
  const factors: { factor: string; points: number; earned: boolean }[] = [];
  let score = 0;

  // 1. Email
  const hasEmail = Boolean(lead.email && lead.email.includes("@"));
  factors.push({ factor: "Valid Email Provided", points: weights.hasEmail, earned: hasEmail });
  if (hasEmail) score += weights.hasEmail;

  // 2. Phone
  const hasPhone = Boolean(lead.phone && lead.phone.trim().length >= 6);
  factors.push({ factor: "Phone / WhatsApp Provided", points: weights.hasPhone, earned: hasPhone });
  if (hasPhone) score += weights.hasPhone;

  // 3. Nationality
  const hasNat = Boolean(lead.nationality || student?.nationality);
  factors.push({ factor: "Nationality Recorded", points: weights.hasNationality, earned: hasNat });
  if (hasNat) score += weights.hasNationality;

  // 4. Destination Country
  const hasDest = Boolean(lead.destinationCountry || student?.preferredDestination);
  factors.push({ factor: "Study Destination Specified", points: weights.hasDestinationCountry, earned: hasDest });
  if (hasDest) score += weights.hasDestinationCountry;

  // 5. Programme Interest
  const hasProg = Boolean(lead.programInterest);
  factors.push({ factor: "Programme Interest Stated", points: weights.hasProgramInterest, earned: hasProg });
  if (hasProg) score += weights.hasProgramInterest;

  // 6. Passport Number
  const hasPassport = Boolean(lead.passportNumber || student?.passportNumber);
  factors.push({ factor: "Passport Number on File", points: weights.hasPassportNumber, earned: hasPassport });
  if (hasPassport) score += weights.hasPassportNumber;

  // 7. English Proficiency
  const hasEng = Boolean(student?.englishProficiency?.overallScore);
  factors.push({ factor: "English Test Score (IELTS/PTE)", points: weights.hasEnglishProficiency, earned: hasEng });
  if (hasEng) score += weights.hasEnglishProficiency;

  // 8. Academic History
  const hasAcad = Boolean(student?.academicHistory && student.academicHistory.length > 0);
  factors.push({ factor: "Academic Records Provided", points: weights.hasAcademicHistory, earned: hasAcad });
  if (hasAcad) score += weights.hasAcademicHistory;

  // 9. Financial Proof / Sponsor
  const hasFin = Boolean(student?.financialSponsor?.name);
  factors.push({ factor: "Financial Sponsor Identified", points: weights.hasFinancialProof, earned: hasFin });
  if (hasFin) score += weights.hasFinancialProof;

  // 10. Interaction Engagement
  const interactionCount = lead.interactionLog?.length || 0;
  const interactionPoints = Math.min(
    interactionCount * weights.pointsPerInteraction,
    weights.maxInteractionPoints
  );
  factors.push({
    factor: `Counselor Interactions (${interactionCount} logged)`,
    points: weights.maxInteractionPoints,
    earned: interactionPoints > 0,
  });
  score += interactionPoints;

  // 11. Stale Penalty (reduces score if older without stage progress)
  if (lead.createdAt && lead.stage === "New") {
    const daysOld = (Date.now() - lead.createdAt) / (1000 * 60 * 60 * 24);
    const weeksOld = Math.floor(daysOld / 7);
    if (weeksOld > 0) {
      const penalty = Math.min(weeksOld * weights.stalePenaltyPerWeek, 20);
      score = Math.max(0, score - penalty);
      factors.push({
        factor: `Stale Lead Penalty (${weeksOld} weeks in 'New')`,
        points: -penalty,
        earned: true,
      });
    }
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));
  const tier: "Hot" | "Warm" | "Cold" =
    finalScore >= 70 ? "Hot" : finalScore >= 40 ? "Warm" : "Cold";

  return { totalScore: finalScore, tier, factors };
}
