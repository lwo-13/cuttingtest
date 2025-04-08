import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const BadgeCountContext = createContext();

export const BadgeCountProvider = ({ children }) => {
  const [orderRatioPendingCount, setOrderRatioPendingCount] = useState(0);

  const refreshOrderRatioCount = async () => {
    try {
      const res = await axios.get('/orders/order_lines/without_ratios');
      setOrderRatioPendingCount(res.data.orders.length);
    } catch (err) {
      console.error("❌ Failed to fetch order ratio count:", err);
    }
  };

  const refreshAllBadges = () => {
    refreshOrderRatioCount();
  };

  useEffect(() => {
    refreshAllBadges();
  }, []);

  return (
    <BadgeCountContext.Provider
      value={{
        orderRatioPendingCount,
        refreshOrderRatioCount,
        refreshAllBadges
      }}
    >
      {children}
    </BadgeCountContext.Provider>
  );
};

export const useBadgeCount = () => useContext(BadgeCountContext);