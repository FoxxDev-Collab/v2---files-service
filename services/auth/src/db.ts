// services/auth/src/db.ts

import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'newcloud_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'newcloud',
  password: process.env.DB_PASSWORD || 'NOTthisday@@22',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export default pool;