const planSave = jest.fn();
const planFindOne = jest.fn();
const qbGetOne = jest.fn();
const qbGetMany = jest.fn();

const qb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  setLock: jest.fn().mockReturnThis(),
  getOne: (...args: unknown[]) => qbGetOne(...args),
  getMany: (...args: unknown[]) => qbGetMany(...args),
};

const manager = {
  getRepository: () => ({
    createQueryBuilder: () => qb,
    findOne: planFindOne,
    save: planSave,
  }),
};

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('../auditoria/eventosAuditoria.service', () => ({
  registrarEvento: jest.fn().mockResolvedValue({}),
}));

import {
  avanzarCuotaPorCobro,
  retrocederCuotaPorReverso,
} from '../planes/planes.service';

describe('avanzarCuotaPorCobro / retrocederCuotaPorReverso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    planSave.mockImplementation(async (p) => p);
  });

  it('avanza 1 cuota con idPlan explícito', async () => {
    qbGetOne.mockResolvedValue({
      id: 5,
      estado: 'activo',
      cuotas: 3,
      cuotas_pagadas: 0,
      cliente: { id: 3 },
    });

    const plan = await avanzarCuotaPorCobro(manager as never, {
      idPlan: 5,
      idFactura: 1,
      idCliente: 3,
    });

    expect(plan?.cuotas_pagadas).toBe(1);
    expect(plan?.estado).toBe('activo');
  });

  it('completa el plan en la última cuota', async () => {
    qbGetOne.mockResolvedValue({
      id: 5,
      estado: 'activo',
      cuotas: 2,
      cuotas_pagadas: 1,
      cliente: { id: 3 },
    });

    const plan = await avanzarCuotaPorCobro(manager as never, {
      idPlan: 5,
      idFactura: 1,
      idCliente: 3,
    });

    expect(plan?.estado).toBe('completado');
    expect(plan?.cuotas_pagadas).toBe(2);
  });

  it('resuelve el único plan activo del cliente si no hay idPlan', async () => {
    qbGetOne.mockResolvedValueOnce(null);
    qbGetMany.mockResolvedValueOnce([
      {
        id: 8,
        estado: 'activo',
        cuotas: 4,
        cuotas_pagadas: 1,
        cliente: { id: 3 },
      },
    ]);

    const plan = await avanzarCuotaPorCobro(manager as never, {
      idFactura: 1,
      idCliente: 3,
    });

    expect(plan?.id).toBe(8);
    expect(plan?.cuotas_pagadas).toBe(2);
  });

  it('retrocede cuota y reabre plan completado', async () => {
    planFindOne.mockResolvedValue({
      id: 5,
      estado: 'completado',
      cuotas: 2,
      cuotas_pagadas: 2,
      id_junta: 1,
    });

    const plan = await retrocederCuotaPorReverso(manager as never, 5);

    expect(plan?.cuotas_pagadas).toBe(1);
    expect(plan?.estado).toBe('activo');
  });
});
