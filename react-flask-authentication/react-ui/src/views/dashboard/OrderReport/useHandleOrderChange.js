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
    setAlongTables,
    setWeftTables,
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
    setWeftTables([]);
    setAlongTables([]);
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
          setAlongTables([]);
          setWeftTables([]);
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
        setAlongTables([]);
        setWeftTables([]);
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
    setAlongTables,
    setWeftTables,
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

    const [mattressRes, markerRes, alongRes, weftRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${order.id}`, { params: mattressParams }),
      axios.get(`/markers/marker_headers_planning`, {
        params: { style: order.style, sizes: sizesSorted.map(s => s.size).join(',') }
      }),
      axios.get(`/collaretto/get_by_order/${order.id}`),
      axios.get(`/collaretto/get_weft_by_order/${order.id}`)
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
        phase_status: mattress.phase_status || "0 - NOT SET",
        sequenceNumber: mattress.sequence_number || 0
      });
    }
    Object.values(tablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );
    setTables(Object.values(tablesById));

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
        collarettoName: along.collaretto,
        pieces: along.details.pieces,
        usableWidth: along.details.usable_width,
        theoreticalConsumption: along.details.gross_length,
        collarettoWidth: along.details.roll_width,
        scrapRoll: along.details.scrap_rolls,
        rolls: along.details.rolls_planned,
        metersCollaretto: along.details.total_collaretto,
        consumption: along.details.cons_planned,
        bagno: along.dye_lot,
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
          weftExtra: weft.details.extra,
          rows: []
        };
      }
      weftTablesById[tableId].rows.push({
        id: weft.row_id,
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
        panels: weft.details.panels_planned,
        consumption: weft.details.cons_planned,
        bagno: weft.dye_lot
      });
    }
    Object.values(weftTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );
    setWeftTables(Object.values(weftTablesById));

  } catch (error) {
    console.error("❌ Error in parallel fetch:", error);
    setTables([]);
    setAlongTables([]);
    setWeftTables([]);
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
