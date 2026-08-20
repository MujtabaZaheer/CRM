/**
 * EduCRM Multi-Branch Data Scoping & Hierarchy Engine
 * Enforces branch-level data isolation and role permissions across leads,
 * applications, tasks, documents, and finances.
 */

import { AppUser } from "../types/role";

export interface OfficeBranch {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  isHeadquarters: boolean;
}

export const AVAILABLE_BRANCHES: OfficeBranch[] = [
  { id: "branch-london", name: "London HQ", code: "LDN", city: "London", country: "United Kingdom", isHeadquarters: true },
  { id: "branch-manchester", name: "Manchester Regional", code: "MAN", city: "Manchester", country: "United Kingdom", isHeadquarters: false },
  { id: "branch-lahore", name: "Lahore Branch", code: "LHE", city: "Lahore", country: "Pakistan", isHeadquarters: false },
  { id: "branch-dubai", name: "Dubai International", code: "DXB", city: "Dubai", country: "UAE", isHeadquarters: false },
  { id: "branch-dhaka", name: "Dhaka Branch", code: "DAC", city: "Dhaka", country: "Bangladesh", isHeadquarters: false },
];

/**
 * Determines whether a user has permission to view or mutate a record based on branch scoping.
 */
export function canAccessBranchData(
  user: AppUser | null,
  recordBranchId?: string,
  currentActiveBranchId?: string
): boolean {
  if (!user) return false;

  // Platform Super Admin & Org Admin can access all branch data
  if (user.role === "platform_super_admin" || user.role === "org_admin" || user.role === "auditor") {
    return true;
  }

  // If a specific active branch filter is set
  if (currentActiveBranchId && currentActiveBranchId !== "ALL" && recordBranchId) {
    return recordBranchId === currentActiveBranchId;
  }

  // User bound to their assigned branch
  if (user.branchId) {
    if (!recordBranchId) return true; // Legacy or shared record
    return user.branchId === recordBranchId;
  }

  return true;
}

/**
 * Filter an array of items by the user's branch permissions.
 */
export function filterByBranch<T extends { branchId?: string }>(
  items: T[],
  user: AppUser | null,
  activeBranchId?: string
): T[] {
  if (!user) return [];
  if (user.role === "platform_super_admin" || user.role === "org_admin") {
    if (!activeBranchId || activeBranchId === "ALL") return items;
    return items.filter((item) => !item.branchId || item.branchId === activeBranchId);
  }

  const branch = user.branchId;
  if (!branch) return items;
  return items.filter((item) => !item.branchId || item.branchId === branch);
}
