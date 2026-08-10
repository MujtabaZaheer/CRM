import { AppUser } from "../types/role";
import { Lead } from "../types/lead";
import { Student } from "../types/student";
import { Application } from "../types/application";
import { StudentDocument } from "../pages/Documents";
import { Invoice, Payment, Refund, Commission } from "../types/finance";
import { SupportTicket, SupportArticle } from "../types/support";
import { TenantOrganization } from "../types/superadmin";
import { VisaCase } from "../types/portal";

export const DEMO_USERS: AppUser[] = [
  { uid: "usr_1", email: "admin@educrm.com", displayName: "Alex Mercer", role: "platform_super_admin", office: "Global HQ", createdAt: Date.now() - 1000000 },
  { uid: "usr_2", email: "orgadmin@educrm.com", displayName: "Sarah Jenkins", role: "org_admin", office: "London HQ", createdAt: Date.now() - 900000 },
  { uid: "usr_3", email: "counsellor@educrm.demo", displayName: "David Kim", role: "counsellor", office: "Manchester Branch", createdAt: Date.now() - 800000 },
  { uid: "usr_4", email: "admissions@educrm.demo", displayName: "Emma Watson", role: "admissions_officer", office: "London HQ", createdAt: Date.now() - 700000 },
  { uid: "usr_5", email: "finance@educrm.demo", displayName: "Michael Chen", role: "finance_officer", office: "London HQ", createdAt: Date.now() - 600000 },
  { uid: "usr_6", email: "visa@educrm.demo", displayName: "Priya Sharma", role: "visa_officer", office: "Delhi Hub", createdAt: Date.now() - 500000 },
  { uid: "usr_7", email: "support@educrm.demo", displayName: "James Wilson", role: "support_user", office: "Global Support Desk", createdAt: Date.now() - 400000 },
  { uid: "usr_8", email: "auditor@educrm.demo", displayName: "Rachel Adams", role: "auditor", office: "Compliance HQ", createdAt: Date.now() - 300000 },
];

export const DEMO_LEADS: Lead[] = [
  { id: "lead_1", fullName: "Aarav Patel", email: "aarav.patel@gmail.com", phone: "+91 98765 43210", countryOfResidence: "India", destinationCountry: "UK", programInterest: "MSc Computer Science", stage: "Qualified", source: "Website", assignedTo: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 86400000 * 2 },
  { id: "lead_2", fullName: "Li Wei", email: "li.wei@qq.com", phone: "+86 138 0013 8000", countryOfResidence: "China", destinationCountry: "Australia", programInterest: "Bachelor of Business", stage: "Counselling", source: "Agent", assignedTo: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 5 },
  { id: "lead_3", fullName: "Fatima Al-Mansoor", email: "fatima.m@gmail.com", phone: "+971 50 123 4567", countryOfResidence: "UAE", destinationCountry: "Canada", programInterest: "MBA International", stage: "Application Initiated", source: "Referral", assignedTo: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 7 },
  { id: "lead_4", fullName: "Gabriel Silva", email: "gabriel.silva@uol.com.br", phone: "+55 11 98765 4321", countryOfResidence: "Brazil", destinationCountry: "USA", programInterest: "MSc Data Analytics", stage: "New", source: "Social Media", assignedTo: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 1, updatedAt: Date.now() - 86400000 * 1 },
  { id: "lead_5", fullName: "Zainab Khan", email: "zainab.k@yahoo.com", phone: "+92 300 1234567", countryOfResidence: "Pakistan", destinationCountry: "UK", programInterest: "LLM International Law", stage: "Qualified", source: "Website", assignedTo: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 4, updatedAt: Date.now() - 86400000 * 4 },
];

export const DEMO_STUDENTS: Student[] = [
  { id: "stu_1", fullName: "Aarav Patel", email: "aarav.patel@gmail.com", phone: "+91 98765 43210", countryOfResidence: "India", dob: "2001-05-14", nationality: "Indian", passportNumber: "Z1234567", academicHistory: [{ institution: "Mumbai University", qualification: "Bachelor's Degree", degreeTitle: "BSc IT", country: "India", completionYear: 2023, gradeGpa: "3.8/4.0" }], englishProficiency: { testType: "IELTS", overallScore: "7.5" }, profileCompleteness: 90, createdAt: Date.now() - 86400000 * 10, updatedAt: Date.now() - 86400000 * 10 },
  { id: "stu_2", fullName: "Li Wei", email: "li.wei@qq.com", phone: "+86 138 0013 8000", countryOfResidence: "China", dob: "2002-08-21", nationality: "Chinese", passportNumber: "E9876543", academicHistory: [{ institution: "Peking High School", qualification: "High School / A-Levels", degreeTitle: "Diploma", country: "China", completionYear: 2024, gradeGpa: "3.6/4.0" }], englishProficiency: { testType: "TOEFL", overallScore: "102" }, profileCompleteness: 85, createdAt: Date.now() - 86400000 * 15, updatedAt: Date.now() - 86400000 * 15 },
  { id: "stu_3", fullName: "Fatima Al-Mansoor", email: "fatima.m@gmail.com", phone: "+971 50 123 4567", countryOfResidence: "UAE", dob: "2000-11-03", nationality: "Emirati", passportNumber: "N5544332", academicHistory: [{ institution: "Zayed University", qualification: "Bachelor's Degree", degreeTitle: "BBA Finance", country: "UAE", completionYear: 2022, gradeGpa: "3.9/4.0" }], englishProficiency: { testType: "IELTS", overallScore: "8.0" }, profileCompleteness: 100, createdAt: Date.now() - 86400000 * 20, updatedAt: Date.now() - 86400000 * 20 },
];

export const DEMO_APPLICATIONS: Application[] = [
  { id: "app_1", applicationNumber: "APP-2026-0001", studentId: "stu_1", studentName: "Aarav Patel", universityName: "University of Manchester", universityId: "univ_mcr", programmeName: "MSc Advanced Computer Science", programmeId: "prog_cs", intake: "September 2026", stage: "Initial Review", assignedCounsellor: "counsellor@educrm.demo", history: [], createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3 },
  { id: "app_2", applicationNumber: "APP-2026-0002", studentId: "stu_2", studentName: "Li Wei", universityName: "University of Sydney", universityId: "univ_syd", programmeName: "Bachelor of Commerce", programmeId: "prog_bcom", intake: "July 2026", stage: "Conditional Offer", assignedCounsellor: "counsellor@educrm.demo", history: [], createdAt: Date.now() - 86400000 * 8, updatedAt: Date.now() - 86400000 * 8 },
  { id: "app_3", applicationNumber: "APP-2026-0003", studentId: "stu_3", studentName: "Fatima Al-Mansoor", universityName: "University of Toronto", universityId: "univ_uoft", programmeName: "Full-Time MBA", programmeId: "prog_mba", intake: "September 2026", stage: "Unconditional Offer", assignedCounsellor: "counsellor@educrm.demo", history: [], createdAt: Date.now() - 86400000 * 12, updatedAt: Date.now() - 86400000 * 12 },
  { id: "app_4", applicationNumber: "APP-2026-0004", studentId: "stu_1", studentName: "Aarav Patel", universityName: "Imperial College London", universityId: "univ_icl", programmeName: "MSc Computing (Software Engineering)", programmeId: "prog_se", intake: "September 2026", stage: "Submitted", assignedCounsellor: "counsellor@educrm.demo", history: [], createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 5 },
];

export const DEMO_INVOICES: Invoice[] = [
  { id: "inv_1", invoiceNumber: "INV-2026-001", studentName: "Aarav Patel", type: "Deposit", amount: 2500, currency: "GBP", status: "Paid", dueDate: "2026-09-01", createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 4 },
  { id: "inv_2", invoiceNumber: "INV-2026-002", studentName: "Li Wei", type: "Service Charge", amount: 1800, currency: "AUD", status: "Pending", dueDate: "2026-08-30", createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3 },
  { id: "inv_3", invoiceNumber: "INV-2026-003", studentName: "Fatima Al-Mansoor", type: "Deposit", amount: 3200, currency: "USD", status: "Paid", dueDate: "2026-08-15", createdAt: Date.now() - 86400000 * 10, updatedAt: Date.now() - 86400000 * 9 },
];

export const DEMO_PAYMENTS: Payment[] = [
  { id: "pay_1", invoiceId: "inv_1", invoiceNumber: "INV-2026-001", studentName: "Aarav Patel", amount: 2500, currency: "GBP", method: "Online Gateway", reference: "TXN_998877", paidAt: "2026-08-05", createdAt: Date.now() - 86400000 * 4 },
  { id: "pay_2", invoiceId: "inv_3", invoiceNumber: "INV-2026-003", studentName: "Fatima Al-Mansoor", amount: 3200, currency: "USD", method: "Bank Transfer", reference: "WIRE_112233", paidAt: "2026-08-01", createdAt: Date.now() - 86400000 * 9 },
];

export const DEMO_REFUNDS: Refund[] = [
  { id: "ref_1", invoiceId: "inv_2", studentName: "Carlos Mendez", amount: 500, currency: "USD", reason: "Application Withdrawal prior to university submission", status: "Approved", requestedAt: Date.now() - 86400000 * 6, updatedAt: Date.now() - 86400000 * 2 },
];

export const DEMO_COMMISSIONS: Commission[] = [
  { id: "com_1", agentName: "Global Edu Referrals Ltd", universityName: "University of Manchester", amount: 1250, currency: "GBP", status: "Approved", createdAt: Date.now() - 86400000 * 12, updatedAt: Date.now() - 86400000 * 10 },
  { id: "com_2", agentName: "Orient Pathway Services", universityName: "University of Sydney", amount: 1100, currency: "AUD", status: "Eligible", createdAt: Date.now() - 86400000 * 6, updatedAt: Date.now() - 86400000 * 6 },
];

export const DEMO_TICKETS: SupportTicket[] = [
  { id: "tkt_1", ticketNumber: "TKT-2026-101", title: "Document Upload Error for Academic Transcripts", description: "Getting 403 error when uploading PDF transcripts", category: "Technical Issue", priority: "High", status: "Open", userEmail: "aarav.patel@gmail.com", userName: "Aarav Patel", assignedTo: "support@educrm.demo", comments: [], createdAt: Date.now() - 86400000 * 1, updatedAt: Date.now() - 86400000 * 1 },
  { id: "tkt_2", ticketNumber: "TKT-2026-102", title: "Programme Matcher GPA scale conversion question", description: "Need verification on Indian 10-point GPA scale conversion", category: "General Query", priority: "Medium", status: "In Progress", userEmail: "counsellor@educrm.demo", userName: "David Kim", assignedTo: "support@educrm.demo", comments: [], createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 3600000 },
];

export const DEMO_ARTICLES: SupportArticle[] = [
  { id: "art_1", title: "How to complete Student Profile & English Test verification", category: "General Query", content: "Step-by-step guide to uploading your IELTS/TOEFL score sheets...", authorEmail: "support@educrm.demo", tags: ["Guide", "Student"], views: 245, helpfulCount: 42, createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 86400000 * 30 },
  { id: "art_2", title: "Counsellor Entry Requirement Matcher Guide", category: "Technical Issue", content: "How to run the interactive Programme Matcher against UK and Canadian universities...", authorEmail: "support@educrm.demo", tags: ["Counsellor", "Matcher"], views: 189, helpfulCount: 35, createdAt: Date.now() - 86400000 * 20, updatedAt: Date.now() - 86400000 * 20 },
];

export const DEMO_TENANTS: TenantOrganization[] = [
  { id: "ten_1", name: "Apex Education Consultancy Ltd", domain: "apexedu.com", adminEmail: "admin@apexedu.com", tier: "Enterprise", status: "Active", userCount: 24, studentCount: 380, createdAt: Date.now() - 86400000 * 120, expiresAt: Date.now() + 86400000 * 245 },
  { id: "ten_2", name: "Global Study Pathways", domain: "studypathways.org", adminEmail: "director@studypathways.org", tier: "Professional", status: "Active", userCount: 12, studentCount: 150, createdAt: Date.now() - 86400000 * 90, expiresAt: Date.now() + 86400000 * 275 },
  { id: "ten_3", name: "NextGen Student Services", domain: "nextgenstudy.io", adminEmail: "info@nextgenstudy.io", tier: "Starter", status: "Trial", userCount: 4, studentCount: 35, createdAt: Date.now() - 86400000 * 14, expiresAt: Date.now() + 86400000 * 16 },
];

export const DEMO_VISA_CASES: VisaCase[] = [
  { id: "visa_1", studentId: "stu_1", studentName: "Aarav Patel", country: "UK", visaType: "Student Visa (Subclass 500 / Tier 4)", status: "Documents Pending", priority: "High", assignedOfficer: "visa@educrm.demo", appointmentAt: "2026-08-25", createdAt: Date.now() - 86400000 * 4, updatedAt: Date.now() - 86400000 * 4 },
  { id: "visa_2", studentId: "stu_3", studentName: "Fatima Al-Mansoor", country: "Canada", visaType: "Study Permit (SDS)", status: "Appointment Scheduled", priority: "Medium", assignedOfficer: "visa@educrm.demo", appointmentAt: "2026-08-18", createdAt: Date.now() - 86400000 * 10, updatedAt: Date.now() - 86400000 * 10 },
];

export const DEMO_DOCUMENTS: StudentDocument[] = [
  { id: "doc_1", studentId: "stu_1", studentName: "Aarav Patel", fileName: "Passport Bio Page.pdf", docType: "Passport", fileUrl: "#", status: "Verified", uploadedBy: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 8 },
  { id: "doc_2", studentId: "stu_1", studentName: "Aarav Patel", fileName: "IELTS Official Test Report.pdf", docType: "IELTS / English Test", fileUrl: "#", status: "Verified", uploadedBy: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 7 },
  { id: "doc_3", studentId: "stu_2", studentName: "Li Wei", fileName: "Bachelor Degree Transcript.pdf", docType: "Academic Transcript", fileUrl: "#", status: "Pending", uploadedBy: "counsellor@educrm.demo", createdAt: Date.now() - 86400000 * 4 },
];
