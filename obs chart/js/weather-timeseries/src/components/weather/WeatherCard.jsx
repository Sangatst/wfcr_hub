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

// Define wind direction symbols directly in this file
const getWindDirectionSymbol = (direction) => {
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
                {/* Wind direction with arrow */}
                <WindInfo>
                  <WindDirectionSymbol>
                    {getWindDirectionSymbol(forecast.windDirection)}
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
            padding: isFirstInRow ? '1px 0' : '3px 0', // Less padding for Today column
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <TimeDisplay style={{
              fontSize: isFirstInRow ? '10px' : '11px', // Smaller font for Today column
              padding: isFirstInRow ? '1px 2px' : '2px 3px', // Less padding for Today column
              minWidth: 'auto' // Allow to shrink
            }}>{hour}</TimeDisplay>
          </div>
        );
      case 'weather':
        return (
          <div style={{
            textAlign: 'center',
            padding: isFirstInRow ? '1px 0' : '3px 0', // Less padding for Today column
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
            padding: isFirstInRow ? '1px 0' : '3px 0', // Less padding for Today column
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <Temperature style={{
              fontSize: isFirstInRow ? '12px' : '14px', // Smaller font for Today column
              margin: isFirstInRow ? '1px 0' : '2px 0' // Less margin for Today column
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
            padding: isFirstInRow ? '1px 0' : '3px 0', // Less padding for Today column
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <WindInfo style={{
              fontSize: isFirstInRow ? '10px' : '12px', // Smaller font for Today column
              margin: isFirstInRow ? '0' : '1px 0' // Less margin for Today column
            }}>
              <WindDirectionSymbol>
                {forecast.windDirection ? getWindDirectionSymbol(forecast.windDirection) : '-'}
              </WindDirectionSymbol>
            </WindInfo>
            <WindInfo style={{
              fontSize: isFirstInRow ? '10px' : '12px', // Smaller font for Today column
              margin: isFirstInRow ? '0' : '1px 0' // Less margin for Today column
            }}>
              <span>{forecast.windSpeed !== undefined && forecast.windSpeed !== null && forecast.windSpeed !== '--' ? forecast.windSpeed : '--'}</span>
            </WindInfo>
            <WindInfo style={{
              fontSize: isFirstInRow ? '10px' : '12px', // Smaller font for Today column
              margin: isFirstInRow ? '0' : '1px 0' // Less margin for Today column
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
            padding: isFirstInRow ? '1px 0' : '3px 0', // Less padding for Today column
            height: '100%', // Full height
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center' // Center vertically
          }}>
            <RainfallAmount
              $amount={forecast.rainfall !== undefined && forecast.rainfall !== null && forecast.rainfall !== '--' ? forecast.rainfall : 0}
              style={{
                fontSize: isFirstInRow ? '10px' : '12px', // Smaller font for Today column
                margin: isFirstInRow ? '1px 0' : '2px 0' // Less margin for Today column
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
