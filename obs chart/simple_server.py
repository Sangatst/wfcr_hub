#!/usr/bin/env python3
"""
Simple HTTP Server for Rainfall Charts - Minimal Version
"""

import http.server
import socketserver
import webbrowser
import sys

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"🌧️  Server running at http://localhost:{PORT}")
            print(f"📊 Rainfall Charts: http://localhost:{PORT}/rainfall_charts.html")
            print("Press Ctrl+C to stop")
            
            # Open browser
            webbrowser.open(f"http://localhost:{PORT}/rainfall_charts.html")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
