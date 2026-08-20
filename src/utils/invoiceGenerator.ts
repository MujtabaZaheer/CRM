/**
 * EduCRM PDF & Printable Invoice / Receipt Generator
 * Builds print-ready formatted invoices, receipts, and payment schedules.
 */

import { Invoice, Payment } from "../types/finance";

export function generateInvoiceHtml(invoice: Invoice, organizationName = "EduCRM Global Admissions"): string {
  const lineItemsHtml = (invoice.items && invoice.items.length > 0)
    ? invoice.items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 10px 12px; font-size: 12px; color: #18181b;">${idx + 1}. ${item.description}</td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: center; color: #71717a;">${item.quantity}</td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: right; color: #71717a;">${invoice.currency} ${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: right; font-weight: bold; color: #18181b;">${invoice.currency} ${item.amount.toLocaleString()}</td>
      </tr>
    `).join("")
    : `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 10px 12px; font-size: 12px; color: #18181b;">${invoice.type} Fee</td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: center; color: #71717a;">1</td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: right; color: #71717a;">${invoice.currency} ${invoice.amount.toLocaleString()}</td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: right; font-weight: bold; color: #18181b;">${invoice.currency} ${invoice.amount.toLocaleString()}</td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #18181b; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #059669; }
          .badge { padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .status-paid { background: #dcfce7; color: #15803d; }
          .status-pending { background: #fef3c7; color: #b45309; }
          .status-overdue { background: #ffe4e6; color: #be123c; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          th { background: #f4f4f5; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #71717a; text-align: left; }
          .totals { width: 300px; margin-left: auto; margin-top: 20px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
          .totals-total { border-top: 2px solid #18181b; font-weight: bold; font-size: 15px; margin-top: 6px; padding-top: 8px; color: #059669; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">${organizationName}</div>
            <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Student Placement & Advisory Services</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: bold;">INVOICE</div>
            <div style="font-size: 13px; font-family: monospace; color: #059669; font-weight: bold;">#${invoice.invoiceNumber}</div>
            <div style="margin-top: 6px;">
              <span class="badge status-${invoice.status.toLowerCase().replace(' ', '-')}">${invoice.status}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: bold;">Billed To:</div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 2px;">${invoice.studentName}</div>
            ${invoice.studentEmail ? `<div style="font-size: 12px; color: #71717a;">${invoice.studentEmail}</div>` : ""}
            ${invoice.applicationId ? `<div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">Application ID: ${invoice.applicationId}</div>` : ""}
          </div>
          <div style="text-align: right; font-size: 12px;">
            <div><strong>Issue Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</div>
            <div style="margin-top: 4px;"><strong>Due Date:</strong> ${invoice.dueDate}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${invoice.currency} ${(invoice.subtotal || invoice.amount).toLocaleString()}</span>
          </div>
          ${invoice.taxAmount ? `
            <div class="totals-row">
              <span>Tax (${invoice.taxRate || 0}%):</span>
              <span>${invoice.currency} ${invoice.taxAmount.toLocaleString()}</span>
            </div>
          ` : ""}
          ${invoice.discountAmount ? `
            <div class="totals-row" style="color: #059669;">
              <span>Discount:</span>
              <span>-${invoice.currency} ${invoice.discountAmount.toLocaleString()}</span>
            </div>
          ` : ""}
          <div class="totals-row totals-total">
            <span>Total Payable:</span>
            <span>${invoice.currency} ${invoice.amount.toLocaleString()}</span>
          </div>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 30px; padding: 12px; background: #f4f4f5; border-radius: 8px; font-size: 11px; color: #52525b;">
            <strong>Payment Notes & Instructions:</strong><br/>
            ${invoice.notes}
          </div>
        ` : ""}

        <div class="footer">
          Thank you for choosing ${organizationName}. For billing inquiries, contact finance@educrm.com
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates an official payment receipt HTML.
 */
export function generateReceiptHtml(payment: Payment, organizationName = "EduCRM Global Admissions"): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Receipt #${payment.reference}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #18181b; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 800; color: #059669; }
          .box { border: 1px solid #e4e4e7; border-radius: 12px; padding: 25px; max-width: 500px; margin: 0 auto; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f4f4f5; font-size: 13px; }
          .amount-box { text-align: center; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .amount-val { font-size: 28px; font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${organizationName}</div>
          <div style="font-size: 13px; color: #71717a; margin-top: 4px;">Official Payment Confirmation Receipt</div>
        </div>

        <div class="box">
          <div class="amount-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: bold;">Amount Received</div>
            <div class="amount-val">${payment.currency} ${payment.amount.toLocaleString()}</div>
            <div style="font-size: 11px; color: #059669;">✓ Payment Successful</div>
          </div>

          <div class="row">
            <span style="color: #71717a;">Student Name:</span>
            <strong>${payment.studentName}</strong>
          </div>
          <div class="row">
            <span style="color: #71717a;">Invoice Number:</span>
            <strong style="font-family: monospace;">#${payment.invoiceNumber}</strong>
          </div>
          <div class="row">
            <span style="color: #71717a;">Transaction Ref:</span>
            <strong style="font-family: monospace;">${payment.reference}</strong>
          </div>
          <div class="row">
            <span style="color: #71717a;">Payment Method:</span>
            <span>${payment.method}</span>
          </div>
          <div class="row">
            <span style="color: #71717a;">Payment Date:</span>
            <span>${payment.paidAt}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #a1a1aa;">
          This is an electronically generated receipt. No physical signature required.
        </div>
      </body>
    </html>
  `;
}

/**
 * Opens a print window for an invoice or receipt.
 */
export function printDocumentHtml(htmlContent: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
