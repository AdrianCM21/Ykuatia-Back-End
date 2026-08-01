import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JwtPayload as LibJwtPayload } from 'jsonwebtoken';
import { JwtPayload } from '../interfaces/auth/JwtPayload';
import { runWithJunta } from '../utils/juntaContext';

export default (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.MI_CLAVESECRETA;

  if (!secret) {
    return res.status(500).json({ message: 'MI_CLAVESECRETA no está definida' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err instanceof TokenExpiredError) {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.sendStatus(403);
    }

    if (!decoded || typeof decoded === 'string') {
      return res.sendStatus(403);
    }

    const payload = decoded as LibJwtPayload & JwtPayload;
    if (payload.id == null || !payload.rol) {
      return res.sendStatus(403);
    }

    const juntaId = Number(payload.juntaId || 1);

    req.user = {
      id: payload.id,
      nombre: payload.nombre,
      rol: payload.rol,
      juntaId,
      iat: payload.iat,
      exp: payload.exp,
    };
    req.juntaId = juntaId;

    runWithJunta(juntaId, () => next());
  });
};
