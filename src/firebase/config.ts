import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoApiKeyForEduCRMDevMode12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "education-crm-9fee2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "education-crm-9fee2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "education-crm-9fee2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo1234567890",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const isDemoMode = import.meta.env.VITE_DEMO_MODE !== "false";
export const requiresVerifiedEmail = !isDemoMode && import.meta.env.VITE_REQUIRE_VERIFIED_EMAIL === "true";

