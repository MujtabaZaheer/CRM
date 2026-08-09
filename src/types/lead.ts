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
  assignedTo?: string; // uid, optional for now
  lastContactedAt?: number;
  lostReason?: string;
  createdAt: number;
  updatedAt: number;
}
