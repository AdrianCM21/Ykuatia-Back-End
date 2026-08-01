import { Request, Response } from 'express';
import { controlCliente } from '../../services/facturas/facturaJob.service';
import {
  asignarNroBoletaSiFalta,
  completadoConsumoService,
  filtrarClientesConFacturas,
  filtrarFacturasPendientes,
  getFacturas,
  getFacturasByIds,
  listMovimientosPago,
  obtenerCliente,
  obtenerClientes,
  pagoFactura,
  revertirAbono,
} from '../../services/facturas/factura.service';
import {
  createInvoiceFromBoletas,
  createReciboFromData,
} from '../../services/facturas/pdf.service';
import { pdfToBuffer } from '../../utils/pdfBuffer';
import { toBoletasFromClientes, toReciboFromFacturas } from '../../utils/boletaData';
import { nextNroBoleta } from '../../services/junta/junta.service';

const controlFacturas = async () => {
  await controlCliente();
};

const generarMesController = async (_req: Request, res: Response) => {
  try {
    const result = await controlCliente();
    res.json({
      message: 'Generación de facturas del mes finalizada',
      ...result,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al generar facturas',
    });
  }
};

const completadoFacturaConsumo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { consumo } = req.body;
  try {
    if (!id || !consumo) {
      res.status(400).json({ message: 'Faltan datos' });
      return;
    }
    const result = await completadoConsumoService(id, consumo, req.user?.id);
    if (!result) {
      res.status(404).json({ message: 'No se encontro la factura' });
      return;
    }
    res.json({ message: result });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al completar consumo',
    });
  }
};

const getFacturasController = async (req: Request, res: Response) => {
  try {
    const result = await getFacturas({
      page: req.query.page as string,
      limit: req.query.limit as string,
      desde: req.query.desde as string,
      q: req.query.q as string,
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar facturas',
    });
  }
};

const sendPdf = (res: Response, buffer: Buffer, filename: string) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', String(buffer.length));
  res.end(buffer);
};

const descargarFactura = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    const clientes = id ? await obtenerCliente(id as string) : await obtenerClientes();

    if (!clientes) {
      res.status(404).json({ message: 'No hay clientes registrados' });
      return;
    }

    const clientesConFacturas = filtrarClientesConFacturas(clientes);
    if (!clientesConFacturas.length) {
      res.status(404).json({ message: 'No hay clientes con facturas' });
      return;
    }

    const pendientes = filtrarFacturasPendientes(clientesConFacturas);
    for (const item of pendientes) {
      for (const factura of item.facturas) {
        if (!factura.nro_boleta) {
          const nro = await nextNroBoleta();
          await asignarNroBoletaSiFalta(factura, nro);
        }
      }
    }
    const boletas = toBoletasFromClientes(pendientes);
    if (!boletas.length) {
      res.status(404).json({ message: 'No hay facturas pendientes para boleta' });
      return;
    }

    const pdfDoc = await createInvoiceFromBoletas(boletas);
    const buffer = await pdfToBuffer(pdfDoc);
    sendPdf(res, buffer, id ? 'boleta.pdf' : 'boletas.pdf');
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Error al generar las facturas',
    });
  }
};

const descargarRecibo = async (req: Request, res: Response) => {
  try {
    const idsRaw = String(req.query.ids || '');
    const ids = idsRaw
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0);

    if (!ids.length) {
      res.status(400).json({ message: 'Debés indicar ids de facturas' });
      return;
    }

    const facturas = await getFacturasByIds(ids);
    const recibo = toReciboFromFacturas(facturas);
    if (!recibo) {
      res.status(404).json({ message: 'No se encontraron facturas' });
      return;
    }

    const pdfDoc = await createReciboFromData(recibo);
    const buffer = await pdfToBuffer(pdfDoc);
    sendPdf(res, buffer, 'recibo.pdf');
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Error al generar el recibo',
    });
  }
};

const pagoFacturaController = async (req: Request, res: Response) => {
  const { pagos: facturas } = req.body;
  try {
    if (!facturas || !Array.isArray(facturas) || facturas.length === 0) {
      res.status(400).json({ message: 'Faltan datos' });
      return;
    }

    const pagadas: number[] = [];
    const fallidas: { id: number; motivo: string }[] = [];

    for (const factura of facturas as {
      id: number;
      monto?: number;
      incluirMora?: boolean;
      id_plan?: number | null;
    }[]) {
      try {
        await pagoFactura({
          idFactura: factura.id,
          monto: factura.monto,
          incluirMora: Boolean(factura.incluirMora),
          idPlan: factura.id_plan ?? null,
          idUsuario: req.user?.id,
        });
        pagadas.push(factura.id);
      } catch (error) {
        fallidas.push({
          id: factura.id,
          motivo: error instanceof Error ? error.message : 'Error al pagar',
        });
      }
    }

    if (fallidas.length && !pagadas.length) {
      res.status(400).json({ message: 'No se pudo pagar ninguna factura', fallidas });
      return;
    }

    if (fallidas.length) {
      res.status(207).json({
        message: 'Algunas facturas no se pudieron pagar',
        pagadas,
        fallidas,
      });
      return;
    }

    res.json({ message: 'Facturas pagadas', pagadas });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al pagar',
    });
  }
};

const revertirAbonoController = async (req: Request, res: Response) => {
  try {
    const result = await revertirAbono(Number(req.body.id_transaccion), req.user?.id);
    res.json({ message: 'Abono revertido', movimiento: result });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al revertir abono',
    });
  }
};

const listMovimientosPagoController = async (req: Request, res: Response) => {
  try {
    const resultado = await listMovimientosPago({
      id_cliente: req.query.id_cliente ? Number(req.query.id_cliente) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ resultado });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar movimientos',
    });
  }
};

export {
  controlFacturas,
  getFacturasController,
  descargarFactura,
  descargarRecibo,
  completadoFacturaConsumo,
  pagoFacturaController,
  revertirAbonoController,
  listMovimientosPagoController,
  generarMesController,
};
