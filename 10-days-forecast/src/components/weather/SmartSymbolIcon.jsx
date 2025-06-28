import React, { useState } from 'react';
import styled from 'styled-components';

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
`;

/**
 * Component to display weather icons based on smartsymbol numbers from the API
 * Uses the day/night folders in the smartsymbol directory
 */
const SmartSymbolIcon = ({ symbolNumber, size = 40 }) => {
  const [imageError, setImageError] = useState(false);

  // Default cloudy icon as fallback
  const renderDefaultIcon = () => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#A9A9A9" />
      <text x="12" y="16" fontSize="8" textAnchor="middle" fill="white">{symbolNumber || '?'}</text>
    </svg>
  );

  // If no symbol number provided or image failed to load, render default icon
  if (!symbolNumber || imageError) {
    return <IconContainer size={size}>{renderDefaultIcon()}</IconContainer>;
  }

  // Determine if it's a day or night icon based on the symbol number
  // Night icons are 100+ in the API
  const isNightIcon = Number(symbolNumber) >= 100;
  const folder = isNightIcon ? 'night' : 'day';

  // Construct the path to the SVG file
  const iconPath = `/smartsymbol/${folder}/${symbolNumber}.svg`;

  return (
    <IconContainer size={size}>
      <img
        src={iconPath}
        width={size}
        height={size}
        alt={`Weather symbol ${symbolNumber}`}
        style={{ pointerEvents: 'none' }}
        onError={() => {
          console.error(`Failed to load SVG for symbol ${symbolNumber}`);
          setImageError(true);
        }}
      />
    </IconContainer>
  );
};

export default SmartSymbolIcon;
