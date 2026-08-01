const getMany = jest.fn();

const qb = {
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
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
  getJuntaConfig: jest.fn().mockResolvedValue({ mora_pct: 10 }),
}));

import { exportMorososCsv, getMorosos } from '../reportes/morosos.service';

describe('morosos.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const vencida = new Date();
    vencida.setDate(vencida.getDate() - 40);

    getMany.mockResolvedValue([
      {
        monto: 20000,
        monto_pagado: 5000,
        fecha_vencimiento: vencida,
        Fecha_emicion: vencida,
        cliente: {
          id: 1,
          nombre: 'Juan',
          cedula: '111',
          telefono: '0991',
          nro_medidor: 'M1',
        },
      },
      {
        monto: 10000,
        monto_pagado: 0,
        fecha_vencimiento: vencida,
        Fecha_emicion: vencida,
        cliente: {
          id: 1,
          nombre: 'Juan',
          cedula: '111',
          telefono: '0991',
          nro_medidor: 'M1',
        },
      },
    ]);
  });

  it('agrupa deuda y recargo por cliente', async () => {
    const result = await getMorosos({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.resultado[0].monto_deuda).toBe(25000);
    expect(result.resultado[0].facturas_pendientes).toBe(2);
    expect(result.resultado[0].recargo_estimado).toBeGreaterThan(0);
    expect(result.resultado[0].fecha_vencimiento).toBeTruthy();
  });

  it('filtra por bucket', async () => {
    const result = await getMorosos({ bucket: '0-30', page: 1, limit: 10 });
    // 40 días cae en 31-60
    expect(result.total).toBe(0);
  });

  it('excluye facturas aún no vencidas del período actual', async () => {
    const futura = new Date();
    futura.setDate(futura.getDate() + 10);
    getMany.mockResolvedValue([
      {
        monto: 30000,
        monto_pagado: 0,
        fecha_vencimiento: futura,
        Fecha_emicion: new Date(),
        cliente: {
          id: 2,
          nombre: 'Ana',
          cedula: '222',
          telefono: '0981',
          nro_medidor: null,
        },
      },
    ]);

    const result = await getMorosos({ page: 1, limit: 10 });
    expect(result.total).toBe(0);
    expect(result.resumen.total_clientes).toBe(0);
  });

  it('exporta csv con encabezados', async () => {
    const csv = await exportMorososCsv({});
    expect(csv).toContain('id_cliente');
    expect(csv).toContain('recargo_estimado');
    expect(csv).toContain('Juan');
  });
});
