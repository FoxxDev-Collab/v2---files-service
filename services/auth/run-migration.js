const path = require('path');
require('dotenv').config();
const migrate = require('node-pg-migrate').default;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
};

const databaseUrl = `postgres://${dbConfig.user}:${encodeURIComponent(dbConfig.password)}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

async function runMigration() {
  try {
    await migrate({
      databaseUrl: databaseUrl,
      schema: 'newcloud_schema',
      migrationsTable: 'pgmigrations',
      dir: 'migrations',
      direction: 'up',
      count: Infinity,
    });
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();