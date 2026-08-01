const getManyAndCount = jest.fn();
const findOne = jest.fn();
const save = jest.fn();
const findTipos = jest.fn();
const findOneTipo = jest.fn();
const findOneAuditoria = jest.fn();

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
    getRepository: (Entity: { name: string }) => {
      if (Entity.name === 'Cliente') {
        return { createQueryBuilder: () => qb, findOne, save };
      }
      if (Entity.name === 'TipoCliente') {
        return { find: findTipos, findOne: findOneTipo };
      }
      if (Entity.name === 'Auditoria') {
        return { findOneBy: findOneAuditoria };
      }
      return {};
    },
    manager: {
      save: (...a: unknown[]) => save(...a),
      find: findTipos,
    },
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('../junta/junta.service', () => ({
  getJuntaConfig: jest.fn().mockResolvedValue({ mora_pct: 0 }),
}));

import {
  addCliente,
  getClientes,
  getClientesConFactura,
  getCustomerTypes,
} from '../customer/customer.service';

describe('customer.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista clientes de la junta', async () => {
    getManyAndCount.mockResolvedValue([[{ id: 1, nombre: 'Juan' }], 1]);
    const result = await getClientes({ page: 1 });
    expect(result.total).toBe(1);
  });

  it('lista clientes con factura cobrable e inyecta saldo', async () => {
    getManyAndCount.mockResolvedValue([
      [
        {
          id: 1,
          factura: [{ monto: 20000, monto_pagado: 5000, fecha_vencimiento: new Date() }],
        },
      ],
      1,
    ]);
    const result = await getClientesConFactura({ page: 1 });
    expect((result.resultado[0].factura[0] as { saldo?: number }).saldo).toBe(15000);
  });

  it('crea cliente con id_junta', async () => {
    findOneTipo.mockResolvedValue({ id_tipo: 1 });
    findOneAuditoria.mockResolvedValue({ id: 9 });
    save.mockImplementation(async (c) => ({ ...c, id: 5 }));

    const created = await addCliente(
      {
        nombre: 'Pedro',
        cedula: '123',
        direccion: 'X',
        telefono: '099',
        locacion: '1,1',
        tipoCliente: 1,
      },
      9
    );

    expect(created.id).toBe(5);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id_junta: 1, nombre: 'Pedro' }));
  });

  it('lista tipos de cliente por junta', async () => {
    findTipos.mockResolvedValue([{ id_tipo: 1 }]);
    await expect(getCustomerTypes()).resolves.toEqual([{ id_tipo: 1 }]);
  });
});
