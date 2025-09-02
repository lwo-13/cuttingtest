import axios from 'utils/axiosInstance';

// Global variable to track the current request
let currentRequestController = null;

const handleOrderChange = async (newValue, context) => {
  // Cancel any previous request
  if (currentRequestController) {
    console.log('🚫 Cancelling previous request');
    currentRequestController.abort();
  }

  // Create new AbortController for this request
  currentRequestController = new AbortController();
  const signal = currentRequestController.signal;

  const {
    setSelectedOrder,
    setOrderSizes,
    setOrderSizeNames,
    setSelectedStyle,
    setSelectedSeason,
    setSelectedColorCode,
    setSelectedProductionCenter,
    setSelectedCuttingRoom,
    setSelectedDestination,
    setSelectedCombination,
    setProductionCenterCombinations,
    setShowProductionCenterTabs,
    setProductionCenterLoading,
    setOrderDataLoading,
    fetchPadPrintInfo,
    fetchBrandForStyle,
    setTables,
    setAdhesiveTables,
    setAlongTables,
    setWeftTables,
    setBiasTables,
    setMarkerOptions,
    sortSizes,
    clearBrand,
    clearPadPrintInfo
  } = context;

  if (!newValue) {
    setSelectedOrder(null);
    setOrderSizes([]);
    setOrderSizeNames([]);
    setMarkerOptions([]);
    setTables([]);
    setAdhesiveTables([]);
    setWeftTables([]);
    setAlongTables([]);
    setBiasTables([]);
    setSelectedStyle("");
    setSelectedSeason("");
    setSelectedColorCode("");
    setProductionCenterCombinations([]);
    setShowProductionCenterTabs(false);
    clearBrand();
    clearPadPrintInfo();
    return;
  }

  setSelectedOrder(newValue);
  const sizesSorted = sortSizes(newValue.sizes || []);
  setOrderSizes(sizesSorted);
  setOrderSizeNames(sizesSorted.map(size => size.size));
  setSelectedStyle(newValue.style);
  setSelectedSeason(newValue.season);
  setSelectedColorCode(newValue.colorCode);

  // Start loading order data
  setOrderDataLoading(true);

  // Reset production center state
  setShowProductionCenterTabs(false);
  setProductionCenterLoading(true);

  fetchPadPrintInfo(newValue.season, newValue.style, newValue.colorCode);
  fetchBrandForStyle(newValue.style);

  // First, check if there are production center combinations for this order
  try {
    const combinationsRes = await axios.get(`/orders/production_center_combinations/get/${newValue.id}`, { signal });

    // Check if request was cancelled
    if (signal.aborted) {
      console.log('🚫 Request was cancelled');
      return;
    }

    const combinations = combinationsRes.data?.data || [];
    setProductionCenterCombinations(combinations);

    if (combinations.length === 0) {
      // No production center data, proceed with normal fetch
      await fetchAllMattressData(newValue, sizesSorted, context, signal);
      if (!signal.aborted) {
        setProductionCenterLoading(false);
        setOrderDataLoading(false); // Stop order data loading
      }
    } else {
      // Always show tabs for any production center combinations
      setShowProductionCenterTabs(true);

      // Load ALL data for ALL combinations upfront
      await fetchAllMattressData(newValue, sizesSorted, context, signal);

      // Set the first combination as selected (but data is already loaded)
      const firstCombo = combinations[0];
      setSelectedProductionCenter(firstCombo.production_center || '');
      setSelectedCuttingRoom(firstCombo.cutting_room);
      setSelectedDestination(firstCombo.destination);
      if (setSelectedCombination) {
        setSelectedCombination(firstCombo);
      }

      if (!signal.aborted) {
        setProductionCenterLoading(false);
        setOrderDataLoading(false); // Stop order data loading
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('🚫 Request was cancelled');
      return;
    }
    console.error("❌ Failed to fetch production center combinations:", err);
    // Fallback to normal fetch without filtering
    await fetchAllMattressData(newValue, sizesSorted, context, signal);
    if (!signal.aborted) {
      setProductionCenterLoading(false);
      setOrderDataLoading(false); // Stop order data loading
    }
  }
};

// Function to fetch ALL mattress data without filtering (loads everything upfront)
const fetchAllMattressData = async (order, sizesSorted, context, signal) => {
  const {
    setTables,
    setAdhesiveTables,
    setAlongTables,
    setWeftTables,
    setBiasTables,
    setAllTables,
    setAllAdhesiveTables,
    setAllAlongTables,
    setAllWeftTables,
    setAllBiasTables,
    productionCenterCombinations
  } = context;

  try {
    // Fetch ALL data without any production center filtering
    // No longer need marker API call - all marker data comes from mattress_markers and mattress_sizes tables
    const [mattressRes, adhesiveRes, alongRes, weftRes, biasRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${order.id}`, { signal }),
      axios.get(`/mattress/get_adhesive_by_order/${order.id}`, { signal }),
      axios.get(`/collaretto/get_by_order/${order.id}`, { signal }),
      axios.get(`/collaretto/get_weft_by_order/${order.id}`, { signal }),
      axios.get(`/collaretto/get_bias_by_order/${order.id}`, { signal })
    ]);

    // Check if request was cancelled after Promise.all
    if (signal.aborted) {
      console.log('🚫 Request was cancelled after data fetch');
      return;
    }

    // No longer need markersMap - use data directly from mattress_markers and mattress_sizes tables

    const tablesById = {};
    for (const mattress of mattressRes.data?.data || []) {
      const tableId = mattress.table_id;
      if (!tablesById[tableId]) {
        tablesById[tableId] = {
          id: tableId,
          // Production center fields from API response
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
      // Use marker data directly from mattress_markers and mattress_sizes tables
      tablesById[tableId].rows.push({
        id: mattress.row_id,
        mattressName: mattress.mattress,
        width: mattress.marker_width || "",  // From mattress_markers table
        markerName: mattress.marker_name,    // From mattress_markers table
        markerLength: mattress.marker_length || "",  // From mattress_markers table
        efficiency: mattress.efficiency || "",  // From mattress_markers table
        piecesPerSize: mattress.size_quantities || {},  // From mattress_sizes table
        layers: mattress.layers || "",
        cons_planned: mattress.cons_planned || "", // Planned consumption from DB
        layers_a: mattress.layers_a || "",
        cons_actual: mattress.cons_actual || "",
        cons_real: mattress.cons_real || "",
        bagno: mattress.dye_lot,
        bagno_ready: mattress.bagno_ready || false, // Add bagno_ready field
        phase_status: mattress.phase_status || "0 - NOT SET",
        has_pending_width_change: mattress.has_pending_width_change || false,
        sequenceNumber: mattress.sequence_number || 0
      });
    }
    Object.values(tablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    // Check if request was cancelled before setting state
    if (signal.aborted) {
      console.log('🚫 Request was cancelled before setting tables');
      return;
    }

    // Store tables data
    setTables(Object.values(tablesById));

    // Process adhesive tables
    const adhesiveTablesById = {};
    for (const adhesive of adhesiveRes.data?.data || []) {
      const tableId = adhesive.table_id;
      if (!adhesiveTablesById[tableId]) {
        adhesiveTablesById[tableId] = {
          id: tableId,
          // Production center fields
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
      // Use marker data directly from mattress_markers and mattress_sizes tables
      adhesiveTablesById[tableId].rows.push({
        id: adhesive.row_id,
        mattressName: adhesive.mattress, // Add mattress name for adhesive ID display
        width: adhesive.marker_width || "",  // From mattress_markers table
        markerName: adhesive.marker_name,    // From mattress_markers table
        markerLength: adhesive.marker_length || "",  // From mattress_markers table
        efficiency: adhesive.efficiency || "",  // From mattress_markers table
        piecesPerSize: adhesive.size_quantities || {},  // From mattress_sizes table
        layers: adhesive.layers || "",
        cons_planned: adhesive.cons_planned || "", // Planned consumption from DB
        layers_a: adhesive.layers_a || "",
        layers_updated_at: adhesive.layers_updated_at || "", // Updated at timestamp for actual layers
        cons_actual: adhesive.cons_actual || "",
        cons_real: adhesive.cons_real || "",
        bagno: adhesive.dye_lot,
        sequenceNumber: adhesive.sequence_number || 0
      });
    }
    Object.values(adhesiveTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    // Check if request was cancelled before setting state
    if (signal.aborted) {
      console.log('🚫 Request was cancelled before setting adhesive tables');
      return;
    }

    // Store adhesive tables data
    setAdhesiveTables(Object.values(adhesiveTablesById));



    const alongTablesById = {};
    for (const along of alongRes.data?.data || []) {
      const tableId = along.table_id;
      if (!alongTablesById[tableId]) {
        alongTablesById[tableId] = {
          id: tableId,
          // Production center fields (will be loaded separately)
          productionCenter: "",
          cuttingRoom: "",
          destination: "",
          fabricType: along.fabric_type,
          fabricCode: along.fabric_code,
          fabricColor: along.fabric_color,
          alongExtra: along.details.extra,
          rows: []
        };
      }
      alongTablesById[tableId].rows.push({
        id: along.row_id,
        collarettoId: along.collaretto?.match(/[A-Z]{2,3}-\d{2}-\d{2,3}$/)?.[0] || along.collaretto, // Extract short ID like mattresses
        collarettoName: along.collaretto,
        pieces: along.details.pieces,
        usableWidth: along.details.usable_width,
        theoreticalConsumption: along.details.gross_length,
        collarettoWidth: along.details.roll_width,
        scrapRoll: along.details.scrap_rolls,
        rolls: along.details.rolls_planned,
        actualRolls: along.details.rolls_actual || "", // Add actual rolls field
        totalCollaretto: along.details.total_collaretto, // Map to expected field name
        metersCollaretto: along.details.total_collaretto,
        consPlanned: along.details.cons_planned, // Map to expected field name
        consumption: along.details.cons_planned,
        bagno: along.dye_lot,
        sizes: along.details.applicable_sizes || "ALL", // Add sizes field
        sequenceNumber: along.sequence_number || 0
      });
    }
    Object.values(alongTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    // Check if request was cancelled before setting state
    if (signal.aborted) {
      console.log('🚫 Request was cancelled before setting along tables');
      return;
    }

    // Store along tables data
    setAlongTables(Object.values(alongTablesById));

    const weftTablesById = {};
    for (const weft of weftRes.data?.data || []) {
      const tableId = weft.table_id;
      if (!weftTablesById[tableId]) {
        weftTablesById[tableId] = {
          id: tableId,
          // Production center fields (will be loaded separately)
          productionCenter: "",
          cuttingRoom: "",
          destination: "",
          fabricType: weft.fabric_type,
          fabricCode: weft.fabric_code,
          fabricColor: weft.fabric_color,
          spreading: weft.spreading || 'AUTOMATIC', // Add spreading field
          weftExtra: weft.details.extra,
          rows: []
        };
      }
      weftTablesById[tableId].rows.push({
        id: weft.row_id,
        collarettoId: weft.collaretto?.match(/[A-Z]{2,3}-\d{2}-\d{2,3}$/)?.[0] || weft.collaretto, // Extract short ID like mattresses
        sequenceNumber: weft.sequence_number || 0,
        collarettoName: weft.collaretto,
        pieces: weft.details.pieces,
        usableWidth: weft.details.usable_width,
        grossLength: weft.details.gross_length,
        pcsSeamtoSeam: weft.details.pcs_seam,
        rewoundWidth: weft.details.rewound_width,
        collarettoWidth: weft.details.roll_width,
        scrapRoll: weft.details.scrap_rolls,
        rolls: weft.details.rolls_planned,
        actualRolls: weft.details.rolls_actual || "", // Add actual rolls field
        panels: weft.details.panels_planned,
        consPlanned: weft.details.cons_planned, // Map to expected field name
        consumption: weft.details.cons_planned,
        bagno: weft.dye_lot,
        sizes: weft.details.applicable_sizes || "ALL"  // ✅ Load applicable_sizes
      });
    }
    Object.values(weftTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    // Check if request was cancelled before setting state
    if (signal.aborted) {
      console.log('🚫 Request was cancelled before setting weft tables');
      return;
    }

    // Store weft tables data
    setWeftTables(Object.values(weftTablesById));

    // Process bias tables
    const biasTablesById = {};
    for (const bias of biasRes.data?.data || []) {
      const tableId = bias.table_id;
      if (!biasTablesById[tableId]) {
        biasTablesById[tableId] = {
          id: tableId,
          // Production center fields (will be loaded separately)
          productionCenter: "",
          cuttingRoom: "",
          destination: "",
          fabricType: bias.fabric_type,
          fabricCode: bias.fabric_code,
          fabricColor: bias.fabric_color,
          biasExtra: bias.details.extra,
          rows: []
        };
      }
      biasTablesById[tableId].rows.push({
        id: bias.row_id,
        collarettoId: bias.collaretto?.match(/[A-Z]{2,3}-\d{2}-\d{2,3}$/)?.[0] || bias.collaretto, // Extract short ID like mattresses
        collarettoName: bias.collaretto,
        pieces: bias.details.pieces,
        usableWidth: bias.details.total_width || bias.details.usable_width,
        pcsSeam: bias.details.pcs_seam, // Map to expected field name
        theoreticalConsumption: bias.details.gross_length,
        rollWidth: bias.details.roll_width, // Map to expected field name
        collarettoWidth: bias.details.roll_width, // Keep both for compatibility
        scrapRolls: bias.details.scrap_rolls, // Map to expected field name
        scrapRoll: bias.details.scrap_rolls, // Keep both for compatibility
        rolls: bias.details.rolls_planned,
        panels: bias.details.panels_planned, // Add panels field for N° Panels column
        rollsPlanned: bias.details.rolls_actual || "", // Map to expected field name
        actualRolls: bias.details.rolls_actual || "", // Keep both for compatibility
        panelLength: bias.details.panel_length, // Panel length for bias
        totalCollaretto: bias.details.total_collaretto, // Map to expected field name
        metersCollaretto: bias.details.total_collaretto,
        consPlanned: bias.details.cons_planned, // Map to expected field name
        consumption: bias.details.cons_planned,
        bagno: bias.dye_lot,
        sizes: bias.details.applicable_sizes || "ALL", // Add sizes field
        sequenceNumber: bias.sequence_number || 0
      });
    }
    Object.values(biasTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    // Check if request was cancelled before setting state
    if (signal.aborted) {
      console.log('🚫 Request was cancelled before setting bias tables');
      return;
    }

    // Store bias tables data
    setBiasTables(Object.values(biasTablesById));

    // Fetch production center data for all collaretto tables
    const allCollarettoTables = [
      ...Object.values(alongTablesById),
      ...Object.values(weftTablesById),
      ...Object.values(biasTablesById)
    ];

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
    setAlongTables(Object.values(alongTablesById));
    setWeftTables(Object.values(weftTablesById));
    setBiasTables(Object.values(biasTablesById));

    // Stop order data loading after all data is successfully loaded
    if (!signal.aborted && context.setOrderDataLoading) {
      console.log('✅ Data loaded successfully, stopping loading');
      context.setOrderDataLoading(false);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('🚫 Request was cancelled during data processing');
      return;
    }
    console.error("❌ Error in parallel fetch:", error);

    // Only clear state if request wasn't cancelled
    if (!signal.aborted) {
      setTables([]);
      setAdhesiveTables([]);
      setAlongTables([]);
      setWeftTables([]);
      setBiasTables([]);

      // Stop loading even on error
      if (context.setOrderDataLoading) {
        console.log('🛑 Error occurred, stopping loading');
        context.setOrderDataLoading(false);
      }
    }
  }
};

const useHandleOrderChange = (dependencies) => {
  // Cleanup function to cancel any pending requests
  const cancelPendingRequests = () => {
    if (currentRequestController) {
      console.log('🧹 Cleaning up pending requests');
      currentRequestController.abort();
      currentRequestController = null;
    }
  };

  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies),
    cancelPendingRequests
  };
};

export default useHandleOrderChange;
