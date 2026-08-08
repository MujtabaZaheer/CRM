import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";

export const SuperAdminRoute: React.FC = () => (
  <RoleGate allowedRoles={["platform_super_admin"]}>
    <Outlet />
  </RoleGate>
);
