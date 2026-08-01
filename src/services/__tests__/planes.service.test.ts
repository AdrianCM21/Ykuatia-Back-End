const planSave = jest.fn();
const planFindOne = jest.fn();
const planGetMany = jest.fn();
const clienteFindOne = jest.fn();
const facturaFindOne = jest.fn();

const qb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: (...args: unknown[]) => planGetMany(...args),
};

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: (entity: { name?: string }) => {
      const name = entity?.name || entity?.toString();
      if (String(name).includes('PlanPago') || name === 'PlanPago') {
        return {
          createQueryBuilder: () => qb,
          save: planSave,
          findOne: planFindOne,
        };
      }
      if (String(name).includes('Cliente') || name === 'Cliente') {
        return { findOne: clienteFindOne };
      }
      if (String(name).includes('Factura') || name === 'Factura') {
        return { findOne: facturaFindOne };
      }
      return { findOne: jest.fn(), save: jest.fn(), createQueryBuilder: () => qb };
    },
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('../auditoria/eventosAuditoria.service', () => ({
  registrarEvento: jest.fn().mockResolvedValue({}),
}));

import { createPlan, listPlanes, updatePlan } from '../planes/planes.service';
import { PlanPago } from '../../models/planPago';
import { Cliente } from '../../models/clientes';
import { Factura } from '../../models/facturas';

describe('planes.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista planes de la junta', async () => {
    planGetMany.mockResolvedValue([{ id: 1 }]);
    const result = await listPlanes({});
    expect(result).toEqual([{ id: 1 }]);
    expect(qb.where).toHaveBeenCalled();
  });

  it('crea plan con monto_cuota redondeado', async () => {
    clienteFindOne.mockResolvedValue({ id: 3 } as Cliente);
    facturaFindOne.mockResolvedValue(null);
    planSave.mockImplementation(async (plan: PlanPago) => ({ ...plan, id: 10 }));

    const created = await createPlan({
      id_cliente: 3,
      monto_total: 10000,
      cuotas: 3,
    });

    expect(created.id).toBe(10);
    expect(planSave).toHaveBeenCalledWith(
      expect.objectContaining({
        monto_total: 10000,
        cuotas: 3,
        monto_cuota: 3333.33,
        estado: 'activo',
        id_junta: 1,
      })
    );
  });

  it('falla si el cliente no existe', async () => {
    clienteFindOne.mockResolvedValue(null);
    await expect(
      createPlan({ id_cliente: 99, monto_total: 1000, cuotas: 2 })
    ).rejects.toThrow('Cliente no encontrado');
  });

  it('marca cuota y completa el plan', async () => {
    planFindOne.mockResolvedValue({
      id: 1,
      estado: 'activo',
      cuotas: 2,
      cuotas_pagadas: 1,
      id_junta: 1,
    });
    planSave.mockImplementation(async (p) => p);

    const updated = await updatePlan(1, { accion: 'marcar_cuota' });
    expect(updated.estado).toBe('completado');
    expect(updated.cuotas_pagadas).toBe(2);
  });

  it('cancela plan', async () => {
    planFindOne.mockResolvedValue({
      id: 1,
      estado: 'activo',
      cuotas: 4,
      cuotas_pagadas: 0,
      id_junta: 1,
    });
    planSave.mockImplementation(async (p) => p);

    const updated = await updatePlan(1, { accion: 'cancelar' });
    expect(updated.estado).toBe('cancelado');
  });
});
