/**
 * Dashboard Data Processing Utilities
 * Handles client-side filtering and aggregation of mattress data
 */

/**
 * Group mattress data by time period
 * @param {Array} data - Raw mattress data
 * @param {string} period - 'today', 'week', 'month', 'year'
 * @returns {Array} Array of period buckets with their data
 */
export const groupByPeriod = (data, period) => {
    const now = new Date();
    let buckets = [];

    if (period === 'today') {
        // Single bucket for today
        buckets = [{ label: 'Today', data: data }];
    } else if (period === 'week') {
        // 7 daily buckets
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            buckets.push({
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                data: data.filter(item => {
                    const itemDate = new Date(item.phase_date);
                    return itemDate >= date && itemDate < nextDate;
                })
            });
        }
    } else if (period === 'month') {
        // 4 weekly buckets
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            buckets.push({
                label: `Week ${4 - i}`,
                data: data.filter(item => {
                    const itemDate = new Date(item.phase_date);
                    return itemDate >= weekStart && itemDate < weekEnd;
                })
            });
        }
    } else if (period === 'year') {
        // 12 monthly buckets
        const currentYear = now.getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(currentYear, month, 1, 0, 0, 0, 0);
            const monthEnd = new Date(currentYear, month + 1, 1, 0, 0, 0, 0);

            buckets.push({
                label: months[month],
                data: data.filter(item => {
                    const itemDate = new Date(item.phase_date);
                    return itemDate >= monthStart && itemDate < monthEnd;
                })
            });
        }
    }

    return buckets;
};

/**
 * Calculate total meters from data
 * @param {Array} data - Mattress data
 * @returns {number} Total meters
 */
export const calculateTotalMeters = (data) => {
    return data.reduce((sum, item) => sum + (item.cons_actual || 0), 0);
};

/**
 * Group data by a specific field
 * @param {Array} data - Mattress data
 * @param {string} field - Field to group by ('brand', 'style', 'spreader', 'operator', 'production_center')
 * @returns {Object} Object with keys as group names and values as arrays of data
 */
export const groupByField = (data, field) => {
    const groups = {};
    
    data.forEach(item => {
        const key = item[field] || 'Unknown';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });

    return groups;
};

/**
 * Create chart series data with breakdown
 * @param {Array} data - Raw mattress data
 * @param {string} period - Time period
 * @param {string} breakdown - Breakdown type ('none', 'brand', 'style', 'spreader', 'operator')
 * @returns {Object} Chart series data
 */
export const createChartSeries = (data, period, breakdown) => {
    // Group data by time period
    const periodBuckets = groupByPeriod(data, period);
    const categories = periodBuckets.map(bucket => bucket.label);

    if (breakdown === 'none') {
        // Single series with total meters per period
        const seriesData = periodBuckets.map(bucket => 
            Math.round(calculateTotalMeters(bucket.data))
        );

        return {
            categories,
            series: [{
                name: 'Total',
                data: seriesData
            }],
            totalMeters: Math.round(calculateTotalMeters(data))
        };
    } else {
        // Multiple series based on breakdown
        const allKeys = new Set();
        const breakdownData = [];

        // For each time period, group by breakdown field
        periodBuckets.forEach(bucket => {
            const groups = groupByField(bucket.data, breakdown);
            breakdownData.push(groups);
            Object.keys(groups).forEach(key => allKeys.add(key));
        });

        // Create series for each breakdown key
        const series = Array.from(allKeys).sort().map(key => ({
            name: key,
            data: breakdownData.map(periodGroups => {
                const groupData = periodGroups[key] || [];
                return Math.round(calculateTotalMeters(groupData));
            })
        }));

        return {
            categories,
            series,
            totalMeters: Math.round(calculateTotalMeters(data))
        };
    }
};

/**
 * Filter data by cutting room
 * @param {Array} data - Mattress data
 * @param {string} cuttingRoom - Cutting room name or 'ALL'
 * @returns {Array} Filtered data
 */
export const filterByCuttingRoom = (data, cuttingRoom) => {
    if (cuttingRoom === 'ALL') {
        return data;
    }
    return data.filter(item => item.production_center === cuttingRoom);
};

/**
 * Get brand colors
 * @param {string} brand - Brand name
 * @returns {string} Color hex code
 */
export const getBrandColor = (brand) => {
    const brandColors = {
        'CALZEDONIA': '#66BB6A',  // Green
        'INTIMISSIMI': '#F06292',  // Rose pink
        'TEZENIS': '#42A5F5',      // Bright blue
        'FALCONERI': '#FFF59D'     // Pastel yellow
    };
    return brandColors[brand] || '#9E9E9E'; // Default gray
};

/**
 * Get colors for series based on breakdown type
 * @param {Array} series - Chart series
 * @param {string} breakdown - Breakdown type
 * @param {Function} getCuttingRoomColor - Function to get cutting room colors
 * @returns {Array} Array of color hex codes
 */
export const getSeriesColors = (series, breakdown, getCuttingRoomColor) => {
    if (breakdown === 'brand') {
        return series.map(s => getBrandColor(s.name));
    } else if (breakdown === 'production_center') {
        return series.map(s => getCuttingRoomColor(s.name));
    } else {
        // Generate colors for other breakdowns
        const baseColors = [
            '#1976d2', '#dc004e', '#9c27b0', '#f57c00',
            '#388e3c', '#0097a7', '#5d4037', '#616161'
        ];
        return series.map((_, index) => baseColors[index % baseColors.length]);
    }
};

