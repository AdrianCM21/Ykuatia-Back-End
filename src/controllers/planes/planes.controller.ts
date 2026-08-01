import { Request, Response } from 'express';
import { createPlan, listPlanes, updatePlan } from '../../services/planes/planes.service';

export const listPlanesController = async (req: Request, res: Response) => {
  try {
    const result = await listPlanes({
      id_cliente: req.query.id_cliente ? Number(req.query.id_cliente) : undefined,
      estado: req.query.estado as string | undefined,
    });
    res.json({ resultado: result });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar planes',
    });
  }
};

export const createPlanController = async (req: Request, res: Response) => {
  try {
    const result = await createPlan({ ...req.body, idUsuario: req.user?.id });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al crear plan',
    });
  }
};

export const updatePlanController = async (req: Request, res: Response) => {
  try {
    const result = await updatePlan(Number(req.params.id), {
      ...req.body,
      idUsuario: req.user?.id,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al actualizar plan',
    });
  }
};
