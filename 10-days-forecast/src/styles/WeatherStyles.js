import styled from 'styled-components';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(to bottom, #f0f8ff, #ffffff);
  border-radius: 12px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

export const Header = styled.header`
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8), rgba(230, 240, 250, 0.5));
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
`;

export const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${props => props.small ? '10px' : '40px'};
  color: var(--text-muted, #64748b);
  font-size: ${props => props.small ? '14px' : '18px'};
  text-align: center;

  &::before {
    content: '';
    display: inline-block;
    width: ${props => props.small ? '16px' : '24px'};
    height: ${props => props.small ? '16px' : '24px'};
    margin-right: 10px;
    border: 3px solid #e0e0e0;
    border-top-color: var(--primary-color, #1e3a8a);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const ErrorMessage = styled.div`
  padding: 20px;
  margin: 20px 0;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
  font-size: 16px;
  text-align: center;
`;

export const LocationTitle = styled.h1`
  font-size: 36px;
  color: #333366;
  margin: 0;
  margin-bottom: 10px;
  font-weight: 700;
  background: linear-gradient(135deg, #333366, #4a4a9e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  letter-spacing: -0.5px;
`;

export const UpdateInfo = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  font-style: italic;
  opacity: 0.8;
  display: flex;
  align-items: center;

  &::before {
    content: '🔄';
    margin-right: 8px;
    font-size: 14px;
  }
`;

export const ControlsContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 0;
  width: 100%;
`;

export const TabContainer = styled.div`
  display: flex;
  position: relative;
  width: auto;
  max-width: 220px;
  gap: 8px;
  align-items: flex-end; /* Align with the bottom of the location selector */
`;

export const Tab = styled.button`
  padding: 8px 12px;
  background: white;
  color: ${props => props.$active ? '#333366' : '#4a4a9e'};
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: ${props => props.$active ? 'bold' : '500'};
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
  margin: 0 3px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  height: 38px; /* Match the height of the location selector */
  line-height: 1; /* Adjust line height for better vertical centering */
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap; /* Prevent text from wrapping */

  &:hover {
    border-color: #aaa;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  }

  &:focus {
    outline: none;
    border-color: #333366;
    box-shadow: 0 0 0 3px rgba(51, 51, 102, 0.2);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  span {
    position: relative;
    z-index: 2;
    text-align: center;
    font-size: 16px;
    white-space: nowrap; /* Prevent text from wrapping */
  }
`;

export const TimeseriesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-auto-rows: 1fr; /* Make all rows the same height */
  gap: 1px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  width: 100%; /* Ensure grid takes full width */
  max-width: 100%; /* Prevent grid from exceeding container width */
  box-sizing: border-box; /* Include padding and border in the element's width */

  /* Ensure columns are evenly distributed */
  & > * {
    min-width: 0; /* Allow columns to shrink below their content size */
  }
`;

export const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eee;
  height: 100%; /* Ensure all columns have the same height */
  min-width: 0; /* Allow columns to shrink below their content size */

  .day-forecasts {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap; /* Keep all cards in a single row */
    width: 100%;
    flex: 1; /* Take up all available space */
    min-height: 180px; /* Minimum height to ensure consistency */
    justify-content: space-between; /* Distribute cards evenly */
  }

  &:last-child {
    border-right: none;
  }

  /* Add specific styling for 7-days tab columns */
  .weather-card {
    padding-left: 0;
    padding-right: 0;
    min-width: 0; /* Allow cards to shrink below their content size if needed */
    width: 100%; /* Ensure cards take full width of their container */
  }
`;

export const DayHeader = styled.div`
  background-color: #4a4a9e;
  color: white;
  padding: 10px 5px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 1px solid #3a3a8e;
  height: 40px; /* Fixed height for consistency */
  min-height: 40px; /* Ensure consistent height with or without date */
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  line-height: 1.2;
`;

export const HourCell = styled.div`
  padding: 10px;
  text-align: center;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
`;

export const WeatherCard = styled.div`
  padding: 12px 8px; /* Increased horizontal padding from 5px to 8px */
  background-color: white;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  min-height: 40px; /* Reduced minimum height */
  transition: background-color 0.2s ease;
  overflow: hidden; /* Hide overflow */
  height: 100%; /* Ensure full height */

  &:hover {
    background-color: #fafafa;
  }

  &.weather-card {
    /* This class will be applied when used in the TimeseriesDisplay */
    /* The width will be controlled by the parent component */
    width: auto;
    flex: 1;
    height: 100%; /* Ensure all cards have the same height */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center content vertically */
  }

  /* Default width for cards not in the TimeseriesDisplay */
  width: 25%;

  @media (max-width: 768px) {
    width: 50%;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

export const Temperature = styled.div`
  font-size: 16px;
  font-weight: bold;
  margin: 5px 0 2px 0;
  color: #e53935; /* Reddish color for current temperature */
`;

export const FeelsLike = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  display: none; /* Hide the feels like temperature */
`;

export const WeatherInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 5px;
`;

export const WeatherDetail = styled.div`
  font-size: 12px;
  margin: 3px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0 8px; /* Increased horizontal padding from 5px to 8px */
`;

export const SectionHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #0000cc;
  margin-top: 10px;
  margin-bottom: 5px;
  text-align: left;
  width: 100%;
  border-top: 1px dotted #ddd;
  padding-top: 5px;
  padding: 5px 0;
`;

export const WindInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2px;
  padding: 2px 0;
  width: 100%; /* Ensure it takes full width */

  svg {
    font-size: 24px;
    color: #0000cc;
    background-color: #e6e6ff;
    border-radius: 50%;
    padding: 2px;
  }

  span {
    margin-top: 0;
    font-size: 14px;
    color: #000099;
    font-weight: 500;
    white-space: nowrap; /* Prevent text from wrapping */
    overflow: visible; /* Allow text to overflow if needed */
  }
`;

export const WindDirectionSymbol = styled.span`
  font-size: 60px;
  font-weight: normal;
  font-family: 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  color: #000099;
  background-color: #e6e6ff;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  overflow: visible;
`;

export const RainChance = styled.div`
  color: #000099;
  font-weight: ${props => props.$chance > 50 ? 'bold' : 'normal'};
  margin-top: 8px;
  margin-bottom: 2px;
  text-align: center;
  font-size: 14px;
  /* Match the styling from the image */
  ${props => props.$chance >= 80 ? 'background-color: #e6e6ff;' : ''}
`;

export const RainfallAmount = styled.div`
  color: #000099;
  font-weight: ${props => props.$amount > 1.0 ? 'bold' : 'normal'};
  font-size: 14px;
  text-align: center;
  margin-bottom: 2px;
  padding: 2px 0;
  /* Match the styling from the image */
  ${props => props.$amount >= 1.0 ? 'background-color: #e6e6ff;' : ''}
`;

export const ExplanationLink = styled.a`
  display: block;
  text-align: right;
  color: #4a4a9e;
  text-decoration: none;
  margin: 10px 0;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

export const TimeDisplay = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #666;
  background-color: #f8fafd;
  padding: 3px 4px; /* Reduced horizontal padding from 6px to 4px */
  border-radius: 6px;
  margin-bottom: 5px;
  box-shadow: none;
  border: 1px solid rgba(74, 74, 158, 0.05);
  letter-spacing: 0px; /* Removed letter spacing */
  min-width: 24px;
  text-align: center;
  width: fit-content; /* Ensure it fits the content */
  display: inline-block; /* Changed from block to inline-block */

  &:hover {
    background-color: #f0f3f8;
    transition: all 0.2s ease;
  }
`;

export const ResponsiveContainer = styled.div`
  overflow-x: auto;
  width: 100%;
  display: flex; /* Use flexbox for better layout control */
  flex-direction: column;
  justify-content: stretch; /* Stretch children to fill the container */
  align-items: stretch; /* Stretch children vertically */
  padding-bottom: 16px; /* Add padding to ensure scrollbar doesn't overlap content */
  position: relative; /* For the scroll indicator */
  max-width: 100%; /* Ensure it doesn't exceed container width */

  /* Add custom scrollbar styling for better visibility */
  &::-webkit-scrollbar {
    height: 12px;
    background-color: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #4a4a9e;
    border-radius: 6px;
    border: 2px solid #f5f5f5;
  }

  &::-webkit-scrollbar-track {
    background-color: #f5f5f5;
    border-radius: 6px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  }

  /* Add a scroll indicator for better UX */
  &::after {
    content: '→ Scroll for more →';
    position: absolute;
    right: 20px;
    bottom: 20px;
    background-color: rgba(74, 74, 158, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0.8;
    pointer-events: none;
    animation: fadeInOut 2s infinite;
    display: none;
  }

  /* Show the scroll indicator when content is wider than container */
  &:has(> div > div[style*="min-width: 1200px"]) {
    &::after {
      display: block;
    }
  }

  @keyframes fadeInOut {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

export const ParameterRow = styled.div`
  display: flex;
  width: 100%;
  padding: 0;
  margin: 0 0 5px 0;
`;

export const ParameterLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #0000cc;
  padding: 5px 0;
  margin: 5px 0;
  text-align: center;
  width: 100%;
`;

export const ParameterHeader = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #0000cc;
  padding: 5px 10px;
  margin: 0;
  text-align: left;
  width: 100%;
  border-bottom: none;
  display: block;
  position: relative;
  z-index: 10;
  /* Match the exact styling from the image */
  border-left: 2px solid #0000cc;
  background-color: #f8f8ff;
`;

export const Divider = styled.div`
  border-top: 1px dotted #ddd;
  width: 80%;
  margin: 3px auto 3px auto;
  opacity: 0.6;
`;

export const SectionContainer = styled.div`
  margin-top: 20px;
  width: 100%;
  min-width: fit-content; /* Ensure it doesn't restrict the width of its children */
`;

export const ForecastRow = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: row;
`;
