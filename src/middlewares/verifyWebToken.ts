import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

export default (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.MI_CLAVESECRETA;
    jwt.verify(token, secret as string, (err, user) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          return res.status(401).json({ message: 'Token expired' });
        } else {
          return res.sendStatus(403);
        }
      }
      if (!user) {
        return res.sendStatus(403);
      }
      // @ts-ignore
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};