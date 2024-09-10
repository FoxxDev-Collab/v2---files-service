// services/auth/src/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'test@69lol';

interface User {
  id: string;
  username: string;
}

export function generateToken(user: { id: string; username: string }): string {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  }
  
  export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }
  
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
      (req as any).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }