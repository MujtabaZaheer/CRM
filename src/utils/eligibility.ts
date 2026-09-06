/**
 * EduCRM — Programme Eligibility Assessment Engine
 * Cross-examines a student's profile against programme entry criteria
 * and assigns a 4-tier status badge with an overall readiness score.
 *
 * Tiers:
 *   - "Likely Eligible"          — all checks pass
 *   - "Competitive Match"        — meets most, minor gaps
 *   - "Additional Review Required" — conditional items need attention
 *   - "Missing Requirements"     — critical criteria not met
 */

import { Student } from '../types/student';
import { Programme } from '../types/university';

export type EligibilityStatus = 'eligible' | 'competitive' | 'conditional' | 'not_eligible' | 'not_checked';

export type EligibilityLabel =
  | 'Likely Eligible'
  | 'Competitive Match'
  | 'Additional Review Required'
  | 'Missing Requirements'
  | 'Not Checked';

export interface EligibilityCheck {
  label: string;
  status: 'pass' | 'review' | 'fail';
  detail: string;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  label: EligibilityLabel;
  score: number;
  checks: EligibilityCheck[];
  disclaimer: string;
}

const parseScore = (value?: string): number => Number.parseFloat(value || '');

/* ================================================================== */
/*  Main Assessment Function                                           */
/* ================================================================== */

export function assessEligibility(
  student: Student | undefined,
  programme: Programme,
): EligibilityResult {
  const disclaimer =
    'This assessment compares your profile with requirements configured in EduCRM. It is not a guarantee of admission; final decisions are made by the university.';

  if (!student) {
    return {
      status: 'not_checked',
      label: 'Not Checked',
      score: 0,
      checks: [],
      disclaimer: 'Complete your profile to compare it with configured programme requirements.',
    };
  }

  const checks: EligibilityCheck[] = [];
  const requirements = programme.requirements || {};
  const recentAcademic = student.academicHistory?.[0];

  /* ---- Academic GPA / Grade Check ---- */
  const academicScore = parseScore(recentAcademic?.gradeGpa);
  const requiredGpa = requirements.minGpa;

  if (requiredGpa) {
    if (!Number.isNaN(academicScore)) {
      if (academicScore >= requiredGpa) {
        checks.push({
          label: 'Academic score',
          status: 'pass',
          detail: `Meets minimum: ${requiredGpa}. Your score: ${academicScore}.`,
        });
      } else if (academicScore >= requiredGpa * 0.9) {
        // Within 10% — competitive but not guaranteed
        checks.push({
          label: 'Academic score',
          status: 'review',
          detail: `Slightly below minimum ${requiredGpa} (your score: ${academicScore}). May qualify with strong profile.`,
        });
      } else {
        checks.push({
          label: 'Academic score',
          status: 'fail',
          detail: `Below minimum: ${requiredGpa}. Your recorded score: ${academicScore}.`,
        });
      }
    } else {
      checks.push({
        label: 'Academic score',
        status: 'review',
        detail: `Configured minimum: ${requiredGpa}. Add a numeric CGPA to your profile for an exact comparison.`,
      });
    }
  } else {
    checks.push({
      label: 'Academic requirements',
      status: 'review',
      detail: 'Requirements have not yet been configured for this programme.',
    });
  }

  /* ---- English Language — Overall Score ---- */
  const requiredEnglish = requirements.minIelts ?? programme.minIeltsScore;
  const englishScore = parseScore(student.englishProficiency?.overallScore);

  if (requiredEnglish) {
    if (!Number.isNaN(englishScore)) {
      if (englishScore >= requiredEnglish) {
        checks.push({
          label: 'English requirement',
          status: 'pass',
          detail: `Meets minimum: IELTS ${requiredEnglish}. Your score: ${englishScore}.`,
        });
      } else if (englishScore >= requiredEnglish - 0.5) {
        checks.push({
          label: 'English requirement',
          status: 'review',
          detail: `Slightly below IELTS ${requiredEnglish} (your score: ${englishScore}). Pre-sessional English may qualify.`,
        });
      } else {
        checks.push({
          label: 'English requirement',
          status: 'fail',
          detail: `Below minimum: IELTS ${requiredEnglish}. Your recorded score: ${englishScore}.`,
        });
      }
    } else {
      checks.push({
        label: 'English requirement',
        status: 'review',
        detail: `Configured minimum: IELTS ${requiredEnglish}. Add a current English test result to your profile.`,
      });
    }
  }

  /* ---- Prerequisites ---- */
  if (requirements.prerequisites?.length) {
    checks.push({
      label: 'Prerequisites',
      status: 'review',
      detail: `${requirements.prerequisites.join(', ')} require staff or university verification.`,
    });
  }

  /* ---- Work Experience (MBA / Doctorate) ---- */
  if (requirements.workExperienceRequired) {
    const hasWorkHistory = student.employmentHistory && student.employmentHistory.length > 0;
    checks.push({
      label: 'Work experience',
      status: hasWorkHistory ? 'pass' : 'fail',
      detail: hasWorkHistory
        ? `${student.employmentHistory!.length} employment record(s) found in your profile.`
        : 'Work experience is required for this programme. Please add employment history.',
    });
  }

  /* ---- Accepted Qualifications ---- */
  if (requirements.acceptedQualifications?.length && recentAcademic) {
    const qualMatch = requirements.acceptedQualifications.some(
      (q) =>
        recentAcademic.qualification.toLowerCase().includes(q.toLowerCase()) ||
        q.toLowerCase().includes(recentAcademic.qualification.toLowerCase()),
    );
    checks.push({
      label: 'Qualification type',
      status: qualMatch ? 'pass' : 'review',
      detail: qualMatch
        ? `Your qualification "${recentAcademic.qualification}" matches accepted types.`
        : `Accepted: ${requirements.acceptedQualifications.join(', ')}. Your qualification: "${recentAcademic.qualification}" — may need review.`,
    });
  }

  /* ---- Score Calculation ---- */
  const failures = checks.filter((c) => c.status === 'fail').length;
  const reviews = checks.filter((c) => c.status === 'review').length;
  const passes = checks.filter((c) => c.status === 'pass').length;

  const rawScore = Math.max(0, 100 - failures * 35 - reviews * 12);
  const score = Math.min(98, Math.max(5, rawScore));

  /* ---- 4-Tier Status Assignment ---- */
  let status: EligibilityStatus;
  let label: EligibilityLabel;

  if (failures >= 2) {
    status = 'not_eligible';
    label = 'Missing Requirements';
  } else if (failures === 1) {
    status = 'conditional';
    label = 'Additional Review Required';
  } else if (reviews > 0 && passes > reviews) {
    status = 'competitive';
    label = 'Competitive Match';
  } else if (reviews > 0) {
    status = 'conditional';
    label = 'Additional Review Required';
  } else {
    status = 'eligible';
    label = 'Likely Eligible';
  }

  return { status, label, score, checks, disclaimer };
}
