const getRawMany = jest.fn();
const getRawOne = jest.fn();
const getMany = jest.fn();

const qb = {
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawMany: (...a: unknown[]) => getRawMany(...a),
  getRawOne: (...a: unknown[]) => getRawOne(...a),
  getMany: (...a: unknown[]) => getMany(...a),
};

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: () => ({
      createQueryBuilder: () => qb,
    }),
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('../junta/junta.service', () => ({
  getJuntaConfig: jest.fn().mockResolvedValue({ mora_pct: 0 }),
}));

jest.mock('../reportes/morosos.service', () => ({
  getMorosos: jest.fn().mockResolvedValue({
    resultado: [{ id_cliente: 1, nombre: 'Juan', monto_deuda: 1000 }],
    total: 1,
  }),
}));

import { getDashboard } from '../reportes/dashboard.service';

describe('dashboard.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRawMany.mockResolvedValue([{ periodo: '2026-07', total: '5000' }]);
    getRawOne.mockResolvedValue({ total: '5000' });
    getMany.mockResolvedValue([
      {
        monto: 20000,
        monto_pagado: 0,
        fecha_vencimiento: new Date('2026-01-01'),
      },
    ]);
  });

  it('devuelve kpis, series y top morosos', async () => {
    const data = await getDashboard({
      desde: '2026-01-01',
      hasta: '2026-08-01',
    });

    expect(data.kpis.deudaTotal).toBe(20000);
    expect(data.kpis.facturasAbiertas).toBe(1);
    expect(data.serieCobranza[0]).toEqual({ periodo: '2026-07', total: 5000 });
    expect(data.cobranzaPorBucket.length).toBe(4);
    expect(data.topMorosos[0].nombre).toBe('Juan');
  });
});
