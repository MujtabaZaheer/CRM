import { describe, expect, it } from "vitest";
import { mapFirebaseAuthError } from "./firebaseAuthErrors";

describe("mapFirebaseAuthError", () => {
  it("maps invalid credentials without exposing Firebase text", () => {
    const message = mapFirebaseAuthError({
      code: "auth/invalid-credential",
      message: "Firebase: Error (auth/invalid-credential).",
    });

    expect(message).toBe("The email or password is incorrect. Please check your details and try again.");
    expect(message).not.toContain("auth/invalid-credential");
    expect(message).not.toContain("Firebase");
  });

  it("maps known registration and network errors", () => {
    expect(mapFirebaseAuthError({ code: "auth/email-already-in-use" }, "registration")).toMatch(/already exists/);
    expect(mapFirebaseAuthError({ code: "auth/network-request-failed" }, "registration")).toMatch(/Network error/);
  });

  it("uses a safe fallback for unknown errors", () => {
    expect(mapFirebaseAuthError({ code: "auth/unknown", message: "private details" })).toBe(
      "We couldn't sign you in. Please check your details and try again."
    );
  });
});
