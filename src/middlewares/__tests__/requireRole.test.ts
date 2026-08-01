import { Request, Response } from 'express';
import requireRole from '../requireRole';
import { UserRole } from '../../enum/userRoles';

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
};

describe('requireRole', () => {
  it('responde 401 si no hay rol', () => {
    const req = { user: undefined } as Request;
    const res = mockRes();
    const next = jest.fn();
    requireRole(UserRole.ADMIN)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 403 si el rol no está permitido', () => {
    const req = { user: { id: 1, nombre: 'X', rol: UserRole.CAJERO, juntaId: 1 } } as Request;
    const res = mockRes();
    const next = jest.fn();
    requireRole(UserRole.ADMIN, UserRole.PRESIDENTE)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('llama next si el rol es válido', () => {
    const req = { user: { id: 1, nombre: 'X', rol: UserRole.TESORERO, juntaId: 1 } } as Request;
    const res = mockRes();
    const next = jest.fn();
    requireRole(UserRole.TESORERO, UserRole.ADMIN)(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
