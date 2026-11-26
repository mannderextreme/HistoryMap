import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
const backendUrl = 'http://localhost:5000';
console.log(`Backend URL: ${backendUrl}`);
app.use(express.static(__dirname, { 
  maxAge: 0,
  immutable: false 
}));

// API endpoint to get git commits data
app.get('/api/commits', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/api/commits');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Backend not available' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to get history map data
app.get('/api/history', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/api/history');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Backend not available' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to get all events data (the data the app actually renders)
app.get('/api/events', async (req, res) => {
  try {
    const response = await fetch(`${backendUrl}/api/events`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Backend not available' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to get all location data
app.get('/api/locations', async (req, res) => {
  try {
    const response = await fetch(`${backendUrl}/api/history`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Backend not available' });
    }
    const data = await response.json();
    
    // Extract locations from history
    const locations = {};
    for (const place of data.history) {
      const loc = place.location.toLowerCase();
      if (!locations[loc]) {
        locations[loc] = { 
          name: place.location,
          coords: place.coordinates,
          events: []
        };
      }
      locations[loc].events.push(place);
    }
    
    res.json(Object.values(locations));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🗺️ HistoryMaP Frontend Server running on http://localhost:${port}`);
  console.log('🔄 Auto-reload enabled for frontend code changes');
  console.log(`📡 API endpoints connected to backend at ${backendUrl}`);
});
