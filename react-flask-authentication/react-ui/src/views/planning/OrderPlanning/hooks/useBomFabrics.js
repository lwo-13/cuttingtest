import { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

const useBomFabrics = (selectedOrder) => {
  const [bomFabrics, setBomFabrics] = useState([]);
  const [colorDescriptions, setColorDescriptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Don't automatically fetch when order changes
  // Only fetch when explicitly requested (when user opens dropdown)

  const fetchBomFabrics = async () => {
    if (!selectedOrder?.id) {
      console.log('❌ No selected order - cannot fetch BOM fabrics');
      return;
    }

    if (hasFetched) {
      console.log('📋 BOM fabrics already fetched for this session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching BOM fabrics for order:', selectedOrder.id);

      // Fetch BOM data and color descriptions in parallel
      const [bomResponse, colorsResponse] = await Promise.all([
        axios.get(`/orders/bom/${selectedOrder.id}`),
        axios.get('/zalli/item-descriptions')
      ]);

      if (bomResponse.data.success) {
        // Filter only fabric items from BOM
        const fabricItems = bomResponse.data.data.filter(item => {
          const category = item.category?.toLowerCase() || '';
          return category.includes('fabric');
        });

        // Create fabric options with item code and color code
        const fabricOptions = fabricItems.map(item => ({
          item_code: item.item,
          color_code: item.color_code,
          quantity: item.quantity,
          // Create a display label
          label: `${item.item}${item.color_code ? ` (${item.color_code})` : ''}`
        }));

        // Remove duplicates based on item_code
        const uniqueFabrics = fabricOptions.filter((fabric, index, self) =>
          index === self.findIndex(f => f.item_code === fabric.item_code)
        );

        setBomFabrics(uniqueFabrics);
        setHasFetched(true);
        console.log('✅ BOM Fabrics loaded:', uniqueFabrics.length, 'unique fabric items');
      } else {
        setBomFabrics([]);
        console.log('❌ No BOM data found for order:', selectedOrder.id);
      }

      // Process color descriptions
      if (colorsResponse.data.success) {
        const colorMap = {};
        colorsResponse.data.data.forEach(color => {
          colorMap[color.Code] = color.Description;
        });
        setColorDescriptions(colorMap);
        console.log('✅ Color descriptions loaded:', Object.keys(colorMap).length, 'colors');
      }

    } catch (err) {
      console.error('❌ Error fetching BOM fabrics:', err);
      setError('Failed to fetch BOM fabric data');
      setBomFabrics([]);
      setColorDescriptions({});
    } finally {
      setLoading(false);
    }
  };

  // Reset when order changes
  useEffect(() => {
    setBomFabrics([]);
    setColorDescriptions({});
    setHasFetched(false);
    setError(null);
  }, [selectedOrder?.id]);

  // Helper function to get color code for a fabric item
  const getColorCodeForFabric = (itemCode) => {
    const fabric = bomFabrics.find(f => f.item_code === itemCode);
    return fabric?.color_code || '';
  };

  // Helper function to get color description
  const getColorDescription = (colorCode) => {
    return colorDescriptions[colorCode] || '';
  };

  // Helper function to format color display (code + description)
  const formatColorDisplay = (colorCode) => {
    if (!colorCode) return '';
    const description = getColorDescription(colorCode);
    return description ? `${colorCode} - ${description}` : colorCode;
  };

  return {
    bomFabrics,
    colorDescriptions,
    loading,
    error,
    fetchBomFabrics, // Expose function to manually trigger fetch
    getColorCodeForFabric,
    getColorDescription,
    formatColorDisplay
  };
};

export default useBomFabrics;
