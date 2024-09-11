// services/auth/src/routes/auth.ts

import express from 'express';
import bcrypt from 'bcrypt';
import { generateToken, authMiddleware } from '../auth';
import pool from '../db';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
})

const upload = multer({ storage: storage });

router.post('/register', async (req, res) => {
  const { username, email, password, firstName, lastName, timezone } = req.body;

  if (!username || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Username, password, first name, and last name are required' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email exists if provided
    if (email) {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get the 'user' role id
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['user']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({ message: 'Default role not found' });
    }
    const roleId = roleResult.rows[0].id;

    // Insert new user with the 'user' role
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, first_name, last_name, timezone, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username',
      [username, email || null, hashedPassword, firstName, lastName, timezone || 'America/Boise', roleId]
    );

    const token = generateToken({ id: newUser.rows[0].id, username: newUser.rows[0].username });
    res.status(201).json({ token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
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

/* router.get('/profile', authMiddleware, async (req, res) => {
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
*/

router.get('/profile', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const result = await pool.query(
        'SELECT u.id, u.username, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      console.log('Profile data:', result.rows[0]); // Add this line
  
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

  const isSiteAdmin = async (req: any, res: any, next: any) => {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [userId]
    );
    if (result.rows[0]?.name === 'site_admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  };
  
  // Middleware to check if user is an application admin or site admin
  const isAdmin = async (req: any, res: any, next: any) => {
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
  };
  
  // Route to get all users (admin only)
  router.get('/users', authMiddleware, isAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT u.id, u.username, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Route to update user role (site admin only)
  router.put('/users/:id/role', authMiddleware, isSiteAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
  
    try {
      const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid role' });
      }
  
      const roleId = roleResult.rows[0].id;
      await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, id]);
      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.put('/users/:id/role', authMiddleware, isSiteAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
  
    try {
      // Check if the role is valid
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
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

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
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Server error during avatar upload' });
    }
  });
  
  // Update the existing /profile PUT route
  router.put('/profile', authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { firstName, lastName, email, timezone } = req.body;
  
      const result = await pool.query(
        'UPDATE users SET first_name = $1, last_name = $2, email = $3, timezone = $4 WHERE id = $5 RETURNING id, username, email, first_name, last_name, timezone, profile_picture_url',
        [firstName, lastName, email, timezone, userId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error during profile update' });
    }
  });

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
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Server error during avatar upload' });
    }
  });

export default router;