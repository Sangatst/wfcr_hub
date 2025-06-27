/**
 * TmeanChartVisualizer class for visualizing average temperature data
 */
class TmeanChartVisualizer {
    /**
     * Constructor for TmeanChartVisualizer
     * @param {string} containerId - The ID of the container element
     */
    constructor(containerId) {
        this.containerId = containerId;
        this.container = d3.select(`#${containerId}`);
        this.margin = { top: 40, right: 80, bottom: 60, left: 60 };
        this.width = 1000 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.currentMonth = 'all';
        this.tooltipDiv = null;
        this.currentData = null;

        this.initializeChart();
        this.createTooltip();

        // Handle window resize
        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Initialize the chart
     */
    initializeChart() {
        // Clear any existing SVG
        d3.select(`#${this.containerId}`).select('svg').remove();

        // Create SVG element
        this.svg = d3.select(`#${this.containerId}`)
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
            .attr('text-anchor', 'middle')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', this.height + this.margin.top + 50)
            .text('Day');

        this.svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${this.margin.left / 3},${this.margin.top + this.height / 2})rotate(-90)`)
            .text('Average Temperature (°C)');

        // Add chart title
        this.chartTitle = this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', this.margin.top / 2)
            .text('Average Temperature Observation - Station');
    }

    /**
     * Create tooltip
     */
    createTooltip() {
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }

    /**
     * Update chart with new data
     * @param {Object} data - The data to visualize
     */
    updateChart(data) {
        if (!data || !data.dailyStats || !data.currentYearData) {
            console.error('Invalid data for Average Temperature chart');
            return;
        }

        // Store the data for later use (e.g., during resize)
        this.currentData = data;

        console.log('Average Temperature chart data:', data);

        // Filter data by month if needed
        const filteredDailyStats = this.filterDataByMonth(data.dailyStats);
        const filteredCurrentYearData = this.filterDataByMonth(data.currentYearData);

        // Use the actual calculated data from the data processor
        console.log(`Filtered ${filteredDailyStats.length} daily stats and ${filteredCurrentYearData.length} current year records for Tmean chart`);

        // Ensure filteredCurrentYearData is an array
        const safeFilteredCurrentYearData = Array.isArray(filteredCurrentYearData) ? filteredCurrentYearData : [];

        console.log('Processing current year data for Tmean calculation:', safeFilteredCurrentYearData.length, 'records');

        // Create current year data with calculated Tmean
        const currentYearDataWithTmean = safeFilteredCurrentYearData.map(d => {
            // Skip null or undefined data points
            if (!d) {
                console.warn('Encountered null or undefined data point in currentYearData');
                return null;
            }

            try {
                // Make a copy of the data point to avoid modifying the original
                const dataPoint = { ...d };

                // Check for Tmax and Tmin in various possible property names
                const tmax = getNumericValue(dataPoint, ['tmax', 'Tmax', 'TMAX', 'TMax']);
                const tmin = getNumericValue(dataPoint, ['tmin', 'Tmin', 'TMIN', 'TMin']);

                // Calculate tmean if both tmax and tmin are available
                if (tmax !== null && tmin !== null) {
                    dataPoint.tmax = tmax;
                    dataPoint.tmin = tmin;
                    dataPoint.tmean = (tmax + tmin) / 2;

                    // Log successful calculation
                    if (dataPoint.tmean !== null) {
                        console.log(`Calculated Tmean for ${dataPoint.Day}-${dataPoint.Month}-${dataPoint.Year}: ${dataPoint.tmean.toFixed(1)}°C (Tmax: ${tmax.toFixed(1)}°C, Tmin: ${tmin.toFixed(1)}°C)`);
                    }

                    return dataPoint;
                }

                // If we already have a valid tmean value, use it
                if (dataPoint.tmean !== undefined && !isNaN(dataPoint.tmean)) {
                    return dataPoint;
                }

                // If we can't calculate tmean, return null
                console.warn(`Cannot calculate Tmean for data point - missing Tmax or Tmin:`, dataPoint);
                return null;
            } catch (error) {
                console.error('Error processing data point for Tmean calculation:', error, d);
                return null;
            }
        })
        .filter(d => d !== null && d.tmean !== null);

        // Helper function to get numeric value from various property names
        function getNumericValue(obj, propertyNames) {
            for (const prop of propertyNames) {
                if (obj[prop] !== undefined) {
                    // Convert to number if it's a string
                    const value = typeof obj[prop] === 'string' ? parseFloat(obj[prop]) : obj[prop];
                    if (!isNaN(value)) {
                        return value;
                    }
                }
            }
            return null;
        }

        console.log(`Created ${currentYearDataWithTmean.length} current year data points with Tmean values`);

        // Set domain for scales
        const allTemps = [
            ...filteredDailyStats.map(d => d.tmeanMean),
            ...filteredDailyStats.map(d => d.tmeanMax),
            ...filteredDailyStats.map(d => d.tmeanMin),
            ...currentYearDataWithTmean.map(d => d.tmean)
        ].filter(t => t !== null && !isNaN(t));

        // Calculate dynamic min and max temperatures with padding
        let minTemp, maxTemp;

        if (allTemps.length > 0) {
            minTemp = Math.min(...allTemps);
            maxTemp = Math.max(...allTemps);

            // Add padding (10% of the range)
            const range = maxTemp - minTemp;
            const padding = range > 0 ? range * 0.1 : 2; // Use at least 2 degrees padding if range is small
            minTemp = Math.floor(minTemp - padding);
            maxTemp = Math.ceil(maxTemp + padding);
        } else {
            // Default values if no data
            minTemp = 0;
            maxTemp = 30;
        }

        // Ensure we have reasonable defaults if data is missing
        minTemp = isFinite(minTemp) ? minTemp : 0;
        maxTemp = isFinite(maxTemp) ? maxTemp : 30;

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

        this.yScale.domain([minTemp, maxTemp]);

        // Update axes
        if (this.currentMonth === 'all') {
            // For full year view, show month abbreviations
            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickFormat(d => {
                    // Show month names at the middle of each month
                    const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
                    const monthMiddle = monthDays.map(d => d + 15);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                    if (monthMiddle.includes(d)) {
                        return months[monthMiddle.indexOf(d)];
                    }
                    return '';
                })
                .tickValues([15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]) // Middle of each month
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
            // Adjust number of ticks based on screen size
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
        let titleText = `Average Temperature Observation - ${stationName}`;
        if (this.currentMonth !== 'all') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            titleText += ` (${monthNames[parseInt(this.currentMonth) - 1]})`;
        }

        this.chartTitle.text(titleText);

        // Clear previous elements - use more specific class names for Tmean chart
        this.chart.selectAll('.tmean-mean-line, .tmean-max-line, .tmean-min-line, .tmean-std-area, .tmean-current-year-point, .tmean-current-year-line, .tmean-current-year-point-max, .tmean-current-year-point-min, .max-label, .min-label, .no-data-message')
            .remove();

        // Skip drawing standard deviation area as requested
        // this.drawStdArea(filteredDailyStats);

        // Draw historical mean line
        this.drawMeanLine(filteredDailyStats);

        // Draw historical max line
        this.drawMaxLine(filteredDailyStats);

        // Draw historical min line
        this.drawMinLine(filteredDailyStats);

        // Draw current year points
        this.drawCurrentYearPoints(currentYearDataWithTmean);

        // Add historical data points with hover
        this.addHistoricalDataPoints(filteredDailyStats);

        // Update chart interpretation
        this.updateChartInterpretation(data.stationName, filteredDailyStats, currentYearDataWithTmean);
    }

    /**
     * Filter data by selected month
     * @param {Array} data - The data to filter
     * @returns {Array} - Filtered data
     */
    filterDataByMonth(data) {
        if (this.currentMonth === 'all') {
            return data;
        }

        const month = parseInt(this.currentMonth);
        return data.filter(d => d.Month === month || d.month === month);
    }

    /**
     * Set current month filter
     * @param {string} month - The month to filter by
     */
    setMonth(month) {
        this.currentMonth = month;
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
            console.error('Error resizing Tmean chart:', error);
        }
    }

    /**
     * Draw standard deviation area
     * @param {Array} dailyStats - The daily statistics data
     */
    drawStdArea(dailyStats) {
        // Create array of points for the area
        const areaPoints = dailyStats.map(d => {
            const mean = d.tmeanMean !== undefined ? d.tmeanMean : 0;
            const std = d.tmeanStd !== undefined ? d.tmeanStd : 1;
            return {
                dayOfYear: d.dayOfYear,
                upper: mean + std,
                lower: mean - std
            };
        }).filter(d => d.dayOfYear && !isNaN(d.upper) && !isNaN(d.lower));

        // Sort by day of year
        areaPoints.sort((a, b) => a.dayOfYear - b.dayOfYear);

        // Create area generator
        const area = d3.area()
            .x(d => this.xScale(d.dayOfYear))
            .y0(d => this.yScale(d.lower))
            .y1(d => this.yScale(d.upper))
            .curve(d3.curveMonotoneX);

        // Draw area
        this.chart.append('path')
            .datum(areaPoints)
            .attr('class', 'tmean-std-area')
            .attr('d', area)
            .style('fill', 'rgba(39, 174, 96, 0.1)');
    }

    /**
     * Draw historical mean line
     * @param {Array} dailyStats - The daily statistics data
     */
    drawMeanLine(dailyStats) {
        // Create array of points for the line
        const linePoints = dailyStats.map(d => ({
            dayOfYear: d.dayOfYear,
            value: d.tmeanMean
        })).filter(d => d.dayOfYear && d.value !== undefined);

        // Sort by day of year
        linePoints.sort((a, b) => a.dayOfYear - b.dayOfYear);

        // Create line generator
        const line = d3.line()
            .x(d => this.xScale(d.dayOfYear))
            .y(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);

        // Draw line
        this.chart.append('path')
            .datum(linePoints)
            .attr('class', 'tmean-mean-line')
            .attr('d', line);
    }

    /**
     * Draw historical max line
     * @param {Array} dailyStats - The daily statistics data
     */
    drawMaxLine(dailyStats) {
        // Create array of points for the line
        const linePoints = dailyStats.map(d => ({
            dayOfYear: d.dayOfYear,
            value: d.tmeanMax
        })).filter(d => d.dayOfYear && d.value !== undefined);

        // Sort by day of year
        linePoints.sort((a, b) => a.dayOfYear - b.dayOfYear);

        // Create line generator
        const line = d3.line()
            .x(d => this.xScale(d.dayOfYear))
            .y(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);

        // Draw line
        this.chart.append('path')
            .datum(linePoints)
            .attr('class', 'tmean-max-line')
            .attr('d', line);
    }

    /**
     * Draw historical min line
     * @param {Array} dailyStats - The daily statistics data
     */
    drawMinLine(dailyStats) {
        // Create array of points for the line
        const linePoints = dailyStats.map(d => ({
            dayOfYear: d.dayOfYear,
            value: d.tmeanMin
        })).filter(d => d.dayOfYear && d.value !== undefined);

        // Sort by day of year
        linePoints.sort((a, b) => a.dayOfYear - b.dayOfYear);

        // Create line generator
        const line = d3.line()
            .x(d => this.xScale(d.dayOfYear))
            .y(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);

        // Draw line
        this.chart.append('path')
            .datum(linePoints)
            .attr('class', 'tmean-min-line')
            .attr('d', line);
    }

    /**
     * Draw current year points
     * @param {Array} currentYearData - The current year data
     */
    drawCurrentYearPoints(currentYearData) {
        try {
            if (!currentYearData || currentYearData.length === 0) {
                console.warn('No current year data to draw');
                return;
            }

            // Remove existing points and lines
            this.chart.selectAll('.tmean-current-year-point').remove();
            this.chart.selectAll('.tmean-current-year-line').remove();

            // Keep all data points with valid dayOfYear, even if tmean is null
            const validData = currentYearData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear)
            );

            if (validData.length === 0) {
                console.warn('No valid data points for current year after filtering');
                return;
            }

            // Find max and min temperature points
            let maxTempPoint = null;
            let minTempPoint = null;

            try {
                maxTempPoint = validData.reduce((max, current) =>
                    (current.tmean > max.tmean) ? current : max, validData[0]);

                minTempPoint = validData.reduce((min, current) =>
                    (current.tmean < min.tmean) ? current : min, validData[0]);
            } catch (error) {
                console.error('Error finding max/min temperature points:', error);
            }

            // Draw points only for valid tmean values
            this.chart.selectAll('.tmean-current-year-point')
                .data(validData.filter(d => d.tmean !== null && d.tmean !== undefined && !isNaN(d.tmean)))
                .enter()
                .append('circle')
                .attr('class', d => {
                    if (d === maxTempPoint) return 'tmean-current-year-point tmean-current-year-point-max';
                    if (d === minTempPoint) return 'tmean-current-year-point tmean-current-year-point-min';
                    return 'tmean-current-year-point';
                })
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.tmean))
                .attr('r', d => (d === maxTempPoint || d === minTempPoint) ? 6 : 4)
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                        .attr('r', d => (d === maxTempPoint || d === minTempPoint) ? 8 : 6);
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    const formattedDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #8e44ad;"></span>
                            <span class="tooltip-label">Current Year Tmean:</span>
                            <span class="tooltip-value">${d.tmean.toFixed(1)} °C</span>
                        </div>
                    `;
                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
                    d3.select(event.target)
                        .attr('r', d => (d === maxTempPoint || d === minTempPoint) ? 6 : 4);
                    this.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            // Draw line connecting points
            const line = d3.line()
                .x(d => this.xScale(d.dayOfYear))
                .y(d => {
                    // Only return a y value if tmean is valid
                    return (d.tmean !== null && d.tmean !== undefined && !isNaN(d.tmean))
                        ? this.yScale(d.tmean)
                        : null;
                })
                .defined(d => d.tmean !== null && d.tmean !== undefined && !isNaN(d.tmean))
                .curve(d3.curveMonotoneX);

            this.chart.append('path')
                .datum(validData)
                .attr('class', 'tmean-current-year-line')
                .attr('d', line);

            // Add labels for max and min points
            if (maxTempPoint && maxTempPoint.dayOfYear !== undefined && !isNaN(maxTempPoint.dayOfYear) &&
                maxTempPoint.tmean !== undefined && !isNaN(maxTempPoint.tmean)) {
                this.chart.append('text')
                    .attr('class', 'max-label')
                    .attr('x', this.xScale(maxTempPoint.dayOfYear))
                    .attr('y', this.yScale(maxTempPoint.tmean) - 15)
                    .attr('text-anchor', 'middle')
                    .text(`Max: ${maxTempPoint.tmean.toFixed(1)}°C`);
            }

            if (minTempPoint && minTempPoint.dayOfYear !== undefined && !isNaN(minTempPoint.dayOfYear) &&
                minTempPoint.tmean !== undefined && !isNaN(minTempPoint.tmean)) {
                this.chart.append('text')
                    .attr('class', 'min-label')
                    .attr('x', this.xScale(minTempPoint.dayOfYear))
                    .attr('y', this.yScale(minTempPoint.tmean) + 15)
                    .attr('text-anchor', 'middle')
                    .text(`Min: ${minTempPoint.tmean.toFixed(1)}°C`);
            }
        } catch (error) {
            console.error('Error drawing current year data:', error);
        }
    }

    /**
     * Add data points for historical data with hover functionality (tmean)
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
                d.tmeanMean !== undefined && d.tmeanMean !== null && !isNaN(d.tmeanMean)
            );
            const validMaxData = historicalData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.tmeanMax !== undefined && d.tmeanMax !== null && !isNaN(d.tmeanMax)
            );
            const validMinData = historicalData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.tmeanMin !== undefined && d.tmeanMin !== null && !isNaN(d.tmeanMin)
            );

            // Add data points for mean values
            this.chart.selectAll('.historical-mean-point')
                .data(validMeanData)
                .enter()
                .append('circle')
                .attr('class', 'historical-mean-point')
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.tmeanMean))
                .attr('r', 2)
                .attr('fill', '#27ae60') // Green for mean
                .attr('opacity', 0)
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    const formattedDate = `${d.month}/${d.day}`;
                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #27ae60;"></span>
                            <span class="tooltip-label">Historical Mean:</span>
                            <span class="tooltip-value">${d.tmeanMean.toFixed(1)} °C</span>
                        </div>
                        <div class="tooltip-item">
                            <span class="tooltip-label">Years:</span>
                            <span class="tooltip-value">${this.historicalYearRange || this.getHistoricalYearRange()}</span>
                        </div>
                    `;
                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
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
                .attr('cy', d => this.yScale(d.tmeanMax))
                .attr('r', 2)
                .attr('fill', '#d35400') // Orange for max
                .attr('opacity', 0)
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    const formattedDate = `${d.month}/${d.day}`;
                    const yearInfo = d.tmeanMaxYear ? ` (${d.tmeanMaxYear})` : '';
                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}${yearInfo}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #d35400;"></span>
                            <span class="tooltip-label">Historical Max:</span>
                            <span class="tooltip-value">${d.tmeanMax.toFixed(1)} °C</span>
                        </div>
                    `;
                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
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
                .attr('cy', d => this.yScale(d.tmeanMin))
                .attr('r', 2)
                .attr('fill', '#2980b9') // Blue for min
                .attr('opacity', 0)
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    const formattedDate = `${d.month}/${d.day}`;
                    const yearInfo = d.tmeanMinYear ? ` (${d.tmeanMinYear})` : '';
                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}${yearInfo}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #2980b9;"></span>
                            <span class="tooltip-label">Historical Min:</span>
                            <span class="tooltip-value">${d.tmeanMin.toFixed(1)} °C</span>
                        </div>
                    `;
                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
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

    /**
     * Update chart interpretation
     * @param {string} station - The station name
     * @param {Array} dailyStats - The daily statistics data
     * @param {Array} currentYearData - The current year data
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

            if (dailyStats && dailyStats.length > 0) {
                // Calculate mean - only count valid values
                let meanSum = 0;
                dailyStats.forEach(stat => {
                    if (stat.tmeanMean !== undefined && !isNaN(stat.tmeanMean)) {
                        meanSum += stat.tmeanMean;
                        validHistoricalDataCount++;
                    }
                });

                historicalMean = validHistoricalDataCount > 0 ? meanSum / validHistoricalDataCount : 0;

                // Find max and min
                dailyStats.forEach(stat => {
                    // Use tmeanMax if available
                    if (stat.tmeanMax !== undefined && !isNaN(stat.tmeanMax)) {
                        const maxValue = stat.tmeanMax;
                        const maxYear = stat.tmeanMaxYear !== undefined ? stat.tmeanMaxYear : '';

                        if (maxValue > historicalMax) {
                            historicalMax = maxValue;
                            historicalMaxDate = `${stat.month}/${stat.day}/${maxYear}`;
                        }
                    }

                    // Use tmeanMin if available
                    if (stat.tmeanMin !== undefined && !isNaN(stat.tmeanMin)) {
                        const minValue = stat.tmeanMin;
                        const minYear = stat.tmeanMinYear !== undefined ? stat.tmeanMinYear : '';

                        if (minValue < historicalMin) {
                            historicalMin = minValue;
                            historicalMinDate = `${stat.month}/${stat.day}/${minYear}`;
                        }
                    }
                });

                // Get year range from the data
                const years = new Set();
                dailyStats.forEach(stat => {
                    // Check for tmeanMaxYear
                    if (stat.tmeanMaxYear && !isNaN(parseInt(stat.tmeanMaxYear))) {
                        years.add(parseInt(stat.tmeanMaxYear));
                    }
                    // Check for tmeanMinYear
                    if (stat.tmeanMinYear && !isNaN(parseInt(stat.tmeanMinYear))) {
                        years.add(parseInt(stat.tmeanMinYear));
                    }
                    // Check for maxYear as fallback
                    if (stat.maxYear && !isNaN(parseInt(stat.maxYear))) {
                        years.add(parseInt(stat.maxYear));
                    }
                    // Check for minYear as fallback
                    if (stat.minYear && !isNaN(parseInt(stat.minYear))) {
                        years.add(parseInt(stat.minYear));
                    }
                });

                if (years.size > 0) {
                    const yearArray = Array.from(years).sort();
                    const minYear = yearArray[0];
                    const maxYear = yearArray[yearArray.length - 1];
                    historicalYearRange = `${minYear}-${maxYear}`;
                    // Store the year range in the class property
                    this.historicalYearRange = historicalYearRange;
                }
            }

            // Calculate statistics for current year data
            let currentYearMean = 0;
            let currentYearMax = -Infinity;
            let currentYearMaxDate = '';
            let currentYearMin = Infinity;
            let currentYearMinDate = '';
            let validCurrentYearDataCount = 0;

            // Ensure currentYearData is an array
            const currentYearDataArray = Array.isArray(currentYearData) ? currentYearData : [];

            if (currentYearDataArray.length > 0) {
                // Calculate mean from valid Tmean values
                const validTmean = currentYearDataArray.filter(d => d && d.tmean !== undefined && !isNaN(d.tmean));
                validCurrentYearDataCount = validTmean.length;

                console.log(`Found ${validTmean.length} valid Tmean values for statistics calculation`);

                if (validTmean.length > 0) {
                    // Calculate mean
                    const sum = validTmean.reduce((acc, d) => acc + d.tmean, 0);
                    currentYearMean = sum / validTmean.length;

                    console.log(`Calculated current year Tmean mean: ${currentYearMean.toFixed(2)}°C`);

                    // Find max and min
                    validTmean.forEach(d => {
                        if (d.tmean > currentYearMax) {
                            currentYearMax = d.tmean;
                            currentYearMaxDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                        }
                        if (d.tmean < currentYearMin) {
                            currentYearMin = d.tmean;
                            currentYearMinDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                        }
                    });

                    console.log(`Found max Tmean: ${currentYearMax.toFixed(2)}°C on ${currentYearMaxDate}`);
                    console.log(`Found min Tmean: ${currentYearMin.toFixed(2)}°C on ${currentYearMinDate}`);
                } else {
                    // If no valid Tmean values, try to calculate from Tmax and Tmin
                    console.log('No valid Tmean values found, attempting to calculate from Tmax and Tmin');

                    // Find records with both Tmax and Tmin
                    const recordsWithTmaxTmin = currentYearDataArray.filter(d =>
                        d &&
                        ((d.tmax !== undefined && !isNaN(d.tmax)) || (d.Tmax !== undefined && !isNaN(d.Tmax))) &&
                        ((d.tmin !== undefined && !isNaN(d.tmin)) || (d.Tmin !== undefined && !isNaN(d.Tmin)))
                    );

                    if (recordsWithTmaxTmin.length > 0) {
                        console.log(`Found ${recordsWithTmaxTmin.length} records with both Tmax and Tmin`);

                        // Calculate Tmean for each record
                        const calculatedTmean = recordsWithTmaxTmin.map(d => {
                            const tmax = d.tmax !== undefined ? d.tmax : d.Tmax;
                            const tmin = d.tmin !== undefined ? d.tmin : d.Tmin;
                            return {
                                ...d,
                                tmean: (tmax + tmin) / 2,
                                Day: d.Day,
                                Month: d.Month,
                                Year: d.Year
                            };
                        });

                        validCurrentYearDataCount = calculatedTmean.length;

                        // Calculate mean
                        const sum = calculatedTmean.reduce((acc, d) => acc + d.tmean, 0);
                        currentYearMean = sum / calculatedTmean.length;

                        // Find max and min
                        calculatedTmean.forEach(d => {
                            if (d.tmean > currentYearMax) {
                                currentYearMax = d.tmean;
                                currentYearMaxDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                            }
                            if (d.tmean < currentYearMin) {
                                currentYearMin = d.tmean;
                                currentYearMinDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                            }
                        });

                        console.log(`Calculated current year Tmean mean from Tmax/Tmin: ${currentYearMean.toFixed(2)}°C`);
                        console.log(`Found max Tmean: ${currentYearMax.toFixed(2)}°C on ${currentYearMaxDate}`);
                        console.log(`Found min Tmean: ${currentYearMin.toFixed(2)}°C on ${currentYearMinDate}`);
                    }
                }
            }

            // Log the calculated values for debugging
            console.log('Tmean Statistics:', {
                historical: {
                    mean: historicalMean,
                    max: historicalMax,
                    maxDate: historicalMaxDate,
                    min: historicalMin,
                    minDate: historicalMinDate,
                    validDataCount: validHistoricalDataCount,
                    yearRange: historicalYearRange
                },
                currentYear: {
                    mean: currentYearMean,
                    max: currentYearMax,
                    maxDate: currentYearMaxDate,
                    min: currentYearMin,
                    minDate: currentYearMinDate,
                    validDataCount: validCurrentYearDataCount
                }
            });

            // Update chart summary
            const summaryElement = document.getElementById('tmean-chart-summary');
            if (summaryElement) {
                // Get the station name from the UI if not provided
                const stationName = station || document.getElementById('station')?.value || 'Selected Station';

                // Get month name if filtered
                let periodText = 'the year';
                if (this.currentMonth !== 'all') {
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    periodText = monthNames[parseInt(this.currentMonth) - 1];
                }

                // Create summary text
                let summary = '';

                // Create summary text in the requested format
                const hasValidCurrentYearData = validCurrentYearDataCount > 0;
                const hasValidHistoricalData = validHistoricalDataCount > 0;

                if (hasValidCurrentYearData && hasValidHistoricalData) {
                    // Calculate temperature difference
                    const tempDiff = currentYearMean - historicalMean;
                    const tempDiffText = tempDiff > 0
                        ? `${tempDiff.toFixed(1)}°C warmer`
                        : `${Math.abs(tempDiff).toFixed(1)}°C cooler`;

                    // Format dates for extremes - extract just the month/day part
                    let maxDateFormatted = currentYearMaxDate;
                    let minDateFormatted = currentYearMinDate;

                    // Try to extract just month/day from the date strings
                    try {
                        if (currentYearMaxDate && currentYearMaxDate.includes('/')) {
                            const parts = currentYearMaxDate.split('/');
                            if (parts.length >= 2) {
                                maxDateFormatted = `${parts[0]}/${parts[1]}`;
                            }
                        }

                        if (currentYearMinDate && currentYearMinDate.includes('/')) {
                            const parts = currentYearMinDate.split('/');
                            if (parts.length >= 2) {
                                minDateFormatted = `${parts[0]}/${parts[1]}`;
                            }
                        }
                    } catch (e) {
                        console.warn('Error formatting dates:', e);
                    }

                    // Create the summary in the requested format
                    summary = `For ${stationName} during ${periodText}, the average temperature was ${currentYearMean.toFixed(1)}°C, which is ${tempDiffText} than the ${historicalYearRange} average of ${historicalMean.toFixed(1)}°C. `;

                    if (currentYearMax !== -Infinity) {
                        summary += `The highest average temperature recorded was ${currentYearMax.toFixed(1)}°C on ${maxDateFormatted}. `;
                    }

                    if (currentYearMin !== Infinity) {
                        summary += `The lowest average temperature recorded was ${currentYearMin.toFixed(1)}°C on ${minDateFormatted}.`;
                    }
                } else if (hasValidHistoricalData) {
                    // Format for historical data only
                    summary = `For ${stationName} during ${periodText}, the historical (${historicalYearRange}) average temperature is ${historicalMean.toFixed(1)}°C. `;

                    if (historicalMax !== -Infinity) {
                        summary += `The highest historical average temperature was ${historicalMax.toFixed(1)}°C recorded on ${historicalMaxDate}. `;
                    }

                    if (historicalMin !== Infinity) {
                        summary += `The lowest historical average temperature was ${historicalMin.toFixed(1)}°C recorded on ${historicalMinDate}.`;
                    }
                } else {
                    summary = `Insufficient data available for ${stationName} during ${periodText}.`;
                }

                summaryElement.innerHTML = summary;
            }

            // Update extremes table
            const historicalExtremesRow = document.getElementById('tmean-historical-extremes');
            const currentYearExtremesRow = document.getElementById('tmean-current-year-extremes');

            if (historicalExtremesRow) {
                const cells = historicalExtremesRow.querySelectorAll('td');
                if (cells.length >= 6) {
                    cells[0].textContent = historicalYearRange || 'Historical';
                    cells[1].textContent = historicalMax !== -Infinity ? historicalMax.toFixed(1) + '°C' : '--';
                    cells[2].textContent = historicalMaxDate || '--';
                    cells[3].textContent = historicalMin !== Infinity ? historicalMin.toFixed(1) + '°C' : '--';
                    cells[4].textContent = historicalMinDate || '--';
                    cells[5].textContent = historicalMean !== 0 && validHistoricalDataCount > 0 ? historicalMean.toFixed(1) + '°C' : '--';
                }
            }

            if (currentYearExtremesRow) {
                const cells = currentYearExtremesRow.querySelectorAll('td');
                if (cells.length >= 6) {
                    cells[0].textContent = 'Current Year';

                    // Only show values if we have valid data
                    const hasValidCurrentYearData = validCurrentYearDataCount > 0;

                    if (hasValidCurrentYearData) {
                        cells[1].textContent = currentYearMax !== -Infinity ? currentYearMax.toFixed(1) + '°C' : '--';
                        cells[2].textContent = currentYearMaxDate || '--';
                        cells[3].textContent = currentYearMin !== Infinity ? currentYearMin.toFixed(1) + '°C' : '--';
                        cells[4].textContent = currentYearMinDate || '--';
                        cells[5].textContent = currentYearMean !== 0 ? currentYearMean.toFixed(1) + '°C' : '--';
                    } else {
                        // If no valid data, show dashes
                        cells[1].textContent = '--';
                        cells[2].textContent = '--';
                        cells[3].textContent = '--';
                        cells[4].textContent = '--';
                        cells[5].textContent = '--';
                    }
                }
            }

            // Update historical labels with year range
            if (historicalYearRange) {
                const meanLabel = document.getElementById('tmean-historical-mean-label');
                const maxLabel = document.getElementById('tmean-historical-max-label');
                const minLabel = document.getElementById('tmean-historical-min-label');

                if (meanLabel) meanLabel.textContent = `${historicalYearRange} Average`;
                if (maxLabel) maxLabel.textContent = `${historicalYearRange} Max`;
                if (minLabel) minLabel.textContent = `${historicalYearRange} Min`;
            }
        } catch (error) {
            console.error('Error updating Tmean chart interpretation:', error);

            // Set a simple message if interpretation fails
            const summaryElement = document.getElementById('tmean-chart-summary');
            if (summaryElement) {
                summaryElement.textContent = `Data loaded for ${station || 'selected station'}. Select a station and month to view details.`;
            }
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
            const svgElement = document.querySelector('#tmean-chart svg');
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
                .tmean-current-year-line { fill: none; stroke: #8e44ad; stroke-width: 2; }
                .tmean-mean-line { fill: none; stroke: #27ae60; stroke-width: 2; }
                .tmean-max-line { fill: none; stroke: #d35400; stroke-width: 1; stroke-dasharray: 1, 2; }
                .tmean-min-line { fill: none; stroke: #2980b9; stroke-width: 1; stroke-dasharray: 1, 2; }
                .tmean-current-year-point { fill: #8e44ad; stroke: none; }
                .tmean-current-year-point-max { fill: #e74c3c; stroke: #000; stroke-width: 1; }
                .tmean-current-year-point-min { fill: #3498db; stroke: #000; stroke-width: 1; }
                .tmean-std-area { fill: rgba(39, 174, 96, 0.1); }
                .max-label { font-size: 12px; font-weight: bold; fill: #8e44ad; }
                .min-label { font-size: 12px; font-weight: bold; fill: #27ae60; }
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
                { color: '#8e44ad', text: 'Current Year' },
                { color: '#27ae60', text: `${this.historicalYearRange} Mean` },
                { color: '#d35400', text: `${this.historicalYearRange} Max` },
                { color: '#2980b9', text: `${this.historicalYearRange} Min` }
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
                link.download = `${station}_mean_temperature_chart.png`;
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
            console.error('Error downloading Tmean chart:', error);
            alert('Error downloading chart. Please check the console for details.');
        }
    }

    /**
     * Get the historical year range from the data
     * @returns {string} The historical year range (e.g., "1996-2024")
     */
    getHistoricalYearRange() {
        if (!this.currentData || !this.currentData.dailyStats) {
            return 'Historical';
        }

        const years = this.currentData.dailyStats.reduce((acc, stat) => {
            if (stat.tmeanMaxYear) acc.add(stat.tmeanMaxYear);
            else if (stat.maxYear) acc.add(stat.maxYear);

            if (stat.tmeanMinYear) acc.add(stat.tmeanMinYear);
            else if (stat.minYear) acc.add(stat.minYear);

            return acc;
        }, new Set());

        if (years.size > 0) {
            const yearArray = Array.from(years).sort();
            const minYear = yearArray[0];
            const maxYear = yearArray[yearArray.length - 1];
            return `${minYear}-${maxYear}`;
        }

        return 'Historical';
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
            let csvContent = 'Month,Day,Mean Tavg,StdDev,Max Tavg,Max Year,Min Tavg,Min Year,Sample Count\n';

            // Add data rows
            dailyStats.forEach(stat => {
                if (stat.month && stat.day) {
                    const mean = stat.tmeanMean !== undefined ? stat.tmeanMean.toFixed(1) : '';
                    const std = stat.tmeanStd !== undefined ? stat.tmeanStd.toFixed(1) : '';
                    const max = stat.tmeanMax !== undefined ? stat.tmeanMax.toFixed(1) : '';
                    const maxYear = stat.tmeanMaxYear || '';
                    const min = stat.tmeanMin !== undefined ? stat.tmeanMin.toFixed(1) : '';
                    const minYear = stat.tmeanMinYear || '';
                    const count = stat.count || '';

                    csvContent += `${stat.month},${stat.day},${mean},${std},${max},${maxYear},${min},${minYear},${count}\n`;
                }
            });

            // Create a Blob with the CSV content
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${station}_tavg_daily_stats.csv`);

            // Append the link to the document
            document.body.appendChild(link);

            // Click the link
            link.click();

            // Remove the link
            document.body.removeChild(link);

            // Revoke the URL
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Tmean stats:', error);
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

            // Create CSV content
            let csvContent = 'Date,Day,Month,Year,Tmax,Tmin,Tavg\n';

            // Add data rows
            currentYearData.forEach(day => {
                if (day.Day && day.Month && day.Year) {
                    const date = `${day.Day}/${day.Month}/${day.Year}`;
                    // Get Tmax value - check multiple possible property names
                    let tmaxValue = null;
                    if (day.tmax !== undefined && !isNaN(day.tmax)) {
                        tmaxValue = day.tmax;
                    } else if (day.Tmax !== undefined && !isNaN(day.Tmax)) {
                        tmaxValue = day.Tmax;
                    } else if (day.TMAX !== undefined && !isNaN(day.TMAX)) {
                        tmaxValue = day.TMAX;
                    }
                    const tmax = tmaxValue !== null ? tmaxValue.toFixed(1) : '';

                    // Get Tmin value - check multiple possible property names
                    let tminValue = null;
                    if (day.tmin !== undefined && !isNaN(day.tmin)) {
                        tminValue = day.tmin;
                    } else if (day.Tmin !== undefined && !isNaN(day.Tmin)) {
                        tminValue = day.Tmin;
                    } else if (day.TMIN !== undefined && !isNaN(day.TMIN)) {
                        tminValue = day.TMIN;
                    }
                    const tmin = tminValue !== null ? tminValue.toFixed(1) : '';

                    // Use tmean if available, otherwise calculate from tmax and tmin
                    let tmean = '';
                    if (day.tmean !== undefined && !isNaN(day.tmean)) {
                        tmean = day.tmean.toFixed(1);
                    } else if (tmaxValue !== null && tminValue !== null) {
                        tmean = ((tmaxValue + tminValue) / 2).toFixed(1);
                    }

                    csvContent += `${date},${day.Day},${day.Month},${day.Year},${tmax},${tmin},${tmean}\n`;
                }
            });

            // Create a Blob with the CSV content
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Create a link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${station}_current_year_tavg.csv`);

            // Append the link to the document
            document.body.appendChild(link);

            // Click the link
            link.click();

            // Remove the link
            document.body.removeChild(link);

            // Revoke the URL
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading current year Tmean data:', error);
            alert('Error downloading current year data. Please check the console for details.');
        }
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TmeanChartVisualizer };
} else {
    window.TmeanChartVisualizer = TmeanChartVisualizer;
}
