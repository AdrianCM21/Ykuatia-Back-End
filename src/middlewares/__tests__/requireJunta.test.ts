import { Request, Response } from 'express';
import requireJunta from '../requireJunta';
import { getJuntaId } from '../../utils/juntaContext';

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
};

describe('requireJunta', () => {
  it('403 si no hay juntaId', () => {
    const req = { user: { id: 1, rol: 'admin' } } as Request;
    const res = mockRes();
    const next = jest.fn();
    requireJunta(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('propaga juntaId al request y ALS', () => {
    const req = { user: { id: 1, rol: 'admin', juntaId: 4 } } as Request;
    const res = mockRes();
    let seen = 0;
    requireJunta(req, res, () => {
      seen = getJuntaId();
    });
    expect(req.juntaId).toBe(4);
    expect(seen).toBe(4);
  });
});
