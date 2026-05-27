#!/bin/bash
echo "Starting Campus Cafe backend..."
cd "$(dirname "$0")/backend"
python3 server.py &
BACKEND_PID=$!
echo "Backend running at http://localhost:5000"
echo ""
echo "Customer order page: http://localhost:5000 (after serving frontend)"
echo "Admin panel:         http://localhost:5173/admin  (dev) OR http://localhost:5000/admin (prod)"
echo ""
echo "Press Ctrl+C to stop"
wait $BACKEND_PID
