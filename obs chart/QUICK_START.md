# Quick Start Guide - Fix CORS Issues

## Problem
Getting CORS errors when viewing rainfall maps? This happens when opening HTML files directly in the browser.

## Solution
Run a local server instead of opening files directly.

## Quick Fix (Choose One)

### Option 1: Python (Recommended)
```bash
# Windows
start_server.bat

# macOS/Linux  
./start_server.sh

# Or manually
python3 simple_server.py
```

### Option 2: Node.js
```bash
node server.js
```

### Option 3: VS Code
1. Install "Live Server" extension
2. Right-click `rainfall_charts.html` → "Open with Live Server"

## What This Does
- Serves files over `http://localhost:8000` instead of `file://`
- Adds CORS headers to allow shapefile loading
- Automatically opens your browser to the correct page

## Access Your App
After starting any server, go to:
**http://localhost:8000/rainfall_charts.html**

The rainfall maps should now load without CORS errors!

---
*For detailed instructions, see CORS_SOLUTION.md*
