const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());

// Serve static files from the 'public' directory with caching
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Cache for 30 days
    res.setHeader('Cache-Control', 'public, max-age=2592000');
  }
}));

// Proxy route with enhanced error handling
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await fetch(url);
    
    // Check if the response is OK (status 200–299)
    if (!response.ok) {
      return res.status(response.status).send(`Error fetching the content: ${response.statusText}`);
    }

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Error fetching the external URL:', error);
    res.status(500).send('Internal Server Error: Unable to fetch the content');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
