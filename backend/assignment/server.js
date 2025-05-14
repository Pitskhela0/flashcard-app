const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST']
}));

// Parse JSON request bodies
app.use(express.json());

// Variable to store the most recent data
let mostRecentData = "Initial test data";

// POST endpoint to receive data
app.post('/api/create-answer', (req, res) => {
  try {
    const { data } = req.body;
    
    if (data) {
      // Store the data
      mostRecentData = data;
      console.log("Received data:", data);
      return res.json({ success: true, message: "Data received" });
    } else {
      return res.status(400).json({ success: false, message: "No data provided" });
    }
  } catch (error) {
    console.error("Error in POST endpoint:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET endpoint to retrieve the most recent data
app.get('/api/get-answer', (req, res) => {
  try {
    return res.json({ data: mostRecentData });
  } catch (error) {
    console.error("Error in GET endpoint:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Assignment server running at http://0.0.0.0:${PORT}`);
});
