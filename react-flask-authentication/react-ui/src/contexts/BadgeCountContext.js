import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const BadgeCountContext = createContext();

export const BadgeCountProvider = ({ children }) => {
    const [mattressPendingCount, setMattressPendingCount] = useState(0);

    const refreshMattressCount = async () => {
        try {
            const res = await axios.get('/mattress/mattress_to_approve_count');
            setMattressPendingCount(res.data.count);
        } catch (err) {
            console.error("❌ Failed to fetch mattress count:", err);
        }
    };

    // Initial fetch on load
    useEffect(() => {
        refreshMattressCount();
    }, []);

    return (
        <BadgeCountContext.Provider value={{ mattressPendingCount, refreshMattressCount }}>
            {children}
        </BadgeCountContext.Provider>
    );
};

export const useBadgeCount = () => useContext(BadgeCountContext);