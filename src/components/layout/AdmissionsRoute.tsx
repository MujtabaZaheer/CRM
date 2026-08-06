import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";

export const AdmissionsRoute: React.FC = () => (
  <RoleGate allowedRoles={["admissions_officer", "platform_super_admin", "org_admin"]}>
    <Outlet />
  </RoleGate>
);
