const pkg = require("pg");
const { Pool } = pkg;
require("dotenv").config();
const bcrypt = require("bcrypt");

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
    await client.query(
      `
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
  } catch (error) {
    console.error(`Couldn't create database ${dbName}`);
  } finally {
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

async function loadDemoData() {
  const users = [
    {
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
    },
    {
      // Feel free to change any of the following user details, I just copy pasted the above mostly
      emailAddress: "mail2@mail.com",
      username: "employee1",
      firstName: "EMPLOYEE",
      lastName: "DUMMY",
      phone: "8013658521",
      affiliation: "Air Force",
      status: "Active Duty",
      roleId: 2,
      salt: "dingle",
      password: "password",
    },
    {
      emailAddress: "mail3@mail.com",
      username: "admin",
      firstName: "ADMIN",
      lastName: "DUMMY",
      phone: "1111111111",
      affiliation: "Air Force",
      status: "Active Duty",
      roleId: 3,
      salt: "dingle",
      password: "admin",
    },
  ];

  const site_types = [
    {
      siteType: "small RV parking",
      rate: 25.0,
      maxLength: 40,
    },
    {
      siteType: "medium RV parking",
      rate: 25.0,
      maxLength: 43,
    },
    {
      siteType: "large RV parking",
      rate: 25.0,
      maxLength: 65,
    },
    {
      siteType: "RV rental",
      rate: 30.0,
      maxLength: 0,
    },
    {
      siteType: "tent",
      rate: 17.0,
      maxLength: 0,
    },
    {
      siteType: "dry storage",
      rate: 5.0,
      maxLength: 0,
    },
  ];
  //refrence: 1=small, 2=med, 3=large, 4=rental, 5=tent Only, 6=dry
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
    {
      siteName: "17",
      siteTypeId: 2,
    },
    {
      siteName: "18",
      siteTypeId: 2,
    },
    {
      siteName: "32",
      siteTypeId: 3,
    },
    {
      siteName: "11B",
      siteTypeId: 4,
    },
    {
      siteName: "12B",
      siteTypeId: 4,
    },
    {
      siteName: "Tent Only",
      siteTypeId: 5,
    },
    {
      siteName: "dry-1",
      siteTypeId: 6,
    },
  ];

  const reservations = [
  // --- Original Reservations ---
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

  // --- New Reservations (siteId 1–10 only) ---

  // Site 3
  { userId: 2, siteId: 3, startDate: "2025-10-1", endDate: "2025-10-6", notes: "oct stay 3-1" },
  { userId: 3, siteId: 3, startDate: "2025-10-8", endDate: "2025-10-12", notes: "oct stay 3-2" },
  { userId: 1, siteId: 3, startDate: "2025-10-15", endDate: "2025-10-20", notes: "oct stay 3-3" },

  // Site 4
  { userId: 2, siteId: 4, startDate: "2025-10-10", endDate: "2025-10-18", notes: "oct 4-1" },
  { userId: 3, siteId: 4, startDate: "2025-11-2", endDate: "2025-11-10", notes: "nov 4-2" },
  { userId: 1, siteId: 4, startDate: "2025-12-5", endDate: "2025-12-12", notes: "dec 4-3" },

  // Site 5
  { userId: 2, siteId: 5, startDate: "2025-10-20", endDate: "2025-10-28", notes: "oct 5-1" },
  { userId: 3, siteId: 5, startDate: "2025-11-15", endDate: "2025-11-22", notes: "nov 5-2" },
  { userId: 1, siteId: 5, startDate: "2025-12-1", endDate: "2025-12-4", notes: "dec short 5" },

  // Site 6
  { userId: 3, siteId: 6, startDate: "2025-10-5", endDate: "2025-10-9", notes: "oct 6-1" },
  { userId: 1, siteId: 6, startDate: "2025-10-22", endDate: "2025-10-29", notes: "oct 6-2" },
  { userId: 2, siteId: 6, startDate: "2025-11-18", endDate: "2025-11-25", notes: "nov 6-3" },

  // Site 7
  { userId: 1, siteId: 7, startDate: "2025-12-10", endDate: "2025-12-18", notes: "dec 7-1" },
  { userId: 2, siteId: 7, startDate: "2025-10-12", endDate: "2025-10-16", notes: "oct 7-2" },
  { userId: 3, siteId: 7, startDate: "2025-11-28", endDate: "2025-12-3", notes: "nov-dec 7-3" },

  // Site 8
  { userId: 2, siteId: 8, startDate: "2025-10-3", endDate: "2025-10-7", notes: "oct 8-1" },
  { userId: 3, siteId: 8, startDate: "2025-11-12", endDate: "2025-11-15", notes: "nov 8-2" },

  // Site 9
  { userId: 1, siteId: 9, startDate: "2025-12-20", endDate: "2025-12-30", notes: "dec 9" },

  // Site 10
  { userId: 2, siteId: 10, startDate: "2025-10-18", endDate: "2025-10-24", notes: "oct 10-1" },
  { userId: 3, siteId: 10, startDate: "2025-11-5", endDate: "2025-11-9", notes: "nov 10-2" }
];


  const roles = [
    {
      role: "customer",
    },
    {
      role: "employee",
    },
    {
      role: "admin",
    },
  ];

  try {
    for (const t of site_types) {
      await pool.query(`
        INSERT INTO site_types
        VALUES ( DEFAULT, '${t.siteType}', ${t.rate}, ${t.maxLength});
      `);
      console.log(`Dummy site type '${t.siteType}' inserted`);
    }

    for (const site of sites) {
      await pool.query(`
        INSERT INTO sites (siteName, siteTypeId)
        VALUES ('${site.siteName}', ${site.siteTypeId});
      `);
      console.log(`Dummy site '${site.siteName}' inserted`);
    }

    for (const r of roles) {
      await pool.query(`
        INSERT INTO user_roles
        VALUES (DEFAULT, '${r.role}');
      `);
      console.log(`Dummy role '${r.role}' inserted`);
    }

    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password + u.salt, 12);
      await pool.query(`
        INSERT INTO users (emailAddress, username, firstName, lastName, phone, affiliation, status, roleId, passwordHash, salt)
        VALUES ('${u.emailAddress}', '${u.username}', '${u.firstName}', '${u.lastName}', '${u.phone}', '${u.affiliation}', '${u.status}', ${u.roleId}, '${passwordHash}', '${u.salt}' );
      `);
      console.log(`Dummy user '${u.firstName}' inserted`);
    }

    for (const res of reservations) {
      //console.log(res);
      await pool.query(`
        INSERT INTO reservations
        VALUES (DEFAULT, ${res.userId}, ${res.siteId}, TO_DATE('${res.startDate}', 'YYY-MM-DD'), TO_DATE('${res.endDate}', 'YYY-MM-DD'), '${res.notes}');
      `);
      console.log(`Dummy reservation '${res.notes}' inserted`);
    }

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
     r.startDate,
     r.endDate,
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

async function findUserByUsername(username) {
  const normalized = username?.trim().toLowerCase();
  if (!normalized) return null;
  const result = await pool.query(
    `SELECT userId, emailAddress, username, passwordhash, ur.role, salt
      FROM users u join
      user_roles ur on ur.roleid = u.roleid
      WHERE username = $1`,
    [normalized]
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    `SELECT userId, emailAddress, username, passwordHash, ur.role, salt
    FROM users u JOIN
    user_roles ur ON ur.roleid = u.roleid
    WHERE userId = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const result = await pool.query(
    `SELECT userId, emailAddress, username, passwordHash, ur.role, salt
    FROM users u JOIN
    user_roles ur ON ur.roleid = u.roleid
    WHERE emailAddress = $1`,
    [normalized]
  );
  return result.rows[0] || null;
}

async function createUser({
  email,
  username,
  firstName,
  lastName,
  phone,
  affiliation,
  status,
  password,
  role = "customer",
}) {
  console.log("First name: ", lastName);
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedFirstName = firstName.trim().toLowerCase();
  const normalizedLastName = lastName.trim().toLowerCase();
  const normalizedAffiliation = affiliation.trim().toLowerCase();
  const normalizedStatus = status.trim().toLowerCase();
  const salt = await bcrypt.genSalt(12);

  const result = await pool.query(
    `INSERT INTO users (
    emailAddress,
    firstName,
    lastName,
    phone,
    affiliation,
    status,
    username,
    passwordHash,
    roleid,
    salt
   )
   VALUES (
    '${normalizedEmail}',
    '${normalizedFirstName}',
    '${normalizedLastName}',
    ${phone},
    '${normalizedAffiliation}',
    '${normalizedStatus}',
    '${normalizedUsername}',
    '${await bcrypt.hash(password + salt, 12)}',
    (SELECT DISTINCT roleid from user_roles where role = '${role}'),
    '${salt}')
   RETURNING userid, emailAddress, username`
  );
  const resultWithRole = {
    ...result.rows[0],
    role: role,
  };
  return resultWithRole;
}

async function updateUserPassword(userId, passwordHash) {
  await pool.query("UPDATE users SET passwordHash = $1 WHERE userid = $2", [
    passwordHash,
    userId,
  ]);
}

async function createReservation(reservation) {
  const {
    userId,
    siteId,
    reservationDate,
    startTime,
    endTime,
  } = reservation;

  const query = `
    INSERT INTO reservations (userId, siteId, reservationDate, startTime, endTime)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;`
  ;

  const values = [userId, siteId, reservationDate, startTime, endTime];

  const result = await pool.query(query, values);
  return result.rows[0];
}


async function getReservationsByUser(userId) {
  const query = `
    SELECT r.*, st.sitetype, s.sitename
    FROM reservations r
    join sites s on r.siteid = s.siteid 
    join site_types st on st.sitetypeid = s.sitetypeid 
    WHERE userid = ${userId};`
  ;

  const result = await pool.query(query);
  return result.rows;
}

module.exports = {
  pool,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  getCurrentAvailableSites,
  activeReservations,
  getReservationsByUser,
  createReservation
};
