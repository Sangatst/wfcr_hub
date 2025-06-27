# Google Apps Script Setup for Temperature Charts

This document provides instructions on how to set up Google Apps Script to retrieve data for your temperature charts project.

## Overview

The project uses two Google Sheets:
1. **Historical Data Sheet** (ID: 1UhqWjkoRnLCk6a2nR4SdSTo_h9Q0AR9buEywFBKMUmQ)
2. **Current Year Data Sheet** (ID: 1mB5P6pyaJGkDIA1_fDsGYtnSO3I8IlksSet86an4D6o)

Instead of accessing these sheets directly through CORS proxies (which can be unreliable), we'll create Google Apps Script web apps that serve the data via a more reliable API.

## Setup Instructions

### Step 1: Set Up the Historical Data Script

1. Open your Historical Data Google Sheet (ID: 1UhqWjkoRnLCk6a2nR4SdSTo_h9Q0AR9buEywFBKMUmQ)
2. Go to **Extensions > Apps Script**
3. Delete any code in the script editor
4. Copy and paste the entire content of `historical_data_appscript.js` into the script editor
5. Save the project (give it a name like "Historical Temperature Data API")
6. Click **Deploy > New deployment**
7. Select type: **Web app**
8. Set the following options:
   - Description: "Historical Temperature Data API"
   - Execute as: "Me" (your Google account)
   - Who has access: "Anyone" (if you want public access) or "Anyone with Google account" (more secure)
9. Click **Deploy**
10. Copy the Web app URL that appears (you'll need this later)
11. Click **Done**

### Step 2: Set Up the Current Year Data Script

1. Open your Current Year Data Google Sheet (ID: 1mB5P6pyaJGkDIA1_fDsGYtnSO3I8IlksSet86an4D6o)
2. Go to **Extensions > Apps Script**
3. Delete any code in the script editor
4. Copy and paste the entire content of `current_year_data_appscript.js` into the script editor
5. Save the project (give it a name like "Current Year Temperature Data API")
6. Click **Deploy > New deployment**
7. Select type: **Web app**
8. Set the following options:
   - Description: "Current Year Temperature Data API"
   - Execute as: "Me" (your Google account)
   - Who has access: "Anyone" (if you want public access) or "Anyone with Google account" (more secure)
9. Click **Deploy**
10. Copy the Web app URL that appears (you'll need this later)
11. Click **Done**

### Step 3: Update Your Web Application

1. Open the file `js/appscript_integration.js`
2. Replace the placeholder URLs with your actual web app URLs:
   ```javascript
   this.HISTORICAL_WEB_APP_URL = 'YOUR_HISTORICAL_WEB_APP_URL'; // Replace with URL from Step 1
   this.CURRENT_YEAR_WEB_APP_URL = 'YOUR_CURRENT_YEAR_WEB_APP_URL'; // Replace with URL from Step 2
   ```
3. Include the script in your HTML file after `dataProcessor.js`:
   ```html
   <script src="js/dataProcessor.js"></script>
   <script src="js/appscript_integration.js"></script>
   ```
4. Modify your `app.js` file to use the new data processor:
   ```javascript
   // Replace:
   // const dataProcessor = new DataProcessor();
   // With:
   const dataProcessor = new AppScriptDataProcessor();
   ```

## Testing Your Setup

1. After completing the setup, open your web application
2. The application should now fetch data from your Google Apps Script web apps instead of directly from the Google Sheets
3. Check the browser console for any errors or messages

## Troubleshooting

If you encounter issues:

1. **Authorization Required**: You might need to authorize the Apps Script to access your Google Sheets. Open the web app URL directly in your browser and follow the authorization prompts.

2. **CORS Issues**: If you see CORS errors, make sure your web app is deployed with the correct access settings.

3. **Quota Limits**: Google Apps Script has usage quotas. If you exceed these, you might need to wait or optimize your code to make fewer requests.

4. **Script Errors**: Check the Apps Script editor's "Executions" page to see any errors that occurred during script execution.

## Benefits of Using Google Apps Script

- **No CORS Issues**: The web app properly handles CORS headers
- **More Reliable**: No need for third-party CORS proxies
- **Better Performance**: Direct access to Google Sheets data
- **Authentication**: Can be secured with Google account authentication
- **Quota**: Higher quotas than direct access to Google Sheets

## API Documentation

Both web apps provide the following endpoints:

1. **Get Stations List**:
   - URL: `?action=getStations`
   - Returns: List of all available stations (sheet names)

2. **Get Station Data**:
   - URL: `?action=getStationData&station=StationName`
   - Parameters: `station` - The name of the station (sheet name)
   - Returns: Data for the specified station
