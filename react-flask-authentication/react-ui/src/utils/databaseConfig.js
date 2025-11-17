/**
 * Server Configuration
 * This file stores server settings that are loaded from the server settings.
 * These values are populated by the Server Settings page and should be used across the application
 * instead of hardcoding credentials or URLs.
 */

export const SERVER_CONFIG = {
    // Database Configuration
    host: '',
    port: '',
    name: '',
    user: '',
    password: '',
    odbcDriver: 'ODBC Driver 18 for SQL Server',
    // Analytics Configuration
    consumptionAnalyticsPowerBiUrl: ''
};

/**
 * Update server configuration from server settings
 * Call this function after loading settings from the backend
 */
export const updateDatabaseConfig = (settings) => {
    if (settings) {
        SERVER_CONFIG.host = settings.databaseHost || '';
        SERVER_CONFIG.port = settings.databasePort || '';
        SERVER_CONFIG.name = settings.databaseName || '';
        SERVER_CONFIG.user = settings.databaseUser || '';
        SERVER_CONFIG.password = settings.databasePassword || '';
        SERVER_CONFIG.odbcDriver = settings.odbcDriver || 'ODBC Driver 18 for SQL Server';
        SERVER_CONFIG.consumptionAnalyticsPowerBiUrl = settings.consumptionAnalyticsPowerBiUrl || '';
    }
};

/**
 * Get the current server configuration
 */
export const getDatabaseConfig = () => {
    return { ...SERVER_CONFIG };
};

/**
 * Check if database is configured
 */
export const isDatabaseConfigured = () => {
    return !!(
        SERVER_CONFIG.host &&
        SERVER_CONFIG.port &&
        SERVER_CONFIG.name &&
        SERVER_CONFIG.user
    );
};

/**
 * Get the Power BI URL for Consumption Analytics
 */
export const getPowerBiUrl = () => {
    return SERVER_CONFIG.consumptionAnalyticsPowerBiUrl || '';
};

