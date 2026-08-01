import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import verifyWebToken from '../verifyWebToken';
import { getJuntaId, tryGetJuntaId } from '../../utils/juntaContext';

const mockRes = () => {
  const res = {
    sendStatus: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    sendStatus: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
  };
};

describe('verifyWebToken', () => {
  const secret = 'test-secret-key-ykuatia';

  beforeEach(() => {
    process.env.MI_CLAVESECRETA = secret;
  });

  it('401 sin Authorization', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn();
    verifyWebToken(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  it('setea user, juntaId y contexto ALS con token válido', (done) => {
    const token = jwt.sign(
      { id: 5, nombre: 'Admin', rol: 'admin', juntaId: 2 },
      secret,
      { expiresIn: '1h' }
    );
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const res = mockRes();

    verifyWebToken(req, res, () => {
      expect(req.user?.id).toBe(5);
      expect(req.user?.juntaId).toBe(2);
      expect(req.juntaId).toBe(2);
      expect(getJuntaId()).toBe(2);
      done();
    });
  });

  it('usa juntaId=1 si el token no lo trae', (done) => {
    const token = jwt.sign({ id: 1, nombre: 'X', rol: 'cajero' }, secret, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();

    verifyWebToken(req, res, () => {
      expect(req.juntaId).toBe(1);
      expect(tryGetJuntaId()).toBe(1);
      done();
    });
  });

  it('403 con token inválido', () => {
    const req = { headers: { authorization: 'Bearer invalid' } } as Request;
    const res = mockRes();
    const next = jest.fn();
    verifyWebToken(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
