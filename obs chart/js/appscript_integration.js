/**
 * Google Apps Script Integration for Temperature Charts - OPTIMIZED VERSION
 *
 * This file provides functions to fetch data from the Google Apps Script web apps
 * and process the data for visualization with performance optimizations.
 *
 * PERFORMANCE IMPROVEMENTS:
 * - Increased concurrent requests from 1 to 5
 * - Reduced batch delay from 2000ms to 500ms
 * - Reduced fetch timeout from 180s to 60s
 * - Added persistent localStorage caching with 2-hour expiry
 * - Reduced console logging (disabled by default)
 * - Added performance monitoring
 *
 * USAGE:
 * // Enable debug mode for development
 * dataProcessor.enableDebugMode();
 *
 * // Configure performance settings
 * dataProcessor.configurePerformance({
 *     maxConcurrentRequests: 8,  // Increase for faster loading
 *     batchDelay: 200,           // Reduce for faster processing
 *     fetchTimeout: 45000,       // Reduce timeout
 *     cacheExpiryHours: 1        // Shorter cache for development
 * });
 *
 * // Clear cache if needed
 * dataProcessor.clearCache();
 */

class AppScriptDataProcessor {
    constructor() {
        // Google Apps Script web app URLs
        this.HISTORICAL_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbymNbbSedbEMk0IeMfO7DFRwvosj8aMtRwPHN76UH16tUFA7Z_IlDW88VTEykzMTVbFgQ/exec';
        this.CURRENT_YEAR_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzxQ2_a8CRgRowBylQvnpHash-RQTaHqAK8PCiiLfza2DBDpVEbA9U0HudwJ2lihGWg3w/exec';

        // Performance optimizations
        this.DEBUG_MODE = false; // Set to false to reduce logging
        this.MAX_CONCURRENT_REQUESTS = 5; // Increased from 1 for better performance
        this.BATCH_DELAY = 500; // Reduced from 2000ms to 500ms
        this.CACHE_EXPIRY_HOURS = 2; // Cache expires after 2 hours

        // Timeout for fetch operations (reduced from 180s to 60s)
        this.fetchTimeout = 120000; // Increase timeout to 120 seconds
        this.MAX_RETRIES = 3; // Maximum number of retries
        this.RETRY_DELAY = 5000; // Base delay between retries (5 seconds)

        // Cache for station names and data with localStorage persistence
        this.stationNamesCache = {
            historical: null,
            currentYear: null
        };
        this.stationDataCache = {};

        // Data storage
        this.stations = [];
        this.historicalData = {};
        this.currentYearData = {};
        this.processedData = {};

        // Loading message element
        this.loadingMessageElement = document.getElementById('loading-message');

        // Initialize persistent cache
        this.initializePersistentCache();
    }

    /**
     * Initialize persistent cache from localStorage
     */
    initializePersistentCache() {
        try {
            // Load station names cache
            const stationNamesCache = localStorage.getItem('stationNamesCache');
            if (stationNamesCache) {
                const parsed = JSON.parse(stationNamesCache);
                if (this.isCacheValid(parsed.timestamp)) {
                    this.stationNamesCache = parsed.data;
                    if (this.DEBUG_MODE) console.log('Loaded station names from cache');
                }
            }

            // Load station data cache
            const stationDataCache = localStorage.getItem('stationDataCache');
            if (stationDataCache) {
                const parsed = JSON.parse(stationDataCache);
                if (this.isCacheValid(parsed.timestamp)) {
                    this.stationDataCache = parsed.data;
                    if (this.DEBUG_MODE) console.log('Loaded station data from cache');
                }
            }
        } catch (error) {
            if (this.DEBUG_MODE) console.warn('Failed to load cache from localStorage:', error);
            // Clear corrupted cache
            localStorage.removeItem('stationNamesCache');
            localStorage.removeItem('stationDataCache');
        }
    }

    /**
     * Check if cache is still valid based on timestamp
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} - Whether cache is valid
     */
    isCacheValid(timestamp) {
        if (!timestamp) return false;
        const now = Date.now();
        const expiryTime = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds
        return (now - timestamp) < expiryTime;
    }

    /**
     * Save cache to localStorage
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     */
    saveCacheToStorage(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            if (this.DEBUG_MODE) console.warn('Failed to save cache to localStorage:', error);
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        // Clear memory cache
        this.stationNamesCache = {
            historical: null,
            currentYear: null
        };
        this.stationDataCache = {};

        // Clear localStorage cache
        try {
            localStorage.removeItem('stationNamesCache');
            localStorage.removeItem('stationDataCache');
            if (this.DEBUG_MODE) console.log('Cache cleared successfully');
        } catch (error) {
            if (this.DEBUG_MODE) console.warn('Failed to clear localStorage cache:', error);
        }
    }

    /**
     * Enable debug mode for development
     */
    enableDebugMode() {
        this.DEBUG_MODE = true;
        console.log('Debug mode enabled');
    }

    /**
     * Disable debug mode for production
     */
    disableDebugMode() {
        this.DEBUG_MODE = false;
    }

    /**
     * Configure performance settings
     * @param {Object} config - Configuration object
     * @param {number} config.maxConcurrentRequests - Maximum concurrent requests (default: 5)
     * @param {number} config.batchDelay - Delay between batches in ms (default: 500)
     * @param {number} config.fetchTimeout - Fetch timeout in ms (default: 60000)
     * @param {number} config.cacheExpiryHours - Cache expiry in hours (default: 2)
     */
    configurePerformance(config = {}) {
        if (config.maxConcurrentRequests !== undefined) {
            this.MAX_CONCURRENT_REQUESTS = Math.max(1, Math.min(10, config.maxConcurrentRequests));
        }
        if (config.batchDelay !== undefined) {
            this.BATCH_DELAY = Math.max(0, config.batchDelay);
        }
        if (config.fetchTimeout !== undefined) {
            this.fetchTimeout = Math.max(10000, config.fetchTimeout);
        }
        if (config.cacheExpiryHours !== undefined) {
            this.CACHE_EXPIRY_HOURS = Math.max(0.5, config.cacheExpiryHours);
        }

        if (this.DEBUG_MODE) {
            console.log('Performance configuration updated:', {
                maxConcurrentRequests: this.MAX_CONCURRENT_REQUESTS,
                batchDelay: this.BATCH_DELAY,
                fetchTimeout: this.fetchTimeout,
                cacheExpiryHours: this.CACHE_EXPIRY_HOURS
            });
        }
    }

    /**
     * Performance monitoring
     */
    startTimer(label) {
        if (this.DEBUG_MODE) {
            console.time(label);
        }
    }

    endTimer(label) {
        if (this.DEBUG_MODE) {
            console.timeEnd(label);
        }
    }

    /**
     * Update the loading message in the UI
     * @param {string} message - The message to display
     */
    updateLoadingMessage(message) {
        if (this.loadingMessageElement) {
            this.loadingMessageElement.textContent = message;
        }
        if (this.DEBUG_MODE) console.log(message);
    }

    /**
     * Fetch all data for all stations
     * @returns {Promise<Object>} - Object containing stations and processed data
     */
    async fetchAllData() {
        try {
            this.startTimer('Total Data Loading');
            this.updateLoadingMessage('Fetching station names...');

            // Fetch station names from historical data
            this.startTimer('Fetch Historical Station Names');
            const historicalStations = await this.fetchStationNames('historical');
            this.endTimer('Fetch Historical Station Names');

            // Fetch station names from current year data
            this.startTimer('Fetch Current Year Station Names');
            const currentYearStations = await this.fetchStationNames('current');
            this.endTimer('Fetch Current Year Station Names');

            // Combine and deduplicate station names
            this.stations = [...new Set([...historicalStations, ...currentYearStations])];

            if (this.stations.length === 0) {
                throw new Error('No stations found');
            }

            this.updateLoadingMessage(`Found ${this.stations.length} stations`);

            // Use only the specified list of valid stations
            const validStations = [];
            const validStationsList = [
                'Thimphu', 'Paro', 'Punakha', 'Wangdue', 'Bumthang',
                'Trashigang', 'Trongsa', 'Tsirang', 'Zhemgang', 'Mongar',
                'Samtse', 'Sarpang', 'Lhuentse', 'Dagana', 'Pemagatshel',
                'Haa', 'Gasa', 'Samdrup_Jongkhar', 'Chukha', 'Trashiyangtse'
            ];
            const invalidStations = ['Phobjikha', 'Nganglam', 'Laya', 'Tsimalakha', 'Tongtongpey', 'Simtokha', 'Tangmachu'];

            for (const station of this.stations) {
                // Skip known invalid stations
                if (invalidStations.includes(station)) {
                    console.warn(`Skipping known invalid station: ${station}`);
                    continue;
                }

                // Skip stations with _MonthlyStats or _DailyStats suffixes (should be filtered by the API now)
                if (station.includes('_MonthlyStats') || station.includes('_DailyStats')) {
                    console.warn(`Skipping stats sheet: ${station}`);
                    continue;
                }

                // Only include stations from the valid stations list
                if (validStationsList.includes(station)) {
                    validStations.push(station);
                } else {
                    console.warn(`Skipping station not in valid list: ${station}`);
                }
            }

            // Update the stations list to only include valid stations
            this.stations = validStations;
            console.log(`Filtered to ${this.stations.length} valid stations:`, this.stations);

            if (this.stations.length === 0) {
                throw new Error('No valid stations found after filtering out known invalid stations');
            }

            // Process stations in batches with optimized concurrency
            let processedCount = 0;
            let successfulStations = 0;
            let failedStations = [];

            // Create a function to process a single station
            const processStation = async (station) => {
                try {
                    processedCount++;
                    this.updateLoadingMessage(`Processing station ${processedCount}/${this.stations.length}: ${station}`);

                    // Fetch historical data first
                    let historicalData = [];
                    try {
                        historicalData = await this.fetchStationData(station, 'historical');
                    } catch (historicalError) {
                        if (this.DEBUG_MODE) console.warn(`Error fetching historical data for ${station}: ${historicalError.message}`);

                        // If the error is "Access denied" or "not a valid station", add to invalid stations list
                        if (historicalError.message.includes('Access denied') ||
                            historicalError.message.includes('not a valid station')) {
                            invalidStations.push(station);
                        }

                        failedStations.push({ station, reason: `Historical data error: ${historicalError.message}` });
                        return false; // Station processing failed
                    }

                    // Only fetch current year data if historical data is available
                    let currentYearData = [];
                    if (historicalData && historicalData.length > 0) {
                        try {
                            // Try to fetch current year data, but don't fail if it's not available
                            currentYearData = await this.fetchStationData(station, 'current');
                        } catch (currentYearError) {
                            if (this.DEBUG_MODE) console.warn(`Error fetching current year data for ${station}: ${currentYearError.message}`);
                            currentYearData = [];
                        }
                    }

                    // Check if we got any historical data
                    if (!historicalData || historicalData.length === 0) {
                        if (this.DEBUG_MODE) console.warn(`No historical data available for station: ${station}`);
                        failedStations.push({ station, reason: 'No historical data available' });
                        return false; // Station processing failed
                    }

                    this.historicalData[station] = historicalData;
                    if (this.DEBUG_MODE) console.log(`Historical data for ${station}:`, historicalData.length, 'records');

                    // Store current year data
                    this.currentYearData[station] = currentYearData;
                    if (this.DEBUG_MODE && currentYearData.length > 0) {
                        console.log(`Current year data for ${station}:`, currentYearData.length, 'records');
                    }

                    // Process data for this station
                    this.processedData[station] = this.processStationData(station);

                    return true; // Station processing succeeded
                } catch (stationError) {
                    if (this.DEBUG_MODE) console.error(`Error processing station ${station}:`, stationError);
                    this.updateLoadingMessage(`Error processing station ${station}. Continuing with other stations...`);
                    failedStations.push({ station, reason: stationError.message });
                    return false; // Station processing failed
                }
            };

            // Process stations in batches with increased concurrency
            this.startTimer('Station Data Processing');
            for (let i = 0; i < this.stations.length; i += this.MAX_CONCURRENT_REQUESTS) {
                const batch = this.stations.slice(i, i + this.MAX_CONCURRENT_REQUESTS);
                const batchLabel = `Batch ${Math.floor(i / this.MAX_CONCURRENT_REQUESTS) + 1}`;
                this.startTimer(batchLabel);

                const results = await Promise.all(batch.map(station => processStation(station)));
                this.endTimer(batchLabel);

                // Count successful stations in this batch
                successfulStations += results.filter(result => result).length;

                // Update progress
                this.updateLoadingMessage(`Processed ${i + batch.length}/${this.stations.length} stations. ${successfulStations} successful.`);

                // Add shorter delay between batches
                if (i + batch.length < this.stations.length) {
                    await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
                }
            }
            this.endTimer('Station Data Processing');

            // Log summary of station processing
            console.log(`Successfully processed ${successfulStations} out of ${this.stations.length} stations`);
            if (failedStations.length > 0) {
                if (this.DEBUG_MODE) console.warn(`Failed to process ${failedStations.length} stations:`, failedStations);

                // Filter out stations with no data from the stations list
                const failedStationNames = failedStations.map(fs => fs.station);
                this.stations = this.stations.filter(station => !failedStationNames.includes(station));
                console.log(`Filtered stations list to ${this.stations.length} stations with data`);
            }

            this.endTimer('Total Data Loading');
            this.updateLoadingMessage('Data loading complete!');
            return {
                stations: this.stations,
                processedData: this.processedData
            };
        } catch (error) {
            console.error('Error fetching all data:', error);
            this.updateLoadingMessage('Error loading data. Please reload the page and try again.');
            throw error;
        }
    }

    /**
     * Fetch station names from the Google Apps Script web app
     * @param {string} dataType - The type of data to fetch ('historical' or 'current')
     * @returns {Promise<Array<string>>} - Array of station names
     */
    async fetchStationNames(dataType) {
        // Check if we have cached data
        if (dataType === "historical" && this.stationNamesCache.historical) {
            if (this.DEBUG_MODE) console.log(`Using cached historical station names`);
            return this.stationNamesCache.historical.data || this.stationNamesCache.historical;
        } else if (dataType === "current" && this.stationNamesCache.currentYear) {
            if (this.DEBUG_MODE) console.log(`Using cached current year station names`);
            return this.stationNamesCache.currentYear.data || this.stationNamesCache.currentYear;
        }

        try {
            // Determine which web app URL to use
            const webAppUrl = dataType === "historical"
                ? this.HISTORICAL_WEB_APP_URL
                : this.CURRENT_YEAR_WEB_APP_URL;

            this.updateLoadingMessage(`Checking available stations for ${dataType} data...`);

            // Make the request to the web app with timeout
            const url = `${webAppUrl}?action=getStations`;
            console.log(`Fetching stations from: ${url}`);

            const controller = new AbortController();
            // Increase timeout to 120 seconds
            const timeoutId = setTimeout(() => {
                console.log(`Fetch timeout for ${dataType} station names after 120 seconds`);
                controller.abort();
            }, 120000);

            try {
                console.log(`Attempting to fetch ${dataType} station names with standard CORS mode`);

                // Add retry logic for fetch operations
                let retries = 2; // Number of retries
                let response = null;
                let fetchError = null;

                for (let attempt = 0; attempt <= retries; attempt++) {
                    try {
                        if (attempt > 0) {
                            console.log(`Retry attempt ${attempt} for ${dataType} station names`);
                            this.updateLoadingMessage(`Retry ${attempt}/${retries} for ${dataType} station names...`);
                        }

                        response = await fetch(url, {
                            signal: controller.signal,
                            headers: {
                                'Accept': 'application/json'
                            }
                        });

                        // If successful, break out of retry loop
                        if (response.ok) {
                            break;
                        }

                        fetchError = new Error(`HTTP error! status: ${response.status}`);
                        console.warn(`Fetch attempt ${attempt + 1} failed with status ${response.status}`);

                        // Wait before retrying (exponential backoff)
                        if (attempt < retries) {
                            const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                            await new Promise(resolve => setTimeout(resolve, backoffTime));
                        }
                    } catch (err) {
                        fetchError = err;
                        console.warn(`Fetch attempt ${attempt + 1} failed with error:`, err);

                        // If it's an abort error, don't retry
                        if (err.name === 'AbortError') {
                            break;
                        }

                        // Wait before retrying (exponential backoff)
                        if (attempt < retries) {
                            const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                            await new Promise(resolve => setTimeout(resolve, backoffTime));
                        }
                    }
                }

                clearTimeout(timeoutId);

                // If all attempts failed, throw the last error
                if (!response || !response.ok) {
                    console.error(`HTTP error fetching ${dataType} station names after ${retries + 1} attempts`);
                    throw fetchError || new Error(`Failed to fetch station names after ${retries + 1} attempts`);
                }

                const data = await response.json();

                // Log the raw response for debugging
                console.log(`Raw ${dataType} station names response:`, data);

                if (data.status === 'error') {
                    console.error(`API error fetching ${dataType} station names:`, data.message);
                    throw new Error(data.message);
                }

                // Get the station names
                const stations = data.stations || [];

                // Filter out stations with _MonthlyStats and _DailyStats suffixes
                const filteredStations = stations.filter(name =>
                    !name.includes('_MonthlyStats') &&
                    !name.includes('_DailyStats') &&
                    !name.includes('README') &&
                    !name.includes('Instructions') &&
                    !name.includes('Summary') &&
                    !name.includes('Config')
                );

                if (this.DEBUG_MODE) console.log(`Found ${filteredStations.length} stations for ${dataType} data after filtering:`, filteredStations);

                // Cache the results in memory and localStorage
                const cacheData = {
                    data: filteredStations,
                    timestamp: Date.now()
                };

                if (dataType === "historical") {
                    this.stationNamesCache.historical = cacheData;
                } else {
                    this.stationNamesCache.currentYear = cacheData;
                }

                // Save to localStorage
                this.saveCacheToStorage('stationNamesCache', this.stationNamesCache);

                return filteredStations;
            } catch (fetchError) {
                clearTimeout(timeoutId);

                // Log detailed error information
                console.error(`Fetch error for ${dataType} station names:`, fetchError);
                console.error(`Fetch error type:`, fetchError.name);
                console.error(`Fetch error message:`, fetchError.message);

                // Provide more detailed error messages based on error type
                if (fetchError.name === 'AbortError') {
                    console.warn(`Fetch aborted for ${dataType} station names due to timeout (120 seconds)`);
                    throw new Error(`Request timed out after 120 seconds. The server might be busy or experiencing issues.`);
                } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
                    console.error(`Network error when fetching ${dataType} station list.`);
                    throw new Error(`Network error when fetching station list. Please check your internet connection and try again.`);
                } else {
                    throw fetchError;
                }
            }
        } catch (error) {
            console.error(`Error fetching station names for ${dataType} data:`, error);

            // Throw error when we can't fetch station data
            throw new Error(`Failed to fetch station list for ${dataType} data. Please check your internet connection and try again.`);
        }
    }

    /**
     * Fetch data for a specific station from the Google Apps Script web app
     * @param {string} station - The station name
     * @param {string} dataType - The type of data to fetch ('historical' or 'current')
     * @returns {Promise<Array>} - The fetched data as array of objects
     */
    async fetchStationData(station, dataType) {
        // Create a cache key
        const cacheKey = `${dataType}_${station}`;

        // Check if we have this station data cached
        if (this.stationDataCache[cacheKey] && this.stationDataCache[cacheKey].data) {
            if (this.DEBUG_MODE) console.log(`Using cached ${dataType} data for ${station}`);
            return this.stationDataCache[cacheKey].data;
        }

        try {
            // Determine which web app URL to use
            const webAppUrl = dataType === "historical"
                ? this.HISTORICAL_WEB_APP_URL
                : this.CURRENT_YEAR_WEB_APP_URL;

            this.updateLoadingMessage(`Fetching ${dataType} data for station: ${station}...`);

            // Make the request to the web app with timeout
            const url = `${webAppUrl}?action=getStationData&station=${encodeURIComponent(station)}`;
            console.log(`Fetching data from: ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Fetch timeout for ${dataType} data for station ${station} after ${this.fetchTimeout/1000} seconds`);
                controller.abort();
            }, this.fetchTimeout);

            let lastError = null;
            for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    if (attempt > 0) {
                        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
                        console.log(`Retry attempt ${attempt} for ${dataType} data for station ${station} after ${delay/1000} seconds`);
                        this.updateLoadingMessage(`Retry ${attempt}/${this.MAX_RETRIES} for ${dataType} data: ${station}...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                    const response = await fetch(url, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (data.status === 'error') {
                        throw new Error(data.message || 'Unknown error from server');
                    }

                    // Process the data based on its format
                    let processedData = [];
                    if (data.values) {
                        processedData = this.processRawData(data.values);
                    } else if (data.data) {
                        processedData = this.processObjectData(data.data);
                    } else if (data.rawData) {
                        processedData = this.processRawData(data.rawData);
                    } else {
                        throw new Error('No data found in response');
                    }

                    // Cache the processed data
                    this.stationDataCache[cacheKey] = {
                        data: processedData,
                        timestamp: Date.now()
                    };

                    // Save to localStorage
                    this.saveCacheToStorage('stationDataCache', this.stationDataCache);

                    clearTimeout(timeoutId);
                    return processedData;

                } catch (error) {
                    lastError = error;
                    console.warn(`Attempt ${attempt + 1} failed for ${station}:`, error);

                    if (error.name === 'AbortError') {
                        throw new Error(`Request timed out after ${this.fetchTimeout/1000} seconds. The server might be busy or experiencing issues.`);
                    }

                    if (attempt === this.MAX_RETRIES) {
                        throw new Error(`Failed to fetch data after ${this.MAX_RETRIES + 1} attempts. Last error: ${error.message}`);
                    }
                }
            }

            throw lastError || new Error('Failed to fetch data');

        } catch (error) {
            console.error(`Error fetching ${dataType} data for station ${station}:`, error);
            this.updateLoadingMessage(`Error loading ${dataType} data for station: ${station}. Continuing with other stations...`);

            // Cache empty data to avoid repeated failed requests
            this.stationDataCache[cacheKey] = {
                data: [],
                timestamp: Date.now()
            };

            return [];
        }
    }

    /**
     * Process raw data from the Google Apps Script
     * @param {Array<Array>} rawData - The raw data as a 2D array
     * @returns {Array<Object>} - The processed data as an array of objects
     */
    processRawData(rawData) {
        try {
            if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
                console.error('Invalid raw data:', rawData);
                return [];
            }

            // Extract headers from the first row
            const headers = rawData[0].map(header => {
                return header ? header.toString().trim() : '';
            });

            // --- DEBUG LOGGING FOR SARPANG ---
            // Always log headers and first 5 rows if the station is Sarpang
            // We don't have the station name here, so log for all stations for now
            console.log('=== Data Debug: Headers ===');
            console.log(headers);
            console.log('=== Data Debug: First 5 rows ===');
            for (let i = 0; i < Math.min(5, rawData.length); i++) {
                console.log(`Row ${i}:`, rawData[i]);
            }
            // Log Tmax column index and sample values if present
            const tmaxIndex = headers.findIndex(h => h === 'Tmax');
            if (tmaxIndex !== -1) {
                const tmaxSamples = rawData.slice(1, 6).map(row => row[tmaxIndex]);
                console.log('=== Data Debug: Tmax column found. Sample values:', tmaxSamples);
            } else {
                console.warn('=== Data Debug: Tmax column NOT found in headers!');
            }
            // --- END DEBUG LOGGING ---

            // Check for rainfall headers - expanded to handle more variations
            const rainfallHeaders = headers.filter(header => {
                const lowerHeader = header.toLowerCase();
                return lowerHeader.includes('rainfall') ||
                       lowerHeader.includes('rain') ||
                       lowerHeader.includes('precip') ||
                       lowerHeader.includes('precipitation') ||
                       lowerHeader === 'mm' ||
                       lowerHeader.includes('water');
            });

            if (this.DEBUG_MODE) {
                if (rainfallHeaders.length > 0) {
                    console.log('Found rainfall headers in raw data:', rainfallHeaders);
                } else {
                    console.log('Available headers:', headers);
                    console.warn('No rainfall headers found in raw data');
                }
            }

            // Check if we have the required columns (Year, Month, Day)
            const yearIndex = headers.findIndex(h => h === 'Year' || h === 'year');
            const monthIndex = headers.findIndex(h => h === 'Month' || h === 'month');
            const dayIndex = headers.findIndex(h => h === 'Day' || h === 'day');

            // If we don't have proper headers, try to infer them
            if (yearIndex === -1 || monthIndex === -1 || dayIndex === -1) {
                console.warn('Raw data is missing required columns (Year/year, Month/month, Day/day)');
                console.log('Available headers:', headers);

                // Check if the first row looks like data (not headers)
                const firstRow = rawData[0];
                const possibleYear = Number(firstRow[0]);
                const possibleMonth = Number(firstRow[1]);
                const possibleDay = Number(firstRow[2]);

                if (!isNaN(possibleYear) && possibleYear > 1900 && possibleYear < 2100 &&
                    !isNaN(possibleMonth) && possibleMonth >= 1 && possibleMonth <= 12 &&
                    !isNaN(possibleDay) && possibleDay >= 1 && possibleDay <= 31) {

                    console.log('First row appears to be data, not headers. Creating inferred headers...');

                    // Create default headers based on the expected format
                    const inferredHeaders = ['Year', 'Month', 'Day', 'Rainfall', 'Tmax', 'Tmin', 'RH', 'Wind Speed', 'Wind Direction'];

                    console.log('Using inferred headers for data that appears to be missing headers');

                    // Ensure we don't create more headers than we have columns
                    while (inferredHeaders.length > firstRow.length) {
                        inferredHeaders.pop();
                    }

                    // Add generic headers for any additional columns
                    for (let i = inferredHeaders.length; i < firstRow.length; i++) {
                        inferredHeaders.push(`Column${i+1}`);
                    }

                    console.log('Created inferred headers:', inferredHeaders);

                    // Use these headers for processing
                    const processedData = [];

                    // Process all rows as data
                    for (let i = 0; i < rawData.length; i++) {
                        const row = rawData[i];
                        const rowData = {};

                        // Skip rows that are too short
                        if (!row || row.length < 3) {
                            console.warn(`Skipping row ${i} because it's too short:`, row);
                            continue;
                        }

                        // Map data to headers
                        for (let j = 0; j < inferredHeaders.length && j < row.length; j++) {
                            rowData[inferredHeaders[j]] = row[j];
                        }

                        // Standardize field names and convert to numbers
                        this.standardizeRecord(rowData);

                        // Skip rows without valid Year, Month, or Day
                        if (rowData.Year === undefined || rowData.Month === undefined || rowData.Day === undefined ||
                            isNaN(rowData.Year) || isNaN(rowData.Month) || isNaN(rowData.Day)) {
                            console.warn(`Skipping row ${i} without valid Year, Month, or Day:`, rowData);
                            continue;
                        }

                        // Skip rows without Tmax or Tmin (at least one is required)
                        if (rowData.Tmax === undefined && rowData.Tmin === undefined) {
                            console.warn(`Skipping row ${i} without Tmax or Tmin:`, rowData);
                            continue;
                        }

                        // Add the row to the processed data
                        processedData.push(rowData);
                    }

                    console.log(`Processed ${processedData.length} rows using inferred headers`);

                    // Log a sample of the processed data
                    if (processedData.length > 0) {
                        console.log('Sample of processed data:', processedData.slice(0, 2));
                    }

                    return processedData;
                }
            }

            // Standard processing with headers
            const data = [];
            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                const rowData = {};
                let hasData = false;

                // Skip rows that are too short
                if (!row || row.length < 3) {
                    console.warn(`Skipping row ${i} because it's too short:`, row);
                    continue;
                }

                for (let j = 0; j < headers.length && j < row.length; j++) {
                    // Skip empty headers
                    if (headers[j] === '') continue;

                    // Add the value to the row data
                    rowData[headers[j]] = row[j];

                    // Check if this cell has data
                    if (row[j] !== null && row[j] !== undefined && row[j] !== '') {
                        hasData = true;
                    }
                }

                // Skip empty rows
                if (!hasData) {
                    console.warn(`Skipping empty row ${i}`);
                    continue;
                }

                // Standardize field names and convert to numbers
                this.standardizeRecord(rowData);

                // Skip rows without Year, Month, or Day
                if (rowData.Year === undefined || rowData.Month === undefined || rowData.Day === undefined) {
                    console.warn(`Skipping row ${i} without Year, Month, or Day:`, rowData);
                    continue;
                }

                // Skip rows without Tmax or Tmin (at least one is required)
                if (rowData.Tmax === undefined && rowData.Tmin === undefined) {
                    console.warn(`Skipping row ${i} without Tmax or Tmin:`, rowData);
                    continue;
                }

                // Add the row to the data array
                data.push(rowData);
            }

            console.log(`Processed ${data.length} rows from raw data with headers`);

            // Check for rainfall data in processed records
            const rainfallRecords = data.filter(record =>
                record.Rainfall !== undefined && record.Rainfall !== null && !isNaN(record.Rainfall));

            console.log(`Found ${rainfallRecords.length} records with rainfall data out of ${data.length} total records`);

            if (rainfallRecords.length > 0) {
                console.log('Sample rainfall records:', rainfallRecords.slice(0, 3));
            } else {
                console.warn('No rainfall data found in processed records');

                // Check what happened to the rainfall data
                if (data.length > 0) {
                    // Check the first few records to see what fields they have
                    console.log('First few processed records:');
                    data.slice(0, 3).forEach((record, i) => {
                        console.log(`Record ${i}:`, record);

                        // Check if there's a Rainfall field but it's not a valid number
                        if (record.Rainfall !== undefined) {
                            console.log(`Record ${i} has Rainfall field with value:`, record.Rainfall);
                            console.log(`Type of Rainfall value:`, typeof record.Rainfall);
                            console.log(`Is NaN:`, isNaN(record.Rainfall));

                            // Try to convert it to a number
                            const numValue = Number(record.Rainfall);
                            console.log(`Converted to number:`, numValue);
                            console.log(`Is NaN after conversion:`, isNaN(numValue));

                            // If it's a valid number after conversion, update the record
                            if (!isNaN(numValue)) {
                                record.Rainfall = numValue;
                                console.log(`Updated Rainfall value to:`, record.Rainfall);
                            }
                        }
                    });

                    // Check again after potential fixes
                    const fixedRainfallRecords = data.filter(record =>
                        record.Rainfall !== undefined && record.Rainfall !== null && !isNaN(record.Rainfall));

                    console.log(`After fixes: Found ${fixedRainfallRecords.length} records with rainfall data`);

                    if (fixedRainfallRecords.length > 0) {
                        console.log('Sample fixed rainfall records:', fixedRainfallRecords.slice(0, 3));
                    }
                }
            }

            // Log a sample of the processed data
            if (data.length > 0) {
                console.log('Sample of processed data:', data.slice(0, 2));
            }

            return data;
        } catch (error) {
            console.error('Error processing raw data:', error);
            return [];
        }
    }

    /**
     * Process data that's already in object format
     * @param {Array<Object>} objectData - The data as an array of objects
     * @returns {Array<Object>} - The processed data
     */
    processObjectData(objectData) {
        try {
            if (!objectData || !Array.isArray(objectData) || objectData.length === 0) {
                console.error('Invalid object data:', objectData);
                return [];
            }

            // Log the first few records to help debug
            console.log('First few records of object data:');
            for (let i = 0; i < Math.min(3, objectData.length); i++) {
                console.log(`Record ${i}:`, objectData[i]);
            }

            // Check if we have the required fields (Year, Month, Day)
            const firstRecord = objectData[0];
            const hasYear = 'Year' in firstRecord || 'year' in firstRecord;
            const hasMonth = 'Month' in firstRecord || 'month' in firstRecord;
            const hasDay = 'Day' in firstRecord || 'day' in firstRecord;

            if (!hasYear || !hasMonth || !hasDay) {
                console.warn('Object data is missing required fields (Year, Month, Day)');
                console.log('Available fields:', Object.keys(firstRecord));
            }

            // Process each record to standardize field names and convert to numbers
            const data = [];
            for (let i = 0; i < objectData.length; i++) {
                const record = objectData[i];
                const newRecord = { ...record };

                // Standardize field names and convert to numbers
                this.standardizeRecord(newRecord);

                // Skip records without Year, Month, or Day
                if (newRecord.Year === undefined || newRecord.Month === undefined || newRecord.Day === undefined) {
                    console.warn(`Skipping record ${i} without Year, Month, or Day:`, newRecord);
                    continue;
                }

                // Skip records without Tmax or Tmin (at least one is required for our analysis)
                if (newRecord.Tmax === undefined && newRecord.Tmin === undefined) {
                    console.warn(`Skipping record ${i} without Tmax or Tmin:`, newRecord);
                    continue;
                }

                // Add the record to the data array
                data.push(newRecord);
            }

            console.log(`Processed ${data.length} records from object data`);

            // Check for rainfall data in processed records
            const rainfallRecords = data.filter(record =>
                record.Rainfall !== undefined && record.Rainfall !== null && !isNaN(record.Rainfall));

            console.log(`Found ${rainfallRecords.length} records with rainfall data out of ${data.length} total records`);

            if (rainfallRecords.length > 0) {
                console.log('Sample rainfall records:', rainfallRecords.slice(0, 3));
            } else {
                console.warn('No rainfall data found in processed records');
            }

            // Log a sample of the processed data
            if (data.length > 0) {
                console.log('Sample of processed data:', data.slice(0, 2));
            }

            return data;
        } catch (error) {
            console.error('Error processing object data:', error);
            return [];
        }
    }

    /**
     * Standardize a record by converting fields to numbers and standardizing field names
     * @param {Object} record - The record to standardize
     */
    standardizeRecord(record) {
        // Ensure Year, Month, Day are numbers
        if (record.Year !== undefined) record.Year = Number(record.Year);
        if (record.year !== undefined) record.Year = Number(record.year);

        if (record.Month !== undefined) record.Month = Number(record.Month);
        if (record.month !== undefined) record.Month = Number(record.month);

        if (record.Day !== undefined) record.Day = Number(record.Day);
        if (record.day !== undefined) record.Day = Number(record.day);

        // Ensure Tmax, Tmin are numbers if they exist and not null/empty
        if (record.Tmax !== undefined && record.Tmax !== null && record.Tmax !== '') {
            record.Tmax = Number(record.Tmax);
            // If conversion results in NaN, set back to null
            if (isNaN(record.Tmax)) record.Tmax = null;
        } else if (record.Tmax === '') {
            // Convert only empty strings to null, keep zeros as zeros
            record.Tmax = null;
        }

        if (record.tmax !== undefined && record.tmax !== null && record.tmax !== '') {
            record.Tmax = Number(record.tmax);
            if (isNaN(record.Tmax)) record.Tmax = null;
        } else if (record.tmax === '') {
            record.tmax = null;
        }

        if (record.TMAX !== undefined && record.TMAX !== null && record.TMAX !== '') {
            record.Tmax = Number(record.TMAX);
            if (isNaN(record.Tmax)) record.Tmax = null;
        } else if (record.TMAX === '') {
            record.TMAX = null;
        }

        if (record.Tmin !== undefined && record.Tmin !== null && record.Tmin !== '') {
            record.Tmin = Number(record.Tmin);
            if (isNaN(record.Tmin)) record.Tmin = null;
        } else if (record.Tmin === '') {
            record.Tmin = null;
        }

        if (record.tmin !== undefined && record.tmin !== null && record.tmin !== '') {
            record.Tmin = Number(record.tmin);
            if (isNaN(record.Tmin)) record.Tmin = null;
        } else if (record.tmin === '') {
            record.tmin = null;
        }

        if (record.TMIN !== undefined && record.TMIN !== null && record.TMIN !== '') {
            record.Tmin = Number(record.TMIN);
            if (isNaN(record.Tmin)) record.Tmin = null;
        } else if (record.TMIN === '') {
            record.TMIN = null;
        }

        // Standardize field names
        if (record.year !== undefined && record.Year === undefined) record.Year = record.year;
        if (record.month !== undefined && record.Month === undefined) record.Month = record.month;
        if (record.day !== undefined && record.Day === undefined) record.Day = record.day;
        if (record.tmax !== undefined && record.Tmax === undefined) record.Tmax = record.tmax;
        if (record.tmin !== undefined && record.Tmin === undefined) record.Tmin = record.tmin;
        if (record.TMAX !== undefined && record.Tmax === undefined) record.Tmax = record.TMAX;
        if (record.TMIN !== undefined && record.Tmin === undefined) record.Tmin = record.TMIN;

        // Handle Rainfall field - check for various possible field names
        const rainfallFieldNames = [
            'Rainfall', 'rainfall', 'RAINFALL',
            'Rain', 'rain', 'RAIN',
            'Precipitation', 'precipitation', 'PRECIPITATION',
            'Precip', 'precip', 'PRECIP',
            'RR', 'rr', 'R', 'r'
        ];

        // Check if any rainfall field exists
        let rainfallFound = false;

        // Process known rainfall field names
        for (const fieldName of rainfallFieldNames) {
            if (record[fieldName] !== undefined && record[fieldName] !== null) {
                // Handle special cases
                let valueToConvert = record[fieldName];

                // Handle empty strings
                if (valueToConvert === '') {
                    valueToConvert = '0';
                }

                // Handle strings with special characters
                if (typeof valueToConvert === 'string') {
                    // Remove any non-numeric characters except decimal point
                    valueToConvert = valueToConvert.replace(/[^\d.-]/g, '');

                    // Handle trace amounts (often marked with 'T' or 'Trace')
                    if (valueToConvert === '' &&
                        (record[fieldName].toString().toLowerCase().includes('t') ||
                         record[fieldName].toString().toLowerCase().includes('trace'))) {
                        valueToConvert = '0.1'; // Set trace amounts to 0.1mm
                    }

                    // Handle missing data (often marked with '-' or 'NA')
                    if (valueToConvert === '' &&
                        (record[fieldName].toString().includes('-') ||
                         record[fieldName].toString().toLowerCase().includes('na'))) {
                        valueToConvert = '0'; // Set missing data to 0
                    }
                }

                // Convert to number
                const rainfallValue = Number(valueToConvert);

                // Only set if it's a valid number
                if (!isNaN(rainfallValue)) {
                    record.Rainfall = rainfallValue;
                    rainfallFound = true;

                    // Log the conversion for debugging
                    if (record[fieldName] !== rainfallValue) {
                        console.log(`Converted rainfall value from '${record[fieldName]}' to ${rainfallValue}`);
                    }

                    break; // Stop after finding the first valid rainfall value
                } else {
                    console.log(`Failed to convert rainfall value: '${record[fieldName]}' (${typeof record[fieldName]})`);
                }
            }
        }

        // If no rainfall field was found, try to calculate it from other fields
        if (!rainfallFound) {
            // Log all fields to help debug
            const recordFields = Object.keys(record);
            if (recordFields.length > 0) {
                console.log('Record fields available:', recordFields);

                // Check for any field that might contain rainfall data (containing 'mm' or 'water')
                const potentialRainfallFields = recordFields.filter(field =>
                    field.toLowerCase().includes('mm') ||
                    field.toLowerCase().includes('water') ||
                    field.toLowerCase().includes('precip'));

                if (potentialRainfallFields.length > 0) {
                    console.log('Potential rainfall fields:', potentialRainfallFields);

                    // Try the first potential field
                    const firstField = potentialRainfallFields[0];
                    if (record[firstField] !== undefined && record[firstField] !== null && record[firstField] !== '') {
                        const rainfallValue = Number(record[firstField]);
                        if (!isNaN(rainfallValue)) {
                            record.Rainfall = rainfallValue;
                            console.log(`Using ${firstField} as Rainfall with value ${rainfallValue}`);
                            rainfallFound = true;
                        }
                    }
                }
            }
        }

        // Add Date field if Year, Month, and Day are available and valid
        if (record.Year !== undefined && record.Month !== undefined && record.Day !== undefined) {
            // Validate month and day values
            if (record.Month <= 0 || record.Month > 12 || record.Day <= 0 || record.Day > 31 ||
                isNaN(record.Month) || isNaN(record.Day) || isNaN(record.Year)) {
                // Invalid date values
                record.dayOfYear = null;
                console.log(`Skipping date processing for invalid date values: ${record.Year}-${record.Month}-${record.Day}`);
                return record; // Return early to skip further processing
            }

            // Format the date as DD-MMM-YYYY
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            record.Date = `${record.Day}-${monthNames[record.Month - 1]}-${record.Year}`;

            // Skip day of year calculation if we don't have valid month and day
            if (record.Month === undefined || record.Month === null || record.Month === 0 ||
                record.Day === undefined || record.Day === null || record.Day === 0) {
                // Set a default day of year to avoid errors
                record.dayOfYear = null;
                console.log(`Skipping day of year calculation for invalid date: ${record.Year}-${record.Month}-${record.Day}`);
                return record; // Return early to skip further processing
            }

            // Calculate day of year - using a consistent reference year (2020 is a leap year)
            // This ensures consistent day of year values regardless of the actual year
            const date = new Date(2020, record.Month - 1, record.Day);
            const startOfYear = new Date(2020, 0, 1);
            record.dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

            // Validate the day of year is in a reasonable range (1-366)
            if (record.dayOfYear < 1 || record.dayOfYear > 366) {
                console.warn(`Invalid day of year calculated: ${record.dayOfYear} for date ${record.Year}-${record.Month}-${record.Day}`);
                // Recalculate using a safer method
                const monthDays = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Days in each month (0-indexed)

                // Additional validation for month and day
                if (record.Month > 0 && record.Month <= 12 && record.Day > 0 && record.Day <= 31) {
                    let dayOfYear = record.Day;
                    for (let m = 1; m < record.Month; m++) {
                        dayOfYear += monthDays[m];
                    }
                    record.dayOfYear = dayOfYear;
                    console.log(`Corrected day of year to: ${record.dayOfYear}`);
                } else {
                    // If month or day is still invalid, set dayOfYear to null
                    record.dayOfYear = null;
                    console.warn(`Could not calculate day of year for invalid date: ${record.Year}-${record.Month}-${record.Day}`);
                }
            }
        }
    }
}
