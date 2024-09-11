const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkPermissions() {
  const client = await pool.connect();
  try {
    // Set search_path
    await client.query('SET search_path TO newcloud_schema, public');

    // Check table ownership
    const ownershipQuery = `
      SELECT tableowner 
      FROM pg_tables 
      WHERE schemaname = 'newcloud_schema' AND tablename = 'users'
    `;
    const ownershipResult = await client.query(ownershipQuery);
    console.log('Table owner:', ownershipResult.rows[0]?.tableowner);

    // Check user permissions
    const permissionsQuery = `
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'newcloud_schema' 
      AND table_name = 'users' 
      AND grantee = $1
    `;
    const permissionsResult = await client.query(permissionsQuery, [process.env.DB_USER]);
    console.log('User permissions:', permissionsResult.rows);

    // Check if user is a superuser
    const superuserQuery = `
      SELECT rolsuper 
      FROM pg_roles 
      WHERE rolname = $1
    `;
    const superuserResult = await client.query(superuserQuery, [process.env.DB_USER]);
    console.log('Is superuser:', superuserResult.rows[0]?.rolsuper);

  } catch (err) {
    console.error('Error checking permissions:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPermissions();