#!/bin/bash

# Shell script to start the local server for Rainfall Charts
# This solves CORS issues when loading shapefiles and SVG files

echo "========================================"
echo "   RAINFALL CHARTS LOCAL SERVER"
echo "========================================"
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python is not installed or not in PATH"
        echo "Please install Python 3.6+ from https://python.org"
        echo
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "Starting local server..."
echo "This will solve CORS issues for shapefile and SVG loading"
echo

# Start the Python server
$PYTHON_CMD start_server.py

echo
echo "Server stopped."
