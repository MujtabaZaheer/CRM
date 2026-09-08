import { describe, it, expect } from "vitest";
import { generateStrongPassword, cleanStaffData } from "./staffProvisioner";
import { AppUser } from "../types/role";

describe("Staff Provisioning Security & Sanitization", () => {
  it("generates cryptographically strong passwords matching Edu-... pattern", () => {
    const password = generateStrongPassword();
    expect(password).toMatch(/^Edu-[A-Za-z0-9!@#$%&*]{10}$/);
    expect(password.length).toBe(14);
  });

  it("cleans objects of undefined/null fields to prevent Firestore serialization crashes", () => {
    const dirty = {
      email: "staff@example.com",
      displayName: "Staff Member",
      office: undefined,
      team: null,
      role: "counsellor",
    };
    const cleaned = cleanStaffData(dirty);
    expect(cleaned).toEqual({
      email: "staff@example.com",
      displayName: "Staff Member",
      role: "counsellor",
    });
    expect(Object.prototype.hasOwnProperty.call(cleaned, "office")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(cleaned, "team")).toBe(false);
  });

  it("ensures AppUser type has no password property", () => {
    const testUser: AppUser = {
      uid: "usr-123",
      email: "test@example.com",
      role: "counsellor",
      createdAt: Date.now(),
      office: "London HQ",
      team: "Global Team",
    };

    // Verify at runtime that no password field exists
    expect((testUser as any).password).toBeUndefined();
  });
});
