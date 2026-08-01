const findOneFactura = jest.fn();
const saveFactura = jest.fn();
const saveTransaccion = jest.fn();
const findOneTransaccion = jest.fn();

const avanzarCuotaPorCobro = jest.fn();
const retrocederCuotaPorReverso = jest.fn();

const manager = {
  getRepository: (Entity: { name: string }) => {
    if (Entity.name === 'Factura') {
      return { findOne: findOneFactura, save: saveFactura };
    }
    if (Entity.name === 'Transaccion') {
      return { findOne: findOneTransaccion, save: saveTransaccion };
    }
    return { findOne: jest.fn(), save: jest.fn() };
  },
};

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
    })),
    transaction: jest.fn(async (cb: (m: typeof manager) => unknown) => cb(manager)),
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

const assertPeriodoAbierto = jest.fn().mockResolvedValue(undefined);
jest.mock('../caja/periodoCaja.guard', () => ({
  assertPeriodoAbierto: (...args: unknown[]) => assertPeriodoAbierto(...args),
}));

jest.mock('../junta/junta.service', () => ({
  getJuntaConfig: jest.fn().mockResolvedValue({ mora_pct: 10, dias_gracia: 14 }),
}));

jest.mock('../transaciones/transaciones.service', () => ({
  findTipoOperacion: jest.fn().mockResolvedValue({ id: 2, descripcion: 'Ingreso' }),
  TIPO_INGRESO: 2,
}));

jest.mock('../planes/planes.service', () => ({
  avanzarCuotaPorCobro: (...args: unknown[]) => avanzarCuotaPorCobro(...args),
  retrocederCuotaPorReverso: (...args: unknown[]) => retrocederCuotaPorReverso(...args),
}));

const appendAuditoria = jest.fn().mockResolvedValue({});
const getAuditoriaId = jest.fn().mockResolvedValue(7);
const registrarEvento = jest.fn().mockResolvedValue({});

jest.mock('../auditoria/auditoria.service', () => ({
  appendAuditoria: (...args: unknown[]) => appendAuditoria(...args),
  getAuditoriaId: (...args: unknown[]) => getAuditoriaId(...args),
}));

jest.mock('../auditoria/eventosAuditoria.service', () => ({
  registrarEvento: (...args: unknown[]) => registrarEvento(...args),
}));

import { pagoFactura, revertirAbono } from '../facturas/factura.service';

describe('pagoFactura', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assertPeriodoAbierto.mockResolvedValue(undefined);
    saveFactura.mockImplementation(async (f) => f);
    saveTransaccion.mockImplementation(async (t) => ({ ...t, id: 99 }));
    avanzarCuotaPorCobro.mockResolvedValue(null);
  });

  const baseFactura = {
    id: 1,
    delete: false,
    id_junta: 1,
    estado: 'pendiente a pago',
    monto: 30000,
    monto_pagado: 0,
    Fecha_emicion: new Date('2026-08-01'),
    fecha_vencimiento: new Date('2026-07-01'),
    cliente: { id: 3, nombre: 'Juan' },
  };

  it('registra pago parcial y deja estado parcialmente pagado', async () => {
    findOneFactura.mockResolvedValue({ ...baseFactura });

    const result = await pagoFactura({ idFactura: 1, monto: 10000, idUsuario: 2 });

    expect(result.estado).toBe('parcialmente pagado');
    expect(Number(result.monto_pagado)).toBe(10000);
    expect(saveTransaccion).toHaveBeenCalledWith(
      expect.objectContaining({ monto: 10000, id_junta: 1 })
    );
    expect(appendAuditoria).toHaveBeenCalled();
    expect(registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'factura.pago' })
    );
  });

  it('setea id_plan en el movimiento y avanza cuota', async () => {
    findOneFactura.mockResolvedValue({ ...baseFactura });
    avanzarCuotaPorCobro.mockResolvedValue({
      id: 5,
      cuotas: 3,
      cuotas_pagadas: 1,
      estado: 'activo',
    });

    await pagoFactura({ idFactura: 1, monto: 10000, idPlan: 5, idUsuario: 2 });

    expect(avanzarCuotaPorCobro).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ idPlan: 5, idFactura: 1, idCliente: 3 })
    );
    expect(saveTransaccion).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({ id: 5 }),
      })
    );
    expect(registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'factura.pago',
        detalle: expect.objectContaining({ idPlan: 5, idTransaccion: 99 }),
      })
    );
    expect(registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'plan.cuota', entidadId: 5 })
    );
  });

  it('marca pagado cuando el abono cubre el saldo', async () => {
    findOneFactura.mockResolvedValue({ ...baseFactura, monto_pagado: 20000 });

    const result = await pagoFactura({ idFactura: 1, monto: 10000 });

    expect(result.estado).toBe('pagado');
    expect(Number(result.monto_pagado)).toBe(30000);
  });

  it('rechaza monto mayor al saldo (+ mora si aplica)', async () => {
    findOneFactura.mockResolvedValue({ ...baseFactura });

    await expect(pagoFactura({ idFactura: 1, monto: 999999 })).rejects.toThrow(/supera el saldo/);
  });

  it('rechaza factura ya pagada', async () => {
    findOneFactura.mockResolvedValue({ ...baseFactura, estado: 'pagado' });

    await expect(pagoFactura({ idFactura: 1 })).rejects.toThrow('ya está pagada');
  });

  it('incluye mora en el movimiento si se solicita', async () => {
    findOneFactura.mockResolvedValue({ ...baseFactura });

    await pagoFactura({
      idFactura: 1,
      monto: 33000,
      incluirMora: true,
    });

    expect(saveTransaccion).toHaveBeenCalledWith(
      expect.objectContaining({
        monto: 33000,
      })
    );
  });
});

describe('revertirAbono', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assertPeriodoAbierto.mockResolvedValue(undefined);
    saveFactura.mockImplementation(async (f) => f);
    saveTransaccion.mockImplementation(async (t) => t);
    retrocederCuotaPorReverso.mockResolvedValue({ id: 5, cuotas_pagadas: 0, estado: 'activo' });
  });

  it('soft-delete, resta monto_pagado y retrocede plan', async () => {
    findOneTransaccion.mockResolvedValue({
      id: 40,
      delete: false,
      monto: 10000,
      id_junta: 1,
      tipo_ingreso: { id: 2 },
      factura: { id: 1, cliente: { id: 3, nombre: 'Juan' } },
      plan: { id: 5 },
    });
    findOneFactura.mockResolvedValue({
      id: 1,
      delete: false,
      id_junta: 1,
      monto: 30000,
      monto_pagado: 10000,
      estado: 'parcialmente pagado',
      Fecha_emicion: new Date('2026-08-01'),
      cliente: { id: 3, nombre: 'Juan' },
    });

    const result = await revertirAbono(40, 9);

    expect(result.delete).toBe(true);
    expect(saveFactura).toHaveBeenCalledWith(
      expect.objectContaining({
        monto_pagado: 0,
        estado: 'pendiente a pago',
      })
    );
    expect(retrocederCuotaPorReverso).toHaveBeenCalledWith(manager, 5);
    expect(registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'factura.pago_revertido' })
    );
    expect(appendAuditoria).toHaveBeenCalled();
  });

  it('rechaza si el abono ya fue revertido', async () => {
    findOneTransaccion.mockResolvedValue({
      id: 40,
      delete: true,
      monto: 10000,
      id_junta: 1,
      tipo_ingreso: { id: 2 },
      factura: { id: 1 },
      plan: null,
    });

    await expect(revertirAbono(40)).rejects.toThrow('ya fue revertido');
  });

  it('rechaza si la caja está cerrada', async () => {
    assertPeriodoAbierto.mockRejectedValue(new Error('La caja del período está cerrada'));

    await expect(revertirAbono(40)).rejects.toThrow(/caja/);
    expect(findOneTransaccion).not.toHaveBeenCalled();
  });
});
