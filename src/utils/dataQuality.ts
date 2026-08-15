/**
 * EduCRM Data Quality & Lead Deduplication Utility
 * Scans lead/student datasets to detect duplicate records by email, phone, or passport.
 */

import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passportNumber?: string;
  status: string;
  countryInterest?: string;
  createdAt: number;
}

export interface DuplicateCluster {
  masterLead: LeadRecord;
  duplicateLeads: LeadRecord[];
  matchReason: string;
}

export function detectDuplicateLeads(leads: LeadRecord[]): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < leads.length; i++) {
    const current = leads[i];
    if (visited.has(current.id)) continue;

    const duplicates: LeadRecord[] = [];
    let reason = "";

    const cleanEmail = (current.email || "").trim().toLowerCase();
    const cleanPhone = (current.phone || "").replace(/\D/g, "");
    const cleanPassport = (current.passportNumber || "").trim().toLowerCase();

    for (let j = i + 1; j < leads.length; j++) {
      const other = leads[j];
      if (visited.has(other.id)) continue;

      const otherEmail = (other.email || "").trim().toLowerCase();
      const otherPhone = (other.phone || "").replace(/\D/g, "");
      const otherPassport = (other.passportNumber || "").trim().toLowerCase();

      let isMatch = false;

      if (cleanEmail && cleanEmail === otherEmail) {
        isMatch = true;
        reason = `Matching Email (${cleanEmail})`;
      } else if (cleanPhone && cleanPhone.length > 6 && cleanPhone === otherPhone) {
        isMatch = true;
        reason = `Matching Phone (${other.phone})`;
      } else if (cleanPassport && cleanPassport === otherPassport) {
        isMatch = true;
        reason = `Matching Passport (${cleanPassport})`;
      }

      if (isMatch) {
        duplicates.push(other);
        visited.add(other.id);
      }
    }

    if (duplicates.length > 0) {
      visited.add(current.id);
      clusters.push({
        masterLead: current,
        duplicateLeads: duplicates,
        matchReason: reason,
      });
    }
  }

  return clusters;
}

export async function mergeDuplicateLeads(masterLeadId: string, duplicateLeadId: string, mergedData: Partial<LeadRecord>) {
  // Update master lead document in Firestore
  const masterRef = doc(db, "leads", masterLeadId);
  await updateDoc(masterRef, {
    ...mergedData,
    mergedAt: Date.now(),
  });

  // Soft delete or remove duplicate lead
  const dupRef = doc(db, "leads", duplicateLeadId);
  await deleteDoc(dupRef);
}
