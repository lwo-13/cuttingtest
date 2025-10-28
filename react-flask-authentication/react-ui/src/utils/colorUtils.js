/**
 * Color utility functions for consistent chart coloring
 */

// Maximally distinct color palette using HSL color space
// Colors are distributed across the hue spectrum with alternating saturation/lightness
// to ensure maximum visual distinction between adjacent colors
const STYLE_COLOR_PALETTE = [
    '#E53E3E', // Red
    '#3182CE', // Blue
    '#38A169', // Green
    '#DD6B20', // Orange
    '#805AD5', // Purple
    '#319795', // Teal
    '#D53F8C', // Pink
    '#718096', // Gray
    '#F56565', // Light Red
    '#4299E1', // Light Blue
    '#68D391', // Light Green
    '#ED8936', // Light Orange
    '#9F7AEA', // Light Purple
    '#4FD1C7', // Light Teal
    '#F687B3', // Light Pink
    '#A0AEC0', // Light Gray
    '#C53030', // Dark Red
    '#2B6CB0', // Dark Blue
    '#2F855A', // Dark Green
    '#C05621', // Dark Orange
    '#6B46C1', // Dark Purple
    '#2C7A7B', // Dark Teal
    '#B83280', // Dark Pink
    '#4A5568', // Dark Gray
    '#FC8181', // Coral
    '#63B3ED', // Sky Blue
    '#9AE6B4', // Mint Green
    '#F6AD55', // Peach
    '#B794F6', // Lavender
    '#81E6D9', // Aqua
    '#FBB6CE', // Rose
    '#CBD5E0', // Silver
    '#E2E8F0', // Platinum
    '#FED7D7', // Blush
    '#BEE3F8', // Ice Blue
    '#C6F6D5', // Mint
    '#FEEBC8', // Cream
    '#E9D8FD', // Lilac
    '#B2F5EA', // Seafoam
    '#FED7E2', // Powder Pink
    '#EDF2F7', // Mist
    '#FF6B6B', // Bright Coral
    '#4ECDC4', // Turquoise
    '#45B7D1', // Ocean Blue
    '#96CEB4', // Sage Green
    '#FFEAA7', // Banana Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint Cream
    '#F7DC6F', // Lemon
    '#BB8FCE'  // Amethyst
];

/**
 * Simple hash function to convert string to number
 * @param {string} str - The string to hash
 * @returns {number} - Hash value
 */
function simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
}

/**
 * Get a consistent color for a given name (style, operator, etc.)
 * This function will always return the same color for the same name
 * @param {string} name - The name to get color for
 * @returns {string} - Hex color code
 */
export function getConsistentColor(name) {
    if (!name || typeof name !== 'string') {
        return STYLE_COLOR_PALETTE[0]; // Default color
    }
    
    const hash = simpleHash(name.toUpperCase());
    const colorIndex = hash % STYLE_COLOR_PALETTE.length;
    return STYLE_COLOR_PALETTE[colorIndex];
}

/**
 * Get consistent colors for an array of names
 * @param {string[]} names - Array of names to get colors for
 * @returns {string[]} - Array of hex color codes
 */
export function getConsistentColors(names) {
    return names.map(name => getConsistentColor(name));
}

/**
 * Brand color mapping (for brand breakdown)
 */
export const BRAND_COLORS = {
    'INTIMISSIMI': '#E91E63',     // Pink
    'CALZEDONIA': '#9C27B0',      // Purple
    'TEZENIS': '#42A5F5',         // Bright blue
    'FALCONERI': '#FFF59D'        // Pastel yellow
};

/**
 * Get color for brand breakdown with fallback to consistent color
 * @param {string} brandName - The brand name
 * @returns {string} - Hex color code
 */
export function getBrandColor(brandName) {
    return BRAND_COLORS[brandName] || getConsistentColor(brandName);
}
