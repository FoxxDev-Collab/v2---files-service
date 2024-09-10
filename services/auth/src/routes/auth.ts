// services/auth/src/routes/auth.ts

import express from 'express';
import { generateToken } from '../auth';

const router = express.Router();

// Mock user data (replace with database in production)
const users: { [key: string]: { id: string; username: string; password: string } } = {};

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const id = Date.now().toString();
  users[username] = { id, username, password };
  const token = generateToken({ id, username });
  res.status(201).json({ token });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken({ id: user.id, username });
  res.json({ token });
});

router.post('/logout', (req, res) => {
  // JWT doesn't have a built-in logout mechanism
  // Client-side should remove the token
  res.json({ message: 'Logged out successfully' });
});

export default router;