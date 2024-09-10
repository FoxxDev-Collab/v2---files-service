// services/auth/src/routes/auth.ts

import express from 'express';
import { generateToken, authMiddleware } from '../auth';

const router = express.Router();

// Mock user data (replace with database in production)
const users: { [key: string]: { id: string; username: string; password: string; email: string } } = {};

// ... (keep existing register and login routes)

router.post('/register', (req, res) => {
    console.log('Received registration request');
    const { username, password } = req.body;
    
    console.log('Registration data:', { username, password: password ? '[REDACTED]' : undefined });
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    if (users[username]) {
      console.log('User already exists:', username);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const id = Date.now().toString();
    users[username] = { id, username, password, email: '' };
    
    console.log('User registered successfully:', username);
    
    const token = generateToken({ id, username });
    res.status(201).json({ token });
  });
  

router.get('/profile', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const userDetails = users[user.username];
  if (!userDetails) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ username: userDetails.username, email: userDetails.email });
});


router.put('/profile', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { username, email } = req.body;
  
  if (username && username !== user.username && users[username]) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  const userDetails = users[user.username];
  if (!userDetails) {
    return res.status(404).json({ message: 'User not found' });
  }

  userDetails.username = username || userDetails.username;
  userDetails.email = email || userDetails.email;

  if (username && username !== user.username) {
    users[username] = users[user.username];
    delete users[user.username];
  }

  res.json({ message: 'Profile updated successfully' });
});

export default router;