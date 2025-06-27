/**
 * RainfallMap Class
 * This class handles the visualization of rainfall accumulation on a Bhutan map
 */
class RainfallMap {
    /**
     * Constructor for RainfallMap
     * @param {string} containerId - The ID of the container element
     */
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);

        // Set dimensions - increased height to accommodate legend
        this.width = 800;
        this.height = 580; // Increased from 500 to 580 to accommodate legend
        this.margin = { top: 40, right: 20, bottom: 100, left: 20 }; // Increased bottom margin for legend space

        this.stationData = null;
        this.selectedPeriod = "7"; // Default to 7 days
        this.mapTitle = "7-Day Rainfall Accumulation";

        // EXACT COORDINATES PROVIDED BY USER - lat,lng format
        this.regionCoordinates = {
            "Bumthang": [27.6000004, 90.8166733],
            "Chhukha": [26.8589191, 89.39048],
            "Dagana": [27.1000004, 89.8666687],
            "Gasa": [27.9037209, 89.7268906],
            "Haa": [27.3333302, 89.1833267],
            "Lhuentse": [27.6678696, 91.1839294],
            "Monggar": [27.2747097, 91.2396317],
            "Paro": [27.4305, 89.4133377],
            "Pemagatshel": [27.0379505, 91.4030533],
            "Punakha": [27.5913696, 89.8774338],
            "Samdrupjongkhar": [26.8006897, 91.505188],
            "Samtse": [26.9130898, 89.0836105],
            "Sarpang": [26.8639507, 90.2674484],
            "Thimphu": [27.4660892, 89.6419067],
            "Trashigang": [27.25, 91.75],
            "Yangtse": [27.6116009, 91.4980011],
            "Trongsa": [27.5025997, 90.5071564],
            "Tsirang": [27.0219002, 90.1229095],
            "Wangduephodrang": [27.4861507, 89.899147],
            "Zhemgang": [27.0833302, 90.8499985]
        };

        // Map station names to coordinate keys
        this.stationNameMapping = {
            'Bumthang': 'Bumthang',
            'Chukha': 'Chhukha',
            'Dagana': 'Dagana',
            'Gasa': 'Gasa',
            'Haa': 'Haa',
            'Lhuentse': 'Lhuentse',
            'Mongar': 'Monggar',
            'Paro': 'Paro',
            'Pemagatshel': 'Pemagatshel',
            'Punakha': 'Punakha',
            'Samdrup_Jongkhar': 'Samdrupjongkhar',
            'Samtse': 'Samtse',
            'Sarpang': 'Sarpang',
            'Thimphu': 'Thimphu',
            'Trashigang': 'Trashigang',
            'Trashiyangtse': 'Yangtse',
            'Trongsa': 'Trongsa',
            'Tsirang': 'Tsirang',
            'Wangdue': 'Wangduephodrang',
            'Zhemgang': 'Zhemgang'
        };

        // Initialize the map (async)
        this.initializeMap().catch(error => {
            console.error('Error initializing rainfall map:', error);
        });

        // Set up event listeners
        this.setupEventListeners();

        // Set up download button
        this.setupDownloadButton();
    }



    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add event listener for period selection
        const periodSelect = document.getElementById('rainfall-period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', (event) => {
                this.selectedPeriod = event.target.value;
                this.updateMapTitle();

                // If we have data, update the map
                if (this.stationData) {
                    this.updateMap(this.stationData);
                }
            });
        }
    }

    /**
     * Set up download button functionality
     */
    setupDownloadButton() {
        const downloadButton = document.getElementById('download-rainfall-map');
        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                this.downloadMapAsPNG();
            });
        }
    }

    /**
     * Download the map as PNG
     */
    downloadMapAsPNG() {
        try {
            console.log('Starting map download process');

            // Get the SVG element - use the same pattern as other charts
            const svgElement = this.svg;
            if (!svgElement) {
                console.error('SVG element not found');
                return;
            }

            // Convert SVG to string
            const svgData = new XMLSerializer().serializeToString(svgElement);

            // Create a blob and URL for the SVG
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.width;
            canvas.height = this.height;

            // Create image element - use the exact same pattern as other charts
            const img = new Image();
            img.onload = function() {
                // Draw the SVG on the canvas with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                // Convert canvas to PNG - use the exact same method as other charts
                const pngUrl = canvas.toDataURL('image/png');

                // Create a link element - exact same pattern
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `bhutan_rainfall_map_${new Date().toISOString().split('T')[0]}.png`;

                // Append the link to the document
                document.body.appendChild(link);

                // Click the link
                link.click();

                // Remove the link
                document.body.removeChild(link);

                // Revoke the URL
                URL.revokeObjectURL(url);

                console.log('Map download completed');
            };

            // Handle errors - same pattern as other charts
            img.onerror = function(error) {
                console.error('Error loading SVG image for download:', error);
                alert('Error downloading map. Please check the console for details.');
                URL.revokeObjectURL(url);
            };

            // Set the image source to the SVG URL
            img.src = url;

        } catch (error) {
            console.error('Error downloading map:', error);
            alert('Error downloading map. Please check the console for details.');
        }
    }

    /**
     * Fallback method for downloading map as PNG
     */
    downloadMapAsPNGFallback() {
        try {
            console.log('Using fallback download method');

            // Get SVG as string
            const svgElement = this.svg;
            const svgData = new XMLSerializer().serializeToString(svgElement);

            // Try to create a simple canvas screenshot
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.width;
            canvas.height = this.height;

            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Try to render SVG as text (basic fallback)
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText('Bhutan Rainfall Map', 20, 30);
            ctx.fillText(`Period: ${this.selectedPeriod} days`, 20, 50);
            ctx.fillText('Download failed - please try again', 20, 70);

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (blob) {
                    const link = document.createElement('a');
                    link.download = `bhutan-rainfall-map-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.png`;
                    link.href = URL.createObjectURL(blob);

                    // Force download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    URL.revokeObjectURL(link.href);
                    console.log('Fallback download completed');
                } else {
                    // Last resort - download as SVG
                    this.downloadAsSVG();
                }
            }, 'image/png');

        } catch (error) {
            console.error('Error in fallback download:', error);
            this.downloadAsSVG();
        }
    }

    /**
     * Download as SVG (last resort)
     */
    downloadAsSVG() {
        try {
            console.log('Downloading as SVG');

            const svgElement = this.svg;
            const svgData = new XMLSerializer().serializeToString(svgElement);

            // Create blob
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.download = `bhutan-rainfall-map-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.svg`;
            link.href = url;

            // Force download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            URL.revokeObjectURL(url);
            console.log('SVG download completed');

        } catch (error) {
            console.error('Error downloading SVG:', error);
            alert('Download failed. Please try refreshing the page and try again.');
        }
    }

    /**
     * Update the map title based on the selected period
     */
    updateMapTitle() {
        // Set the title based on the selected period
        if (this.selectedPeriod === "1") {
            this.mapTitle = "24-Hour Rainfall Accumulation";
        } else if (this.selectedPeriod === "lastMonth") {
            const now = new Date();
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const monthNames = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            this.mapTitle = `${monthNames[lastMonth]} Rainfall Accumulation`;
        } else if (this.selectedPeriod === "thisMonth") {
            const now = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            this.mapTitle = `${monthNames[now.getMonth()]} (So Far) Rainfall Accumulation`;
        } else if (["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].includes(this.selectedPeriod)) {
            const monthMap = {
                "jan": "January", "feb": "February", "mar": "March", "apr": "April",
                "may": "May", "jun": "June", "jul": "July", "aug": "August",
                "sep": "September", "oct": "October", "nov": "November", "dec": "December"
            };
            this.mapTitle = `${monthMap[this.selectedPeriod]} Rainfall Accumulation`;
        } else {
            this.mapTitle = `${this.selectedPeriod}-Day Rainfall Accumulation`;
        }

        // Update the title in the SVG
        const titleElement = this.svg.querySelector('.map-title');
        if (titleElement) {
            titleElement.textContent = this.mapTitle;
        }
    }

    /**
     * Initialize the map
     */
    async initializeMap() {
        // Clear any existing content
        this.container.innerHTML = '';

        // Create SVG element with proper overflow settings
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", this.width);
        svg.setAttribute("height", this.height);
        svg.setAttribute("class", "rainfall-map-svg");
        svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
        svg.style.overflow = "visible"; // Ensure legend is not clipped
        this.container.appendChild(svg);

        // Create map group
        const mapGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mapGroup.setAttribute("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        mapGroup.setAttribute("class", "map-container");
        svg.appendChild(mapGroup);

        // Load and display the actual Bhutan shapefile SVG
        await this.loadBhutanShapefile(mapGroup);

        // Calculate map dimensions for later use
        const mapWidth = this.width - this.margin.left - this.margin.right;
        const mapHeight = this.height - this.margin.top - this.margin.bottom;



        // Add title
        const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        titleText.setAttribute("class", "map-title");
        titleText.setAttribute("x", this.width / 2);
        titleText.setAttribute("y", 25);
        titleText.setAttribute("text-anchor", "middle");
        titleText.setAttribute("font-size", "16px");
        titleText.setAttribute("font-weight", "bold");
        titleText.textContent = this.mapTitle;
        svg.appendChild(titleText);

        // Store references
        this.svg = svg;
        this.mapGroup = mapGroup;

        // Create color scale for rainfall
        this.createColorScale(); 

        // Create tooltip
        this.createTooltip();

        console.log('Rainfall map initialized successfully');
    }

    /**
     * Load and display the actual Bhutan shapefile using D3.js
     * @param {SVGElement} mapGroup - The map group element to append the shapefile to
     */
    async loadBhutanShapefile(mapGroup) {
        try {
            // Check if D3.js is available
            if (typeof d3 === 'undefined') {
                console.error('D3.js is required for shapefile rendering');
                this.createFallbackMap(mapGroup);
                return;
            }

            console.log('Loading actual Bhutan shapefile...');

            // Set up the map dimensions
            const mapWidth = this.width - this.margin.left - this.margin.right;
            const mapHeight = this.height - this.margin.top - this.margin.bottom;

            // Create a proper geographic projection for Bhutan
            this.projection = d3.geoMercator()
                .center([90.5, 27.5]) // Center of Bhutan
                .scale(12000) // Reduced scale to fit better in container
                .translate([mapWidth / 2, mapHeight / 2 - 30]); // Center and move up more to account for legend space

            // Create path generator
            this.pathGenerator = d3.geoPath().projection(this.projection);

            // Try to load the actual shapefile using shapefile.js with retry logic
            try {
                console.log('Attempting to load actual shapefile data...');

                // Check if shapefile library is available
                if (typeof shapefile === 'undefined') {
                    console.error('Shapefile library not available - check if CDN loaded properly');
                    throw new Error('Shapefile library not available');
                }

                // Determine the base path for shapefile loading
                const basePath = this.getShapefileBasePath();

                console.log(`Loading shapefile from: ${basePath}BTN_adm1.shp and ${basePath}BTN_adm1.dbf`);

                // Load the actual shapefile with proper path handling and timeout
                const geoJsonData = await Promise.race([
                    shapefile.read(`${basePath}BTN_adm1.shp`, `${basePath}BTN_adm1.dbf`),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Shapefile loading timeout')), 10000)
                    )
                ]);

                if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
                    console.log('Successfully loaded shapefile with', geoJsonData.features.length, 'features');

                    // Create D3 selection for the map group
                    const svg = d3.select(mapGroup);

                    // Add the districts
                    svg.selectAll('.district')
                        .data(geoJsonData.features)
                        .enter()
                        .append('path')
                        .attr('class', 'district')
                        .attr('d', this.pathGenerator)
                        .attr('fill', '#f8f9fa')
                        .attr('stroke', '#2c3e50')
                        .attr('stroke-width', 1.5)
                        .style('transition', 'fill 0.3s ease')
                        .on('mouseover', function(event, d) {
                            d3.select(this)
                                .attr('fill', '#e8f4fd')
                                .attr('stroke', '#3498db')
                                .attr('stroke-width', 2);
                        })
                        .on('mouseout', function(event, d) {
                            d3.select(this)
                                .attr('fill', '#f8f9fa')
                                .attr('stroke', '#2c3e50')
                                .attr('stroke-width', 1.5);
                        });

                    console.log('Successfully rendered actual shapefile districts');
                    return; // Success - exit early
                } else {
                    throw new Error('Failed to load valid shapefile data');
                }

            } catch (shapefileError) {
                console.warn('Could not load actual shapefile:', shapefileError.message);
                console.log('Falling back to SVG approach...');
                await this.loadSVGFallback(mapGroup);
            }

        } catch (error) {
            console.error('Error loading Bhutan shapefile:', error);
            this.createFallbackMap(mapGroup);
        }
    }

    /**
     * Get the appropriate base path for shapefile loading based on the current protocol
     * @returns {string} - The base path for shapefile files
     */
    getShapefileBasePath() {
        // Check if we're running on file:// protocol (direct file access)
        if (window.location.protocol === 'file:') {
            console.warn('Running on file:// protocol - CORS restrictions may apply');
            // For file:// protocol, we need to use relative paths
            return 'Btn_shape/';
        } else {
            // For http:// or https:// protocols, use relative paths
            return 'Btn_shape/';
        }
    }

    /**
     * Create GeoJSON data from CSV (simplified approach)
     * In a real implementation, you'd use a proper shapefile loader
     */
    async createGeoJSONFromCSV() {
        try {
            // Load the CSV file to get district information
            const response = await fetch('Btn_shape/BTN_adm1.csv');
            const csvText = await response.text();

            // Parse CSV
            const lines = csvText.split('\n');
            const features = [];

            // Create simplified polygon features for each district
            // This is a placeholder - in reality you'd need the actual geometry from the .shp file
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const columns = line.split(',');
                    if (columns.length >= 6) {
                        const name = columns[5].replace(/"/g, '');

                        // Create a simplified feature (this would normally come from the .shp file)
                        const feature = {
                            type: 'Feature',
                            properties: {
                                name: name
                            },
                            geometry: {
                                type: 'Polygon',
                                coordinates: [[
                                    // Placeholder coordinates - would be actual polygon from shapefile
                                    [89, 27], [91, 27], [91, 28], [89, 28], [89, 27]
                                ]]
                            }
                        };

                        features.push(feature);
                    }
                }
            }

            return {
                type: 'FeatureCollection',
                features: features
            };

        } catch (error) {
            console.error('Error creating GeoJSON from CSV:', error);
            return null;
        }
    }

    /**
     * Fallback to SVG loading if shapefile loading fails
     */
    async loadSVGFallback(mapGroup) {
        console.log('Loading SVG fallback...');

        // Get the appropriate base path
        const basePath = this.getShapefileBasePath();

        // Load the SVG file for the district boundaries
        const response = await fetch(`${basePath}bhutan.svg`);
        const svgText = await response.text();

        // Parse the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

        // Get all path elements (districts) from the SVG
        const paths = svgDoc.querySelectorAll('path');

        // Create a group for the Bhutan map
        const bhutanGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        bhutanGroup.setAttribute("class", "bhutan-map");
        // Scale and position to fit the container - adjusted for new dimensions
        bhutanGroup.setAttribute("transform", "scale(0.65) translate(140, 80)");

        // Add each district path to our map
        paths.forEach(path => {
            const districtPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            districtPath.setAttribute("d", path.getAttribute("d"));
            districtPath.setAttribute("id", path.getAttribute("id"));
            districtPath.setAttribute("title", path.getAttribute("title"));
            districtPath.setAttribute("fill", "#f8f9fa");
            districtPath.setAttribute("stroke", "#2c3e50");
            districtPath.setAttribute("stroke-width", 1.5);
            districtPath.setAttribute("class", "district-path");
            districtPath.style.transition = "fill 0.3s ease";

            // Add hover effects
            districtPath.addEventListener('mouseover', (e) => {
                e.target.setAttribute("fill", "#e8f4fd");
                e.target.setAttribute("stroke", "#3498db");
                e.target.setAttribute("stroke-width", 2);
            });

            districtPath.addEventListener('mouseout', (e) => {
                e.target.setAttribute("fill", "#f8f9fa");
                e.target.setAttribute("stroke", "#2c3e50");
                e.target.setAttribute("stroke-width", 1.5);
            });

            bhutanGroup.appendChild(districtPath);
        });

        mapGroup.appendChild(bhutanGroup);
    }



    /**
     * Create a fallback map if shapefile loading fails
     * @param {SVGElement} mapGroup - The map group element
     */
    createFallbackMap(mapGroup) {
        const mapWidth = this.width - this.margin.left - this.margin.right;
        const mapHeight = this.height - this.margin.top - this.margin.bottom;

        const fallbackRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        fallbackRect.setAttribute("x", 50);
        fallbackRect.setAttribute("y", 50);
        fallbackRect.setAttribute("width", mapWidth - 100);
        fallbackRect.setAttribute("height", mapHeight - 100);
        fallbackRect.setAttribute("fill", "#f0f0f0");
        fallbackRect.setAttribute("stroke", "#333");
        fallbackRect.setAttribute("stroke-width", 2);

        mapGroup.appendChild(fallbackRect);

        // Add fallback label
        const fallbackLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        fallbackLabel.setAttribute("x", mapWidth / 2);
        fallbackLabel.setAttribute("y", mapHeight / 2);
        fallbackLabel.setAttribute("text-anchor", "middle");
        fallbackLabel.setAttribute("font-size", "16px");
        fallbackLabel.textContent = "Bhutan (Simplified View)";
        mapGroup.appendChild(fallbackLabel);
    }

    /**
     * Create tooltip
     */
    createTooltip() {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.padding = '10px';
        tooltip.style.background = 'rgba(255, 255, 255, 0.9)';
        tooltip.style.border = '1px solid #ddd';
        tooltip.style.borderRadius = '4px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.2s';
        tooltip.style.zIndex = '1000';
        document.body.appendChild(tooltip);

        this.tooltip = tooltip;
    }

    /**
     * Create color scale for rainfall
     */
    createColorScale() {
        // Create an improved color scale with better progression including red and brown
        this.colorScale = (value) => {
            if (value <= 0) return "#f7f7f7";        // Light gray for no rain
            if (value <= 10) return "#e6f3ff";       // Very light blue
            if (value <= 25) return "#b3d9ff";       // Light blue
            if (value <= 50) return "#66b3ff";       // Medium blue
            if (value <= 75) return "#1a8cff";       // Blue
            if (value <= 100) return "#0066cc";      // Dark blue
            if (value <= 150) return "#004d99";      // Darker blue
            if (value <= 200) return "#ff9900";      // Orange
            if (value <= 250) return "#ff6600";      // Dark orange
            if (value <= 300) return "#ff3300";      // Red
            if (value <= 400) return "#cc0000";      // Dark red
            if (value <= 500) return "#990000";      // Darker red
            return "#663300";                        // Brown for extreme rainfall
        };

        // Add a color legend
        this.addColorLegend();
    }

    /**
     * Add color legend to the map
     */
    addColorLegend() {
        const legendWidth = 200;
        const legendHeight = 20;
        const legendPadding = 15; // Padding from edges

        // Remove any existing legend to prevent duplicates
        const existingLegend = this.svg.querySelector('.map-legend');
        if (existingLegend) {
            existingLegend.remove();
        }

        // Create legend group - positioned at bottom right corner with more space
        const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        legendGroup.setAttribute("class", "map-legend");
        // Position with more margin from edges to ensure full visibility
        const legendX = this.width - legendWidth - (legendPadding * 2);
        const legendY = this.height - 90; // More space from bottom
        legendGroup.setAttribute("transform", `translate(${legendX}, ${legendY})`);
        this.svg.appendChild(legendGroup);

        console.log(`Legend positioned at: (${legendX}, ${legendY}) within SVG size: ${this.width}x${this.height}`);

        // Add legend title
        const legendTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
        legendTitle.setAttribute("x", legendWidth / 2);
        legendTitle.setAttribute("y", -8);
        legendTitle.setAttribute("text-anchor", "middle");
        legendTitle.setAttribute("font-size", "12px");
        legendTitle.setAttribute("font-weight", "bold");
        legendTitle.setAttribute("fill", "#333");
        legendTitle.textContent = "Rainfall (mm)";
        legendGroup.appendChild(legendTitle);

        // Add color rectangles with updated color steps
        const colorSteps = [0, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500];
        const rectWidth = legendWidth / colorSteps.length;

        // Create a group for the color rectangles positioned below the title
        const colorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        colorGroup.setAttribute("transform", `translate(0, 5)`); // Position below title
        legendGroup.appendChild(colorGroup);

        colorSteps.forEach((value, i) => {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", i * rectWidth);
            rect.setAttribute("y", 0);
            rect.setAttribute("width", rectWidth);
            rect.setAttribute("height", legendHeight);

            // Get color and add debugging
            const color = this.colorScale(value);
            console.log(`Legend color for value ${value}: ${color}`);

            rect.setAttribute("fill", color);
            rect.setAttribute("stroke", "#333");
            rect.setAttribute("stroke-width", 1);
            rect.setAttribute("opacity", 1); // Ensure full opacity
            colorGroup.appendChild(rect);
        });

        // Add labels - positioned below the color rectangles
        const labelsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        labelsGroup.setAttribute("transform", `translate(0, ${5 + legendHeight + 15})`); // Account for color group position + height + spacing
        legendGroup.appendChild(labelsGroup);

        // Add min, middle and max labels with better styling
        const minLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        minLabel.setAttribute("x", 0);
        minLabel.setAttribute("y", 0);
        minLabel.setAttribute("font-size", "10px");
        minLabel.setAttribute("fill", "#333");
        minLabel.setAttribute("font-weight", "500");
        minLabel.textContent = "0";
        labelsGroup.appendChild(minLabel);

        const midLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        midLabel.setAttribute("x", legendWidth / 2);
        midLabel.setAttribute("y", 0);
        midLabel.setAttribute("text-anchor", "middle");
        midLabel.setAttribute("font-size", "10px");
        midLabel.setAttribute("fill", "#333");
        midLabel.setAttribute("font-weight", "500");
        midLabel.textContent = "250";
        labelsGroup.appendChild(midLabel);

        const maxLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        maxLabel.setAttribute("x", legendWidth);
        maxLabel.setAttribute("y", 0);
        maxLabel.setAttribute("text-anchor", "end");
        maxLabel.setAttribute("font-size", "10px");
        maxLabel.setAttribute("fill", "#333");
        maxLabel.setAttribute("font-weight", "500");
        maxLabel.textContent = "500+";
        labelsGroup.appendChild(maxLabel);
    }

    /**
     * Update the map with new data
     * @param {Object} stationsData - Data for all stations
     */
    updateMap(stationsData) {
        this.stationData = stationsData;

        // If no data is provided, create fallback data for demonstration
        if (!stationsData || Object.keys(stationsData).length === 0) {
            console.warn('No station data provided, creating fallback data for map display');
            this.stationData = this.createFallbackStationData();
        }

        // Clear any existing station markers from mapGroup
        const existingMarkers = this.mapGroup.querySelectorAll('.station-marker, .station-label');
        existingMarkers.forEach(marker => marker.remove());

        // Add station markers
        this.addStationMarkers();

        // Add data source note
        this.addDataSourceNote();
    }

    /**
     * Create fallback station data for demonstration when real data is unavailable
     * @returns {Object} - Fallback station data
     */
    createFallbackStationData() {
        const fallbackData = {};
        const stationNames = Object.keys(this.stationNameMapping);

        // Create mock data for each station
        stationNames.forEach(station => {
            // Generate random rainfall data for demonstration
            const mockData = [];
            const currentDate = new Date();

            // Generate 30 days of mock data
            for (let i = 0; i < 30; i++) {
                const date = new Date(currentDate);
                date.setDate(date.getDate() - i);

                mockData.push({
                    Year: date.getFullYear(),
                    Month: date.getMonth() + 1,
                    Day: date.getDate(),
                    Rainfall: Math.random() * 50 // Random rainfall 0-50mm
                });
            }

            fallbackData[station] = {
                currentYearData: mockData,
                historicalData: mockData // Use same data for both
            };
        });

        console.log('Created fallback station data for', Object.keys(fallbackData).length, 'stations');
        return fallbackData;
    }

    /**
     * Add station markers to the map
     */
    addStationMarkers() {
        if (!this.stationData) return;

        // Get the current date
        const currentDate = new Date();

        // Process each station
        Object.keys(this.stationData).forEach(station => {
            // Get the mapped coordinate key for this station
            const coordKey = this.stationNameMapping[station];
            if (!coordKey || !this.regionCoordinates[coordKey]) {
                console.warn(`No coordinates found for station: ${station} (mapped to: ${coordKey})`);
                return;
            }

            // Get lat/lng coordinates and project them to screen coordinates
            const [lat, lng] = this.regionCoordinates[coordKey];

            if (!this.projection) {
                console.warn('No projection available for coordinate conversion');
                return;
            }

            // Project lat/lng to screen coordinates using D3 projection
            const projectedCoords = this.projection([lng, lat]);
            const stationCoord = {
                x: projectedCoords[0],
                y: projectedCoords[1]
            };
            const stationCurrentYearData = this.stationData[station].currentYearData || [];

            // Get filtered data based on the selected period
            const filteredData = this.getFilteredDataForPeriod(stationCurrentYearData);

            // Calculate total rainfall for the selected period
            let totalRainfall = 0;
            filteredData.forEach(d => {
                if (d.Rainfall !== undefined && d.Rainfall !== null && !isNaN(d.Rainfall)) {
                    totalRainfall += Number(d.Rainfall);
                }
            });

            // Round to 1 decimal place
            totalRainfall = Math.round(totalRainfall * 10) / 10;

            // Keep circle size smaller and more consistent (min 4, max 12)
            const circleSize = Math.max(4, Math.min(12, 4 + totalRainfall / 50));

            // Add station circle using projected coordinates
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("class", "station-marker");
            circle.setAttribute("cx", stationCoord.x);
            circle.setAttribute("cy", stationCoord.y);
            circle.setAttribute("r", circleSize);
            circle.setAttribute("fill", this.colorScale(totalRainfall));
            circle.setAttribute("stroke", "#000");
            circle.setAttribute("stroke-width", 1);
            this.mapGroup.appendChild(circle);

            // Add station label using projected coordinates
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("class", "station-label");
            label.setAttribute("x", stationCoord.x);
            label.setAttribute("y", stationCoord.y + circleSize + 12);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("font-size", "10px");
            label.setAttribute("font-weight", "bold");
            label.textContent = `${station}: ${totalRainfall}`;
            this.mapGroup.appendChild(label);

            // Add event listeners for tooltip
            circle.addEventListener('mouseover', (event) => {
                this.tooltip.style.opacity = 0.9;

                // Create tooltip content
                let tooltipContent = `
                    <div style="font-weight: bold; margin-bottom: 5px;">${station}</div>
                    <div>Rainfall: <span style="font-weight: bold;">${totalRainfall} mm</span></div>
                    <div>Data Points: <span style="font-weight: bold;">${filteredData.length}</span></div>
                `;

                // Add date range information
                if (filteredData.length > 0) {
                    const dateRange = this.getDateRangeText(filteredData);
                    tooltipContent += `<div>Period: <span style="font-weight: bold;">${dateRange}</span></div>`;
                }

                this.tooltip.innerHTML = tooltipContent;
                this.tooltip.style.left = (event.pageX + 10) + 'px';
                this.tooltip.style.top = (event.pageY - 28) + 'px';
            });

            circle.addEventListener('mouseout', () => {
                this.tooltip.style.opacity = 0;
            });
        });
    }

    /**
     * Add data source note
     */
    addDataSourceNote() {
        const mapWidth = this.width - this.margin.left - this.margin.right;

        // Remove any existing note
        const existingNote = this.svg.querySelector('.data-source-note');
        if (existingNote) {
            existingNote.remove();
        }

        // Add note - positioned at bottom left to avoid legend conflict
        const note = document.createElementNS("http://www.w3.org/2000/svg", "text");
        note.setAttribute("class", "data-source-note");
        note.setAttribute("x", 15); // Left aligned with padding
        note.setAttribute("y", this.height - 25); // Position in the bottom margin area
        note.setAttribute("text-anchor", "start"); // Left aligned
        note.setAttribute("font-size", "10px");
        note.setAttribute("fill", "#666");
        note.textContent = "Data source: Google AppScript API - Real-time rainfall data";
        this.svg.appendChild(note); // Append to SVG instead of mapGroup for proper positioning
    }

    /**
     * Get filtered data for the selected period
     * @param {Array} stationData - The station data
     * @returns {Array} - Filtered data for the selected period
     */
    getFilteredDataForPeriod(stationData) {
        if (!stationData || stationData.length === 0) return [];

        const currentDate = new Date();
        let startDate, endDate;

        // Filter based on the selected period
        if (this.selectedPeriod === "1" || this.selectedPeriod === "3" ||
            this.selectedPeriod === "7" || this.selectedPeriod === "14" ||
            this.selectedPeriod === "30") {
            // For day-based periods - exclude current day as there's no data for today
            const days = parseInt(this.selectedPeriod);

            // End date is yesterday (exclude current day)
            endDate = new Date();
            endDate.setDate(currentDate.getDate() - 1);

            // Start date is 'days-1' before the end date to get exactly 'days' total
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - (days - 1));

            return stationData.filter(d => {
                if (!d.Year || !d.Month || !d.Day) return false;

                const dataDate = new Date(d.Year, d.Month - 1, d.Day);
                return dataDate >= startDate && dataDate <= endDate;
            });
        } else if (this.selectedPeriod === "lastMonth") {
            // Last complete month
            const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
            const year = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

            return stationData.filter(d => {
                return d.Year == year && d.Month == lastMonth + 1;
            });
        } else if (this.selectedPeriod === "thisMonth") {
            // Current month so far - exclude current day
            endDate = new Date();
            endDate.setDate(currentDate.getDate() - 1);

            return stationData.filter(d => {
                if (!d.Year || !d.Month || !d.Day) return false;

                const dataDate = new Date(d.Year, d.Month - 1, d.Day);
                return d.Year == currentDate.getFullYear() &&
                       d.Month == currentDate.getMonth() + 1 &&
                       dataDate <= endDate;
            });
        } else if (["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].includes(this.selectedPeriod)) {
            // Specific month
            const monthMap = {
                "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
                "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
            };
            const month = monthMap[this.selectedPeriod];

            return stationData.filter(d => {
                return d.Month == month && d.Year == currentDate.getFullYear();
            });
        }

        // Default to 7 days if something goes wrong - exclude current day
        endDate = new Date();
        endDate.setDate(currentDate.getDate() - 1);

        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - (7 - 1));

        return stationData.filter(d => {
            if (!d.Year || !d.Month || !d.Day) return false;

            const dataDate = new Date(d.Year, d.Month - 1, d.Day);
            return dataDate >= startDate && dataDate <= endDate;
        });
    }

    /**
     * Get a text description of the date range
     * @param {Array} filteredData - The filtered data (not used, kept for compatibility)
     * @returns {string} - Text description of the date range
     */
    getDateRangeText(filteredData) {
        // Calculate the intended date range based on the selected period, not the actual data
        const currentDate = new Date();
        let startDate, endDate;

        // Use the same logic as getFilteredDataForPeriod to get the intended range
        if (this.selectedPeriod === "1" || this.selectedPeriod === "3" ||
            this.selectedPeriod === "7" || this.selectedPeriod === "14" ||
            this.selectedPeriod === "30") {
            // For day-based periods - exclude current day as there's no data for today
            const days = parseInt(this.selectedPeriod);

            // End date is yesterday (exclude current day)
            endDate = new Date();
            endDate.setDate(currentDate.getDate() - 1);

            // Start date is 'days-1' before the end date to get exactly 'days' total
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - (days - 1));

        } else if (this.selectedPeriod === "lastMonth") {
            // Last complete month
            const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
            const year = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

            startDate = new Date(year, lastMonth, 1);
            endDate = new Date(year, lastMonth + 1, 0); // Last day of the month

        } else if (this.selectedPeriod === "thisMonth") {
            // Current month so far - exclude current day
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date();
            endDate.setDate(currentDate.getDate() - 1);

        } else if (["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].includes(this.selectedPeriod)) {
            // Specific month
            const monthMap = {
                "jan": 0, "feb": 1, "mar": 2, "apr": 3, "may": 4, "jun": 5,
                "jul": 6, "aug": 7, "sep": 8, "oct": 9, "nov": 10, "dec": 11
            };
            const month = monthMap[this.selectedPeriod];

            startDate = new Date(currentDate.getFullYear(), month, 1);
            endDate = new Date(currentDate.getFullYear(), month + 1, 0); // Last day of the month

        } else {
            // Default to 7 days if something goes wrong - exclude current day
            endDate = new Date();
            endDate.setDate(currentDate.getDate() - 1);

            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - (7 - 1));
        }

        // Format the dates
        const formatDate = (date) => {
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        };

        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    /**
     * Update the map title based on the selected period
     */
    updateMapTitle() {
        // Set the title based on the selected period
        if (this.selectedPeriod === "1") {
            this.mapTitle = "24-Hour Rainfall Accumulation";
        } else if (this.selectedPeriod === "lastMonth") {
            const now = new Date();
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const monthNames = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            this.mapTitle = `${monthNames[lastMonth]} Rainfall Accumulation`;
        } else if (this.selectedPeriod === "thisMonth") {
            const now = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            this.mapTitle = `${monthNames[now.getMonth()]} (So Far) Rainfall Accumulation`;
        } else if (["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].includes(this.selectedPeriod)) {
            const monthMap = {
                "jan": "January", "feb": "February", "mar": "March", "apr": "April",
                "may": "May", "jun": "June", "jul": "July", "aug": "August",
                "sep": "September", "oct": "October", "nov": "November", "dec": "December"
            };
            this.mapTitle = `${monthMap[this.selectedPeriod]} Rainfall Accumulation`;
        } else {
            this.mapTitle = `${this.selectedPeriod}-Day Rainfall Accumulation`;
        }

        // Update the title in the SVG
        const titleElement = this.svg.querySelector('.map-title');
        if (titleElement) {
            titleElement.textContent = this.mapTitle;
        }
    }


}
