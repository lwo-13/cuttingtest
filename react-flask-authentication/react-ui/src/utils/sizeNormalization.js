/**
 * Utility functions for normalizing size formats to handle different formatting
 * between order sizes and marker sizes.
 * 
 * Examples:
 * - "3-4" -> "3_4" 
 * - "4-5" -> "4_5"
 * - "S" -> "S" (unchanged)
 * - "3_4" -> "3_4" (unchanged)
 */

/**
 * Normalize a single size string
 * @param {string} size - The size string to normalize
 * @returns {string} - The normalized size string
 */
export const normalizeSize = (size) => {
    if (!size || typeof size !== 'string') {
        return size;
    }
    // Replace hyphens with underscores for consistency
    return size.replace('-', '_');
};

/**
 * Normalize an array of sizes
 * @param {string[]} sizes - Array of size strings to normalize
 * @returns {string[]} - Array of normalized size strings
 */
export const normalizeSizes = (sizes) => {
    if (!Array.isArray(sizes)) {
        return sizes;
    }
    return sizes.map(normalizeSize);
};

/**
 * Normalize size keys in an object (like size quantities)
 * @param {Object} sizeObject - Object with size keys to normalize
 * @returns {Object} - Object with normalized size keys
 */
export const normalizeSizeObject = (sizeObject) => {
    if (!sizeObject || typeof sizeObject !== 'object') {
        return sizeObject;
    }
    
    const normalized = {};
    Object.entries(sizeObject).forEach(([size, value]) => {
        const normalizedSize = normalizeSize(size);
        normalized[normalizedSize] = value;
    });
    
    return normalized;
};

/**
 * Convert marker size quantities to match order size format
 * This is the reverse of normalization - converts "3_4" back to "3-4"
 * @param {Object} markerSizeQuantities - Marker size quantities with underscore format
 * @param {string[]} orderSizeNames - Array of order size names to match against
 * @returns {Object} - Size quantities object with keys matching order format
 */
export const convertMarkerSizesToOrderFormat = (markerSizeQuantities, orderSizeNames) => {
    if (!markerSizeQuantities || !orderSizeNames) {
        return {};
    }

    const result = {};

    // Create a mapping from normalized sizes to original order sizes
    const normalizedToOrder = {};
    orderSizeNames.forEach(orderSize => {
        const normalized = normalizeSize(orderSize);
        normalizedToOrder[normalized] = orderSize;
    });

    // Convert marker sizes to match order format
    Object.entries(markerSizeQuantities).forEach(([markerSize, quantity]) => {
        const normalizedMarkerSize = normalizeSize(markerSize);
        const matchingOrderSize = normalizedToOrder[normalizedMarkerSize];

        if (matchingOrderSize) {
            result[matchingOrderSize] = quantity;
        }
    });

    return result;
};

/**
 * Compare two size quantity objects with normalization
 * @param {Object} sizes1 - First size quantities object
 * @param {Object} sizes2 - Second size quantities object
 * @returns {boolean} - True if the normalized sizes match exactly
 */
export const areSizeQuantitiesEqual = (sizes1, sizes2) => {
    // Normalize both objects
    const normalizedSizes1 = normalizeSizeObject(sizes1 || {});
    const normalizedSizes2 = normalizeSizeObject(sizes2 || {});

    // Compare the normalized objects
    const keys1 = Object.keys(normalizedSizes1).sort();
    const keys2 = Object.keys(normalizedSizes2).sort();

    // Check if they have the same sizes
    if (keys1.length !== keys2.length) return false;
    if (keys1.join(',') !== keys2.join(',')) return false;

    // Check if quantities match
    for (const size of keys1) {
        if (normalizedSizes1[size] !== normalizedSizes2[size]) return false;
    }

    return true;
};
