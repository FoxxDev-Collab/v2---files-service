// services/auth/src/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface User {
  id: string;
  username: string;
}

export function generateToken(user: User): string {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, JWT_SECRET) as User;
  } catch (error) {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  (req as any).user = user;
  next();
}