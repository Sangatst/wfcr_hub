/**
 * Chart Visualization for Temperature Maximum Observation Chart
 * This script handles creating and updating the D3.js chart
 */

class ChartVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = d3.select(`#${containerId}`);
        this.margin = { top: 40, right: 80, bottom: 60, left: 60 };
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

        // Initialize the chart
        this.initChart();

        // Handle window resize
        window.addEventListener('resize', this.resize.bind(this));
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

            // Create axes with thicker lines
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
                .attr('y', this.height + this.margin.top + 50) /* Increased from 40 to 50 to add more space */
                .text('Day');

            this.svg.append('text')
                .attr('class', 'y-axis-label')
                .attr('text-anchor', 'middle')
                .attr('transform', `translate(${this.margin.left / 3}, ${this.margin.top + this.height / 2}) rotate(-90)`)
                .text('Maximum Temperature (°C)');

            // Create tooltip
            this.tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);
        } catch (error) {
            console.error('Error initializing chart:', error);
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

            // Update axis labels
            this.svg.select('.x-axis-label')
                .attr('x', this.margin.left + this.width / 2);

            // Redraw chart if data exists
            if (this.currentData) {
                this.updateChart(this.currentData);
            }
        } catch (error) {
            console.error('Error resizing chart:', error);
        }
    }

    /**
     * Update the chart with new data
     * @param {Object} data - The data to visualize
     */
    updateChart(data) {
        try {
            // Check if chart is properly initialized
            if (!this.chart || !this.xScale || !this.yScale) {
                console.error('Chart not properly initialized');
                return;
            }

            // Check if data is valid
            if (!data) {
                console.error('No data provided to updateChart');
                this.showNoDataMessage('No data available for this station');
                return;
            }

            this.currentData = data;
            const { dailyStats = [], currentYearData = [] } = data || {};

            // Check if we have any data to display
            if ((!dailyStats || dailyStats.length === 0) && (!currentYearData || currentYearData.length === 0)) {
                console.warn('No data available for this station');
                this.showNoDataMessage('No data available for this station');
                return;
            }

            // Process data for visualization
            const processedDailyStats = this.processDailyStatsForVisualization(dailyStats);
            const processedCurrentYearData = this.processCurrentYearDataForVisualization(currentYearData);

            // Check if we have data to display
            if (processedDailyStats.length === 0 && processedCurrentYearData.length === 0) {
                console.warn('No data to display');
                return;
            }

            // Use the current month filter from the class property
            const selectedMonth = this.currentMonth;

            // Filter data by month if needed
            let filteredDailyStats = processedDailyStats;
            let filteredCurrentYearData = processedCurrentYearData;

            if (selectedMonth !== 'all') {
                const monthNum = parseInt(selectedMonth);
                console.log(`Filtering data for month: ${monthNum}`);

                filteredDailyStats = processedDailyStats.filter(d => d.month === monthNum);
                filteredCurrentYearData = processedCurrentYearData.filter(d => d.Month === monthNum);

                console.log(`Filtered daily stats: ${filteredDailyStats.length} records`);
                console.log(`Filtered current year data: ${filteredCurrentYearData.length} records`);
            }

            // If we have no data after filtering, show a message
            if (filteredDailyStats.length === 0 && filteredCurrentYearData.length === 0) {
                console.warn(`No data available for month: ${selectedMonth}`);
                // Clear the chart
                this.chart.selectAll('*').remove();

                // Add a message
                this.chart.append('text')
                    .attr('x', this.width / 2)
                    .attr('y', this.height / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '16px')
                    .text(`No data available for the selected month`);

                return;
            }

            // Set domain for scales
            const allTemps = [
                ...filteredDailyStats.map(d => d.mean),
                ...filteredDailyStats.map(d => d.max),
                ...filteredDailyStats.map(d => d.min),
                ...filteredCurrentYearData.map(d => d.tmax)
            ].filter(t => t !== null && !isNaN(t));

            if (allTemps.length === 0) {
                console.warn('No valid temperature data to display');
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

            // Update axes
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
                    // Adjust number of ticks based on screen size
                    .ticks(window.innerWidth <= 768 ? 5 : 10)
                    .tickFormat(d => d)) // Remove units from tick labels
                .selectAll('text')
                .style('font-weight', 'bold')
                .style('font-size', window.innerWidth <= 768 ? '10px' : '12px')
                .style('visibility', 'visible');

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

            // Clear existing elements
            this.chart.selectAll('.tmax-mean-line, .tmax-max-line, .tmax-min-line, .tmax-std-area, .tmax-current-year-line, .tmax-current-year-point, .tmax-current-year-point-max, .tmax-current-year-point-min, .max-label, .min-label').remove();

            // Draw mean line if we have daily stats
            if (filteredDailyStats.length > 0) {
                this.drawLine(filteredDailyStats, 'mean', '#3498db', 2);
                this.drawLine(filteredDailyStats, 'max', '#f39c12', 1, [1, 2]);
                this.drawLine(filteredDailyStats, 'min', '#2ecc71', 1, [1, 2]);
                // Add historical data points with hover
                this.addHistoricalDataPoints(filteredDailyStats);
                // Skip drawing standard deviation area as requested
                // this.drawStdArea(filteredDailyStats);
            }

            // Draw current year data if we have it
            if (filteredCurrentYearData.length > 0) {
                this.drawCurrentYearData(filteredCurrentYearData);
            }

            // Add title based on the selected month and station
            this.chart.selectAll('.chart-title').remove();

            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const selectedStation = stationSelect ? stationSelect.value : '';

            let titleText = 'Maximum Temperature Observation';

            // Add station name if available
            if (selectedStation) {
                titleText += ` - ${selectedStation}`;
            }

            // Add month to title if filtered
            if (this.currentMonth !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                titleText += ` (${monthNames[parseInt(this.currentMonth) - 1]})`;
            }

            // Add the title
            this.chart.append('text')
                .attr('class', 'chart-title')
                .attr('x', this.width / 2)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .text(titleText);

            // Update chart interpretation with the filtered data
            this.updateChartInterpretation(selectedStation, filteredDailyStats, filteredCurrentYearData);

            console.log('Chart updated successfully');
        } catch (error) {
            console.error('Error updating chart:', error);
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

            // Get Tmax value - handle zero values properly
            let tmaxValue;
            if (record.Tmax !== undefined && record.Tmax !== null) {
                tmaxValue = record.Tmax;
            } else if (record.tmax !== undefined && record.tmax !== null) {
                tmaxValue = record.tmax;
            } else if (record.TMAX !== undefined && record.TMAX !== null) {
                tmaxValue = record.TMAX;
            } else {
                return null;
            }

            // Check if it's a valid number (including zero)
            if (isNaN(parseFloat(tmaxValue))) return null;

            return {
                ...record,
                Year: year,
                Month: month,
                Day: day,
                dayOfYear: dayOfYear,
                tmax: parseFloat(tmaxValue)
            };
        }).filter(d => d !== null && !isNaN(d.tmax));
    }

    /**
     * Set current month filter
     * @param {string} month - The month to filter by
     */
    setMonth(month) {
        this.currentMonth = month;
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

            if (validData.length === 0) {
                console.warn(`No valid data points for ${valueKey} after filtering`);
                return;
            }

            // Create line generator
            const line = d3.line()
                .x(d => this.xScale(d.dayOfYear))
                .y(d => this.yScale(d[valueKey]))
                .defined(d => d[valueKey] !== null && d[valueKey] !== undefined && !isNaN(d[valueKey]))
                .curve(d3.curveMonotoneX);

            // Draw line
            const path = this.chart.append('path')
                .datum(validData)
                .attr('class', `tmax-${valueKey}-line`)
                .attr('d', line)
                .style('stroke', color)
                .style('stroke-width', width)
                .style('fill', 'none');

            // Add dash array if provided
            if (dashArray) {
                path.attr('stroke-dasharray', dashArray.join(','));
            }

            // Add hover effect for max line
            if (valueKey === 'max') {
                // Add invisible line for hover detection
                const hoverLine = this.chart.append('path')
                    .datum(validData)
                    .attr('class', `tmax-${valueKey}-line-hover`)
                    .attr('d', line)
                    .style('stroke', 'transparent')
                    .style('stroke-width', width * 3) // Wider for easier hover
                    .style('fill', 'none')
                    .on('mouseover', (event) => {
                        const [x, y] = d3.pointer(event);
                        const bisect = d3.bisector(d => d.dayOfYear).left;
                        const x0 = this.xScale.invert(x);
                        const i = bisect(validData, x0, 1);
                        const d0 = validData[i - 1];
                        const d1 = validData[i];
                        const closestPoint = x0 - d0.dayOfYear > d1.dayOfYear - x0 ? d1 : d0;

                        this.tooltip.transition()
                            .duration(200)
                            .style('opacity', 0.9);

                        const formattedDate = `${closestPoint.month}/${closestPoint.day}`;
                        const yearInfo = closestPoint.maxYear ? ` (${closestPoint.maxYear})` : '';
                        let tooltipContent = `
                            <div class="tooltip-date">${formattedDate}${yearInfo}</div>
                            <div class="tooltip-item">
                                <span class="tooltip-color" style="background-color: ${color};"></span>
                                <span class="tooltip-label">Historical Max:</span>
                                <span class="tooltip-value">${closestPoint.max.toFixed(1)} °C</span>
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
            }
        } catch (error) {
            console.error(`Error drawing line for ${valueKey}:`, error);
        }
    }

    /**
     * Draw current year data on the chart
     * @param {Array} data - Current year data
     */
    drawCurrentYearData(data) {
        try {
            if (!data || data.length === 0) {
                console.warn('No current year data to draw');
                return;
            }

            // Remove existing points and lines
            this.chart.selectAll('.tmax-current-year-point').remove();
            this.chart.selectAll('.tmax-current-year-line').remove();

            // Keep all data points with valid dayOfYear, even if tmax is null
            const validData = data.filter(d =>
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
                    (current.tmax > max.tmax) ? current : max, validData[0]);

                minTempPoint = validData.reduce((min, current) =>
                    (current.tmax < min.tmax) ? current : min, validData[0]);
            } catch (error) {
                console.error('Error finding max/min temperature points:', error);
            }

            // Draw points only for valid tmax values
            this.chart.selectAll('.tmax-current-year-point')
                .data(validData.filter(d => d.tmax !== null && d.tmax !== undefined && !isNaN(d.tmax)))
                .enter()
                .append('circle')
                .attr('class', d => {
                    if (d === maxTempPoint) return 'tmax-current-year-point tmax-current-year-point-max';
                    if (d === minTempPoint) return 'tmax-current-year-point tmax-current-year-point-min';
                    return 'tmax-current-year-point';
                })
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.tmax))
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
                            <span class="tooltip-color" style="background-color: #e74c3c;"></span>
                            <span class="tooltip-label">Current Year Tmax:</span>
                            <span class="tooltip-value">${d.tmax.toFixed(1)} °C</span>
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
                    // Only return a y value if tmax is valid
                    return (d.tmax !== null && d.tmax !== undefined && !isNaN(d.tmax))
                        ? this.yScale(d.tmax)
                        : null;
                })
                .defined(d => d.tmax !== null && d.tmax !== undefined && !isNaN(d.tmax))
                .curve(d3.curveMonotoneX);

            this.chart.append('path')
                .datum(validData)
                .attr('class', 'tmax-current-year-line')
                .attr('d', line);

            // Clear existing max/min labels before adding new ones
            this.chart.selectAll('.max-label, .min-label').remove();

            // Add labels for max and min points
            if (maxTempPoint && maxTempPoint.dayOfYear !== undefined && !isNaN(maxTempPoint.dayOfYear) &&
                maxTempPoint.tmax !== undefined && !isNaN(maxTempPoint.tmax)) {
                this.chart.append('text')
                    .attr('class', 'max-label')
                    .attr('x', this.xScale(maxTempPoint.dayOfYear))
                    .attr('y', this.yScale(maxTempPoint.tmax) - 15)
                    .attr('text-anchor', 'middle')
                    .text(`Max: ${maxTempPoint.tmax.toFixed(1)}°C`);
            }

            if (minTempPoint && minTempPoint.dayOfYear !== undefined && !isNaN(minTempPoint.dayOfYear) &&
                minTempPoint.tmax !== undefined && !isNaN(minTempPoint.tmax)) {
                this.chart.append('text')
                    .attr('class', 'min-label')
                    .attr('x', this.xScale(minTempPoint.dayOfYear))
                    .attr('y', this.yScale(minTempPoint.tmax) + 15)
                    .attr('text-anchor', 'middle')
                    .text(`Min: ${minTempPoint.tmax.toFixed(1)}°C`);
            }
        } catch (error) {
            console.error('Error drawing current year data:', error);
        }
    }

    /**
     * Draw standard deviation area on the chart
     * @param {Array} data - Daily statistics data
     */
    drawStdArea(data) {
        try {
            if (!data || data.length === 0) {
                console.warn('No data to draw standard deviation area');
                return;
            }

            // Check if data has the required properties
            const hasRequiredProperties = data.some(d =>
                d &&
                typeof d === 'object' &&
                'dayOfYear' in d &&
                'mean' in d &&
                'std' in d
            );

            if (!hasRequiredProperties) {
                // Check which properties are missing
                const sampleItem = data[0];
                if (sampleItem) {
                    const missingProps = [];
                    if (!('dayOfYear' in sampleItem)) missingProps.push('dayOfYear');
                    if (!('mean' in sampleItem)) missingProps.push('mean');
                    if (!('std' in sampleItem)) missingProps.push('std');

                    console.warn(`Data does not have required properties for standard deviation area. Missing: ${missingProps.join(', ')}`);
                    console.log('Sample data item:', sampleItem);
                } else {
                    console.warn('Data does not have required properties for standard deviation area (empty data)');
                }
                return;
            }

            // Filter out data points with null, undefined, or NaN values
            const validData = data.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.mean !== undefined && d.mean !== null && !isNaN(d.mean) &&
                d.std !== undefined && d.std !== null && !isNaN(d.std)
            );

            if (validData.length === 0) {
                console.warn('No valid data points for standard deviation area after filtering');
                return;
            }

            // Remove existing area
            this.chart.selectAll('.std-area').remove();

            // Create area generator
            const area = d3.area()
                .x(d => this.xScale(d.dayOfYear))
                .y0(d => this.yScale(d.mean - d.std))
                .y1(d => this.yScale(d.mean + d.std))
                .defined(d =>
                    d.mean !== null && d.mean !== undefined && !isNaN(d.mean) &&
                    d.std !== null && d.std !== undefined && !isNaN(d.std)
                )
                .curve(d3.curveMonotoneX);

            // Draw area
            this.chart.append('path')
                .datum(validData)
                .attr('class', 'std-area')
                .attr('fill', '#3498db')
                .attr('fill-opacity', 0.2)
                .attr('d', area);
        } catch (error) {
            console.error('Error drawing standard deviation area:', error);
        }
    }

    /**
     * Show a message when no data is available
     * @param {string} message - The message to display
     */
    showNoDataMessage(message) {
        try {
            // Clear existing elements
            this.chart.selectAll('*').remove();

            // Add a message
            this.chart.append('text')
                .attr('class', 'no-data-message')
                .attr('x', this.width / 2)
                .attr('y', this.height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '16px')
                .attr('font-weight', 'bold')
                .text(message);

            // Update the chart interpretation
            const chartSummary = document.getElementById('chart-summary');
            if (chartSummary) {
                chartSummary.textContent = 'No data available for this station. Please try another station.';
            }

            // Clear the temperature extremes table
            const historicalRow = document.getElementById('historical-extremes');
            const currentYearRow = document.getElementById('current-year-extremes');

            if (historicalRow) {
                historicalRow.innerHTML = `
                    <td>Historical</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                `;
            }

            if (currentYearRow) {
                currentYearRow.innerHTML = `
                    <td>Current Year</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                `;
            }
        } catch (error) {
            console.error('Error showing no data message:', error);
        }
    }

    /**
     * Update the chart interpretation text and temperature extremes table
     * @param {string} station - Selected station
     * @param {Array} dailyStats - Daily statistics data
     * @param {Array} currentYearData - Current year data
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
                    if (stat.mean !== undefined && !isNaN(stat.mean)) {
                        meanSum += stat.mean;
                        validHistoricalDataCount++;
                    }
                });

                historicalMean = validHistoricalDataCount > 0 ? meanSum / validHistoricalDataCount : 0;

                // Find max and min
                dailyStats.forEach(stat => {
                    // Use max if available
                    if (stat.max !== undefined && !isNaN(stat.max)) {
                        const maxValue = stat.max;
                        const maxYear = stat.maxYear !== undefined ? stat.maxYear : '';

                        if (maxValue > historicalMax) {
                            historicalMax = maxValue;
                            historicalMaxDate = `${stat.month}/${stat.day}/${maxYear}`;
                        }
                    }

                    // Use min if available
                    if (stat.min !== undefined && !isNaN(stat.min)) {
                        const minValue = stat.min;
                        const minYear = stat.minYear !== undefined ? stat.minYear : '';

                        if (minValue < historicalMin) {
                            historicalMin = minValue;
                            historicalMinDate = `${stat.month}/${stat.day}/${minYear}`;
                        }
                    }
                });

                // Get year range from the data
                const years = new Set();
                dailyStats.forEach(stat => {
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
                const validTmax = currentYearData.filter(d => d && d.tmax !== undefined && !isNaN(d.tmax));
                validCurrentYearDataCount = validTmax.length;

                if (validTmax.length > 0) {
                    // Calculate mean
                    const sum = validTmax.reduce((acc, d) => acc + d.tmax, 0);
                    currentYearMean = sum / validTmax.length;

                    // Find max and min
                    validTmax.forEach(d => {
                        if (d.tmax > currentYearMax) {
                            currentYearMax = d.tmax;
                            currentYearMaxDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                        }
                        if (d.tmax < currentYearMin) {
                            currentYearMin = d.tmax;
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

            const chartSummary = document.getElementById('chart-summary');
            if (!chartSummary) return;

            // Safety check for data
            if (!dailyStats || !currentYearData) {
                console.warn('Missing data for chart interpretation');
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
                interpretationText = `For ${station} during ${periodText}, the average maximum temperature was ${currentYearMean.toFixed(1)}°C, which is ${tempDiffText} than the ${historicalYearRange} average of ${historicalMean.toFixed(1)}°C. `;
            } else {
                interpretationText = `For ${station} during ${periodText}, temperature data is being loaded. `;
            }

            // Add information about max and min temperatures
            if (currentYearMax !== -Infinity) {
                interpretationText += `The highest maximum temperature recorded was ${currentYearMax.toFixed(1)}°C on ${currentYearMaxDate}. `;
            }

            if (currentYearMin !== Infinity) {
                interpretationText += `The lowest maximum temperature recorded was ${currentYearMin.toFixed(1)}°C on ${currentYearMinDate}.`;
            }

            chartSummary.textContent = interpretationText;

            // Update historical labels with year range
            if (historicalYearRange) {
                const meanLabel = document.getElementById('historical-mean-label');
                const maxLabel = document.getElementById('historical-max-label');
                const minLabel = document.getElementById('historical-min-label');

                if (meanLabel) meanLabel.textContent = `${historicalYearRange} Average`;
                if (maxLabel) maxLabel.textContent = `${historicalYearRange} Max`;
                if (minLabel) minLabel.textContent = `${historicalYearRange} Min`;
            }
        } catch (error) {
            console.error('Error updating chart interpretation:', error);
            const summaryElement = document.getElementById('chart-summary');
            if (summaryElement) {
                summaryElement.textContent = `Data loaded for ${station || 'selected station'}. Select a station and month to view details.`;
            }
        }
    }

    /**
     * Update the temperature extremes table
     * @param {Array} dailyStats - Daily statistics data
     * @param {Array} currentYearData - Current year data
     * @param {number} historicalMax - Historical maximum temperature
     * @param {number} historicalMin - Historical minimum temperature
     * @param {number} historicalAvg - Historical average temperature
     * @param {number} currentMax - Current year maximum temperature
     * @param {number} currentMin - Current year minimum temperature
     * @param {number} currentAvg - Current year average temperature
     * @param {string} historicalMaxDate - Historical maximum date
     * @param {string} historicalMinDate - Historical minimum date
     * @param {string} currentYearMaxDate - Current year maximum date
     * @param {string} currentYearMinDate - Current year minimum date
     */
    updateTemperatureExtremesTable(dailyStats, currentYearData, historicalMax, historicalMin, historicalMean, currentYearMax, currentYearMin, currentYearMean, historicalMaxDate, historicalMinDate, currentYearMaxDate, currentYearMinDate) {
        try {
            const historicalExtremesRow = document.getElementById('historical-extremes');
            const currentYearExtremesRow = document.getElementById('current-year-extremes');

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
     * Setup chart download functionality
     * @param {string} station - The selected station
     */
    setupChartDownload(station) {
        try {
            const downloadButton = document.getElementById('download-chart');
            if (!downloadButton) return;

            // Remove any existing event listeners
            const newButton = downloadButton.cloneNode(true);
            downloadButton.parentNode.replaceChild(newButton, downloadButton);

            // Add new event listener
            newButton.addEventListener('click', () => {
                this.downloadChart();
            });
        } catch (error) {
            console.error('Error setting up chart download:', error);
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
            const svgElement = document.querySelector('#chart svg');
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
                .tmax-current-year-line { fill: none; stroke: #e74c3c; stroke-width: 2; }
                .tmax-mean-line { fill: none; stroke: #3498db; stroke-width: 2; }
                .tmax-max-line { fill: none; stroke: #f39c12; stroke-width: 1; stroke-dasharray: 1, 2; }
                .tmax-min-line { fill: none; stroke: #2ecc71; stroke-width: 1; stroke-dasharray: 1, 2; }
                .tmax-current-year-point { fill: #e74c3c; stroke: none; }
                .tmax-current-year-point-max { fill: #f39c12; stroke: #000; stroke-width: 1; }
                .tmax-current-year-point-min { fill: #2ecc71; stroke: #000; stroke-width: 1; }
                .tmax-std-area { fill: rgba(52, 152, 219, 0.1); }
                .max-label { font-size: 12px; font-weight: bold; fill: #e74c3c; }
                .min-label { font-size: 12px; font-weight: bold; fill: #3498db; }
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
                { color: '#e74c3c', text: 'Current Year' },
                { color: '#3498db', text: `${this.historicalYearRange} Mean` },
                { color: '#f39c12', text: `${this.historicalYearRange} Max` },
                { color: '#2ecc71', text: `${this.historicalYearRange} Min` }
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
                link.download = `${station}_maximum_temperature_chart.png`;
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
            console.error('Error downloading Tmax chart:', error);
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
            let csvContent = 'Month,Day,Mean Tmax,StdDev,Max Tmax,Max Year,Min Tmax,Min Year,Sample Count\n';

            // Add data rows
            dailyStats.forEach(stat => {
                const row = [
                    stat.month,
                    stat.day,
                    stat.mean !== undefined && stat.mean !== null ? stat.mean.toFixed(2) : '',
                    stat.std !== undefined && stat.std !== null ? stat.std.toFixed(2) : '',
                    stat.max !== undefined && stat.max !== null ? stat.max.toFixed(2) : '',
                    stat.maxYear !== undefined && stat.maxYear !== null ? stat.maxYear : '',
                    stat.min !== undefined && stat.min !== null ? stat.min.toFixed(2) : '',
                    stat.minYear !== undefined && stat.minYear !== null ? stat.minYear : '',
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
            link.setAttribute('download', `${station}_daily_stats.csv`);

            // Append the link to the document
            document.body.appendChild(link);

            // Click the link
            link.click();

            // Remove the link
            document.body.removeChild(link);

            // Revoke the URL
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading stats:', error);
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
            link.setAttribute('download', `${station}_current_year_data.csv`);

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
     * Add data points for historical data with hover functionality (tmax)
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
                d.mean !== undefined && d.mean !== null && !isNaN(d.mean)
            );
            const validMaxData = historicalData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.max !== undefined && d.max !== null && !isNaN(d.max)
            );
            const validMinData = historicalData.filter(d =>
                d && d.dayOfYear !== undefined && d.dayOfYear !== null && !isNaN(d.dayOfYear) &&
                d.min !== undefined && d.min !== null && !isNaN(d.min)
            );

            // Add data points for mean values
            this.chart.selectAll('.historical-mean-point')
                .data(validMeanData)
                .enter()
                .append('circle')
                .attr('class', 'historical-mean-point')
                .attr('cx', d => this.xScale(d.dayOfYear))
                .attr('cy', d => this.yScale(d.mean))
                .attr('r', 2)
                .attr('fill', '#3498db') // Blue for mean
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
                            <span class="tooltip-color" style="background-color: #3498db;"></span>
                            <span class="tooltip-label">Historical Mean:</span>
                            <span class="tooltip-value">${d.mean.toFixed(1)} °C</span>
                        </div>
                        <div class="tooltip-item">
                            <span class="tooltip-label">Years:</span>
                            <span class="tooltip-value">${this.historicalYearRange || ''}</span>
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
                .attr('cy', d => this.yScale(d.max))
                .attr('r', 2)
                .attr('fill', '#f39c12') // Orange for max
                .attr('opacity', 0)
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    const formattedDate = `${d.month}/${d.day}`;
                    const yearInfo = d.maxYear ? ` (${d.maxYear})` : '';
                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}${yearInfo}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #f39c12;"></span>
                            <span class="tooltip-label">Historical Max:</span>
                            <span class="tooltip-value">${d.max.toFixed(1)} °C</span>
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
                .attr('cy', d => this.yScale(d.min))
                .attr('r', 2)
                .attr('fill', '#2ecc71') // Green for min
                .attr('opacity', 0)
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                        .attr('opacity', 1)
                        .attr('r', 4);
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    const formattedDate = `${d.month}/${d.day}`;
                    const yearInfo = d.minYear ? ` (${d.minYear})` : '';
                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}${yearInfo}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #2ecc71;"></span>
                            <span class="tooltip-label">Historical Min:</span>
                            <span class="tooltip-value">${d.min.toFixed(1)} °C</span>
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
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartVisualizer };
} else {
    window.ChartVisualizer = ChartVisualizer;
}
