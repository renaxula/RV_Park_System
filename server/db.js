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
  // Only drop/recreate if you need a fresh database
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
      emailAddress VARCHAR(256) NOT NULL UNIQUE,
      firstName VARCHAR(128) NOT NULL,
      lastName VARCHAR(128) NOT NULL,
      phone VARCHAR(256) NOT NULL,
      affiliation VARCHAR(128) NOT NULL DEFAULT '',
      status VARCHAR(128) NOT NULL DEFAULT '',
      lastReservation Date,
      roleId INT NOT NULL,
      passwordHash VARCHAR(256),
      salt VARCHAR(256),
      accountStatus VARCHAR(32) NOT NULL DEFAULT 'complete',
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

  // Holidays/Special Events table for admin-defined dates
  await pool.query(`
    CREATE TABLE IF NOT EXISTS holidays (
      holidayId SERIAL PRIMARY KEY,
      name VARCHAR(256) NOT NULL,
      startDate Date NOT NULL,
      endDate Date NOT NULL,
      description VARCHAR(512)
    );
  `);
  console.log(`Table 'holidays' created in '${dbName}' database.`);

  // Payments table for tracking transactions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      paymentId SERIAL PRIMARY KEY,
      reservationId INT NOT NULL,
      userId INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      paymentType VARCHAR(64) NOT NULL,
      paymentStatus VARCHAR(64) NOT NULL DEFAULT 'completed',
      cardLastFour VARCHAR(4),
      transactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      refundAmount DECIMAL(10, 2) DEFAULT 0,
      refundDate TIMESTAMP,
      refundReason VARCHAR(256),
      FOREIGN KEY (reservationId) REFERENCES reservations(reservationId) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(userId)
    );
  `);
  console.log(`Table 'payments' created in '${dbName}' database.`);
}

async function loadDemoData() {
  const users = [
    {
      emailAddress: "mail@mail.com",
      firstName: "John",
      lastName: "Doe",
      phone: "8013658521",
      affiliation: "Air Force",
      status: "Active Duty",
      roleId: 1,
      salt: "dingle",
      password: "12345678",
    },
    {
      emailAddress: "employee@mail.com",
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
      emailAddress: "admin@mail.com",
      firstName: "ADMIN",
      lastName: "DUMMY",
      phone: "1111111111",
      affiliation: "Air Force",
      status: "Active Duty",
      roleId: 3,
      salt: "dingle",
      password: "adminpass",
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
    {
      siteType: "extra Deep",
      rate: 25.0,
      maxLength: 55,
    },
  ];
  //refrence: 1=small, 2=med, 3=large, 4=rental, 5=tent Only, 6=dry, 7=extra Deep
  const sites = [
    {
      siteName: "1",
      siteTypeId: 7,
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
      siteName: "4",
      siteTypeId: 1,
    },
    {
      siteName: "5",
      siteTypeId: 1,
    },
    {
      siteName: "6",
      siteTypeId: 1,
    },
    {
      siteName: "7",
      siteTypeId: 1,
    },
    {
      siteName: "8",
      siteTypeId: 1,
    },
    {
      siteName: "9",
      siteTypeId: 1,
    },
    {
      siteName: "10",
      siteTypeId: 1,
    },
    {
      siteName: "11",
      siteTypeId: 1,
    },
    {
      siteName: "12",
      siteTypeId: 1,
    },
    {
      siteName: "13",
      siteTypeId: 1,
    },
    {
      siteName: "14",
      siteTypeId: 1,
    },
    {
      siteName: "15",
      siteTypeId: 1,
    },
    {
      siteName: "16",
      siteTypeId: 1,
    },
    {
      siteName: "17",
      siteTypeId: 7,
    },
    {
      siteName: "18",
      siteTypeId: 2,
    },
    {
      siteName: "19",
      siteTypeId: 2,
    },
    {
      siteName: "20",
      siteTypeId: 2,
    },
    {
      siteName: "21",
      siteTypeId: 7,
    },
    {
      siteName: "22",
      siteTypeId: 2,
    },
    {
      siteName: "23",
      siteTypeId: 2,
    },
    {
      siteName: "24",
      siteTypeId: 2,
    },
    {
      siteName: "25",
      siteTypeId: 2,
    },
    {
      siteName: "26",
      siteTypeId: 2,
    },
    {
      siteName: "27",
      siteTypeId: 2,
    },
    {
      siteName: "28",
      siteTypeId: 2,
    },
    {
      siteName: "29",
      siteTypeId: 2,
    },
    {
      siteName: "30",
      siteTypeId: 2,
    },
    {
      siteName: "31",
      siteTypeId: 2,
    },
    {
      siteName: "32",
      siteTypeId: 3,
    },
    {
      siteName: "33",
      siteTypeId: 3,
    },
    {
      siteName: "34",
      siteTypeId: 3,
    },
    {
      siteName: "35",
      siteTypeId: 3,
    },
    {
      siteName: "36",
      siteTypeId: 3,
    },
    {
      siteName: "37",
      siteTypeId: 3,
    },
    {
      siteName: "38",
      siteTypeId: 3,
    },
    {
      siteName: "39",
      siteTypeId: 3,
    },
    {
      siteName: "40",
      siteTypeId: 3,
    },
    {
      siteName: "41",
      siteTypeId: 3,
    },
    {
      siteName: "42",
      siteTypeId: 3,
    },
    {
      siteName: "43",
      siteTypeId: 3,
    },
    {
      siteName: "44",
      siteTypeId: 3,
    },
    {
      siteName: "45",
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
    {
      siteName: "dry-2",
      siteTypeId: 6,
    },
    {
      siteName: "dry-3",
      siteTypeId: 6,
    },
    {
      siteName: "dry-4",
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
    {
      userId: 2,
      siteId: 3,
      startDate: "2025-10-1",
      endDate: "2025-10-6",
      notes: "oct stay 3-1",
    },
    {
      userId: 3,
      siteId: 3,
      startDate: "2025-10-8",
      endDate: "2025-10-12",
      notes: "oct stay 3-2",
    },
    {
      userId: 1,
      siteId: 3,
      startDate: "2025-10-15",
      endDate: "2025-10-20",
      notes: "oct stay 3-3",
    },

    // Site 4
    {
      userId: 2,
      siteId: 4,
      startDate: "2025-10-10",
      endDate: "2025-10-18",
      notes: "oct 4-1",
    },
    {
      userId: 3,
      siteId: 4,
      startDate: "2025-11-2",
      endDate: "2025-11-10",
      notes: "nov 4-2",
    },
    {
      userId: 1,
      siteId: 4,
      startDate: "2025-12-5",
      endDate: "2025-12-12",
      notes: "dec 4-3",
    },

    // Site 5
    {
      userId: 2,
      siteId: 5,
      startDate: "2025-10-20",
      endDate: "2025-10-28",
      notes: "oct 5-1",
    },
    {
      userId: 3,
      siteId: 5,
      startDate: "2025-11-15",
      endDate: "2025-11-22",
      notes: "nov 5-2",
    },
    {
      userId: 1,
      siteId: 5,
      startDate: "2025-12-1",
      endDate: "2025-12-4",
      notes: "dec short 5",
    },

    // Site 6
    {
      userId: 3,
      siteId: 6,
      startDate: "2025-10-5",
      endDate: "2025-10-9",
      notes: "oct 6-1",
    },
    {
      userId: 1,
      siteId: 6,
      startDate: "2025-10-22",
      endDate: "2025-10-29",
      notes: "oct 6-2",
    },
    {
      userId: 2,
      siteId: 6,
      startDate: "2025-11-18",
      endDate: "2025-11-25",
      notes: "nov 6-3",
    },

    // Site 7
    {
      userId: 1,
      siteId: 7,
      startDate: "2025-12-10",
      endDate: "2025-12-18",
      notes: "dec 7-1",
    },
    {
      userId: 2,
      siteId: 7,
      startDate: "2025-10-12",
      endDate: "2025-10-16",
      notes: "oct 7-2",
    },
    {
      userId: 3,
      siteId: 7,
      startDate: "2025-11-28",
      endDate: "2025-12-3",
      notes: "nov-dec 7-3",
    },

    // Site 8
    {
      userId: 2,
      siteId: 8,
      startDate: "2025-10-3",
      endDate: "2025-10-7",
      notes: "oct 8-1",
    },
    {
      userId: 3,
      siteId: 8,
      startDate: "2025-11-12",
      endDate: "2025-11-15",
      notes: "nov 8-2",
    },

    // Site 9
    {
      userId: 1,
      siteId: 9,
      startDate: "2025-12-20",
      endDate: "2025-12-30",
      notes: "dec 9",
    },

    // Site 10
    {
      userId: 2,
      siteId: 10,
      startDate: "2025-10-18",
      endDate: "2025-10-24",
      notes: "oct 10-1",
    },
    {
      userId: 3,
      siteId: 10,
      startDate: "2025-11-5",
      endDate: "2025-11-9",
      notes: "nov 10-2",
    },
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
        INSERT INTO users (emailAddress, firstName, lastName, phone, affiliation, status, roleId, passwordHash, salt, accountStatus)
        VALUES ('${u.emailAddress}', '${u.firstName}', '${u.lastName}', '${u.phone}', '${u.affiliation}', '${u.status}', ${u.roleId}, '${passwordHash}', '${u.salt}', 'complete' );
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

    // Sample holidays
    const holidays = [
      {
        name: "Memorial Day Weekend",
        startDate: "2025-05-24",
        endDate: "2025-05-26",
        description: "Federal holiday - expect high occupancy"
      },
      {
        name: "Independence Day",
        startDate: "2025-07-04",
        endDate: "2025-07-06",
        description: "4th of July weekend celebration"
      },
      {
        name: "Labor Day Weekend",
        startDate: "2025-08-30",
        endDate: "2025-09-01",
        description: "End of summer holiday weekend"
      },
      {
        name: "Thanksgiving Week",
        startDate: "2025-11-26",
        endDate: "2025-11-30",
        description: "Thanksgiving holiday period"
      },
      {
        name: "Christmas & New Year",
        startDate: "2025-12-24",
        endDate: "2026-01-02",
        description: "Winter holiday season"
      }
    ];

    for (const h of holidays) {
      await pool.query(`
        INSERT INTO holidays (name, startDate, endDate, description)
        VALUES ($1, $2, $3, $4);
      `, [h.name, h.startDate, h.endDate, h.description]);
      console.log(`Holiday '${h.name}' inserted`);
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

async function findUserById(id) {
  const result = await pool.query(
    `SELECT userId, emailAddress, passwordHash, ur.role, salt
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
    `SELECT userId, emailAddress, passwordHash, ur.role, salt
    FROM users u JOIN
    user_roles ur ON ur.roleid = u.roleid
    WHERE emailAddress = $1`,
    [normalized]
  );
  return result.rows[0] || null;
}

async function createUser({
  email,
  firstName,
  lastName,
  phone,
  affiliation,
  status,
  password,
  role = "customer",
}) {
  const normalizedEmail = email.trim().toLowerCase();
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
    '${await bcrypt.hash(password + salt, 12)}',
    (SELECT DISTINCT roleid from user_roles where role = '${role}'),
    '${salt}')
   RETURNING userid, emailAddress`
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

// Create a guest/pending user with minimal info (no password yet)
async function createGuestUser({ email, firstName, lastName, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFirstName = firstName.trim().toLowerCase();
  const normalizedLastName = lastName.trim().toLowerCase();

  const result = await pool.query(
    `INSERT INTO users (
      emailAddress,
      firstName,
      lastName,
      phone,
      affiliation,
      status,
      passwordHash,
      roleId,
      salt,
      accountStatus
    )
    VALUES ($1, $2, $3, $4, '', '', '', (SELECT DISTINCT roleId FROM user_roles WHERE role = 'customer'), '', 'pending')
    RETURNING userId, emailAddress`,
    [normalizedEmail, normalizedFirstName, normalizedLastName, phone]
  );
  
  return {
    ...result.rows[0],
    role: 'customer',
    accountStatus: 'pending'
  };
}

// Complete a pending guest account by setting password and additional info
async function completeGuestRegistration(userId, { password, affiliation, status }) {
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password + salt, 12);
  const normalizedAffiliation = affiliation?.trim().toLowerCase() || '';
  const normalizedStatus = status?.trim().toLowerCase() || '';

  const result = await pool.query(
    `UPDATE users 
     SET passwordHash = $1, 
         salt = $2, 
         affiliation = $3, 
         status = $4, 
         accountStatus = 'complete'
     WHERE userId = $5
     RETURNING userId, emailAddress`,
    [passwordHash, salt, normalizedAffiliation, normalizedStatus, userId]
  );
  
  return {
    ...result.rows[0],
    role: 'customer',
    accountStatus: 'complete'
  };
}

// Find user by email including account status
async function findUserByEmailWithStatus(email) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  const result = await pool.query(
    `SELECT userId, emailAddress, passwordHash, ur.role, salt, accountStatus
    FROM users u JOIN
    user_roles ur ON ur.roleid = u.roleid
    WHERE emailAddress = $1`,
    [normalized]
  );
  return result.rows[0] || null;
}

async function getAllUsers() {
  const result = await pool.query(
    `SELECT u.userId, u.emailAddress, u.firstName, u.lastName, ur.role, ur.roleId
     FROM users u
     JOIN user_roles ur ON ur.roleId = u.roleId
     ORDER BY u.userId`
  );
  return result.rows;
}

async function updateUserRole(userId, roleId) {
  const result = await pool.query(
    `UPDATE users SET roleId = $1 WHERE userId = $2
     RETURNING userId, emailAddress`,
    [roleId, userId]
  );
  return result.rows[0];
}

async function getRoleByName(roleName) {
  const result = await pool.query(
    `SELECT roleId, role FROM user_roles WHERE role = $1`,
    [roleName]
  );
  return result.rows[0];
}

async function createReservation(reservation) {
  const { userId, siteId, startDate, endDate, notes } = reservation;

  const query = `
    INSERT INTO reservations (userId, siteId, startDate, endDate, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;`;
  const values = [userId, siteId, startDate, endDate, notes || ""];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getReservationsByUser(userId) {
  const query = `
    SELECT r.*, st.sitetype, s.sitename
    FROM reservations r
    join sites s on r.siteid = s.siteid 
    join site_types st on st.sitetypeid = s.sitetypeid 
    WHERE userid = ${userId};`;
  const result = await pool.query(query);
  return result.rows;
}

async function updateReservation(reservationId, updates) {
  const { siteId, startDate, endDate, notes } = updates;

  const query = `
    UPDATE reservations 
    SET siteId = COALESCE($1, siteId),
        startDate = COALESCE($2, startDate),
        endDate = COALESCE($3, endDate),
        notes = COALESCE($4, notes)
    WHERE reservationId = $5
    RETURNING *;
  `;

  const values = [siteId, startDate, endDate, notes, reservationId];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function deleteReservation(reservationId) {
  const query = `
    DELETE FROM reservations 
    WHERE reservationId = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [reservationId]);
  return result.rows[0];
}

async function getReservationById(reservationId) {
  const query = `
    SELECT r.*, st.sitetype, s.sitename, u.emailAddress as email
    FROM reservations r
    JOIN sites s ON r.siteid = s.siteid 
    JOIN site_types st ON st.sitetypeid = s.sitetypeid
    JOIN users u ON r.userid = u.userid
    WHERE r.reservationId = $1;
  `;

  const result = await pool.query(query, [reservationId]);
  return result.rows[0];
}

async function getAllReservations() {
  const query = `
    SELECT r.*, st.sitetype, s.sitename, st.rate, u.emailAddress as email, u.firstname, u.lastname
    FROM reservations r
    JOIN sites s ON r.siteid = s.siteid 
    JOIN site_types st ON st.sitetypeid = s.sitetypeid
    JOIN users u ON r.userid = u.userid
    ORDER BY r.startdate DESC;
  `;

  const result = await pool.query(query);
  return result.rows;
}

// ==================== HOLIDAY FUNCTIONS ====================

async function createHoliday({ name, startDate, endDate, description }) {
  const query = `
    INSERT INTO holidays (name, startDate, endDate, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await pool.query(query, [name, startDate, endDate, description || '']);
  return result.rows[0];
}

async function getAllHolidays() {
  const query = `SELECT * FROM holidays ORDER BY startDate;`;
  const result = await pool.query(query);
  return result.rows;
}

async function getHolidayById(holidayId) {
  const query = `SELECT * FROM holidays WHERE holidayId = $1;`;
  const result = await pool.query(query, [holidayId]);
  return result.rows[0];
}

async function updateHoliday(holidayId, { name, startDate, endDate, description }) {
  const query = `
    UPDATE holidays 
    SET name = COALESCE($1, name),
        startDate = COALESCE($2, startDate),
        endDate = COALESCE($3, endDate),
        description = COALESCE($4, description)
    WHERE holidayId = $5
    RETURNING *;
  `;
  const result = await pool.query(query, [name, startDate, endDate, description, holidayId]);
  return result.rows[0];
}

async function deleteHoliday(holidayId) {
  const query = `DELETE FROM holidays WHERE holidayId = $1 RETURNING *;`;
  const result = await pool.query(query, [holidayId]);
  return result.rows[0];
}

async function checkDateOverlapsHoliday(startDate, endDate) {
  const query = `
    SELECT * FROM holidays 
    WHERE startDate <= $2::date AND endDate >= $1::date;
  `;
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows;
}

// ==================== PAYMENT FUNCTIONS ====================

async function createPayment({ reservationId, userId, amount, paymentType, cardLastFour }) {
  const query = `
    INSERT INTO payments (reservationId, userId, amount, paymentType, cardLastFour, paymentStatus)
    VALUES ($1, $2, $3, $4, $5, 'completed')
    RETURNING *;
  `;
  const result = await pool.query(query, [reservationId, userId, amount, paymentType, cardLastFour]);
  return result.rows[0];
}

async function getPaymentByReservation(reservationId) {
  const query = `SELECT * FROM payments WHERE reservationId = $1;`;
  const result = await pool.query(query, [reservationId]);
  return result.rows[0];
}

async function getPaymentsByUser(userId) {
  const query = `
    SELECT p.*, r.startDate, r.endDate, s.siteName, st.siteType
    FROM payments p
    JOIN reservations r ON p.reservationId = r.reservationId
    JOIN sites s ON r.siteId = s.siteId
    JOIN site_types st ON s.siteTypeId = st.siteTypeId
    WHERE p.userId = $1
    ORDER BY p.transactionDate DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function processRefund(paymentId, refundAmount, refundReason) {
  const query = `
    UPDATE payments 
    SET refundAmount = $2,
        refundDate = CURRENT_TIMESTAMP,
        refundReason = $3,
        paymentStatus = CASE WHEN $2 >= amount THEN 'refunded' ELSE 'partial_refund' END
    WHERE paymentId = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [paymentId, refundAmount, refundReason]);
  return result.rows[0];
}

async function getSiteRate(siteId) {
  const query = `
    SELECT st.rate 
    FROM sites s 
    JOIN site_types st ON s.siteTypeId = st.siteTypeId 
    WHERE s.siteId = $1;
  `;
  const result = await pool.query(query, [siteId]);
  return result.rows[0]?.rate || 0;
}

module.exports = {
  pool,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  getAllUsers,
  updateUserRole,
  getRoleByName,
  getCurrentAvailableSites,
  activeReservations,
  getReservationsByUser,
  createReservation,
  updateReservation,
  deleteReservation,
  getReservationById,
  getAllReservations,
  // Holiday functions
  createHoliday,
  getAllHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
  checkDateOverlapsHoliday,
  // Payment functions
  createPayment,
  getPaymentByReservation,
  getPaymentsByUser,
  processRefund,
  getSiteRate,
  // Guest checkout functions
  createGuestUser,
  completeGuestRegistration,
  findUserByEmailWithStatus,
};
