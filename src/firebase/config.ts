import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB9s5vfoVYc8feVi6we1Dy4l95_phOA2lU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "education-crm-9fee2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "education-crm-9fee2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "education-crm-9fee2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "324490740107",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:324490740107:web:bad87398d3b03e8c0a6f8e",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const isDemoMode = import.meta.env.VITE_DEMO_MODE !== "false";
// Live Firebase accounts must verify email by default. Local demo-role sessions
// have no Firebase user and therefore remain available for development previews.
export const requiresVerifiedEmail = import.meta.env.VITE_REQUIRE_VERIFIED_EMAIL !== "false";

/**
 * Creates Firebase Auth ActionCodeSettings to ensure verification links
 * return the student directly to EduCRM /verify-email.
 */
export const getEmailActionSettings = () => {
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://education-crm-9fee2.web.app";
  return {
    url: `${origin}/verify-email`,
    handleCodeInApp: true,
  };
};

