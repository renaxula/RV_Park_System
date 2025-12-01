const express = require("express");
const cors = require("cors");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcrypt");

const {
  pool,
  postCountData,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  getCurrentAvailableSites,
  activeReservations,
} = require("./db.js");

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.set("trust proxy", 1);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "change_me_session_secret",
    resave: false,
    saveUninitialized: false,
    name: "rvp.sid",
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
      sameSite: "lax",
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
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.userId || req.session.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

function establishSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.userid;
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

app.post("/auth/register", async (req, res) => {
  const { email, username, password, firstName, lastName, phone, affiliation, status } = req.body || {};
  if (!email || !username || !password || !firstName || !lastName || !phone || !affiliation || !status) {
    return res
      .status(400)
      .json({ error: "Required fields are missing" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existingUsername = await findUserByUsername(username);
    if (existingUsername)
      return res.status(409).json({ error: "Username already in use" });

    const existingEmail = await findUserByEmail(email);
    if (existingEmail)
      return res.status(409).json({ error: "Email already in use" });

    const newUser = await createUser({ email, username, password, firstName, lastName, phone, affiliation, status });

    console.log("new User:", newUser);
    await establishSession(req, newUser);

    res.status(201).json({
      message: "Registered and logged in",
      user: {
        userId: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(
      password + user.salt,
      user.passwordhash
    );
    if (!validPassword)
      return res.status(401).json({ error: "Invalid credentials" });

    await establishSession(req, user);

    res.json({
      message: "Logged in",
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(200).json({ user: null });
  }
  res.json({
    user: {
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role,
    },
  });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("rvp.sid");
    res.json({ message: "Logged out" });
  });
});

app.post("/auth/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current and new passwords are required" });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await findUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const validPassword = await bcrypt.compare(
      currentPassword + user.salt,
      user.passwordhash
    );
    if (!validPassword)
      return res.status(401).json({ error: "Invalid current password" });

    const passwordHash = await bcrypt.hash(newPassword + user.salt, 12);
    await updateUserPassword(user.userid, passwordHash);

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only endpoint to set a temporary password for any user by username or email.
app.post("/admin/reset-password", requireRole("admin"), async (req, res) => {
  const { account, newPassword } = req.body || {};
  if (!account || !newPassword) {
    return res
      .status(400)
      .json({ error: "Account and new password are required" });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
  }

  try {
    const targetAccount = account.trim().toLowerCase();
    const user = targetAccount.includes("@")
      ? await findUserByEmail(targetAccount)
      : await findUserByUsername(targetAccount);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(newPassword + user.salt, 12);
    await updateUserPassword(user.userid, passwordHash);

    res.json({
      message: "Temporary password set",
      user: { userId: user.userId, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/server/count", requireAuth, async (req, res) => {
  const { count } = req.body;
  if (typeof count !== "number") {
    return res.status(400).json({ error: "Count must be a number" });
  }

  try {
    const newRow = await postCountData(count);
    res.status(201).json({ message: "Count saved", data: newRow });
  } catch (err) {
    console.error("Error saving count:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//please dont delete this again...
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
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database Error" });
  }
});


app.post('/reservations', async (req, res) => {
  try {
    const reservation = await createReservation(req.body);
    res.status(201).json({
      message: "Reservation created",
      reservation
    });
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/reservations/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const reservations = await getReservationsByUser(userId);
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

app.get("/available-spots", async (req, res) => {
  try {
    const spots = await getAvailableSites();
    res.json(spots);
  } catch (err) {
    console.error("Error fetching available spots:", err);
    res.status(500).json({ error: "Failed to fetch available spots" });
  }
});

app.listen(PORT, (error) => {
  if (!error) console.log(`Server is running on http://localhost:${PORT}`);
  else console.log("Error occurred, server can't start:", error);
});
