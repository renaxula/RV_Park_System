const { getCurrentAvailableSites, activeReservations } = require("./db.js");
const express = require("express");
const cors = require("cors");
const { act } = require("react");
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(cors());

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
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database Error" });
  }
});

app.get("/api/active", async (req, res) => {
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

// app.post('/server/count', async (req, res) => {
//   const { count } = req.body;
//   if (typeof count !== 'number') {
//     return res.status(400).json({ error: 'Count must be a number' });
//   }

//   try {
//     const newRow = await postCountData(count);
//     res.status(201).json({ message: 'Count saved', data: newRow });
//   } catch (err) {
//     console.error('Error saving count:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.listen(PORT, (error) => {
  if (!error) console.log(`Server is running on http://localhost:${PORT}`);
  else console.log("Error occurred, server can't start:", error);
});
