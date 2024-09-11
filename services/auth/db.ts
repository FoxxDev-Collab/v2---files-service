import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  options: '-c search_path=newcloud_schema,public'
};

const pool = new Pool(poolConfig);

export default pool;