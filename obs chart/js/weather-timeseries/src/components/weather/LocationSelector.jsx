import React from 'react';
import styled from 'styled-components';

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  max-width: 300px;
`;

const SelectLabel = styled.label`
  font-size: 14px;
  margin-bottom: 5px;
  color: #333366;
  font-weight: 500;
`;

const VisuallyHidden = styled.span`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  white-space: nowrap;
`;

const StyledSelect = styled.select`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 16px;
  background-color: white;
  width: 100%;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333366' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #aaa;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  }

  &:focus {
    outline: none;
    border-color: #333366;
    box-shadow: 0 0 0 3px rgba(51, 51, 102, 0.2);
  }
`;

const RegionGroup = styled.optgroup`
  font-weight: 600;
  color: #333366;
  background-color: #f8fafc;
`;

const LocationSelector = ({
  locations,
  selectedLocation,
  onLocationChange,
}) => {
  // Using an explicit ID for accessibility
  const selectId = "location-select";
  const labelText = "Select Location";

  // Group locations by region
  const northernLocations = locations.filter(loc =>
    ['Gasa'].includes(loc)
  );

  const westernLocations = locations.filter(loc =>
    ['Thimphu', 'Paro', 'Haa', 'Punakha', 'Wangdue Phodrang'].includes(loc)
  );

  const southernLocations = locations.filter(loc =>
    ['Phuentsholing', 'Gelephu', 'Samdrup Jongkhar', 'Samtse', 'Sarpang', 'Dagana'].includes(loc)
  );

  const centralLocations = locations.filter(loc =>
    ['Trongsa', 'Bumthang', 'Zhemgang'].includes(loc)
  );

  const easternLocations = locations.filter(loc =>
    ['Mongar', 'Trashigang', 'Lhuentse', 'Trashiyangtse', 'Pemagatshel'].includes(loc)
  );

  return (
    <SelectContainer role="group" aria-labelledby="location-group-label">
      {/* Hidden label for the group */}
      <VisuallyHidden id="location-group-label">Location selection</VisuallyHidden>

      {/* Visible label explicitly associated with the select */}
      <SelectLabel htmlFor={selectId}>{labelText}</SelectLabel>

      <StyledSelect
        id={selectId}
        name="location"
        aria-labelledby="location-group-label" // Associate with the group label
        aria-label={labelText} // Redundant but helps with some screen readers
        title={labelText} // For tooltips
        value={selectedLocation}
        onChange={(e) => onLocationChange(e.target.value)}
      >
        {northernLocations.length > 0 && (
          <RegionGroup label="Northern Bhutan">
            {northernLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </RegionGroup>
        )}

        {westernLocations.length > 0 && (
          <RegionGroup label="Western Bhutan">
            {westernLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </RegionGroup>
        )}

        {southernLocations.length > 0 && (
          <RegionGroup label="Southern Bhutan">
            {southernLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </RegionGroup>
        )}

        {centralLocations.length > 0 && (
          <RegionGroup label="Central Bhutan">
            {centralLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </RegionGroup>
        )}

        {easternLocations.length > 0 && (
          <RegionGroup label="Eastern Bhutan">
            {easternLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </RegionGroup>
        )}
      </StyledSelect>
    </SelectContainer>
  );
};

export default LocationSelector;
