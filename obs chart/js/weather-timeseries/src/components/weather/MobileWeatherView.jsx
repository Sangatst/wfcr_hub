import React, { useState } from 'react';
import SmartSymbolIcon from './SmartSymbolIcon';
import '../../styles/MobileWeatherStyles.css';

/**
 * Mobile-specific view for the weather dashboard
 */
const MobileWeatherView = ({ forecast, days, activeTab = '3-days', location = 'Helsinki' }) => {
  // State for expanded sections
  const [expandedDay, setExpandedDay] = useState('today');

  // Process forecast data
  let displayForecast = [];

  if (activeTab === '3-days') {
    // For 3-days tab, show first 4 days (today + 3 more)
    const todayIndex = forecast.findIndex(day => day.dayIndex === 0);

    if (todayIndex >= 0) {
      displayForecast = forecast.slice(todayIndex, todayIndex + days);
    } else {
      displayForecast = forecast.slice(0, days);
    }

    // Ensure the first day is labeled as "Today"
    if (displayForecast.length > 0) {
      displayForecast[0].day = 'Today';

      // Filter today's forecasts to only show future hours
      const now = new Date();
      const currentHour = now.getHours();
      const standardTimeSlots = [3, 9, 15, 21];
      const futureTimeSlots = standardTimeSlots.filter(hour => hour > currentHour);

      if (futureTimeSlots.length === 0) {
        // If all time slots are in the past, remove Today
        displayForecast.shift();
      } else {
        // Filter to only include future time slots
        const futureForecasts = displayForecast[0].hourlyForecasts.filter(forecast => {
          const forecastHour = parseInt(forecast.hour, 10);
          return forecastHour > currentHour;
        });

        if (futureForecasts.length > 0) {
          displayForecast[0].hourlyForecasts = futureForecasts;
        }
      }
    }
  } else {
    // For 7-days tab, show days 4-10
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 4; i < 11; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const dayName = dayNames[forecastDate.getDay()];
      const dateStr = `${String(forecastDate.getDate()).padStart(2, '0')}.${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;

      const forecastDay = forecast.find(day => day.dayIndex === i);

      if (forecastDay) {
        displayForecast.push({
          ...forecastDay,
          day: dayName,
          date: dateStr,
          dayIndex: i
        });
      } else {
        displayForecast.push({
          day: dayName,
          date: dateStr,
          hourlyForecasts: [],
          dayIndex: i
        });
      }
    }
  }

  // Get the main forecast for a day (15:00 or first available)
  const getMainForecast = (day) => {
    if (!day || !day.hourlyForecasts || day.hourlyForecasts.length === 0) {
      return null;
    }

    // Try to get the 15:00 forecast first as it's typically the main one
    return day.hourlyForecasts.find(f => f.hour === '15') || day.hourlyForecasts[0];
  };

  // Render wind direction arrow
  const renderWindDirection = (direction) => {
    const directionSymbols = {
      'N': '↑',
      'NE': '↗',
      'E': '→',
      'SE': '↘',
      'S': '↓',
      'SW': '↙',
      'W': '←',
      'NW': '↖',
    };
    return directionSymbols[direction] || '↑';
  };

  return (
    <div className="mobile-container">
      {/* Today section */}
      {displayForecast[0]?.day === 'Today' && (
        <>
          <div className="mobile-header today-section" onClick={() => setExpandedDay(expandedDay === 'today' ? '' : 'today')}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="today-label">Today</div>
              {getMainForecast(displayForecast[0]) && (
                <div className="today-time">{getMainForecast(displayForecast[0]).hour}:00</div>
              )}
            </div>
            <div className="today-weather">
              {getMainForecast(displayForecast[0]) && (
                <>
                  <div className="today-temp">
                    {getMainForecast(displayForecast[0]).temperature !== '--'
                      ? `${getMainForecast(displayForecast[0]).temperature}°`
                      : '--°'}
                  </div>
                  <SmartSymbolIcon
                    symbolNumber={getMainForecast(displayForecast[0])?.smartsymbol || 1}
                    size={30}
                  />
                </>
              )}
              <div
                className="expand-icon"
                data-icon={expandedDay === 'today' ? '⌃' : '⌄'}
              ></div>
            </div>
          </div>

          {/* Today's hourly forecasts */}
          {expandedDay === 'today' && displayForecast[0]?.hourlyForecasts.map((hourForecast, index) => (
            <div className="hourly-forecast-item" key={index}>
              <div className="time-column">{hourForecast.hour}:00</div>
              <div className="weather-icon-column">
                <SmartSymbolIcon symbolNumber={hourForecast.smartsymbol || 1} size={40} />
              </div>
              <div className="temperature-column">
                <div className="main-temp">{hourForecast.temperature !== '--' ? `${hourForecast.temperature}°` : '--°'}</div>
              </div>
              <div className="wind-column">
                <div className="wind-info">
                  <div className="wind-direction">
                    {renderWindDirection(hourForecast.windDirection)}
                  </div>
                </div>
                <div className="wind-info">
                  <div className="wind-speed">
                    {hourForecast.windSpeed !== '--' ? hourForecast.windSpeed : '--'}
                    {hourForecast.windGust !== '--' ? ` (${hourForecast.windGust})` : ` (${Math.round(hourForecast.windSpeed * 1.5)})`}
                  </div>
                </div>
              </div>
              <div className="rain-column">
                <div className={`rain-amount ${parseFloat(hourForecast.rainfall) >= 1.0 ? 'significant' : ''}`}>
                  {hourForecast.rainfall !== '--' ? hourForecast.rainfall : '0.0'} (6h)
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Future days */}
      {displayForecast.map((day, index) => {
        // Skip Today as it's handled separately
        if (day.day === 'Today') return null;

        const mainForecast = getMainForecast(day);
        if (!mainForecast) return null;

        return (
          <React.Fragment key={index}>
            <div className="future-day-section" onClick={() => setExpandedDay(expandedDay === `day-${index}` ? '' : `day-${index}`)}>
              <div className="day-label">
                <div className="day-name">{day.day}</div>
                <div className="day-date">{day.date}</div>
                <div className="day-time">15:00</div>
              </div>
              <div className="day-weather">
                <div className="day-temp">{mainForecast?.temperature !== '--' ? `${mainForecast?.temperature}°` : '--°'}</div>
                <SmartSymbolIcon symbolNumber={mainForecast?.smartsymbol || 1} size={36} />
                <div
                  className="expand-icon"
                  data-icon={expandedDay === `day-${index}` ? '⌃' : '⌄'}
                ></div>
              </div>
            </div>

            {/* Day's hourly forecasts */}
            {expandedDay === `day-${index}` && day.hourlyForecasts.map((hourForecast, hourIndex) => (
              <div className="hourly-forecast-item" key={hourIndex}>
                <div className="time-column">{hourForecast.hour}:00</div>
                <div className="weather-icon-column">
                  <SmartSymbolIcon symbolNumber={hourForecast.smartsymbol || 1} size={40} />
                </div>
                <div className="temperature-column">
                  <div className="main-temp">{hourForecast.temperature !== '--' ? `${hourForecast.temperature}°` : '--°'}</div>
                </div>
                <div className="wind-column">
                  <div className="wind-info">
                    <div className="wind-direction">
                      {renderWindDirection(hourForecast.windDirection)}
                    </div>
                  </div>
                  <div className="wind-info">
                    <div className="wind-speed">
                      {hourForecast.windSpeed !== '--' ? hourForecast.windSpeed : '--'}
                      {hourForecast.windGust !== '--' ? ` (${hourForecast.windGust})` : ` (${Math.round(hourForecast.windSpeed * 1.5)})`}
                    </div>
                  </div>
                </div>
                <div className="rain-column">
                  <div className={`rain-amount ${parseFloat(hourForecast.rainfall) >= 1.0 ? 'significant' : ''}`}>
                    {hourForecast.rainfall !== '--' ? hourForecast.rainfall : '0.0'} (6h)
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MobileWeatherView;
