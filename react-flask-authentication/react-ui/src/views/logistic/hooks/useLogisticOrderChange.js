import axios from 'utils/axiosInstance';

const handleOrderChange = async (newValue, {
  setSelectedOrder,
  setOrderSizes,
  setOrderSizeNames,
  setSelectedStyle,
  setSelectedSeason,
  setSelectedColorCode,
  setSelectedProductionCenter,
  setSelectedCuttingRoom,
  setSelectedDestination,
  setProductionCenterCombinations,
  setShowProductionCenterFilter,
  setFilteredCuttingRoom,
  setFilteredDestination,
  setProductionCenterLoading,
  productionCenterCombinations,
  fetchBrandForStyle,
  setAlongTables,
  setWeftTables,
  setBiasTables,
  sortSizes,
  clearBrand
}) => {
  if (!newValue) {
    setSelectedOrder(null);
    setOrderSizes([]);
    setOrderSizeNames([]);
    setSelectedStyle('');
    setSelectedSeason('');
    setSelectedColorCode('');
    setSelectedProductionCenter('');
    setSelectedCuttingRoom('');
    setSelectedDestination('');
    setProductionCenterCombinations([]);
    setShowProductionCenterFilter(false);
    setFilteredCuttingRoom('');
    setFilteredDestination('');
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
    clearBrand();
    return;
  }

  console.log("📊 Logistic Order Change - Selected Order:", newValue);
  setSelectedOrder(newValue);

  // First, fetch the order details from order_lines to get style, season, colorCode, and sizes
  try {
    const orderDetailsRes = await axios.get(`/orders/order_lines`, {
      params: { order_commessa: newValue.id }
    });

    if (!orderDetailsRes.data.success) {
      console.error("Failed to fetch order details");
      return;
    }

    const orderLines = orderDetailsRes.data.data || [];
    if (orderLines.length === 0) {
      console.error("No order lines found for order:", newValue.id);
      return;
    }

    // Extract order information
    const firstLine = orderLines[0];
    const style = firstLine.style || '';
    const season = firstLine.season || '';
    const colorCode = firstLine.color_code || '';

    setSelectedStyle(style);
    setSelectedSeason(season);
    setSelectedColorCode(colorCode);

    // Extract sizes with quantities (same as subcontractor implementation)
    const sizes = orderLines.map(line => ({
      size: line.size,
      qty: parseFloat(line.quantity.toString().replace(",", "")) || 0
    }));

    const sortedSizes = sortSizes(sizes);
    setOrderSizes(sortedSizes);
    setOrderSizeNames(sortedSizes.map(size => size.size));

    // Fetch brand info
    if (style) {
      fetchBrandForStyle(style);
    }

    console.log("📊 Logistic Order Details:", {
      style,
      season,
      colorCode,
      sizes: sortedSizes
    });

    // Fetch collaretto data for PXE3 production center
    await fetchLogisticCollarettoData(newValue.id, {
      setAlongTables,
      setWeftTables,
      setBiasTables
    });

  } catch (error) {
    console.error("❌ Error fetching logistic order data:", error);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
  }
};

const fetchLogisticCollarettoData = async (orderCommessa, {
  setAlongTables,
  setWeftTables,
  setBiasTables
}) => {
  try {
    console.log("📊 Fetching collaretto data for PXE3 production center...");

    // Fetch Along tables
    const alongRes = await axios.get(`/collaretto/logistic/along_by_order/${orderCommessa}`);
    if (alongRes.data.success) {
      setAlongTables(alongRes.data.data || []);
      console.log("📊 Along tables loaded:", alongRes.data.data?.length || 0);
    }

    // Fetch Weft tables
    const weftRes = await axios.get(`/collaretto/logistic/weft_by_order/${orderCommessa}`);
    if (weftRes.data.success) {
      setWeftTables(weftRes.data.data || []);
      console.log("📊 Weft tables loaded:", weftRes.data.data?.length || 0);
    }

    // Fetch Bias tables
    const biasRes = await axios.get(`/collaretto/logistic/bias_by_order/${orderCommessa}`);
    if (biasRes.data.success) {
      setBiasTables(biasRes.data.data || []);
      console.log("📊 Bias tables loaded:", biasRes.data.data?.length || 0);
    }

  } catch (error) {
    console.error("❌ Error fetching collaretto data:", error);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
  }
};

const useLogisticOrderChange = (dependencies) => {
  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies)
  };
};

export default useLogisticOrderChange;
