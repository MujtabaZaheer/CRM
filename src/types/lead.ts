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

export interface LeadInteraction {
  id: string;
  timestamp: number;
  type: "Call" | "Email" | "WhatsApp" | "Meeting" | "Note" | "Stage Change";
  summary: string;
  performedBy: string;
}

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passportNumber?: string;
  nationality?: string;
  countryOfResidence?: string;
  programInterest?: string;
  destinationCountry?: string;
  preferredIntake?: string;
  budgetRangeUSD?: string;
  source: LeadSource;
  stage: LeadStage;
  notes?: string;
  assignedTo?: string; // uid or email
  assignedCounsellor?: string;
  assignedAt?: number;
  leadScore?: number; // 0-100
  interactionLog?: LeadInteraction[];
  lastContactedAt?: number;
  lostReason?: string;
  createdAt: number;
  updatedAt: number;
}

