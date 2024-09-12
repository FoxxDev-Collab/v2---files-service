"use strict";
// services/auth/src/routes/auth.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../auth");
const server_1 = __importDefault(require("../server"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// File upload configuration
const uploadDir = path_1.default.join(__dirname, '..', 'uploads');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({ storage });
// Ensure upload directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Helper function for server error responses
const serverErrorResponse = (res, error) => {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Internal server error' });
};
// User registration
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, firstName, lastName, timezone } = req.body;
    if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Username, password, first name, and last name are required' });
    }
    try {
        // Check if user already exists
        const userExists = yield server_1.default.query('SELECT * FROM newcloud_schema.users WHERE username = $1 OR email = $2', [username, email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Username or email already in use' });
        }
        // Hash password
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // Get the 'user' role id
        const roleResult = yield server_1.default.query('SELECT id FROM newcloud_schema.roles WHERE name = $1', ['user']);
        if (roleResult.rows.length === 0) {
            return res.status(500).json({ message: 'Default role not found' });
        }
        const roleId = roleResult.rows[0].id;
        // Insert new user
        const newUser = yield server_1.default.query('INSERT INTO newcloud_schema.users (username, email, password, first_name, last_name, timezone, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username', [username, email, hashedPassword, firstName, lastName, timezone || 'America/Boise', roleId]);
        const token = (0, auth_1.generateToken)({ id: newUser.rows[0].id, username: newUser.rows[0].username });
        res.status(201).json({ token });
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
// User login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield server_1.default.query('SELECT * FROM newcloud_schema.users WHERE username = $1', [username]);
        if (user.rows.length === 0 || !(yield bcrypt_1.default.compare(password, user.rows[0].password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = (0, auth_1.generateToken)({ id: user.rows[0].id, username: user.rows[0].username });
        res.json({ token });
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
// Get user profile
router.get('/profile', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield server_1.default.query('SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.timezone, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
// Update user profile
router.put('/profile', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email, timezone } = req.body;
        const result = yield server_1.default.query('UPDATE users SET first_name = $1, last_name = $2, email = $3, timezone = $4 WHERE id = $5 RETURNING id, username, email, first_name, last_name, timezone, profile_picture_url', [firstName, lastName, email, timezone, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
// Change password
router.put('/change-password', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        const user = yield server_1.default.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!(yield bcrypt_1.default.compare(currentPassword, user.rows[0].password))) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, salt);
        yield server_1.default.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
// Upload avatar
router.post('/upload-avatar', auth_1.authMiddleware, upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
        const userId = req.user.id;
        const profilePictureUrl = `/uploads/${req.file.filename}`;
        yield server_1.default.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [profilePictureUrl, userId]);
        res.json({ profilePictureUrl });
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
// Admin middleware
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.user.id;
        const result = yield server_1.default.query('SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1', [userId]);
        if (['site_admin', 'application_admin'].includes((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.name)) {
            next();
        }
        else {
            res.status(403).json({ message: 'Access denied' });
        }
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
});
// Get all users (admin only)
router.get('/users', auth_1.authMiddleware, isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield server_1.default.query('SELECT u.id, u.username, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');
        res.json(result.rows);
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
// Update user role (admin only)
router.put('/users/:id/role', auth_1.authMiddleware, isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { role } = req.body;
    try {
        const validRoles = ['user', 'application_admin', 'site_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const roleResult = yield server_1.default.query('SELECT id FROM roles WHERE name = $1', [role]);
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const roleId = roleResult.rows[0].id;
        yield server_1.default.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, id]);
        res.json({ message: 'User role updated successfully' });
    }
    catch (error) {
        serverErrorResponse(res, error);
    }
}));
exports.default = router;
