# Temperature Maximum Observation Chart

This project creates an interactive visualization of temperature maximum (Tmax) data, comparing current year observations with historical statistics. It fetches data directly from Google Sheets, processes it to calculate statistical values, and displays the results in an interactive D3.js chart.

## Features

- Fetches data directly from Google Sheets using the gviz/tq API with CORS proxy
- Calculates statistical values (mean, standard deviation, max, min) from historical data
- Creates an interactive D3.js chart showing:
  - Current year Tmax data with highlighted maximum and minimum points
  - Historical mean Tmax
  - Historical max and min Tmax with year information
  - Standard deviation range
- Allows filtering data by month
- Provides comprehensive temperature statistics in a table format:
  - Historical data for the selected month
  - Current year data
  - Overall historical data (annual)
- Includes a detailed chart interpretation summary
- Provides download options for:
  - Statistics data
  - Current year data
  - Chart as SVG
- Supports 20 weather stations
- Interactive tooltips with detailed information on hover

## Project Structure

```
.
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # CSS styles
└── js/
    ├── app.js              # Main application script
    ├── dataProcessor.js    # Data processing logic
    └── chart.js            # D3.js chart visualization
```

## Data Sources

The application uses two Google Sheets as data sources:

1. **Historical Data**: Contains historical temperature maximum data for multiple stations

   - Google Sheet ID: `1UhqWjkoRnLCk6a2nR4SdSTo_h9Q0AR9buEywFBKMUmQ`

2. **Current Year Data**: Contains current year temperature maximum data
   - Google Sheet ID: `1mB5P6pyaJGkDIA1_fDsGYtnSO3I8IlksSet86an4D6o`

## How It Works

1. The application fetches data from Google Sheets using the gviz/tq API with corsproxy.io
2. It first retrieves the sheet names from both spreadsheets to identify available stations (20 matching stations)
3. For each matching station in the historical data:
   - Groups data by month and day
   - Calculates statistical values (mean, standard deviation, max, min)
   - Identifies years with maximum and minimum values
4. Current year data is processed and formatted for visualization
5. The D3.js chart displays:
   - A line for historical mean Tmax
   - Dashed lines for historical max and min Tmax with year information
   - A shaded area representing the standard deviation range
   - Points and a line for current year data with highlighted maximum and minimum points
6. The application generates a detailed interpretation of the data, comparing current year values with historical averages
7. A comprehensive temperature extremes table displays:
   - Historical data for the selected month (highest, lowest, and mean Tmax with dates)
   - Current year data (highest, lowest, and mean Tmax with dates)
   - Overall historical data across all months (highest, lowest, and mean Tmax with dates)
8. Users can:
   - Select different stations from a dropdown menu
   - Filter data by month
   - Download statistics data as CSV
   - Download current year data as tab-separated text file with properly formatted dates
   - Download the chart as an SVG file
9. Interactive tooltips provide detailed information when hovering over data points

## Setup and Usage

1. Clone the repository
2. Open the project directory
3. Start a local server (e.g., `python -m http.server 8000`)
4. Open a web browser and navigate to `http://localhost:8000`

## Requirements

- Modern web browser with JavaScript enabled
- Internet connection to access Google Sheets data
- CORS must be enabled for the Google Sheets to allow direct CSV access

## Notes

- The application uses D3.js version 7 for visualization
- The chart is responsive and will adjust to different screen sizes
- Data is processed client-side in the browser
- The application includes comprehensive error handling to ensure it works in various environments
- Maximum and minimum temperature points are highlighted and labeled on the chart
- Tooltips provide detailed information when hovering over data points
- Month filtering allows for more focused analysis of seasonal patterns

## Google Sheets Data Access

This application fetches data directly from Google Sheets:

- Historical data is retrieved from the spreadsheet with ID: `1UhqWjkoRnLCk6a2nR4SdSTo_h9Q0AR9buEywFBKMUmQ`
- Current year data is retrieved from the spreadsheet with ID: `1mB5P6pyaJGkDIA1_fDsGYtnSO3I8IlksSet86an4D6o`
- The application uses the Google Sheets gviz/tq API to access the data
- Each sheet in the spreadsheets represents a different weather station

## Data Processing

- Historical data is processed to calculate statistical values (mean, std, max, min)
- For monthly views, only historical data for the selected month is used for calculations
- Overall historical statistics are calculated using data from all months
- Current year data is used as-is without preprocessing
- The application only uses data from the Google Sheets, with clear error messages if data cannot be fetched
- Downloaded current year data is formatted with dates in DD-MMM-YYYY format (e.g., "1-Jan-2025")

## Troubleshooting

If you encounter issues accessing the Google Sheets data:

1. Check the browser console for detailed error messages
2. Ensure the Google Sheets are accessible with the provided IDs
3. Make sure your internet connection is stable
4. The application uses corsproxy.io as a CORS proxy, which may have limitations
5. Try clearing your browser cache and reloading the page
6. If using a different CORS proxy, update the URL in the fetchCSVData method
