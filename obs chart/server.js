#!/usr/bin/env node

/**
 * Simple HTTP Server for Rainfall Charts (Node.js version)
 * This solves CORS issues when loading shapefiles and SVG files
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.shp': 'application/octet-stream',
    '.dbf': 'application/octet-stream',
    '.shx': 'application/octet-stream',
    '.csv': 'text/csv'
};

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parse URL
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './rainfall_charts.html';
    }

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🌧️  RAINFALL CHARTS LOCAL SERVER (Node.js)');
    console.log('=' * 50);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`📊 Rainfall Charts: http://localhost:${PORT}/rainfall_charts.html`);
    console.log('Press Ctrl+C to stop');
    console.log('=' * 50);

    // Try to open browser
    const url = `http://localhost:${PORT}/rainfall_charts.html`;
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${start} ${url}`, (error) => {
        if (error) {
            console.log(`Please manually open: ${url}`);
        } else {
            console.log(`🌐 Opened ${url} in browser`);
        }
    });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Server stopped');
    process.exit(0);
});
