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
  setShowProductionCenterTabs,
  setFilteredCuttingRoom,
  setFilteredDestination,
  setProductionCenterLoading,
  productionCenterCombinations,
  fetchBrandForStyle,
  setAlongTables,
  setWeftTables,
  setBiasTables,
  setCollarettoLoading,
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
    setShowProductionCenterTabs(false);
    setFilteredCuttingRoom('');
    setFilteredDestination('');
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
    setCollarettoLoading(false);
    clearBrand();
    return;
  }

  console.log("📊 Logistic Order Change - Selected Order:", newValue);
  setSelectedOrder(newValue);

  // Set loading state immediately when order is selected and clear previous data
  setCollarettoLoading(true);
  setAlongTables([]);
  setWeftTables([]);
  setBiasTables([]);

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

    // Fetch production center combinations for this order
    await fetchProductionCenterCombinations(newValue.id, {
      setProductionCenterCombinations,
      setShowProductionCenterTabs,
      setProductionCenterLoading
    });

    // Fetch collaretto data for PXE3 production center
    await fetchLogisticCollarettoData(newValue.id, {
      setAlongTables,
      setWeftTables,
      setBiasTables,
      setCollarettoLoading
    });

  } catch (error) {
    console.error("❌ Error fetching logistic order data:", error);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
    setCollarettoLoading(false);
  }
};

const fetchLogisticCollarettoData = async (orderCommessa, {
  setAlongTables,
  setWeftTables,
  setBiasTables,
  setCollarettoLoading
}) => {
  try {
    console.log("📊 Fetching collaretto data for PXE3 production center...");

    // Fetch Along tables - backend already filters by PXE3 and includes production center data
    const alongRes = await axios.get(`/collaretto/logistic/along_by_order/${orderCommessa}`);
    const alongTables = alongRes.data.success ? (alongRes.data.data || []) : [];
    console.log("📊 Along tables loaded:", alongTables.length);
    console.log("📊 Along tables:", alongTables.map(t => ({ id: t.id, pc: t.productionCenter, cr: t.cuttingRoom, dest: t.destination })));

    // Fetch Weft tables - backend already filters by PXE3 and includes production center data
    const weftRes = await axios.get(`/collaretto/logistic/weft_by_order/${orderCommessa}`);
    const weftTables = weftRes.data.success ? (weftRes.data.data || []) : [];
    console.log("📊 Weft tables loaded:", weftTables.length);
    console.log("📊 Weft tables:", weftTables.map(t => ({ id: t.id, pc: t.productionCenter, cr: t.cuttingRoom, dest: t.destination })));

    // Fetch Bias tables - backend already filters by PXE3 and includes production center data
    const biasRes = await axios.get(`/collaretto/logistic/bias_by_order/${orderCommessa}`);
    const biasTables = biasRes.data.success ? (biasRes.data.data || []) : [];
    console.log("📊 Bias tables loaded:", biasTables.length);
    console.log("📊 Bias tables:", biasTables.map(t => ({ id: t.id, pc: t.productionCenter, cr: t.cuttingRoom, dest: t.destination })));

    // Backend already includes production center data, so we can directly set the state
    setAlongTables(alongTables);
    setWeftTables(weftTables);
    setBiasTables(biasTables);

  } catch (error) {
    console.error("❌ Error fetching collaretto data:", error);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
  } finally {
    setCollarettoLoading(false);
  }
};

const fetchProductionCenterCombinations = async (orderCommessa, {
  setProductionCenterCombinations,
  setShowProductionCenterTabs,
  setProductionCenterLoading
}) => {
  try {
    setProductionCenterLoading(true);
    console.log("📊 Fetching production center combinations for order:", orderCommessa);

    // Fetch production center combinations for this order
    const response = await axios.get(`/orders/production_center_combinations/get/${orderCommessa}`);

    if (response.data.success) {
      const allCombinations = response.data.data || [];
      console.log("📊 All production center combinations:", allCombinations);

      // Filter to only show PXE3 combinations for logistic view
      const pxe3Combinations = allCombinations.filter(combo => combo.production_center === 'PXE3');
      console.log("📊 PXE3 production center combinations:", pxe3Combinations);

      setProductionCenterCombinations(pxe3Combinations);

      // Show tabs if there are PXE3 combinations available
      if (pxe3Combinations.length > 0) {
        setShowProductionCenterTabs(true);
      } else {
        setShowProductionCenterTabs(false);
      }
    } else {
      console.warn("Failed to fetch production center combinations");
      setProductionCenterCombinations([]);
      setShowProductionCenterTabs(false);
    }
  } catch (error) {
    console.error("❌ Error fetching production center combinations:", error);
    setProductionCenterCombinations([]);
    setShowProductionCenterTabs(false);
  } finally {
    setProductionCenterLoading(false);
  }
};

const useLogisticOrderChange = (dependencies) => {
  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies)
  };
};

export default useLogisticOrderChange;
