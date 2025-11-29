const express = require('express');
const cors = require('cors');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

const {
  pool,
  postCountData,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  ensureTables,
  getCurrentAvailableSites,
  activeReservations
} = require('./db.js');


app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.set('trust proxy', 1);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || 'change_me_session_secret',
    resave: false,
    saveUninitialized: false,
    name: 'rvp.sid',
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
      sameSite: 'lax',
      secure: isProd, // enable when behind HTTPS
    },
  })
);

app.use((req, res, next) => {
  res.locals.role = req.session.role;
  res.locals.userId = req.session.userId;
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.userId || req.session.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function establishSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.username = user.username;
      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr);
        resolve();
      });
    });
  });
}

app.get("/", (req, res) => {
  res.status(200).send("Welcome to root URL of Server");
});

app.get("/api/availableSites", async (req, res) => {
  let { startDate, endDate } = req.query;
  if (!startDate) {
    // get TODAY
    const today = new Date();
    startDate = today.toISOString().slice(0, 10);
  }
  if (!endDate) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 1);
    endDate = d.toISOString().slice(0, 10); //if blank we assume we only care about the start day.
  }

  try {
    const results = await getCurrentAvailableSites(startDate, endDate);
    console.log("Available Report Sent");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database Error" });
  }
});

app.get("/api/occupied", async (req, res) => {
  let { date } = req.query;
  if (!date) {
    //if date not provided use today
    const today = new Date();
    startDate = today.toISOString().slice(0, 10);
  }

  try {
    const results = await activeReservations(date);
    console.log("Occupied Report Sent");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database Error" });
  }
});


app.listen(PORT, (error) => {
  if (!error) console.log(`Server is running on http://localhost:${PORT}`);
  else console.log("Error occurred, server can't start:", error);
});
