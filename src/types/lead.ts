export type LeadStage =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Counselling"
  | "Documents Pending"
  | "Application Initiated"
  | "Converted"
  | "Lost"
  | "Unresponsive";

export type LeadSource =
  | "Website"
  | "Referral"
  | "Walk-in"
  | "Social Media"
  | "Agent"
  | "Other";

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationality?: string;
  countryOfResidence?: string;
  programInterest?: string;
  destinationCountry?: string;
  source: LeadSource;
  stage: LeadStage;
  notes?: string;
  lostReason?: string;
  lastContactedAt?: number;
  assignedTo?: string; // uid or email
  createdAt: number;
  updatedAt: number;
}
