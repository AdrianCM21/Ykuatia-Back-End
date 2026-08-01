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
  getJuntaId: () => 1,
  tryGetJuntaId: () => 1,
}));

import { getLecturasByCliente, registrarLectura } from '../lecturas/lecturas.service';
import { Cliente } from '../../models/clientes';

describe('lecturas.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra lectura con junta', async () => {
    save.mockImplementation(async (l) => ({ ...l, id: 1 }));
    const lectura = await registrarLectura({
      cliente: { id: 2, id_junta: 1 } as Cliente,
      consumo: 12,
      origen: 'oficina',
      idUsuario: 3,
    });
    expect(lectura.id).toBe(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ consumo: 12, id_junta: 1 }));
  });

  it('lista lecturas del cliente', async () => {
    getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
    const result = await getLecturasByCliente(2, { page: 1, limit: 10 });
    expect(result.total).toBe(1);
  });
});
