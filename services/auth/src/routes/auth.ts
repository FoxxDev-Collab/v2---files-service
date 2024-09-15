// services/auth/src/routes/auth.ts

import express from 'express';
import bcrypt from 'bcrypt';
import { generateToken, authMiddleware } from '../auth';
import pool from '../server';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    username: string;
  };
}

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

const isTeamManager = async (req: any, res: express.Response, next: express.NextFunction) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, userId, 'manager']
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have manager permissions for this team' });
    }

    next();
  } catch (error) {
    console.error('Error checking team manager permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const isTeamMember = async (req: any, res: express.Response, next: express.NextFunction) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    next();
  } catch (error) {
    console.error('Error checking team member permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (!user.rows[0].is_active) {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact an administrator.' });
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
    const { first_name, last_name, email, timezone } = req.body;

    console.log('Received profile update request:', req.body);

    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, timezone = $4 WHERE id = $5 RETURNING id, username, email, first_name, last_name, timezone',
      [first_name || '', last_name || '', email, timezone, userId]
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
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, r.name as role, u.is_active 
      FROM users u 
      JOIN roles r ON u.role_id = r.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
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

router.put('/users/:id/status', authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, email, is_active',
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${is_active ? 'enabled' : 'disabled'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

router.put('/users/:id/status', authMiddleware, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    serverErrorResponse(res, error);
  }
});


// Create a new team
router.post('/teams', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const userId = (req as any).user.id;

  if (!name) {
    return res.status(400).json({ message: 'Team name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );
    const team = result.rows[0];

    // Add the creator as a team manager
    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [team.id, userId, 'manager']
    );

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Failed to create team' });
  }
});

// List teams for the authenticated user
router.get('/teams', authMiddleware, async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.created_at, tm.role
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

router.get('/users-for-team', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, first_name, last_name, email 
      FROM users 
      WHERE is_active = true
      ORDER BY username
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users for team:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get team details
router.get('/teams/:teamId', authMiddleware, async (req: AuthenticatedRequest, res: express.Response) => {
  const teamId = req.params.teamId;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if the user is a member of the team and get their role
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const userRole = memberCheck.rows[0].role;

    // Fetch team details
    const teamDetails = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [teamId]
    );

    // Fetch team members
    const teamMembers = await pool.query(
      'SELECT u.id, u.username, u.email, tm.role FROM users u JOIN team_members tm ON u.id = tm.user_id WHERE tm.team_id = $1',
      [teamId]
    );

    res.json({
      ...teamDetails.rows[0],
      members: teamMembers.rows,
      userRole: userRole
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update team details
router.put('/teams/:teamId', authMiddleware, isTeamManager, async (req, res) => {
  const { teamId } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Team name is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE teams SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, teamId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Failed to update team' });
  }
});

// Delete a team
router.delete('/teams/:teamId', authMiddleware, isTeamManager, async (req, res) => {
  const { teamId } = req.params;
  const userId = (req as any).user.id;

  try {
    // Check if the user is a manager of the team
    const managerCheck = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, userId, 'manager']
    );

    if (managerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to delete this team' });
    }

    await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Failed to delete team' });
  }
});

// Add a member to a team
router.post('/teams/:teamId/members', authMiddleware, isTeamManager, async (req, res) => {
  const { teamId } = req.params;
  const { userId, role } = req.body;
  const currentUserId = (req as any).user.id;

  if (!userId || !role) {
    return res.status(400).json({ message: 'User ID and role are required' });
  }

  try {
    // Check if the current user is a manager of the team
    const managerCheck = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, currentUserId, 'manager']
    );

    if (managerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to add members to this team' });
    }

    const result = await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [teamId, userId, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ message: 'Failed to add team member' });
  }
});

// Remove a member from a team
router.delete('/teams/:teamId/members/:userId', authMiddleware, isTeamManager, async (req, res) => {
  const { teamId, userId } = req.params;
  const currentUserId = (req as any).user.id;

  try {
    // Check if the current user is a manager of the team
    const managerCheck = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, currentUserId, 'manager']
    );

    if (managerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to remove members from this team' });
    }

    await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId]);
    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ message: 'Failed to remove team member' });
  }
});

// Update a member's role in a team
router.put('/teams/:teamId/members/:userId/role', authMiddleware, isTeamManager, async (req, res) => {
  const { teamId, userId } = req.params;
  const { role } = req.body;
  const currentUserId = (req as any).user.id;

  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }

  try {
    // Check if the current user is a manager of the team
    const managerCheck = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, currentUserId, 'manager']
    );

    if (managerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to update member roles in this team' });
    }

    const result = await pool.query(
      'UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3 RETURNING *',
      [role, teamId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating team member role:', error);
    res.status(500).json({ message: 'Failed to update team member role' });
  }
});


export default router;