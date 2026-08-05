import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";

/** Prevents Team Leader data hooks from mounting for unauthorized routes. */
export const TeamLeaderRoute: React.FC = () => (
  <RoleGate allowedRoles={["team_leader"]}>
    <Outlet />
  </RoleGate>
);
