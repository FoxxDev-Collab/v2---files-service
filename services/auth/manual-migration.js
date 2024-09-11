const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function addProfilePictureColumn() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Set search_path
    await client.query('SET search_path TO newcloud_schema, public');

    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'newcloud_schema' 
      AND table_name = 'users' 
      AND column_name = 'profile_picture_url'
    `;
    const checkResult = await client.query(checkColumnQuery);

    if (checkResult.rows.length === 0) {
      // Add the column if it doesn't exist
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN profile_picture_url VARCHAR(255)
      `);
      console.log('Added profile_picture_url column');

      // Set default value for existing rows
      await client.query(`
        UPDATE users 
        SET profile_picture_url = '/default-avatar.png' 
        WHERE profile_picture_url IS NULL
      `);
      console.log('Set default value for profile_picture_url');
    } else {
      console.log('profile_picture_url column already exists');
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

addProfilePictureColumn();