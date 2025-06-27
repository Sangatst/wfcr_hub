// example configuration settings

var d = new Date()
var dd = new Date(Math.floor(d.getTime()/10800000)*10800000)
var now = dd.toISOString()


var mapconfigurations = {
  debug: true, // debug mode for development, messages are printed to console
  wmsserver: 'http://202.144.145.99:8080/wms', // http://data.fmi.fi/fmi-apikey/API-KEY/wms'
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Finnish Meteorological Institute',
  mapCenter: [90.439453,27.127591], // lat, lon
  bounds: { north: 28.33, east: 92.13, south: 26.7, west: 88.74 },
  // wms layers
  layers: {
    'meteor_edit': 'test_FMI:temperature.',   //use customer name and the layer or product
    'ECMWF wind direction': 'test:wind',
    'ECMWF Weather': 'test:weather', // fmi:gfs:sfc:temperature || fmi:ecmwf:rawtemperature
  },
  wmsOpacity: '0.8',
  wmsTileSize: 256,
  layerOptions: {
    attribution: 'Finnish Meteorological institute',
    opacity: '0.5',
    tileSize: 512
  },
  // https://github.com/socib/Leaflet.TimeDimension
  timeDimensionOptions: {
    zoom: 6,
    fullscreenControl: true,
    timeDimension: true,
    timeDimensionControl: true,
    scrollWheelZoom: false,
    autoPlay: false,
    speedSlider: false,
    timeZones: ['local'], // or ['utc']
    playerOptions: {
        buffer: 0,
        transitionTime: 1500, // 1000/1500 ~ 0.7 fps
        loop: true
    },
    timeInterval: now + "/PT72H",
    period: "PT3H",
  }
};