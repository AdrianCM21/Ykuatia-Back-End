import { Request, Response } from 'express';
import { runDatabaseBackup } from '../../services/sistema/backup.service';

export const backupController = async (_req: Request, res: Response) => {
  try {
    const result = await runDatabaseBackup();
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al ejecutar backup',
    });
  }
};
