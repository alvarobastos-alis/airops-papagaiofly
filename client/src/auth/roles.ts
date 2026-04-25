// ==========================================
// AirOps AI — Role Definitions
// Maps Clerk organization roles to app permissions
// ==========================================

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

export interface RoleConfig {
  label: string;
  level: number;
  color: string;
  icon: string;
  description: string;
  limits: {
    maxRefundBRL: number;
    canMonitor: boolean;
    canEditScenarios: boolean;
    canEditRules: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    canEditPrompts: boolean;
    canAuditSecurity: boolean;
  };
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  [ROLES.ATENDIMENTO_1]: {
    label: 'Atendimento I',
    level: 1,
    color: '#06b6d4',
    icon: '🎧',
    description: 'Chat e voz básicos, sem ações financeiras',
    limits: {
      maxRefundBRL: 0,
      canMonitor: false,
      canEditScenarios: false,
      canEditRules: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canEditPrompts: false,
      canAuditSecurity: false,
    },
  },
  [ROLES.ATENDIMENTO_2]: {
    label: 'Atendimento II',
    level: 2,
    color: '#3b82f6',
    icon: '💬',
    description: 'Chat e voz + reembolsos até R$ 500',
    limits: {
      maxRefundBRL: 500,
      canMonitor: false,
      canEditScenarios: false,
      canEditRules: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canEditPrompts: false,
      canAuditSecurity: false,
    },
  },
  [ROLES.ATENDIMENTO_3]: {
    label: 'Atendimento III',
    level: 3,
    color: '#8b5cf6',
    icon: '⭐',
    description: 'Chat e voz + reembolsos ilimitados + upgrades',
    limits: {
      maxRefundBRL: Infinity,
      canMonitor: false,
      canEditScenarios: false,
      canEditRules: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canEditPrompts: false,
      canAuditSecurity: false,
    },
  },
  [ROLES.SUPERVISOR]: {
    label: 'Supervisor',
    level: 4,
    color: '#f59e0b',
    icon: '👁️',
    description: 'Monitor em tempo real + escalações + intervenção',
    limits: {
      maxRefundBRL: Infinity,
      canMonitor: true,
      canEditScenarios: false,
      canEditRules: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canEditPrompts: false,
      canAuditSecurity: false,
    },
  },
  [ROLES.COORDENADOR]: {
    label: 'Coordenador',
    level: 5,
    color: '#f97316',
    icon: '📋',
    description: 'Editar cenários e regras + monitor',
    limits: {
      maxRefundBRL: Infinity,
      canMonitor: true,
      canEditScenarios: true,
      canEditRules: true,
      canViewAnalytics: false,
      canManageUsers: false,
      canEditPrompts: false,
      canAuditSecurity: false,
    },
  },
  [ROLES.GERENTE]: {
    label: 'Gerente',
    level: 6,
    color: '#ef4444',
    icon: '📊',
    description: 'Analytics + relatórios + tudo de Coordenador',
    limits: {
      maxRefundBRL: Infinity,
      canMonitor: true,
      canEditScenarios: true,
      canEditRules: true,
      canViewAnalytics: true,
      canManageUsers: false,
      canEditPrompts: false,
      canAuditSecurity: false,
    },
  },
  [ROLES.ADMIN]: {
    label: 'Admin',
    level: 7,
    color: '#dc2626',
    icon: '🛡️',
    description: 'Acesso total — segurança, prompts, configurações',
    limits: {
      maxRefundBRL: Infinity,
      canMonitor: true,
      canEditScenarios: true,
      canEditRules: true,
      canViewAnalytics: true,
      canManageUsers: true,
      canEditPrompts: true,
      canAuditSecurity: true,
    },
  },
};

/**
 * Check if a role has at least the same level as the required role.
 */
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return ROLE_CONFIG[userRole].level >= ROLE_CONFIG[requiredRole].level;
}
