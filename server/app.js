const express = require("express");
const cors = require("cors");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcrypt");

const {
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
  getAllSiteTypes,
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

// Reservation validation: 14-day limit in peak season (April-October), 6 months advance max
function validateReservationDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  // Check end date is after start date
  if (end <= start) {
    return { valid: false, error: "End date must be after start date" };
  }

  // Check 6 months advance booking limit
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (start > sixMonthsFromNow) {
    return {
      valid: false,
      error: "Reservations can only be made up to 6 months in advance",
    };
  }

  // Calculate duration in days
  const durationMs = end - start;
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  // Check if any part of the reservation falls in peak season (April = 3, October = 9)
  const isPeakSeason = (date) => {
    const month = date.getMonth();
    return month >= 3 && month <= 9; // April (3) to October (9)
  };

  // Check each day of the reservation to see if it touches peak season
  let touchesPeakSeason = false;
  const checkDate = new Date(start);
  while (checkDate < end) {
    if (isPeakSeason(checkDate)) {
      touchesPeakSeason = true;
      break;
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  // If reservation touches peak season, limit to 14 days
  if (touchesPeakSeason && durationDays > 14) {
    return {
      valid: false,
      error:
        "Reservations during peak season (April - October) are limited to 14 days",
    };
  }

  return { valid: true };
}

function establishSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.userid;
      req.session.role = user.role;
      req.session.email = user.emailaddress;
      req.session.accountStatus =
        user.accountstatus || user.accountStatus || "complete";
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
  const { email, password, firstName, lastName, phone, affiliation, status } =
    req.body || {};

  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !phone ||
    !affiliation
  ) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  // Status is required only if not Civilian
  if (affiliation !== "DOD Authorized Civilian" && !status) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existingEmail = await findUserByEmailWithStatus(email);

    // If a pending account exists with this email, complete registration instead
    if (existingEmail && existingEmail.accountstatus === "pending") {
      const completedUser = await completeGuestRegistration(
        existingEmail.userid,
        {
          password,
          affiliation,
          status,
        }
      );

      await establishSession(req, {
        userid: completedUser.userid || completedUser.userId,
        emailaddress: completedUser.emailaddress || completedUser.emailAddress,
        role: completedUser.role,
        accountStatus: "complete",
      });

      return res.status(201).json({
        message: "Account completed and logged in",
        user: {
          userId: completedUser.userid || completedUser.userId,
          email: completedUser.emailaddress || completedUser.emailAddress,
          role: completedUser.role,
          accountStatus: "complete",
        },
      });
    }

    if (existingEmail)
      return res.status(409).json({ error: "Email already in use" });

    const newUser = await createUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      affiliation,
      status,
    });

    console.log("new User:", newUser);

    //catch employees/admins creating account for customer
    if (!req.session.userId)
      await establishSession(req, { ...newUser, accountStatus: "complete" });

    res.status(201).json({
      message: "Registered and logged in",
      user: {
        userId: newUser.userid,
        email: newUser.emailaddress,
        role: newUser.role,
        accountStatus: "complete",
      },
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await findUserByEmailWithStatus(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Check if account is pending (guest checkout not completed)
    if (user.accountstatus === "pending") {
      return res.status(403).json({
        error: "Please complete your account registration first",
        pendingAccount: true,
        userId: user.userid,
      });
    }

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
        userId: user.userid,
        email: user.emailaddress,
        role: user.role,
        accountStatus: user.accountstatus,
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
      email: req.session.email,
      role: req.session.role,
      accountStatus: req.session.accountStatus || "complete",
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

// Guest checkout: start a reservation without full account
app.post("/auth/guest-start", async (req, res) => {
  const { email, firstName, lastName, phone } = req.body || {};

  if (!email || !firstName || !lastName || !phone) {
    return res
      .status(400)
      .json({ error: "Email, first name, last name, and phone are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await findUserByEmailWithStatus(email);

    if (existingUser) {
      // If account is complete, prompt to login
      if (existingUser.accountstatus === "complete") {
        return res.status(409).json({
          error:
            "An account with this email already exists. Please login instead.",
          existingAccount: true,
        });
      }

      // If account is pending, reuse it (resume guest session)
      await establishSession(req, {
        userid: existingUser.userid,
        emailaddress: existingUser.emailaddress,
        role: existingUser.role,
        accountStatus: existingUser.accountstatus,
      });

      return res.json({
        message: "Resumed guest session",
        user: {
          userId: existingUser.userid,
          email: existingUser.emailaddress,
          role: existingUser.role,
          accountStatus: existingUser.accountstatus,
        },
      });
    }

    // Create new pending user
    const newUser = await createGuestUser({
      email,
      firstName,
      lastName,
      phone,
    });

    await establishSession(req, {
      userid: newUser.userid || newUser.userId,
      emailaddress: newUser.emailaddress || newUser.emailAddress,
      role: newUser.role,
      accountStatus: "pending",
    });

    res.status(201).json({
      message: "Guest session created",
      user: {
        userId: newUser.userid || newUser.userId,
        email: newUser.emailaddress || newUser.emailAddress,
        role: newUser.role,
        accountStatus: "pending",
      },
    });
  } catch (err) {
    console.error("Error creating guest session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Complete guest registration by setting password
app.post("/auth/complete-registration", requireAuth, async (req, res) => {
  const { password, affiliation, status } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  if (!affiliation || !status) {
    return res
      .status(400)
      .json({ error: "Affiliation and status are required" });
  }

  try {
    const updatedUser = await completeGuestRegistration(req.session.userId, {
      password,
      affiliation,
      status,
    });

    // Update session to reflect complete status
    req.session.accountStatus = "complete";
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      message: "Account registration completed",
      user: {
        userId: updatedUser.userid || updatedUser.userId,
        email: updatedUser.emailaddress || updatedUser.emailAddress,
        role: updatedUser.role,
        accountStatus: "complete",
      },
    });
  } catch (err) {
    console.error("Error completing registration:", err);
    res.status(500).json({ error: "Internal server error" });
  }
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

// Admin-only endpoint to set a temporary password for any user by email.
app.post("/admin/reset-password", requireRole("admin"), async (req, res) => {
  const { account, newPassword } = req.body || {};
  if (!account || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email and new password are required" });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await findUserByEmail(account.trim().toLowerCase());

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(newPassword + user.salt, 12);
    await updateUserPassword(user.userid, passwordHash);

    res.json({
      message: "Temporary password set",
      user: { userId: user.userid, email: user.emailaddress, role: user.role },
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users (admin only) // requireRole("admin"),
app.get("/admin/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/admin/site-types", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const siteTypes = await getAllSiteTypes();
    res.json(siteTypes);
  } catch (err) {
    // This will show the real error in your terminal/console
    console.error("Error fetching site types:", err);
    res.status(500).json({ error: "Failed to fetch site types" });
  }
});

app.post("/admin/change-site-rate", async (req, res) => {
  // 1. Check if the user is logged in
  if (!req.session.userId)
    return res.status(401).json({ error: "Unauthorized" });

  const { sitetype, rate } = req.body; // frontend sends sitetype = siteTypeId

  // 2. Validate input
  if (!sitetype || rate === undefined) {
    return res
      .status(400)
      .json({ error: "Site type ID and rate are required" });
  }

  const parsedRate = parseFloat(rate);
  if (isNaN(parsedRate) || parsedRate < 0) {
    return res
      .status(400)
      .json({ error: "Rate must be a non-negative number" });
  }

  try {
    // 3. Update the rate in the database
    const result = await pool.query(
      `
      UPDATE site_types
      SET rate = $1
      WHERE siteTypeId = $2
      RETURNING sitetype, rate
      `,
      [parsedRate, sitetype]
    );

    // 4. Check if the site type exists
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Site type not found" });
    }

    // 5. Return the updated site type info
    res
      .status(200)
      .json({ sitetype: result.rows[0].sitetype, rate: result.rows[0].rate });
  } catch (err) {
    console.error("Error updating site rate:", err);
    res.status(500).json({ error: "Failed to update site rate" });
  }
});

// Update user role (admin only)
app.put("/admin/users/:userId/role", requireRole("admin"), async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body || {};

  if (!role || !["customer", "employee", "admin"].includes(role)) {
    return res
      .status(400)
      .json({ error: "Valid role is required (customer, employee, admin)" });
  }

  // Prevent admin from demoting themselves
  if (parseInt(userId) === req.session.userId) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }

  try {
    const roleRecord = await getRoleByName(role);
    if (!roleRecord) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updatedUser = await updateUserRole(
      parseInt(userId),
      roleRecord.roleid
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Role updated successfully",
      user: { ...updatedUser, role },
    });
  } catch (err) {
    console.error("Error updating user role:", err);
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

app.post("/reservations", requireAuth, async (req, res) => {
  try {
    const { userId, siteId, startDate, endDate, notes } = req.body;

    // Validate reservation dates
    const validation = validateReservationDates(startDate, endDate);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Determine which user ID to use:
    // - Employees/admins can create reservations for other users
    // - Regular customers always use their own session ID
    let targetUserId = req.session.userId;
    
    if (userId && (req.session.role === "employee" || req.session.role === "admin")) {
      // Staff can specify a different user
      targetUserId = parseInt(userId);
    }

    const reservationData = {
      userId: targetUserId,
      siteId: parseInt(siteId),
      startDate,
      endDate,
      notes: notes || "",
    };

    const reservation = await createReservation(reservationData);
    res.status(201).json({
      message: "Reservation created",
      reservation,
    });
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all reservations (employee/admin only)
app.get("/reservations", requireAuth, async (req, res) => {
  // Check if user is employee or admin
  if (req.session.role !== "employee" && req.session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden - staff only" });
  }

  try {
    const reservations = await getAllReservations();
    res.json(reservations);
  } catch (err) {
    console.error("Error fetching all reservations:", err);
    res.status(500).json({ error: "Failed to fetch reservations" });
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

// Update a reservation
app.put("/reservations/:id", requireAuth, async (req, res) => {
  const reservationId = parseInt(req.params.id);
  const { siteId, startDate, endDate, notes } = req.body;

  try {
    // Optionally verify the user owns this reservation or is employee/admin
    const existing = await getReservationById(reservationId);
    if (!existing) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Allow if user owns it, or is employee/admin
    const isOwner = existing.userid === req.session.userId;
    const isStaff =
      req.session.role === "employee" || req.session.role === "admin";

    if (!isOwner && !isStaff) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this reservation" });
    }

    // Validate reservation dates
    const validation = validateReservationDates(startDate, endDate);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const updated = await updateReservation(reservationId, {
      siteId: siteId ? parseInt(siteId) : null,
      startDate,
      endDate,
      notes,
    });

    res.json({ message: "Reservation updated", reservation: updated });
  } catch (err) {
    console.error("Error updating reservation:", err);
    res.status(500).json({ error: "Failed to update reservation" });
  }
});

// Cancel/delete a reservation
app.delete("/reservations/:id", requireAuth, async (req, res) => {
  const reservationId = parseInt(req.params.id);

  try {
    const existing = await getReservationById(reservationId);
    if (!existing) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Allow if user owns it, or is employee/admin
    const isOwner = existing.userid === req.session.userId;
    const isStaff =
      req.session.role === "employee" || req.session.role === "admin";

    if (!isOwner && !isStaff) {
      return res
        .status(403)
        .json({ error: "Not authorized to cancel this reservation" });
    }

    const deleted = await deleteReservation(reservationId);
    res.json({ message: "Reservation canceled", reservation: deleted });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).json({ error: "Failed to cancel reservation" });
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

// ==================== HOLIDAY ENDPOINTS ====================

// Get all holidays (public)
app.get("/api/holidays", async (req, res) => {
  try {
    const holidays = await getAllHolidays();
    res.json(holidays);
  } catch (err) {
    console.error("Error fetching holidays:", err);
    res.status(500).json({ error: "Failed to fetch holidays" });
  }
});

// Create holiday (admin only)
app.post("/api/holidays", requireRole("admin"), async (req, res) => {
  const { name, startDate, endDate, description } = req.body;

  if (!name || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Name, start date, and end date are required" });
  }

  try {
    const holiday = await createHoliday({
      name,
      startDate,
      endDate,
      description,
    });
    res.status(201).json({ message: "Holiday created", holiday });
  } catch (err) {
    console.error("Error creating holiday:", err);
    res.status(500).json({ error: "Failed to create holiday" });
  }
});

// Update holiday (admin only)
app.put("/api/holidays/:id", requireRole("admin"), async (req, res) => {
  const holidayId = parseInt(req.params.id);
  const { name, startDate, endDate, description } = req.body;

  try {
    const holiday = await updateHoliday(holidayId, {
      name,
      startDate,
      endDate,
      description,
    });
    if (!holiday) {
      return res.status(404).json({ error: "Holiday not found" });
    }
    res.json({ message: "Holiday updated", holiday });
  } catch (err) {
    console.error("Error updating holiday:", err);
    res.status(500).json({ error: "Failed to update holiday" });
  }
});

// Delete holiday (admin only)
app.delete("/api/holidays/:id", requireRole("admin"), async (req, res) => {
  const holidayId = parseInt(req.params.id);

  try {
    const holiday = await deleteHoliday(holidayId);
    if (!holiday) {
      return res.status(404).json({ error: "Holiday not found" });
    }
    res.json({ message: "Holiday deleted", holiday });
  } catch (err) {
    console.error("Error deleting holiday:", err);
    res.status(500).json({ error: "Failed to delete holiday" });
  }
});

// Check if dates overlap with holidays
app.get("/api/holidays/check", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates required" });
  }

  try {
    const overlappingHolidays = await checkDateOverlapsHoliday(
      startDate,
      endDate
    );
    res.json({
      isHoliday: overlappingHolidays.length > 0,
      holidays: overlappingHolidays,
    });
  } catch (err) {
    console.error("Error checking holidays:", err);
    res.status(500).json({ error: "Failed to check holidays" });
  }
});

// ==================== PAYMENT ENDPOINTS ====================

// Calculate reservation cost
app.get("/api/calculate-cost", async (req, res) => {
  const { siteId, startDate, endDate } = req.query;

  if (!siteId || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "siteId, startDate, and endDate are required" });
  }

  try {
    const rate = await getSiteRate(parseInt(siteId));
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalCost = rate * nights;

    res.json({
      rate: parseFloat(rate),
      nights,
      totalCost,
      breakdown: `$${rate}/night × ${nights} nights = $${totalCost.toFixed(2)}`,
    });
  } catch (err) {
    console.error("Error calculating cost:", err);
    res.status(500).json({ error: "Failed to calculate cost" });
  }
});

// Process payment for reservation
app.post("/api/payments", requireAuth, async (req, res) => {
  const { reservationId, amount, cardNumber, cardExpiry, cardCvv, cardName } =
    req.body;

  if (!reservationId || !amount || !cardNumber) {
    return res
      .status(400)
      .json({ error: "Reservation ID, amount, and card details required" });
  }

  // Validate card number format (mock validation)
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
    return res.status(400).json({ error: "Invalid card number" });
  }

  try {
    const cardLastFour = cleanCardNumber.slice(-4);

    const payment = await createPayment({
      reservationId: parseInt(reservationId),
      userId: req.session.userId,
      amount: parseFloat(amount),
      paymentType: "credit_card",
      cardLastFour,
    });

    res.status(201).json({
      message: "Payment processed successfully",
      payment,
      receipt: {
        paymentId: payment.paymentid,
        amount: payment.amount,
        cardLastFour: payment.cardlastfour,
        transactionDate: payment.transactiondate,
        status: "completed",
      },
    });
  } catch (err) {
    console.error("Error processing payment:", err);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// Get payment for a reservation
app.get(
  "/api/payments/reservation/:reservationId",
  requireAuth,
  async (req, res) => {
    const reservationId = parseInt(req.params.reservationId);

    try {
      const payment = await getPaymentByReservation(reservationId);
      res.json(payment || null);
    } catch (err) {
      console.error("Error fetching payment:", err);
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  }
);

// Get user's payment history
app.get("/api/payments/user", requireAuth, async (req, res) => {
  try {
    const payments = await getPaymentsByUser(req.session.userId);
    res.json(payments);
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Calculate cancellation fee
function calculateCancellationFee(startDate, dailyRate, isHoliday) {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilArrival = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

  // Holiday or special event: 1 day fee
  if (isHoliday) {
    return {
      fee: parseFloat(dailyRate),
      reason: "Holiday/special event cancellation fee (1 day rate)",
      daysUntilArrival,
    };
  }

  // 3+ days before arrival: $10 fee
  if (daysUntilArrival >= 3) {
    return {
      fee: 10.0,
      reason: "Cancellation fee (3+ days before arrival)",
      daysUntilArrival,
    };
  }

  // Less than 3 days: 1 day fee
  return {
    fee: parseFloat(dailyRate),
    reason: "Late cancellation fee (less than 3 days before arrival)",
    daysUntilArrival,
  };
}

// Get cancellation fee preview
app.get(
  "/api/cancellation-fee/:reservationId",
  requireAuth,
  async (req, res) => {
    const reservationId = parseInt(req.params.reservationId);

    try {
      const reservation = await getReservationById(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      const rate = await getSiteRate(reservation.siteid);
      const holidays = await checkDateOverlapsHoliday(
        reservation.startdate,
        reservation.enddate
      );
      const isHoliday = holidays.length > 0;

      const feeInfo = calculateCancellationFee(
        reservation.startdate,
        rate,
        isHoliday
      );

      // Calculate refund amount
      const payment = await getPaymentByReservation(reservationId);
      const paidAmount = payment ? parseFloat(payment.amount) : 0;
      const refundAmount = Math.max(0, paidAmount - feeInfo.fee);

      res.json({
        ...feeInfo,
        isHoliday,
        holidayNames: holidays.map((h) => h.name),
        paidAmount,
        refundAmount,
        dailyRate: parseFloat(rate),
      });
    } catch (err) {
      console.error("Error calculating cancellation fee:", err);
      res.status(500).json({ error: "Failed to calculate cancellation fee" });
    }
  }
);

// Process refund on cancellation
app.post("/api/refund/:reservationId", requireAuth, async (req, res) => {
  const reservationId = parseInt(req.params.reservationId);

  try {
    const reservation = await getReservationById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Check authorization
    const isOwner = reservation.userid === req.session.userId;
    const isStaff =
      req.session.role === "employee" || req.session.role === "admin";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const payment = await getPaymentByReservation(reservationId);
    if (!payment) {
      return res.json({
        message: "No payment found for this reservation",
        refundAmount: 0,
      });
    }

    const rate = await getSiteRate(reservation.siteid);
    const holidays = await checkDateOverlapsHoliday(
      reservation.startdate,
      reservation.enddate
    );
    const isHoliday = holidays.length > 0;

    const feeInfo = calculateCancellationFee(
      reservation.startdate,
      rate,
      isHoliday
    );
    const refundAmount = Math.max(0, parseFloat(payment.amount) - feeInfo.fee);

    const refundedPayment = await processRefund(
      payment.paymentid,
      refundAmount,
      feeInfo.reason
    );

    res.json({
      message: "Refund processed",
      originalAmount: parseFloat(payment.amount),
      cancellationFee: feeInfo.fee,
      refundAmount,
      reason: feeInfo.reason,
      payment: refundedPayment,
    });
  } catch (err) {
    console.error("Error processing refund:", err);
    res.status(500).json({ error: "Failed to process refund" });
  }
});

app.listen(PORT, (error) => {
  if (!error) console.log(`Server is running on http://localhost:${PORT}`);
  else console.log("Error occurred, server can't start:", error);
});
