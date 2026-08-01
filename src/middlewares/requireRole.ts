import { Request, Response, NextFunction } from 'express';

const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.rol;

    if (!userRole) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'No autorizado para este recurso' });
    }

    next();
  };
};

export default requireRole;
