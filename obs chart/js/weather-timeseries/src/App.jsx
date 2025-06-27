import React from 'react'
import './App.css'
import './styles/MobileWeatherStyles.css'
import WeatherForecast from './components/weather/WeatherForecast'

function App() {
  return (
    <div className="app-container">
      <WeatherForecast />
    </div>
  )
}

export default App
