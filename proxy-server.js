const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

app.use(cors());

// Update the proxy URL to use the Vercel URL
const vercelProxyUrl = 'https://kimo-lf241f7im-drkimogad-s-projects.vercel.app/api/proxy';

app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await fetch(`${vercelProxyUrl}?url=${encodeURIComponent(url)}`);
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
