const getManyAndCount = jest.fn();
const getRawMany = jest.fn();
const findOneByTipo = jest.fn();
const findOneFactura = jest.fn();
const saveTx = jest.fn();

const qb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: (...a: unknown[]) => getManyAndCount(...a),
  getRawMany: (...a: unknown[]) => getRawMany(...a),
};

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: (Entity: { name: string }) => {
      if (Entity.name === 'Transaccion') {
        return { createQueryBuilder: () => qb };
      }
      if (Entity.name === 'TipoIngreso') {
        return { findOneBy: findOneByTipo };
      }
      if (Entity.name === 'Factura') {
        return { findOne: findOneFactura };
      }
      return {};
    },
    manager: { save: saveTx },
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('../caja/periodoCaja.guard', () => ({
  assertPeriodoAbierto: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../auditoria/eventosAuditoria.service', () => ({
  registrarEvento: jest.fn().mockResolvedValue({}),
}));

import {
  addTransaciones,
  getCajaResumen,
  getTransaciones,
} from '../transaciones/transaciones.service';

describe('transaciones.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista transacciones paginadas', async () => {
    getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
    const result = await getTransaciones({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.resultado).toHaveLength(1);
  });

  it('calcula resumen de caja', async () => {
    getRawMany.mockResolvedValue([
      { tipoId: '2', total: '50000' },
      { tipoId: '1', total: '10000' },
    ]);
    const resumen = await getCajaResumen({});
    expect(resumen).toEqual({ ingresos: 50000, egresos: 10000, saldo: 40000 });
  });

  it('agrega movimiento de caja', async () => {
    findOneByTipo.mockResolvedValue({ id: 2, descripcion: 'Ingreso' });
    saveTx.mockImplementation(async (t) => ({ ...t, id: 5 }));

    const saved = await addTransaciones(
      { monto: '1000', motivo: 'Ajuste', tipo_transacion: '2' },
      1
    );
    expect(saved.id).toBe(5);
    expect(saveTx).toHaveBeenCalledWith(expect.objectContaining({ monto: 1000, id_junta: 1 }));
  });
});
