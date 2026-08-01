import {
  isPresidenteRole,
  ROLES_CAJERO,
  ROLES_PRESIDENTE,
  ROLES_TESORERO,
  UserRole,
} from '../userRoles';

describe('userRoles', () => {
  it('admin y presidente son roles de presidente', () => {
    expect(isPresidenteRole(UserRole.ADMIN)).toBe(true);
    expect(isPresidenteRole(UserRole.PRESIDENTE)).toBe(true);
    expect(isPresidenteRole(UserRole.TESORERO)).toBe(false);
    expect(isPresidenteRole(UserRole.CAJERO)).toBe(false);
  });

  it('matriz de roles incluye jerarquía', () => {
    expect(ROLES_PRESIDENTE).toEqual([UserRole.ADMIN, UserRole.PRESIDENTE]);
    expect(ROLES_TESORERO).toContain(UserRole.TESORERO);
    expect(ROLES_TESORERO).toContain(UserRole.ADMIN);
    expect(ROLES_CAJERO).toContain(UserRole.CAJERO);
    expect(ROLES_CAJERO).toContain(UserRole.TESORERO);
  });
});
