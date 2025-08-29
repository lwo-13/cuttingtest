import { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

/**
 * Hook to fetch and cache item descriptions for color code lookups
 * Returns a dictionary/map of Code -> Description
 * Optimized to prevent layout shifts by caching data globally
 */

// Global cache to prevent re-fetching across component instances
let globalDescriptionsCache = null;
let globalCachePromise = null;

// Preload function to start fetching descriptions early
export const preloadItemDescriptions = async () => {
    if (globalDescriptionsCache || globalCachePromise) {
        return; // Already loaded or loading
    }

    globalCachePromise = (async () => {
        try {
            const response = await axios.get('/zalli/item-descriptions');

            if (response.data.success && response.data.data) {
                const descriptionsMap = new Map();
                response.data.data.forEach(item => {
                    if (item.Code && item.Description) {
                        descriptionsMap.set(item.Code, item.Description);
                    }
                });

                globalDescriptionsCache = descriptionsMap;
                return descriptionsMap;
            } else {
                const emptyMap = new Map();
                globalDescriptionsCache = emptyMap;
                return emptyMap;
            }
        } catch (err) {
            console.error('Error preloading item descriptions:', err);
            globalCachePromise = null;
            throw err;
        }
    })();

    return globalCachePromise;
};

const useItemDescriptions = () => {
    const [itemDescriptions, setItemDescriptions] = useState(globalDescriptionsCache || new Map());
    const [loading, setLoading] = useState(!globalDescriptionsCache);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchItemDescriptions = async () => {
            // If we already have cached data, use it immediately
            if (globalDescriptionsCache) {
                setItemDescriptions(globalDescriptionsCache);
                setLoading(false);
                return;
            }

            // If there's already a fetch in progress, wait for it
            if (globalCachePromise) {
                try {
                    const cachedData = await globalCachePromise;
                    setItemDescriptions(cachedData);
                    setLoading(false);
                } catch (err) {
                    setError(err.message || 'Failed to fetch item descriptions');
                    setLoading(false);
                }
                return;
            }

            // Start a new fetch and cache the promise
            globalCachePromise = (async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const response = await axios.get('/zalli/item-descriptions');

                    if (response.data.success && response.data.data) {
                        // Convert array to Map for fast lookups
                        const descriptionsMap = new Map();
                        response.data.data.forEach(item => {
                            if (item.Code && item.Description) {
                                descriptionsMap.set(item.Code, item.Description);
                            }
                        });

                        // Cache globally to prevent re-fetching
                        globalDescriptionsCache = descriptionsMap;
                        return descriptionsMap;
                    } else {
                        console.warn('No item descriptions data received');
                        const emptyMap = new Map();
                        globalDescriptionsCache = emptyMap;
                        return emptyMap;
                    }
                } catch (err) {
                    console.error('Error fetching item descriptions:', err);
                    globalCachePromise = null; // Reset promise on error to allow retry
                    throw err;
                }
            })();

            try {
                const descriptionsMap = await globalCachePromise;
                setItemDescriptions(descriptionsMap);
            } catch (err) {
                setError(err.message || 'Failed to fetch item descriptions');
                setItemDescriptions(new Map());
            } finally {
                setLoading(false);
            }
        };

        fetchItemDescriptions();
    }, []);

    /**
     * Get description for a color code
     * @param {string} colorCode - The color code to look up
     * @returns {string|null} - The description or null if not found
     */
    const getColorDescription = (colorCode) => {
        if (!colorCode) return null;
        return itemDescriptions.get(colorCode) || null;
    };

    return {
        itemDescriptions,
        loading,
        error,
        getColorDescription
    };
};

export default useItemDescriptions;
