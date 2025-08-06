import axios from 'utils/axiosInstance';

const handleOrderChange = async (newValue, context) => {
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
    setProductionCenterCombinations,
    setShowProductionCenterFilter,
    setFilteredCuttingRoom,
    setFilteredDestination,
    setProductionCenterLoading,
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
    setShowProductionCenterFilter(false);
    setFilteredCuttingRoom(null);
    setFilteredDestination(null);
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

  // Reset production center filter state
  setFilteredCuttingRoom(null);
  setFilteredDestination(null);
  setShowProductionCenterFilter(false);
  setProductionCenterLoading(true);

  fetchPadPrintInfo(newValue.season, newValue.style, newValue.colorCode);
  fetchBrandForStyle(newValue.style);

  // First, check if there are production center combinations for this order
  try {
    const combinationsRes = await axios.get(`/mattress/production_center/combinations/${newValue.id}`);
    const combinations = combinationsRes.data?.data || [];
    setProductionCenterCombinations(combinations);

    if (combinations.length === 0) {
      // No production center data, proceed with normal fetch
      await fetchMattressData(newValue, sizesSorted, null, null, context);
      setProductionCenterLoading(false);
    } else if (combinations.length === 1) {
      // Only one combination, auto-select it and fetch data
      const combo = combinations[0];
      // Set the production center info immediately
      setSelectedProductionCenter(combo.production_center || '');
      setSelectedCuttingRoom(combo.cutting_room);
      setSelectedDestination(combo.destination);
      await fetchMattressData(newValue, sizesSorted, combo.cutting_room, combo.destination, context);
      setProductionCenterLoading(false);
    } else {
      // Multiple combinations exist
      // Check if they differ only by destination for ZALLI/DELICIA
      const uniqueCuttingRooms = [...new Set(combinations.map(c => c.cutting_room))];

      if (uniqueCuttingRooms.length === 1) {
        const cuttingRoom = uniqueCuttingRooms[0];
        // If it's ZALLI or DELICIA with multiple destinations, show filter
        if ((cuttingRoom === 'ZALLI' || cuttingRoom === 'DELICIA') && combinations.length > 1) {
          setShowProductionCenterFilter(true);
          setProductionCenterLoading(false);
          // Clear tables until user selects destination
          setTables([]);
          setAdhesiveTables([]);
          setAlongTables([]);
          setWeftTables([]);
          setBiasTables([]);
        } else {
          // Single cutting room, auto-select and fetch data
          const combo = combinations[0];
          // Set the production center info immediately
          setSelectedProductionCenter(combo.production_center || '');
          setSelectedCuttingRoom(combo.cutting_room);
          setSelectedDestination(combo.destination);
          await fetchMattressData(newValue, sizesSorted, combo.cutting_room, combo.destination, context);
          setProductionCenterLoading(false);
        }
      } else {
        // Multiple cutting rooms, show filter
        setShowProductionCenterFilter(true);
        setProductionCenterLoading(false);
        // Clear tables until user selects
        setTables([]);
        setAdhesiveTables([]);
        setAlongTables([]);
        setWeftTables([]);
        setBiasTables([]);
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch production center combinations:", err);
    // Fallback to normal fetch without filtering
    await fetchMattressData(newValue, sizesSorted, null, null, context);
    setProductionCenterLoading(false);
  }
};

// Separate function to fetch mattress data with optional filtering
const fetchMattressData = async (order, sizesSorted, cuttingRoom, destination, context) => {
  const {
    setTables,
    setAdhesiveTables,
    setAlongTables,
    setWeftTables,
    setBiasTables,
    setSelectedProductionCenter,
    setSelectedCuttingRoom,
    setSelectedDestination,
    productionCenterCombinations
  } = context;

  try {
    // Build mattress request with optional filtering
    const mattressParams = {};
    if (cuttingRoom) mattressParams.cutting_room = cuttingRoom;
    if (destination) mattressParams.destination = destination;

    const [mattressRes, adhesiveRes, markerRes, alongRes, weftRes, biasRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${order.id}`, { params: mattressParams }),
      axios.get(`/mattress/get_adhesive_by_order/${order.id}`, { params: mattressParams }),
      axios.get(`/markers/marker_headers_planning`, {
        params: { style: order.style, sizes: sizesSorted.map(s => s.size).join(',') }
      }),
      axios.get(`/collaretto/get_by_order/${order.id}`, { params: mattressParams }),
      axios.get(`/collaretto/get_weft_by_order/${order.id}`, { params: mattressParams }),
      axios.get(`/collaretto/get_bias_by_order/${order.id}`, { params: mattressParams })
    ]);

    const markersMap = (markerRes.data?.data || []).reduce((acc, m) => {
      acc[m.marker_name] = m;
      return acc;
    }, {});

    const tablesById = {};
    for (const mattress of mattressRes.data?.data || []) {
      const tableId = mattress.table_id;
      if (!tablesById[tableId]) {
        tablesById[tableId] = {
          id: tableId,
          fabricType: mattress.fabric_type,
          fabricCode: mattress.fabric_code,
          fabricColor: mattress.fabric_color,
          spreadingMethod: mattress.spreading_method,
          allowance: parseFloat(mattress.allowance) || 0,
          spreading: mattress.item_type === "MS" ? "MANUAL" : "AUTOMATIC",
          rows: []
        };
      }
      const marker = markersMap[mattress.marker_name];
      tablesById[tableId].rows.push({
        id: mattress.row_id,
        mattressName: mattress.mattress,
        width: marker?.marker_width || "",
        markerName: mattress.marker_name,
        markerLength: marker?.marker_length || "",
        efficiency: marker?.efficiency || "",
        piecesPerSize: marker?.size_quantities || {},
        layers: mattress.layers || "",
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
      const marker = markersMap[adhesive.marker_name];
      adhesiveTablesById[tableId].rows.push({
        id: adhesive.row_id,
        mattressName: adhesive.mattress, // Add mattress name for adhesive ID display
        width: marker?.marker_width || "",
        markerName: adhesive.marker_name,
        markerLength: marker?.marker_length || "",
        efficiency: marker?.efficiency || "",
        piecesPerSize: marker?.size_quantities || {},
        layers: adhesive.layers || "",
        expectedConsumption: adhesive.cons_planned || "", // Planned consumption from DB
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
    setAdhesiveTables(Object.values(adhesiveTablesById));

    // Set the selected production center, cutting room and destination for display
    if (cuttingRoom && destination) {
      // Find the production center from combinations
      const combo = productionCenterCombinations.find(c =>
        c.cutting_room === cuttingRoom && c.destination === destination
      );
      if (combo) {
        setSelectedProductionCenter(combo.production_center || '');
      }
      setSelectedCuttingRoom(cuttingRoom);
      setSelectedDestination(destination);
    }

    const alongTablesById = {};
    for (const along of alongRes.data?.data || []) {
      const tableId = along.table_id;
      if (!alongTablesById[tableId]) {
        alongTablesById[tableId] = {
          id: tableId,
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
    setAlongTables(Object.values(alongTablesById));

    const weftTablesById = {};
    for (const weft of weftRes.data?.data || []) {
      const tableId = weft.table_id;
      if (!weftTablesById[tableId]) {
        weftTablesById[tableId] = {
          id: tableId,
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
    setWeftTables(Object.values(weftTablesById));

    // Process bias tables
    const biasTablesById = {};
    for (const bias of biasRes.data?.data || []) {
      const tableId = bias.table_id;
      if (!biasTablesById[tableId]) {
        biasTablesById[tableId] = {
          id: tableId,
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
    setBiasTables(Object.values(biasTablesById));

  } catch (error) {
    console.error("❌ Error in parallel fetch:", error);
    setTables([]);
    setAdhesiveTables([]);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
  }
};

const useHandleOrderChange = (dependencies) => {
  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies),
    fetchMattressData: (order, sizesSorted, cuttingRoom, destination) =>
      fetchMattressData(order, sizesSorted, cuttingRoom, destination, dependencies)
  };
};

export default useHandleOrderChange;
