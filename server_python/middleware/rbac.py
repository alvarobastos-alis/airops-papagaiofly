# ==========================================
# AirOps AI — RBAC Middleware (7 profiles)
# ==========================================

from enum import Enum
from fastapi import HTTPException


class Role(str, Enum):
    ATENDIMENTO_1 = "atendimento_1"
    ATENDIMENTO_2 = "atendimento_2"
    ATENDIMENTO_3 = "atendimento_3"
    SUPERVISOR = "supervisor"
    COORDENADOR = "coordenador"
    GERENTE = "gerente"
    ADMIN = "admin"


ROLE_HIERARCHY = list(Role)

PERMISSIONS = {
    "chat:read": [Role.ATENDIMENTO_1, Role.ATENDIMENTO_2, Role.ATENDIMENTO_3, Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "chat:write": [Role.ATENDIMENTO_1, Role.ATENDIMENTO_2, Role.ATENDIMENTO_3, Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "voice:connect": [Role.ATENDIMENTO_1, Role.ATENDIMENTO_2, Role.ATENDIMENTO_3, Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "refund:low": [Role.ATENDIMENTO_2, Role.ATENDIMENTO_3, Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "refund:high": [Role.ATENDIMENTO_3, Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "monitor:live": [Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "monitor:intervene": [Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "scenarios:read": [Role.ATENDIMENTO_1, Role.ATENDIMENTO_2, Role.ATENDIMENTO_3, Role.SUPERVISOR, Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "scenarios:edit": [Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "rules:edit": [Role.COORDENADOR, Role.GERENTE, Role.ADMIN],
    "analytics:view": [Role.GERENTE, Role.ADMIN],
    "analytics:export": [Role.GERENTE, Role.ADMIN],
    "admin:users": [Role.ADMIN],
    "admin:prompts": [Role.ADMIN],
    "admin:security": [Role.ADMIN],
    "admin:settings": [Role.ADMIN],
}


def has_permission(role: Role, permission: str) -> bool:
    return role in PERMISSIONS.get(permission, [])


def is_role_at_least(user_role: Role, required_role: Role) -> bool:
    return ROLE_HIERARCHY.index(user_role) >= ROLE_HIERARCHY.index(required_role)


def get_refund_limit(role: Role) -> float:
    limits = {Role.ATENDIMENTO_1: 0, Role.ATENDIMENTO_2: 500}
    return limits.get(role, float("inf"))
