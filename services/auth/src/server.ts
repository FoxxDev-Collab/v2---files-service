import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import logger from '../../../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/auth', authRoutes);

const server = app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Error connecting to the database:', err);
  } else {
    logger.info('Successfully connected to the database');
  }
});

logger.info('Database connection details:');
logger.info(`DB_USER: ${process.env.DB_USER}`);
logger.info(`DB_HOST: ${process.env.DB_HOST}`);
logger.info(`DB_NAME: ${process.env.DB_NAME}`);
logger.info(`DB_PASSWORD is set: ${!!process.env.DB_PASSWORD}`);
logger.info(`DB_PORT: ${process.env.DB_PORT}`);

export default pool;