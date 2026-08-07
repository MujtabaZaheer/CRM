---
tags:
  - module/finance
  - status/completed
---

# Finance Officer Module

Manages financial operations, service fee invoicing, student payment receipts, refund approvals, agent commissions, and accounting exports.

## 🔗 Connections & Dependencies
- **Role**: [[Finance Officer Role]]
- **Data Hook**: `useFinanceData.ts`
- **Route Guard**: `FinanceRoute.tsx`
- **Main Workspace**: `FinanceWorkspace.tsx`

## 📑 Core Entities Handled
- [[Invoice Entity]] (Application Fee, Tuition, Deposit, Visa Fee)
- [[Payment Entity]] (Receipts, Multi-currency, Payment Methods)
- [[Refund Entity]] (Refund Requests & Approvals)
- [[Commission Entity]] (Agent Commission Statements)
- [[Audit Log Entity]] (`INVOICE_CREATED`, `PAYMENT_RECORDED`)

## 🛠️ Subpages
1. **Finance Dashboard**: Revenue metrics, pending invoices, refund exposures.
2. **Invoices**: Invoice creation and status tracking.
3. **Payments & Receipts**: Multi-currency payment receipts.
4. **Refunds**: Student refund request review.
5. **Commissions**: Agent commission statements (`Eligible`, `Approved`, `Paid`, `Disputed`).
6. **Financial Reports**: Accounting exports and CSV downloads.
