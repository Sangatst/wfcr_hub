import React, { useState, useEffect } from 'react';
import TimeseriesDisplay from './TimeseriesDisplay';
import LocationSelector from './LocationSelector';
import { fetchWeatherData, getLocationCoordinates } from '../../services/weatherApi';
import {
  Container,
  Header,
  LocationTitle,
  UpdateInfo,
  TabContainer,
  Tab,
  LoadingIndicator,
  ErrorMessage,
  ControlsContainer
} from '../../styles/WeatherStyles';

const WeatherForecast = ({
  initialWeatherData = null,
  availableLocations = [
    // Northern Bhutan
    'Gasa',
    // Western Bhutan
    'Thimphu', 'Paro', 'Haa', 'Punakha', 'Wangdue Phodrang',
    // Southern Bhutan
    'Phuentsholing', 'Gelephu', 'Samdrup Jongkhar', 'Samtse', 'Sarpang', 'Dagana',
    // Central Bhutan
    'Trongsa', 'Bumthang', 'Zhemgang',
    // Eastern Bhutan
    'Mongar', 'Trashigang', 'Lhuentse', 'Trashiyangtse', 'Pemagatshel'
  ]
}) => {
  const [weatherData, setWeatherData] = useState(initialWeatherData);
  const [selectedLocation, setSelectedLocation] = useState(initialWeatherData?.location || 'Thimphu');
  const [activeTab, setActiveTab] = useState('3-days');
  const [loading, setLoading] = useState(!initialWeatherData);
  const [error, setError] = useState(null);

  const tabs = [
    { id: '3-days', label: '3 days' },
    { id: '7-days', label: '7 days' },
  ];

  const getDaysToShow = () => {
    switch (activeTab) {
      case '7-days':
        return 7;
      case '3-days':
      default:
        return 4; // Show 4 days for the 3-days tab (today + 3 more days)
    }
  };

  // Fetch weather data when location changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get coordinates for the selected location
        const coordinates = getLocationCoordinates(selectedLocation);

        // Fetch weather data from API
        const data = await fetchWeatherData({
          location: selectedLocation,
          ...coordinates,
          days: 11 // Fetch 11 days to have enough data for both tabs (4 + 7)
        });

        setWeatherData(data);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLocation]);

  // Handle location change
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  if (loading && !weatherData) {
    return (
      <Container>
        <LoadingIndicator $small={false}>Loading weather data...</LoadingIndicator>
      </Container>
    );
  }

  if (error && !weatherData) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <LocationTitle>{selectedLocation}</LocationTitle>
        {weatherData && (
          <UpdateInfo>Weather forecast updated {weatherData.updatedAt}</UpdateInfo>
        )}
      </Header>

      <ControlsContainer>
        <LocationSelector
          locations={availableLocations}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
        />

        <TabContainer>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
            </Tab>
          ))}
        </TabContainer>
      </ControlsContainer>

      {loading && weatherData && (
        <LoadingIndicator $small>Updating weather data...</LoadingIndicator>
      )}

      {weatherData && (
        <TimeseriesDisplay
          forecast={weatherData.forecast}
          days={getDaysToShow()}
          activeTab={activeTab}
        />
      )}
    </Container>
  );
};

export default WeatherForecast;
