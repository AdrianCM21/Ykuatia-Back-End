const save = jest.fn();
const getManyAndCount = jest.fn();

const qb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: (...a: unknown[]) => getManyAndCount(...a),
};

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: () => ({
      save,
      createQueryBuilder: () => qb,
    }),
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 2,
  tryGetJuntaId: () => 2,
}));

import { listEventos, registrarEvento } from '../auditoria/eventosAuditoria.service';

describe('eventosAuditoria.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra evento con detalle JSON e id_junta', async () => {
    save.mockImplementation(async (e) => ({ ...e, id: 1 }));
    const evento = await registrarEvento({
      idUsuario: 5,
      accion: 'factura.pago',
      entidad: 'factura',
      entidadId: 9,
      detalle: { monto: 1000 },
    });

    expect(evento.id).toBe(1);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'factura.pago',
        detalle: '{"monto":1000}',
        id_junta: 2,
      })
    );
  });

  it('lista eventos filtrados', async () => {
    getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
    const result = await listEventos({ page: 1, limit: 10, entidad: 'factura', q: 'pago' });
    expect(result.total).toBe(1);
    expect(qb.andWhere).toHaveBeenCalled();
  });
});
