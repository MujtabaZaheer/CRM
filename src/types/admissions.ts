export type DocumentVerificationStatus = "Pending" | "Verified" | "Rejected" | "Expired";

export interface OfferCondition {
  id: string;
  description: string; // e.g. "Submit official IELTS score >= 6.5"
  met: boolean;
  verifiedBy?: string;
  verifiedAt?: number;
}

export interface AdmissionsDecision {
  id: string;
  applicationId: string;
  studentName: string;
  universityName: string;
  programmeName: string;
  decisionType: "Conditional Offer" | "Unconditional Offer" | "Rejection" | "Information Requested" | "Deferred";
  rejectionReason?: string;
  conditions?: OfferCondition[];
  depositAmountRequired?: number;
  depositCurrency?: string;
  depositPaid?: boolean;
  casRefNumber?: string;
  casIssuedAt?: number;
  officerEmail: string;
  createdAt: number;
  notes?: string;
}

export interface DocumentVerificationRecord {
  id: string;
  documentId: string;
  studentId: string;
  studentName: string;
  docType: string;
  fileName: string;
  status: DocumentVerificationStatus;
  feedback?: string;
  verifiedBy: string;
  verifiedAt: number;
}

export interface AdmissionsMetrics {
  totalPendingReview: number;
  documentsPendingVerification: number;
  offersIssued: number;
  casPending: number;
  enrolledTotal: number;
}
