#!/bin/bash
# Quick start script for HistoryMaP frontend testing

echo "Starting HistoryMaP application..."
echo ""
echo "Backend (API) is already running on http://localhost:5000"
echo "Frontend will start on http://localhost:3000"
echo ""
echo "Access the app at: http://localhost:3000"
echo ""

cd "$(dirname "$0")"
node server.js
