import { Request, Response } from 'express';
import {
  addTransaciones,
  getCajaResumen,
  getTransaciones,
} from '../../services/transaciones/transaciones.service';
import IAddTransacion from '../../interfaces/transaciones/IAddTransaciones';

export const getTransacionesController = async (req: Request, res: Response) => {
  try {
    const result = await getTransaciones({
      page: req.query.page as string,
      limit: req.query.limit as string,
      desde: req.query.desde as string,
      q: req.query.q as string,
      desdeFecha: req.query.desdeFecha as string,
      hastaFecha: req.query.hastaFecha as string,
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar caja',
    });
  }
};

export const getCajaResumenController = async (req: Request, res: Response) => {
  try {
    const result = await getCajaResumen({
      desdeFecha: req.query.desdeFecha as string,
      hastaFecha: req.query.hastaFecha as string,
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al obtener resumen',
    });
  }
};

export const addTransacionController = async (
  req: Request<{}, {}, IAddTransacion>,
  res: Response
) => {
  try {
    const result = await addTransaciones(req.body, req.user?.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al registrar movimiento',
    });
  }
};
