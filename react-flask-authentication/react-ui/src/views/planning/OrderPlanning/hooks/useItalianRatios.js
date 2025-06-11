import { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const useItalianRatios = (selectedOrder) => {
  const [italianRatios, setItalianRatios] = useState(null);

  useEffect(() => {
    if (!selectedOrder) return; // don't run if order is not selected

    // Extract order ID from the selectedOrder object
    const orderId = selectedOrder.id || selectedOrder;

    if (!orderId) {
      setItalianRatios({});
      return;
    }

    const fetchItalianRatios = async () => {
      try {
        const res = await axios.get(`/orders/ratios/${orderId}`); // ✅ use extracted order ID
        const data = res.data;

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.reduce((acc, item) => {
            acc[item.size] = parseInt(item.percentage || 0);
            return acc;
          }, {});
          setItalianRatios(mapped);
        } else {
          setItalianRatios({}); // empty = not available
        }
      } catch (err) {
        console.error('Failed to fetch Italian ratios:', err);
        setItalianRatios({});
      }
    };

    fetchItalianRatios();
  }, [selectedOrder]); // ✅ refetch when selectedOrder changes

  return italianRatios;
};

export default useItalianRatios;


