const pkg = require('pg');
const { Pool, Client } = pkg;

const dbUser = 'alexanderschott';
const dbPassword = '12345';
const dbHost = 'localhost';
const dbPort = 5432;
const dbName = 'count';

async function initiateDatabase(){
  // Connect to default DB
  const client = new Client({
    user: dbUser,
    host: dbHost,
    database: 'postgres',
    password: dbPassword,
    port: dbPort,
  });

  try {
    await client.connect();

    // Terminate connections to the 'count' DB
    await client.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = '${dbName}';
    `);

    // Drop the database if it exists
    await client.query(`DROP DATABASE IF EXISTS ${dbName};`);
    console.log(`Database '${dbName}' dropped.`);

    // Create the database
    await client.query(`CREATE DATABASE ${dbName};`);
    console.log(`Database '${dbName}' created.`);

    await client.end();

    // Now connect to the new database to create the table
    const pool = new Pool({
      user: dbUser,
      host: dbHost,
      database: dbName,
      password: dbPassword,
      port: dbPort,
    });

    await pool.query(`
      CREATE TABLE count_table (
        id SERIAL PRIMARY KEY,
        value INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log(`Table 'count_table' created in '${dbName}' database.`);

    await pool.end();
    console.log('Database initialization complete!');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initiateDatabase();

const pool = new Pool({
  user: 'alexanderschott',
  host: 'localhost',
  database: 'count',
  password: '12345',
  port: 5432,
});

async function postCountData(count) {
  const result = await pool.query(
    'INSERT INTO count_table (value) VALUES ($1) RETURNING *',
    [count]
  );
  return result.rows[0];
}

module.exports = { postCountData };