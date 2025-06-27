/**
 * Main Application Script for Temperature Observation Charts
 * This script initializes the application and handles user interactions
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize components
        const dataProcessor = new DataProcessor();
        const chartVisualizer = new ChartVisualizer('chart');
        const tminChartVisualizer = new TminChartVisualizerNew('tmin-chart');
        const tmeanChartVisualizer = new TmeanChartVisualizer('tmean-chart');

        // DOM elements
        const stationSelect = document.getElementById('station');
        const monthSelect = document.getElementById('month');
        const downloadStatsButton = document.getElementById('download-stats');
        const downloadCurrentButton = document.getElementById('download-current');
        const downloadChartButton = document.getElementById('download-chart');
        const downloadTminStatsButton = document.getElementById('download-tmin-stats');
        const downloadTminCurrentButton = document.getElementById('download-tmin-current');
        const downloadTminChartButton = document.getElementById('download-tmin-chart');
        const downloadTmeanStatsButton = document.getElementById('download-tmean-stats');
        const downloadTmeanCurrentButton = document.getElementById('download-tmean-current');
        const downloadTmeanChartButton = document.getElementById('download-tmean-chart');
        const loadingElement = document.getElementById('loading');
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        const dismissErrorButton = document.getElementById('dismiss-error');

        if (!stationSelect || !monthSelect || !downloadStatsButton || !downloadCurrentButton || !loadingElement) {
            console.error('Required DOM elements not found');
            showError('Required DOM elements not found. Please check the console for details.');
            return;
        }

        // Current selections
        let currentStation = '';
        let currentMonth = 'all';

        // Error handling function
        function showError(message) {
            if (errorContainer && errorMessage) {
                errorMessage.textContent = message;
                errorContainer.classList.add('show');
            } else {
                alert(message);
            }
        }

        // Initialize the application
        init();

        /**
         * Initialize the application
         */
        async function init() {
            try {
                // Show loading indicator
                loadingElement.classList.remove('hidden');

                // Fetch all data
                console.log('Fetching data from Google Apps Script...');
                const { stations, processedData } = await dataProcessor.fetchAllData();

                // Check if we got any stations
                if (!stations || stations.length === 0) {
                    throw new Error('No valid stations found. Some stations may be invalid or inaccessible.');
                }

                // Check if we got any data
                if (!processedData || Object.keys(processedData).length === 0) {
                    throw new Error('No data could be loaded for any station. Please check the Google Apps Script URLs and try again.');
                }

                // Log the number of stations with data
                console.log(`Found ${Object.keys(processedData).length} stations with data out of ${stations.length} total stations`);

                console.log(`Found ${stations.length} stations:`, stations);

                // Populate station selector
                populateStationSelector(stations);

                // Select first station by default
                if (stations.length > 0) {
                    currentStation = stations[0];
                    stationSelect.value = currentStation;

                    // Update chart with data for the selected station
                    updateChart(currentStation);
                }

                // Hide loading indicator
                loadingElement.classList.add('hidden');

                // Show success message
                console.log('Application initialized successfully');
            } catch (error) {
                console.error('Error initializing application:', error);

                // Hide loading indicator
                loadingElement.classList.add('hidden');

                // Show error message
                showError(`Error loading data: ${error.message}. Please reload the page and try again.`);
            }
        }

        /**
         * Populate station selector with available stations
         * @param {Array} stations - Array of station names
         */
        function populateStationSelector(stations) {
            // Clear existing options
            stationSelect.innerHTML = '';

            // Add options for each station
            stations.forEach(station => {
                const option = document.createElement('option');
                option.value = station;
                option.textContent = station;
                stationSelect.appendChild(option);
            });
        }

        /**
         * Update charts with data for the selected station
         * @param {string} station - The selected station
         */
        function updateChart(station) {
            try {
                if (!station || !dataProcessor.processedData) {
                    console.error('Invalid station or processed data not available');
                    return;
                }

                // Get data for the selected station
                const stationData = dataProcessor.processedData[station];
                if (!stationData) {
                    console.error(`No data available for station: ${station}`);
                    return;
                }

                // Update charts
                chartVisualizer.setMonth(currentMonth);
                tminChartVisualizer.setMonth(currentMonth);
                tmeanChartVisualizer.setMonth(currentMonth);

                chartVisualizer.updateChart(stationData);
                tminChartVisualizer.updateChart(stationData);
                tmeanChartVisualizer.updateChart(stationData);
            } catch (error) {
                console.error('Error updating charts:', error);
                showError(`Error updating charts: ${error.message}`);
            }
        }

        // Event listeners for station and month selectors
        stationSelect.addEventListener('change', () => {
            currentStation = stationSelect.value;
            updateChart(currentStation);
        });

        monthSelect.addEventListener('change', () => {
            currentMonth = monthSelect.value;
            updateChart(currentStation);
        });

        // Event listeners for download buttons
        downloadStatsButton.addEventListener('click', () => {
            chartVisualizer.downloadStats();
        });

        downloadCurrentButton.addEventListener('click', () => {
            chartVisualizer.downloadCurrentYear();
        });

        downloadChartButton.addEventListener('click', () => {
            chartVisualizer.downloadChart();
        });

        // Event listeners for Tmin download buttons
        downloadTminStatsButton.addEventListener('click', () => {
            tminChartVisualizer.downloadStats();
        });

        downloadTminCurrentButton.addEventListener('click', () => {
            tminChartVisualizer.downloadCurrentYear();
        });

        downloadTminChartButton.addEventListener('click', () => {
            tminChartVisualizer.downloadChart();
        });

        // Event listeners for Tmean download buttons
        downloadTmeanStatsButton.addEventListener('click', () => {
            tmeanChartVisualizer.downloadStats();
        });

        downloadTmeanCurrentButton.addEventListener('click', () => {
            tmeanChartVisualizer.downloadCurrentYear();
        });

        downloadTmeanChartButton.addEventListener('click', () => {
            tmeanChartVisualizer.downloadChart();
        });

        // Event listener for dismiss error button
        if (dismissErrorButton) {
            dismissErrorButton.addEventListener('click', () => {
                errorContainer.classList.remove('show');
            });
        }
    } catch (error) {
        console.error('Fatal error in application initialization:', error);

        // Try to show error in the UI if possible
        try {
            const errorContainer = document.getElementById('error-container');
            const errorMessage = document.getElementById('error-message');

            if (errorContainer && errorMessage) {
                errorMessage.textContent = `Fatal error: ${error.message}. Please check the console for details.`;
                errorContainer.classList.add('show');
            } else {
                alert('An error occurred while initializing the application. Please check the console for details.');
            }
        } catch (uiError) {
            // If even showing the error fails, fall back to alert
            alert(`Fatal error: ${error.message}. Please check the console for details.`);
        }
    }
});
