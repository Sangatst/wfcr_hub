const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow all origins

app.get('/timeseries', async (req, res) => {
  try {
    const apiUrl = 'http://202.144.145.99:8080/timeseries?' + new URLSearchParams(req.query).toString();
    const response = await fetch(apiUrl);
    const data = await response.text(); // Use .text() for non-JSON, .json() for JSON
    res.set('Content-Type', response.headers.get('content-type'));
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 