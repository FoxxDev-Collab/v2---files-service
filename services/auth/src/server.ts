// services/auth/src/server.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import path from 'path';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3001;

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
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD), // Explicitly cast to string
  port: parseInt(process.env.DB_PORT || '5432'),
});

export default pool;