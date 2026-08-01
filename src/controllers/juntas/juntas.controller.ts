import { Request, Response } from 'express';
import { AppDataSource } from '../../config/db.config';
import { Junta } from '../../models/junta';

export const listJuntasController = async (_req: Request, res: Response) => {
  try {
    const juntas = await AppDataSource.getRepository(Junta).find({
      where: { activa: true },
      order: { nombre: 'ASC' },
    });
    res.json({ resultado: juntas });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar juntas',
    });
  }
};
