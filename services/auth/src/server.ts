// services/auth/src/server.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

const app = express();
const PORT = process.env.PORT || 3001;

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

const pool = new Pool({
  user: process.env.DB_USER || 'newcloud_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'newcloud',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  options: '-c search_path=newcloud_schema,public'
});

// Add this for debugging
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

console.log('Database connection details:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[REDACTED]' : 'Not set');
console.log('DB_PORT:', process.env.DB_PORT);