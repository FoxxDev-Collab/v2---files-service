"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../../../utils/logger"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use('/auth', auth_1.default);
const server = app.listen(PORT, () => {
    logger_1.default.info(`Auth service running on port ${PORT}`);
});
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
pool.on('error', (err) => {
    logger_1.default.error('Unexpected error on idle client', err);
});
// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        logger_1.default.error('Error connecting to the database:', err);
    }
    else {
        logger_1.default.info('Successfully connected to the database');
    }
});
logger_1.default.info('Database connection details:');
logger_1.default.info(`DB_USER: ${process.env.DB_USER}`);
logger_1.default.info(`DB_HOST: ${process.env.DB_HOST}`);
logger_1.default.info(`DB_NAME: ${process.env.DB_NAME}`);
logger_1.default.info(`DB_PASSWORD is set: ${!!process.env.DB_PASSWORD}`);
logger_1.default.info(`DB_PORT: ${process.env.DB_PORT}`);
exports.default = pool;
