import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";

/** Prevents Counsellor data hooks from mounting for unauthorized routes. */
export const CounsellorRoute: React.FC = () => (
  <RoleGate allowedRoles={["counsellor"]}>
    <Outlet />
  </RoleGate>
);
