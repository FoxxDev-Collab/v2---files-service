// services/auth/src/server.ts

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import path from 'path';

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

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));