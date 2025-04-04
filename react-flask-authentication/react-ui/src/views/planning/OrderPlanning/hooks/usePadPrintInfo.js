import { useState, useCallback } from 'react';
import axios from 'utils/axiosInstance';

const usePadPrintInfo = () => {
    const [padPrintInfo, setPadPrintInfo] = useState(null);

    const fetchPadPrintInfo = useCallback(async (season, style, color) => {
        try {
            const response = await axios.get("/padprint/all");
            const data = response.data;

            const matchingPadPrint = data.find((p) =>
                p.season === season &&
                p.style === style &&
                p.color === color
            );
            console.log("🔍 Fetching pad print info for:", season, style, color);

            setPadPrintInfo(matchingPadPrint || null);
        } catch (err) {
            console.error("Error fetching pad print:", err);
            setPadPrintInfo(null);
        }
    }, []);

    const clearPadPrintInfo = useCallback(() => {
        setPadPrintInfo(null);
    }, []);

    return { padPrintInfo, fetchPadPrintInfo, clearPadPrintInfo };
};

export default usePadPrintInfo;