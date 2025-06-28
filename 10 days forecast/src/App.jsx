import React from 'react'
import './App.css'
import WeatherForecast from './components/weather/WeatherForecast'
import { Routes, Route } from 'react-router-dom'
import WeatherSymbolsPage from './components/weather/WeatherSymbolsPage'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<WeatherForecast />} />
        <Route path="/symbols" element={<WeatherSymbolsPage />} />
      </Routes>
    </div>
  )
}

export default App
