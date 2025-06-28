import { format, addDays, parseISO } from 'date-fns';
import { iconDescriptions } from '../components/weather/icon_mapping.js';

// Base API URLs without query parameters
const API_BASE_URL = 'https://your-proxy.onrender.com/timeseries';
const ADMIN_API_URL = 'http://202.144.145.99:8080/admin';

export const regionCoordinates = {
  "Bumthang": "27.6000004,90.8166733",
  "Phuentsholing": "26.8589191,89.39048",
  "Dagana": "27.1000004,89.8666687",
  "Gasa": "27.9037209,89.7268906",
  "Haa": "27.3333302,89.1833267",
  "Lhuentse": "27.6678696,91.1839294",
  "Mongar": "27.2747097,91.2396317",
  "Paro": "27.4305,89.4133377",
  "Pemagatshel": "27.0379505,91.4030533",
  "Punakha": "27.5913696,89.8774338",
  "Samdrup Jongkhar": "26.8006897,91.505188",
  "Samtse": "26.9130898,89.0836105",
  "Sarpang": "26.8639507,90.2674484",
  "Thimphu": "27.4660892,89.6419067",
  "Trashigang": "27.25,91.75",
  "Trashiyangtse": "27.6116009,91.4980011",
  "Trongsa": "27.5025997,90.5071564",
  "Tsirang": "27.0219002,90.1229095",
  "Wangdue Phodrang": "27.4861507,89.899147",
  "Zhemgang": "27.0833302,90.8499985"
};

/**
 * Fetches the latest update time for the meteor_edit producer
 * @returns {Promise<string>} - Formatted update time or null if not available
 */
export const fetchLatestUpdateTime = async () => {
  try {
    // Build API URL for the admin endpoint
    const url = `${ADMIN_API_URL}?what=qengine`;

    // Fetch data from API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Admin API error: ${response.status}`);
    }

    // Get the text response
    const text = await response.text();

    // Find all meteor_edit entries with their timestamps
    // The format is expected to be like:
    // meteor_edit nan 60 /smartmet/data/meteor/bhutan/surface/querydata/202505110303_meteor_bhutan_surface.sqd
    const meteorEditRegex = /meteor_edit\s+\S+\s+\d+\s+\/\S+\/(\d{12})_/gi;

    // Find all matches
    const matches = [...text.matchAll(meteorEditRegex)];

    // If no matches found with the specific pattern, try a more general pattern
    if (matches.length === 0) {
      const altRegex = /meteor_edit.*?(\d{12})_/gi;
      const altMatches = [...text.matchAll(altRegex)];
      if (altMatches.length > 0) {
        // Use the alternative matches
        matches.push(...altMatches);
      }
    }

    if (matches.length > 0) {
      // Extract all timestamps and convert to Date objects
      const timestamps = [];

      for (const match of matches) {
        if (match && match[1]) {
          const timestamp = match[1];

          try {
            // Extract year, month, day, hour, minute from the timestamp
            const year = parseInt(timestamp.substring(0, 4));
            const month = parseInt(timestamp.substring(4, 6)) - 1; // JS months are 0-indexed
            const day = parseInt(timestamp.substring(6, 8));
            const hour = parseInt(timestamp.substring(8, 10));
            const minute = parseInt(timestamp.substring(10, 12));

            // Create a date object directly (the timestamp is already in Bhutan local time)
            const originDate = new Date(year, month, day, hour, minute);

            timestamps.push({
              timestamp,
              date: originDate
            });
          } catch (error) {
            console.error('Error parsing timestamp:', error);
            // Continue to the next timestamp
          }
        }
      }

      // Find the latest timestamp
      if (timestamps.length > 0) {
        // Sort timestamps in descending order (latest first)
        timestamps.sort((a, b) => b.date - a.date);

        // Get the latest timestamp
        const latestTimestamp = timestamps[0];

        // Format the date for display (already in Bhutan time)
        return format(latestTimestamp.date, 'dd.MM.yyyy HH:mm') + ' (BT)';
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest update time:', error);
    return null;
  }
};

/**
 * Get coordinates for common locations in Bhutan
 * @param {string} locationName - Name of the location
 * @returns {Object} - Latitude and longitude
 */
export const getLocationCoordinates = (locationName) => {
  const coordString = regionCoordinates[locationName] || regionCoordinates['Thimphu'];
  const [latitude, longitude] = coordString.split(',').map(Number);
  return { latitude, longitude };
};

/**
 * Maps wind direction degrees to cardinal direction
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} - Cardinal direction (N, NE, E, etc.)
 */
const getWindDirection = (degrees) => {
  if (degrees === '--' || degrees === undefined || degrees === null) {
    return 'N'; // Default direction
  }

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

/**
 * Calculates the 6-hourly rainfall total for a specific time slot
 * @param {Array} hourlyData - Array of hourly data objects with precipitation values
 * @param {number} slotHour - The hour for which to calculate the rainfall total (3, 9, 15, or 21)
 * @param {string} dateStr - The date string for the current day
 * @param {Map} hourlyDataByDate - Map of hourly data by date
 * @returns {number|string} - The 6-hourly rainfall total or '--' if no data
 */
const calculate6HourlyRainfall = (hourlyData, slotHour, dateStr, hourlyDataByDate) => {
  // Define the 6-hour window for each standard time slot
  let windowStart, windowEnd;
  let prevDayNeeded = false;

  if (slotHour === 3) {
    // For 03:00, use data from 22:00 previous day to 03:00 current day
    windowStart = 22; // From previous day
    windowEnd = 3;
    prevDayNeeded = true;
  } else if (slotHour === 9) {
    // For 09:00, use data from 04:00 to 09:00
    windowStart = 4;
    windowEnd = 9;
  } else if (slotHour === 15) {
    // For 15:00, use data from 10:00 to 15:00
    windowStart = 10;
    windowEnd = 15;
  } else if (slotHour === 21) {
    // For 21:00, use data from 16:00 to 21:00
    windowStart = 16;
    windowEnd = 21;
  } else {
    return '--'; // Invalid time slot
  }

  // Get all precipitation values in this window
  let rainfallValues = [];

  // Current day's data
  if (windowStart < windowEnd) {
    // Normal case (e.g., 04:00-09:00)
    rainfallValues = hourlyData
      .filter(item => item.hour >= windowStart && item.hour <= windowEnd)
      .map(item => typeof item.precipitation === 'number' ? item.precipitation : 0);
  } else {
    // Current day's early hours (e.g., 00:00-03:00 for the 03:00 slot)
    rainfallValues = hourlyData
      .filter(item => item.hour >= 0 && item.hour <= windowEnd)
      .map(item => typeof item.precipitation === 'number' ? item.precipitation : 0);

    // Previous day's late hours if needed (e.g., 22:00-23:59 for the 03:00 slot)
    if (prevDayNeeded) {
      const prevDateStr = format(addDays(parseISO(dateStr), -1), 'yyyy-MM-dd');
      if (hourlyDataByDate.has(prevDateStr)) {
        const prevDayData = hourlyDataByDate.get(prevDateStr);
        const prevDayRainfallValues = prevDayData
          .filter(item => item.hour >= windowStart && item.hour <= 23)
          .map(item => typeof item.precipitation === 'number' ? item.precipitation : 0);

        // Combine with current day's data
        rainfallValues = [...rainfallValues, ...prevDayRainfallValues];
      }
    }
  }

  // Calculate the total rainfall
  if (rainfallValues.length > 0) {
    const totalRainfall = rainfallValues.reduce((sum, val) => sum + val, 0);
    return parseFloat(totalRainfall.toFixed(1)); // Round to 1 decimal place
  }

  return '--'; // No data available
};

/**
 * Calculates wind gust using an adaptive gust factor based on weather conditions
 * @param {number} windSpeed - Wind speed in m/s
 * @param {any} smartSymbol - Smart symbol from API
 * @returns {number} - Calculated wind gust in m/s (rounded)
 */
const calculateWindGust = (windSpeed, smartSymbol) => {
  // Default gust factor
  let gustFactor = 1.5;

  // If wind speed is not a valid number, return '--'
  if (windSpeed === '--' || windSpeed === undefined || windSpeed === null) {
    return '--';
  }

  // Get the weather description based on the smartSymbol
  let weatherDescription = '';

  // Try to get the description from the iconDescriptions mapping
  if (smartSymbol !== undefined && smartSymbol !== null) {
    const symbolStr = String(smartSymbol);

    // Check if the symbol exists in the iconDescriptions mapping
    if (iconDescriptions[symbolStr]) {
      weatherDescription = iconDescriptions[symbolStr].toLowerCase();
    } else {
      // If not found in the mapping, use the getWeatherCondition function
      weatherDescription = getWeatherCondition(smartSymbol).toLowerCase();
    }
  }

  // Determine the gust factor based on the weather description
  // Group 1: Stable, calm conditions (gust factor 1.3)
  if (
    weatherDescription.includes('clear') ||
    weatherDescription.includes('mostly clear') ||
    weatherDescription.includes('partly cloudy') ||
    weatherDescription.includes('mostly cloudy') ||
    weatherDescription.includes('cloudy') ||
    weatherDescription.includes('fog') ||
    weatherDescription.includes('drizzle') ||
    weatherDescription.includes('freezing drizzle')
  ) {
    gustFactor = 1.3;
  }
  // Group 2: Moderate variability or instability (gust factor 1.5)
  else if (
    weatherDescription.includes('shower') ||
    weatherDescription.includes('isolated rain') ||
    weatherDescription.includes('scattered') ||
    weatherDescription.includes('light rain') ||
    weatherDescription.includes('moderate rain') ||
    weatherDescription.includes('heavy rain') ||
    weatherDescription.includes('sleet') ||
    weatherDescription.includes('snow') ||
    weatherDescription.includes('occasional')
  ) {
    gustFactor = 1.5;
  }
  // Group 3: Highly unstable or convective conditions (gust factor 1.8)
  else if (
    weatherDescription.includes('thunder') ||
    weatherDescription.includes('storm') ||
    weatherDescription.includes('hail')
  ) {
    gustFactor = 1.8;
  }

  // Calculate and round the wind gust using only the gust factor method
  // This is the only method used now, no maximum wind speed calculation
  return Math.round(windSpeed * gustFactor);
};

/**
 * Maps weather condition to our app's weather condition
 * @param {any} smartSymbol - Smart symbol from API
 * @returns {string} - Weather condition string
 */
const getWeatherCondition = (smartSymbol) => {
  // Default to cloudy if no valid value
  if (smartSymbol === undefined || smartSymbol === null) {
    return 'cloudy';
  }

  // Handle different types of smartSymbol
  try {
    // Convert to string if it's not already
    const symbolStr = String(smartSymbol).toLowerCase();

    // Check if it's a numeric value
    if (!isNaN(Number(symbolStr))) {
      const code = Number(symbolStr);
      // Map numeric weather codes to conditions
      if (code === 1 || code === 100) return 'sunny'; // Clear
      if (code === 2 || code === 200) return 'partlyCloudy'; // Partly cloudy
      if (code === 3 || code === 300) return 'cloudy'; // Cloudy
      if (code === 4 || code === 400) return 'rain'; // Rain
      if (code === 5 || code === 500) return 'heavyRain'; // Heavy rain
      if (code === 6 || code === 600) return 'snow'; // Snow
      if (code === 7 || code === 700) return 'fog'; // Fog
      if (code === 8 || code === 800) return 'thunderstorm'; // Thunderstorm
    }

    // String matching for text-based weather codes
    if (symbolStr.includes('clear') || symbolStr.includes('sunny')) return 'sunny';
    if (symbolStr.includes('partly') && (symbolStr.includes('cloudy') || symbolStr.includes('clear'))) return 'partlyCloudy';
    if (symbolStr.includes('cloudy') || symbolStr.includes('overcast')) return 'cloudy';
    if (symbolStr.includes('fog') || symbolStr.includes('mist')) return 'fog';
    if (symbolStr.includes('drizzle')) return 'rain';
    if (symbolStr.includes('rain') && (symbolStr.includes('heavy') || symbolStr.includes('intense'))) return 'heavyRain';
    if (symbolStr.includes('rain')) return 'rain';
    if (symbolStr.includes('snow')) return 'snow';
    if (symbolStr.includes('sleet')) return 'sleet';
    if (symbolStr.includes('shower')) return 'showers';
    if (symbolStr.includes('thunder')) return 'thunderstorm';
  } catch (error) {
    console.warn('Error processing smartSymbol:', error);
  }

  // Default fallback
  return 'cloudy';
};

/**
 * Fetches weather data from the specified API
 * @param {Object} options - Options for the API request
 * @param {string} options.location - Location name
 * @param {number} options.latitude - Latitude coordinate
 * @param {number} options.longitude - Longitude coordinate
 * @param {number} options.days - Number of days to forecast (default: 7)
 * @returns {Promise<Object>} - Formatted weather data
 */
export const fetchWeatherData = async ({
  location = 'Thimphu',
  latitude = 27.4660892,
  longitude = 89.6419067,
  days = 11
}) => {
  try {
    // Calculate start and end dates
    const today = new Date();
    const endDate = addDays(today, days);

    // Format dates for API using the format from your example (yyyyMMddTHHmmss)
    // Use yesterday's date as the start date to ensure we get today's data
    const yesterdayDate = addDays(today, -1);
    const startDateStr = format(yesterdayDate, "yyyyMMdd'T'000000");
    const endDateStr = format(endDate, "yyyyMMdd'T'000000");

    // Format coordinates for APIs
    const coordinates = `${latitude},${longitude}`;

    // Build API URL with parameters - without timestamp
    const url = `${API_BASE_URL}?producer=meteor_edit&param=Time,Temperature,Precipitation1h,latlon,WindSpeedMS,WindDirection,smartsymbol&starttime=${startDateStr}&endtime=${endDateStr}&latlon=${coordinates}&format=json`;

    // Fetch data from API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Standard time slots we want to display (3am, 9am, 3pm, 9pm)
    const standardTimeSlots = [3, 9, 15, 21];

    // Prepare day names for display
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Use today's date directly (no conversion needed as API data is already in Bhutan time)
    const bhutanToday = today;



    // NEW APPROACH: Use the actual dates from the API data
    // Map the API data to our forecast days based on exact date matching

    // Step 1: Group API data by date
    const apiDataByDate = new Map();
    // Create a map to store all hourly data (for rainfall calculation)
    const hourlyDataByDate = new Map();

    if (data && Array.isArray(data)) {
      // Sort the data by date
      const sortedData = [...data].sort((a, b) => {
        const dateA = parseISO(a.Time);
        const dateB = parseISO(b.Time);
        return dateA - dateB;
      });

      // Get unique dates from the API data
      const uniqueDates = new Set();
      let apiYear = null;

      sortedData.forEach(item => {
        try {
          // Parse the timestamp directly (API data is already in Bhutan time)
          const timestamp = parseISO(item.Time);
          const dateStr = format(timestamp, 'yyyy-MM-dd');
          uniqueDates.add(dateStr);

          // Store the year from the first item to check for year mismatch
          if (apiYear === null) {
            apiYear = timestamp.getFullYear();
          }
        } catch (error) {
          console.error('Error processing date:', error);
        }
      });

      // Convert to array and sort
      const apiDates = Array.from(uniqueDates).sort();

      // Check for year mismatch between API data and system date
      const systemYear = bhutanToday.getFullYear();

      // If there's a year mismatch, we need to adjust the API dates to match the system year
      const yearMismatch = apiYear !== systemYear;

      // Initialize the map for each date
      // We'll initialize the map entries when processing the data items
      // This is because we might need to adjust the dates if there's a year mismatch

      // Create a map to store the adjusted dates
      const dateMapping = new Map();

      // If there's a year mismatch, create a mapping from original API dates to adjusted dates
      if (yearMismatch && apiYear !== null && systemYear !== null) {
        apiDates.forEach(dateStr => {
          // Extract month and day from the API date
          const [_, apiDateMonth, apiDateDay] = dateStr.split('-');

          // Create a new date string with the system year
          const adjustedDateStr = `${systemYear}-${apiDateMonth}-${apiDateDay}`;

          // Store the mapping
          dateMapping.set(dateStr, adjustedDateStr);
        });
      }

      // Process each item and add to the appropriate date
      sortedData.forEach(item => {
        try {
          // Parse the timestamp directly (API data is already in Bhutan time)
          const timestamp = parseISO(item.Time);
          const originalDateStr = format(timestamp, 'yyyy-MM-dd');
          const hour = timestamp.getHours();

          // Determine the date string to use (adjusted if there's a year mismatch)
          const dateStr = yearMismatch ? (dateMapping.get(originalDateStr) || originalDateStr) : originalDateStr;

          // Check if the data has actual values (not null)
          // IMPORTANT: The API returns numbers without quotes, so we need to check for undefined, null, or empty string
          const hasTemperature = item.Temperature !== undefined && item.Temperature !== null && item.Temperature !== '';
          const hasPrecipitation = item.Precipitation1h !== undefined && item.Precipitation1h !== null && item.Precipitation1h !== '';

          // Store all hourly data for rainfall calculation
          if (hasTemperature || hasPrecipitation) {
            // Initialize the map entry if it doesn't exist
            if (!hourlyDataByDate.has(dateStr)) {
              hourlyDataByDate.set(dateStr, []);
            }

            // Store all hourly data
            hourlyDataByDate.get(dateStr).push({
              hour,
              temperature: hasTemperature ? parseFloat(item.Temperature) : '--',
              precipitation: hasPrecipitation ? parseFloat(item.Precipitation1h) : 0, // Use 0 for rainfall calculation if missing
              smartsymbol: item.smartsymbol
            });
          }

          // Only add standard time slots to the apiDataByDate
          if (standardTimeSlots.includes(hour) && hasTemperature) {
            const hasWindSpeed = item.WindSpeedMS !== undefined && item.WindSpeedMS !== null && item.WindSpeedMS !== '';
            const hasWindDirection = item.WindDirection !== undefined && item.WindDirection !== null && item.WindDirection !== '';

            // Initialize the map entry if it doesn't exist
            if (!apiDataByDate.has(dateStr)) {
              apiDataByDate.set(dateStr, []);
            }

            apiDataByDate.get(dateStr).push({
              hour,
              temperature: hasTemperature ? parseFloat(item.Temperature) : '--',
              precipitation: hasPrecipitation ? parseFloat(item.Precipitation1h) : '--',
              windSpeed: hasWindSpeed ? parseFloat(item.WindSpeedMS) : '--',
              windDirection: hasWindDirection ? parseFloat(item.WindDirection) : '--',
              smartsymbol: item.smartsymbol
            });
          }
        } catch (error) {
          console.error('Error processing item:', error);
        }
      });
    }

    // Step 2: Create forecast days using the API data mapped to system dates
    const forecastDays = [];

    // Get the dates with data
    const datesWithData = Array.from(apiDataByDate.keys()).sort();

    // Create forecast days for today and the next 10 days
    for (let i = 0; i <= 10; i++) {
      // Calculate the date for this forecast day
      const forecastDate = addDays(bhutanToday, i);
      const dayName = i === 0 ? 'Today' : dayNames[forecastDate.getDay()];
      const forecastDateStr = format(forecastDate, 'yyyy-MM-dd');

      // Create the forecast day entry
      const forecastDay = {
        day: dayName,
        date: format(forecastDate, 'dd.MM'),
        hourlyForecasts: [],
        dayIndex: i,
      };

      // Find the API data for this specific date
      // Instead of using chronological order, match the exact date from the API data
      const apiDateStr = datesWithData.find(date => date === forecastDateStr);



      if (apiDateStr && apiDataByDate.has(apiDateStr) && apiDataByDate.get(apiDateStr).length > 0) {
        // Get the API data for this date
        const apiItems = apiDataByDate.get(apiDateStr);

        // Process each standard time slot
        standardTimeSlots.forEach(slotHour => {
          // Find the API item for this hour
          const apiItem = apiItems.find(item => item.hour === slotHour);

          // IMPORTANT: Check if apiItem exists and has a valid temperature value
          if (apiItem) {

            // Calculate derived values
            const temperatureValue = apiItem.temperature;
            const precipitationValue = apiItem.precipitation;
            const windSpeedValue = apiItem.windSpeed;
            const windDirectionValue = apiItem.windDirection;

            // Calculate min temperature (approximation) - use '--' if temperature is missing
            const minTemperature = temperatureValue !== '--' ? Math.round(temperatureValue - 2) : '--';

            // Calculate feels like temperature (approximation) - use '--' if temperature or wind speed is missing
            const feelsLike = temperatureValue !== '--' && windSpeedValue !== '--'
              ? Math.round(temperatureValue - (windSpeedValue > 5 ? 1 : 0))
              : '--';

            // Calculate chance of rain (approximation based on precipitation) - use '--' if precipitation is missing
            const chanceOfRain = precipitationValue !== '--' && precipitationValue > 0
              ? Math.min(100, Math.round(precipitationValue * 30))
              : precipitationValue !== '--' ? 0 : '--';

            // Calculate 6-hourly rainfall total
            const hourlyData = hourlyDataByDate.get(apiDateStr) || [];
            const rainfall6h = calculate6HourlyRainfall(hourlyData, slotHour, apiDateStr, hourlyDataByDate);

            // Add the forecast for this hour
            forecastDay.hourlyForecasts.push({
              hour: `${slotHour.toString().padStart(2, '0')}`,
              temperature: temperatureValue !== '--' ? Math.round(temperatureValue) : '--',
              minTemperature,
              feelsLike,
              weatherCondition: getWeatherCondition(apiItem.smartsymbol),
              smartsymbol: apiItem.smartsymbol, // Include the smartsymbol for the icon
              windSpeed: windSpeedValue !== '--' ? Math.round(windSpeedValue) : '--',
              windGust: windSpeedValue !== '--' ? calculateWindGust(windSpeedValue, apiItem.smartsymbol) : '--', // Adaptive wind gust calculation
              windDirection: getWindDirection(windDirectionValue),
              chanceOfRain,
              rainfall: rainfall6h, // Use 6-hourly rainfall total
              rainfallDuration: '(6h)', // Now using 6-hourly precipitation
            });
          } else {
            // No data for this hour, add placeholder
            forecastDay.hourlyForecasts.push({
              hour: `${slotHour.toString().padStart(2, '0')}`,
              temperature: '--',
              minTemperature: '--',
              feelsLike: '--',
              weatherCondition: 'cloudy',
              smartsymbol: 7, // Default cloudy icon
              windSpeed: '--',
              windGust: '--',
              windDirection: 'N',
              chanceOfRain: '--',
              rainfall: '--',
              rainfallDuration: '(6h)',
            });
          }
        });
      } else {
        // No API data found for this day, creating placeholder data

        // No API data for this day, add placeholders for all standard time slots
        standardTimeSlots.forEach(hour => {
          forecastDay.hourlyForecasts.push({
            hour: `${hour.toString().padStart(2, '0')}`,
            temperature: '--',
            minTemperature: '--',
            feelsLike: '--',
            weatherCondition: 'cloudy',
            smartsymbol: 7, // Default cloudy icon
            windSpeed: '--',
            windGust: '--',
            windDirection: 'N',
            chanceOfRain: '--',
            rainfall: '--',
            rainfallDuration: '(6h)',
          });
        });
      }

      // Add this day to the forecast days array
      forecastDays.push(forecastDay);
    }



    // Get current time as fallback (we'll format it to show as Bhutan time)
    const now = new Date();

    // Fetch the latest update time from the admin API
    const latestUpdateTime = await fetchLatestUpdateTime();

    // Use the fetched update time if available, otherwise use current time
    // Always display with (BT) to indicate Bhutan Time
    const updatedAt = latestUpdateTime || (format(now, 'dd.MM.yyyy HH:mm') + ' (BT)');

    return {
      location,
      updatedAt,
      forecast: forecastDays,
      units: {
        temperature: '°C',
        windSpeed: 'm/s',
        precipitation: 'mm',
      }
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
