const findOne = jest.fn();
const save = jest.fn();
const findAndCount = jest.fn();

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: (Entity: { name: string }) => {
      if (Entity.name === 'CierreCaja') {
        return { findOne, save, findAndCount };
      }
      return {
        createQueryBuilder: () => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      };
    },
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('../transaciones/transaciones.service', () => ({
  getCajaResumen: jest.fn().mockResolvedValue({ ingresos: 100, egresos: 40, saldo: 60 }),
}));

jest.mock('../auditoria/eventosAuditoria.service', () => ({
  registrarEvento: jest.fn().mockResolvedValue({}),
}));

import { crearCierre, listCierres, reabrirCierre } from '../caja/cierreCaja.service';

describe('cierreCaja.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crea cierre diario', async () => {
    findOne.mockResolvedValue(null);
    save.mockImplementation(async (c) => ({ ...c, id: 1 }));

    const cierre = await crearCierre({
      tipo: 'dia',
      periodo: '2026-08-01',
      idUsuario: 2,
    });

    expect(cierre.ingresos).toBe(100);
    expect(cierre.saldo).toBe(60);
    expect(cierre.id_junta).toBe(1);
    expect(cierre.activo).toBe(true);
  });

  it('no permite cerrar período ya cerrado', async () => {
    findOne.mockResolvedValue({ id: 1, activo: true });
    await expect(
      crearCierre({ tipo: 'mes', periodo: '2026-08' })
    ).rejects.toThrow('ya está cerrado');
  });

  it('lista cierres de la junta', async () => {
    findAndCount.mockResolvedValue([[{ id: 1 }], 1]);
    const result = await listCierres({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
  });

  it('reabre cierre activo', async () => {
    findOne.mockResolvedValue({ id: 3, activo: true, periodo_tipo: 'dia', periodo: '2026-08-01' });
    save.mockImplementation(async (c) => c);

    const saved = await reabrirCierre(3, 1);
    expect(saved.activo).toBe(false);
    expect(saved.reabierto_en).toBeInstanceOf(Date);
  });
});
