import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Variable to store the most recent data
let mostRecentData = "";

// Endpoint to receive data
app.post('/api/create-answer', (req, res) => {
  const { data } = req.body;
  
  if (data) {
    // Store the data
    mostRecentData = data;
    console.log("Received data:", data);
    res.status(200).json({ success: true, message: "Data received" });
  } else {
    res.status(400).json({ success: false, message: "No data provided" });
  }
});

// Endpoint to get the most recent data
app.get('/api/get-answer', (req, res) => {
  res.status(200).json({ data: mostRecentData });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Assignment server is running on http://0.0.0.0:${PORT}`);
});
