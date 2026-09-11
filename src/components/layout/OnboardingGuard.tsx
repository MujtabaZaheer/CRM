import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Generic onboarding guard for all non-admin roles.
 * Redirects to the appropriate role-specific onboarding page
 * if onboarding is not completed. Super Admin and Org Admin skip onboarding.
 */
export const OnboardingGuard: React.FC = () => {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!appUser) {
    return <Navigate to="/login" replace />;
  }

  // Only students undergo profile onboarding. All non-student roles skip onboarding entirely.
  if (appUser.role !== "student") {
    return <Outlet />;
  }

  const isCompleted = appUser.onboardingStatus === "completed" || appUser.profileCompleted === true;
  if (isCompleted) {
    return <Outlet />;
  }

  // Redirect student to onboarding
  return <Navigate to="/student/onboarding/step-1" replace />;
};
