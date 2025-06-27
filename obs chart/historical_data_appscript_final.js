/**
 * Google Apps Script for Historical Temperature Data
 * 
 * This script creates a web app that serves historical temperature data from the Google Sheet.
 * It provides endpoints to:
 * 1. Get a list of all available stations (sheet names)
 * 2. Get data for a specific station
 * 
 * This version filters out sheets with "_MonthlyStats" and "_DailyStats" suffixes.
 */

// Spreadsheet ID for historical data
const SPREADSHEET_ID = '1UhqWjkoRnLCk6a2nR4SdSTo_h9Q0AR9buEywFBKMUmQ';

/**
 * Handles GET requests to the web app
 * @param {Object} e - The event object from the request
 * @returns {TextOutput} - JSON response
 */
function doGet(e) {
  try {
    // Set CORS headers to allow access from any origin
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Parse the request parameters
    const params = e.parameter;
    const action = params.action;
    
    let result;
    
    // Handle different actions
    if (action === 'getStations') {
      // Return a list of all available stations (sheet names)
      result = getStationsList();
    } else if (action === 'getStationData') {
      // Get data for a specific station
      const station = params.station;
      if (!station) {
        return createErrorResponse('Station parameter is required');
      }
      result = getStationData(station);
    } else {
      // Default action - return available actions
      result = {
        status: 'success',
        message: 'Historical Temperature Data API',
        availableActions: [
          {
            action: 'getStations',
            description: 'Get a list of all available stations',
            usage: '?action=getStations'
          },
          {
            action: 'getStationData',
            description: 'Get data for a specific station',
            usage: '?action=getStationData&station=StationName'
          }
        ]
      };
    }
    
    // Return the result as JSON
    output.setContent(JSON.stringify(result));
    return output;
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Creates an error response
 * @param {string} message - Error message
 * @returns {TextOutput} - JSON error response
 */
function createErrorResponse(message) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    status: 'error',
    message: message
  }));
  return output;
}

/**
 * Gets a list of all available stations (sheet names)
 * @returns {Object} - Object containing the list of stations
 */
function getStationsList() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = spreadsheet.getSheets();
    const allSheetNames = sheets.map(sheet => sheet.getName());
    
    // Filter out sheets with "_MonthlyStats" and "_DailyStats" suffixes
    const stationNames = allSheetNames.filter(name => {
      return !name.includes('_MonthlyStats') && 
             !name.includes('_DailyStats') &&
             !name.includes('README') &&
             !name.includes('Instructions') &&
             !name.includes('Summary') &&
             !name.includes('Config');
    });
    
    // Log the filtered station names
    Logger.log(`Filtered ${allSheetNames.length} sheets to ${stationNames.length} station names`);
    Logger.log(`Station names: ${stationNames.join(', ')}`);
    
    return {
      status: 'success',
      stations: stationNames
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Error getting stations list: ' + error.toString()
    };
  }
}

/**
 * Gets data for a specific station
 * @param {string} stationName - The name of the station (sheet name)
 * @returns {Object} - Object containing the station data
 */
function getStationData(stationName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(stationName);
    
    if (!sheet) {
      return {
        status: 'error',
        message: `Station "${stationName}" not found`
      };
    }
    
    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Check if we have any data
    if (values.length <= 1) {
      return {
        status: 'error',
        message: `No data found for station "${stationName}"`
      };
    }
    
    // Extract headers from the first row
    const headers = values[0].map(header => {
      // Clean up header names (remove whitespace, etc.)
      return header ? header.toString().trim() : '';
    });
    
    // Check if we have any headers
    if (headers.every(header => header === '')) {
      return {
        status: 'error',
        message: `No valid headers found for station "${stationName}"`
      };
    }
    
    // Check if we have Year, Month, Day columns (instead of Date)
    const hasYear = headers.includes('Year') || headers.includes('year');
    const hasMonth = headers.includes('Month') || headers.includes('month');
    const hasDay = headers.includes('Day') || headers.includes('day');
    
    // Log the headers for debugging
    Logger.log(`Headers for ${stationName}: ${headers.join(', ')}`);
    Logger.log(`Has Year: ${hasYear}, Has Month: ${hasMonth}, Has Day: ${hasDay}`);
    
    // Return the raw values - let the client handle the processing
    return {
      status: 'success',
      station: stationName,
      headers: headers.filter(header => header !== ''), // Remove empty headers
      values: values,
      hasDateColumn: headers.includes('Date'),
      hasYearMonthDay: hasYear && hasMonth && hasDay
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error getting data for station "${stationName}": ${error.toString()}`
    };
  }
}
