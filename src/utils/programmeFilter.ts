/**
 * EduCRM University & Programme Search & Filtering Engine
 * Supports multi-criteria discovery: destination country, tuition budget,
 * minimum IELTS/English score, maximum study gaps allowed, and work visa eligibility.
 */

export interface ProgrammeFilterCriteria {
  country?: string;
  discipline?: string;
  studyLevel?: "Undergraduate" | "Postgraduate" | "Doctorate" | "Foundation";
  intake?: string; // e.g. "Fall 2026", "Spring 2027"
  maxTuitionUSD?: number;
  minIeltsScore?: number;
  maxBacklogsAllowed?: number;
  hasScholarship?: boolean;
  hasPostStudyWorkVisa?: boolean;
}

export interface UniversityProgramme {
  id: string;
  universityId: string;
  universityName: string;
  programmeName: string;
  country: string;
  city: string;
  studyLevel: "Undergraduate" | "Postgraduate" | "Doctorate" | "Foundation";
  discipline: string;
  durationMonths: number;
  tuitionFeeUSD: number;
  tuitionFeeLocal: string;
  minIeltsOverall: number;
  minGpaPercentage: number;
  intakes: string[];
  scholarshipAvailable: boolean;
  scholarshipMaxDiscountPercent?: number;
  postStudyWorkVisaYears: number;
  maxBacklogsAllowed: number;
  partnerCommissionRatePercent: number;
  campusHighlights: string[];
}

export const SAMPLE_PROGRAMMES: UniversityProgramme[] = [
  {
    id: "prog-1",
    universityId: "uni-manchester",
    universityName: "University of Manchester",
    programmeName: "MSc Advanced Computer Science",
    country: "United Kingdom",
    city: "Manchester",
    studyLevel: "Postgraduate",
    discipline: "Computer Science & IT",
    durationMonths: 12,
    tuitionFeeUSD: 36000,
    tuitionFeeLocal: "£29,000",
    minIeltsOverall: 6.5,
    minGpaPercentage: 65,
    intakes: ["September 2026", "January 2027"],
    scholarshipAvailable: true,
    scholarshipMaxDiscountPercent: 20,
    postStudyWorkVisaYears: 2,
    maxBacklogsAllowed: 4,
    partnerCommissionRatePercent: 15,
    campusHighlights: ["Russell Group Member", "Top 30 Global Rank", "Placement Year Option"],
  },
  {
    id: "prog-2",
    universityId: "uni-birmingham",
    universityName: "University of Birmingham",
    programmeName: "MSc Data Science & Artificial Intelligence",
    country: "United Kingdom",
    city: "Birmingham",
    studyLevel: "Postgraduate",
    discipline: "Data Science & AI",
    durationMonths: 12,
    tuitionFeeUSD: 34000,
    tuitionFeeLocal: "£27,500",
    minIeltsOverall: 6.5,
    minGpaPercentage: 60,
    intakes: ["September 2026"],
    scholarshipAvailable: true,
    scholarshipMaxDiscountPercent: 15,
    postStudyWorkVisaYears: 2,
    maxBacklogsAllowed: 6,
    partnerCommissionRatePercent: 14,
    campusHighlights: ["Gold TEF Rated", "Industry Hackathons", "Dedicated Career Centre"],
  },
  {
    id: "prog-3",
    universityId: "uni-toronto",
    universityName: "University of Toronto",
    programmeName: "Master of Management Analytics",
    country: "Canada",
    city: "Toronto",
    studyLevel: "Postgraduate",
    discipline: "Business & Analytics",
    durationMonths: 11,
    tuitionFeeUSD: 44000,
    tuitionFeeLocal: "CAD 60,000",
    minIeltsOverall: 7.0,
    minGpaPercentage: 75,
    intakes: ["September 2026"],
    scholarshipAvailable: false,
    postStudyWorkVisaYears: 3,
    maxBacklogsAllowed: 2,
    partnerCommissionRatePercent: 12,
    campusHighlights: ["#1 in Canada", "Downtown Toronto Location", "3-Year PGWP"],
  },
  {
    id: "prog-4",
    universityId: "uni-melbourne",
    universityName: "University of Melbourne",
    programmeName: "Master of Information Technology",
    country: "Australia",
    city: "Melbourne",
    studyLevel: "Postgraduate",
    discipline: "Computer Science & IT",
    durationMonths: 24,
    tuitionFeeUSD: 38000,
    tuitionFeeLocal: "AUD 52,000",
    minIeltsOverall: 6.5,
    minGpaPercentage: 65,
    intakes: ["February 2027", "July 2026"],
    scholarshipAvailable: true,
    scholarshipMaxDiscountPercent: 25,
    postStudyWorkVisaYears: 3,
    maxBacklogsAllowed: 5,
    partnerCommissionRatePercent: 15,
    campusHighlights: ["Group of Eight (Go8)", "Melbourne Innovation District", "Flexible Major"],
  },
  {
    id: "prog-5",
    universityId: "uni-greenwich",
    universityName: "University of Greenwich",
    programmeName: "BSc Computer Science (Cyber Security)",
    country: "United Kingdom",
    city: "London",
    studyLevel: "Undergraduate",
    discipline: "Computer Science & IT",
    durationMonths: 36,
    tuitionFeeUSD: 20000,
    tuitionFeeLocal: "£16,500",
    minIeltsOverall: 6.0,
    minGpaPercentage: 55,
    intakes: ["September 2026", "January 2027"],
    scholarshipAvailable: true,
    scholarshipMaxDiscountPercent: 30,
    postStudyWorkVisaYears: 2,
    maxBacklogsAllowed: 10,
    partnerCommissionRatePercent: 18,
    campusHighlights: ["Affordable London Campus", "MOI Waiver Accepted", "High Visa Success"],
  },
];

/**
 * Filters a programme list according to user criteria.
 */
export function filterProgrammes(
  programmes: UniversityProgramme[],
  criteria: ProgrammeFilterCriteria
): UniversityProgramme[] {
  return programmes.filter((p) => {
    if (criteria.country && criteria.country !== "All" && (p.country || "").toLowerCase() !== criteria.country.toLowerCase()) {
      return false;
    }
    if (criteria.discipline && criteria.discipline !== "All" && !(p.discipline || "").toLowerCase().includes(criteria.discipline.toLowerCase())) {
      return false;
    }
    if (criteria.studyLevel && p.studyLevel !== criteria.studyLevel) {
      return false;
    }
    if (criteria.maxTuitionUSD && p.tuitionFeeUSD > criteria.maxTuitionUSD) {
      return false;
    }
    if (criteria.minIeltsScore && p.minIeltsOverall > criteria.minIeltsScore) {
      return false;
    }
    if (criteria.hasScholarship && !p.scholarshipAvailable) {
      return false;
    }
    if (criteria.hasPostStudyWorkVisa && p.postStudyWorkVisaYears < 2) {
      return false;
    }
    return true;
  });
}
