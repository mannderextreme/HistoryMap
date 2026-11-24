#!/usr/bin/env python3
"""
HistoryMaP Backend Server
Provides API endpoints for historical events data
"""

from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

# Load historical events data
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'historical_events.json')

def load_data():
    """Load historical events from JSON file"""
    try:
        with DATA_FILE as f:
            return json.load(f)
    except FileNotFoundError:
        return {"events": []}

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        "service": "HistoryMaP Backend",
        "status": "running",
        "endpoints": [
            "/api/events",
            "/api/events/<location_id>",
            "/api/geocode",
            "/api/commits",
            "/api/history",
            "/api/locations"
        ]
    })

@app.route('/api/commits', methods=['GET'])
def get_commits():
    """Return commits data (placeholder for frontend)"""
    data = load_data()
    # Convert events to commit-like structure
    commits = []
    for event in data.get('events', []):
        commits.append({
            "id": str(hash(event['name'] + event.get('period', ''))),
            "message": f"{event['name']}: {event.get('period', '')}",
            "author": event.get('city', 'unknown'),
            "timestamp": event.get('year', ''),
            "location": event.get('location', '')
        })
    return jsonify({"commits": commits})

@app.route('/api/history', methods=['GET'])
def get_history():
    """Return historical events data for timeline"""
    data = load_data()
    history = []
    for event in data.get('events', []):
        history.append({
            "id": event.get('name'),
            "title": event['name'],
            "date": f"{event.get('year')}-{event.get('period', '')}",
            "location": event.get('location', ''),
            "coordinates": {
                "lat": 51.0 + hash(event['name']) % 20,
                "lng": 8.0 + hash(event['name']) % 20
            },
            "description": f"Events in {event['name']}",
            "events": [e for e in data.get('events', []) if e['name'] == event['name']]
        })
    return jsonify({"history": history})

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get unique locations from events"""
    data = load_data()
    locations = {}
    for event in data.get('events', []):
        loc = event.get('location', '').lower()
        if not loc:
            continue
        if loc not in locations:
            locations[loc] = {
                "name": event['location'],
                "coords": {
                    "lat": 51.0 + hash(event['name']) % 20,
                    "lng": 8.0 + hash(event['name']) % 20
                },
                "events": [e for e in data.get('events', []) if e['location'] == event['location']]
            }
    return jsonify({"locations": list(locations.values())})

@app.route('/api/events', methods=['GET'])
def get_all_events():
    """Get all historical events"""
    data = load_data()
    return jsonify(data.get('events', []))

@app.route('/api/events/<location_id>', methods=['GET'])
def get_location_events(location_id):
    """Get events for a specific location"""
    data = load_data()
    events = [e for e in data.get('events', []) if e['name'] == location_id]
    
    if not events:
        return jsonify({"error": f"Location '{location_id}' not found"}), 404
    
    return jsonify(events[0])

@app.route('/api/geocode/<query>', methods=['POST'])
def geocode(query):
    """Simple geocoding - match location names"""
    data = load_data()
    
    for event in data.get('events', []):
        if query.lower() in event['name'].lower():
            return jsonify({
                "query": query,
                "location": event['location'],
                "name": event['name']
            })
    
    return jsonify({"error": f"Could not find location: {query}"}), 404

@app.route('/api/period/<location_id>/<period>', methods=['GET'])
def get_period_events(location_id, period):
    """Get events for a specific time period"""
    data = load_data()
    
    for event in data.get('events', []):
        if event['name'] == location_id:
            periods = event.get('periods', {})
            if period.lower() in periods:
                return jsonify({
                    "location": event['name'],
                    "period": period,
                    "title": periods[period]['title'],
                    "facts": periods[period].get('facts', [])
                })
    
    return jsonify({"error": f"Invalid location or period"}), 404

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

if __name__ == '__main__':
    print("Starting HistoryMaP backend server...")
    print(f"Data file: {DATA_FILE}")
    app.run(debug=False, host='127.0.0.1', port=5000)
