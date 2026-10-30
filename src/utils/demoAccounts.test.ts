import { describe, expect, it } from "vitest";
import { getDemoRole, isKnownDemoEmail } from "./demoAccounts";

describe("explicit demo accounts", () => {
  it("accepts only registered demo identities", () => {
    expect(getDemoRole("counsellor@educrm.demo")).toBe("counsellor");
    expect(isKnownDemoEmail("student.registered@educrm.demo")).toBe(true);
    expect(isKnownDemoEmail("unknown@educrm.demo")).toBe(false);
    expect(isKnownDemoEmail("student@example.com")).toBe(false);
  });
});
