/**
 * Chart Visualization for Temperature Minimum Observation Chart
 * This script handles creating and updating the D3.js chart for Tmin data
 */

class TminChartVisualizerNew {
    constructor(containerId) {
        console.log('TminChartVisualizerNew constructor called with containerId:', containerId);

        this.containerId = containerId;
        this.container = d3.select(`#${containerId}`);
        this.margin = { top: 40, right: 80, bottom: 60, left: 80 };
        this.width = 0;
        this.height = 0;
        this.svg = null;
        this.chart = null;
        this.xScale = null;
        this.yScale = null;
        this.xAxis = null;
        this.yAxis = null;
        this.tooltip = null;
        this.currentMonth = 'all';
        this.currentData = null;

        // Initialize the chart
        this.initChart();

        // Handle window resize
        window.addEventListener('resize', this.resize.bind(this));

        console.log('TminChartVisualizerNew initialized with setMonth method:', typeof this.setMonth === 'function');
    }

    /**
     * Initialize the chart
     */
    initChart() {
        try {
            // Check if container exists
            const containerNode = this.container.node();
            if (!containerNode) {
                console.error(`Container with ID "${this.containerId}" not found in the DOM`);
                return;
            }

            // Get container dimensions
            const containerRect = containerNode.getBoundingClientRect();
            this.width = Math.max(containerRect.width - this.margin.left - this.margin.right, 300);

            // Adjust height for mobile devices
            const isMobile = window.innerWidth <= 768;
            this.height = (isMobile ? 350 : 500) - this.margin.top - this.margin.bottom;

            // Create SVG element
            this.svg = this.container.append('svg')
                .attr('width', this.width + this.margin.left + this.margin.right)
                .attr('height', this.height + this.margin.top + this.margin.bottom);

            // Create chart group
            this.chart = this.svg.append('g')
                .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

            // Create scales
            this.xScale = d3.scaleLinear()
                .range([0, this.width]);

            this.yScale = d3.scaleLinear()
                .range([this.height, 0]);

            // Create axes with thicker lines (matching Tmean chart)
            this.xAxis = this.chart.append('g')
                .attr('class', 'x axis')
                .attr('transform', `translate(0, ${this.height})`)
                .style('stroke-width', '1.5px'); // Make axis lines thicker

            this.yAxis = this.chart.append('g')
                .attr('class', 'y axis')
                .style('stroke-width', '1.5px'); // Make axis lines thicker

            // Add axis labels
            this.svg.append('text')
                .attr('class', 'x-axis-label')
                .attr('text-anchor', 'middle')
                .attr('x', this.margin.left + this.width / 2)
                .attr('y', this.height + this.margin.top + 50)
                .text('Day');

            // Add chart title (matching Tmean chart)
            this.chartTitle = this.svg.append('text')
                .attr('class', 'chart-title')
                .attr('text-anchor', 'middle')
                .attr('x', this.margin.left + this.width / 2)
                .attr('y', this.margin.top / 2)
                .text('Minimum Temperature Observation - Station');

            // Add y-axis label with proper positioning (matching Tmean chart)
            this.svg.append('text')
                .attr('class', 'y-axis-label')
                .attr('text-anchor', 'middle')
                .attr('transform', `translate(${this.margin.left / 3}, ${this.margin.top + this.height / 2}) rotate(-90)`)
                .text('Minimum Temperature (°C)');

            // Create tooltip
            this.tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            // Update legend labels with year range
            this.updateLegendLabels();
        } catch (error) {
            console.error('Error initializing Tmin chart:', error);
        }
    }

    /**
     * Resize the chart when window size changes
     */
    resize() {
        try {
            // Check if container exists
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

            // Check if SVG exists
            if (!this.svg || !this.xScale) {
                console.error('Chart not properly initialized');
                return;
            }

            // Update SVG dimensions
            this.svg
                .attr('width', this.width + this.margin.left + this.margin.right)
                .attr('height', this.height + this.margin.top + this.margin.bottom);

            // Update scales
            this.xScale.range([0, this.width]);
            this.yScale.range([this.height, 0]);

            // Update axis labels
            this.svg.select('.x-axis-label')
                .attr('x', this.margin.left + this.width / 2)
                .attr('y', this.height + this.margin.top + 50);

            // Redraw chart if data exists
            if (this.currentData) {
                this.updateChart(this.currentData);
            }
        } catch (error) {
            console.error('Error resizing Tmin chart:', error);
        }
    }

    /**
     * Set current month filter
     * @param {string} month - The month to filter by
     */
    setMonth(month) {
        console.log('TminChartVisualizerNew.setMonth called with month:', month);
        this.currentMonth = month;

        // If we have data, update the chart with the new month filter
        if (this.currentData) {
            this.updateChart(this.currentData);
        }
    }

    /**
     * Check raw data for years (for debugging)
     */
    checkRawDataYears() {
        try {
            if (!this.currentData) return;

            // Get the current station
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : 'unknown';

            console.log(`Checking raw data years for station: ${station}`);

            // Check raw data for years
            const years = new Set();

            // Check current year data
            if (this.currentData.currentYearData && this.currentData.currentYearData.length > 0) {

                // Extract all years
                this.currentData.currentYearData.forEach(record => {
                    if (record.Year && !isNaN(parseInt(record.Year))) {
                        years.add(parseInt(record.Year));
                    }
                });
            }

            // Check historical data
            if (this.currentData.historicalData && this.currentData.historicalData.length > 0) {
                console.log(`Historical data length: ${this.currentData.historicalData.length}`);

                // Sample a few records
                const sampleSize = Math.min(5, this.currentData.historicalData.length);
                console.log(`Sample of historical data:`,
                    this.currentData.historicalData.slice(0, sampleSize));

                // Extract all years
                this.currentData.historicalData.forEach(record => {
                    if (record.Year && !isNaN(parseInt(record.Year))) {
                        years.add(parseInt(record.Year));
                    }
                });
            }

            // Check daily stats
            if (this.currentData.dailyStats && this.currentData.dailyStats.length > 0) {
                console.log(`Daily stats length: ${this.currentData.dailyStats.length}`);

                // Sample a few records
                const sampleSize = Math.min(5, this.currentData.dailyStats.length);
                console.log(`Sample of daily stats:`,
                    this.currentData.dailyStats.slice(0, sampleSize));
            }

            console.log(`All years found in raw data: ${JSON.stringify([...years].sort())}`);

            // Check for raw data properties
            console.log(`Raw data properties:`, Object.keys(this.currentData));

            // If we have raw data, check it directly
            if (this.currentData.rawData) {
                console.log(`Raw data available, checking years...`);
                const rawYears = new Set();

                // Extract years from raw data
                Object.values(this.currentData.rawData).forEach(yearData => {
                    if (Array.isArray(yearData)) {
                        yearData.forEach(record => {
                            if (record.Year && !isNaN(parseInt(record.Year))) {
                                rawYears.add(parseInt(record.Year));
                            }
                        });
                    }
                });

                console.log(`Years found in raw data: ${JSON.stringify([...rawYears].sort())}`);
            }
        } catch (error) {
            console.error('Error checking raw data years:', error);
        }
    }

    /**
     * Update the chart title with station name and month
     */
    updateChartTitle() {
        try {
            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : '';

            // Get the current month from the UI
            const monthSelect = document.getElementById('month');
            const monthValue = monthSelect ? monthSelect.value : 'all';

            // Format month name
            let monthName = 'All Months';
            if (monthValue !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                monthName = monthNames[parseInt(monthValue) - 1];
            }

            // Update the chart title
            // First, remove any existing title
            this.chart.selectAll('.chart-title').remove();
            this.svg.selectAll('.chart-title').remove(); // Remove any title in the SVG too

            // Create title text (matching Tmean chart format)
            let titleText = `Minimum Temperature Observation - ${station}`;

            // Add month if filtered
            if (monthValue !== 'all') {
                titleText += ` (${monthName})`;
            }

            // Update the chart title (using the chartTitle element like in Tmean chart)
            this.chartTitle.text(titleText);

            // Keep the section title generic
            const sectionTitle = document.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.textContent = 'Temperature Minimum Charts';
            }

            // Update the legend labels with year range
            this.updateLegendLabels();

            // Update the chart interpretation
            this.updateChartInterpretation(station, this.currentData.dailyStats, this.currentData.currentYearData);
        } catch (error) {
            console.error('Error updating chart title:', error);
        }
    }

    /**
     * Update legend labels with year range
     */
    updateLegendLabels() {
        try {
            // Determine the actual year range from the data
            let startYear = 1996; // Default start year
            let endYear = new Date().getFullYear() - 1; // Default end year (last year)

            // If we have data, try to determine the actual range
            if (this.currentData && this.currentData.dailyStats && this.currentData.dailyStats.length > 0) {
                // Look for min/max years in the data
                const stats = this.currentData.dailyStats;

                // Find years from tminMaxYear and tminMinYear properties
                const years = [];

                // Get the current station for logging
                const stationSelect = document.getElementById('station');
                const station = stationSelect ? stationSelect.value : 'unknown';

                console.log(`Determining year range for station: ${station}`);

                // Also check for Year property in the data itself
                const allYears = new Set();

                // First, check if we have currentYearData with Year property
                if (this.currentData.currentYearData && this.currentData.currentYearData.length > 0) {
                    this.currentData.currentYearData.forEach(record => {
                        if (record.Year && !isNaN(parseInt(record.Year))) {
                            const year = parseInt(record.Year);
                            allYears.add(year);
                        }
                    });
                }

                // Then check the dailyStats for year information
                stats.forEach(stat => {
                    // Check for explicit year properties
                    if (stat.tminMaxYear && !isNaN(parseInt(stat.tminMaxYear))) {
                        const year = parseInt(stat.tminMaxYear);
                        years.push(year);
                        allYears.add(year);
                    }
                    if (stat.tminMinYear && !isNaN(parseInt(stat.tminMinYear))) {
                        const year = parseInt(stat.tminMinYear);
                        years.push(year);
                        allYears.add(year);
                    }
                    // Also check regular maxYear and minYear properties
                    if (stat.maxYear && !isNaN(parseInt(stat.maxYear))) {
                        const year = parseInt(stat.maxYear);
                        years.push(year);
                        allYears.add(year);
                    }
                    if (stat.minYear && !isNaN(parseInt(stat.minYear))) {
                        const year = parseInt(stat.minYear);
                        years.push(year);
                        allYears.add(year);
                    }

                    // Check for Year property directly
                    if (stat.Year && !isNaN(parseInt(stat.Year))) {
                        const year = parseInt(stat.Year);
                        allYears.add(year);
                    }
                });

                console.log(`Years found in explicit year properties: ${JSON.stringify([...years])}`);
                console.log(`All years found in data: ${JSON.stringify([...allYears])}`);

                // If we found years, determine the range
                if (years.length > 0) {
                    startYear = Math.min(...years);
                    // For end year, use either the max year from data or last year, whichever is more recent
                    const maxDataYear = Math.max(...years);
                    endYear = Math.max(maxDataYear, endYear);
                    console.log(`Year range from explicit properties: ${startYear}-${endYear}`);
                }

                // If we have additional years from the data itself, consider those too
                if (allYears.size > 0) {
                    const minDataYear = Math.min(...allYears);
                    const maxDataYear = Math.max(...allYears);

                    // Update start and end years if the data shows a wider range
                    startYear = Math.min(startYear, minDataYear);
                    endYear = Math.max(endYear, maxDataYear);

                    console.log(`Final year range after considering all data: ${startYear}-${endYear}`);
                }
            }

            // Check if we have raw data available
            if (this.currentData && this.currentData.rawData) {
                console.log('Checking raw data for year range...');
                const rawYears = new Set();

                // Extract years from raw data
                if (typeof this.currentData.rawData === 'object' && !Array.isArray(this.currentData.rawData)) {
                    // If rawData is an object with years as keys
                    Object.keys(this.currentData.rawData).forEach(year => {
                        if (!isNaN(parseInt(year))) {
                            rawYears.add(parseInt(year));
                        }
                    });

                    if (rawYears.size > 0) {
                        startYear = Math.min(...rawYears);
                        endYear = Math.max(...rawYears);
                        console.log(`Year range from raw data object keys: ${startYear}-${endYear}`);
                    }
                }
            }

            // Get the current station for special handling
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : '';

            // For all stations, use a fixed year range from 1996 to current year
            // This is the simplest and most reliable approach
            const currentYear = new Date().getFullYear();

            // Always use the full range from 1996 to current year (not future years)
            startYear = 1996;
            endYear = Math.min(currentYear, 2024); // Ensure we don't go beyond 2024

            // Log the final year range
            console.log(`Using year range for ${station}: ${startYear}-${endYear}`);


            // Format the year range
            const yearRange = `${startYear}-${endYear}`;
            console.log(`Final year range for ${station}: ${yearRange}`);

            // Update the legend labels with the determined year range
            const meanLabel = document.getElementById('tmin-historical-mean-label');
            const maxLabel = document.getElementById('tmin-historical-max-label');
            const minLabel = document.getElementById('tmin-historical-min-label');

            if (meanLabel) meanLabel.textContent = `${yearRange} Mean`;
            if (maxLabel) maxLabel.textContent = `${yearRange} Max`;
            if (minLabel) minLabel.textContent = `${yearRange} Min`;

            // Store the year range for use in other methods
            this.historicalYearRange = yearRange;
        } catch (error) {
            console.error('Error updating legend labels:', error);
            // Use default range if there's an error
            const defaultRange = '1996-2024';
            const meanLabel = document.getElementById('tmin-historical-mean-label');
            const maxLabel = document.getElementById('tmin-historical-max-label');
            const minLabel = document.getElementById('tmin-historical-min-label');

            if (meanLabel) meanLabel.textContent = `${defaultRange} Mean`;
            if (maxLabel) maxLabel.textContent = `${defaultRange} Max`;
            if (minLabel) minLabel.textContent = `${defaultRange} Min`;

            this.historicalYearRange = defaultRange;
        }
    }

    /**
     * Update the chart interpretation and summary table
     */
    /**
     * Update the chart interpretation text and temperature extremes table
     * @param {Array} historicalData - Historical data
     * @param {Array} currentYearData - Current year data
     * @param {string} station - Selected station
     * @param {string} month - Selected month
     */
    updateChartInterpretation(station, dailyStats, currentYearData) {
        try {
            // Calculate statistics for historical data
            let historicalMean = 0;
            let historicalMax = -Infinity;
            let historicalMaxDate = '';
            let historicalMin = Infinity;
            let historicalMinDate = '';
            let historicalYearRange = '';
            let validHistoricalDataCount = 0;

            // Initialize current year variables
            let currentYearMean = 0;
            let currentYearMax = -Infinity;
            let currentYearMaxDate = '';
            let currentYearMin = Infinity;
            let currentYearMinDate = '';
            let validCurrentYearDataCount = 0;

            if (dailyStats && dailyStats.length > 0) {
                // Calculate mean - only count valid values
                let meanSum = 0;
                dailyStats.forEach(stat => {
                    if (stat.tminMean !== undefined && !isNaN(stat.tminMean)) {
                        meanSum += stat.tminMean;
                        validHistoricalDataCount++;
                    }
                });

                historicalMean = validHistoricalDataCount > 0 ? meanSum / validHistoricalDataCount : 0;

                // Find max and min
                dailyStats.forEach(stat => {
                    // Use tminMax if available
                    if (stat.tminMax !== undefined && !isNaN(stat.tminMax)) {
                        const maxValue = stat.tminMax;
                        const maxYear = stat.tminMaxYear !== undefined ? stat.tminMaxYear : '';

                        if (maxValue > historicalMax) {
                            historicalMax = maxValue;
                            historicalMaxDate = `${stat.month}/${stat.day}/${maxYear}`;
                        }
                    }

                    // Use tminMin if available
                    if (stat.tminMin !== undefined && !isNaN(stat.tminMin)) {
                        const minValue = stat.tminMin;
                        const minYear = stat.tminMinYear !== undefined ? stat.tminMinYear : '';

                        if (minValue < historicalMin) {
                            historicalMin = minValue;
                            historicalMinDate = `${stat.month}/${stat.day}/${minYear}`;
                        }
                    }
                });

                // Get year range from the data
                const years = new Set();
                dailyStats.forEach(stat => {
                    if (stat.tminMaxYear && !isNaN(parseInt(stat.tminMaxYear))) {
                        years.add(parseInt(stat.tminMaxYear));
                    }
                    if (stat.tminMinYear && !isNaN(parseInt(stat.tminMinYear))) {
                        years.add(parseInt(stat.tminMinYear));
                    }
                    if (stat.maxYear && !isNaN(parseInt(stat.maxYear))) {
                        years.add(parseInt(stat.maxYear));
                    }
                    if (stat.minYear && !isNaN(parseInt(stat.minYear))) {
                        years.add(parseInt(stat.minYear));
                    }
                });

                if (years.size > 0) {
                    const yearArray = Array.from(years).sort();
                    const minYear = yearArray[0];
                    const maxYear = yearArray[yearArray.length - 1];
                    historicalYearRange = `${minYear}-${maxYear}`;
                    this.historicalYearRange = historicalYearRange;
                }
            }

            // Calculate statistics for current year data
            if (currentYearData && currentYearData.length > 0) {
                const validTmin = currentYearData.filter(d => d && d.tmin !== undefined && !isNaN(d.tmin));
                validCurrentYearDataCount = validTmin.length;

                if (validTmin.length > 0) {
                    // Calculate mean
                    const sum = validTmin.reduce((acc, d) => acc + d.tmin, 0);
                    currentYearMean = sum / validTmin.length;

                    // Find max and min
                    validTmin.forEach(d => {
                        if (d.tmin > currentYearMax) {
                            currentYearMax = d.tmin;
                            currentYearMaxDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                        }
                        if (d.tmin < currentYearMin) {
                            currentYearMin = d.tmin;
                            currentYearMinDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                        }
                    });
                }
            }

            // Update the temperature extremes table with all required parameters
            this.updateTemperatureExtremesTable(
                dailyStats,
                currentYearData,
                historicalMax,
                historicalMin,
                historicalMean,
                currentYearMax,
                currentYearMin,
                currentYearMean,
                historicalMaxDate,
                historicalMinDate,
                currentYearMaxDate,
                currentYearMinDate
            );

            const chartSummary = document.getElementById('tmin-chart-summary');
            if (!chartSummary) return;

            // Safety check for data
            if (!dailyStats || !currentYearData) {
                console.warn('Missing data for Tmin chart interpretation');
                chartSummary.textContent = 'Waiting for data to load...';
                return;
            }

            // Ensure currentYearData is an array
            const currentYearDataArray = Array.isArray(currentYearData) ? currentYearData : [];

            if (dailyStats.length === 0 || currentYearDataArray.length === 0) {
                chartSummary.textContent = 'Insufficient data to generate interpretation. No data available from Google Sheets.';
                return;
            }

            // Get month name if applicable
            let periodText = 'the selected period';
            if (this.currentMonth !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                periodText = monthNames[parseInt(this.currentMonth) - 1];
            }

            // Compare current year with historical data
            let tempDiff = 0;
            let tempDiffText = 'data still loading';

            if (currentYearMean !== 0 && historicalMean !== 0) {
                tempDiff = currentYearMean - historicalMean;
                tempDiffText = tempDiff > 0
                    ? `${tempDiff.toFixed(1)}°C warmer`
                    : `${Math.abs(tempDiff).toFixed(1)}°C cooler`;
            }

            // Create interpretation text
            let interpretationText = '';

            if (currentYearMean !== 0 && historicalMean !== 0) {
                interpretationText = `For ${station} during ${periodText}, the average minimum temperature was ${currentYearMean.toFixed(1)}°C, which is ${tempDiffText} than the ${historicalYearRange} average of ${historicalMean.toFixed(1)}°C. `;
            } else {
                interpretationText = `For ${station} during ${periodText}, temperature data is being loaded. `;
            }

            // Add information about max and min temperatures
            if (currentYearMax !== -Infinity) {
                interpretationText += `The highest minimum temperature recorded was ${currentYearMax.toFixed(1)}°C on ${currentYearMaxDate}. `;
            }

            if (currentYearMin !== Infinity) {
                interpretationText += `The lowest minimum temperature recorded was ${currentYearMin.toFixed(1)}°C on ${currentYearMinDate}.`;
            }

            chartSummary.textContent = interpretationText;

            // Update historical labels with year range
            if (historicalYearRange) {
                const meanLabel = document.getElementById('tmin-historical-mean-label');
                const maxLabel = document.getElementById('tmin-historical-max-label');
                const minLabel = document.getElementById('tmin-historical-min-label');

                if (meanLabel) meanLabel.textContent = `${historicalYearRange} Average`;
                if (maxLabel) maxLabel.textContent = `${historicalYearRange} Max`;
                if (minLabel) minLabel.textContent = `${historicalYearRange} Min`;
            }
        } catch (error) {
            console.error('Error updating Tmin chart interpretation:', error);
            const summaryElement = document.getElementById('tmin-chart-summary');
            if (summaryElement) {
                summaryElement.textContent = `Data loaded for ${station || 'selected station'}. Select a station and month to view details.`;
            }
        }
    }

    /**
     * Update the temperature extremes table
     * @param {Array} historicalData - Historical data
     * @param {Array} currentYearData - Current year data
     * @param {number} historicalMax - Historical maximum temperature
     * @param {number} historicalMin - Historical minimum temperature
     * @param {number} historicalAvg - Historical average temperature
     * @param {number} currentMax - Current year maximum temperature
     * @param {number} currentMin - Current year minimum temperature
     * @param {number} currentAvg - Current year average temperature
     * @param {string} historicalMaxDate - Date of historical maximum temperature
     * @param {string} historicalMinDate - Date of historical minimum temperature
     * @param {string} currentYearMaxDate - Date of current year maximum temperature
     * @param {string} currentYearMinDate - Date of current year minimum temperature
     */
    updateTemperatureExtremesTable(dailyStats, currentYearData, historicalMax, historicalMin, historicalMean, currentYearMax, currentYearMin, currentYearMean, historicalMaxDate, historicalMinDate, currentYearMaxDate, currentYearMinDate) {
        try {
            const historicalExtremesRow = document.getElementById('tmin-historical-extremes');
            const currentYearExtremesRow = document.getElementById('tmin-current-year-extremes');

            if (historicalExtremesRow) {
                const cells = historicalExtremesRow.querySelectorAll('td');
                if (cells.length >= 6) {
                    cells[0].textContent = 'Historical';
                    cells[1].textContent = historicalMax !== -Infinity ? historicalMax.toFixed(1) + '°C' : '--';
                    cells[2].textContent = historicalMaxDate || '--';
                    cells[3].textContent = historicalMin !== Infinity ? historicalMin.toFixed(1) + '°C' : '--';
                    cells[4].textContent = historicalMinDate || '--';
                    cells[5].textContent = historicalMean !== 0 ? historicalMean.toFixed(1) + '°C' : '--';
                }
            }

            if (currentYearExtremesRow) {
                const cells = currentYearExtremesRow.querySelectorAll('td');
                if (cells.length >= 6) {
                    cells[0].textContent = 'Current Year';
                    cells[1].textContent = currentYearMax !== -Infinity ? currentYearMax.toFixed(1) + '°C' : '--';
                    cells[2].textContent = currentYearMaxDate || '--';
                    cells[3].textContent = currentYearMin !== Infinity ? currentYearMin.toFixed(1) + '°C' : '--';
                    cells[4].textContent = currentYearMinDate || '--';
                    cells[5].textContent = currentYearMean !== 0 ? currentYearMean.toFixed(1) + '°C' : '--';
                }
            }
        } catch (error) {
            console.error('Error updating temperature extremes table:', error);
        }
    }

    /**
     * Update the chart with new data
     * @param {Object} data - The data to visualize
     */
    updateChart(data) {
        console.log('TminChartVisualizerNew.updateChart called with data:', data);

        try {
            // Store the data for later use
            this.currentData = data;

            // Check raw data for years (for debugging)
            this.checkRawDataYears();

            // Update chart title with station name and month
            this.updateChartTitle();

            // Check if chart is properly initialized
            if (!this.chart || !this.xScale || !this.yScale) {
                console.error('Tmin chart not properly initialized');
                return;
            }

            // Check if data is valid
            if (!data) {
                console.error('No data provided to updateChart');
                return;
            }

            const { dailyStats = [], currentYearData = [] } = data || {};

            // Check if we have any data to display
            if ((!dailyStats || dailyStats.length === 0) && (!currentYearData || currentYearData.length === 0)) {
                console.warn('No data available for this station');
                return;
            }

            // Process data for visualization
            const processedDailyStats = this.processDailyStatsForVisualization(dailyStats);
            const processedCurrentYearData = this.processCurrentYearDataForVisualization(currentYearData);

            // Use the current month filter from the class property
            const selectedMonth = this.currentMonth || 'all';
            console.log('Using month filter:', selectedMonth);

            // Filter data by month if needed
            let filteredDailyStats = processedDailyStats;
            let filteredCurrentYearData = processedCurrentYearData;

            if (selectedMonth !== 'all') {
                const monthNum = parseInt(selectedMonth);
                console.log(`Filtering Tmin data for month: ${monthNum}`);

                filteredDailyStats = processedDailyStats.filter(d => d.month === monthNum);
                filteredCurrentYearData = processedCurrentYearData.filter(d => d.Month === monthNum);

                console.log(`Filtered Tmin daily stats: ${filteredDailyStats.length} records`);
                console.log(`Filtered Tmin current year data: ${filteredCurrentYearData.length} records`);
            }

            // Set domain for scales
            const allTemps = [
                ...filteredDailyStats.map(d => d.tminMean !== undefined ? d.tminMean : d.mean),
                ...filteredDailyStats.map(d => d.tminMax !== undefined ? d.tminMax : d.max),
                ...filteredDailyStats.map(d => d.tminMin !== undefined ? d.tminMin : d.min),
                ...filteredCurrentYearData.map(d => d.tmin)
            ].filter(t => t !== null && !isNaN(t));

            if (allTemps.length === 0) {
                console.warn('No valid Tmin temperature data to display');
                return;
            }

            const minTemp = Math.floor(d3.min(allTemps) - 1);
            const maxTemp = Math.ceil(d3.max(allTemps) + 1);

            // Set x-axis domain based on the selected month
            if (selectedMonth === 'all') {
                this.xScale.domain([1, 366]); // Full year
            } else {
                // Find the day range for the selected month
                const monthNum = parseInt(selectedMonth);
                const year = 2020; // Leap year for proper day calculations
                const firstDay = new Date(year, monthNum - 1, 1);
                const lastDay = new Date(year, monthNum, 0);

                const startOfYear = new Date(year, 0, 1);
                const firstDayOfYear = Math.floor((firstDay - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
                const lastDayOfYear = Math.floor((lastDay - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

                this.xScale.domain([firstDayOfYear, lastDayOfYear]);
            }

            this.yScale.domain([minTemp, maxTemp]);

            // Update axes with more styling
            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickFormat(d => {
                    // For monthly view, just show the day number
                    if (selectedMonth !== 'all') {
                        const date = new Date(2020, 0, d); // Using leap year 2020
                        return date.getDate();
                    } else {
                        // For full year view, show month abbreviation
                        const date = new Date(2020, 0, d); // Using leap year 2020
                        return d3.timeFormat('%b')(date);
                    }
                })
                .ticks(selectedMonth === 'all' ? 12 : 15)) // Fewer ticks for better readability
                .selectAll('text')
                .style('text-anchor', window.innerWidth <= 768 ? 'start' : 'middle')
                .style('font-weight', 'bold')
                .style('font-size', window.innerWidth <= 768 ? '10px' : '12px')
                .style('visibility', 'visible')
                // Rotate labels on smaller screens for better readability with horizontal scrolling
                .attr('transform', window.innerWidth <= 768 ? 'rotate(90) translate(10, -10)' : 'rotate(0)');

            this.yAxis.call(d3.axisLeft(this.yScale)
                .tickFormat(d => d) // Remove units from tick labels (matching Tmean chart)
                // Adjust number of ticks based on screen size
                .ticks(window.innerWidth <= 768 ? 5 : 10))
                .selectAll('text')
                .style('font-weight', 'bold')
                .style('font-size', window.innerWidth <= 768 ? '10px' : '12px')
                .style('visibility', 'visible');

            // Add grid lines (matching Tmean chart)
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

            // Clear ALL existing elements to prevent overlapping charts
            this.chart.selectAll('path, circle, .line-mean, .line-max, .line-min, .line-tminMean, .line-tminMax, .line-tminMin, .std-area, .current-year-line, .current-year-point').remove();

            // Draw mean line if we have daily stats
            if (filteredDailyStats.length > 0) {
                // Check if we have tminMean data
                if (filteredDailyStats.some(d => 'tminMean' in d)) {
                    console.log('Using tminMean, tminMax, tminMin properties');
                    // Use cooler colors for minimum temperature
                    this.drawLine(filteredDailyStats, 'tminMean', '#0077b6', 2);         // Darker blue for mean
                    this.drawLine(filteredDailyStats, 'tminMax', '#48cae4', 1, [1, 2]);  // Light blue for max
                    this.drawLine(filteredDailyStats, 'tminMin', '#03045e', 1, [1, 2]);  // Deep blue for min

                    // Add data points for historical data with hover functionality
                    this.addHistoricalDataPoints(filteredDailyStats);
                } else {
                    console.log('No tminMean data found, using Tmin data directly');
                    // Create a copy of the data with renamed properties
                    const processedData = filteredDailyStats.map(d => {
                        // Check if we have Tmin data
                        if (!('Tmin' in d) && !('tmin' in d)) {
                            return d; // Return original if no Tmin data
                        }

                        // Create a copy with the needed properties
                        return {
                            ...d,
                            tminMean: d.tminMean || d.Tmin || d.tmin,
                            tminMax: d.tminMax || d.Tmin || d.tmin,
                            tminMin: d.tminMin || d.Tmin || d.tmin
                        };
                    });

                    // Use cooler colors for minimum temperature
                    this.drawLine(processedData, 'tminMean', '#0077b6', 2);         // Darker blue for mean
                    this.drawLine(processedData, 'tminMax', '#48cae4', 1, [1, 2]);  // Light blue for max
                    this.drawLine(processedData, 'tminMin', '#03045e', 1, [1, 2]);  // Deep blue for min

                    // Add data points for historical data with hover functionality
                    this.addHistoricalDataPoints(processedData);
                }
            }

            // Draw current year data if we have it
            if (filteredCurrentYearData.length > 0) {
                this.drawCurrentYearPoints(filteredCurrentYearData);
            }

            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : '';

            // Format month name
            let monthName = 'All Months';
            if (selectedMonth !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                monthName = monthNames[parseInt(selectedMonth) - 1];
            }

            // Update chart interpretation with the filtered data
            this.updateChartInterpretation(station, filteredDailyStats, filteredCurrentYearData);

            console.log('TminChartVisualizerNew chart updated successfully');
        } catch (error) {
            console.error('Error updating Tmin chart:', error);
        }
    }

    /**
     * Process daily statistics for visualization
     * @param {Array} dailyStats - Daily statistics data
     * @returns {Array} - Processed data for visualization
     */
    processDailyStatsForVisualization(dailyStats) {
        return dailyStats.map((stat, index) => {
            if (!stat.month || !stat.day) return null;

            // Use existing dayOfYear if available, otherwise calculate it
            let dayOfYear;
            if (stat.dayOfYear !== undefined) {
                dayOfYear = stat.dayOfYear;
            } else {
                // Calculate day of year
                const date = new Date(2020, stat.month - 1, stat.day); // Using leap year 2020
                const startOfYear = new Date(2020, 0, 1);
                dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
            }

            return {
                ...stat,
                dayOfYear: dayOfYear
            };
        }).filter(d => d !== null);
    }

    /**
     * Process current year data for visualization
     * @param {Array} currentYearData - Current year data
     * @returns {Array} - Processed data for visualization
     */
    processCurrentYearDataForVisualization(currentYearData) {
        return currentYearData.map(record => {
            // Get year, month, day
            const year = parseInt(record.Year || record.year);
            const month = parseInt(record.Month || record.month);
            const day = parseInt(record.Day || record.day);

            if (isNaN(month) || isNaN(day)) return null;

            // Use existing dayOfYear if available, otherwise calculate it
            let dayOfYear;
            if (record.dayOfYear !== undefined) {
                dayOfYear = record.dayOfYear;
            } else {
                // Calculate day of year using leap year 2020 for consistency
                const date = new Date(2020, month - 1, day);
                const startOfYear = new Date(2020, 0, 1);
                dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
            }

            // Get Tmin value - handle zero values properly
            let tminValue;
            if (record.Tmin !== undefined && record.Tmin !== null) {
                tminValue = record.Tmin;
            } else if (record.tmin !== undefined && record.tmin !== null) {
                tminValue = record.tmin;
            } else if (record.TMIN !== undefined && record.TMIN !== null) {
                tminValue = record.TMIN;
            } else {
                return null;
            }

            // Check if it's a valid number (including zero)
            if (isNaN(parseFloat(tminValue))) return null;

            return {
                ...record,
                Year: year,
                Month: month,
                Day: day,
                dayOfYear: dayOfYear,
                tmin: parseFloat(tminValue)
            };
        }).filter(d => d !== null && !isNaN(d.tmin));
    }

    /**
     * Draw a line on the chart
     * @param {Array} data - Data for the line
     * @param {string} valueKey - Key for the y-value
     * @param {string} color - Line color
     * @param {number} width - Line width
     * @param {Array} dashArray - Dash array for the line (optional)
     */
    drawLine(data, valueKey, color, width = 2, dashArray = null) {
        try {
            if (!data || data.length === 0) {
                console.warn(`No data to draw line for ${valueKey}`);
                return;
            }

            // Check if data has the required properties
            const hasRequiredProperties = data.some(d =>
                d &&
                typeof d === 'object' &&
                'dayOfYear' in d &&
                valueKey in d
            );

            if (!hasRequiredProperties) {
                // Check which properties are missing
                const sampleItem = data[0];
                if (sampleItem) {
                    const missingProps = [];
                    if (!('dayOfYear' in sampleItem)) missingProps.push('dayOfYear');
                    if (!(valueKey in sampleItem)) missingProps.push(valueKey);

                    console.warn(`Data does not have required properties for ${valueKey}. Missing: ${missingProps.join(', ')}`);
                    console.log('Sample data item:', sampleItem);
                } else {
                    console.warn(`Data does not have required properties for ${valueKey} (empty data)`);
                }
                return;
            }

            // Filter out data points with null, undefined, or NaN values (but keep zeros)
            const validData = data.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d[valueKey] !== undefined && d[valueKey] !== null && !isNaN(d[valueKey])
            );

            // Log the data for debugging
            console.log(`Valid data for ${valueKey}:`, validData.map(d => ({ day: d.dayOfYear, value: d[valueKey] })));

            if (validData.length === 0) {
                console.warn(`No valid data points for ${valueKey} after filtering`);
                return;
            }

            // Create line generator
            const line = d3.line()
                .x(d => this.xScale(d.dayOfYear))
                .y(d => this.yScale(d[valueKey]))
                .defined(d => d[valueKey] !== null && d[valueKey] !== undefined && !isNaN(d[valueKey]) /* Zero is a valid value */)
                .curve(d3.curveMonotoneX);

            // Draw line
            const path = this.chart.append('path')
                .datum(validData)
                .attr('class', `tmin-${valueKey}-line`)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', width)
                .attr('d', line);

            // Add dash array if provided
            if (dashArray) {
                path.attr('stroke-dasharray', dashArray.join(','));
            }
        } catch (error) {
            console.error(`Error drawing line for ${valueKey}:`, error);
        }
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
            const svgElement = document.querySelector('#tmin-chart svg');
            if (!svgElement) {
                console.error('SVG element not found');
                return;
            }

            // Create a canvas element
            const canvas = document.createElement('canvas');
            const width = this.width + this.margin.left + this.margin.right;
            const legendHeight = 100;
            const height = this.height + this.margin.top + this.margin.bottom + legendHeight;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Set white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);

            // Create a temporary SVG element
            const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            tempSvg.setAttribute('width', width);
            tempSvg.setAttribute('height', height);
            tempSvg.innerHTML = svgElement.innerHTML;

            // Add a style element to ensure proper styling of SVG elements
            const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = `
                .tmin-current-year-line { fill: none; stroke: #be193f; stroke-width: 2; }
                .tmin-mean-line { fill: none; stroke: #0077b6; stroke-width: 2; }
                .tmin-max-line { fill: none; stroke: #48cae4; stroke-width: 1; stroke-dasharray: 1, 2; }
                .tmin-min-line { fill: none; stroke:rgb(99, 102, 244); stroke-width: 1; stroke-dasharray: 1, 2; }
                .tmin-current-year-point { fill: #be193f; stroke: none; }
                .tmin-current-year-point-max { fill: #ff9500; stroke: #000; stroke-width: 1; }
                .tmin-current-year-point-min { fill: #0077b6; stroke: #000; stroke-width: 1; }
                .tmin-std-area { fill: rgba(0, 119, 182, 0.1); }
                .max-label { font-size: 12px; font-weight: bold; fill: #be193f; }
                .min-label { font-size: 12px; font-weight: bold; fill: #0077b6; }
                .axis path, .axis line { stroke: #000; stroke-width: 1.5; shape-rendering: crispEdges; }
                .axis text { font-size: 12px; fill: #666; }
                .grid line { stroke: #ddd; stroke-opacity: 0.7; shape-rendering: crispEdges; }
                .legend-text { font-size: 12px; fill: #666; }
            `;
            tempSvg.appendChild(styleElement);

            // Add legend
            const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const legendY = this.height + this.margin.top + 80;
            legendGroup.setAttribute('transform', `translate(${this.margin.left + 20}, ${legendY})`);

            const legendItems = [
                { color: '#be193f', text: 'Current Year' },
                { color: '#0077b6', text: `${this.historicalYearRange} Mean` },
                { color: '#48cae4', text: `${this.historicalYearRange} Max` },
                { color: '#03045e', text: `${this.historicalYearRange} Min` }
            ];

            let xOffset = 0;
            legendItems.forEach(item => {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', xOffset);
                rect.setAttribute('y', 0);
                rect.setAttribute('width', 15);
                rect.setAttribute('height', 15);
                rect.setAttribute('fill', item.color);
                legendGroup.appendChild(rect);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xOffset + 20);
                text.setAttribute('y', 12);
                text.setAttribute('class', 'legend-text');
                text.textContent = item.text;
                legendGroup.appendChild(text);

                xOffset += 150;
            });

            tempSvg.appendChild(legendGroup);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(tempSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create image element
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `${station}_minimum_temperature_chart.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            img.onerror = function(error) {
                console.error('Error loading SVG image for download:', error);
                alert('Error downloading chart. Please check the console for details.');
            };

            img.src = url;
        } catch (error) {
            console.error('Error downloading Tmin chart:', error);
            alert('Error downloading chart. Please check the console for details.');
        }
    }

    /**
     * Download statistics data as CSV
     */
    downloadStats() {
        try {
            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : 'station';

            // Check if we have data
            if (!this.currentData || !this.currentData.dailyStats || this.currentData.dailyStats.length === 0) {
                console.error('No data available for download');
                alert('No data available for download');
                return;
            }

            // Get the daily stats
            const dailyStats = this.currentData.dailyStats;

            // Create CSV content
            let csvContent = 'Month,Day,Mean Tmin,StdDev,Max Tmin,Max Year,Min Tmin,Min Year,Sample Count\n';

            // Add data rows
            dailyStats.forEach(stat => {
                const row = [
                    stat.month,
                    stat.day,
                    stat.tminMean !== undefined && stat.tminMean !== null ? stat.tminMean.toFixed(2) : '',
                    stat.tminStd !== undefined && stat.tminStd !== null ? stat.tminStd.toFixed(2) : '',
                    stat.tminMax !== undefined && stat.tminMax !== null ? stat.tminMax.toFixed(2) : '',
                    stat.tminMaxYear !== undefined && stat.tminMaxYear !== null ? stat.tminMaxYear : '',
                    stat.tminMin !== undefined && stat.tminMin !== null ? stat.tminMin.toFixed(2) : '',
                    stat.tminMinYear !== undefined && stat.tminMinYear !== null ? stat.tminMinYear : '',
                    stat.sampleCount !== undefined && stat.sampleCount !== null ? stat.sampleCount : ''
                ];
                csvContent += row.join(',') + '\n';
            });

            // Create a Blob with the CSV content
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${station}_tmin_daily_stats.csv`);

            // Append the link to the document
            document.body.appendChild(link);

            // Click the link
            link.click();

            // Remove the link
            document.body.removeChild(link);

            // Revoke the URL
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Tmin stats:', error);
            alert('Error downloading stats. Please check the console for details.');
        }
    }

    /**
     * Download current year data as CSV
     */
    downloadCurrentYear() {
        try {
            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : 'station';

            // Check if we have data
            if (!this.currentData || !this.currentData.currentYearData || this.currentData.currentYearData.length === 0) {
                console.error('No current year data available for download');
                alert('No current year data available for download');
                return;
            }

            // Get the current year data
            const currentYearData = this.currentData.currentYearData;

            // Get all possible keys from the data
            const allKeys = new Set();
            currentYearData.forEach(record => {
                Object.keys(record).forEach(key => allKeys.add(key));
            });

            // Create CSV content
            let csvContent = Array.from(allKeys).join(',') + '\n';

            // Add data rows
            currentYearData.forEach(record => {
                const row = Array.from(allKeys).map(key => {
                    // Return empty string only for undefined or null values, keep zeros
                    if (record[key] === undefined || record[key] === null) return '';
                    return record[key];
                });
                csvContent += row.join(',') + '\n';
            });

            // Create a Blob with the CSV content
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${station}_tmin_current_year_data.csv`);

            // Append the link to the document
            document.body.appendChild(link);

            // Click the link
            link.click();

            // Remove the link
            document.body.removeChild(link);

            // Revoke the URL
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading current year data:', error);
            alert('Error downloading current year data. Please check the console for details.');
        }
    }

    /**
     * Draw current year points and line
     * @param {Array} currentYearData - Current year data
     */
    drawCurrentYearPoints(currentYearData) {
        try {
            if (!currentYearData || currentYearData.length === 0) {
                console.warn('No current year data to draw');
                return;
            }

            // Check if data has the required properties
            const hasRequiredProperties = currentYearData.some(d =>
                d &&
                typeof d === 'object' &&
                'dayOfYear' in d &&
                'tmin' in d
            );

            if (!hasRequiredProperties) {
                console.warn('Data does not have required properties for current year points');
                return;
            }

            // Filter out data points with null, undefined, or NaN values (but keep zeros)
            const validData = currentYearData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.tmin !== undefined && d.tmin !== null && !isNaN(d.tmin)
            );

            if (validData.length === 0) {
                console.warn('No valid data points for current year after filtering');
                return;
            }

            // Sort data by day of year for proper line drawing
            validData.sort((a, b) => a.dayOfYear - b.dayOfYear);

            // Define the color for current year data
            const currentYearColor = '#be193f'; // Red color for current year

            // Find max and min temperature points
            let maxTempPoint = null;
            let minTempPoint = null;

            try {
                // Find points with valid tmin values
                const pointsWithValidTemp = validData.filter(d =>
                    d.tmin !== null && d.tmin !== undefined && !isNaN(d.tmin));

                if (pointsWithValidTemp.length > 0) {
                    maxTempPoint = pointsWithValidTemp.reduce((max, current) =>
                        (current.tmin > max.tmin) ? current : max, pointsWithValidTemp[0]);

                    minTempPoint = pointsWithValidTemp.reduce((min, current) =>
                        (current.tmin < min.tmin) ? current : min, pointsWithValidTemp[0]);
                }
            } catch (error) {
                console.error('Error finding max/min temperature points:', error);
            }

            // Draw line connecting the points
            const line = d3.line()
                .x(d => this.xScale(d.dayOfYear))
                .y(d => this.yScale(d.tmin))
                .defined(d => d.tmin !== null && d.tmin !== undefined && !isNaN(d.tmin))
                .curve(d3.curveMonotoneX);

            this.chart.append('path')
                .datum(validData)
                .attr('class', 'tmin-current-year-line')
                .attr('fill', 'none')
                .attr('stroke', currentYearColor)
                .attr('stroke-width', 2)
                .attr('d', line);

            // Draw points
            this.chart.selectAll('.tmin-current-year-point')
                .data(validData)
                .enter()
                .append('circle')
                .attr('class', d => {
                    if (d === maxTempPoint) return 'tmin-current-year-point tmin-current-year-point-max';
                    if (d === minTempPoint) return 'tmin-current-year-point tmin-current-year-point-min';
                    return 'tmin-current-year-point';
                })
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.tmin))
                .attr('r', d => (d === maxTempPoint || d === minTempPoint) ? 5 : 3)
                .on('mouseover', (event, d) => {
                    // Show tooltip
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);

                    // Format date as MM/DD
                    const formattedDate = `${d.Month}/${d.Day}`;

                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #be193f;"></span>
                            <span class="tooltip-label">Current Year:</span>
                            <span class="tooltip-value">${d.tmin.toFixed(1)} °C</span>
                        </div>
                    `;

                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', () => {
                    // Hide tooltip
                    this.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            // Clear existing max/min labels before adding new ones
            this.chart.selectAll('.max-label, .min-label').remove();

            // Add labels for max and min points
            if (maxTempPoint && maxTempPoint.dayOfYear !== undefined && !isNaN(maxTempPoint.dayOfYear) &&
                maxTempPoint.tmin !== undefined && !isNaN(maxTempPoint.tmin)) {
                this.chart.append('text')
                    .attr('class', 'max-label')
                    .attr('x', this.xScale(maxTempPoint.dayOfYear))
                    .attr('y', this.yScale(maxTempPoint.tmin) - 15)
                    .attr('text-anchor', 'middle')
                    .text(`Max: ${maxTempPoint.tmin.toFixed(1)}°C`);
            }

            if (minTempPoint && minTempPoint.dayOfYear !== undefined && !isNaN(minTempPoint.dayOfYear) &&
                minTempPoint.tmin !== undefined && !isNaN(minTempPoint.tmin)) {
                this.chart.append('text')
                    .attr('class', 'min-label')
                    .attr('x', this.xScale(minTempPoint.dayOfYear))
                    .attr('y', this.yScale(minTempPoint.tmin) + 15)
                    .attr('text-anchor', 'middle')
                    .text(`Min: ${minTempPoint.tmin.toFixed(1)}°C`);
            }
        } catch (error) {
            console.error('Error drawing current year points:', error);
        }
    }

    /**
     * Add data points for historical data with hover functionality
     * @param {Array} historicalData - Historical data
     */
    addHistoricalDataPoints(historicalData) {
        try {
            if (!historicalData || historicalData.length === 0) {
                console.warn('No historical data to draw points for');
                return;
            }

            // Filter out data points with null, undefined, or NaN values
            const validMeanData = historicalData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.tminMean !== undefined && d.tminMean !== null && !isNaN(d.tminMean)
            );

            const validMaxData = historicalData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.tminMax !== undefined && d.tminMax !== null && !isNaN(d.tminMax)
            );

            const validMinData = historicalData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.tminMin !== undefined && d.tminMin !== null && !isNaN(d.tminMin)
            );

            // Add data points for mean values
            this.chart.selectAll('.historical-mean-point')
                .data(validMeanData)
                .enter()
                .append('circle')
                .attr('class', 'historical-mean-point')
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.tminMean))
                .attr('r', 2)
                .attr('fill', '#0077b6') // Darker blue for mean
                .attr('opacity', 0) // Initially invisible
                .on('mouseover', (event, d) => {
                    // Make point visible on hover
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);

                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);

                    // Format date as MM/DD
                    const formattedDate = `${d.month}/${d.day}`;

                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #0077b6;"></span>
                            <span class="tooltip-label">Historical Mean:</span>
                            <span class="tooltip-value">${d.tminMean.toFixed(1)} °C</span>
                        </div>
                        <div class="tooltip-item">
                            <span class="tooltip-label">Years:</span>
                            <span class="tooltip-value">${this.historicalYearRange}</span>
                        </div>
                    `;

                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
                    // Make point invisible again
                    d3.select(event.target)
                        .attr('opacity', 0)
                        .attr('r', 2);

                    this.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            // Add data points for max values
            this.chart.selectAll('.historical-max-point')
                .data(validMaxData)
                .enter()
                .append('circle')
                .attr('class', 'historical-max-point')
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.tminMax))
                .attr('r', 2)
                .attr('fill', '#48cae4') // Light blue for max
                .attr('opacity', 0) // Initially invisible
                .on('mouseover', (event, d) => {
                    // Make point visible on hover
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);

                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);

                    // Format date as MM/DD
                    const formattedDate = `${d.month}/${d.day}`;
                    const yearInfo = d.tminMaxYear ? ` (${d.tminMaxYear})` : '';

                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}${yearInfo}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #48cae4;"></span>
                            <span class="tooltip-label">Historical Max:</span>
                            <span class="tooltip-value">${d.tminMax.toFixed(1)} °C</span>
                        </div>
                    `;

                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
                    // Make point invisible again
                    d3.select(event.target)
                        .attr('opacity', 0)
                        .attr('r', 2);

                    this.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            // Add data points for min values
            this.chart.selectAll('.historical-min-point')
                .data(validMinData)
                .enter()
                .append('circle')
                .attr('class', 'historical-min-point')
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.tminMin))
                .attr('r', 2)
                .attr('fill', '#03045e') // Deep blue for min
                .attr('opacity', 0) // Initially invisible
                .on('mouseover', (event, d) => {
                    // Make point visible on hover
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);

                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);

                    // Format date as MM/DD
                    const formattedDate = `${d.month}/${d.day}`;
                    const yearInfo = d.tminMinYear ? ` (${d.tminMinYear})` : '';

                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}${yearInfo}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #03045e;"></span>
                            <span class="tooltip-label">Historical Min:</span>
                            <span class="tooltip-value">${d.tminMin.toFixed(1)} °C</span>
                        </div>
                    `;

                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
                    // Make point invisible again
                    d3.select(event.target)
                        .attr('opacity', 0)
                        .attr('r', 2);

                    this.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
        } catch (error) {
            console.error('Error adding historical data points:', error);
        }
    }
}
