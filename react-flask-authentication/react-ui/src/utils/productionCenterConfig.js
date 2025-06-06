/**
 * Production Center Configuration Dictionary
 * This utility provides configuration for production centers, cutting rooms, destinations,
 * and their valid combinations with corresponding keys.
 */

// Production Center Options
export const PRODUCTION_CENTERS = {
  PXE1: 'PXE1',
  PXE3: 'PXE3'
};

// Cutting Room Options
export const CUTTING_ROOMS = {
  ZALLI: 'ZALLI',
  VEGATEX: 'VEGATEX',
  SYNA_STYLE: 'SYNA STYLE',
  IDEAL_FASHION: 'IDEAL FASHION',
  SYNA_FASHION: 'SYNA FASHION',
  ZEYTEX: 'ZEYTEX',
  DELITSIYA_FASHION: 'DELITSIYA FASHION'
};

// Destination Options
export const DESTINATIONS = {
  ZALLI_1_SECTOR_1: 'ZALLI 1 - SECTOR 1',
  ZALLI_1_SECTOR_2: 'ZALLI 1 - SECTOR 2',
  ZALLI_1_SECTOR_3: 'ZALLI 1 - SECTOR 3',
  ZALLI_2: 'ZALLI 2',
  ZALLI_3: 'ZALLI 3',
  DELITSIYA_FASHION: 'DELITSIYA FASHION',
  VEGATEX: 'VEGATEX',
  SYNA_STYLE: 'SYNA STYLE',
  IDEAL_FASHION: 'IDEAL FASHION',
  SYNA_FASHION: 'SYNA FASHION',
  ZEYTEX: 'ZEYTEX'
};

// Production Center to Cutting Room mapping
export const PRODUCTION_CENTER_CUTTING_ROOMS = {
  [PRODUCTION_CENTERS.PXE1]: [CUTTING_ROOMS.ZALLI],
  [PRODUCTION_CENTERS.PXE3]: [
    CUTTING_ROOMS.VEGATEX,
    CUTTING_ROOMS.SYNA_STYLE,
    CUTTING_ROOMS.IDEAL_FASHION,
    CUTTING_ROOMS.SYNA_FASHION,
    CUTTING_ROOMS.ZEYTEX,
    CUTTING_ROOMS.DELITSIYA_FASHION
  ]
};

// Cutting Room to Destination mapping
export const CUTTING_ROOM_DESTINATIONS = {
  [CUTTING_ROOMS.ZALLI]: [
    DESTINATIONS.ZALLI_1_SECTOR_1,
    DESTINATIONS.ZALLI_1_SECTOR_2,
    DESTINATIONS.ZALLI_1_SECTOR_3,
    DESTINATIONS.ZALLI_2,
    DESTINATIONS.ZALLI_3,
    DESTINATIONS.DELITSIYA_FASHION
  ],
  [CUTTING_ROOMS.VEGATEX]: [
    DESTINATIONS.VEGATEX,
    DESTINATIONS.SYNA_STYLE,
    DESTINATIONS.IDEAL_FASHION,
    DESTINATIONS.SYNA_FASHION,
    DESTINATIONS.ZEYTEX
  ],
  [CUTTING_ROOMS.SYNA_STYLE]: [
    DESTINATIONS.VEGATEX,
    DESTINATIONS.SYNA_STYLE,
    DESTINATIONS.IDEAL_FASHION,
    DESTINATIONS.SYNA_FASHION,
    DESTINATIONS.ZEYTEX
  ],
  [CUTTING_ROOMS.IDEAL_FASHION]: [
    DESTINATIONS.VEGATEX,
    DESTINATIONS.SYNA_STYLE,
    DESTINATIONS.IDEAL_FASHION,
    DESTINATIONS.SYNA_FASHION,
    DESTINATIONS.ZEYTEX
  ],
  [CUTTING_ROOMS.SYNA_FASHION]: [
    DESTINATIONS.VEGATEX,
    DESTINATIONS.SYNA_STYLE,
    DESTINATIONS.IDEAL_FASHION,
    DESTINATIONS.SYNA_FASHION,
    DESTINATIONS.ZEYTEX
  ],
  [CUTTING_ROOMS.ZEYTEX]: [
    DESTINATIONS.VEGATEX,
    DESTINATIONS.SYNA_STYLE,
    DESTINATIONS.IDEAL_FASHION,
    DESTINATIONS.SYNA_FASHION,
    DESTINATIONS.ZEYTEX
  ],
  [CUTTING_ROOMS.DELITSIYA_FASHION]: [
    DESTINATIONS.VEGATEX,
    DESTINATIONS.SYNA_STYLE,
    DESTINATIONS.IDEAL_FASHION,
    DESTINATIONS.SYNA_FASHION,
    DESTINATIONS.ZEYTEX
  ]
};

// Cutting Room + Destination combination keys
export const COMBINATION_KEYS = {
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_1_SECTOR_1}`]: 'Z11',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_1_SECTOR_2}`]: 'Z12',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_1_SECTOR_3}`]: 'Z13',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_2}`]: 'Z2',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_3}`]: 'Z3',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.DELITSIYA_FASHION}`]: 'ZDF',
  
  [`${CUTTING_ROOMS.VEGATEX}+${DESTINATIONS.VEGATEX}`]: 'VV',
  [`${CUTTING_ROOMS.VEGATEX}+${DESTINATIONS.SYNA_STYLE}`]: 'VSS',
  [`${CUTTING_ROOMS.VEGATEX}+${DESTINATIONS.IDEAL_FASHION}`]: 'VIF',
  [`${CUTTING_ROOMS.VEGATEX}+${DESTINATIONS.SYNA_FASHION}`]: 'VSF',
  [`${CUTTING_ROOMS.VEGATEX}+${DESTINATIONS.ZEYTEX}`]: 'VZ',
  
  [`${CUTTING_ROOMS.SYNA_STYLE}+${DESTINATIONS.VEGATEX}`]: 'SSV',
  [`${CUTTING_ROOMS.SYNA_STYLE}+${DESTINATIONS.SYNA_STYLE}`]: 'SSSS',
  [`${CUTTING_ROOMS.SYNA_STYLE}+${DESTINATIONS.IDEAL_FASHION}`]: 'SSIF',
  [`${CUTTING_ROOMS.SYNA_STYLE}+${DESTINATIONS.SYNA_FASHION}`]: 'SSSF',
  [`${CUTTING_ROOMS.SYNA_STYLE}+${DESTINATIONS.ZEYTEX}`]: 'SSZ',
  
  [`${CUTTING_ROOMS.IDEAL_FASHION}+${DESTINATIONS.VEGATEX}`]: 'IFV',
  [`${CUTTING_ROOMS.IDEAL_FASHION}+${DESTINATIONS.SYNA_STYLE}`]: 'IFSS',
  [`${CUTTING_ROOMS.IDEAL_FASHION}+${DESTINATIONS.IDEAL_FASHION}`]: 'IFIF',
  [`${CUTTING_ROOMS.IDEAL_FASHION}+${DESTINATIONS.SYNA_FASHION}`]: 'IFSF',
  [`${CUTTING_ROOMS.IDEAL_FASHION}+${DESTINATIONS.ZEYTEX}`]: 'IFZ',
  
  [`${CUTTING_ROOMS.SYNA_FASHION}+${DESTINATIONS.VEGATEX}`]: 'SFV',
  [`${CUTTING_ROOMS.SYNA_FASHION}+${DESTINATIONS.SYNA_STYLE}`]: 'SFSS',
  [`${CUTTING_ROOMS.SYNA_FASHION}+${DESTINATIONS.IDEAL_FASHION}`]: 'SFIF',
  [`${CUTTING_ROOMS.SYNA_FASHION}+${DESTINATIONS.SYNA_FASHION}`]: 'SFSF',
  [`${CUTTING_ROOMS.SYNA_FASHION}+${DESTINATIONS.ZEYTEX}`]: 'SFZ',
  
  [`${CUTTING_ROOMS.ZEYTEX}+${DESTINATIONS.VEGATEX}`]: 'ZTV',
  [`${CUTTING_ROOMS.ZEYTEX}+${DESTINATIONS.SYNA_STYLE}`]: 'ZTSS',
  [`${CUTTING_ROOMS.ZEYTEX}+${DESTINATIONS.IDEAL_FASHION}`]: 'ZTIF',
  [`${CUTTING_ROOMS.ZEYTEX}+${DESTINATIONS.SYNA_FASHION}`]: 'ZTSF',
  [`${CUTTING_ROOMS.ZEYTEX}+${DESTINATIONS.ZEYTEX}`]: 'ZTZT',
  
  [`${CUTTING_ROOMS.DELITSIYA_FASHION}+${DESTINATIONS.VEGATEX}`]: 'DFV',
  [`${CUTTING_ROOMS.DELITSIYA_FASHION}+${DESTINATIONS.SYNA_STYLE}`]: 'DFSS',
  [`${CUTTING_ROOMS.DELITSIYA_FASHION}+${DESTINATIONS.IDEAL_FASHION}`]: 'DFIF',
  [`${CUTTING_ROOMS.DELITSIYA_FASHION}+${DESTINATIONS.SYNA_FASHION}`]: 'DFSF',
  [`${CUTTING_ROOMS.DELITSIYA_FASHION}+${DESTINATIONS.ZEYTEX}`]: 'DFZ'
};

// Utility Functions

/**
 * Get available cutting rooms for a production center
 * @param {string} productionCenter - The production center (PXE1 or PXE3)
 * @returns {string[]} Array of available cutting rooms
 */
export const getCuttingRoomsForProductionCenter = (productionCenter) => {
  return PRODUCTION_CENTER_CUTTING_ROOMS[productionCenter] || [];
};

/**
 * Get available destinations for a cutting room
 * @param {string} cuttingRoom - The cutting room
 * @returns {string[]} Array of available destinations
 */
export const getDestinationsForCuttingRoom = (cuttingRoom) => {
  return CUTTING_ROOM_DESTINATIONS[cuttingRoom] || [];
};

/**
 * Get the combination key for cutting room + destination
 * @param {string} cuttingRoom - The cutting room
 * @param {string} destination - The destination
 * @returns {string|null} The combination key or null if not found
 */
export const getCombinationKey = (cuttingRoom, destination) => {
  const key = `${cuttingRoom}+${destination}`;
  return COMBINATION_KEYS[key] || null;
};

/**
 * Check if a cutting room and destination combination is valid
 * @param {string} cuttingRoom - The cutting room
 * @param {string} destination - The destination
 * @returns {boolean} True if the combination is valid
 */
export const isValidCombination = (cuttingRoom, destination) => {
  const availableDestinations = getDestinationsForCuttingRoom(cuttingRoom);
  return availableDestinations.includes(destination);
};

/**
 * Get all production center options as array for dropdowns
 * @returns {Array} Array of {value, label} objects
 */
export const getProductionCenterOptions = () => {
  return Object.values(PRODUCTION_CENTERS).map(pc => ({
    value: pc,
    label: pc
  }));
};

/**
 * Get cutting room options for dropdown based on production center
 * @param {string} productionCenter - The selected production center
 * @returns {Array} Array of {value, label} objects
 */
export const getCuttingRoomOptions = (productionCenter) => {
  const cuttingRooms = getCuttingRoomsForProductionCenter(productionCenter);
  return cuttingRooms.map(cr => ({
    value: cr,
    label: cr
  }));
};

/**
 * Get destination options for dropdown based on cutting room
 * @param {string} cuttingRoom - The selected cutting room
 * @returns {Array} Array of {value, label} objects
 */
export const getDestinationOptions = (cuttingRoom) => {
  const destinations = getDestinationsForCuttingRoom(cuttingRoom);
  return destinations.map(dest => ({
    value: dest,
    label: dest
  }));
};
