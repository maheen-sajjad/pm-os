"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { RoleGateProps } from "./RoleGate.types";

export function RoleGate({
  children,
  permission,
  minimumRole,
  requireSuperAdmin,
  requireApprover,
  fallback = null,
}: RoleGateProps) {
  const { can, isAtLeast, isSuperAdmin, canApproveCreatives } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasAccess && can(permission);
  }

  if (minimumRole) {
    hasAccess = hasAccess && isAtLeast(minimumRole);
  }

  if (requireSuperAdmin) {
    hasAccess = hasAccess && isSuperAdmin;
  }

  if (requireApprover) {
    hasAccess = hasAccess && canApproveCreatives;
  }

  if (!hasAccess) {
    return fallback as ReactNode;
  }

  return children as ReactNode;
}
