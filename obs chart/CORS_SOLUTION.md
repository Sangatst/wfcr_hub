# CORS Solution for Rainfall Maps

## The Problem

When opening `rainfall_charts.html` directly in a browser (using `file://` protocol), you encounter CORS (Cross-Origin Resource Sharing) errors when trying to load:

- Shapefile data (`.shp`, `.dbf` files)
- SVG map files (`.svg`)
- Other local resources

**Error messages you might see:**
```
Access to fetch at 'file:///path/to/BTN_adm1.dbf' from origin 'null' has been blocked by CORS policy
Access to fetch at 'file:///path/to/BTN_adm1.shp' from origin 'null' has been blocked by CORS policy
Access to fetch at 'file:///path/to/bhutan.svg' from origin 'null' has been blocked by CORS policy
```

## Why This Happens

Modern browsers block direct file access for security reasons. When you open an HTML file directly (double-clicking it), the browser uses the `file://` protocol, which has strict security restrictions that prevent loading other local files.

## The Solution

We've created a simple local HTTP server that serves your files over `http://localhost` instead of `file://`. This bypasses the CORS restrictions while keeping everything local and secure.

## How to Use

### Option 1: Python Script (Recommended)

1. **Make sure Python is installed** (Python 3.6 or higher)
   - Check by running: `python --version` or `python3 --version`
   - If not installed, download from [python.org](https://python.org)

2. **Start the server:**

   **Easy way:**
   - **Windows:** Double-click `start_server.bat`
   - **macOS/Linux:** Double-click `start_server.sh` or run `./start_server.sh`

   **Manual way:**
   ```bash
   python3 start_server.py
   # or
   python3 simple_server.py  # minimal version
   ```

3. **Access your application:**
   - The server will automatically open `http://localhost:8000/rainfall_charts.html` in your browser
   - If it doesn't open automatically, manually navigate to that URL

### Option 2: Node.js Server

If you have Node.js installed:

```bash
node server.js
```

Or use the built-in http-server:
```bash
npx http-server -p 8000 --cors
```

### Option 3: Other Simple Servers

**Python (built-in, but no CORS headers):**
```bash
python3 -m http.server 8000
```

**PHP (if installed):**
```bash
php -S localhost:8000
```

**Live Server (VS Code Extension):**
- Install "Live Server" extension in VS Code
- Right-click on `rainfall_charts.html` → "Open with Live Server"

## What the Server Does

1. **Serves files over HTTP** instead of file:// protocol
2. **Adds CORS headers** to allow cross-origin requests
3. **Finds a free port** automatically (starting from 8000)
4. **Opens your browser** automatically to the rainfall charts page
5. **Provides helpful logging** to show which files are being served

## Features

- ✅ **Solves CORS issues** for shapefile and SVG loading
- ✅ **Automatic browser opening** to the correct page
- ✅ **Cross-platform** (Windows, macOS, Linux)
- ✅ **No installation required** (just Python)
- ✅ **Automatic port detection** (finds free port)
- ✅ **Helpful error messages** and logging

## Troubleshooting

### "Python is not installed"
- Download and install Python from [python.org](https://python.org)
- Make sure to check "Add Python to PATH" during installation

### "Port already in use"
- The server automatically finds a free port
- If you see this error, try closing other applications using port 8000

### "Permission denied" (macOS/Linux)
- Make the script executable: `chmod +x start_server.sh`
- Or run directly: `python3 start_server.py`

### Browser doesn't open automatically
- Manually navigate to the URL shown in the terminal
- Usually: `http://localhost:8000/rainfall_charts.html`

## Technical Details

The server:
- Uses Python's built-in `http.server` module
- Adds CORS headers to all responses
- Serves static files from the current directory
- Handles preflight OPTIONS requests
- Provides custom logging for better debugging

## Security Note

This server only runs locally on your machine and is not accessible from the internet. It's completely safe and only serves files from your project directory.
