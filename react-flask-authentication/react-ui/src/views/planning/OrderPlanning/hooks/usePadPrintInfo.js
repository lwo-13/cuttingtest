import { useState, useCallback } from 'react';
import axios from 'axios';

const usePadPrintInfo = () => {
    const [padPrintInfo, setPadPrintInfo] = useState(null);

    const fetchPadPrintInfo = useCallback(async (season, style, color) => {
        try {
            const response = await axios.get("http://172.27.57.210:5000/api/padprint/all");
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