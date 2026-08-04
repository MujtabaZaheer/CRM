export type StudyLevel =
  | "Undergraduate"
  | "Postgraduate"
  | "Doctorate"
  | "Foundation"
  | "Pre-Master";

export interface Programme {
  id: string;
  title: string;
  level: StudyLevel;
  durationMonths: number;
  tuitionFeeAnnual: number;
  currency: string;
  intakes: string[]; // e.g. ["September", "January"]
  minIeltsScore?: number;
  entryRequirements?: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  campus?: string;
  website?: string;
  logoUrl?: string;
  programmes: Programme[];
  createdAt: number;
  updatedAt: number;
}
