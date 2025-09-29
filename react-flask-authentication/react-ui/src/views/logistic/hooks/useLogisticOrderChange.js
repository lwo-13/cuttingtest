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

    // Fetch production center data for all collaretto tables (like Order Report)
    const allCollarettoTables = [
      ...(alongRes.data.success ? alongRes.data.data || [] : []),
      ...(weftRes.data.success ? weftRes.data.data || [] : []),
      ...(biasRes.data.success ? biasRes.data.data || [] : [])
    ];

    console.log("📊 Fetching production center data for", allCollarettoTables.length, "collaretto tables");

    // Fetch production center data for each collaretto table
    const productionCenterPromises = allCollarettoTables.map(table =>
      axios.get(`/mattress/production_center/get/${table.id}`)
        .then(response => {
          if (response.data.success && response.data.data) {
            table.productionCenter = response.data.data.production_center || "";
            table.cuttingRoom = response.data.data.cutting_room || "";
            table.destination = response.data.data.destination || "";
          }
          return table;
        })
        .catch(error => {
          console.warn(`Failed to load production center data for table ${table.id}:`, error);
          return table;
        })
    );

    // Wait for all production center data to load
    await Promise.all(productionCenterPromises);

    // Update the state with production center data
    if (alongRes.data.success) {
      setAlongTables(alongRes.data.data || []);
    }
    if (weftRes.data.success) {
      setWeftTables(weftRes.data.data || []);
    }
    if (biasRes.data.success) {
      setBiasTables(biasRes.data.data || []);
    }

    console.log("📊 Production center data loaded for all collaretto tables");

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

    // Fetch production center combinations for this order (same as Order Report)
    const response = await axios.get(`/orders/production_center_combinations/get/${orderCommessa}`);

    if (response.data.success) {
      const combinations = response.data.data || [];
      console.log("📊 Production center combinations loaded:", combinations);

      setProductionCenterCombinations(combinations);

      // Show tabs if there are combinations available
      if (combinations.length > 0) {
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
