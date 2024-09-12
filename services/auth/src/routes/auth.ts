// services/auth/src/routes/auth.ts

import express from 'express';
import bcrypt from 'bcrypt';
import { generateToken, authMiddleware } from '../auth';
import pool from '../server';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// File upload configuration
const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function for server error responses
const serverErrorResponse = (res: express.Response, error: any) => {
  console.error('Server error:', error);
  res.status(500).json({ message: 'Internal server error' });
};

// User registration
router.post('/register', async (req, res) => {
  const { username, email, password, firstName, lastName, timezone } = req.body;

  if (!username || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Username, password, first name, and last name are required' });
  }

  try {
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM newcloud_schema.users WHERE username = $1 OR email = $2', [username, email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get the 'user' role id
    const roleResult = await pool.query('SELECT id FROM newcloud_schema.roles WHERE name = $1', ['user']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({ message: 'Default role not found' });
    }
    const roleId = roleResult.rows[0].id;

    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO newcloud_schema.users (username, email, password, first_name, last_name, timezone, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username',
      [username, email, hashedPassword, firstName, lastName, timezone || 'America/Boise', roleId]
    );

    const token = generateToken({ id: newUser.rows[0].id, username: newUser.rows[0].username });
    res.status(201).json({ token });
  } catch (error) {
    serverErrorResponse(res, error);
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM newcloud_schema.users WHERE username = $1', [username]);

    if (user.rows.length === 0 || !(await bcrypt.compare(password, user.rows[0].password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.rows[0].id, username: user.rows[0].username });
    res.json({ token });
  } catch (error) {
    serverErrorResponse(res, error);
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query(
      'SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.timezone, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    serverErrorResponse(res, error);
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { firstName, lastName, email, timezone } = req.body;

    console.log('Received profile update request:', req.body);

    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, timezone = $4 WHERE id = $5 RETURNING id, username, email, first_name, last_name, timezone',
      [firstName, lastName, email, timezone, userId]
    );

    if (result.rows.length === 0) {
      console.log('User not found for update');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated user:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!(await bcrypt.compare(currentPassword, user.rows[0].password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    serverErrorResponse(res, error);
  }
});

// Upload avatar
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const userId = (req as any).user.id;
    const profilePictureUrl = `/uploads/${req.file.filename}`;
    
    await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [profilePictureUrl, userId]);
    
    res.json({ profilePictureUrl });
  } catch (error) {
    serverErrorResponse(res, error);
  }
});

// Admin middleware
const isAdmin = async (req: any, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [userId]
    );
    if (['site_admin', 'application_admin'].includes(result.rows[0]?.name)) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  } catch (error) {
    serverErrorResponse(res, error);
  }
};

// Get all users (admin only)
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT u.id, u.username, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');
    res.json(result.rows);
  } catch (error) {
    serverErrorResponse(res, error);
  }
});

// Update user role (admin only)
router.put('/users/:id/role', authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const validRoles = ['user', 'application_admin', 'site_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const roleId = roleResult.rows[0].id;
    await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    serverErrorResponse(res, error);
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the user exists
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    serverErrorResponse(res, error);
  }
});


export default router;