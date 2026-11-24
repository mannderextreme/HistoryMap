# MEMORY.md - Durable Facts and Decisions

<!-- observed: 2026-11-24 | status: active -->

## Project: HistoryMaP

### Session Continuity

- **Server restarted** at 08:15 GMT+1 as requested (session continuation from previous work)
- Backend running on `http://localhost:5000` with Flask debug mode off for production readiness
- All API endpoints operational: `/api/events`, `/api/history`, `/api/geocode/`, `/api/period/`, `/api/commits`

### Setup Complete

- **Backend server**: Flask app running on http://localhost:5000 with historical events JSON data loaded from `/home/rene/git/HistoryMap/data/historical_events.json`
- **API endpoints operational**:
  - `GET /api/events` - Returns all historical events organized by period
  - `GET /api/history` - Returns timeline data sorted by period
  - `POST /api/geocode/<query>` - Location search endpoint
  - `GET /api/period/<location>/<period>` - Get specific period events
  - `GET /api/commits` - Placeholder for git commit history
- **Frontend**: Interactive web application with Leaflet.js map, draggable timeline, and location cards (files in `/home/rene/git/HistoryMap/frontend/`)

### Data Sources

- Historical events JSON: 5 locations (London, Paris, Tokyo, New York, Berlin) with ancient, medieval, and modern period data

<!-- project: github.com/mannderextreme/HistoryMap -->
