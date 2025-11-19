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
  setSelectedCombination,
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
  setMattressTables,
  setAdhesiveTables,
  setMattressLoading,
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
    setSelectedCombination(null);
    setShowProductionCenterTabs(false);
    setFilteredCuttingRoom('');
    setFilteredDestination('');
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
    setCollarettoLoading(false);
    setMattressTables([]);
    setAdhesiveTables([]);
    setMattressLoading(false);
    clearBrand();
    return;
  }

  console.log("📊 Logistic Order Change - Selected Order:", newValue);
  setSelectedOrder(newValue);

  // Set loading state immediately when order is selected and clear previous data
  setCollarettoLoading(true);
  setMattressLoading(true);
  setAlongTables([]);
  setWeftTables([]);
  setBiasTables([]);
  setMattressTables([]);
  setAdhesiveTables([]);

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
      setProductionCenterLoading,
      setSelectedCombination
    });

    // Fetch collaretto data for PXE3 production center
    await fetchLogisticCollarettoData(newValue.id, {
      setAlongTables,
      setWeftTables,
      setBiasTables,
      setCollarettoLoading
    });

    // Fetch mattress and adhesive data for PXE3 production center
    await fetchLogisticMattressData(newValue.id, {
      setMattressTables,
      setAdhesiveTables,
      setMattressLoading
    });

  } catch (error) {
    console.error("❌ Error fetching logistic order data:", error);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
    setCollarettoLoading(false);
    setMattressTables([]);
    setAdhesiveTables([]);
    setMattressLoading(false);
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

const fetchLogisticMattressData = async (orderCommessa, {
  setMattressTables,
  setAdhesiveTables,
  setMattressLoading
}) => {
  try {
    console.log("📊 Fetching mattress data for PXE3 production center...");

    // Fetch mattresses and adhesives in parallel
    const [mattressRes, adhesiveRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${orderCommessa}`),
      axios.get(`/mattress/get_adhesive_by_order/${orderCommessa}`)
    ]);

    // Build mattress tables grouped by table_id, filtered to PXE3
    const tablesById = {};
    for (const mattress of mattressRes.data?.data || []) {
      if (mattress.production_center !== 'PXE3') continue;

      const tableId = mattress.table_id;
      if (!tablesById[tableId]) {
        tablesById[tableId] = {
          id: tableId,
          productionCenter: mattress.production_center || "",
          cuttingRoom: mattress.cutting_room || "",
          destination: mattress.destination || "",
          fabricType: mattress.fabric_type,
          fabricCode: mattress.fabric_code,
          fabricColor: mattress.fabric_color,
          spreadingMethod: mattress.spreading_method,
          allowance: parseFloat(mattress.allowance) || 0,
          spreading: mattress.item_type === "MS" ? "MANUAL" : "AUTOMATIC",
          rows: []
        };
      }

      tablesById[tableId].rows.push({
        id: mattress.row_id,
        mattressName: mattress.mattress,
        width: mattress.marker_width || "",
        markerName: mattress.marker_name,
        markerLength: mattress.marker_length || "",
        efficiency: mattress.efficiency || "",
        piecesPerSize: mattress.size_quantities || {},
        layers: mattress.layers || "",
        cons_planned: mattress.cons_planned || "",
        layers_a: mattress.layers_a || "",
        cons_actual: mattress.cons_actual || "",
        cons_real: mattress.cons_real || "",
        bagno: mattress.dye_lot,
        bagno_ready: mattress.bagno_ready || false,
        phase_status: mattress.phase_status || "0 - NOT SET",
        phase_operator: mattress.phase_operator || "",
        has_pending_width_change: mattress.has_pending_width_change || false,
        sequenceNumber: mattress.sequence_number || 0
      });
    }

    Object.values(tablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    const mattressTables = Object.values(tablesById);

    // Build adhesive tables grouped by table_id, filtered to PXE3
    const adhesiveTablesById = {};
    for (const adhesive of adhesiveRes.data?.data || []) {
      if (adhesive.production_center !== 'PXE3') continue;

      const tableId = adhesive.table_id;
      if (!adhesiveTablesById[tableId]) {
        adhesiveTablesById[tableId] = {
          id: tableId,
          productionCenter: adhesive.production_center || "",
          cuttingRoom: adhesive.cutting_room || "",
          destination: adhesive.destination || "",
          fabricType: adhesive.fabric_type,
          fabricCode: adhesive.fabric_code,
          fabricColor: adhesive.fabric_color,
          spreadingMethod: adhesive.spreading_method,
          allowance: parseFloat(adhesive.allowance) || 0,
          spreading: adhesive.item_type === "MSA" ? "MANUAL" : "AUTOMATIC",
          rows: []
        };
      }

      adhesiveTablesById[tableId].rows.push({
        id: adhesive.row_id,
        mattressName: adhesive.mattress,
        width: adhesive.marker_width || "",
        markerName: adhesive.marker_name,
        markerLength: adhesive.marker_length || "",
        efficiency: adhesive.efficiency || "",
        piecesPerSize: adhesive.size_quantities || {},
        layers: adhesive.layers || "",
        cons_planned: adhesive.cons_planned || "",
        layers_a: adhesive.layers_a || "",
        cons_actual: adhesive.cons_actual || "",
        cons_real: adhesive.cons_real || "",
        bagno: adhesive.dye_lot,
        bagno_ready: adhesive.bagno_ready || false,
        phase_status: adhesive.phase_status || "0 - NOT SET",
        phase_operator: adhesive.phase_operator || "",
        has_pending_width_change: adhesive.has_pending_width_change || false,
        sequenceNumber: adhesive.sequence_number || 0
      });
    }

    Object.values(adhesiveTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    const adhesiveTables = Object.values(adhesiveTablesById);

    setMattressTables(mattressTables);
    setAdhesiveTables(adhesiveTables);
  } catch (error) {
    console.error("❌ Error fetching mattress data:", error);
    setMattressTables([]);
    setAdhesiveTables([]);
  } finally {
    setMattressLoading(false);
  }
};

const fetchProductionCenterCombinations = async (orderCommessa, {
  setProductionCenterCombinations,
  setShowProductionCenterTabs,
  setProductionCenterLoading,
  setSelectedCombination
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
        // Auto-select the first combination immediately
        setSelectedCombination(pxe3Combinations[0]);
        console.log("📊 Auto-selected first combination:", pxe3Combinations[0]);
      } else {
        setShowProductionCenterTabs(false);
        setSelectedCombination(null);
      }
    } else {
      console.warn("Failed to fetch production center combinations");
      setProductionCenterCombinations([]);
      setShowProductionCenterTabs(false);
      setSelectedCombination(null);
    }
  } catch (error) {
    console.error("❌ Error fetching production center combinations:", error);
    setProductionCenterCombinations([]);
    setShowProductionCenterTabs(false);
    setSelectedCombination(null);
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
