const pagoFactura = jest.fn();

jest.mock('../../services/facturas/factura.service', () => ({
  pagoFactura: (...args: unknown[]) => pagoFactura(...args),
  getFacturas: jest.fn(),
  obtenerClientes: jest.fn(),
  filtrarClientesConFacturas: jest.fn(),
  filtrarFacturasPendientes: jest.fn(),
  obtenerCliente: jest.fn(),
  completadoConsumoService: jest.fn(),
  getFacturasByIds: jest.fn(),
  asignarNroBoletaSiFalta: jest.fn(),
}));

jest.mock('../../services/facturas/facturaJob.service', () => ({
  controlCliente: jest.fn(),
}));

jest.mock('../../services/facturas/pdf.service', () => ({
  createInvoiceFromBoletas: jest.fn(),
  createReciboFromData: jest.fn(),
}));

jest.mock('../../utils/pdfBuffer', () => ({
  pdfToBuffer: jest.fn(),
}));

jest.mock('../../utils/boletaData', () => ({
  toBoletasFromClientes: jest.fn(),
  toReciboFromFacturas: jest.fn(),
}));

jest.mock('../../services/junta/junta.service', () => ({
  nextNroBoleta: jest.fn(),
}));

import { Request, Response } from 'express';
import { pagoFacturaController } from '../facturas/facturas.controller';

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
};

describe('pagoFacturaController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('paga con monto e incluirMora', async () => {
    pagoFactura.mockResolvedValue({});
    const req = {
      body: { pagos: [{ id: 1, monto: 15000, incluirMora: true }] },
      user: { id: 8 },
    } as unknown as Request;
    const res = mockRes();

    await pagoFacturaController(req, res);

    expect(pagoFactura).toHaveBeenCalledWith({
      idFactura: 1,
      monto: 15000,
      incluirMora: true,
      idPlan: null,
      idUsuario: 8,
    });
    expect(res.json).toHaveBeenCalledWith({ message: 'Facturas pagadas', pagadas: [1] });
  });

  it('reenvía id_plan al servicio', async () => {
    pagoFactura.mockResolvedValue({});
    const req = {
      body: { pagos: [{ id: 1, monto: 5000, id_plan: 12 }] },
      user: { id: 3 },
    } as unknown as Request;
    const res = mockRes();

    await pagoFacturaController(req, res);

    expect(pagoFactura).toHaveBeenCalledWith({
      idFactura: 1,
      monto: 5000,
      incluirMora: false,
      idPlan: 12,
      idUsuario: 3,
    });
  });

  it('devuelve 400 si todas fallan', async () => {
    pagoFactura.mockRejectedValue(new Error('sin saldo'));
    const req = {
      body: { pagos: [{ id: 2 }] },
      user: { id: 1 },
    } as unknown as Request;
    const res = mockRes();

    await pagoFacturaController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        fallidas: [expect.objectContaining({ id: 2, motivo: 'sin saldo' })],
      })
    );
  });
});
