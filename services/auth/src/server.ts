import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

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
  console.log(`Auth service running on port ${PORT}`);
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : undefined,
  port: parseInt(process.env.DB_PORT || '5432'),
  options: '-c search_path=newcloud_schema,public'
});

const uploadDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadDir));

// Use auth routes
app.use('/auth', authRoutes);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database');
  }
});

console.log('Database connection details:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD is set:', !!process.env.DB_PASSWORD);
console.log('DB_PORT:', process.env.DB_PORT);

export default pool;