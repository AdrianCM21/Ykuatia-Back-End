import { Request, Response } from 'express';
import {
  crearCierre,
  exportCierreCsv,
  listCierres,
  reabrirCierre,
} from '../../services/caja/cierreCaja.service';

export const crearCierreController = async (req: Request, res: Response) => {
  try {
    const result = await crearCierre({
      tipo: req.body.tipo,
      periodo: req.body.periodo,
      notas: req.body.notas,
      idUsuario: req.user?.id,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al cerrar caja',
    });
  }
};

export const listCierresController = async (req: Request, res: Response) => {
  try {
    const result = await listCierres({
      page: req.query.page as string,
      limit: req.query.limit as string,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar cierres',
    });
  }
};

export const reabrirCierreController = async (req: Request, res: Response) => {
  try {
    const result = await reabrirCierre(Number(req.params.id), req.user?.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al reabrir cierre',
    });
  }
};

export const exportCierreController = async (req: Request, res: Response) => {
  try {
    const csv = await exportCierreCsv(Number(req.params.id));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cierre-${req.params.id}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al exportar cierre',
    });
  }
};
