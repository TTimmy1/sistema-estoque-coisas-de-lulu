import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  nome: string;
  email: string;
}

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ error: 'Token mal formatado. Use: Bearer <token>' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
