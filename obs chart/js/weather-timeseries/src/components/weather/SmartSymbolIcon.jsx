import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
`;

// Default icon with symbol number
const DefaultIcon = ({ size, symbolNumber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#A9A9A9" />
    <text x="12" y="16" fontSize="8" textAnchor="middle" fill="white">{symbolNumber || '?'}</text>
  </svg>
);

// Cache to track which icons have already failed to load
const failedIcons = {};

/**
 * Component to display weather icons based on smartsymbol numbers from the API
 * Uses the SVG files from the smartsymbol folder
 */
const SmartSymbolIcon = ({ symbolNumber, size = 40 }) => {
  const [useDefault, setUseDefault] = useState(false);

  useEffect(() => {
    // Reset state when symbolNumber changes
    setUseDefault(false);

    // Check if this icon has already failed to load
    if (!symbolNumber) return;

    const isNightIcon = Number(symbolNumber) >= 100;
    const folder = isNightIcon ? 'night' : 'day';
    const cacheKey = `${folder}_${symbolNumber}`;

    if (failedIcons[cacheKey]) {
      setUseDefault(true);
    }
  }, [symbolNumber]);

  if (!symbolNumber || useDefault) {
    return (
      <IconContainer $size={size}>
        <DefaultIcon size={size} symbolNumber={symbolNumber} />
      </IconContainer>
    );
  }

  // Determine if it's a day or night icon based on the symbol number
  // Night icons are 100+ in the API
  const isNightIcon = Number(symbolNumber) >= 100;
  const folder = isNightIcon ? 'night' : 'day';

  // Construct the path to the SVG file
  const iconPath = `/smartsymbol/${folder}/${symbolNumber}.svg`;
  const cacheKey = `${folder}_${symbolNumber}`;

  return (
    <IconContainer $size={size}>
      <object
        type="image/svg+xml"
        data={iconPath}
        width={size}
        height={size}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
        onError={() => {
          // Mark this icon as failed in the cache
          failedIcons[cacheKey] = true;
          setUseDefault(true);
        }}
      >
        <DefaultIcon size={size} symbolNumber={symbolNumber} />
      </object>
    </IconContainer>
  );
};

export default SmartSymbolIcon;
