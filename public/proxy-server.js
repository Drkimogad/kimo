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

app.get('https://kimo-peach.vercel.app/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await fetch(url);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    res.status(500).send('Error fetching the content');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
