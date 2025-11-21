const pkg = require('pg');
const bcrypt = require('bcrypt');
const { Pool, Client } = pkg;
require('dotenv').config();

const dbUser = process.env.POSTGRES_USER;
const dbPassword = process.env.POSTGRES_PASS;
const dbHost = process.env.POSTGRES_HOST;
const dbPort = process.env.POSTGRES_PORT;
const dbName = process.env.POSTGRES_DB_NAME;

// Optional elevated credentials just for creating the database if it does not exist.
// If not provided, we will reuse the normal creds (may fail with permission denied).
const createDbUser = process.env.POSTGRES_SUPER_USER || dbUser;
const createDbPassword = process.env.POSTGRES_SUPER_PASS || dbPassword;

// Main pool used by the app and the session store.
const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: dbPort,
});

async function ensureDatabaseExists() {
  const client = new Client({
    user: createDbUser,
    host: dbHost,
    database: 'postgres',
    password: createDbPassword,
    port: dbPort,
  });

  await client.connect();
  try {
    const dbCheck = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (dbCheck.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created.`);
    }
  } finally {
    await client.end();
  }
}

async function ensureTables() {
  // Basic data table used by the existing sample endpoint.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS count_table (
      id SERIAL PRIMARY KEY,
      value INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`);
}

async function seedDemoUsers() {
  const demoUsers = [
    { email: 'admin@example.com', username: 'admin', role: 'admin', password: 'Admin!123' },
    { email: 'employee@example.com', username: 'employee', role: 'employee', password: 'Employee!123' },
    { email: 'customer@example.com', username: 'customer', role: 'customer', password: 'Customer!123' },
  ];

  for (const user of demoUsers) {
    const normalizedEmail = user.email.trim().toLowerCase();
    const normalizedUsername = user.username.trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [normalizedUsername]);
    if (existing.rowCount > 0) continue;

    const passwordHash = await bcrypt.hash(user.password, 12);
    await pool.query(
      'INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, $4)',
      [normalizedEmail, normalizedUsername, passwordHash, user.role]
    );
    console.log(`Seeded demo user '${normalizedUsername}' with role '${user.role}'.`);
  }
}

// Initialize database and tables once on startup.
ensureDatabaseExists()
  .then(() => ensureTables())
  .then(() => seedDemoUsers())
  .then(() => console.log('Database initialization complete!'))
  .catch((err) => {
    if (err.code === '42501') {
      console.error(
        'Permission denied creating database. Provide POSTGRES_SUPER_USER/POSTGRES_SUPER_PASS env vars or create the DB manually.'
      );
    }
    console.error('Error initializing database:', err);
  });

async function postCountData(count) {
  const result = await pool.query(
    'INSERT INTO count_table (value) VALUES ($1) RETURNING *',
    [count]
  );
  return result.rows[0];
}

async function findUserByUsername(username) {
  const normalized = username?.trim().toLowerCase();
  if (!normalized) return null;
  const result = await pool.query(
    'SELECT id, email, username, password_hash, role FROM users WHERE username = $1',
    [normalized]
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    'SELECT id, email, username, password_hash, role FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const result = await pool.query(
    'SELECT id, email, username, password_hash, role FROM users WHERE email = $1',
    [normalized]
  );
  return result.rows[0] || null;
}

async function createUser({ email, username, passwordHash, role = 'customer' }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  const result = await pool.query(
    'INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, username, role, created_at',
    [normalizedEmail, normalizedUsername, passwordHash, role]
  );

  return result.rows[0];
}

async function updateUserPassword(userId, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
}

module.exports = {
  pool,
  postCountData,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
};
