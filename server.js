// proxy-server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5713;  // Set port to 5713

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors());

// Proxy route to handle external API requests
app.get('/api/proxy', async (req, res) => {
  try {
    const { url } = req.query; // Get the target URL from query params
    const response = await axios.get(url); // Fetch the external URL
    res.send(response.data); // Return the fetched data to the frontend
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).send('Error fetching URL');
  }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server on port 5713
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
