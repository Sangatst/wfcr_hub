#!/usr/bin/env python3
"""
Simple HTTP Server for Rainfall Charts Application
This server solves CORS issues when loading local files like shapefiles and SVGs.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Request Handler with CORS support"""
    
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging to show which files are being served
        if args[1] == '200':
            print(f"✓ Served: {args[0]}")
        else:
            print(f"✗ Error {args[1]}: {args[0]}")

def find_free_port(start_port=8000, max_attempts=10):
    """Find a free port starting from start_port"""
    import socket
    
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    
    raise RuntimeError(f"Could not find a free port in range {start_port}-{start_port + max_attempts}")

def main():
    """Main function to start the server"""
    
    # Change to the script's directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Find a free port
    try:
        port = find_free_port()
    except RuntimeError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    # Create server
    try:
        with socketserver.TCPServer(("localhost", port), CORSHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("🌧️  RAINFALL CHARTS LOCAL SERVER")
            print("=" * 60)
            print(f"Server running at: http://localhost:{port}")
            print(f"Serving directory: {script_dir}")
            print()
            print("Available pages:")
            print(f"  📊 Temperature Charts: http://localhost:{port}/index.html")
            print(f"  🌧️  Rainfall Charts:   http://localhost:{port}/rainfall_charts.html")
            print()
            print("This server solves CORS issues for:")
            print("  • Shapefile loading (.shp, .dbf files)")
            print("  • SVG map loading")
            print("  • Local file access")
            print()
            print("Press Ctrl+C to stop the server")
            print("=" * 60)
            
            # Try to open the rainfall charts page in the default browser
            try:
                url = f"http://localhost:{port}/rainfall_charts.html"
                print(f"🌐 Opening {url} in your default browser...")
                webbrowser.open(url)
            except Exception as e:
                print(f"Could not open browser automatically: {e}")
                print(f"Please manually open: http://localhost:{port}/rainfall_charts.html")
            
            print()
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
