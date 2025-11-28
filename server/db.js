const pkg = require("pg");
const { Pool, Client } = pkg;
require("dotenv").config();

const dbUser = process.env.POSTGRES_USER;
const dbPassword = process.env.POSTGRES_PASS;
const dbHost = process.env.POSTGRES_HOST;
const dbPort = process.env.POSTGRES_PORT;
const dbName = process.env.POSTGRES_DB_NAME;

const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: dbPort,
});

const adminPool = new Pool({
  user: dbUser,
  host: dbHost,
  database: "postgres",
  password: dbPassword,
  port: dbPort,
});

async function initiateDatabaseAndLoadData() {
  await dropDatabase(dbName);
  await createDatabase();
  await createTables();
  await loadDemoData();
}

initiateDatabaseAndLoadData();

async function dropDatabase(dbName) {
  const client = await adminPool.connect();
  try {
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1
    `,
      [dbName]
    );

    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`Database '${dbName}' dropped.`);
  } finally {
    client.release();
  }
}

async function createDatabase() {
  if (await testConnection()) {
    return;
  }

  const client = await adminPool.connect();
  try {
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database '${dbName}' created.`);
  } catch (error){
    console.error(`Couldn't create database ${dbName}`);
  }finally {
    client.release();
  }
}

async function testConnection() {
  let client;

  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    console.log("Connected!");
    return true;
  } catch (err) {
    console.error("DB connection failed:", err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

async function createTables() {
  // Basic data table used by the existing sample endpoint.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS count_table (
      id SERIAL PRIMARY KEY,
      value INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      roleId SERIAL PRIMARY KEY,
      role VARCHAR(128) NOT NULL
    );
  `);
  console.log(`Table 'user_roles' created in '${dbName}' database.`);


  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      userId SERIAL PRIMARY KEY,
      emailAddress VARCHAR(256) NOT NULL,
      userName VARCHAR(256) NOT NULL,
      firstName VARCHAR(128) NOT NULL,
      lastName VARCHAR(128) NOT NULL,
      phone VARCHAR(256) NOT NULL,
      affiliation VARCHAR(128) NOT NULL,
      status VARCHAR(128) NOT NULL,
      lastReservation Date,
      roleId INT NOT NULL,
      passwordHash VARCHAR(256) NOT NULL,
      salt VARCHAR(256) NOT NULL,
      FOREIGN KEY (roleId) REFERENCES user_roles(roleId)
    );
  `);
  console.log(`Table 'users' created in '${dbName}' database.`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`
  );


  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_types (
      siteTypeId SERIAL PRIMARY KEY,
      siteType VARCHAR(256) NOT NULL,
      rate DECIMAL(10, 2) NOT NULL,
      maxLength INT NOT NULL
    );
  `);
  console.log(`Table 'site_types' created in '${dbName}' database.`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sites (
      siteId SERIAL PRIMARY KEY,
      siteName VARCHAR(256) NOT NULL,
      siteTypeId INT NOT NULL,
      FOREIGN KEY (siteTypeId) REFERENCES site_types(siteTypeId)
    );
  `);
  console.log(`Table 'sites' created in '${dbName}' database.`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      reservationId SERIAL PRIMARY KEY,
      userId INT NOT NULL,
      siteId INT NOT NULL,
      startDate Date NOT NULL,
      endDate Date NOT NULL,
      notes VARCHAR(256),
      FOREIGN KEY (userId) REFERENCES users(userId),
      FOREIGN KEY (siteId) REFERENCES sites(siteId)
    );
  `);
  console.log(`Table 'reservations' created in '${dbName}' database.`);
}

async function loadDemoData(){  
  const user = {
    emailAddress: "mail@mail.com",
    username: "jdoe",
    firstName: "John",
    lastName: "Doe",
    phone: "8013658521",
    affiliation: "Air Force",
    status: "Active Duty",
    roleId: 1,
    salt: "dingle",
    password: "12345",
  };
  
  const site_types = {
    siteType: "small RV parking",
    rate: 25.0,
    maxLength: 40,
  };
  
  const sites = [
    {
      siteName: "1",
      siteTypeId: 1,
    },
    {
      siteName: "2",
      siteTypeId: 1,
    },
    {
      siteName: "3",
      siteTypeId: 1,
    },
  ];
  
  const reservations = [
    {
      userId: 1,
      siteId: 1,
      startDate: "2025-11-1",
      endDate: "2025-11-14",
      notes: "test 1-1",
    },
    {
      userId: 1,
      siteId: 1,
      startDate: "2025-11-14",
      endDate: "2025-11-20",
      notes: "test 1-2",
    },
    {
      userId: 1,
      siteId: 2,
      startDate: "2025-11-5",
      endDate: "2025-11-14",
      notes: "test 2-1",
    },
    {
      userId: 1,
      siteId: 2,
      startDate: "2025-11-25",
      endDate: "2025-11-30",
      notes: "test 2-2",
    },
  ];

  const demoUsers = [
    {
      email: "admin@example.com",
      username: "admin",
      role: "admin",
      password: "Admin!123",
    },
    {
      email: "employee@example.com",
      username: "employee",
      role: "employee",
      password: "Employee!123",
    },
    {
      email: "customer@example.com",
      username: "customer",
      role: "customer",
      password: "Customer!123",
    },
  ];

  const roles = {
    role: "customer",
  };

  try {
    await pool.query(`
        INSERT INTO site_types
        VALUES ( DEFAULT, '${site_types.siteType}', ${site_types.rate}, ${site_types.maxLength});
      `);
    console.log("Dummy site type 'small RV parking' inserted");

    for (const site of sites) {
      await pool.query(`
        INSERT INTO sites (siteName, siteTypeId)
        VALUES ('${site.siteName}', ${site.siteTypeId});
      `);
      console.log(`Dummy site '${site.siteName}' inserted`);
    }

    await pool.query(`
        INSERT INTO user_roles
        VALUES (DEFAULT, '${roles.role}');
      `);
    console.log(`Dummy role '${roles.role}' inserted`);


    await pool.query(`
        INSERT INTO users (emailAddress, username, firstName, lastName, phone, affiliation, status, roleId, passwordHash, salt)
        VALUES ('${user.emailAddress}', '${user.username}', '${user.firstName}', '${user.lastName}', '${user.phone}', '${user.affiliation}', '${user.status}', ${user.roleId}, md5('${user.password + user.salt}'), '${user.salt}' );
      `);
    console.log(`Dummy user '${user.firstName}' inserted`);

    for (const res of reservations) {
      //console.log(res);
      await pool.query(`
        INSERT INTO reservations
        VALUES (DEFAULT, ${res.userId}, ${res.siteId}, TO_DATE('${res.startDate}', 'YYY-MM-DD'), TO_DATE('${res.endDate}', 'YYY-MM-DD'), '${res.notes}');
      `);
      console.log(`Dummy reservation '${res.notes}' inserted`);
    }

    await pool.end();
    console.log("Database initialization complete!");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

async function getCurrentAvailableSites(start, end) {
  let sql = `
      SELECT
          s.siteId,
          s.siteName,
          t.siteType,
          t.rate,
          (
            COALESCE(
                (
                    SELECT r2.startDate
                    FROM reservations r2
                    WHERE r2.siteId = s.siteId
                      AND r2.startDate >= $1::date --(all resrvations starting after START)
                    ORDER BY r2.startDate
                    LIMIT 1
                ),
                '2099-12-31'::date  -- far future if no reservation exists
            ) - $1::date -- subtract START date
          ) AS daysOpen

      FROM sites s
      Left JOIN site_types t
          on s.siteTypeId = t.siteTypeId
      LEFT JOIN reservations r
          ON s.siteId = r.siteId
          AND r.startDate < $2::date --END
          AND r.endDate > $1::date --START

      WHERE r.siteId IS NULL;
    `;

  const results = await pool.query(sql, [start, end]);
  // NOTE: end must always be at least one day later to account for back-to-back reservations

  //  console.log(results);
  return results.rows;
}

async function activeReservations(date) {
  let sql = `
  select
     u.lastName,
     s.siteId,
     s.siteName,
     ( r.endDate - $1::date ) as DaysLeft,
     r.notes
  FROM sites s
  LEFT JOIN reservations r
      ON s.siteId = r.siteId
      AND r.startDate <= $1::date --startDate is before DATE
      AND r.endDate > $1::date --endDate is after DATE
  LEFT JOIN users u
      ON r.userId = u.userId
  WHERE r.siteId IS NOT NULL; --ensure reservation exists
  `;

  const results = await pool.query(sql, [date]);
  return results.rows;
}

module.exports = { getCurrentAvailableSites, activeReservations };
