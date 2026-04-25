// ==========================================
// AirOps AI — RBAC Middleware
// Role-based access control for 7 profiles
// ==========================================

import type { Request, Response, NextFunction } from 'express';

// 7 Role levels (ordered by permission level)
export const ROLES = {
  ATENDIMENTO_1: 'atendimento_1',
  ATENDIMENTO_2: 'atendimento_2',
  ATENDIMENTO_3: 'atendimento_3',
  SUPERVISOR: 'supervisor',
  COORDENADOR: 'coordenador',
  GERENTE: 'gerente',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: Role[] = [
  ROLES.ATENDIMENTO_1,
  ROLES.ATENDIMENTO_2,
  ROLES.ATENDIMENTO_3,
  ROLES.SUPERVISOR,
  ROLES.COORDENADOR,
  ROLES.GERENTE,
  ROLES.ADMIN,
];

// Permission definitions
export const PERMISSIONS = {
  // Chat
  'chat:read': [ROLES.ATENDIMENTO_1, ROLES.ATENDIMENTO_2, ROLES.ATENDIMENTO_3, ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],
  'chat:write': [ROLES.ATENDIMENTO_1, ROLES.ATENDIMENTO_2, ROLES.ATENDIMENTO_3, ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],

  // Voice
  'voice:connect': [ROLES.ATENDIMENTO_1, ROLES.ATENDIMENTO_2, ROLES.ATENDIMENTO_3, ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],

  // Refunds
  'refund:low': [ROLES.ATENDIMENTO_2, ROLES.ATENDIMENTO_3, ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],
  'refund:high': [ROLES.ATENDIMENTO_3, ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],

  // Monitoring
  'monitor:live': [ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],
  'monitor:intervene': [ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],

  // Scenarios & Rules
  'scenarios:read': [ROLES.ATENDIMENTO_1, ROLES.ATENDIMENTO_2, ROLES.ATENDIMENTO_3, ROLES.SUPERVISOR, ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],
  'scenarios:edit': [ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],
  'rules:edit': [ROLES.COORDENADOR, ROLES.GERENTE, ROLES.ADMIN],

  // Analytics
  'analytics:view': [ROLES.GERENTE, ROLES.ADMIN],
  'analytics:export': [ROLES.GERENTE, ROLES.ADMIN],

  // Admin
  'admin:users': [ROLES.ADMIN],
  'admin:prompts': [ROLES.ADMIN],
  'admin:security': [ROLES.ADMIN],
  'admin:settings': [ROLES.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Check if roleA is at least as high as roleB.
 */
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel;
}

/**
 * Express middleware: require specific permission.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole as Role | undefined;

    if (!userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!hasPermission(userRole, permission)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        userRole,
      });
      return;
    }

    next();
  };
}

/**
 * Express middleware: require minimum role level.
 */
export function requireRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole as Role | undefined;

    if (!userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!isRoleAtLeast(userRole, minRole)) {
      res.status(403).json({
        error: 'Insufficient role level',
        required: minRole,
        userRole,
      });
      return;
    }

    next();
  };
}

/**
 * Get refund limit for a role.
 */
export function getRefundLimit(role: Role): number {
  switch (role) {
    case ROLES.ATENDIMENTO_1: return 0;
    case ROLES.ATENDIMENTO_2: return 500;
    case ROLES.ATENDIMENTO_3: return Infinity;
    case ROLES.SUPERVISOR: return Infinity;
    case ROLES.COORDENADOR: return Infinity;
    case ROLES.GERENTE: return Infinity;
    case ROLES.ADMIN: return Infinity;
    default: return 0;
  }
}
