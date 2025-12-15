import { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { Permission } from "@/lib/permissions";

export interface RoleGateProps {
  children: ReactNode;
  /** Require specific permission */
  permission?: Permission;
  /** Require minimum role level */
  minimumRole?: UserRole;
  /** Require SUPER_ADMIN role */
  requireSuperAdmin?: boolean;
  /** Require creative approval permission */
  requireApprover?: boolean;
  /** Content to show if access denied (default: null) */
  fallback?: ReactNode;
}
