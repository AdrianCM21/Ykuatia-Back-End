import { Request, Response } from 'express';
import { exportMorososCsv, getMorosos } from '../../services/reportes/morosos.service';
import { getReporteResumen } from '../../services/reportes/resumen.service';
import { getDashboard } from '../../services/reportes/dashboard.service';

export const getMorososController = async (req: Request, res: Response) => {
  try {
    const result = await getMorosos({
      q: req.query.q as string,
      bucket: req.query.bucket as string,
      page: req.query.page as string,
      limit: req.query.limit as string,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar morosos',
    });
  }
};

export const exportMorososController = async (req: Request, res: Response) => {
  try {
    const csv = await exportMorososCsv({
      q: req.query.q as string,
      bucket: req.query.bucket as string,
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="morosos.csv"');
    res.send(csv);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al exportar morosos',
    });
  }
};

export const getResumenController = async (req: Request, res: Response) => {
  try {
    const result = await getReporteResumen({
      desde: req.query.desde as string,
      hasta: req.query.hasta as string,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al obtener resumen',
    });
  }
};

export const getDashboardController = async (req: Request, res: Response) => {
  try {
    const result = await getDashboard({
      desde: req.query.desde as string,
      hasta: req.query.hasta as string,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al obtener dashboard',
    });
  }
};
