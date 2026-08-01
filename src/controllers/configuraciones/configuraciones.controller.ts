import { Request, Response } from 'express';
import {
  getConfiguraciones,
  updateConfiguraciones,
} from '../../services/configuraciones/configuraciones.service';
import { registrarEvento } from '../../services/auditoria/eventosAuditoria.service';

export const getConfiguracionesController = async (_req: Request, res: Response) => {
  try {
    const result = await getConfiguraciones();
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al obtener tarifas',
    });
  }
};

export const updateConfiguracionesController = async (req: Request, res: Response) => {
  try {
    const result = await updateConfiguraciones(req.body);
    await registrarEvento({
      idUsuario: req.user?.id,
      accion: 'tarifas.actualizar',
      entidad: 'tarifas',
      entidadId: null,
      detalle: req.body,
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al actualizar tarifas',
    });
  }
};
