/**
 * Data Processor for Temperature Charts
 *
 * This file provides functions to process raw data and calculate statistics
 * for visualization.
 */

class DataProcessor extends AppScriptDataProcessor {
    constructor() {
        super();
    }

    /**
     * Process data for a specific station
     * @param {string} station - The station name
     * @returns {Object} - Processed data for the station
     */
    processStationData(station) {
        const historicalData = this.historicalData[station] || [];
        const currentYearData = this.currentYearData[station] || [];

        // Check if we have any historical data
        if (historicalData.length === 0) {
            console.warn(`No historical data available for station: ${station}`);

            // Return data structure with only current year data
            return {
                dailyStats: [],
                monthlyStats: [],
                currentYearData: currentYearData
            };
        }

        // Calculate daily statistics
        const dailyStats = this.calculateDailyStatistics(historicalData);

        // Calculate monthly statistics
        const monthlyStats = this.calculateMonthlyStatistics(historicalData);

        return {
            dailyStats: dailyStats,
            monthlyStats: monthlyStats,
            currentYearData: currentYearData
        };
    }

    /**
     * Calculate daily statistics from historical data
     * @param {Array} historicalData - Historical data for a station
     * @returns {Array} - Daily statistics
     */
    calculateDailyStatistics(historicalData) {
        // Early return if no data
        if (!historicalData || historicalData.length === 0) {
            console.warn('No historical data provided to calculateDailyStatistics');
            return [];
        }

        // Check for rainfall data
        const rainfallRecords = historicalData.filter(record =>
            record.Rainfall !== undefined && record.Rainfall !== null && !isNaN(record.Rainfall));
        console.log(`Found ${rainfallRecords.length} records with rainfall data out of ${historicalData.length} total records`);

        if (rainfallRecords.length > 0) {
            console.log('Sample rainfall records:', rainfallRecords.slice(0, 3));
        } else {
            console.warn('No rainfall data found in historical records');

            // Try to derive rainfall data from other fields if available
            console.log('Attempting to derive rainfall data from other fields...');

            // Check what fields are available in the data
            if (historicalData.length > 0) {
                const sampleRecord = historicalData[0];
                console.log('Sample record fields:', Object.keys(sampleRecord));

                // Look for fields that might contain precipitation data
                const potentialRainfallFields = Object.keys(sampleRecord).filter(field =>
                    field.toLowerCase().includes('precip') ||
                    field.toLowerCase().includes('mm') ||
                    field.toLowerCase().includes('water') ||
                    field.toLowerCase().includes('rr'));

                if (potentialRainfallFields.length > 0) {
                    console.log('Potential rainfall fields found:', potentialRainfallFields);

                    // Use the first potential field as rainfall
                    const rainfallField = potentialRainfallFields[0];

                    // Copy values to Rainfall field
                    let derivedCount = 0;
                    historicalData.forEach(record => {
                        if (record[rainfallField] !== undefined && record[rainfallField] !== null) {
                            const value = Number(record[rainfallField]);
                            if (!isNaN(value)) {
                                record.Rainfall = value;
                                derivedCount++;
                            }
                        }
                    });

                    console.log(`Derived ${derivedCount} rainfall values from ${rainfallField}`);
                }
            }
        }

        // Group data by month and day
        const groupedByDay = new Map();

        // Process each record
        historicalData.forEach(record => {
            // Skip records without month, day, or year
            if (!record.Month || !record.Day || !record.Year) return;

            // Create a unique key for each day
            const key = `${record.Month}-${record.Day}`;

            // Calculate day of year if not already calculated
            if (!record.dayOfYear) {
                // Use a consistent reference year (2020 is a leap year)
                const date = new Date(2020, record.Month - 1, record.Day);
                const startOfYear = new Date(2020, 0, 1);
                record.dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

                // Validate the day of year is in a reasonable range (1-366)
                if (record.dayOfYear < 1 || record.dayOfYear > 366) {
                    console.error(`Invalid day of year calculated in dataProcessor: ${record.dayOfYear} for date ${record.Year}-${record.Month}-${record.Day}`);
                    // Recalculate using a safer method
                    const monthDays = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Days in each month (0-indexed)
                    let dayOfYear = record.Day;
                    for (let m = 1; m < record.Month; m++) {
                        dayOfYear += monthDays[m];
                    }
                    record.dayOfYear = dayOfYear;
                    console.log(`Corrected day of year to: ${record.dayOfYear}`);
                }
            }

            if (!groupedByDay.has(key)) {
                groupedByDay.set(key, {
                    month: record.Month,
                    day: record.Day,
                    dayOfYear: record.dayOfYear,
                    tmaxValues: [],
                    tminValues: [],
                    rainfallValues: []
                });
            }

            const dayData = groupedByDay.get(key);

            // Add Tmax value if it exists
            if (record.Tmax !== undefined && record.Tmax !== null && !isNaN(record.Tmax)) {
                dayData.tmaxValues.push({
                    year: record.Year,
                    value: record.Tmax
                });
            }

            // Add Tmin value if it exists
            if (record.Tmin !== undefined && record.Tmin !== null && !isNaN(record.Tmin)) {
                dayData.tminValues.push({
                    year: record.Year,
                    value: record.Tmin
                });
            }

            // Add Rainfall value if it exists
            if (record.Rainfall !== undefined && record.Rainfall !== null) {
                // Convert to number if it's not already
                let rainfallValue = record.Rainfall;
                if (typeof rainfallValue !== 'number') {
                    rainfallValue = Number(rainfallValue);
                }

                // Only add if it's a valid number
                if (!isNaN(rainfallValue)) {
                    dayData.rainfallValues.push({
                        year: record.Year,
                        value: rainfallValue
                    });

                    // Log for debugging
                    console.log(`Added rainfall value ${rainfallValue} for ${record.Year}-${record.Month}-${record.Day}`);
                }
            }
        });

        // Calculate statistics for each day
        const dailyStats = Array.from(groupedByDay.values()).map(dayData => {
            // Calculate day of year if it doesn't exist
            let dayOfYear = dayData.dayOfYear;
            if (!dayOfYear && dayData.month && dayData.day) {
                // Use a leap year (2020) for consistent day of year calculations
                const date = new Date(2020, dayData.month - 1, dayData.day);
                const startOfYear = new Date(2020, 0, 1);
                dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
                console.log(`Calculated dayOfYear ${dayOfYear} for month ${dayData.month}, day ${dayData.day}`);
            }

            const stats = {
                month: dayData.month,
                day: dayData.day,
                dayOfYear: dayOfYear,
                sampleCount: Math.max(dayData.tmaxValues.length, dayData.tminValues.length)
            };

            // Calculate Tmax statistics
            if (dayData.tmaxValues.length > 0) {
                const values = dayData.tmaxValues.map(v => v.value);

                // Calculate mean
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

                // Calculate standard deviation
                const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
                const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
                const stdDev = Math.sqrt(variance);

                // Find max and min
                let maxValue = -Infinity;
                let maxYear = null;
                let minValue = Infinity;
                let minYear = null;

                dayData.tmaxValues.forEach(item => {
                    if (item.value > maxValue) {
                        maxValue = item.value;
                        maxYear = item.year;
                    }
                    if (item.value < minValue) {
                        minValue = item.value;
                        minYear = item.year;
                    }
                });

                // Add Tmax statistics
                stats.mean = mean;
                stats.std = stdDev;
                stats.max = maxValue;
                stats.maxYear = maxYear;
                stats.min = minValue;
                stats.minYear = minYear;
            }

            // Calculate Tmin statistics
            if (dayData.tminValues.length > 0) {
                const values = dayData.tminValues.map(v => v.value);

                // Calculate mean
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

                // Calculate standard deviation
                const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
                const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
                const stdDev = Math.sqrt(variance);

                // Find max and min
                let maxValue = -Infinity;
                let maxYear = null;
                let minValue = Infinity;
                let minYear = null;

                dayData.tminValues.forEach(item => {
                    if (item.value > maxValue) {
                        maxValue = item.value;
                        maxYear = item.year;
                    }
                    if (item.value < minValue) {
                        minValue = item.value;
                        minYear = item.year;
                    }
                });

                // Add Tmin statistics
                stats.tminMean = mean;
                stats.tminStd = stdDev;
                stats.tminMax = maxValue;
                stats.tminMaxYear = maxYear;
                stats.tminMin = minValue;
                stats.tminMinYear = minYear;
            }

            // Calculate Rainfall statistics
            if (dayData.rainfallValues.length > 0) {
                const values = dayData.rainfallValues.map(v => v.value);

                console.log(`Calculating rainfall statistics for day ${dayData.month}-${dayData.day} with ${values.length} values:`, values);

                // Calculate mean
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

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

                // Add Rainfall statistics
                stats.rainfallMean = mean;
                stats.rainfallMax = maxValue;
                stats.rainfallMaxYear = maxYear;
                stats.rainfallMin = minValue;
                stats.rainfallMinYear = minYear;
                stats.rainfallValues = values;

                console.log(`Rainfall statistics for day ${dayData.month}-${dayData.day}:`, {
                    mean: mean,
                    max: maxValue,
                    maxYear: maxYear,
                    min: minValue,
                    minYear: minYear
                });
            } else {
                console.log(`No rainfall values for day ${dayData.month}-${dayData.day}`);
            }

            // Calculate Tmean statistics (average of Tmax and Tmin)
            if (stats.mean !== undefined && stats.tminMean !== undefined) {
                // Calculate mean temperature as average of Tmax mean and Tmin mean
                stats.tmeanMean = (stats.mean + stats.tminMean) / 2;

                // Calculate max temperature as average of corresponding Tmax and Tmin
                if (stats.max !== undefined && stats.tminMax !== undefined) {
                    // Find the highest average temperature
                    let tmeanMax = -Infinity;
                    let tmeanMaxYear = null;

                    // We need to find matching days with both Tmax and Tmin values
                    const matchingDays = dayData.tmaxValues.filter(tmax => {
                        return dayData.tminValues.some(tmin => tmin.year === tmax.year);
                    });

                    matchingDays.forEach(tmax => {
                        const matchingTmin = dayData.tminValues.find(tmin => tmin.year === tmax.year);
                        if (matchingTmin) {
                            const avgTemp = (tmax.value + matchingTmin.value) / 2;
                            if (avgTemp > tmeanMax) {
                                tmeanMax = avgTemp;
                                tmeanMaxYear = tmax.year;
                            }
                        }
                    });

                    stats.tmeanMax = tmeanMax !== -Infinity ? tmeanMax : (stats.max + stats.tminMax) / 2;
                    stats.tmeanMaxYear = tmeanMaxYear || stats.maxYear || stats.tminMaxYear;
                }

                // Calculate min temperature as average of corresponding Tmax and Tmin
                if (stats.min !== undefined && stats.tminMin !== undefined) {
                    // Find the lowest average temperature
                    let tmeanMin = Infinity;
                    let tmeanMinYear = null;

                    // We need to find matching days with both Tmax and Tmin values
                    const matchingDays = dayData.tmaxValues.filter(tmax => {
                        return dayData.tminValues.some(tmin => tmin.year === tmax.year);
                    });

                    matchingDays.forEach(tmax => {
                        const matchingTmin = dayData.tminValues.find(tmin => tmin.year === tmax.year);
                        if (matchingTmin) {
                            const avgTemp = (tmax.value + matchingTmin.value) / 2;
                            if (avgTemp < tmeanMin) {
                                tmeanMin = avgTemp;
                                tmeanMinYear = tmax.year;
                            }
                        }
                    });

                    stats.tmeanMin = tmeanMin !== Infinity ? tmeanMin : (stats.min + stats.tminMin) / 2;
                    stats.tmeanMinYear = tmeanMinYear || stats.minYear || stats.tminMinYear;
                }

                // Calculate standard deviation for Tmean
                stats.tmeanStd = Math.sqrt((Math.pow(stats.std, 2) + Math.pow(stats.tminStd, 2)) / 2);
            }

            return stats;
        });

        // Sort by month and day
        dailyStats.sort((a, b) => {
            if (a.month !== b.month) {
                return a.month - b.month;
            }
            return a.day - b.day;
        });

        return dailyStats;
    }

    /**
     * Calculate monthly statistics from historical data
     * @param {Array} historicalData - Historical data for a station
     * @returns {Array} - Monthly statistics
     */
    calculateMonthlyStatistics(historicalData) {
        // Early return if no data
        if (!historicalData || historicalData.length === 0) {
            return [];
        }

        // Group data by month
        const groupedByMonth = new Map();

        // Process each record
        historicalData.forEach(record => {
            // Skip records without month or year
            if (!record.Month || !record.Year) return;

            // Create a unique key for each month
            const key = `${record.Month}`;

            if (!groupedByMonth.has(key)) {
                groupedByMonth.set(key, {
                    month: record.Month,
                    tmaxValues: [],
                    tminValues: [],
                    rainfallValues: []
                });
            }

            const monthData = groupedByMonth.get(key);

            // Add Tmax value if it exists
            if (record.Tmax !== undefined && record.Tmax !== null && !isNaN(record.Tmax)) {
                monthData.tmaxValues.push({
                    year: record.Year,
                    value: record.Tmax
                });
            }

            // Add Tmin value if it exists
            if (record.Tmin !== undefined && record.Tmin !== null && !isNaN(record.Tmin)) {
                monthData.tminValues.push({
                    year: record.Year,
                    value: record.Tmin
                });
            }

            // Add Rainfall value if it exists
            if (record.Rainfall !== undefined && record.Rainfall !== null) {
                // Convert to number if it's not already
                let rainfallValue = record.Rainfall;
                if (typeof rainfallValue !== 'number') {
                    rainfallValue = Number(rainfallValue);
                }

                // Only add if it's a valid number
                if (!isNaN(rainfallValue)) {
                    monthData.rainfallValues.push({
                        year: record.Year,
                        value: rainfallValue
                    });
                }
            }
        });

        // Calculate statistics for each month
        const monthlyStats = Array.from(groupedByMonth.values()).map(monthData => {
            const stats = {
                month: monthData.month
            };

            // Calculate Tmax statistics
            if (monthData.tmaxValues.length > 0) {
                const values = monthData.tmaxValues.map(v => v.value);

                // Calculate mean
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

                // Calculate standard deviation
                const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
                const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
                const stdDev = Math.sqrt(variance);

                // Find max and min
                let maxValue = -Infinity;
                let maxYear = null;
                let minValue = Infinity;
                let minYear = null;

                monthData.tmaxValues.forEach(item => {
                    if (item.value > maxValue) {
                        maxValue = item.value;
                        maxYear = item.year;
                    }
                    if (item.value < minValue) {
                        minValue = item.value;
                        minYear = item.year;
                    }
                });

                // Add Tmax statistics
                stats.mean = mean;
                stats.std = stdDev;
                stats.max = maxValue;
                stats.maxYear = maxYear;
                stats.min = minValue;
                stats.minYear = minYear;
            }

            // Calculate Tmin statistics
            if (monthData.tminValues.length > 0) {
                const values = monthData.tminValues.map(v => v.value);

                // Calculate mean
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

                // Calculate standard deviation
                const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
                const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
                const stdDev = Math.sqrt(variance);

                // Find max and min
                let maxValue = -Infinity;
                let maxYear = null;
                let minValue = Infinity;
                let minYear = null;

                monthData.tminValues.forEach(item => {
                    if (item.value > maxValue) {
                        maxValue = item.value;
                        maxYear = item.year;
                    }
                    if (item.value < minValue) {
                        minValue = item.value;
                        minYear = item.year;
                    }
                });

                // Add Tmin statistics
                stats.tminMean = mean;
                stats.tminStd = stdDev;
                stats.tminMax = maxValue;
                stats.tminMaxYear = maxYear;
                stats.tminMin = minValue;
                stats.tminMinYear = minYear;
            }

            // Calculate Rainfall statistics
            if (monthData.rainfallValues.length > 0) {
                const values = monthData.rainfallValues.map(v => v.value);

                // Calculate mean
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

                // Calculate standard deviation
                const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
                const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
                const stdDev = Math.sqrt(variance);

                // Find max and min
                let maxValue = -Infinity;
                let maxYear = null;
                let minValue = Infinity;
                let minYear = null;

                monthData.rainfallValues.forEach(item => {
                    if (item.value > maxValue) {
                        maxValue = item.value;
                        maxYear = item.year;
                    }
                    if (item.value < minValue) {
                        minValue = item.value;
                        minYear = item.year;
                    }
                });

                // Add Rainfall statistics
                stats.rainfallMean = mean;
                stats.rainfallStd = stdDev;
                stats.rainfallMax = maxValue;
                stats.rainfallMaxYear = maxYear;
                stats.rainfallMin = minValue;
                stats.rainfallMinYear = minYear;
                stats.rainfallValues = values;
            }

            // Calculate Tmean statistics (average of Tmax and Tmin)
            if (stats.mean !== undefined && stats.tminMean !== undefined) {
                // Calculate mean temperature as average of Tmax mean and Tmin mean
                stats.tmeanMean = (stats.mean + stats.tminMean) / 2;

                // Calculate standard deviation for Tmean
                if (stats.std !== undefined && stats.tminStd !== undefined) {
                    stats.tmeanStd = Math.sqrt((Math.pow(stats.std, 2) + Math.pow(stats.tminStd, 2)) / 2);
                }

                // Calculate max and min for Tmean
                if (stats.max !== undefined && stats.tminMax !== undefined) {
                    // For monthly stats, we'll use a simpler approach - average of the max values
                    stats.tmeanMax = (stats.max + stats.tminMax) / 2;
                    stats.tmeanMaxYear = stats.maxYear || stats.tminMaxYear;
                }

                if (stats.min !== undefined && stats.tminMin !== undefined) {
                    // Average of the min values
                    stats.tmeanMin = (stats.min + stats.tminMin) / 2;
                    stats.tmeanMinYear = stats.minYear || stats.tminMinYear;
                }
            }

            return stats;
        });

        // Sort by month
        monthlyStats.sort((a, b) => a.month - b.month);

        return monthlyStats;
    }
}
