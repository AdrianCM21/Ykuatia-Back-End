import { Request, Response } from 'express';
import { listEventos } from '../../services/auditoria/eventosAuditoria.service';

export const getEventosController = async (req: Request, res: Response) => {
  try {
    const result = await listEventos({
      page: req.query.page as string,
      limit: req.query.limit as string,
      entidad: req.query.entidad as string,
      entidadId: req.query.entidadId as string,
      q: req.query.q as string,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar auditoría',
    });
  }
};
