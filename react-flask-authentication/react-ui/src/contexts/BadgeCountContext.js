import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const BadgeCountContext = createContext();

export const BadgeCountProvider = ({ children }) => {
  const [mattressPendingCount, setMattressPendingCount] = useState(0);
  const [orderRatioPendingCount, setOrderRatioPendingCount] = useState(0);

  const refreshMattressCount = async () => {
    try {
      const res = await axios.get('/mattress/mattress_to_approve_count');
      setMattressPendingCount(res.data.count);
    } catch (err) {
      console.error("❌ Failed to fetch mattress count:", err);
    }
  };

  const refreshOrderRatioCount = async () => {
    try {
      const res = await axios.get('/orders/order_lines/without_ratios');
      setOrderRatioPendingCount(res.data.orders.length);
    } catch (err) {
      console.error("❌ Failed to fetch order ratio count:", err);
    }
  };

  const refreshAllBadges = () => {
    refreshMattressCount();
    refreshOrderRatioCount();
  };

  useEffect(() => {
    refreshAllBadges();
  }, []);

  return (
    <BadgeCountContext.Provider
      value={{
        mattressPendingCount,
        orderRatioPendingCount,
        refreshMattressCount,
        refreshOrderRatioCount,
        refreshAllBadges
      }}
    >
      {children}
    </BadgeCountContext.Provider>
  );
};

export const useBadgeCount = () => useContext(BadgeCountContext);