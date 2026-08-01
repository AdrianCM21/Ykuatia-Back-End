import { Request, Response, NextFunction } from 'express';
import { runWithJunta } from '../utils/juntaContext';

/**
 * Establece el scope de junta desde el JWT y lo propaga vía AsyncLocalStorage.
 */
const requireJunta = (req: Request, res: Response, next: NextFunction) => {
  const juntaId = Number(req.user?.juntaId);
  if (!juntaId || Number.isNaN(juntaId)) {
    return res.status(403).json({ message: 'Junta no asignada en la sesión' });
  }
  req.juntaId = juntaId;
  runWithJunta(juntaId, () => next());
};

export default requireJunta;
