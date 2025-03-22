module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    res.setHeader('Access-Control-Allow-Origin', 'https://drkimogad.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', contentType);

    const body = await response.text();
    res.status(200).send(body);
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
};
