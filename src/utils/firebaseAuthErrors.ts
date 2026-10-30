type FirebaseAuthError = {
  code?: unknown;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "The email or password is incorrect. Please check your details and try again.",
  "auth/invalid-login-credentials": "The email or password is incorrect. Please check your details and try again.",
  "auth/user-not-found": "The email or password is incorrect. Please check your details and try again.",
  "auth/wrong-password": "The email or password is incorrect. Please check your details and try again.",
  "auth/email-already-in-use": "An account with this email already exists. Please sign in instead.",
  "auth/invalid-email": "Enter a valid email address and try again.",
  "auth/weak-password": "Choose a stronger password and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/operation-not-allowed": "This sign-in method is not enabled. Please contact support.",
  "auth/requires-recent-login": "Please sign in again before repeating that action.",
};

export const mapFirebaseAuthError = (
  error: FirebaseAuthError | unknown,
  operation: "sign-in" | "registration" | "verification" | "password-reset" = "sign-in"
): string => {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as FirebaseAuthError).code)
    : "";

  if (AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  if (operation === "registration") return "We couldn't create your account. Please check your details and try again.";
  if (operation === "verification") return "We couldn't send the verification email. Please try again later.";
  if (operation === "password-reset") return "We couldn't send the password-reset email. Please try again later.";
  return "We couldn't sign you in. Please check your details and try again.";
};

export const getFirebaseAuthErrorMessage = mapFirebaseAuthError;
