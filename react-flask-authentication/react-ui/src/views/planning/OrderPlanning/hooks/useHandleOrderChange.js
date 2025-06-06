import axios from 'utils/axiosInstance';

const handleOrderChange = async (newValue, context) => {
  const {
    setSelectedOrder,
    setOrderSizes,
    setOrderSizeNames,
    setSelectedStyle,
    setStyleTouched,
    setSelectedSeason,
    setSelectedColorCode,
    fetchPadPrintInfo,
    fetchBrandForStyle,
    setTables,
    setAlongTables,
    setWeftTables,
    setBiasTables,
    setMarkerOptions,
    setManualPattern,
    setManualColor,
    setUnsavedChanges,
    handleWeftRowChange,
    sortSizes,
    clearBrand,
    clearPadPrintInfo,
    styleTouched,
    setShowCommentCard
  } = context;

  if (!newValue) {
    setSelectedOrder(null);
    setOrderSizes([]);
    setOrderSizeNames([]);
    setMarkerOptions([]);
    setTables([]);
    setWeftTables([]);
    setAlongTables([]);
    setBiasTables([]);
    setSelectedStyle("");
    setSelectedSeason("");
    setSelectedColorCode("");
    clearBrand();
    clearPadPrintInfo();
    setManualPattern('');
    setManualColor('');
    setUnsavedChanges(false);
    setStyleTouched(false);
    if (setShowCommentCard) setShowCommentCard(false);
    return;
  }

  setSelectedOrder(newValue);
  const sizesSorted = sortSizes(newValue.sizes || []);
  setOrderSizes(sizesSorted);
  const sizeNames = sizesSorted.map(size => size.size);
  setOrderSizeNames(sizeNames);
  if (!styleTouched) setSelectedStyle(newValue.style);
  setSelectedSeason(newValue.season);
  setSelectedColorCode(newValue.colorCode);



  console.log(`🔍 Fetching mattresses for order: ${newValue.id}`);
  fetchPadPrintInfo(newValue.season, newValue.style, newValue.colorCode);
  fetchBrandForStyle(newValue.style);

  try {
    const [mattressRes, markerRes, alongRes, weftRes, biasRes, commentRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${newValue.id}`),
      axios.get(`/markers/marker_headers_planning`, {
        params: { style: newValue.style, sizes: sizeNames.join(',') }
      }),
      axios.get(`/collaretto/get_by_order/${newValue.id}`),
      axios.get(`/collaretto/get_weft_by_order/${newValue.id}`),
      axios.get(`/collaretto/get_bias_by_order/${newValue.id}`),
      axios.get(`/orders/comments/get/${newValue.id}`)
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
          // Production center fields (before fabric info)
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
        expectedConsumption: mattress.cons_planned || "",
        bagno: mattress.dye_lot,
        status: mattress.bagno_ready ? "ready" : "not_ready", // Load status from bagno_ready field
        isEditable: ["0 - NOT SET", "1 - TO LOAD"].includes(mattress.phase_status),
        sequenceNumber: mattress.sequence_number || 0
      });
    }
    Object.values(tablesById).forEach(table => table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber));
    setTables(Object.values(tablesById));

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
    Object.values(alongTablesById).forEach(table => table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber));

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
        bagno: weft.dye_lot,
        isEditable: ["0 - NOT SET", "1 - TO LOAD"].includes(weft.phase_status)
      });
    }
    Object.values(weftTablesById).forEach(table => table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber));

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
        sequenceNumber: bias.sequence_number || 0,
        collarettoName: bias.collaretto,
        pieces: bias.details.pieces,
        totalWidth: bias.details.total_width,
        grossLength: bias.details.gross_length,
        pcsSeamtoSeam: bias.details.pcs_seam,
        rewoundWidth: bias.details.rewound_width,
        collarettoWidth: bias.details.roll_width,
        scrapRoll: bias.details.scrap_rolls,
        rolls: bias.details.rolls_planned,
        panels: bias.details.panels_planned,
        consumption: bias.details.cons_planned,
        bagno: bias.dye_lot,
        isEditable: ["0 - NOT SET", "1 - TO LOAD"].includes(bias.phase_status)
      });
    }
    Object.values(biasTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );

    // Load production center data for all collaretto tables
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

    // Wait for all production center data to load, then set the tables
    await Promise.all(productionCenterPromises);

    setAlongTables(Object.values(alongTablesById));
    const loadedWeftTables = Object.values(weftTablesById);
    setWeftTables(loadedWeftTables);
    loadedWeftTables.forEach(table => {
      table.rows.forEach(row => {
        handleWeftRowChange(table.id, row.id, "usableWidth", row.usableWidth || "0");
      });
    });
    setBiasTables(Object.values(biasTablesById));

    // Show comment card if there's an existing comment
    if (setShowCommentCard) {
      const hasExistingComment = commentRes.data?.success && commentRes.data?.data?.comment_text;
      setShowCommentCard(!!hasExistingComment);
    }

    setUnsavedChanges(false);
  } catch (error) {
    console.error("❌ Error in parallel fetch:", error);
    setTables([]);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
    if (setShowCommentCard) setShowCommentCard(false);
    setUnsavedChanges(false);
  }
};

const useHandleOrderChange = (dependencies) => {
  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies)
  };
};

export default useHandleOrderChange;