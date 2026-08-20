/**
 * EduCRM Partner Commission & Revenue Share Engine
 * Calculates tiered commission payouts for agents, partner institutions,
 * and counsellors based on enrolled tuition amounts and partner contract agreements.
 */

import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Commission, CommissionRule } from "../types/finance";
import { Application } from "../types/application";
import { logAuditEvent } from "./auditLogger";

export const DEFAULT_COMMISSION_TIERS = {
  Bronze: 10, // 10%
  Silver: 12.5, // 12.5%
  Gold: 15, // 15%
  Platinum: 18, // 18%
};

/**
 * Calculates commission amount based on rule or tier.
 */
export function calculateCommissionAmount(
  tuitionFeeUSD: number,
  tier: keyof typeof DEFAULT_COMMISSION_TIERS = "Silver",
  customRule?: CommissionRule
): { amount: number; rateApplied: number } {
  if (customRule) {
    if (customRule.commissionType === "Fixed Amount") {
      return { amount: customRule.rate, rateApplied: customRule.rate };
    }
    const calculated = (tuitionFeeUSD * customRule.rate) / 100;
    return { amount: Math.round(calculated), rateApplied: customRule.rate };
  }

  const rate = DEFAULT_COMMISSION_TIERS[tier] || 12.5;
  const calculated = (tuitionFeeUSD * rate) / 100;
  return { amount: Math.round(calculated), rateApplied: rate };
}

/**
 * Auto-generates an eligible commission entry when an application reaches 'Enrolled' or 'CAS Issued'.
 */
export async function triggerApplicationCommission(
  application: Application,
  tuitionFeeUSD = 22000,
  agentName = "Direct / Agency Partner",
  counsellorName?: string
): Promise<string | null> {
  try {
    const { amount, rateApplied } = calculateCommissionAmount(tuitionFeeUSD, "Gold");

    const commissionPayload: Omit<Commission, "id"> = {
      agentName,
      counsellorName: counsellorName || application.assignedCounsellor || "Staff",
      studentId: application.studentId,
      studentName: application.studentName,
      applicationId: application.id,
      universityName: application.universityName,
      tuitionFeeAmount: tuitionFeeUSD,
      rateApplied,
      amount,
      currency: "USD",
      status: "Eligible",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, "commissions"), commissionPayload);
    await logAuditEvent(
      "COMMISSION_ACCRUED",
      "Commission Engine",
      "Finance",
      `Accrued $${amount} commission (${rateApplied}%) for ${application.studentName} at ${application.universityName}`,
      docRef.id,
      "system"
    );

    return docRef.id;
  } catch (err) {
    console.warn("Failed to generate auto-commission:", err);
    return null;
  }
}

/**
 * Approves and aggregates eligible commissions into a payout batch.
 */
export async function processPayoutBatch(
  commissionIds: string[],
  batchNotes = "Automated Monthly Payout"
): Promise<{ batchId: string; totalPaid: number; count: number }> {
  const batchId = `PAYOUT_${Date.now()}`;
  let totalPaid = 0;
  let count = 0;

  for (const id of commissionIds) {
    try {
      const snap = await getDoc(doc(db, "commissions", id));
      if (snap.exists()) {
        const comm = snap.data() as Commission;
        totalPaid += comm.amount;
        count++;

        await updateDoc(doc(db, "commissions", id), {
          status: "Paid",
          payoutBatchId: batchId,
          paidAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn(`Failed to process payout for commission ${id}:`, err);
    }
  }

  // Record payout batch record in Firestore
  try {
    await addDoc(collection(db, "payout_batches"), {
      batchId,
      totalAmount: totalPaid,
      currency: "USD",
      commissionCount: count,
      notes: batchNotes,
      createdAt: Date.now(),
    });
  } catch (_) {}

  return { batchId, totalPaid, count };
}
