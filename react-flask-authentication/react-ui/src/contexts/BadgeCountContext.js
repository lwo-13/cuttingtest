import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const BadgeCountContext = createContext();

export const BadgeCountProvider = ({ children }) => {
  const [orderRatioPendingCount, setOrderRatioPendingCount] = useState(0);
  const [widthValidationCount, setWidthValidationCount] = useState(0);

  const refreshOrderRatioCount = async () => {
    try {
      const res = await axios.get('/orders/order_lines/without_ratios/count');
      setOrderRatioPendingCount(res.data.count);
    } catch (err) {
      console.error("❌ Failed to fetch order ratio count:", err);
    }
  };

  const refreshWidthValidationCount = async () => {
    try {
      const res = await axios.get('/navision/width_validation/count');
      setWidthValidationCount(res.data.count);
    } catch (err) {
      console.error("❌ Failed to fetch width validation count:", err);
    }
  };

  const refreshAllBadges = () => {
    refreshOrderRatioCount();
    refreshWidthValidationCount();
  };

  useEffect(() => {
    refreshAllBadges();
  }, []);

  return (
    <BadgeCountContext.Provider
      value={{
        orderRatioPendingCount,
        widthValidationCount,
        refreshOrderRatioCount,
        refreshWidthValidationCount,
        refreshAllBadges
      }}
    >
      {children}
    </BadgeCountContext.Provider>
  );
};

export const useBadgeCount = () => useContext(BadgeCountContext);