const { postCountData,createReservation,getReservationsByUser, getAvailableSites } = require('./db.js');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send("Welcome to root URL of Server");
});

app.post('/server/count', async (req, res) => {
  const { count } = req.body;
  if (typeof count !== 'number') {
    return res.status(400).json({ error: 'Count must be a number' });
  }

  try {
    const newRow = await postCountData(count);
    res.status(201).json({ message: 'Count saved', data: newRow });
  } catch (err) {
    console.error('Error saving count:', err);
    res.status(500).json({ error: 'Internal server error' });
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
  if (!error)
    console.log(`Server is running on http://localhost:${PORT}`);
  else
    console.log("Error occurred, server can't start:", error);
});
