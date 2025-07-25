import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const BadgeCountContext = createContext();

export const BadgeCountProvider = ({ children }) => {
  const [orderRatioPendingCount, setOrderRatioPendingCount] = useState(0);
  const [widthValidationCount, setWidthValidationCount] = useState(0);
  const [widthChangeApprovalsCount, setWidthChangeApprovalsCount] = useState(0);
  const [markerRequestsCount, setMarkerRequestsCount] = useState(0);

  const refreshOrderRatioCount = async () => {
    try {
      const res = await axios.get('orders/order_lines/without_ratios/count');
      setOrderRatioPendingCount(res.data.count);
    } catch (err) {
      console.error("❌ Failed to fetch order ratio count:", err);
    }
  };

  const refreshWidthValidationCount = async () => {
    try {
      const res = await axios.get('navision/width_validation/count');
      setWidthValidationCount(res.data.count);
    } catch (err) {
      console.error("❌ Failed to fetch width validation count:", err);
    }
  };

  const refreshWidthChangeApprovalsCount = async () => {
    try {
      const res = await axios.get('width_change_requests/pending/count');
      setWidthChangeApprovalsCount(res.data.count);
    } catch (err) {
      console.error("❌ Failed to fetch width change approvals count:", err);
    }
  };

  const refreshMarkerRequestsCount = async () => {
    try {
      const res = await axios.get('marker_requests/pending/count');
      setMarkerRequestsCount(res.data.count);
    } catch (err) {
      console.error("❌ Failed to fetch marker requests count:", err);
    }
  };

  const refreshAllBadges = () => {
    refreshOrderRatioCount();
    refreshWidthValidationCount();
    refreshWidthChangeApprovalsCount();
    refreshMarkerRequestsCount();
  };

  useEffect(() => {
    refreshAllBadges();
  }, []);

  return (
    <BadgeCountContext.Provider
      value={{
        orderRatioPendingCount,
        widthValidationCount,
        widthChangeApprovalsCount,
        markerRequestsCount,
        refreshOrderRatioCount,
        refreshWidthValidationCount,
        refreshWidthChangeApprovalsCount,
        refreshMarkerRequestsCount,
        refreshAllBadges
      }}
    >
      {children}
    </BadgeCountContext.Provider>
  );
};

export const useBadgeCount = () => useContext(BadgeCountContext);