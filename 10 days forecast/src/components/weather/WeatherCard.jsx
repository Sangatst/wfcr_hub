import React from 'react';
import {
  WeatherCard as StyledWeatherCard,
  TimeDisplay,
  Temperature,
  FeelsLike,
  WeatherInfo,
  WeatherDetail,
  WindInfo,
  WindDirectionSymbol,
  RainChance,
  RainfallAmount,
  Divider
} from '../../styles/WeatherStyles';
import SmartSymbolIcon from './SmartSymbolIcon';

// Map wind direction to rotation angle
const windDirectionToAngle = {
  'N': 0,
  'NE': 45,
  'E': 90,
  'SE': 135,
  'S': 180,
  'SW': 225,
  'W': 270,
  'NW': 315,
};

// SVG arrow component
const WindDirectionArrowSVG = ({ direction }) => {
  const angle = windDirectionToAngle[direction] ?? 0;
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: `rotate(${angle}deg)` }}>
      <line x1="16" y1="10" x2="16" y2="22" stroke="#000099" strokeWidth="1" strokeLinecap="round" />
      <polygon points="16,6 13,13 19,13" fill="#000099" />
    </svg>
  );
};

const WeatherCard = ({
  forecast,
  hour,
  className = '',
  isFirstInRow = false,
  section = 'combined'
}) => {
  const renderContent = () => {
    // Check if this is a message card (for "No more forecasts for today")
    if (forecast.message) {
      return (
        <div style={{ padding: '10px', textAlign: 'center' }}>
          <TimeDisplay>{hour}</TimeDisplay>
          <div style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
            {forecast.message}
          </div>
        </div>
      );
    }

    switch (section) {
      case 'combined':
        return (
          <>
            <TimeDisplay>{hour}</TimeDisplay>
            <div style={{ fontSize: '10px', color: 'gray' }}>{forecast.smartsymbol}</div>
            <SmartSymbolIcon symbolNumber={forecast.smartsymbol} />

            {/* Temperature section */}
            <Temperature>{forecast.temperature}°</Temperature>
            {/* MinTemperature removed as requested */}

            <WeatherInfo>
              <WeatherDetail>
                {/* Wind direction with SVG arrow */}
                <WindInfo>
                  <WindDirectionSymbol>
                    <WindDirectionArrowSVG direction={forecast.windDirection} />
                  </WindDirectionSymbol>
                </WindInfo>

                {/* Wind speed */}
                <WindInfo>
                  <span>{forecast.windSpeed}</span>
                </WindInfo>

                {/* Wind gusts in parentheses */}
                <WindInfo>
                  <span>({forecast.windGust || Math.round(forecast.windSpeed * 1.5)})</span>
                </WindInfo>

                {/* Compact divider between wind and rainfall */}
                <Divider />

                {/* Rainfall amount only */}
                <RainfallAmount $amount={forecast.rainfall}>
                  {forecast.rainfall}
                </RainfallAmount>
              </WeatherDetail>
            </WeatherInfo>
          </>
        );
      case 'time':
        return (
          <div style={{
            textAlign: 'center',
            padding: '3px 0', // Consistent padding for all columns (same as 7-days tab)
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <TimeDisplay style={{
              fontSize: '11px', // Consistent font size for all columns (same as 7-days tab)
              padding: '2px 3px', // Consistent padding for all columns (same as 7-days tab)
              minWidth: 'auto' // Allow to shrink
            }}>{hour}</TimeDisplay>
          </div>
        );
      case 'weather':
        return (
          <div style={{
            textAlign: 'center',
            padding: '3px 0', // Consistent padding for all columns (same as 7-days tab)
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            {forecast.smartsymbol ? (
              <SmartSymbolIcon
                symbolNumber={forecast.smartsymbol}
                size={40} // Same size for all columns
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                margin: '0 auto'
              }}></div>
            )}
          </div>
        );
      case 'temperature':
        return (
          <div style={{
            textAlign: 'center',
            padding: '3px 0', // Consistent padding for all columns (same as 7-days tab)
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <Temperature style={{
              fontSize: '14px', // Consistent font size for all columns (same as 7-days tab)
              margin: '2px 0' // Consistent margin for all columns (same as 7-days tab)
            }}>
              {forecast.temperature !== undefined && forecast.temperature !== null && forecast.temperature !== '--'
                ? `${forecast.temperature}°`
                : '--°'}
            </Temperature>
          </div>
        );
      case 'wind':
        return (
          <div style={{
            textAlign: 'center',
            padding: '3px 0', // Consistent padding for all columns (same as 7-days tab)
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <WindInfo style={{
              fontSize: '12px', // Consistent font size for all columns (same as 7-days tab)
              margin: '1px 0' // Consistent margin for all columns (same as 7-days tab)
            }}>
              <WindDirectionSymbol>
                <WindDirectionArrowSVG direction={forecast.windDirection} />
              </WindDirectionSymbol>
            </WindInfo>
            <WindInfo style={{
              fontSize: '12px', // Consistent font size for all columns (same as 7-days tab)
              margin: '1px 0' // Consistent margin for all columns (same as 7-days tab)
            }}>
              <span>{forecast.windSpeed !== undefined && forecast.windSpeed !== null && forecast.windSpeed !== '--' ? forecast.windSpeed : '--'}</span>
            </WindInfo>
            <WindInfo style={{
              fontSize: '12px', // Consistent font size for all columns (same as 7-days tab)
              margin: '1px 0' // Consistent margin for all columns (same as 7-days tab)
            }}>
              <span>
                {forecast.windGust !== undefined && forecast.windGust !== null && forecast.windGust !== '--'
                  ? `(${forecast.windGust})`
                  : forecast.windSpeed !== undefined && forecast.windSpeed !== null && forecast.windSpeed !== '--'
                    ? `(${Math.round(forecast.windSpeed * 1.5)})`  // Using 1.5 as default gust factor for fallback
                    : '(--)'}
              </span>
            </WindInfo>
          </div>
        );
      case 'rainfall':
        return (
          <div style={{
            textAlign: 'center',
            padding: '3px 0', // Consistent padding for all columns (same as 7-days tab)
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <RainfallAmount
              $amount={forecast.rainfall !== undefined && forecast.rainfall !== null && forecast.rainfall !== '--' ? forecast.rainfall : 0}
              style={{
                fontSize: '12px', // Consistent font size for all columns (same as 7-days tab)
                margin: '2px 0' // Consistent margin for all columns (same as 7-days tab)
              }}
            >
              {forecast.rainfall !== undefined && forecast.rainfall !== null && forecast.rainfall !== '--' ? forecast.rainfall : '--'}
            </RainfallAmount>
          </div>
        );
      default:
        return null;
    }
  };

  // Determine if this is a card in the Today column
  const isTodayColumn = isFirstInRow && className.includes('weather-card');

  return (
    <StyledWeatherCard className={className} style={{
      overflow: 'hidden', // Hide overflow
      boxSizing: 'border-box',
      margin: '0 1px',
      padding: '8px 2px',
      minWidth: 0, // Allow card to shrink if needed
      maxWidth: '100%', // Prevent expanding beyond container
      height: '100%', // Ensure full height
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center' // Center content vertically
    }}>
      {renderContent()}
    </StyledWeatherCard>
  );
};

export default WeatherCard;
