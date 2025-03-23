require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Configure environment variables
const PORT = process.env.PORT || 3000;
const {
  GOOGLE_API_KEY,
  GOOGLE_CX,
  DUCKDUCKGO_FALLBACK,
  NODE_ENV
} = process.env;

app.use(cors());
app.use(express.json());

// Proxy endpoints
app.get('/search/ddg', async (req, res) => {
  try {
    const query = req.query.q;
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
    );
    const data = await response.json();
    res.json(data.RelatedTopics?.map(item => ({
      title: item.Text,
      link: item.FirstURL
    })) || []);
  } catch (error) {
    res.status(500).json({ error: DUCKDUCKGO_FALLBACK || 'DuckDuckGo search failed' });
  }
});

app.get('/search/wiki', async (req, res) => {
  try {
    const query = req.query.q;
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`
    );
    const data = await response.json();
    res.json(data.query?.search?.map(item => ({
      title: item.title,
      link: `https://en.wikipedia.org/wiki/${item.title.replace(/ /g, '_')}`
    })) || []);
  } catch (error) {
    res.status(500).json({ error: 'Wikipedia search failed' });
  }
});

app.get('/search/google', async (req, res) => {
  try {
    const query = req.query.q;
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}`
    );
    const data = await response.json();
    res.json(data.items?.map(item => ({
      title: item.title,
      link: item.link
    })) || []);
  } catch (error) {
    res.status(500).json({ error: 'Google search failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running in ${NODE_ENV || 'development'} mode on port ${PORT}`);
});
