import React from 'react';
import WeatherCard from './WeatherCard';
import styled from 'styled-components';
import {
  TimeseriesGrid,
  DayColumn,
  DayHeader,
  ResponsiveContainer,
  SectionContainer
} from '../../styles/WeatherStyles';

// Create a container for the integrated table
const IntegratedTableContainer = styled.div`
  width: 100%;
  min-width: ${props => props.$activeTab === '7-days' ? '1400px' : '800px'}; /* Reduced min-width for better fit */
  max-width: 100%; /* Ensure it doesn't exceed container width */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden; /* Hide overflow instead of making it visible */
  display: table;
  border-collapse: collapse;
  table-layout: auto; /* Changed from fixed to auto to allow flexible column widths */
  box-sizing: border-box;
  height: 100%;
`;

// Create a custom grid for the tabs
const CustomTimeseriesGrid = styled(TimeseriesGrid)`
  grid-template-columns: ${props => {
    // For 3-days tab with varying first day time slots
    if (props.$columns === 4 && props.$firstDayTimeSlots < 4 && props.$firstDayTimeSlots > 0) {
      // Make the first column width based on content and give the remaining columns equal width
      return `minmax(${props.$firstDayTimeSlots * 50}px, auto) repeat(3, 1fr)`;
    }
    // For 7-days tab, use equal width columns that fill the available space
    else if (props.$columns === 7) {
      return `repeat(7, 1fr)`;
    }
    // For regular cases, distribute evenly
    else if (props.$columns >= 1 && props.$columns <= 10) {
      return `repeat(${props.$columns}, 1fr)`;
    } else {
      // Default to 4 equal columns if the number is out of range
      return 'repeat(4, 1fr)';
    }
  }};
  flex: 1; /* Make the grid take up all available space */
  min-width: ${props => {
    // If the first day has fewer time slots, adjust the minimum width
    if (props.$columns === 4 && props.$firstDayTimeSlots < 4 && props.$firstDayTimeSlots > 0) {
      // Calculate the width based on the number of time slots
      const firstColumnWidth = props.$firstDayTimeSlots * 50; // 50px per time slot
      const otherColumnsWidth = 3 * 180; // 180px per column for the other 3 columns
      return `${firstColumnWidth + otherColumnsWidth}px`;
    }
    // For 7-days tab, use slightly narrower columns
    if (props.$columns === 7) {
      return `${props.$columns * 180}px`; // 180px per column for 7-days tab (reduced from 220px)
    }
    // Otherwise, use the standard calculation
    return `${props.$columns * 180}px`;
  }}; /* Ensure minimum width based on number of columns */
  width: 100%; /* Always use 100% width to fill container */
  margin: 0; /* Remove any margin */
  padding: 0; /* Remove any padding */
  height: 100%; /* Ensure the grid takes full height */
  align-items: stretch; /* Stretch items vertically */

  /* Make columns fit the entire width of the container */
  & > * {
    width: 100%;
    min-width: 0; /* Allow columns to shrink below their content size if needed */
    box-sizing: border-box;
  }
`;

// Table row component
const TableRow = styled.div`
  display: table-row;
  width: 100%;
  box-sizing: border-box;
`;

// Specific row heights for different parameter types
const TimeRow = styled(TableRow)`
  height: 50px;
  min-height: 50px; /* Ensure minimum height */
  box-sizing: border-box;
`;

const WeatherRow = styled(TableRow)`
  height: 60px;
  min-height: 60px; /* Ensure minimum height */
  box-sizing: border-box;
`;

const TemperatureRow = styled(TableRow)`
  height: 50px;
  min-height: 50px; /* Ensure minimum height */
  box-sizing: border-box;
`;

const WindRow = styled(TableRow)`
  height: 100px;
  min-height: 100px; /* Ensure minimum height */
  box-sizing: border-box;
`;

const RainfallRow = styled(TableRow)`
  height: 50px;
  min-height: 50px; /* Ensure minimum height */
  box-sizing: border-box;
`;

// Table cell component
const TableCell = styled.div`
  display: table-cell;
  vertical-align: middle;
  border-right: 1px solid #eee;
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;

  &:last-child {
    border-right: none;
  }
`;

// Parameter label cell
const ParameterLabelCell = styled(TableCell)`
  width: 140px; /* Match ParameterHeaderCell width */
  background-color: #f9f9f9;
  font-size: 12px;
  font-weight: 600;
  color: #0000cc;
  text-align: center;
  padding: 10px 5px;
  border-right: 1px solid #ddd;
`;

// Header row
const HeaderRow = styled(TableRow)`
  background-color: #4a4a9e;
  color: white;
`;

// Header cell
const HeaderCell = styled(TableCell)`
  padding: 10px 5px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 1px solid #3a3a8e;
  height: 40px;
  min-height: 40px;
  box-sizing: border-box;
  line-height: 1.2;
  width: 25%; /* Fixed width for all columns except Today in 3-days tab */
`;

// Non-Today header cell with fixed width based on time slots
const NonTodayHeaderCell = styled(HeaderCell)`
  width: ${props => {
    // For 3-days tab, use fixed width based on 4 time slots (same as 7-days approach)
    if (props.$activeTab === '3-days') {
      // Each time slot gets a fixed width, non-Today columns always have 4 time slots
      const timeSlotWidth = 50; // Fixed width per time slot in pixels
      const columnWidth = 4 * timeSlotWidth; // 4 time slots × 50px = 200px
      return `${columnWidth}px`;
    }
    // For 7-days tab, use auto to maintain existing behavior
    return 'auto';
  }};

  box-sizing: border-box;
`;

// Today header cell with responsive width based on time slots
const TodayHeaderCell = styled(HeaderCell)`
  width: ${props => {
    // Calculate width based on the number of time slots using fixed time slot width
    const timeSlotWidth = 50; // Fixed width per time slot in pixels (same as non-Today columns)
    const columnWidth = props.$timeSlots * timeSlotWidth; // Number of time slots × 50px
    return props.$timeSlots > 0 ? `${columnWidth}px` : '0';
  }};
`;

// Parameter header cell
const ParameterHeaderCell = styled(HeaderCell)`
  background-color: #4a4a9e;
  width: 140px; /* Slightly wider to accommodate parameter names */
  border-right: 1px solid #3a3a8e;
`;

// Weather data cell
const WeatherDataCell = styled(TableCell)`
  padding: 0;
  vertical-align: middle; /* Center content vertically */
  overflow: hidden; /* Hide overflow */
  width: 25%; /* Fixed width for all columns except Today in 3-days tab */
  box-sizing: border-box;
  height: 100%; /* Ensure full height */

  .day-forecasts {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    width: 100%;
    height: 100%; /* Ensure full height */
    justify-content: stretch; /* Let cards stretch to fill column */
    gap: 4px; /* Small gap between timesteps */
    overflow: hidden; /* Hide overflow */
  }

  .weather-card {
    flex: 1 1 0; /* Let each card grow to fill available space */
    min-width: 0; /* Allow shrinking if needed */
    width: auto; /* Remove fixed width */
    box-sizing: border-box;
    overflow: hidden; /* Hide overflow */
    padding: 0; /* No extra padding */
    margin: 0; /* No extra margin */
    height: 100%; /* Ensure full height */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center content vertically */

    /* Special styling for the "No more forecasts" message */
    &.message-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #666;
      font-style: italic;
    }
  }
`;

// Non-Today data cell with fixed width based on time slots
const NonTodayDataCell = styled(WeatherDataCell)`
  width: ${props => {
    // For 3-days tab, use fixed width based on 4 time slots (same as 7-days approach)
    if (props.$activeTab === '3-days') {
      // Each time slot gets a fixed width, non-Today columns always have 4 time slots
      const timeSlotWidth = 50; // Fixed width per time slot in pixels
      const columnWidth = 4 * timeSlotWidth; // 4 time slots × 50px = 200px
      return `${columnWidth}px`;
    }
    // For 7-days tab, use auto to maintain existing behavior
    return 'auto';
  }};

  box-sizing: border-box;
`;

// Today data cell with responsive width based on time slots
const TodayDataCell = styled(WeatherDataCell)`
  width: ${props => {
    // Calculate width based on the number of time slots using fixed time slot width
    const timeSlotWidth = 50; // Fixed width per time slot in pixels (same as non-Today columns)
    const columnWidth = props.$timeSlots * timeSlotWidth; // Number of time slots × 50px
    return props.$timeSlots > 0 ? `${columnWidth}px` : '0';
  }};
  box-sizing: border-box;
  overflow: hidden; /* Hide overflow instead of making it visible */
  height: 100%; /* Ensure full height */

  .day-forecasts {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    width: 100%;
    height: 100%; /* Ensure full height */
    justify-content: stretch; /* Let cards stretch to fill column */
    gap: 4px; /* Small gap between timesteps */
    overflow: hidden; /* Hide overflow */
  }

  .weather-card {
    flex: 1 1 0; /* Let each card grow to fill available space */
    min-width: 0; /* Allow shrinking if needed */
    width: auto; /* Remove fixed width */
    box-sizing: border-box;
    overflow: hidden; /* Hide overflow */
    padding: 0; /* No extra padding */
    margin: 0; /* No extra margin */
    height: 100%; /* Ensure full height */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center content vertically */
  }
`;

const TimeseriesDisplay = ({
  forecast,
  days,
  activeTab = '3-days'
}) => {
  // Initialize variables for display

  let displayForecast;
  let columnsToShow = days;
  let firstDayTimeSlots = 4; // Default to 4 time slots for the first day

  if (activeTab === '3-days') {
    // For 3-days tab, show first 4 days (today + 3 more)
    // Make sure we're starting with today (dayIndex 0)
    const todayIndex = forecast.findIndex(day => day.dayIndex === 0);

    if (todayIndex >= 0) {
      // If today exists in the forecast, start from there
      displayForecast = forecast.slice(todayIndex, todayIndex + days);

    } else {
      // If today doesn't exist, just use the first days
      displayForecast = forecast.slice(0, days);
    }

    // Get the number of time slots for the first day
    firstDayTimeSlots = displayForecast[0]?.hourlyForecasts.length || 0;

    // Ensure the first day is labeled as "Today" and other days have correct names
    if (displayForecast.length > 0) {
      // First column should always be "Today" without a date
      displayForecast[0].day = 'Today';

      // Update the day names for the other days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();

      // Start from index 1 (skip Today)
      for (let i = 1; i < displayForecast.length; i++) {
        const day = displayForecast[i];

        // Calculate the actual date for this forecast day (today + i days)
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i); // Use i instead of dayIndex to ensure sequential days

        // Update the day name based on the calculated date
        day.day = dayNames[forecastDate.getDay()];

        // Update the date format if needed
        day.date = `${String(forecastDate.getDate()).padStart(2, '0')}.${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;

        // Update the dayIndex to match the sequential order
        day.dayIndex = i;

      }
    }

    // Log the hourly forecasts for today to help with debugging
    if (displayForecast.length > 0 && displayForecast[0].day === 'Today') {
    }

    // For today, only show future time slots
    if (displayForecast.length > 0 && displayForecast[0].day === 'Today') {
      // Get current hour in Bhutan time (UTC+6)
      const now = new Date();
      const currentUtcHour = now.getUTCHours();
      const currentBhutanHour = (currentUtcHour + 6) % 24;

      // Standard time slots we want to display
      const standardTimeSlots = [3, 9, 15, 21];

      // Filter to only future time slots
      const futureTimeSlots = standardTimeSlots.filter(hour => hour > currentBhutanHour);

      // If all time slots are in the past, remove Today column completely
      if (futureTimeSlots.length === 0) {
        // Remove the Today column from displayForecast
        displayForecast.shift();

        // If we still have days left, adjust columnsToShow
        if (displayForecast.length > 0) {
          columnsToShow = displayForecast.length;
        }

        // Set firstDayTimeSlots to 0 to indicate no Today column
        firstDayTimeSlots = 0;
      } else {
        // Get the existing hours from the hourly forecasts
        const existingHours = displayForecast[0].hourlyForecasts.map(forecast =>
          parseInt(forecast.hour, 10)
        );

        // Filter existing forecasts to only include future time slots
        let futureForecasts = displayForecast[0].hourlyForecasts.filter(forecast =>
          futureTimeSlots.includes(parseInt(forecast.hour, 10))
        );

        // Find missing future time slots
        const existingFutureHours = futureForecasts.map(forecast =>
          parseInt(forecast.hour, 10)
        );
        const missingFutureHours = futureTimeSlots.filter(hour =>
          !existingFutureHours.includes(hour)
        );

        // Add placeholders for missing future time slots
        if (missingFutureHours.length > 0) {
          const placeholders = missingFutureHours.map(hour => {
            return {
              hour: `${hour.toString().padStart(2, '0')}`,
              temperature: '--',
              minTemperature: '--',
              feelsLike: '--',
              weatherCondition: 'cloudy',
              windSpeed: '--',
              windGust: '--',
              windDirection: 'N',
              chanceOfRain: '--',
              rainfall: '--',
              rainfallDuration: '(1h)',
            };
          });

          // Add placeholders to future forecasts
          futureForecasts = [...futureForecasts, ...placeholders];
        }

        // Sort future forecasts by hour
        futureForecasts.sort((a, b) => {
          const hourA = parseInt(a.hour, 10);
          const hourB = parseInt(b.hour, 10);
          return hourA - hourB;
        });

        // Update hourly forecasts to only include future time slots
        displayForecast[0].hourlyForecasts = futureForecasts;

        // Update firstDayTimeSlots to the number of future time slots
        firstDayTimeSlots = futureForecasts.length;
      }
    }

    // Always use exactly 4 columns for 3-days tab
    columnsToShow = 4;

    // Ensure all days in the 3-days tab have exactly 4 time slots
    for (let i = 1; i < displayForecast.length; i++) {
      const day = displayForecast[i];

      // Standard time slots we want to display
      const standardTimeSlots = [3, 9, 15, 21];

      // If no hourly forecasts, add placeholders for all standard time slots
      if (!day.hourlyForecasts || day.hourlyForecasts.length === 0) {
        day.hourlyForecasts = standardTimeSlots.map(hour => ({
          hour: `${hour.toString().padStart(2, '0')}`,
          temperature: '--',
          minTemperature: '--',
          feelsLike: '--',
          weatherCondition: 'cloudy',
          windSpeed: '--',
          windGust: '--',
          windDirection: 'N',
          chanceOfRain: '--',
          rainfall: '--',
          rainfallDuration: '(1h)',
        }));
      }
      // If we have some hourly forecasts but not all 4 standard ones, add placeholders for missing ones
      else if (day.hourlyForecasts.length < 4) {

        // Get the existing hours
        const existingHours = day.hourlyForecasts.map(forecast =>
          parseInt(forecast.hour, 10)
        );

        // Find missing time slots
        const missingHours = standardTimeSlots.filter(hour => !existingHours.includes(hour));

        if (missingHours.length > 0) {
          // Add placeholders for missing time slots with '--' for all missing data
          const placeholders = missingHours.map(hour => {
            return {
              hour: `${hour.toString().padStart(2, '0')}`,
              temperature: '--',
              minTemperature: '--',
              feelsLike: '--',
              weatherCondition: 'cloudy',
              windSpeed: '--',
              windGust: '--',
              windDirection: 'N',
              chanceOfRain: '--',
              rainfall: '--',
              rainfallDuration: '(1h)',
            };
          });

          // Add placeholders to hourlyForecasts
          day.hourlyForecasts = [...day.hourlyForecasts, ...placeholders];

          // Sort hourlyForecasts by hour
          day.hourlyForecasts.sort((a, b) => {
            const hourA = parseInt(a.hour, 10);
            const hourB = parseInt(b.hour, 10);
            return hourA - hourB;
          });

        }
      }
      // If we have more than 4 hourly forecasts, filter to keep only the standard ones
      else if (day.hourlyForecasts.length > 4) {

        // Filter to keep only the standard time slots
        const filteredForecasts = [];

        // First try to find exact matches for standard time slots
        standardTimeSlots.forEach(hour => {
          const exactMatch = day.hourlyForecasts.find(forecast =>
            parseInt(forecast.hour, 10) === hour
          );

          if (exactMatch) {
            filteredForecasts.push(exactMatch);
          } else {
            // If no exact match, find the closest hour
            let closestForecast = null;
            let minDiff = 24;

            day.hourlyForecasts.forEach(forecast => {
              const forecastHour = parseInt(forecast.hour, 10);
              const diff = Math.abs(forecastHour - hour);

              if (diff < minDiff) {
                minDiff = diff;
                closestForecast = forecast;
              }
            });

            if (closestForecast) {
              // Create a copy with the standard hour
              const standardForecast = {
                ...closestForecast,
                hour: `${hour.toString().padStart(2, '0')}`,
              };

              filteredForecasts.push(standardForecast);
            } else {
              // Fallback to placeholder if no closest forecast found
              filteredForecasts.push({
                hour: `${hour.toString().padStart(2, '0')}`,
                temperature: '--',
                minTemperature: '--',
                feelsLike: '--',
                weatherCondition: 'cloudy',
                windSpeed: '--',
                windGust: '--',
                windDirection: 'N',
                chanceOfRain: '--',
                rainfall: '--',
                rainfallDuration: '(1h)',
              });
            }
          }
        });

        // Sort by hour
        filteredForecasts.sort((a, b) => {
          const hourA = parseInt(a.hour, 10);
          const hourB = parseInt(b.hour, 10);
          return hourA - hourB;
        });

        day.hourlyForecasts = filteredForecasts;
      }
    }
  } else {
    // For 7-days tab, show days 4-10 (the next 7 days after the 3-days tab)
    displayForecast = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 4; i < 11; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const dayName = dayNames[forecastDate.getDay()];
      const dateStr = `${String(forecastDate.getDate()).padStart(2, '0')}.${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      const forecastDay = forecast.find(day => day.dayIndex === i);
      displayForecast.push({
        day: dayName,
        date: dateStr,
        hourlyForecasts: forecastDay ? forecastDay.hourlyForecasts : [],
        dayIndex: i
      });
    }
    // Compute daily summary values for each day
    const dailySummaries = displayForecast.map(day => {
      const temps = day.hourlyForecasts.map(f => (typeof f.temperature === 'number' ? f.temperature : (parseFloat(f.temperature) || null))).filter(v => v !== null && v !== '--');
      const winds = day.hourlyForecasts.map(f => (typeof f.windSpeed === 'number' ? f.windSpeed : (parseFloat(f.windSpeed) || null))).filter(v => v !== null && v !== '--');
      const rainfalls = day.hourlyForecasts.map(f => (typeof f.rainfall === 'number' ? f.rainfall : (parseFloat(f.rainfall) || null))).filter(v => v !== null && v !== '--');
      return {
        tmax: temps.length ? Math.max(...temps) : '--',
        tmin: temps.length ? Math.min(...temps) : '--',
        windspeed: winds.length ? Math.round(Math.max(...winds)) : '--',
        rainfall: rainfalls.length ? rainfalls.reduce((a, b) => a + b, 0).toFixed(1) : '--',
        day: day.day,
        date: day.date
      };
    });
    // Render the summary table for 7-days tab
    return (
      <ResponsiveContainer>
        <SectionContainer style={{ marginTop: '0' }}>
          <IntegratedTableContainer $activeTab={activeTab} $columnsToShow={7}>
            {/* Header row with day names */}
            <HeaderRow>
              <ParameterHeaderCell>Parameters</ParameterHeaderCell>
              {dailySummaries.map((day, idx) => (
                <NonTodayHeaderCell key={idx} $activeTab={activeTab} $totalColumns={7}>
                  {`${day.day} ${day.date}`}
                </NonTodayHeaderCell>
              ))}
            </HeaderRow>
            {/* Tmax row */}
            <TableRow>
              <ParameterLabelCell>Tmax (°C)</ParameterLabelCell>
              {dailySummaries.map((day, idx) => (
                <TableCell key={idx} style={{ textAlign: 'center', fontWeight: 'bold', color: '#e53935' }}>{day.tmax !== '--' ? day.tmax : '--'}</TableCell>
              ))}
            </TableRow>
            {/* Tmin row */}
            <TableRow>
              <ParameterLabelCell>Tmin (°C)</ParameterLabelCell>
              {dailySummaries.map((day, idx) => (
                <TableCell key={idx} style={{ textAlign: 'center', color: '#1e88e5' }}>{day.tmin !== '--' ? day.tmin : '--'}</TableCell>
              ))}
            </TableRow>
            {/* Windspeed row */}
            <TableRow>
              <ParameterLabelCell>Windspeed (m/s)</ParameterLabelCell>
              {dailySummaries.map((day, idx) => (
                <TableCell key={idx} style={{ textAlign: 'center' }}>{day.windspeed !== '--' ? day.windspeed : '--'}</TableCell>
              ))}
            </TableRow>
            {/* Rainfall row */}
            <TableRow>
              <ParameterLabelCell>Rainfall (mm, 24h)</ParameterLabelCell>
              {dailySummaries.map((day, idx) => (
                <TableCell key={idx} style={{ textAlign: 'center' }}>{day.rainfall !== '--' ? day.rainfall : '--'}</TableCell>
              ))}
            </TableRow>
          </IntegratedTableContainer>
        </SectionContainer>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <SectionContainer style={{ marginTop: '0' }}>
        <IntegratedTableContainer
          $activeTab={activeTab}
          $firstDayTimeSlots={firstDayTimeSlots}
          $columnsToShow={columnsToShow}
        >
          {/* Header row with parameter header and day headers */}
          <HeaderRow>
            <ParameterHeaderCell>Parameters</ParameterHeaderCell>
            {displayForecast.map((day, index) => {
              // Use TodayHeaderCell for the first column in 3-days tab
              if (index === 0 && activeTab === '3-days') {
                return (
                  <TodayHeaderCell key={index} $timeSlots={firstDayTimeSlots}>
                    {day.day}
                  </TodayHeaderCell>
                );
              } else {
                return (
                  <NonTodayHeaderCell
                    key={index}
                    $activeTab={activeTab}
                    $firstDayTimeSlots={firstDayTimeSlots}
                    $totalColumns={columnsToShow}
                  >
                    {`${day.day} ${day.date}`}
                  </NonTodayHeaderCell>
                );
              }
            })}
          </HeaderRow>

          {/* Time row */}
          <TimeRow>
            <ParameterLabelCell>Time</ParameterLabelCell>
            {displayForecast.map((day, index) => {
              // Use TodayDataCell for the first column in 3-days tab
              if (index === 0 && activeTab === '3-days') {
                return (
                  <TodayDataCell key={index} $timeSlots={firstDayTimeSlots}>
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="time"
                        />
                      ))}
                    </div>
                  </TodayDataCell>
                );
              } else {
                return (
                  <NonTodayDataCell
                    key={index}
                    $activeTab={activeTab}
                    $firstDayTimeSlots={firstDayTimeSlots}
                    $totalColumns={columnsToShow}
                  >
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="time"
                        />
                      ))}
                    </div>
                  </NonTodayDataCell>
                );
              }
            })}
          </TimeRow>

          {/* Weather row */}
          <WeatherRow>
            <ParameterLabelCell>Weather</ParameterLabelCell>
            {displayForecast.map((day, index) => {
              // Use TodayDataCell for the first column in 3-days tab
              if (index === 0 && activeTab === '3-days') {
                return (
                  <TodayDataCell key={index} $timeSlots={firstDayTimeSlots}>
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="weather"
                        />
                      ))}
                    </div>
                  </TodayDataCell>
                );
              } else {
                return (
                  <NonTodayDataCell
                    key={index}
                    $activeTab={activeTab}
                    $firstDayTimeSlots={firstDayTimeSlots}
                    $totalColumns={columnsToShow}
                  >
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="weather"
                        />
                      ))}
                    </div>
                  </NonTodayDataCell>
                );
              }
            })}
          </WeatherRow>

          {/* Temperature row */}
          <TemperatureRow>
            <ParameterLabelCell>Temperature °C</ParameterLabelCell>
            {displayForecast.map((day, index) => {
              // Use TodayDataCell for the first column in 3-days tab
              if (index === 0 && activeTab === '3-days') {
                return (
                  <TodayDataCell key={index} $timeSlots={firstDayTimeSlots}>
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="temperature"
                        />
                      ))}
                    </div>
                  </TodayDataCell>
                );
              } else {
                return (
                  <NonTodayDataCell
                    key={index}
                    $activeTab={activeTab}
                    $firstDayTimeSlots={firstDayTimeSlots}
                    $totalColumns={columnsToShow}
                  >
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="temperature"
                        />
                      ))}
                    </div>
                  </NonTodayDataCell>
                );
              }
            })}
          </TemperatureRow>

          {/* Wind row */}
          <WindRow>
            <ParameterLabelCell>Wind m/s (gusts)</ParameterLabelCell>
            {displayForecast.map((day, index) => {
              // Use TodayDataCell for the first column in 3-days tab
              if (index === 0 && activeTab === '3-days') {
                return (
                  <TodayDataCell key={index} $timeSlots={firstDayTimeSlots}>
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="wind"
                        />
                      ))}
                    </div>
                  </TodayDataCell>
                );
              } else {
                return (
                  <NonTodayDataCell
                    key={index}
                    $activeTab={activeTab}
                    $firstDayTimeSlots={firstDayTimeSlots}
                    $totalColumns={columnsToShow}
                  >
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="wind"
                        />
                      ))}
                    </div>
                  </NonTodayDataCell>
                );
              }
            })}
          </WindRow>

          {/* Rainfall row */}
          <RainfallRow>
            <ParameterLabelCell>Rainfall mm (6h)</ParameterLabelCell>
            {displayForecast.map((day, index) => {
              // Use TodayDataCell for the first column in 3-days tab
              if (index === 0 && activeTab === '3-days') {
                return (
                  <TodayDataCell key={index} $timeSlots={firstDayTimeSlots}>
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="rainfall"
                        />
                      ))}
                    </div>
                  </TodayDataCell>
                );
              } else {
                return (
                  <NonTodayDataCell
                    key={index}
                    $activeTab={activeTab}
                    $firstDayTimeSlots={firstDayTimeSlots}
                    $totalColumns={columnsToShow}
                  >
                    <div className="day-forecasts">
                      {day.hourlyForecasts.map((hourForecast, hourIndex) => (
                        <WeatherCard
                          key={hourIndex}
                          forecast={hourForecast}
                          hour={hourForecast.hour}
                          className="weather-card"
                          isFirstInRow={index === 0}
                          section="rainfall"
                        />
                      ))}
                    </div>
                  </NonTodayDataCell>
                );
              }
            })}
          </RainfallRow>
        </IntegratedTableContainer>
      </SectionContainer>
    </ResponsiveContainer>
  );
};

export default TimeseriesDisplay;
