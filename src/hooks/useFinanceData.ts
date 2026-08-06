import { useCallback, useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { logAuditEvent } from "../utils/auditLogger";
import { useAuth } from "../contexts/AuthContext";
import { Commission, CommissionStatus, Invoice, InvoiceStatus, Payment, Refund, RefundStatus } from "../types/finance";

const readCollection = <T extends { id: string }>(name: string, setValue: (data: T[]) => void, onError: () => void) =>
  onSnapshot(query(collection(db, name), orderBy("createdAt", "desc")), (snapshot) => setValue(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)), onError);

export const useFinanceData = () => {
  const { appUser } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let loaded = 0;
    const finish = () => { loaded += 1; if (loaded === 4) setLoading(false); };
    const fail = () => { setError("Financial data could not be loaded. Check your connection and access permissions."); finish(); };
    const subscriptions = [
      readCollection<Invoice>("invoices", (value) => { setInvoices(value); finish(); }, fail),
      readCollection<Payment>("payments", (value) => { setPayments(value); finish(); }, fail),
      readCollection<Refund>("refunds", (value) => { setRefunds(value); finish(); }, fail),
      readCollection<Commission>("commissions", (value) => { setCommissions(value); finish(); }, fail),
    ];
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, []);

  const record = useCallback(async (collectionName: string, data: Record<string, unknown>, action: string, details: string) => {
    const created = await addDoc(collection(db, collectionName), { ...data, createdAt: Date.now(), updatedAt: Date.now() });
    await logAuditEvent(action, appUser?.email || "Unknown", "Finance", details, created.id, appUser?.role);
  }, [appUser]);

  const createInvoice = useCallback((data: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => record("invoices", data, "INVOICE_CREATED", `Created invoice ${data.invoiceNumber}`), [record]);
  const updateInvoice = useCallback(async (invoice: Invoice, status: InvoiceStatus) => { await updateDoc(doc(db, "invoices", invoice.id), { status, updatedAt: Date.now() }); await logAuditEvent("INVOICE_UPDATED", appUser?.email || "Unknown", "Invoice", `Invoice ${invoice.invoiceNumber} marked ${status}`, invoice.id, appUser?.role); }, [appUser]);
  const recordPayment = useCallback(async (data: Omit<Payment, "id" | "createdAt">) => {
    await record("payments", data, "PAYMENT_RECORDED", `Recorded ${data.currency} ${data.amount} for ${data.invoiceNumber}`);
    const paid = payments.filter((payment) => payment.invoiceId === data.invoiceId).reduce((sum, payment) => sum + payment.amount, 0) + data.amount;
    const invoice = invoices.find((item) => item.id === data.invoiceId);
    if (invoice) await updateDoc(doc(db, "invoices", invoice.id), { status: paid >= invoice.amount ? "Paid" : "Partially Paid", updatedAt: Date.now() });
  }, [invoices, payments, record]);
  const createRefund = useCallback((data: Omit<Refund, "id" | "status" | "requestedAt" | "updatedAt">) => record("refunds", { ...data, status: "Requested", requestedAt: Date.now() }, "REFUND_REQUESTED", `Requested ${data.currency} ${data.amount} refund for ${data.studentName}`), [record]);
  const createCommission = useCallback((data: Omit<Commission, "id" | "createdAt" | "updatedAt" | "status">) => record("commissions", { ...data, status: "Pending" }, "COMMISSION_CREATED", `Created commission for ${data.agentName}`), [record]);
  const updateRefund = useCallback(async (refund: Refund, status: RefundStatus) => { await updateDoc(doc(db, "refunds", refund.id), { status, updatedAt: Date.now() }); await logAuditEvent("REFUND_UPDATED", appUser?.email || "Unknown", "Refund", `Refund for ${refund.studentName} marked ${status}`, refund.id, appUser?.role); }, [appUser]);
  const updateCommission = useCallback(async (commission: Commission, status: CommissionStatus) => { await updateDoc(doc(db, "commissions", commission.id), { status, updatedAt: Date.now() }); await logAuditEvent("COMMISSION_UPDATED", appUser?.email || "Unknown", "Commission", `Commission for ${commission.agentName} marked ${status}`, commission.id, appUser?.role); }, [appUser]);
  const summary = useMemo(() => {
    const paidRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = invoices.filter((invoice) => !["Paid", "Cancelled"].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.amount - payments.filter((payment) => payment.invoiceId === invoice.id).reduce((paid, payment) => paid + payment.amount, 0), 0);
    return { paidRevenue, outstanding, pendingInvoices: invoices.filter((invoice) => ["Pending", "Partially Paid", "Overdue"].includes(invoice.status)).length, paidInvoices: invoices.filter((invoice) => invoice.status === "Paid").length, refunds: refunds.filter((refund) => refund.status !== "Rejected").reduce((sum, refund) => sum + refund.amount, 0), commissions: commissions.filter((commission) => commission.status !== "Paid" && commission.status !== "Reversed").reduce((sum, commission) => sum + commission.amount, 0) };
  }, [commissions, invoices, payments, refunds]);
  return { invoices, payments, refunds, commissions, loading, error, summary, createInvoice, updateInvoice, recordPayment, createRefund, createCommission, updateRefund, updateCommission };
};
