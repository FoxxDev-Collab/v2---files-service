import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'test@69lol';

interface User {
  id: string;
  username: string;
}

interface JwtPayload {
  id: string;
  username: string;
}

export function generateToken(user: User): string {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}