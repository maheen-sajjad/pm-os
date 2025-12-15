"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import {
  Permission,
  hasPermission,
  isRoleAtLeast,
  canApproveCreatives as checkCanApproveCreatives,
} from "@/lib/permissions";

export function usePermissions() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const role = user?.role ?? "MEMBER";
  const canApproveCreativesFlag = user?.canApproveCreatives ?? false;

  return {
    // Session state
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    user,
    role,

    // Permission checks
    can: (permission: Permission) => hasPermission(role, permission),

    // Role checks
    isAtLeast: (minimumRole: UserRole) => isRoleAtLeast(role, minimumRole),
    isSuperAdmin: role === "SUPER_ADMIN",
    isAdmin: role === "ADMIN" || role === "SUPER_ADMIN",
    isLead: isRoleAtLeast(role, "LEAD"),

    // Special permissions
    canApproveCreatives: checkCanApproveCreatives(role, canApproveCreativesFlag),
  };
}
