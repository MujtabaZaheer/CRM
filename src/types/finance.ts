export type InvoiceStatus = "Draft" | "Pending" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";
export type InvoiceType = "Application Fee" | "Service Charge" | "Deposit" | "Tuition Fee" | "Visa Fee" | "Other";
export type PaymentMethod = "Card" | "Bank Transfer" | "Cash" | "Online Gateway" | "Cheque" | "Other";
export type RefundStatus = "Requested" | "Under Review" | "Approved" | "Paid" | "Rejected";
export type CommissionStatus = "Pending" | "Eligible" | "Approved" | "Paid" | "Reversed" | "Disputed";

export interface Invoice { id: string; invoiceNumber: string; studentName: string; applicationId?: string; type: InvoiceType; amount: number; currency: string; dueDate: string; status: InvoiceStatus; notes?: string; createdAt: number; updatedAt: number; }
export interface Payment { id: string; invoiceId: string; invoiceNumber: string; studentName: string; amount: number; currency: string; method: PaymentMethod; reference: string; paidAt: string; createdAt: number; }
export interface Refund { id: string; invoiceId: string; studentName: string; amount: number; currency: string; reason: string; status: RefundStatus; requestedAt: number; updatedAt: number; }
export interface Commission { id: string; agentName: string; applicationId?: string; universityName?: string; amount: number; currency: string; status: CommissionStatus; createdAt: number; updatedAt: number; }
