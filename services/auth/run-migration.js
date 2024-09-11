const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function verifyAndCreateSchema() {
  const client = await pool.connect();
  try {
    console.log('Successfully connected to the database');

    // Check search_path
    const searchPathResult = await client.query('SHOW search_path');
    console.log('Current search_path:', searchPathResult.rows[0].search_path);

    // List all schemas
    const allSchemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'
    `);
    console.log('Available schemas:', allSchemasResult.rows.map(row => row.schema_name));

    // Check if the schema exists
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'newcloud_schema'
    `);
    
    if (schemaResult.rows.length > 0) {
      console.log('newcloud_schema exists');
    } else {
      console.log('newcloud_schema does not exist, attempting to create...');
      await client.query('CREATE SCHEMA IF NOT EXISTS newcloud_schema');
      console.log('newcloud_schema created');
    }

    // Set search_path to include newcloud_schema
    await client.query('SET search_path TO newcloud_schema, public');
    console.log('Set search_path to include newcloud_schema');

    // Check user permissions
    const permissionsResult = await client.query(`
      SELECT has_schema_privilege('${process.env.DB_USER}', 'newcloud_schema', 'CREATE')
    `);
    console.log('User has CREATE permission on newcloud_schema:', permissionsResult.rows[0].has_schema_privilege);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAndCreateSchema();