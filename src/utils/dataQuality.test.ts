import { describe, it, expect } from "vitest";
import { detectDuplicateLeads, LeadRecord } from "./dataQuality";

describe("Data Quality & Deduplication Engine", () => {
  it("should detect duplicate leads matching exact email addresses", () => {
    const leads: LeadRecord[] = [
      { id: "1", name: "Alice Walker", email: "alice@example.com", phone: "+447700900111", status: "New", createdAt: 1000 },
      { id: "2", name: "Alice W.", email: "ALICE@EXAMPLE.COM ", phone: "+447700900222", status: "Contacted", createdAt: 2000 },
      { id: "3", name: "Bob Smith", email: "bob@example.com", phone: "+15550199", status: "New", createdAt: 3000 },
    ];

    const clusters = detectDuplicateLeads(leads);
    expect(clusters.length).toBe(1);
    expect(clusters[0].masterLead.id).toBe("1");
    expect(clusters[0].duplicateLeads.length).toBe(1);
    expect(clusters[0].duplicateLeads[0].id).toBe("2");
    expect(clusters[0].matchReason).toContain("Matching Email");
  });

  it("should detect duplicate leads matching phone numbers", () => {
    const leads: LeadRecord[] = [
      { id: "1", name: "Charlie Brown", email: "charlie1@test.com", phone: "+1 (555) 012-3456", status: "New", createdAt: 1000 },
      { id: "2", name: "C. Brown", email: "charlie2@test.com", phone: "15550123456", status: "New", createdAt: 2000 },
    ];

    const clusters = detectDuplicateLeads(leads);
    expect(clusters.length).toBe(1);
    expect(clusters[0].duplicateLeads[0].id).toBe("2");
  });

  it("should return zero clusters when all records are unique", () => {
    const leads: LeadRecord[] = [
      { id: "1", name: "Unique A", email: "a@test.com", phone: "11111111", status: "New", createdAt: 1000 },
      { id: "2", name: "Unique B", email: "b@test.com", phone: "22222222", status: "New", createdAt: 2000 },
    ];

    const clusters = detectDuplicateLeads(leads);
    expect(clusters.length).toBe(0);
  });
});
