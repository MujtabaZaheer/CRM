import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useGlobalData } from "../../contexts/GlobalDataContext";
import { Loader2 } from "lucide-react";

export const StudentOnboardingGuard: React.FC = () => {
  const { appUser } = useAuth();
  const { students, applications, loading: globalLoading } = useGlobalData();

  if (!appUser || appUser.role !== "student") {
    return <Navigate to="/" replace />;
  }

  if (globalLoading && students.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const studentDoc = students.find((s) => s.id === appUser.uid || s.email?.toLowerCase() === appUser.email?.toLowerCase());

  if (!studentDoc) {
    return <Navigate to="/student/onboarding/profile" replace />;
  }

  const completeness = studentDoc.profileCompleteness || 0;
  const hasDestination = !!(studentDoc as any).preferredDestination || !!studentDoc.budgetAnnualUsd;
  const hasShortlist = (studentDoc as any).shortlistedPrograms && (studentDoc as any).shortlistedPrograms.length > 0;

  // Step 1: Master Profile
  if (completeness < 100) {
    return <Navigate to="/student/onboarding/profile" replace />;
  }

  // Step 2: Destination
  if (!hasDestination) {
    return <Navigate to="/student/onboarding/destination" replace />;
  }

  // Step 3: Program Matcher (Requires at least one shortlist or an active application)
  if (!hasShortlist) {
    const studentApps = applications.filter((a) => a.studentId === studentDoc.id);
    if (studentApps.length === 0) {
      return <Navigate to="/student/onboarding/program-matcher" replace />;
    }
  }

  // If they passed all checks, render the requested route
  return <Outlet />;
};
