import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { STAFF_ROLES } from "../../types/registrationConfig";

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

  // Admin roles skip onboarding entirely
  const skipOnboarding = appUser.role === "platform_super_admin" || appUser.role === "org_admin";
  if (skipOnboarding) {
    return <Outlet />;
  }

  const isCompleted = appUser.onboardingStatus === "completed" || appUser.profileCompleted === true;
  if (isCompleted) {
    return <Outlet />;
  }

  // Redirect to role-specific onboarding
  if (appUser.role === "student") {
    return <Navigate to="/student/onboarding/step-1" replace />;
  }

  if (appUser.role === "external_agent") {
    return <Navigate to="/onboarding/agent" replace />;
  }

  if (appUser.role === "university_partner") {
    return <Navigate to="/onboarding/university-partner" replace />;
  }

  // All staff/operations roles
  if (STAFF_ROLES.includes(appUser.role as any)) {
    return <Navigate to="/onboarding/staff" replace />;
  }

  // Fallback — treat as staff onboarding
  return <Navigate to="/onboarding/staff" replace />;
};
