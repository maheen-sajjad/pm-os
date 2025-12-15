import { UserRole } from "@prisma/client";

// Permission definitions
export const PERMISSIONS = {
  // Projects
  "projects:create": ["SUPER_ADMIN", "ADMIN", "LEAD"],
  "projects:delete": ["SUPER_ADMIN", "ADMIN"], // LEAD can delete own projects (checked separately)
  "projects:view-all": ["SUPER_ADMIN", "ADMIN", "LEAD"],
  "projects:import-github": ["SUPER_ADMIN", "ADMIN", "LEAD"],
  "projects:assign-lead": ["SUPER_ADMIN", "ADMIN"], // Only admins can assign project leads

  // Teams
  "teams:manage": ["SUPER_ADMIN", "ADMIN"],
  "teams:view": ["SUPER_ADMIN", "ADMIN", "LEAD", "MEMBER"],

  // Users
  "users:manage-roles": ["SUPER_ADMIN"],
  "users:view-all": ["SUPER_ADMIN", "ADMIN"],

  // Tasks
  "tasks:create": ["SUPER_ADMIN", "ADMIN", "LEAD"],
  "tasks:assign": ["SUPER_ADMIN", "ADMIN", "LEAD"],
  "tasks:update-own": ["SUPER_ADMIN", "ADMIN", "LEAD", "MEMBER"],

  // Creative Approval - handled via canApproveCreatives flag
  "creatives:approve": ["SUPER_ADMIN"], // Others need canApproveCreatives flag

  // Knowledge Base
  "kb:create": ["SUPER_ADMIN", "ADMIN", "LEAD", "MEMBER"],
  "kb:edit-own": ["SUPER_ADMIN", "ADMIN", "LEAD", "MEMBER"],
  "kb:edit-all": ["SUPER_ADMIN", "ADMIN"],
  "kb:delete-own": ["SUPER_ADMIN", "ADMIN", "LEAD", "MEMBER"],
  "kb:delete-all": ["SUPER_ADMIN", "ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
}

/**
 * Check if user can approve creatives (role-based + flag)
 */
export function canApproveCreatives(
  role: UserRole,
  canApproveFlag: boolean
): boolean {
  return role === "SUPER_ADMIN" || canApproveFlag;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((permission) =>
    hasPermission(role, permission)
  );
}

/**
 * Role hierarchy for comparison
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  LEAD: 2,
  MEMBER: 1,
};

/**
 * Check if roleA is higher or equal to roleB
 */
export function isRoleAtLeast(role: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}
