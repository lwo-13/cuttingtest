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
  VERONA: 'VERONA',
  TEXCONS: 'TEXCONS',
  VEGATEX: 'VEGATEX',
  SINA_STYLE: 'SINA STYLE',
  ZEYNTEX: 'ZEYNTEX',
  DELICIA: 'DELICIA',
  VAIDE_MOLA: 'VAIDE MOLA',
  HADJIOLI: 'HADJIOLI',
  YUMER: 'YUMER',
  RILA_TEXTILE: 'RILA TEXTILE'
};

// Destination Options
export const DESTINATIONS = {
  ZALLI_1_SECTOR_1: 'ZALLI 1 - SECTOR 1',
  ZALLI_1_SECTOR_2: 'ZALLI 1 - SECTOR 2',
  ZALLI_1_SECTOR_3: 'ZALLI 1 - SECTOR 3',
  ZALLI_2: 'ZALLI 2',
  ZALLI_3: 'ZALLI 3',
  VERONA: 'VERONA',
  TEXCONS: 'TEXCONS',
  DELICIA: 'DELICIA',
  VEGATEX: 'VEGATEX',
  SINA_STYLE: 'SINA STYLE',
  ZEYNTEX: 'ZEYNTEX',
  VAIDE_MOLA: 'VAIDE MOLA',
  HADJIOLI: 'HADJIOLI',
  YUMER: 'YUMER',
  RILA_TEXTILE: 'RILA TEXTILE',
  SUNAI: 'SUNAI',
  NADJI: 'NADJI',
  SABRI89: 'SABRI89',
  INTERTOP: 'INTERTOP',
  SANIA: 'SANIA',
  CUTTING_SECTION: 'CUTTING SECTION'
};

// Production Center to Cutting Room mapping
export const PRODUCTION_CENTER_CUTTING_ROOMS = {
  [PRODUCTION_CENTERS.PXE1]: [
    CUTTING_ROOMS.ZALLI,
    CUTTING_ROOMS.VERONA,
    CUTTING_ROOMS.TEXCONS
  ],
  [PRODUCTION_CENTERS.PXE3]: [
    CUTTING_ROOMS.VEGATEX,
    CUTTING_ROOMS.SINA_STYLE,
    CUTTING_ROOMS.ZEYNTEX,
    CUTTING_ROOMS.DELICIA,
    CUTTING_ROOMS.VAIDE_MOLA,
    CUTTING_ROOMS.HADJIOLI,
    CUTTING_ROOMS.YUMER,
    CUTTING_ROOMS.RILA_TEXTILE
  ]
};

// Cutting Room to Destination mapping
export const CUTTING_ROOM_DESTINATIONS = {
  // PXE1 cutting rooms
  [CUTTING_ROOMS.ZALLI]: [
    DESTINATIONS.ZALLI_1_SECTOR_1,
    DESTINATIONS.ZALLI_1_SECTOR_2,
    DESTINATIONS.ZALLI_1_SECTOR_3,
    DESTINATIONS.ZALLI_2,
    DESTINATIONS.ZALLI_3,
    DESTINATIONS.TEXCONS,
    DESTINATIONS.VERONA,
    DESTINATIONS.INTERTOP,
    DESTINATIONS.SANIA,
    DESTINATIONS.CUTTING_SECTION
  ],
  [CUTTING_ROOMS.VERONA]: [
    DESTINATIONS.VERONA
  ],
  [CUTTING_ROOMS.TEXCONS]: [
    DESTINATIONS.TEXCONS
  ],

  // PXE3 cutting rooms - each connected to its own destination
  [CUTTING_ROOMS.VEGATEX]: [
    DESTINATIONS.VEGATEX
  ],
  [CUTTING_ROOMS.SINA_STYLE]: [
    DESTINATIONS.SINA_STYLE
  ],
  [CUTTING_ROOMS.ZEYNTEX]: [
    DESTINATIONS.ZEYNTEX
  ],
  [CUTTING_ROOMS.DELICIA]: [
    DESTINATIONS.DELICIA,
    DESTINATIONS.SUNAI,
    DESTINATIONS.NADJI,
    DESTINATIONS.SABRI89
  ],
  [CUTTING_ROOMS.VAIDE_MOLA]: [
    DESTINATIONS.VAIDE_MOLA
  ],
  [CUTTING_ROOMS.HADJIOLI]: [
    DESTINATIONS.HADJIOLI
  ],
  [CUTTING_ROOMS.YUMER]: [
    DESTINATIONS.YUMER
  ],
  [CUTTING_ROOMS.RILA_TEXTILE]: [
    DESTINATIONS.RILA_TEXTILE
  ]
};

// Cutting Room + Destination combination keys
export const COMBINATION_KEYS = {
  // PXE1 - ZALLI combinations
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_1_SECTOR_1}`]: 'Z11',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_1_SECTOR_2}`]: 'Z12',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_1_SECTOR_3}`]: 'Z13',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_2}`]: 'Z2',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.ZALLI_3}`]: 'Z3',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.TEXCONS}`]: 'ZTC',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.VERONA}`]: 'ZV',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.INTERTOP}`]: 'ZI',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.SANIA}`]: 'ZS',
  [`${CUTTING_ROOMS.ZALLI}+${DESTINATIONS.CUTTING_SECTION}`]: 'ZC',

  // PXE1 - VERONA combinations
  [`${CUTTING_ROOMS.VERONA}+${DESTINATIONS.VERONA}`]: 'VV',

  // PXE1 - TEXCONS combinations
  [`${CUTTING_ROOMS.TEXCONS}+${DESTINATIONS.TEXCONS}`]: 'TT',

  // PXE3 - VEGATEX combinations
  [`${CUTTING_ROOMS.VEGATEX}+${DESTINATIONS.VEGATEX}`]: 'VGT',

  // PXE3 - SINA STYLE combinations
  [`${CUTTING_ROOMS.SINA_STYLE}+${DESTINATIONS.SINA_STYLE}`]: 'SS',

  // PXE3 - ZEYNTEX combinations
  [`${CUTTING_ROOMS.ZEYNTEX}+${DESTINATIONS.ZEYNTEX}`]: 'ZT',

  // PXE3 - DELICIA combinations
  [`${CUTTING_ROOMS.DELICIA}+${DESTINATIONS.DELICIA}`]: 'DD',
  [`${CUTTING_ROOMS.DELICIA}+${DESTINATIONS.SUNAI}`]: 'DSU',
  [`${CUTTING_ROOMS.DELICIA}+${DESTINATIONS.NADJI}`]: 'DN',
  [`${CUTTING_ROOMS.DELICIA}+${DESTINATIONS.SABRI89}`]: 'DS89',

  // PXE3 - VAIDE MOLA combinations
  [`${CUTTING_ROOMS.VAIDE_MOLA}+${DESTINATIONS.VAIDE_MOLA}`]: 'VM',

  // PXE3 - HADJIOLI combinations
  [`${CUTTING_ROOMS.HADJIOLI}+${DESTINATIONS.HADJIOLI}`]: 'HDJ',

  // PXE3 - YUMER combinations
  [`${CUTTING_ROOMS.YUMER}+${DESTINATIONS.YUMER}`]: 'YM',

  // PXE3 - RILA TEXTILE combinations
  [`${CUTTING_ROOMS.RILA_TEXTILE}+${DESTINATIONS.RILA_TEXTILE}`]: 'RT'
};

// Cutting Room Color Configuration
export const CUTTING_ROOM_COLORS = {
  [CUTTING_ROOMS.ZALLI]: '#1976d2',        // Strong blue (primary)
  [CUTTING_ROOMS.VERONA]: '#0d47a1',       // Darker blue (different from ZALLI)
  [CUTTING_ROOMS.DELICIA]: '#9c27b0',      // Purple
  [CUTTING_ROOMS.HADJIOLI]: '#424242',     // Dark grey
  [CUTTING_ROOMS.SINA_STYLE]: '#f44336',   // Red
  [CUTTING_ROOMS.TEXCONS]: '#e91e63',      // Pink
  [CUTTING_ROOMS.VEGATEX]: '#4caf50',      // Green
  [CUTTING_ROOMS.ZEYNTEX]: '#00bcd4',      // Cyan
  [CUTTING_ROOMS.VAIDE_MOLA]: '#9e9e9e',   // Light grey
  [CUTTING_ROOMS.YUMER]: '#795548',        // Brown
  [CUTTING_ROOMS.RILA_TEXTILE]: '#607d8b'  // Blue grey
};

/**
 * Get the color for a cutting room
 * @param {string} cuttingRoom - The cutting room name
 * @returns {string} The hex color code for the cutting room
 */
export const getCuttingRoomColor = (cuttingRoom) => {
  return CUTTING_ROOM_COLORS[cuttingRoom] || '#9e9e9e'; // Default grey if not found
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

/**
 * Check if a cutting room has only one possible destination
 * @param {string} cuttingRoom - The cutting room
 * @returns {boolean} True if the cutting room has exactly one destination
 */
export const hasOnlyOneDestination = (cuttingRoom) => {
  const destinations = getDestinationsForCuttingRoom(cuttingRoom);
  return destinations.length === 1;
};

/**
 * Get the auto-selected destination for a cutting room (if it has only one)
 * @param {string} cuttingRoom - The cutting room
 * @returns {string|null} The destination value if only one exists, null otherwise
 */
export const getAutoSelectedDestination = (cuttingRoom) => {
  if (hasOnlyOneDestination(cuttingRoom)) {
    const destinations = getDestinationsForCuttingRoom(cuttingRoom);
    return destinations[0];
  }
  return null;
};

/**
 * Extract the base cutting room from username
 * Handles cases like "DELICIA2" -> "DELICIA", "SINASTYLE_D" -> "SINA STYLE"
 * @param {string} username - The username to extract cutting room from
 * @returns {string|null} The cutting room name or username if no match found
 */
export const getCuttingRoomFromUsername = (username) => {
  if (!username) return null;

  const usernameUpper = username.toUpperCase();
  const cuttingRoomNames = Object.values(CUTTING_ROOMS);

  for (const roomName of cuttingRoomNames) {
    const roomNameUpper = roomName.toUpperCase();

    // First try exact prefix match (handles cases like "DELICIA2" -> "DELICIA")
    if (usernameUpper.startsWith(roomNameUpper)) {
      return roomName;
    }

    // Then try normalized match (remove spaces and check if username starts with it)
    // This handles cases like "SINASTYLE_D" -> "SINA STYLE"
    const normalizedRoomName = roomNameUpper.replace(/\s+/g, '');
    if (usernameUpper.startsWith(normalizedRoomName)) {
      return roomName;
    }
  }

  // If no match found, return the username as-is (backward compatibility)
  return username;
};
