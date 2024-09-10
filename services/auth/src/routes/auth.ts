// services/auth/src/routes/auth.ts

import express from 'express';
import bcrypt from 'bcrypt';
import { generateToken, authMiddleware } from '../auth';
import pool from '../db';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username',
      [username, hashedPassword, email]
    );

    const token = generateToken({ id: newUser.rows[0].id, username: newUser.rows[0].username });
    res.status(201).json({ token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.rows[0].id, username: user.rows[0].username });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { username, email } = req.body;

    // Check if username already exists
    if (username) {
      const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Update user profile
    const result = await pool.query(
      'UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email) WHERE id = $3 RETURNING id, username, email',
      [username, email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;
  
      // Fetch the user from the database
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = userResult.rows[0];
  
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the password in the database
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);
  
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

export default router;