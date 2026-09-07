import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Student } from "../../types/student";
import { DEMO_STUDENTS } from "../../data/demoData";

export const StudentOnboardingGuard: React.FC = () => {
  const { appUser, firebaseUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const [studentDoc, setStudentDoc] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      const uid = firebaseUser?.uid || appUser?.uid;
      if (!uid) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "students", uid));
        if (snap.exists() && isMounted) {
          setStudentDoc(snap.data() as Student);
        } else if (isMounted) {
          // Fallback for registered demo students or completed offline profiles
          if (
            appUser?.onboardingStatus === "completed" ||
            appUser?.profileCompleted === true ||
            uid === "stu_1" ||
            appUser?.email === "aarav.patel@gmail.com"
          ) {
            const demo = DEMO_STUDENTS.find((s) => s.id === uid || s.email === appUser?.email) || DEMO_STUDENTS[0];
            setStudentDoc({
              ...demo,
              id: uid,
              onboardingStatus: "completed",
              profileCompleted: true,
              currentStep: 4,
            });
          }
        }
      } catch (err) {
        console.warn("Guard could not fetch student doc:", err);
        if (isMounted) {
          if (
            appUser?.onboardingStatus === "completed" ||
            appUser?.profileCompleted === true ||
            uid === "stu_1" ||
            appUser?.email === "aarav.patel@gmail.com"
          ) {
            const demo = DEMO_STUDENTS.find((s) => s.id === uid || s.email === appUser?.email) || DEMO_STUDENTS[0];
            setStudentDoc({
              ...demo,
              id: uid,
              onboardingStatus: "completed",
              profileCompleted: true,
              currentStep: 4,
            });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }

    return () => { isMounted = false; };
  }, [appUser, firebaseUser, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Fallback to step 1 if no student doc
  if (!studentDoc) {
    if (location.pathname !== "/student/onboarding/step-1") {
      return <Navigate to="/student/onboarding/step-1" replace />;
    }
    return <Outlet />;
  }

  const isCompleted = studentDoc.onboardingStatus === "completed" || studentDoc.profileCompleted === true;
  const currentStep = studentDoc.currentStep || 1;

  // 1. Returning User: Bypass all onboarding screens, direct to dashboard
  if (isCompleted) {
    if (location.pathname.includes("/onboarding/")) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Outlet />; // Allowed to access everything else
  }

  // 2. First-Time User: Restrict access to their current (or previous) steps
  if (!isCompleted) {
    const isApplicationRoute =
      location.pathname.startsWith("/student/new-application") ||
      location.pathname.startsWith("/student/apply") ||
      location.pathname.startsWith("/apply");

    // If they try to go to dashboard or other portal pages while onboarding, push them back to their step
    if (!location.pathname.includes("/onboarding/") && !isApplicationRoute) {
      return <Navigate to={`/student/onboarding/step-${currentStep}`} replace />;
    }

    // Determine the step they are trying to access
    const match = location.pathname.match(/step-(\d+)/);
    if (match) {
      const attemptedStep = parseInt(match[1], 10);
      if (attemptedStep > currentStep) {
        // Trying to access a future step they haven't unlocked yet
        return <Navigate to={`/student/onboarding/step-${currentStep}`} replace />;
      }
    }
  }

  return <Outlet />;
};
