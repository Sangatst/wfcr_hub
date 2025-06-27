@echo off
REM Batch file to start the local server for Rainfall Charts
REM This solves CORS issues when loading shapefiles and SVG files

echo ========================================
echo    RAINFALL CHARTS LOCAL SERVER
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.6+ from https://python.org
    echo.
    pause
    exit /b 1
)

echo Starting local server...
echo This will solve CORS issues for shapefile and SVG loading
echo.

REM Start the Python server
python start_server.py

echo.
echo Server stopped.
pause
