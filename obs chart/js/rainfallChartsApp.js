/**
 * Rainfall Charts Application
 * This script handles the rainfall charts visualization and user interactions
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize components
        const dataProcessor = new DataProcessor();
        const rainfallLineChart = new RainfallLineChart('rainfall-line-chart');
        const rainfallBarChart = new RainfallBarChart('rainfall-bar-chart');
        const rainfallBoxplotChart = new RainfallBoxplotChart('rainfall-boxplot-chart');
        const rainfallMap = new RainfallMap('rainfall-map');

        // Get DOM elements
        const stationSelect = document.getElementById('station');
        const monthSelect = document.getElementById('month');
        const loadingContainer = document.getElementById('loading');
        const loadingMessage = document.getElementById('loading-message');
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        const dismissErrorButton = document.getElementById('dismiss-error');

        // Download buttons for line chart
        const downloadLineStatsButton = document.getElementById('download-rainfall-line-stats');
        const downloadLineCurrentButton = document.getElementById('download-rainfall-line-current');
        const downloadLineChartButton = document.getElementById('download-rainfall-line-chart');

        // Download buttons for bar chart
        const downloadBarStatsButton = document.getElementById('download-rainfall-bar-stats');
        const downloadBarCurrentButton = document.getElementById('download-rainfall-bar-current');
        const downloadBarChartButton = document.getElementById('download-rainfall-bar-chart');

        // Download buttons for boxplot chart
        const downloadBoxplotStatsButton = document.getElementById('download-rainfall-boxplot-stats');
        const downloadBoxplotCurrentButton = document.getElementById('download-rainfall-boxplot-current');
        const downloadBoxplotChartButton = document.getElementById('download-rainfall-boxplot-chart');

        // Current selections
        let currentStation = '';
        let currentMonth = 'all';
        let stationsData = {};

        // Show loading indicator
        function showLoading(message) {
            if (loadingMessage) {
                loadingMessage.textContent = message || 'Loading data...';
            }
            if (loadingContainer) {
                loadingContainer.style.display = 'flex';
            }
        }

        // Hide loading indicator
        function hideLoading() {
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
        }

        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorContainer.classList.add('show');
        }

        // Initialize the application
        async function init() {
            try {
                showLoading('Initializing application...');

                // Set up error dismissal
                dismissErrorButton.addEventListener('click', () => {
                    errorContainer.classList.remove('show');
                });

                // Fetch all data
                await fetchData();

                // Set up event listeners
                setupEventListeners();

                hideLoading();
            } catch (error) {
                console.error('Initialization error:', error);
                hideLoading();
                showError(`Failed to initialize application: ${error.message}`);
            }
        }

        // Fetch data from the server
        async function fetchData() {
            try {
                showLoading('Fetching data from server...');

                // Fetch all data using the data processor
                const data = await dataProcessor.fetchAllData();

                // Update station select options
                populateStationSelect(data.stations);

                // Store the data
                stationsData = data.processedData;

                // Check if we have rainfall data
                let hasRainfallData = false;
                let hasCurrentYearRainfallData = false;

                for (const station in stationsData) {
                    // Check for rainfall data in daily stats (historical data)
                    if (stationsData[station].dailyStats) {
                        const rainfallStats = stationsData[station].dailyStats.filter(day =>
                            day.rainfallValues || day.rainfallMean !== undefined ||
                            day.rainfallMax !== undefined || day.rainfallMin !== undefined);

                        if (rainfallStats.length > 0) {
                            hasRainfallData = true;
                        }
                    }

                    // Check for rainfall data in current year data
                    if (stationsData[station].currentYearData) {
                        const currentYearRainfallData = stationsData[station].currentYearData.filter(record =>
                            record.Rainfall !== undefined && record.Rainfall !== null && !isNaN(record.Rainfall));

                        if (currentYearRainfallData.length > 0) {
                            hasCurrentYearRainfallData = true;
                        }
                    }
                }

                if (!hasRainfallData) {
                    console.warn('No historical rainfall data found in any station');
                }

                if (!hasCurrentYearRainfallData) {
                    console.warn('No current year rainfall data found in any station');
                }

                // If we have current year data but no historical data, we need to calculate daily stats
                if (!hasRainfallData && hasCurrentYearRainfallData) {
                    console.log('Calculating daily statistics from current year data...');

                    // For each station with current year data
                    for (const station in stationsData) {
                        if (stationsData[station].currentYearData && stationsData[station].currentYearData.length > 0) {
                            const currentYearData = stationsData[station].currentYearData;

                            // Group by month and day
                            const groupedByMonthDay = {};

                            currentYearData.forEach(record => {
                                if (record.Month && record.Day && record.Rainfall !== undefined && record.Rainfall !== null) {
                                    const key = `${record.Month}-${record.Day}`;

                                    // Calculate day of year
                                    let dayOfYear = null;
                                    if (record.Month && record.Day) {
                                        // Use a leap year (2020) for consistent day of year calculations
                                        const date = new Date(2020, record.Month - 1, record.Day);
                                        const startOfYear = new Date(2020, 0, 1);
                                        dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

                                        // Add dayOfYear to the record
                                        record.dayOfYear = dayOfYear;
                                    }

                                    if (!groupedByMonthDay[key]) {
                                        groupedByMonthDay[key] = {
                                            month: record.Month,
                                            day: record.Day,
                                            dayOfYear: dayOfYear,
                                            rainfallValues: []
                                        };
                                    }

                                    groupedByMonthDay[key].rainfallValues.push({
                                        year: record.Year,
                                        value: Number(record.Rainfall)
                                    });
                                }
                            });

                            // Calculate statistics for each day
                            const dailyStats = Object.values(groupedByMonthDay).map(dayData => {
                                const stats = {
                                    month: dayData.month,
                                    day: dayData.day,
                                    rainfallValues: dayData.rainfallValues
                                };

                                if (dayData.rainfallValues.length > 0) {
                                    const values = dayData.rainfallValues.map(v => v.value);

                                    // Calculate mean
                                    stats.rainfallMean = values.reduce((sum, val) => sum + val, 0) / values.length;

                                    // Find max and min
                                    let maxValue = -Infinity;
                                    let maxYear = null;
                                    let minValue = Infinity;
                                    let minYear = null;

                                    dayData.rainfallValues.forEach(item => {
                                        if (item.value > maxValue) {
                                            maxValue = item.value;
                                            maxYear = item.year;
                                        }
                                        if (item.value < minValue) {
                                            minValue = item.value;
                                            minYear = item.year;
                                        }
                                    });

                                    stats.rainfallMax = maxValue;
                                    stats.rainfallMaxYear = maxYear;
                                    stats.rainfallMin = minValue;
                                    stats.rainfallMinYear = minYear;
                                }

                                return stats;
                            });



                            // Add the daily stats to the station data
                            stationsData[station].dailyStats = dailyStats;

                            // Now we have historical data
                            hasRainfallData = true;
                        }
                    }
                }

                // Set initial station
                if (data.stations.length > 0) {
                    currentStation = data.stations[0];
                    stationSelect.value = currentStation;

                    // Update charts with initial data
                    updateCharts(currentStation);
                }

                hideLoading();
            } catch (error) {
                console.error('Error fetching data:', error);
                hideLoading();
                showError(`Failed to fetch data: ${error.message}`);
            }
        }

        // Populate station select dropdown
        function populateStationSelect(stations) {
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

        // Set up event listeners
        function setupEventListeners() {
            // Station select change
            stationSelect.addEventListener('change', () => {
                currentStation = stationSelect.value;
                updateCharts(currentStation);
            });

            // Month select change
            monthSelect.addEventListener('change', () => {
                currentMonth = monthSelect.value;
                updateCharts(currentStation);
            });

            // Line chart download buttons
            downloadLineStatsButton.addEventListener('click', () => {
                rainfallLineChart.downloadStats();
            });

            downloadLineCurrentButton.addEventListener('click', () => {
                rainfallLineChart.downloadCurrentYear();
            });

            downloadLineChartButton.addEventListener('click', () => {
                rainfallLineChart.downloadChart();
            });

            // Bar chart download buttons
            downloadBarStatsButton.addEventListener('click', () => {
                rainfallBarChart.downloadStats();
            });

            downloadBarCurrentButton.addEventListener('click', () => {
                rainfallBarChart.downloadCurrentYear();
            });

            downloadBarChartButton.addEventListener('click', () => {
                rainfallBarChart.downloadChart();
            });

            // Boxplot chart download buttons
            downloadBoxplotStatsButton.addEventListener('click', () => {
                rainfallBoxplotChart.downloadStats();
            });

            downloadBoxplotCurrentButton.addEventListener('click', () => {
                rainfallBoxplotChart.downloadCurrentYear();
            });

            downloadBoxplotChartButton.addEventListener('click', () => {
                rainfallBoxplotChart.downloadChart();
            });

            // Handle window resize
            window.addEventListener('resize', () => {
                rainfallLineChart.resize();
                rainfallBarChart.resize();
                rainfallBoxplotChart.resize();
                // Note: The rainfall map handles its own resizing internally
            });
        }

        // Update all charts with new data
        function updateCharts(station) {
            try {
                if (!station || !stationsData[station]) {
                    console.error(`No data available for station: ${station}`);
                    return;
                }

                const stationData = stationsData[station];

                // Add station name to the data
                stationData.stationName = station;

                // Update month filter for all charts
                rainfallLineChart.setMonth(currentMonth);
                rainfallBarChart.setMonth(currentMonth);
                rainfallBoxplotChart.setMonth(currentMonth);

                // Update charts with the data
                rainfallLineChart.updateChart(stationData);
                rainfallBarChart.updateChart(stationData);
                rainfallBoxplotChart.updateChart(stationData);

                // Update the rainfall map with all stations data
                // The map needs data for all stations to show rainfall accumulation across Bhutan
                console.log('Updating rainfall map with real data from Google AppScript API');

                // Get the selected period from the dropdown
                const selectedPeriod = document.getElementById('rainfall-period-select').value;
                rainfallMap.selectedPeriod = selectedPeriod;
                rainfallMap.updateMapTitle();

                // Update the map with the real data
                rainfallMap.updateMap(stationsData);

            } catch (error) {
                console.error('Error updating charts:', error);
                showError(`Failed to update charts: ${error.message}`);
            }
        }

        // Initialize the application
        init();

    } catch (error) {
        console.error('Fatal error in application:', error);
        alert(`A fatal error occurred: ${error.message}`);
    }
});

/**
 * Base class for Rainfall Charts
 */
class RainfallChartBase {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = d3.select(`#${containerId}`);
        this.margin = { top: 40, right: 80, bottom: 60, left: 60 };
        this.width = 1000 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.currentMonth = 'all';
        this.tooltip = null;
        this.currentData = null;
        this.svg = null;
        this.chart = null;
        this.xScale = null;
        this.yScale = null;
        this.xAxis = null;
        this.yAxis = null;
        this.chartTitle = null;
    }

    /**
     * Initialize the chart
     */
    initializeChart() {
        // Clear any existing SVG
        this.container.select('svg').remove();

        // Create SVG element
        this.svg = this.container
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);

        // Create chart group
        this.chart = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Create scales
        this.xScale = d3.scaleLinear()
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        // Create axes
        this.xAxis = this.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`);

        this.yAxis = this.chart.append('g')
            .attr('class', 'y-axis');

        // Add axis labels
        this.svg.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', this.height + this.margin.top + 50)
            .attr('text-anchor', 'middle')
            .text('Day of Year');

        this.svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(this.margin.top + this.height / 2))
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text('Rainfall (mm)');

        // Add chart title
        this.chartTitle = this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text('Daily Rainfall Observation');
    }

    /**
     * Create tooltip
     */
    createTooltip() {
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'rainfall-tooltip')
            .style('opacity', 0);
    }

    /**
     * Set current month filter
     * @param {string} month - The month to filter by
     */
    setMonth(month) {
        this.currentMonth = month;
    }

    /**
     * Filter data by selected month
     * @param {Array} data - The data to filter
     * @returns {Array} - Filtered data
     */
    filterDataByMonth(data) {
        if (!data || !Array.isArray(data)) return [];

        if (this.currentMonth === 'all') {
            // For "All Months" view, still return all months but don't filter by date here
            // Date filtering will be done in updateChart
            return data;
        }

        const month = parseInt(this.currentMonth);
        return data.filter(d => d.Month === month || d.month === month);
    }

    /**
     * Resize the chart when window size changes
     */
    resize() {
        try {
            // Get container dimensions
            const containerNode = this.container.node();
            if (!containerNode) {
                console.error(`Container with ID "${this.containerId}" not found in the DOM`);
                return;
            }

            const containerRect = containerNode.getBoundingClientRect();
            this.width = Math.max(containerRect.width - this.margin.left - this.margin.right, 300);

            // Adjust height for mobile devices
            const isMobile = window.innerWidth <= 768;
            this.height = (isMobile ? 350 : 500) - this.margin.top - this.margin.bottom;

            // Update SVG dimensions
            if (this.svg) {
                this.svg
                    .attr('width', this.width + this.margin.left + this.margin.right)
                    .attr('height', this.height + this.margin.top + this.margin.bottom);
            }

            // Update scales
            if (this.xScale && this.yScale) {
                this.xScale.range([0, this.width]);
                this.yScale.range([this.height, 0]);
            }

            // Update axis labels
            if (this.svg) {
                this.svg.select('.x-axis-label')
                    .attr('x', this.margin.left + this.width / 2)
                    .attr('y', this.height + this.margin.top + 50);

                this.svg.select('.chart-title')
                    .attr('x', this.margin.left + this.width / 2);
            }

            // Redraw chart if data exists
            if (this.currentData) {
                this.updateChart(this.currentData);
            }
        } catch (error) {
            console.error(`Error resizing ${this.containerId} chart:`, error);
        }
    }
}

/**
 * Rainfall Line Chart with Shaded Range
 */
class RainfallLineChart extends RainfallChartBase {
    constructor(containerId) {
        super(containerId);
        this.initializeChart();
        this.createTooltip();
    }

    /**
     * Update chart with new data
     * @param {Object} data - The data to visualize
     */
    updateChart(data) {
        if (!data || !data.dailyStats || !data.currentYearData) {
            console.error('Invalid data for Rainfall Line chart');
            return;
        }

        // Store the data for later use
        this.currentData = data;

        // Filter data by month if needed
        const filteredDailyStats = this.filterDataByMonth(data.dailyStats);
        const filteredCurrentYearData = this.filterDataByMonth(data.currentYearData);

        // Get the current date to filter out future dates
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
        const currentDay = currentDate.getDate();
        const currentDayOfYear = Math.floor((currentDate - new Date(currentYear, 0, 1)) / (24 * 60 * 60 * 1000)) + 1;

        console.log(`Current date: ${currentDay}/${currentMonth}/${currentYear}, day of year: ${currentDayOfYear}`);

        // Filter current year data to only include records with rainfall data and not in the future
        const currentYearRainfallData = filteredCurrentYearData
            .filter(d => {
                // Only include points with valid rainfall data
                if (d.Rainfall === undefined || d.Rainfall === null || isNaN(d.Rainfall)) {
                    return false;
                }

                // Only include points up to the current date (not in the future)
                if (d.Year < currentYear) {
                    return true; // Previous years are always included
                }

                if (d.Year > currentYear) {
                    return false; // Future years are always excluded
                }

                // For current year, check month and day
                if (d.Month < currentMonth) {
                    return true; // Previous months in current year are included
                }

                if (d.Month > currentMonth) {
                    return false; // Future months in current year are excluded
                }

                // For current month, check day - exclude current day as there's no data for today
                return d.Day < currentDay; // Only include days before today
            })
            .map(d => {
                // Calculate day of year if it doesn't exist
                let dayOfYear = d.dayOfYear;
                if (!dayOfYear && d.Month && d.Day) {
                    // Use a leap year (2020) for consistent day of year calculations
                    const date = new Date(2020, d.Month - 1, d.Day);
                    const startOfYear = new Date(2020, 0, 1);
                    dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
                    console.log(`Calculated dayOfYear ${dayOfYear} for month ${d.Month}, day ${d.Day}`);
                }

                // Preserve rainfall value as is (including zeros)
                // Only convert undefined/null to null
                const rainfall = d.Rainfall === undefined || d.Rainfall === null ? null : d.Rainfall;

                return {
                    ...d,
                    rainfall: rainfall,
                    dayOfYear: dayOfYear || null // Use null if dayOfYear is not defined
                };
            });

        // Process daily stats to extract rainfall data
        const processedDailyStats = filteredDailyStats.map(day => {
            // Preserve rainfall data as is, only convert undefined/null to null
            // This ensures that zero values remain as zeros
            const rainfallMean = day.rainfallMean === undefined || day.rainfallMean === null ? null : day.rainfallMean;
            const rainfallMax = day.rainfallMax === undefined || day.rainfallMax === null ? null : day.rainfallMax;
            const rainfallMin = day.rainfallMin === undefined || day.rainfallMin === null ? null : day.rainfallMin;

            // Calculate day of year if it doesn't exist
            let dayOfYear = day.dayOfYear;
            if (!dayOfYear && day.month && day.day) {
                // Use a leap year (2020) for consistent day of year calculations
                const date = new Date(2020, day.month - 1, day.day);
                const startOfYear = new Date(2020, 0, 1);
                dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
                console.log(`Calculated dayOfYear ${dayOfYear} for month ${day.month}, day ${day.day}`);
            }

            return {
                ...day,
                rainfallMean,
                rainfallMax,
                rainfallMin,
                dayOfYear: dayOfYear || null // Use null if dayOfYear is not defined
            };
        });

        // Set domain for scales
        let yMax = 50; // Default value if no data

        // Find the maximum rainfall value across all datasets
        if (processedDailyStats.length > 0 || currentYearRainfallData.length > 0) {
            const maxValues = [];

            // Add max values from daily stats
            if (processedDailyStats.length > 0) {
                maxValues.push(d3.max(processedDailyStats, d => d.rainfallMax || 0));
            }

            // Add max values from current year data
            if (currentYearRainfallData.length > 0) {
                maxValues.push(d3.max(currentYearRainfallData, d => d.rainfall || 0));
            }

            const maxRainfall = Math.max(...maxValues, 0);

            // Add padding (20% of the max)
            const paddedMaxRainfall = Math.ceil(maxRainfall * 1.2);

            // Ensure we have reasonable defaults if data is missing
            yMax = isFinite(paddedMaxRainfall) && paddedMaxRainfall > 0 ? paddedMaxRainfall : 50;
        }

        // Set x-axis domain based on the selected month
        if (this.currentMonth === 'all') {
            this.xScale.domain([0, 366]); // Full year
        } else {
            // Find the day range for the selected month
            const monthNum = parseInt(this.currentMonth);
            const year = 2020; // Leap year for proper day calculations
            const firstDay = new Date(year, monthNum - 1, 1);
            const lastDay = new Date(year, monthNum, 0);

            const startOfYear = new Date(year, 0, 1);
            const firstDayOfYear = Math.floor((firstDay - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
            const lastDayOfYear = Math.floor((lastDay - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

            this.xScale.domain([firstDayOfYear, lastDayOfYear]);
        }

        this.yScale.domain([0, yMax]);

        // Update axes
        if (this.currentMonth === 'all') {
            // For yearly view, show month names
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthDays = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]; // Approximate day of year for start of each month

            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickValues(monthDays)
                .tickFormat((d, i) => monthNames[i])
                .tickSize(10)
            );
        } else {
            // For monthly view, show day numbers
            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickFormat(d => {
                    const date = new Date(2020, 0, d); // Using leap year 2020
                    return date.getDate();
                })
                .ticks(15) // Adjust number of ticks for better readability
            );
        }

        this.yAxis.call(d3.axisLeft(this.yScale)
            .tickFormat(d => d) // Remove units from tick labels
            .ticks(window.innerWidth <= 768 ? 5 : 10)
        );

        // Add grid lines
        this.chart.selectAll('.grid-line').remove();

        this.chart.selectAll('.grid-line-y')
            .data(this.yScale.ticks())
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0)
            .attr('x2', this.width)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d))
            .style('stroke', '#eee')
            .style('stroke-width', 1);

        // Update chart title
        const stationName = data.stationName || document.getElementById('station')?.value || 'Station';

        // Add month to title if filtered
        let titleText = `Daily Rainfall Observation - ${stationName}`;
        if (this.currentMonth !== 'all') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            titleText += ` (${monthNames[parseInt(this.currentMonth) - 1]})`;
        }

        this.chartTitle.text(titleText);

        // Clear previous elements
        this.chart.selectAll('.rainfall-line, .rainfall-historical-mean-line, .rainfall-range-area, .rainfall-point, .max-label, .rainfall-max-point').remove();

        // Draw the shaded range area
        this.drawRainfallRange(processedDailyStats);

        // Draw the historical mean line
        this.drawHistoricalMeanLine(processedDailyStats);

        // Draw the current year line
        this.drawCurrentYearLine(currentYearRainfallData);

        // Update chart interpretation
        this.updateChartInterpretation(data.stationName, filteredDailyStats, currentYearRainfallData);
    }

    /**
     * Draw the shaded range area between min and max rainfall
     * @param {Array} dailyStats - The daily statistics data
     */
    drawRainfallRange(dailyStats) {
        if (!dailyStats || dailyStats.length === 0) return;

        // Filter out days without rainfall data
        // Keep zero values, only filter out undefined/null values
        const validData = dailyStats.filter(d =>
            d.rainfallMax !== undefined && d.rainfallMin !== undefined &&
            d.rainfallMax !== null && d.rainfallMin !== null &&
            !isNaN(d.rainfallMax) && !isNaN(d.rainfallMin) &&
            d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear)
        );

        if (validData.length === 0) return;

        // Create area generator
        const area = d3.area()
            .x(d => this.xScale(d.dayOfYear))
            .y0(d => this.yScale(d.rainfallMin))
            .y1(d => this.yScale(d.rainfallMax))
            .defined(d =>
                d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.rainfallMin !== null && !isNaN(d.rainfallMin) &&
                d.rainfallMax !== null && !isNaN(d.rainfallMax)
            )
            .curve(d3.curveMonotoneX);

        // Log the data being passed to the area generator
        console.log('Data for rainfall range area:', validData.map(d => ({
            dayOfYear: d.dayOfYear,
            rainfallMin: d.rainfallMin,
            rainfallMax: d.rainfallMax
        })));

        try {
            // Draw area with explicit fill color to ensure consistency in downloaded chart
            this.chart.append('path')
                .datum(validData)
                .attr('class', 'rainfall-range-area')
                .attr('fill', 'rgba(0, 102, 204, 0.2)') // Explicitly set fill color to light blue
                .attr('stroke', 'none')
                .attr('d', area);
        } catch (error) {
            console.error('Error drawing rainfall range area:', error);
        }
    }

    /**
     * Draw the historical mean line
     * @param {Array} dailyStats - The daily statistics data
     */
    drawHistoricalMeanLine(dailyStats) {
        if (!dailyStats || dailyStats.length === 0) return;

        // Filter out days without rainfall mean data
        // Keep zero values, only filter out undefined/null values
        const validData = dailyStats.filter(d =>
            d.rainfallMean !== undefined && d.rainfallMean !== null && !isNaN(d.rainfallMean) &&
            d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear)
        );

        if (validData.length === 0) return;

        // Create line generator
        const line = d3.line()
            .x(d => this.xScale(d.dayOfYear))
            .y(d => this.yScale(d.rainfallMean))
            .defined(d =>
                d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.rainfallMean !== null && !isNaN(d.rainfallMean)
            )
            .curve(d3.curveMonotoneX);

        // Log the data being passed to the line generator
        console.log('Data for historical mean line:', validData.map(d => ({
            dayOfYear: d.dayOfYear,
            rainfallMean: d.rainfallMean
        })));

        try {
            // Draw line
            this.chart.append('path')
                .datum(validData)
                .attr('class', 'rainfall-historical-mean-line')
                .attr('fill', 'none')
                .attr('stroke', '#666666')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5')
                .attr('d', line);
        } catch (error) {
            console.error('Error drawing historical mean line:', error);
        }
    }

    /**
     * Draw the current year line and points
     * @param {Array} currentYearData - The current year data
     */
    drawCurrentYearLine(currentYearData) {
        if (!currentYearData || currentYearData.length === 0) {
            // Add a "No Data" message to the chart
            this.chart.append('text')
                .attr('class', 'no-data-message')
                .attr('x', this.width / 2)
                .attr('y', this.height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '16px')
                .attr('fill', '#999')
                .text('No data available for the selected period');

            return;
        }

        // Get the current date to filter out future dates
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
        const currentDay = currentDate.getDate();

        console.log(`Current date in drawCurrentYearLine: ${currentDay}/${currentMonth}/${currentYear}`);

        // Filter out data points that are not from the current year or do not have valid rainfall data
        const validLineData = currentYearData
            .filter(d => {
                // Check if the data point is for the current year
                const isCurrentYear = (d.Year === currentYear || (d.Year === undefined && new Date().getFullYear() === currentYear));

                // Check if the data point has valid rainfall data
                const hasValidRainfall = (d.rainfall !== undefined && d.rainfall !== null && !isNaN(d.rainfall));

                // Exclude future dates for the current year
                if (isCurrentYear) {
                    const dataDate = new Date(currentYear, d.Month - 1, d.Day);
                    if (dataDate > currentDate) {
                        return false;
                    }
                }

                // Include the data point only if it's from the current year, has valid rainfall,
                // and is not in the future (for current year data)
                return isCurrentYear && hasValidRainfall;
            })
            .sort((a, b) => a.dayOfYear - b.dayOfYear);

        // Log the data being passed to the line generator
        console.log(`Data for current year line (filtered and sorted):`, validLineData.map(d => ({
            dayOfYear: d.dayOfYear,
            rainfall: d.rainfall,
            date: `${d.Day}/${d.Month}/${d.Year}`
        })));

        if (validLineData.length === 0) {
            console.warn('No valid current year data points after filtering.');
            // Optionally add a message to the chart if no data
            this.chart.append('text')
                 .attr('class', 'no-data-message')
                 .attr('x', this.width / 2)
                 .attr('y', this.height / 2)
                 .attr('text-anchor', 'middle')
                 .attr('font-size', '16px')
                 .attr('fill', '#999')
                 .text('No current year data available for this period.');
            return; // Exit if no valid data to draw
        }

        // Create line generator that properly handles null/undefined values
        const line = d3.line()
            .x(d => this.xScale(d.dayOfYear))
            .y(d => this.yScale(d.rainfall))
            .defined(d => d.rainfall !== undefined && d.rainfall !== null && !isNaN(d.rainfall))
            .curve(d3.curveMonotoneX);

        try {
            // Draw the line
            this.chart.append('path')
                .datum(validLineData)
                .attr('class', 'rainfall-line')
                .attr('fill', 'none')
                .attr('stroke', '#0066cc')
                .attr('stroke-width', 2)
                .attr('d', line);
        } catch (error) {
            console.error('Error drawing current year line:', error);
        }

        // Draw points - only for data points with valid rainfall values
        this.chart.selectAll('.rainfall-point')
            .data(validLineData)
            .enter()
            .append('circle')
            .attr('class', 'rainfall-point')
            .attr('cx', d => this.xScale(d.dayOfYear))
            .attr('cy', d => this.yScale(d.rainfall))
            .attr('r', 3)
            .attr('fill', '#0066cc')
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('r', 5)
                    .style('stroke', '#fff')
                    .style('stroke-width', '2px');

                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                // Ensure d.Day, d.Month, d.Year are available and format date
                const formattedDate = (d.Day && d.Month && d.Year) ? `${d.Day}/${d.Month}/${d.Year}` : 'N/A';

                this.tooltip.html(`
                    <strong>Date:</strong> ${formattedDate}<br/>
                    <strong>Rainfall:</strong> ${d.rainfall.toFixed(1)}mm
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', (event, d) => {
                // Restore original point size and style
                d3.select(event.target)
                    .attr('r', 3)
                    .style('stroke', 'none')
                    .style('stroke-width', '0px');

                this.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    /**
     * Update chart interpretation
     * @param {string} station - The station name
     * @param {Array} dailyStats - The daily statistics data
     * @param {Array} currentYearData - The current year data
     */
    updateChartInterpretation(station, dailyStats, currentYearData) {
        try {
            // Get the chart summary element
            const chartSummary = document.getElementById('rainfall-line-chart-summary');
            if (!chartSummary) return;

            // Calculate statistics for current year data
            let totalRainfall = 0;
            let maxRainfall = 0;
            let maxRainfallDate = '';
            let rainyDays = 0;
            let validDataCount = 0;

            // Ensure currentYearData is an array
            const currentYearDataArray = Array.isArray(currentYearData) ? currentYearData : [];

            // Calculate historical statistics
            let historicalMaxRainfall = 0;
            let historicalMaxRainfallDate = '';
            let historicalTotalRainfall = 0;
            let historicalRainyDays = 0;

            // Process historical data
            if (dailyStats && dailyStats.length > 0) {
                try {
                    // Find maximum rainfall
                    const maxRainfallStat = dailyStats.reduce((max, current) => {
                        if (current.rainfallMax > max.rainfallMax) {
                            return current;
                        }
                        return max;
                    }, { rainfallMax: 0 });

                    historicalMaxRainfall = maxRainfallStat.rainfallMax || 0;

                    // Format the date for max rainfall
                    if (maxRainfallStat.rainfallMaxYear && maxRainfallStat.month && maxRainfallStat.day) {
                        historicalMaxRainfallDate = `${maxRainfallStat.day}/${maxRainfallStat.month}/${maxRainfallStat.rainfallMaxYear}`;
                    }

                    // Calculate total rainfall (average per day * days in period)
                    historicalTotalRainfall = dailyStats.reduce((sum, day) => sum + (day.rainfallMean || 0), 0);

                    // Count rainy days (days with average rainfall > 0.1mm)
                    historicalRainyDays = dailyStats.filter(day =>
                        typeof day.rainfallMean === 'number' && !isNaN(day.rainfallMean) && day.rainfallMean > 0.1
                    ).length;
                } catch (e) {
                    console.error('Error calculating historical rainfall statistics:', e);
                }
            }

            // Process current year data
            if (currentYearDataArray.length > 0) {
                try {
                    // Count valid data points
                    validDataCount = currentYearDataArray.filter(day =>
                        day.Rainfall !== undefined && day.Rainfall !== null && !isNaN(day.Rainfall)
                    ).length;

                    if (validDataCount > 0) {
                        // Calculate total rainfall
                        totalRainfall = currentYearDataArray.reduce((sum, day) => {
                            if (day.Rainfall !== undefined && day.Rainfall !== null && !isNaN(day.Rainfall)) {
                                return sum + day.Rainfall;
                            }
                            return sum;
                        }, 0);

                        // Find maximum rainfall
                        const maxRainfallDay = currentYearDataArray.reduce((max, current) => {
                            if (current.Rainfall !== undefined && current.Rainfall !== null && !isNaN(current.Rainfall) && current.Rainfall > max.Rainfall) {
                                return current;
                            }
                            return max;
                        }, { Rainfall: 0 });

                        maxRainfall = maxRainfallDay.Rainfall;

                        // Format the date for max rainfall
                        if (maxRainfallDay.Day && maxRainfallDay.Month && maxRainfallDay.Year) {
                            maxRainfallDate = `${maxRainfallDay.Day}/${maxRainfallDay.Month}/${maxRainfallDay.Year}`;
                        }

                        // Count rainy days (days with rainfall > 0.1mm)
                        rainyDays = currentYearDataArray.filter(day =>
                            typeof day.Rainfall === 'number' && !isNaN(day.Rainfall) && day.Rainfall > 0.1
                        ).length;
                    }
                } catch (e) {
                    console.error('Error calculating current year rainfall statistics:', e);
                }
            }

            // Format values for display - ensure they are numbers first
            const totalRainfallFormatted = typeof totalRainfall === 'number' ? totalRainfall.toFixed(1) : '0.0';
            const maxRainfallFormatted = typeof maxRainfall === 'number' ? maxRainfall.toFixed(1) : '0.0';
            const historicalTotalRainfallFormatted = typeof historicalTotalRainfall === 'number' ? historicalTotalRainfall.toFixed(1) : '0.0';
            const historicalMaxRainfallFormatted = typeof historicalMaxRainfall === 'number' ? historicalMaxRainfall.toFixed(1) : '0.0';

            // Get month name if a specific month is selected
            let periodText = 'the selected period';
            if (this.currentMonth !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                periodText = monthNames[parseInt(this.currentMonth) - 1];
            }

            // Create interpretation text
            let interpretationText = '';

            if (validDataCount > 0) {
                interpretationText = `For ${station} during ${periodText}, the total rainfall was ${totalRainfallFormatted}mm with ${rainyDays} rainy days. `;

                if (maxRainfall > 0) {
                    interpretationText += `The highest daily rainfall was ${maxRainfallFormatted}mm on ${maxRainfallDate}. `;
                }

                if (historicalTotalRainfall > 0) {
                    const difference = totalRainfall - historicalTotalRainfall;
                    const percentDifference = (difference / historicalTotalRainfall * 100).toFixed(1);

                    if (difference > 0) {
                        interpretationText += `This is ${percentDifference}% more than the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    } else if (difference < 0) {
                        interpretationText += `This is ${Math.abs(percentDifference)}% less than the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    } else {
                        interpretationText += `This matches the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    }
                }
            } else {
                interpretationText = `No rainfall data available for ${station} during ${periodText}.`;
            }

            // Update the chart summary
            chartSummary.textContent = interpretationText;

            // Update extremes table
            const historicalRow = document.getElementById('rainfall-line-historical-extremes');
            const currentYearRow = document.getElementById('rainfall-line-current-year-extremes');

            if (historicalRow) {
                historicalRow.innerHTML = `
                    <td>Historical</td>
                    <td>${historicalMaxRainfallFormatted}mm</td>
                    <td>${historicalMaxRainfallDate || '--'}</td>
                    <td>${historicalRainyDays}</td>
                    <td>${historicalTotalRainfallFormatted}mm</td>
                `;
            }

            if (currentYearRow) {
                if (validDataCount > 0) {
                    currentYearRow.innerHTML = `
                        <td>Current Year</td>
                        <td>${maxRainfallFormatted}mm</td>
                        <td>${maxRainfallDate || '--'}</td>
                        <td>${rainyDays}</td>
                        <td>${totalRainfallFormatted}mm</td>
                    `;
                } else {
                    currentYearRow.innerHTML = `
                        <td>Current Year</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                    `;
                }
            }
        } catch (error) {
            console.error('Error updating rainfall line chart interpretation:', error);
        }
    }

    /**
     * Download statistics data as CSV
     */
    downloadStats() {
        if (!this.currentData || !this.currentData.dailyStats) {
            console.error('No data available for download');
            return;
        }

        const station = this.currentData.stationName || 'Station';
        const filename = `${station}_Rainfall_Statistics.csv`;

        // Create CSV content
        let csvContent = 'Day,Month,DayOfYear,RainfallMean,RainfallMax,RainfallMaxYear,RainfallMin,RainfallMinYear\n';

        this.currentData.dailyStats.forEach(stat => {
            csvContent += `${stat.day},${stat.month},${stat.dayOfYear},${stat.rainfallMean || ''},${stat.rainfallMax || ''},${stat.rainfallMaxYear || ''},${stat.rainfallMin || ''},${stat.rainfallMinYear || ''}\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download current year data as CSV
     */
    downloadCurrentYear() {
        if (!this.currentData || !this.currentData.currentYearData) {
            console.error('No current year data available for download');
            return;
        }

        const station = this.currentData.stationName || 'Station';
        const filename = `${station}_Current_Year_Rainfall.csv`;

        // Create CSV content
        let csvContent = 'Day,Month,Year,DayOfYear,Rainfall\n';

        this.currentData.currentYearData.forEach(day => {
            if (day.Rainfall !== undefined) {
                csvContent += `${day.Day},${day.Month},${day.Year},${day.dayOfYear},${day.Rainfall}\n`;
            }
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Get the historical year range for the legend
     * @returns {string} - The historical year range (e.g., "1990-2020")
     */
    getHistoricalYearRange() {
        if (this.currentData && this.currentData.yearRange) {
            return this.currentData.yearRange;
        }
        return "Historical";
    }

    /**
     * Download the chart as a PNG image with legend
     */
    downloadChart() {
        try {


            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : 'station';

            // Get the SVG element
            const svgElement = this.svg.node();
            if (!svgElement) {
                console.error('SVG element not found');
                return;
            }

            // Create a temporary SVG element for the download
            const tempSvg = svgElement.cloneNode(true);

            // Get the dimensions of the original SVG
            const svgStyle = window.getComputedStyle(svgElement);
            const width = parseFloat(svgStyle.width);
            const height = parseFloat(svgStyle.height) + 40; // Add extra height for the legend

            // Set the dimensions of the temporary SVG
            tempSvg.setAttribute('width', width);
            tempSvg.setAttribute('height', height);
            tempSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Add a legend directly to the SVG
            const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            legendGroup.setAttribute('transform', `translate(${this.margin.left + 20}, ${height - 40})`);

            // Create legend items with colors that match the actual chart elements
            const legendItems = [
                { color: '#0066cc', text: 'Current Year Rainfall' },  // Blue - matches the .rainfall-line color
                { color: '#e74c3c', text: 'Maximum Rainfall' },       // Red - matches the max point color
                { color: '#666666', text: this.getHistoricalYearRange() + ' Average' }, // Gray - matches the .rainfall-historical-mean-line color
                { color: 'rgba(0, 102, 204, 0.2)', text: this.getHistoricalYearRange() + ' Range' } // Light blue - matches the .rainfall-range-area color
            ];

            let xOffset = 0;
            legendItems.forEach(item => {
                // Create rect with explicit fill to ensure proper color rendering in downloaded image
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', xOffset);
                rect.setAttribute('y', 0);
                rect.setAttribute('width', 15);
                rect.setAttribute('height', 15);
                rect.setAttribute('fill', item.color);
                rect.setAttribute('stroke', 'none');
                legendGroup.appendChild(rect);

                // Create text
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xOffset + 20);
                text.setAttribute('y', 12);
                text.setAttribute('font-size', '12px');
                text.textContent = item.text;
                legendGroup.appendChild(text);

                xOffset += 150; // Space between legend items
            });

            tempSvg.appendChild(legendGroup);

            // Make sure all styles are properly applied to the SVG elements
            // This ensures that class-based styles are preserved when downloading
            const svgStyles = document.createElement('style');
            svgStyles.textContent = `
                .rainfall-range-area { fill: rgba(0, 102, 204, 0.2); stroke: none; }
                .rainfall-historical-mean-line { fill: none; stroke: #666666; stroke-width: 2; stroke-dasharray: 5,5; }
                .rainfall-line { fill: none; stroke: #0066cc; stroke-width: 2; }
                .rainfall-point { fill: #0066cc; }
                .max-label { fill: #e74c3c; }
            `;
            tempSvg.appendChild(svgStyles);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(tempSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create image element
            const img = new Image();
            img.onload = function() {
                // Draw the SVG on the canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                // Convert canvas to PNG
                const pngUrl = canvas.toDataURL('image/png');

                // Create a link element
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `${station}_rainfall_line_chart.png`;

                // Append the link to the document
                document.body.appendChild(link);

                // Click the link
                link.click();

                // Remove the link
                document.body.removeChild(link);

                // Revoke the URL
                URL.revokeObjectURL(url);


            };

            // Handle errors
            img.onerror = function(error) {
                console.error('Error loading SVG image for download:', error);
                alert('Error downloading chart. Please check the console for details.');
            };

            // Set the image source to the SVG URL
            img.src = url;
        } catch (error) {
            console.error('Error downloading Rainfall Line chart:', error);
            alert('Error downloading chart. Please check the console for details.');
        }
    }
}

/**
 * Rainfall Bar Chart with Mean Line Overlay
 */
class RainfallBarChart extends RainfallChartBase {
    constructor(containerId) {
        super(containerId);
        this.initializeChart();
        this.createTooltip();
    }

    /**
     * Update chart with new data
     * @param {Object} data - The data to visualize
     */
    updateChart(data) {
        if (!data || !data.dailyStats || !data.currentYearData) {
            console.error('Invalid data for Rainfall Bar chart');
            return;
        }

        // Store the data for later use
        this.currentData = data;

        // Filter data by month if needed
        const filteredDailyStats = this.filterDataByMonth(data.dailyStats);
        const filteredCurrentYearData = this.filterDataByMonth(data.currentYearData);

        // Filter current year data to only include records with rainfall data
        const currentYearRainfallData = filteredCurrentYearData
            .filter(d => d.Rainfall !== undefined && d.Rainfall !== null && !isNaN(d.Rainfall))
            .map(d => {
                // Calculate day of year if it doesn't exist
                let dayOfYear = d.dayOfYear;
                if (!dayOfYear && d.Month && d.Day) {
                    // Use a leap year (2020) for consistent day of year calculations
                    const date = new Date(2020, d.Month - 1, d.Day);
                    const startOfYear = new Date(2020, 0, 1);
                    dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
                }

                return {
                    ...d,
                    rainfall: d.Rainfall,
                    dayOfYear: dayOfYear || 0 // Ensure dayOfYear is always defined
                };
            });

        // Process daily stats to extract rainfall data
        const processedDailyStats = filteredDailyStats.map(day => {
            // Check if we have rainfall data in the stats
            const rainfallMean = day.rainfallMean || 0;

            return {
                ...day,
                rainfallMean
            };
        });

        // Set domain for scales
        let yMax = 50; // Default value if no data

        // Find the maximum rainfall value across all datasets
        if (processedDailyStats.length > 0 || currentYearRainfallData.length > 0) {
            const maxValues = [];

            // Add max values from daily stats
            if (processedDailyStats.length > 0) {
                maxValues.push(d3.max(processedDailyStats, d => d.rainfallMean || 0));
            }

            // Add max values from current year data
            if (currentYearRainfallData.length > 0) {
                maxValues.push(d3.max(currentYearRainfallData, d => d.rainfall || 0));
            }

            const maxRainfall = Math.max(...maxValues, 0);

            // Add padding (20% of the max)
            const paddedMaxRainfall = Math.ceil(maxRainfall * 1.2);

            // Ensure we have reasonable defaults if data is missing
            yMax = isFinite(paddedMaxRainfall) && paddedMaxRainfall > 0 ? paddedMaxRainfall : 50;
        }

        // Set x-axis domain based on the selected month
        if (this.currentMonth === 'all') {
            this.xScale.domain([0, 366]); // Full year
        } else {
            // Find the day range for the selected month
            const monthNum = parseInt(this.currentMonth);
            const year = 2020; // Leap year for proper day calculations
            const firstDay = new Date(year, monthNum - 1, 1);
            const lastDay = new Date(year, monthNum, 0);

            const startOfYear = new Date(year, 0, 1);
            const firstDayOfYear = Math.floor((firstDay - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
            const lastDayOfYear = Math.floor((lastDay - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

            this.xScale.domain([firstDayOfYear, lastDayOfYear]);
        }

        this.yScale.domain([0, yMax]);

        // Update axes
        if (this.currentMonth === 'all') {
            // For yearly view, show month names
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthDays = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]; // Approximate day of year for start of each month

            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickValues(monthDays)
                .tickFormat((d, i) => monthNames[i])
                .tickSize(10)
            );
        } else {
            // For monthly view, show day numbers
            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickFormat(d => {
                    const date = new Date(2020, 0, d); // Using leap year 2020
                    return date.getDate();
                })
                .ticks(15) // Adjust number of ticks for better readability
            );
        }

        this.yAxis.call(d3.axisLeft(this.yScale)
            .tickFormat(d => d) // Remove units from tick labels
            .ticks(window.innerWidth <= 768 ? 5 : 10)
        );

        // Add grid lines
        this.chart.selectAll('.grid-line').remove();

        this.chart.selectAll('.grid-line-y')
            .data(this.yScale.ticks())
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0)
            .attr('x2', this.width)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d))
            .style('stroke', '#eee')
            .style('stroke-width', 1);

        // Update chart title
        const stationName = data.stationName || document.getElementById('station')?.value || 'Station';

        // Add month to title if filtered
        let titleText = `Daily Rainfall Bar Chart - ${stationName}`;
        if (this.currentMonth !== 'all') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            titleText += ` (${monthNames[parseInt(this.currentMonth) - 1]})`;
        }

        this.chartTitle.text(titleText);

        // Clear previous elements
        this.chart.selectAll('.rainfall-bar, .rainfall-mean-line, .rainfall-point, .max-label').remove();

        // Draw the rainfall bars
        this.drawRainfallBars(currentYearRainfallData);

        // Draw the historical mean line
        this.drawHistoricalMeanLine(processedDailyStats);

        // Update chart interpretation
        this.updateChartInterpretation(data.stationName, filteredDailyStats, currentYearRainfallData);
    }

    /**
     * Draw rainfall bars for current year data
     * @param {Array} rainfallData - The rainfall data
     */
    drawRainfallBars(rainfallData) {
        if (!rainfallData || rainfallData.length === 0) {
            // Add a "No Data" message to the chart
            this.chart.append('text')
                .attr('class', 'no-data-message')
                .attr('x', this.width / 2)
                .attr('y', this.height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '16px')
                .attr('fill', '#999')
                .text('No data available for the selected period');

            return;
        }

        // Calculate bar width based on the number of days in view
        const barWidth = Math.min(
            8, // Maximum width
            Math.max(
                2, // Minimum width
                this.width / (this.xScale.domain()[1] - this.xScale.domain()[0] + 1) * 0.8 // 80% of available space
            )
        );

        // Draw bars
        this.chart.selectAll('.rainfall-bar')
            .data(rainfallData)
            .enter()
            .append('rect')
            .attr('class', 'rainfall-bar')
            .attr('x', d => this.xScale(d.dayOfYear) - barWidth / 2)
            .attr('y', d => this.yScale(d.rainfall))
            .attr('width', barWidth)
            .attr('height', d => this.height - this.yScale(d.rainfall))
            .style('fill', '#3498db')
            .on('mouseover', (event, d) => {
                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                // Format date as DD.MM.YYYY
                const formattedDate = `${d.Day || '??'}.${d.Month || '??'}.${d.Year || new Date().getFullYear()}`;

                const tooltipContent = `
                    <div class="rainfall-tooltip-date">${formattedDate}</div>
                    <div class="rainfall-tooltip-item">
                        <span class="rainfall-tooltip-color" style="background-color: #3498db;"></span>
                        <span class="rainfall-tooltip-label">Rainfall:</span>
                        <span class="rainfall-tooltip-value">${typeof d.rainfall === 'number' ? d.rainfall.toFixed(1) : '0.0'} mm</span>
                    </div>
                `;

                this.tooltip.html(tooltipContent)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Find the single maximum rainfall point
        const maxRainfallPoint = rainfallData.reduce((max, current) =>
            (current.rainfall > max.rainfall) ? current : max, { rainfall: 0 });

        // Only add label if there's significant rainfall
        if (maxRainfallPoint.rainfall > 0.1) {
            // Add label for max rainfall point
            this.chart.append('text')
                .attr('class', 'max-label')
                .attr('x', this.xScale(maxRainfallPoint.dayOfYear))
                .attr('y', this.yScale(maxRainfallPoint.rainfall) - 10)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', '#e74c3c')
                .text(`Max: ${typeof maxRainfallPoint.rainfall === 'number' ? maxRainfallPoint.rainfall.toFixed(1) : '0.0'}mm`);

            // Highlight only the single max rainfall bar with a different color
            this.chart.selectAll('.rainfall-bar')
                .filter(d => d.dayOfYear === maxRainfallPoint.dayOfYear && d.rainfall === maxRainfallPoint.rainfall)
                .style('fill', '#e74c3c');
        }
    }

    /**
     * Draw the historical mean line
     * @param {Array} dailyStats - The daily statistics data
     */
    drawHistoricalMeanLine(dailyStats) {
        if (!dailyStats || dailyStats.length === 0) return;

        // Filter out days without rainfall mean data
        const validData = dailyStats.filter(d =>
            d.rainfallMean !== undefined && !isNaN(d.rainfallMean)
        );

        if (validData.length === 0) return;

        // Create line generator
        const line = d3.line()
            .x(d => this.xScale(d.dayOfYear))
            .y(d => this.yScale(d.rainfallMean))
            .defined(d => d.rainfallMean !== undefined && !isNaN(d.rainfallMean))
            .curve(d3.curveMonotoneX);

        // Draw line
        this.chart.append('path')
            .datum(validData)
            .attr('class', 'rainfall-mean-line')
            .attr('fill', 'none')
            .attr('stroke', '#666666')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', line);
    }

    /**
     * Update chart interpretation
     * @param {string} station - The station name
     * @param {Array} dailyStats - The daily statistics data
     * @param {Array} currentYearData - The current year data
     */
    updateChartInterpretation(station, dailyStats, currentYearData) {
        try {
            // Get the chart summary element
            const chartSummary = document.getElementById('rainfall-bar-chart-summary');
            if (!chartSummary) return;

            // Calculate statistics for current year data
            let totalRainfall = 0;
            let maxRainfall = 0;
            let maxRainfallDate = '';
            let rainyDays = 0;
            let validDataCount = 0;

            // Ensure currentYearData is an array
            const currentYearDataArray = Array.isArray(currentYearData) ? currentYearData : [];

            // Calculate historical statistics
            let historicalMaxRainfall = 0;
            let historicalMaxRainfallDate = '';
            let historicalTotalRainfall = 0;
            let historicalRainyDays = 0;

            // Process historical data
            if (dailyStats && dailyStats.length > 0) {
                try {
                    // Find maximum rainfall
                    const maxRainfallStat = dailyStats.reduce((max, current) => {
                        if (current.rainfallMax > max.rainfallMax) {
                            return current;
                        }
                        return max;
                    }, { rainfallMax: 0 });

                    historicalMaxRainfall = maxRainfallStat.rainfallMax || 0;

                    // Format the date for max rainfall
                    if (maxRainfallStat.rainfallMaxYear && maxRainfallStat.month && maxRainfallStat.day) {
                        historicalMaxRainfallDate = `${maxRainfallStat.day}/${maxRainfallStat.month}/${maxRainfallStat.rainfallMaxYear}`;
                    }

                    // Calculate total rainfall (average per day * days in period)
                    historicalTotalRainfall = dailyStats.reduce((sum, day) => sum + (day.rainfallMean || 0), 0);

                    // Count rainy days (days with average rainfall > 0.1mm)
                    historicalRainyDays = dailyStats.filter(day =>
                        typeof day.rainfallMean === 'number' && !isNaN(day.rainfallMean) && day.rainfallMean > 0.1
                    ).length;
                } catch (e) {
                    console.error('Error calculating historical rainfall statistics:', e);
                }
            }

            // Process current year data
            if (currentYearDataArray.length > 0) {
                try {
                    // Count valid data points
                    validDataCount = currentYearDataArray.filter(day =>
                        day.Rainfall !== undefined && day.Rainfall !== null && !isNaN(day.Rainfall)
                    ).length;

                    if (validDataCount > 0) {
                        // Calculate total rainfall
                        totalRainfall = currentYearDataArray.reduce((sum, day) => {
                            if (day.Rainfall !== undefined && day.Rainfall !== null && !isNaN(day.Rainfall)) {
                                return sum + day.Rainfall;
                            }
                            return sum;
                        }, 0);

                        // Find maximum rainfall
                        const maxRainfallDay = currentYearDataArray.reduce((max, current) => {
                            if (current.Rainfall !== undefined && current.Rainfall !== null && !isNaN(current.Rainfall) && current.Rainfall > max.Rainfall) {
                                return current;
                            }
                            return max;
                        }, { Rainfall: 0 });

                        maxRainfall = maxRainfallDay.Rainfall;

                        // Format the date for max rainfall
                        if (maxRainfallDay.Day && maxRainfallDay.Month && maxRainfallDay.Year) {
                            maxRainfallDate = `${maxRainfallDay.Day}/${maxRainfallDay.Month}/${maxRainfallDay.Year}`;
                        }

                        // Count rainy days (days with rainfall > 0.1mm)
                        rainyDays = currentYearDataArray.filter(day =>
                            typeof day.Rainfall === 'number' && !isNaN(day.Rainfall) && day.Rainfall > 0.1
                        ).length;
                    }
                } catch (e) {
                    console.error('Error calculating current year rainfall statistics:', e);
                }
            }

            // Format values for display - ensure they are numbers first
            const totalRainfallFormatted = typeof totalRainfall === 'number' ? totalRainfall.toFixed(1) : '0.0';
            const maxRainfallFormatted = typeof maxRainfall === 'number' ? maxRainfall.toFixed(1) : '0.0';
            const historicalTotalRainfallFormatted = typeof historicalTotalRainfall === 'number' ? historicalTotalRainfall.toFixed(1) : '0.0';
            const historicalMaxRainfallFormatted = typeof historicalMaxRainfall === 'number' ? historicalMaxRainfall.toFixed(1) : '0.0';

            // Get month name if a specific month is selected
            let periodText = 'the selected period';
            if (this.currentMonth !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                periodText = monthNames[parseInt(this.currentMonth) - 1];
            }

            // Create interpretation text
            let interpretationText = '';

            if (validDataCount > 0) {
                interpretationText = `For ${station} during ${periodText}, the total rainfall was ${totalRainfallFormatted}mm with ${rainyDays} rainy days. `;

                if (maxRainfall > 0) {
                    interpretationText += `The highest daily rainfall was ${maxRainfallFormatted}mm on ${maxRainfallDate}. `;
                }

                if (historicalTotalRainfall > 0) {
                    const difference = totalRainfall - historicalTotalRainfall;
                    const percentDifference = (difference / historicalTotalRainfall * 100).toFixed(1);

                    if (difference > 0) {
                        interpretationText += `This is ${percentDifference}% more than the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    } else if (difference < 0) {
                        interpretationText += `This is ${Math.abs(percentDifference)}% less than the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    } else {
                        interpretationText += `This matches the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    }
                }
            } else {
                interpretationText = `No rainfall data available for ${station} during ${periodText}.`;
            }

            // Update the chart summary
            chartSummary.textContent = interpretationText;

            // Update extremes table
            const historicalRow = document.getElementById('rainfall-bar-historical-extremes');
            const currentYearRow = document.getElementById('rainfall-bar-current-year-extremes');

            if (historicalRow) {
                historicalRow.innerHTML = `
                    <td>Historical</td>
                    <td>${historicalMaxRainfallFormatted}mm</td>
                    <td>${historicalMaxRainfallDate || '--'}</td>
                    <td>${historicalRainyDays}</td>
                    <td>${historicalTotalRainfallFormatted}mm</td>
                `;
            }

            if (currentYearRow) {
                if (validDataCount > 0) {
                    currentYearRow.innerHTML = `
                        <td>Current Year</td>
                        <td>${maxRainfallFormatted}mm</td>
                        <td>${maxRainfallDate || '--'}</td>
                        <td>${rainyDays}</td>
                        <td>${totalRainfallFormatted}mm</td>
                    `;
                } else {
                    currentYearRow.innerHTML = `
                        <td>Current Year</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                    `;
                }
            }
        } catch (error) {
            console.error('Error updating rainfall bar chart interpretation:', error);
        }
    }

    /**
     * Download statistics data as CSV
     */
    downloadStats() {
        if (!this.currentData || !this.currentData.dailyStats) {
            console.error('No data available for download');
            return;
        }

        const station = this.currentData.stationName || 'Station';
        const filename = `${station}_Rainfall_Statistics.csv`;

        // Create CSV content
        let csvContent = 'Day,Month,DayOfYear,RainfallMean,RainfallMax,RainfallMaxYear,RainfallMin,RainfallMinYear\n';

        this.currentData.dailyStats.forEach(stat => {
            csvContent += `${stat.day},${stat.month},${stat.dayOfYear},${stat.rainfallMean || ''},${stat.rainfallMax || ''},${stat.rainfallMaxYear || ''},${stat.rainfallMin || ''},${stat.rainfallMinYear || ''}\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download current year data as CSV
     */
    downloadCurrentYear() {
        if (!this.currentData || !this.currentData.currentYearData) {
            console.error('No current year data available for download');
            return;
        }

        const station = this.currentData.stationName || 'Station';
        const filename = `${station}_Current_Year_Rainfall.csv`;

        // Create CSV content
        let csvContent = 'Day,Month,Year,DayOfYear,Rainfall\n';

        this.currentData.currentYearData.forEach(day => {
            if (day.Rainfall !== undefined) {
                csvContent += `${day.Day},${day.Month},${day.Year},${day.dayOfYear},${day.Rainfall}\n`;
            }
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Get the historical year range for the legend
     * @returns {string} - The historical year range (e.g., "1990-2020")
     */
    getHistoricalYearRange() {
        if (this.currentData && this.currentData.yearRange) {
            return this.currentData.yearRange;
        }
        return "Historical";
    }

    /**
     * Download the chart as a PNG image with legend
     */
    downloadChart() {
        try {


            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : 'station';

            // Get the SVG element
            const svgElement = this.svg.node();
            if (!svgElement) {
                console.error('SVG element not found');
                return;
            }

            // Create a temporary SVG element for the download
            const tempSvg = svgElement.cloneNode(true);

            // Get the dimensions of the original SVG
            const svgStyle = window.getComputedStyle(svgElement);
            const width = parseFloat(svgStyle.width);
            const height = parseFloat(svgStyle.height) + 40; // Add extra height for the legend

            // Set the dimensions of the temporary SVG
            tempSvg.setAttribute('width', width);
            tempSvg.setAttribute('height', height);
            tempSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Add a legend directly to the SVG
            const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            legendGroup.setAttribute('transform', `translate(${this.margin.left + 20}, ${height - 40})`);

            // Create legend items
            const legendItems = [
                { color: '#3498db', text: 'Daily Rainfall' },
                { color: '#e74c3c', text: 'Maximum Rainfall' },
                { color: '#666666', text: this.getHistoricalYearRange() + ' Average' }
            ];

            let xOffset = 0;
            legendItems.forEach(item => {
                // Create rect
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', xOffset);
                rect.setAttribute('y', 0);
                rect.setAttribute('width', 15);
                rect.setAttribute('height', 15);
                rect.setAttribute('fill', item.color);
                legendGroup.appendChild(rect);

                // Create text
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xOffset + 20);
                text.setAttribute('y', 12);
                text.setAttribute('font-size', '12px');
                text.textContent = item.text;
                legendGroup.appendChild(text);

                xOffset += 150; // Space between legend items
            });

            tempSvg.appendChild(legendGroup);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(tempSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create image element
            const img = new Image();
            img.onload = function() {
                // Draw the SVG on the canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                // Convert canvas to PNG
                const pngUrl = canvas.toDataURL('image/png');

                // Create a link element
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `${station}_rainfall_bar_chart.png`;

                // Append the link to the document
                document.body.appendChild(link);

                // Click the link
                link.click();

                // Remove the link
                document.body.removeChild(link);

                // Revoke the URL
                URL.revokeObjectURL(url);


            };

            // Handle errors
            img.onerror = function(error) {
                console.error('Error loading SVG image for download:', error);
                alert('Error downloading chart. Please check the console for details.');
            };

            // Set the image source to the SVG URL
            img.src = url;
        } catch (error) {
            console.error('Error downloading Rainfall Bar chart:', error);
            alert('Error downloading chart. Please check the console for details.');
        }
    }
}

/**
 * Rainfall Boxplot Chart
 */
class RainfallBoxplotChart extends RainfallChartBase {
    constructor(containerId) {
        super(containerId);
        this.initializeChart();
        this.createTooltip();
    }

    /**
     * Update chart with new data
     * @param {Object} data - The data to visualize
     */
    updateChart(data) {
        if (!data || !data.dailyStats || !data.currentYearData) {
            console.error('Invalid data for Rainfall Boxplot chart');
            return;
        }

        // Store the data for later use
        this.currentData = data;

        console.log('Rainfall Boxplot chart data:', {
            dailyStats: data.dailyStats.length,
            currentYearData: data.currentYearData.length
        });

        // Check for rainfall data in daily stats
        const dailyStatsWithRainfall = data.dailyStats.filter(day =>
            day.rainfallValues || day.rainfallMean !== undefined ||
            day.rainfallMax !== undefined || day.rainfallMin !== undefined);

        console.log(`Found ${dailyStatsWithRainfall.length} days with rainfall data in daily stats`);

        if (dailyStatsWithRainfall.length > 0) {
            console.log('Sample daily stats with rainfall:', dailyStatsWithRainfall.slice(0, 3));
        }

        // Check for rainfall data in current year data
        const currentYearWithRainfall = data.currentYearData.filter(d =>
            d.Rainfall !== undefined && d.Rainfall !== null && !isNaN(d.Rainfall));

        console.log(`Found ${currentYearWithRainfall.length} records with rainfall data in current year data`);

        if (currentYearWithRainfall.length > 0) {
            console.log('Sample current year data with rainfall:', currentYearWithRainfall.slice(0, 3));
        }

        // For historical data, always show all months
        const filteredDailyStats = data.dailyStats;

        // For current year data, filter by month if a specific month is selected
        const filteredCurrentYearData = this.filterDataByMonth(data.currentYearData);

        console.log('Filtered data:', {
            dailyStats: filteredDailyStats.length,
            currentYearData: filteredCurrentYearData.length
        });

        // Filter current year data to only include records with rainfall data
        const currentYearRainfallData = filteredCurrentYearData
            .filter(d => d.Rainfall !== undefined && d.Rainfall !== null && !isNaN(d.Rainfall))
            .map(d => {
                // Calculate day of year if it doesn't exist
                let dayOfYear = d.dayOfYear;
                if (!dayOfYear && d.Month && d.Day) {
                    // Use a leap year (2020) for consistent day of year calculations
                    const date = new Date(2020, d.Month - 1, d.Day);
                    const startOfYear = new Date(2020, 0, 1);
                    dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
                }

                return {
                    ...d,
                    rainfall: d.Rainfall,
                    dayOfYear: dayOfYear || 0 // Ensure dayOfYear is always defined
                };
            });

        console.log(`Found ${currentYearRainfallData.length} records with rainfall data in filtered current year data`);

        if (currentYearRainfallData.length > 0) {
            console.log('Sample current year rainfall data:', currentYearRainfallData.slice(0, 3));
        } else if (filteredCurrentYearData.length > 0) {
            console.log('No current year rainfall data found for this station.');
        }

        // Process daily stats to extract rainfall data for boxplots
        // We need to calculate quartiles for each day
        const boxplotData = this.calculateBoxplotData(filteredDailyStats);

        // Set domain for scales
        let yMax = 20; // Lower default value if no data

        // Find the maximum rainfall value across all datasets
        if (boxplotData.length > 0 || currentYearRainfallData.length > 0) {
            // Instead of using absolute max values which can include extreme outliers,
            // we'll use the upper whiskers (Q3 + 1.5*IQR) which represent the typical
            // upper bound of the data without outliers
            const visibleMaxValues = [];
            const absoluteMaxValues = [];

            // Add values from boxplot data
            if (boxplotData.length > 0) {
                // Get the maximum upper whisker value (visible part of boxplot)
                visibleMaxValues.push(d3.max(boxplotData, d => d.upperWhisker || 0));

                // Also track the absolute maximum for reference
                absoluteMaxValues.push(d3.max(boxplotData, d => d.max || 0));

                // Add Q3 values to better understand the main part of the boxplots
                const q3Values = boxplotData.map(d => d.q3 || 0);
                if (q3Values.length > 0) {
                    const maxQ3 = Math.max(...q3Values);
                    visibleMaxValues.push(maxQ3 * 2); // Use 2x the max Q3 as another reference point
                }
            }

            // Add values from current year data
            if (currentYearRainfallData.length > 0) {
                visibleMaxValues.push(d3.max(currentYearRainfallData, d => d.rainfall || 0));
                absoluteMaxValues.push(d3.max(currentYearRainfallData, d => d.rainfall || 0));
            }

            // Use the visible max values for the y-axis scale
            const visibleMaxRainfall = Math.max(...visibleMaxValues, 0);
            const absoluteMaxRainfall = Math.max(...absoluteMaxValues, 0);

            console.log(`Visible max rainfall: ${visibleMaxRainfall}, Absolute max rainfall: ${absoluteMaxRainfall}`);

            // If the absolute max is much larger than the visible max (outliers),
            // use a more reasonable scale based on the visible elements
            let effectiveMax;
            if (absoluteMaxRainfall > visibleMaxRainfall * 3) {
                // There are extreme outliers, use the visible max instead
                effectiveMax = visibleMaxRainfall;
                console.log(`Using visible max (${visibleMaxRainfall}) instead of absolute max (${absoluteMaxRainfall}) due to extreme outliers`);
            } else {
                // No extreme outliers, use the absolute max
                effectiveMax = absoluteMaxRainfall;
            }

            // Add appropriate padding based on the effective max value
            let paddedMaxRainfall;
            if (effectiveMax < 10) {
                paddedMaxRainfall = Math.ceil(effectiveMax * 1.3); // 30% padding for small values
            } else if (effectiveMax < 50) {
                paddedMaxRainfall = Math.ceil(effectiveMax * 1.2); // 20% padding for medium values
            } else {
                paddedMaxRainfall = Math.ceil(effectiveMax * 1.1); // 10% padding for large values
            }

            // Round to a nice number for better readability
            paddedMaxRainfall = this.roundToNiceNumber(paddedMaxRainfall);

            // Apply a hard cap to prevent extremely tall y-axes
            // This ensures the boxplots are always reasonably sized
            const hardCap = 150; // Maximum y-axis value to ensure boxplots are visible
            if (paddedMaxRainfall > hardCap && visibleMaxRainfall < hardCap * 0.7) {
                paddedMaxRainfall = hardCap;
                console.log(`Applied hard cap of ${hardCap} to y-axis maximum`);
            }

            // Ensure we have reasonable defaults if data is missing
            yMax = isFinite(paddedMaxRainfall) && paddedMaxRainfall > 0 ? paddedMaxRainfall : 20;

            console.log(`Setting y-axis max to ${yMax} based on effective max of ${effectiveMax}`);
        }

        // Always set x-axis domain for full year with monthly display
        // Calculate positions for month centers
        const monthCenters = [];
        const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        let dayCount = 0;
        for (let month = 1; month <= 12; month++) {
            dayCount += monthDays[month-1];
            const midPoint = dayCount + Math.floor(monthDays[month] / 2);
            monthCenters.push(midPoint);
        }

        this.xScale.domain([0, 366]); // Full year
        this.yScale.domain([0, yMax]);

        // Update axes - always show month names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        this.xAxis.call(d3.axisBottom(this.xScale)
            .tickValues(monthCenters)
            .tickFormat((d, i) => monthNames[i])
            .tickSize(10)
        );

        this.yAxis.call(d3.axisLeft(this.yScale)
            .tickFormat(d => d) // Remove units from tick labels
            .ticks(window.innerWidth <= 768 ? 5 : 10)
        );

        // Add grid lines
        this.chart.selectAll('.grid-line').remove();

        this.chart.selectAll('.grid-line-y')
            .data(this.yScale.ticks())
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0)
            .attr('x2', this.width)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d))
            .style('stroke', '#eee')
            .style('stroke-width', 1);

        // Update chart title
        const stationName = data.stationName || document.getElementById('station')?.value || 'Station';

        // Set title for monthly boxplot
        let titleText = `Monthly Rainfall Boxplot - ${stationName}`;

        // Add year range to title
        const currentYear = new Date().getFullYear();

        // If a specific month is selected, indicate that in the title
        if (this.currentMonth !== 'all') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            titleText += ` (Historical: All Months vs ${currentYear}: ${monthNames[parseInt(this.currentMonth) - 1]})`;
        } else {
            titleText += ` (Historical vs ${currentYear})`;
        }

        // Update the x-axis label to show it's monthly data
        this.svg.select('.x-axis-label').text('Month');

        this.chartTitle.text(titleText);

        // Clear previous elements
        this.chart.selectAll('.boxplot, .boxplot-line, .boxplot-rect, .boxplot-median, .boxplot-whisker, .current-year-point, .max-label').remove();

        // Draw the boxplots
        this.drawBoxplots(boxplotData);

        // Draw the current year points
        this.drawCurrentYearPoints(currentYearRainfallData);

        // Update chart interpretation
        this.updateChartInterpretation(data.stationName, filteredDailyStats, currentYearRainfallData);
    }

    /**
     * Calculate boxplot data from daily statistics
     * @param {Array} dailyStats - The daily statistics data
     * @returns {Array} - Boxplot data
     */
    calculateBoxplotData(dailyStats) {
        if (!dailyStats || dailyStats.length === 0) {
            console.warn('No daily stats provided to calculateBoxplotData');
            return [];
        }

        // Check for rainfall data in daily stats
        const rainfallStats = dailyStats.filter(day =>
            day.rainfallValues || day.rainfallMean !== undefined ||
            day.rainfallMax !== undefined || day.rainfallMin !== undefined);
        console.log(`Found ${rainfallStats.length} days with rainfall statistics out of ${dailyStats.length} total days`);

        if (rainfallStats.length > 0) {
            console.log('Sample rainfall stats:', rainfallStats.slice(0, 3));
        } else {
            console.warn('No rainfall data found in daily stats');
        }

        // Group data by month
        const groupedByMonth = new Map();

        console.log(`Grouping ${dailyStats.length} daily stats by month for boxplot calculation`);

        // Process each record to extract rainfall values
        dailyStats.forEach(day => {
            // Skip days without month data
            if (!day.month) {
                console.log('Skipping day without month data:', day);
                return;
            }

            // Get or create entry for this month
            if (!groupedByMonth.has(day.month)) {
                groupedByMonth.set(day.month, {
                    month: day.month,
                    rainfallValues: []
                });
            }

            const monthData = groupedByMonth.get(day.month);

            // Add rainfall values if available
            if (day.rainfallValues && Array.isArray(day.rainfallValues)) {
                console.log(`Adding ${day.rainfallValues.length} rainfall values for month ${day.month}, day ${day.day}`);
                monthData.rainfallValues.push(...day.rainfallValues);
            } else if (day.rainfallMax !== undefined && day.rainfallMin !== undefined) {
                // If we don't have raw values, use min, max, and mean to approximate
                console.log(`Using min/max/mean approximation for month ${day.month}, day ${day.day}: min=${day.rainfallMin}, mean=${day.rainfallMean}, max=${day.rainfallMax}`);
                monthData.rainfallValues.push(day.rainfallMin, day.rainfallMean, day.rainfallMax);
            } else if (day.rainfallMean !== undefined) {
                // If we only have mean, use that
                console.log(`Using only mean for month ${day.month}, day ${day.day}: mean=${day.rainfallMean}`);
                monthData.rainfallValues.push(day.rainfallMean);
            } else {
                console.log(`No rainfall data for month ${day.month}, day ${day.day}`);
            }
        });

        // Log the grouped data
        console.log('Grouped rainfall data by month:');
        groupedByMonth.forEach((data, month) => {
            console.log(`Month ${month}: ${data.rainfallValues.length} rainfall values`);
        });

        // Calculate boxplot statistics for each month
        const boxplotData = [];

        groupedByMonth.forEach((monthData, month) => {
            // Sort values for quartile calculations
            const values = monthData.rainfallValues.filter(v => v !== undefined && v !== null && !isNaN(v)).sort((a, b) => a - b);

            if (values.length === 0) return;

            // Calculate quartiles
            const q1 = d3.quantile(values, 0.25) || 0;
            const median = d3.quantile(values, 0.5) || 0;
            const q3 = d3.quantile(values, 0.75) || 0;
            const iqr = q3 - q1;

            // Calculate whiskers (1.5 * IQR)
            const min = Math.max(0, d3.min(values) || 0);
            const max = d3.max(values) || 0;
            const lowerWhisker = Math.max(0, q1 - 1.5 * iqr);
            const upperWhisker = q3 + 1.5 * iqr;

            // Calculate day of year for the middle of the month (for positioning)
            const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let dayOfYear = 0;
            for (let m = 1; m < month; m++) {
                dayOfYear += monthDays[m];
            }
            dayOfYear += Math.floor(monthDays[month] / 2); // Middle of the month

            // Add boxplot data
            boxplotData.push({
                month: parseInt(month),
                dayOfYear: dayOfYear,
                min: min,
                q1: q1,
                median: median,
                q3: q3,
                max: max,
                lowerWhisker: lowerWhisker,
                upperWhisker: Math.min(upperWhisker, max), // Cap upper whisker at max value
                count: values.length // Add count for reference
            });
        });

        // Sort by month
        boxplotData.sort((a, b) => a.month - b.month);

        return boxplotData;
    }

    /**
     * Draw boxplots
     * @param {Array} boxplotData - The boxplot data
     */
    drawBoxplots(boxplotData) {
        if (!boxplotData || boxplotData.length === 0) {
            // Add a "No Data" message to the chart
            this.chart.append('text')
                .attr('class', 'no-data-message')
                .attr('x', this.width / 2)
                .attr('y', this.height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '16px')
                .attr('fill', '#999')
                .text('No data available for the selected period');

            return;
        }

        // Calculate box width based on the number of months in view
        // Make boxes narrower to fit two side by side
        const boxWidth = Math.min(
            30, // Maximum width (reduced from 40)
            Math.max(
                15, // Minimum width (reduced from 20)
                this.width / 28 // Allow space for two boxplots per month (historical and current)
            )
        );

        // Draw historical boxplots for all months - position to the left of each month center
        const boxplots = this.chart.selectAll('.boxplot')
            .data(boxplotData)
            .enter()
            .append('g')
            .attr('class', 'boxplot')
            .attr('transform', d => `translate(${this.xScale(d.dayOfYear) - boxWidth - 2},0)`);

        // Draw the boxes (IQR)
        boxplots.append('rect')
            .attr('class', 'boxplot-rect')
            .attr('x', 0)
            .attr('y', d => this.yScale(d.q3))
            .attr('width', boxWidth)
            .attr('height', d => Math.max(0, this.yScale(d.q1) - this.yScale(d.q3)))
            .style('fill', '#8c96c6')
            .style('stroke', '#4a5584')
            .style('stroke-width', 1)
            .on('mouseover', (event, d) => {
                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

                const tooltipContent = `
                    <div class="rainfall-tooltip-date">${monthNames[d.month-1]} (Historical)</div>
                    <div class="rainfall-tooltip-item">
                        <span class="rainfall-tooltip-label">Max:</span>
                        <span class="rainfall-tooltip-value">${typeof d.max === 'number' ? d.max.toFixed(1) : '0.0'} mm</span>
                    </div>
                    <div class="rainfall-tooltip-item">
                        <span class="rainfall-tooltip-label">Upper Quartile:</span>
                        <span class="rainfall-tooltip-value">${typeof d.q3 === 'number' ? d.q3.toFixed(1) : '0.0'} mm</span>
                    </div>
                    <div class="rainfall-tooltip-item">
                        <span class="rainfall-tooltip-label">Median:</span>
                        <span class="rainfall-tooltip-value">${typeof d.median === 'number' ? d.median.toFixed(1) : '0.0'} mm</span>
                    </div>
                    <div class="rainfall-tooltip-item">
                        <span class="rainfall-tooltip-label">Lower Quartile:</span>
                        <span class="rainfall-tooltip-value">${typeof d.q1 === 'number' ? d.q1.toFixed(1) : '0.0'} mm</span>
                    </div>
                    <div class="rainfall-tooltip-item">
                        <span class="rainfall-tooltip-label">Min:</span>
                        <span class="rainfall-tooltip-value">${typeof d.min === 'number' ? d.min.toFixed(1) : '0.0'} mm</span>
                    </div>
                    <div class="rainfall-tooltip-item">
                        <span class="rainfall-tooltip-label">Sample Size:</span>
                        <span class="rainfall-tooltip-value">${d.count} values</span>
                    </div>
                `;

                this.tooltip.html(tooltipContent)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Draw the median lines
        boxplots.append('line')
            .attr('class', 'boxplot-median')
            .attr('x1', 0)
            .attr('x2', boxWidth)
            .attr('y1', d => this.yScale(d.median))
            .attr('y2', d => this.yScale(d.median))
            .style('stroke', '#2c3e50')
            .style('stroke-width', 2);

        // Draw the whiskers
        boxplots.append('line')
            .attr('class', 'boxplot-whisker')
            .attr('x1', boxWidth/2)
            .attr('x2', boxWidth/2)
            .attr('y1', d => this.yScale(d.upperWhisker))
            .attr('y2', d => this.yScale(d.q3))
            .style('stroke', '#4a5584')
            .style('stroke-width', 1);

        boxplots.append('line')
            .attr('class', 'boxplot-whisker')
            .attr('x1', boxWidth/2)
            .attr('x2', boxWidth/2)
            .attr('y1', d => this.yScale(d.lowerWhisker))
            .attr('y2', d => this.yScale(d.q1))
            .style('stroke', '#4a5584')
            .style('stroke-width', 1);

        // Draw the whisker caps
        boxplots.append('line')
            .attr('class', 'boxplot-whisker-cap')
            .attr('x1', boxWidth/4)
            .attr('x2', boxWidth*3/4)
            .attr('y1', d => this.yScale(d.upperWhisker))
            .attr('y2', d => this.yScale(d.upperWhisker))
            .style('stroke', '#4a5584')
            .style('stroke-width', 1);

        boxplots.append('line')
            .attr('class', 'boxplot-whisker-cap')
            .attr('x1', boxWidth/4)
            .attr('x2', boxWidth*3/4)
            .attr('y1', d => this.yScale(d.lowerWhisker))
            .attr('y2', d => this.yScale(d.lowerWhisker))
            .style('stroke', '#4a5584')
            .style('stroke-width', 1);

        // Removed duplicate month labels - using only the x-axis labels
        // Legend is provided in the HTML, no need to add it here
    }

    /**
     * Round a number to a nice, human-readable value
     * @param {number} value - The value to round
     * @returns {number} - The rounded value
     */
    roundToNiceNumber(value) {
        if (value <= 0) return 0;

        // For small values (less than 10), round to nearest 0.5 or 1
        if (value < 10) {
            return Math.ceil(value * 2) / 2; // Round to nearest 0.5
        }

        // For medium values (10-100), round to nearest 5
        if (value < 100) {
            return Math.ceil(value / 5) * 5;
        }

        // For large values, round to nearest 10
        return Math.ceil(value / 10) * 10;
    }

    /**
     * Draw current year data points for the selected month
     * @param {Array} currentYearData - The current year data (already filtered by month)
     */
    drawCurrentYearPoints(currentYearData) {
        if (!currentYearData || currentYearData.length === 0) return;

        // Group current year data by month
        const groupedByMonth = new Map();

        currentYearData.forEach(d => {
            if (!d.Month) return;

            const month = d.Month;
            if (!groupedByMonth.has(month)) {
                groupedByMonth.set(month, []);
            }

            groupedByMonth.get(month).push(d);
        });

        // Calculate monthly totals for current year
        const monthlyTotals = [];

        groupedByMonth.forEach((data, month) => {
            // Calculate total rainfall for the month
            const totalRainfall = data.reduce((sum, d) => sum + (d.rainfall || 0), 0);

            // Calculate day of year for the middle of the month (for positioning)
            const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let dayOfYear = 0;
            for (let m = 1; m < month; m++) {
                dayOfYear += monthDays[m];
            }
            dayOfYear += Math.floor(monthDays[month] / 2); // Middle of the month

            // Add to monthly totals
            monthlyTotals.push({
                month: parseInt(month),
                dayOfYear: dayOfYear,
                totalRainfall: totalRainfall,
                count: data.length,
                data: data
            });
        });

        // Sort by month
        monthlyTotals.sort((a, b) => a.month - b.month);

        // Calculate box width based on the number of months in view
        // Make boxes narrower to fit two side by side
        const boxWidth = Math.min(
            30, // Maximum width (reduced from 40)
            Math.max(
                15, // Minimum width (reduced from 20)
                this.width / 28 // Allow space for two boxplots per month (historical and current)
            )
        );

        // Draw current year data points as blue boxplots - position to the right of each month center
        const currentYearBoxplots = this.chart.selectAll('.current-year-boxplot')
            .data(monthlyTotals)
            .enter()
            .append('g')
            .attr('class', 'current-year-boxplot')
            .attr('transform', d => `translate(${this.xScale(d.dayOfYear) + 2},0)`);

        // Store reference to the chart instance
        const self = this;

        // Process each boxplot
        currentYearBoxplots.each(function(monthData) {
            // Calculate statistics for this month's data
            const values = monthData.data.map(d => d.rainfall).filter(v => v !== undefined && v !== null && !isNaN(v)).sort((a, b) => a - b);

            if (values.length === 0) return;

            // Calculate quartiles
            const q1 = d3.quantile(values, 0.25) || 0;
            const median = d3.quantile(values, 0.5) || 0;
            const q3 = d3.quantile(values, 0.75) || 0;
            const iqr = q3 - q1;

            // Calculate whiskers (1.5 * IQR)
            const min = Math.max(0, d3.min(values) || 0);
            const max = d3.max(values) || 0;
            const lowerWhisker = Math.max(0, q1 - 1.5 * iqr);
            const upperWhisker = Math.min(q3 + 1.5 * iqr, max);

            // Use d3.select(this) to select the current group element
            const g = d3.select(this);

            // Draw the boxes (IQR)
            g.append('rect')
                .attr('class', 'current-year-boxplot-rect')
                .attr('x', 0)
                .attr('y', self.yScale(q3))
                .attr('width', boxWidth)
                .attr('height', Math.max(0, self.yScale(q1) - self.yScale(q3)))
                .style('fill', 'rgba(0, 102, 204, 0.6)')
                .style('stroke', '#0066cc')
                .style('stroke-width', 1)
                .on('mouseover', function(event) {
                    self.tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);

                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

                    const tooltipContent = `
                        <div class="rainfall-tooltip-date">${monthNames[monthData.month-1]} (Current Year)</div>
                        <div class="rainfall-tooltip-item">
                            <span class="rainfall-tooltip-label">Max:</span>
                            <span class="rainfall-tooltip-value">${typeof max === 'number' ? max.toFixed(1) : '0.0'} mm</span>
                        </div>
                        <div class="rainfall-tooltip-item">
                            <span class="rainfall-tooltip-label">Upper Quartile:</span>
                            <span class="rainfall-tooltip-value">${typeof q3 === 'number' ? q3.toFixed(1) : '0.0'} mm</span>
                        </div>
                        <div class="rainfall-tooltip-item">
                            <span class="rainfall-tooltip-label">Median:</span>
                            <span class="rainfall-tooltip-value">${typeof median === 'number' ? median.toFixed(1) : '0.0'} mm</span>
                        </div>
                        <div class="rainfall-tooltip-item">
                            <span class="rainfall-tooltip-label">Lower Quartile:</span>
                            <span class="rainfall-tooltip-value">${typeof q1 === 'number' ? q1.toFixed(1) : '0.0'} mm</span>
                        </div>
                        <div class="rainfall-tooltip-item">
                            <span class="rainfall-tooltip-label">Min:</span>
                            <span class="rainfall-tooltip-value">${typeof min === 'number' ? min.toFixed(1) : '0.0'} mm</span>
                        </div>
                        <div class="rainfall-tooltip-item">
                            <span class="rainfall-tooltip-label">Total Rainfall:</span>
                            <span class="rainfall-tooltip-value">${typeof monthData.totalRainfall === 'number' ? monthData.totalRainfall.toFixed(1) : '0.0'} mm</span>
                        </div>
                        <div class="rainfall-tooltip-item">
                            <span class="rainfall-tooltip-label">Sample Size:</span>
                            <span class="rainfall-tooltip-value">${values.length} values</span>
                        </div>
                    `;

                    self.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    self.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            // Draw the median lines
            g.append('line')
                .attr('class', 'current-year-boxplot-median')
                .attr('x1', 0)
                .attr('x2', boxWidth)
                .attr('y1', self.yScale(median))
                .attr('y2', self.yScale(median))
                .style('stroke', '#0066cc')
                .style('stroke-width', 2);

            // Draw the whiskers
            g.append('line')
                .attr('class', 'current-year-boxplot-whisker')
                .attr('x1', boxWidth/2)
                .attr('x2', boxWidth/2)
                .attr('y1', self.yScale(upperWhisker))
                .attr('y2', self.yScale(q3))
                .style('stroke', '#0066cc')
                .style('stroke-width', 1);

            g.append('line')
                .attr('class', 'current-year-boxplot-whisker')
                .attr('x1', boxWidth/2)
                .attr('x2', boxWidth/2)
                .attr('y1', self.yScale(lowerWhisker))
                .attr('y2', self.yScale(q1))
                .style('stroke', '#0066cc')
                .style('stroke-width', 1);

            // Draw the whisker caps
            g.append('line')
                .attr('class', 'current-year-boxplot-whisker-cap')
                .attr('x1', boxWidth/4)
                .attr('x2', boxWidth*3/4)
                .attr('y1', self.yScale(upperWhisker))
                .attr('y2', self.yScale(upperWhisker))
                .style('stroke', '#0066cc')
                .style('stroke-width', 1);

            g.append('line')
                .attr('class', 'current-year-boxplot-whisker-cap')
                .attr('x1', boxWidth/4)
                .attr('x2', boxWidth*3/4)
                .attr('y1', self.yScale(lowerWhisker))
                .attr('y2', self.yScale(lowerWhisker))
                .style('stroke', '#0066cc')
                .style('stroke-width', 1);
        });

        // Find and highlight the maximum monthly rainfall
        const maxRainfallMonth = monthlyTotals.reduce((max, current) =>
            (current.totalRainfall > max.totalRainfall) ? current : max, { totalRainfall: 0 });

        // Only add label if there's significant rainfall
        if (maxRainfallMonth.totalRainfall > 0.1) {
            // Find the maximum daily rainfall in this month
            const maxDailyRainfall = maxRainfallMonth.data.reduce((max, current) =>
                (current.rainfall > max.rainfall) ? current : max, { rainfall: 0 });

            if (maxDailyRainfall.rainfall > 0.1) {
                // Add label for max rainfall point
                this.chart.append('text')
                    .attr('class', 'max-label')
                    .attr('x', this.xScale(maxRainfallMonth.dayOfYear) + 2 + boxWidth/2)
                    .attr('y', this.yScale(maxDailyRainfall.rainfall) - 10)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .attr('font-weight', 'bold')
                    .attr('fill', '#e74c3c')
                    .text(`Max: ${typeof maxDailyRainfall.rainfall === 'number' ? maxDailyRainfall.rainfall.toFixed(1) : '0.0'}mm`);
            }
        }
    }

    /**
     * Update chart interpretation
     * @param {string} station - The station name
     * @param {Array} dailyStats - The daily statistics data
     * @param {Array} currentYearData - The current year data
     */
    updateChartInterpretation(station, dailyStats, currentYearData) {
        try {
            // Get the chart summary element
            const chartSummary = document.getElementById('rainfall-boxplot-chart-summary');
            if (!chartSummary) return;

            // Calculate statistics for current year data
            let totalRainfall = 0;
            let maxRainfall = 0;
            let maxRainfallDate = '';
            let rainyDays = 0;
            let validDataCount = 0;

            // Ensure currentYearData is an array
            const currentYearDataArray = Array.isArray(currentYearData) ? currentYearData : [];

            // Calculate historical statistics
            let historicalMaxRainfall = 0;
            let historicalMaxRainfallDate = '';
            let historicalTotalRainfall = 0;
            let historicalRainyDays = 0;

            // Process historical data
            if (dailyStats && dailyStats.length > 0) {
                try {
                    // Find maximum rainfall
                    const maxRainfallStat = dailyStats.reduce((max, current) => {
                        if (current.rainfallMax > max.rainfallMax) {
                            return current;
                        }
                        return max;
                    }, { rainfallMax: 0 });

                    historicalMaxRainfall = maxRainfallStat.rainfallMax || 0;

                    // Format the date for max rainfall
                    if (maxRainfallStat.rainfallMaxYear && maxRainfallStat.month && maxRainfallStat.day) {
                        historicalMaxRainfallDate = `${maxRainfallStat.day}/${maxRainfallStat.month}/${maxRainfallStat.rainfallMaxYear}`;
                    }

                    // Calculate total rainfall (average per day * days in period)
                    historicalTotalRainfall = dailyStats.reduce((sum, day) => sum + (day.rainfallMean || 0), 0);

                    // Count rainy days (days with average rainfall > 0.1mm)
                    historicalRainyDays = dailyStats.filter(day =>
                        typeof day.rainfallMean === 'number' && !isNaN(day.rainfallMean) && day.rainfallMean > 0.1
                    ).length;
                } catch (e) {
                    console.error('Error calculating historical rainfall statistics:', e);
                }
            }

            // Process current year data
            if (currentYearDataArray.length > 0) {
                try {
                    // Count valid data points
                    validDataCount = currentYearDataArray.filter(day =>
                        day.Rainfall !== undefined && day.Rainfall !== null && !isNaN(day.Rainfall)
                    ).length;

                    if (validDataCount > 0) {
                        // Calculate total rainfall
                        totalRainfall = currentYearDataArray.reduce((sum, day) => {
                            if (day.Rainfall !== undefined && day.Rainfall !== null && !isNaN(day.Rainfall)) {
                                return sum + day.Rainfall;
                            }
                            return sum;
                        }, 0);

                        // Find maximum rainfall
                        const maxRainfallDay = currentYearDataArray.reduce((max, current) => {
                            if (current.Rainfall !== undefined && current.Rainfall !== null && !isNaN(current.Rainfall) && current.Rainfall > max.Rainfall) {
                                return current;
                            }
                            return max;
                        }, { Rainfall: 0 });

                        maxRainfall = maxRainfallDay.Rainfall;

                        // Format the date for max rainfall
                        if (maxRainfallDay.Day && maxRainfallDay.Month && maxRainfallDay.Year) {
                            maxRainfallDate = `${maxRainfallDay.Day}/${maxRainfallDay.Month}/${maxRainfallDay.Year}`;
                        }

                        // Count rainy days (days with rainfall > 0.1mm)
                        rainyDays = currentYearDataArray.filter(day =>
                            typeof day.Rainfall === 'number' && !isNaN(day.Rainfall) && day.Rainfall > 0.1
                        ).length;
                    }
                } catch (e) {
                    console.error('Error calculating current year rainfall statistics:', e);
                }
            }

            // Format values for display - ensure they are numbers first
            const totalRainfallFormatted = typeof totalRainfall === 'number' ? totalRainfall.toFixed(1) : '0.0';
            const maxRainfallFormatted = typeof maxRainfall === 'number' ? maxRainfall.toFixed(1) : '0.0';
            const historicalTotalRainfallFormatted = typeof historicalTotalRainfall === 'number' ? historicalTotalRainfall.toFixed(1) : '0.0';
            const historicalMaxRainfallFormatted = typeof historicalMaxRainfall === 'number' ? historicalMaxRainfall.toFixed(1) : '0.0';

            // Get month name if a specific month is selected
            let periodText = 'the selected period';
            if (this.currentMonth !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                periodText = monthNames[parseInt(this.currentMonth) - 1];
            }

            // Create interpretation text
            let interpretationText = '';

            if (validDataCount > 0) {
                interpretationText = `For ${station} during ${periodText}, the total rainfall was ${totalRainfallFormatted}mm with ${rainyDays} rainy days. `;

                if (maxRainfall > 0) {
                    interpretationText += `The highest daily rainfall was ${maxRainfallFormatted}mm on ${maxRainfallDate}. `;
                }

                if (historicalTotalRainfall > 0) {
                    const difference = totalRainfall - historicalTotalRainfall;
                    const percentDifference = (difference / historicalTotalRainfall * 100).toFixed(1);

                    if (difference > 0) {
                        interpretationText += `This is ${percentDifference}% more than the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    } else if (difference < 0) {
                        interpretationText += `This is ${Math.abs(percentDifference)}% less than the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    } else {
                        interpretationText += `This matches the historical average of ${historicalTotalRainfallFormatted}mm.`;
                    }
                }
            } else {
                interpretationText = `No rainfall data available for ${station} during ${periodText}.`;
            }

            // Update the chart summary
            chartSummary.textContent = interpretationText;

            // Update extremes table
            const historicalRow = document.getElementById('rainfall-boxplot-historical-extremes');
            const currentYearRow = document.getElementById('rainfall-boxplot-current-year-extremes');

            if (historicalRow) {
                historicalRow.innerHTML = `
                    <td>Historical</td>
                    <td>${historicalMaxRainfallFormatted}mm</td>
                    <td>${historicalMaxRainfallDate || '--'}</td>
                    <td>${historicalRainyDays}</td>
                    <td>${historicalTotalRainfallFormatted}mm</td>
                `;
            }

            if (currentYearRow) {
                if (validDataCount > 0) {
                    currentYearRow.innerHTML = `
                        <td>Current Year</td>
                        <td>${maxRainfallFormatted}mm</td>
                        <td>${maxRainfallDate || '--'}</td>
                        <td>${rainyDays}</td>
                        <td>${totalRainfallFormatted}mm</td>
                    `;
                } else {
                    currentYearRow.innerHTML = `
                        <td>Current Year</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                        <td>--</td>
                    `;
                }
            }
        } catch (error) {
            console.error('Error updating rainfall boxplot chart interpretation:', error);
        }
    }

    /**
     * Download statistics data as CSV
     */
    downloadStats() {
        if (!this.currentData || !this.currentData.dailyStats) {
            console.error('No data available for download');
            return;
        }

        const station = this.currentData.stationName || 'Station';
        const filename = `${station}_Rainfall_Statistics.csv`;

        // Create CSV content
        let csvContent = 'Day,Month,DayOfYear,RainfallMean,RainfallMax,RainfallMaxYear,RainfallMin,RainfallMinYear\n';

        this.currentData.dailyStats.forEach(stat => {
            csvContent += `${stat.day},${stat.month},${stat.dayOfYear},${stat.rainfallMean || ''},${stat.rainfallMax || ''},${stat.rainfallMaxYear || ''},${stat.rainfallMin || ''},${stat.rainfallMinYear || ''}\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download current year data as CSV
     */
    downloadCurrentYear() {
        if (!this.currentData || !this.currentData.currentYearData) {
            console.error('No current year data available for download');
            return;
        }

        const station = this.currentData.stationName || 'Station';
        const filename = `${station}_Current_Year_Rainfall.csv`;

        // Create CSV content
        let csvContent = 'Day,Month,Year,DayOfYear,Rainfall\n';

        this.currentData.currentYearData.forEach(day => {
            if (day.Rainfall !== undefined) {
                csvContent += `${day.Day},${day.Month},${day.Year},${day.dayOfYear},${day.Rainfall}\n`;
            }
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Get the historical year range for the legend
     * @returns {string} - The historical year range (e.g., "1990-2020")
     */
    getHistoricalYearRange() {
        if (this.currentData && this.currentData.yearRange) {
            return this.currentData.yearRange;
        }
        return "Historical";
    }

    /**
     * Download the chart as a PNG image with legend
     */
    downloadChart() {
        try {


            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : 'station';

            // Get the SVG element
            const svgElement = this.svg.node();
            if (!svgElement) {
                console.error('SVG element not found');
                return;
            }

            // Create a temporary SVG element for the download
            const tempSvg = svgElement.cloneNode(true);

            // Get the dimensions of the original SVG
            const svgStyle = window.getComputedStyle(svgElement);
            const width = parseFloat(svgStyle.width);
            const height = parseFloat(svgStyle.height) + 40; // Add extra height for the legend

            // Set the dimensions of the temporary SVG
            tempSvg.setAttribute('width', width);
            tempSvg.setAttribute('height', height);
            tempSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Add a legend directly to the SVG
            const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            legendGroup.setAttribute('transform', `translate(${this.margin.left + 20}, ${height - 40})`);

            // Create legend items
            const legendItems = [
                { color: '#8c96c6', text: 'Historical Distribution' },
                { color: '#0066cc', text: 'Current Year' },
                { color: '#e74c3c', text: 'Maximum Rainfall' }
            ];

            let xOffset = 0;
            legendItems.forEach(item => {
                // Create rect
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', xOffset);
                rect.setAttribute('y', 0);
                rect.setAttribute('width', 15);
                rect.setAttribute('height', 15);
                rect.setAttribute('fill', item.color);
                legendGroup.appendChild(rect);

                // Create text
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xOffset + 20);
                text.setAttribute('y', 12);
                text.setAttribute('font-size', '12px');
                text.textContent = item.text;
                legendGroup.appendChild(text);

                xOffset += 150; // Space between legend items
            });

            tempSvg.appendChild(legendGroup);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(tempSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create image element
            const img = new Image();
            img.onload = function() {
                // Draw the SVG on the canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                // Convert canvas to PNG
                const pngUrl = canvas.toDataURL('image/png');

                // Create a link element
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `${station}_rainfall_boxplot_chart.png`;

                // Append the link to the document
                document.body.appendChild(link);

                // Click the link
                link.click();

                // Remove the link
                document.body.removeChild(link);

                // Revoke the URL
                URL.revokeObjectURL(url);


            };

            // Handle errors
            img.onerror = function(error) {
                console.error('Error loading SVG image for download:', error);
                alert('Error downloading chart. Please check the console for details.');
            };

            // Set the image source to the SVG URL
            img.src = url;
        } catch (error) {
            console.error('Error downloading Rainfall Boxplot chart:', error);
            alert('Error downloading chart. Please check the console for details.');
        }
    }
}