import { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const useItalianRatios = (selectedOrder) => {
  const [italianRatios, setItalianRatios] = useState(null);

  useEffect(() => {
    if (!selectedOrder) {
      console.log('🇮🇹 DEBUG: No order selected, selectedOrder =', selectedOrder);
      return; // don't run if order is not selected
    }

    // Extract order ID from the selectedOrder object
    const orderId = selectedOrder.id || selectedOrder;
    console.log('🇮🇹 DEBUG: selectedOrder object:', selectedOrder);
    console.log('🇮🇹 DEBUG: Extracted orderId:', orderId);

    if (!orderId) {
      console.log('🇮🇹 DEBUG: No valid order ID found');
      setItalianRatios({});
      return;
    }

    const fetchItalianRatios = async () => {
      try {
        console.log('🇮🇹 DEBUG: Making API call to /orders/ratios/' + orderId);
        const res = await axios.get(`/orders/ratios/${orderId}`); // ✅ use extracted order ID
        const data = res.data;

        console.log('🇮🇹 DEBUG: Full API response for order', orderId, ':', res);
        console.log('🇮🇹 DEBUG: Response data:', data);
        console.log('🇮🇹 DEBUG: Data type:', typeof data);
        console.log('🇮🇹 DEBUG: Is array?', Array.isArray(data));

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.reduce((acc, item) => {
            acc[item.size] = parseInt(item.percentage || 0);
            return acc;
          }, {});
          console.log('🇮🇹 DEBUG: Mapped Italian ratios:', mapped);
          setItalianRatios(mapped);
        } else {
          console.log('🇮🇹 DEBUG: No Italian ratios data found, setting empty object');
          setItalianRatios({}); // empty = not available
        }
      } catch (err) {
        console.error('🇮🇹 DEBUG: Failed to fetch Italian ratios:', err);
        setItalianRatios({});
      }
    };

    fetchItalianRatios();
  }, [selectedOrder]); // ✅ refetch when selectedOrder changes

  return italianRatios;
};

export default useItalianRatios;


