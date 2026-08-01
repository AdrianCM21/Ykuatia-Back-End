export enum UserRole {
  ADMIN = 'admin',
  PRESIDENTE = 'presidente',
  TESORERO = 'tesorero',
  CAJERO = 'cajero',
  AGENTE_CAMPO = 'agente de campo',
}

/** Presidente / admin: acceso total oficina */
export const ROLES_PRESIDENTE = [UserRole.ADMIN, UserRole.PRESIDENTE];

/** Tesorero +: caja, cierres, reportes, morosos, auditoría */
export const ROLES_TESORERO = [...ROLES_PRESIDENTE, UserRole.TESORERO];

/** Cajero +: cobros, recibos, lectura clientes */
export const ROLES_CAJERO = [...ROLES_TESORERO, UserRole.CAJERO];

/** Lectura compartida con campo */
export const ROLES_OFICINA_O_CAMPO = [...ROLES_CAJERO, UserRole.AGENTE_CAMPO];

export const isPresidenteRole = (rol?: string) =>
  rol === UserRole.ADMIN || rol === UserRole.PRESIDENTE;
