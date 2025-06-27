/**
 * RainfallChartVisualizer class for visualizing daily rainfall data
 */
class RainfallChartVisualizer {
    /**
     * Constructor for RainfallChartVisualizer
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

        // Create axes with thicker lines (matching Tmean chart)
        this.xAxis = this.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .style('stroke-width', '1.5px'); // Make axis lines thicker

        this.yAxis = this.chart.append('g')
            .attr('class', 'y-axis')
            .style('stroke-width', '1.5px'); // Make axis lines thicker

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
            .text('Rainfall (mm)');

        // Add chart title
        this.chartTitle = this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', this.margin.top / 2)
            .text('Daily Rainfall Observation - Station');
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
            console.error('Invalid data for Rainfall chart');
            return;
        }

        // Store the data for later use (e.g., during resize)
        this.currentData = data;

        console.log('Rainfall chart data:', data);

        // Filter data by month if needed
        const filteredDailyStats = this.filterDataByMonth(data.dailyStats);
        const filteredCurrentYearData = this.filterDataByMonth(data.currentYearData);

        console.log(`Filtered ${filteredDailyStats.length} daily stats and ${filteredCurrentYearData.length} current year records for Rainfall chart`);

        // Filter current year data to only include records with rainfall data
        const currentYearRainfallData = filteredCurrentYearData
            .filter(d => d.Rainfall !== undefined && d.Rainfall !== null && !isNaN(d.Rainfall))
            .map(d => ({
                ...d,
                rainfall: d.Rainfall
            }));

        console.log(`Created ${currentYearRainfallData.length} current year data points with rainfall values`);

        // Set domain for scales
        // For rainfall, we'll use a bar chart, so we need to find the max rainfall value
        let yMax = 50; // Default value if no data

        if (currentYearRainfallData.length > 0) {
            const allRainfallValues = currentYearRainfallData.map(d => d.rainfall);
            const maxRainfall = Math.max(...allRainfallValues, 0); // Ensure we have a positive value

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
        let titleText = `Daily Rainfall Observation - ${stationName}`;
        if (this.currentMonth !== 'all') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            titleText += ` (${monthNames[parseInt(this.currentMonth) - 1]})`;
        }

        this.chartTitle.text(titleText);

        // Clear previous elements
        this.chart.selectAll('.rainfall-bar, .max-label')
            .remove();

        // Draw rainfall bars
        this.drawRainfallBars(currentYearRainfallData);

        // Update chart interpretation
        this.updateChartInterpretation(data.stationName, filteredDailyStats, currentYearRainfallData);
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
            console.error('Error resizing Rainfall chart:', error);
        }
    }

    /**
     * Draw rainfall bars
     * @param {Array} rainfallData - The rainfall data
     */
    drawRainfallBars(rainfallData) {
        try {
            if (!rainfallData || rainfallData.length === 0) {
                console.warn('No rainfall data available');
                return;
            }

            // Calculate bar width based on data points
            const barWidth = Math.max(2, Math.min(10, this.width / rainfallData.length / 2));

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
                    d3.select(event.target)
                        .attr('fill', '#2980b9');
                    this.tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    const formattedDate = `${d.Month}/${d.Day}/${d.Year || new Date().getFullYear()}`;
                    let tooltipContent = `
                        <div class="tooltip-date">${formattedDate}</div>
                        <div class="tooltip-item">
                            <span class="tooltip-color" style="background-color: #3498db;"></span>
                            <span class="tooltip-label">Rainfall:</span>
                            <span class="tooltip-value">${d.rainfall.toFixed(1)} mm</span>
                        </div>
                    `;
                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event) => {
                    d3.select(event.target)
                        .attr('fill', '#3498db');
                    this.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            // Find max rainfall point
            const maxRainfallPoint = rainfallData.reduce((max, current) =>
                (current.rainfall > max.rainfall) ? current : max, rainfallData[0]);

            // Add label for max rainfall point
            if (maxRainfallPoint) {
                this.chart.append('text')
                    .attr('class', 'max-label')
                    .attr('x', this.xScale(maxRainfallPoint.dayOfYear))
                    .attr('y', this.yScale(maxRainfallPoint.rainfall) - 15)
                    .attr('text-anchor', 'middle')
                    .text(`Max: ${maxRainfallPoint.rainfall.toFixed(1)}mm`);
            }

            // Calculate year range from data
            const years = rainfallData.map(d => d.Year).filter(y => y !== undefined && !isNaN(y));
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const yearRange = `${minYear}-${maxYear}`;

            // Add legend
            const legendGroup = this.chart.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${this.width - 100}, 20)`);

            const legendItems = [
                { color: '#3498db', text: `${yearRange} Rainfall` }
            ];

            legendItems.forEach((item, i) => {
                const legendRow = legendGroup.append('g')
                    .attr('transform', `translate(0, ${i * 20})`);

                legendRow.append('rect')
                    .attr('width', 15)
                    .attr('height', 15)
                    .attr('fill', item.color);

                legendRow.append('text')
                    .attr('x', 20)
                    .attr('y', 12)
                    .attr('class', 'legend-text')
                    .text(item.text);
            });

            // Update data source text
            const dataSourceText = this.chart.append('text')
                .attr('class', 'data-source')
                .attr('x', this.width - 10)
                .attr('y', this.height + this.margin.bottom - 5)
                .attr('text-anchor', 'end')
                .style('font-size', '10px')
                .style('fill', '#666')
                .text('Data source: Class A Met Station daily rainfall data');

        } catch (error) {
            console.error('Error drawing rainfall bars:', error);
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
            const chartSummary = document.getElementById('rainfall-chart-summary');
            if (!chartSummary) return;

            // Calculate statistics for current year data
            let totalRainfall = 0;
            let maxRainfall = 0;
            let maxRainfallDate = '';
            let rainyDays = 0;
            let validDataCount = 0;

            // Ensure currentYearData is an array
            const currentYearDataArray = Array.isArray(currentYearData) ? currentYearData : [];

            if (currentYearDataArray.length > 0) {
                validDataCount = currentYearDataArray.length;

                try {
                    // Calculate total rainfall - handle potential NaN values
                    totalRainfall = currentYearDataArray.reduce((sum, day) => {
                        const rainfall = day.rainfall;
                        return sum + (typeof rainfall === 'number' && !isNaN(rainfall) ? rainfall : 0);
                    }, 0);

                    // Find max rainfall
                    let maxRainfallDay = currentYearDataArray[0];
                    for (const day of currentYearDataArray) {
                        if (typeof day.rainfall === 'number' && !isNaN(day.rainfall) &&
                            (typeof maxRainfallDay.rainfall !== 'number' || day.rainfall > maxRainfallDay.rainfall)) {
                            maxRainfallDay = day;
                        }
                    }

                    if (typeof maxRainfallDay.rainfall === 'number' && !isNaN(maxRainfallDay.rainfall)) {
                        maxRainfall = maxRainfallDay.rainfall;
                        maxRainfallDate = `${maxRainfallDay.Day}-${maxRainfallDay.Month}-${maxRainfallDay.Year}`;
                    }

                    // Count rainy days (days with rainfall > 0.1mm)
                    rainyDays = currentYearDataArray.filter(day =>
                        typeof day.rainfall === 'number' && !isNaN(day.rainfall) && day.rainfall > 0.1
                    ).length;
                } catch (e) {
                    console.error('Error calculating rainfall statistics:', e);
                    // Set default values in case of error
                    totalRainfall = 0;
                    maxRainfall = 0;
                    maxRainfallDate = '';
                    rainyDays = 0;
                }
            }

            // Log the calculated values for debugging
            console.log('Rainfall Statistics:', {
                currentYear: {
                    totalRainfall,
                    maxRainfall,
                    maxRainfallDate,
                    rainyDays,
                    validDataCount
                }
            });

            // Get the station name from the UI if not provided
            const stationName = station || document.getElementById('station')?.value || 'Selected Station';

            // Get month name if filtered
            let periodText = 'all months';
            if (this.currentMonth !== 'all') {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                periodText = monthNames[parseInt(this.currentMonth) - 1];
            }

            // Create summary text
            let summary = '';

            if (validDataCount > 0) {
                try {
                    // Format numbers safely
                    const totalRainfallFormatted = typeof totalRainfall === 'number' && !isNaN(totalRainfall) ?
                        totalRainfall.toFixed(1) : '0.0';

                    const maxRainfallFormatted = typeof maxRainfall === 'number' && !isNaN(maxRainfall) ?
                        maxRainfall.toFixed(1) : '0.0';

                    summary = `
                        <p>The rainfall chart for ${stationName} during ${periodText} shows daily precipitation amounts.
                        Total rainfall recorded is ${totalRainfallFormatted}mm across ${rainyDays} rainy days.
                        ${maxRainfall > 0 ? `The highest daily rainfall was ${maxRainfallFormatted}mm recorded on ${maxRainfallDate}.` : 'No significant rainfall was recorded during this period.'}</p>
                    `;
                } catch (e) {
                    console.error('Error formatting rainfall summary:', e);
                    summary = `<p>The rainfall chart for ${stationName} during ${periodText} shows daily precipitation amounts.</p>`;
                }
            } else {
                summary = `<p>No rainfall data available for ${stationName} during ${periodText}.</p>`;
            }

            chartSummary.innerHTML = summary;

            // Update the rainfall extremes table
            const currentYearRow = document.getElementById('rainfall-current-year-extremes');
            if (currentYearRow) {
                if (validDataCount > 0) {
                    try {
                        // Format numbers safely
                        const totalRainfallFormatted = typeof totalRainfall === 'number' && !isNaN(totalRainfall) ?
                            totalRainfall.toFixed(1) : '0.0';

                        const maxRainfallFormatted = typeof maxRainfall === 'number' && !isNaN(maxRainfall) ?
                            maxRainfall.toFixed(1) : '0.0';

                        currentYearRow.innerHTML = `
                            <td>Current Year</td>
                            <td>${maxRainfallFormatted}mm</td>
                            <td>${maxRainfallDate || '--'}</td>
                            <td>${rainyDays}</td>
                            <td>${totalRainfallFormatted}mm</td>
                        `;
                    } catch (e) {
                        console.error('Error updating rainfall extremes table:', e);
                        // If error occurs, show dashes
                        currentYearRow.innerHTML = `
                            <td>Current Year</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                        `;
                    }
                } else {
                    // If no valid data, show dashes
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
            console.error('Error updating rainfall chart interpretation:', error);

            // Set a simple message if interpretation fails
            const summaryElement = document.getElementById('rainfall-chart-summary');
            if (summaryElement) {
                summaryElement.textContent = `Data loaded for ${station || 'selected station'}. Select a station and month to view details.`;
            }
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
        let csvContent = 'Day,Month,DayOfYear,TotalRainfall,MaxRainfall,MaxRainfallYear\n';

        this.currentData.dailyStats.forEach(stat => {
            csvContent += `${stat.day},${stat.month},${stat.dayOfYear},${stat.rainfallTotal || ''},${stat.rainfallMax || ''},${stat.rainfallMaxYear || ''}\n`;
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
     * Download the chart as a PNG image with legend
     */
    downloadChart() {
        try {
            // Get the current station from the UI
            const stationSelect = document.getElementById('station');
            const station = stationSelect ? stationSelect.value : 'station';

            // Get the SVG element
            const svgElement = document.querySelector('#rainfall-chart svg');
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
                .rainfall-bar { fill: #3498db; }
                .rainfall-bar:hover { fill: #2980b9; }
                .max-label { font-size: 12px; font-weight: bold; fill: #e74c3c; }
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

            // Update legend items with actual year range
            const years = this.currentData.map(d => d.Year).filter(y => y !== undefined && !isNaN(y));
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const yearRange = `${minYear}-${maxYear}`;

            const legendItems = [
                { color: '#3498db', text: `${yearRange} Rainfall` }
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

            // Update data source text in the downloaded chart
            const dataSourceText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            dataSourceText.setAttribute('class', 'data-source');
            dataSourceText.setAttribute('x', width - 10);
            dataSourceText.setAttribute('y', height - 5);
            dataSourceText.setAttribute('text-anchor', 'end');
            dataSourceText.setAttribute('style', 'font-size: 10px; fill: #666;');
            dataSourceText.textContent = 'Data source: Class A Met Station daily rainfall data';
            tempSvg.appendChild(dataSourceText);

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
                link.download = `${station}_daily_rainfall_chart.png`;
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
            console.error('Error downloading rainfall chart:', error);
            alert('Error downloading chart. Please check the console for details.');
        }
    }
}
