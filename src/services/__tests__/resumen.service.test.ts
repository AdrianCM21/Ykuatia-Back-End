const getRawOne = jest.fn();
const getRawMany = jest.fn();

const qb = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawOne: (...a: unknown[]) => getRawOne(...a),
  getRawMany: (...a: unknown[]) => getRawMany(...a),
};

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: () => ({ createQueryBuilder: () => qb }),
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('../transaciones/transaciones.service', () => ({
  getCajaResumen: jest.fn().mockResolvedValue({ ingresos: 80, egresos: 20, saldo: 60 }),
}));

import { getReporteResumen } from '../reportes/resumen.service';

describe('resumen.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRawOne
      .mockResolvedValueOnce({
        totalRecaudado: '100',
        totalFacturado: '200',
        totalPendiente: '50',
        m3Consumidos: '12',
      })
      .mockResolvedValueOnce({ total: '3' });
    getRawMany.mockResolvedValue([
      { mes: '2026-08', facturado: '200', cobrado: '100', m3: '12' },
    ]);
  });

  it('arma resumen con cobranzaPct y series', async () => {
    const resumen = await getReporteResumen({
      desde: '2026-01-01',
      hasta: '2026-08-01',
    });

    expect(resumen.totalRecaudado).toBe(100);
    expect(resumen.totalPendiente).toBe(50);
    expect(resumen.cobranzaPct).toBeCloseTo(66.7, 0);
    expect(resumen.saldo).toBe(60);
    expect(resumen.morosos).toBe(3);
    expect(resumen.seriesMensuales[0].mes).toBe('2026-08');
  });
});
