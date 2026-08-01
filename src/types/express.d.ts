import { JwtPayload } from '../interfaces/auth/JwtPayload';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      juntaId?: number;
    }
  }
}

export {};
