export type InvoiceStatus = "Draft" | "Pending" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";
export type InvoiceType = "Application Fee" | "Service Charge" | "Deposit" | "Tuition Fee" | "Visa Fee" | "Other";
export type PaymentMethod = "Card" | "Bank Transfer" | "Cash" | "Online Gateway" | "Cheque" | "Other";
export type RefundStatus = "Requested" | "Under Review" | "Approved" | "Paid" | "Rejected";
export type CommissionStatus = "Pending" | "Eligible" | "Approved" | "Paid" | "Reversed" | "Disputed";
export type CurrencyCode = "USD" | "GBP" | "EUR" | "AUD" | "CAD" | "AED" | "PKR";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: "Pending" | "Paid" | "Overdue";
  paidAt?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId?: string;
  studentName: string;
  studentEmail?: string;
  applicationId?: string;
  type: InvoiceType;
  items?: InvoiceLineItem[];
  subtotal?: number;
  taxRate?: number; // e.g. 5%
  taxAmount?: number;
  discountAmount?: number;
  amount: number;
  currency: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentSchedule?: PaymentScheduleItem[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  receiptNumber?: string;
  createdAt: number;
}

export interface Refund {
  id: string;
  invoiceId: string;
  studentName: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  approvedBy?: string;
  requestedAt: number;
  updatedAt: number;
}

export interface CommissionRule {
  id: string;
  universityId?: string;
  universityName?: string;
  agentTier?: "Bronze" | "Silver" | "Gold" | "Platinum";
  commissionType: "Percentage" | "Fixed Amount";
  rate: number; // e.g. 15% or $1500
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Commission {
  id: string;
  agentId?: string;
  agentName: string;
  counsellorId?: string;
  counsellorName?: string;
  studentId?: string;
  studentName?: string;
  applicationId?: string;
  universityName?: string;
  tuitionFeeAmount?: number;
  rateApplied?: number; // % or fixed
  amount: number;
  currency: string;
  status: CommissionStatus;
  payoutBatchId?: string;
  paidAt?: number;
  createdAt: number;
  updatedAt: number;
}

