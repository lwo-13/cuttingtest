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
    setAdhesiveTables,
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
    setShowCommentCard,
    // Add loading state setter if available
    setOrderLoading,
    setCombinationComments,
    setCommentData
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
    clearBrand();
    clearPadPrintInfo();
    setManualPattern('');
    setManualColor('');
    setUnsavedChanges(false);
    setStyleTouched(false);
    if (setShowCommentCard) setShowCommentCard(false);
    if (setCombinationComments) setCombinationComments({});
    if (setCommentData) setCommentData({});

    // Reset deletion tracking arrays
    if (context.setDeletedMattresses) context.setDeletedMattresses([]);
    if (context.setDeletedAdhesive) context.setDeletedAdhesive([]);
    if (context.setDeletedAlong) context.setDeletedAlong([]);
    if (context.setDeletedWeft) context.setDeletedWeft([]);
    if (context.setDeletedBias) context.setDeletedBias([]);
    if (context.setDeletedTableIds) context.setDeletedTableIds([]);
    if (context.setDeletedCombinations) context.setDeletedCombinations([]);

    return;
  }

  // Set loading state to prevent layout shift
  if (setOrderLoading) setOrderLoading(true);

  setSelectedOrder(newValue);
  const sizesSorted = sortSizes(newValue.sizes || []);
  setOrderSizes(sizesSorted);
  const sizeNames = sizesSorted.map(size => size.size);
  setOrderSizeNames(sizeNames);
  if (!styleTouched) setSelectedStyle(newValue.style);
  setSelectedSeason(newValue.season);
  setSelectedColorCode(newValue.colorCode);

  // Start async operations but don't await them yet
  const padPrintPromise = fetchPadPrintInfo(newValue.season, newValue.style, newValue.colorCode);
  const brandPromise = fetchBrandForStyle(newValue.style);

  try {
    // First, load all basic data in parallel
    const [mattressRes, markerRes, alongRes, weftRes, biasRes, commentRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${newValue.id}`),
      axios.get(`/markers/marker_headers_planning`, {
        params: {
          style: newValue.style,
          sizes: sizeNames.join(','),
          order_commessa: newValue.order_commessa  // ✅ Include order commessa to get previously selected markers
        }
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
      // Use marker data from mattress_markers table and size quantities from mattress_sizes table
      tablesById[tableId].rows.push({
        id: mattress.row_id,
        mattressName: mattress.mattress,
        width: mattress.marker_width || "",  // Use marker data from database
        markerName: mattress.marker_name,
        markerLength: mattress.marker_length || "",  // Use marker data from database
        efficiency: mattress.efficiency || "",  // Use marker data from database
        piecesPerSize: mattress.size_quantities || {},  // Use size quantities from mattress_sizes table
        layers: mattress.layers || "",
        layers_a: mattress.layers_a || "", // Load actual layers from database
        expectedConsumption: mattress.cons_planned || "",
        cons_actual: mattress.cons_actual || "", // Load actual consumption from database
        bagno: mattress.dye_lot,
        status: mattress.bagno_ready ? "ready" : "not_ready", // Load status from bagno_ready field
        isEditable: mattress.phase_status === "0 - NOT SET",
        sequenceNumber: mattress.sequence_number || 0
      });
    }
    Object.values(tablesById).forEach(table => table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber));

    // Separate mattress and adhesive tables based on item_type
    const mattressTables = Object.values(tablesById).filter(table =>
      table.rows.some(row => row.mattressName && (row.mattressName.includes('-AS-') || row.mattressName.includes('-MS-')))
    );
    const adhesiveTables = Object.values(tablesById).filter(table =>
      table.rows.some(row => row.mattressName && (row.mattressName.includes('-ASA-') || row.mattressName.includes('-MSA-')))
    );

    setTables(mattressTables);
    setAdhesiveTables(adhesiveTables);

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
        sizes: along.details.applicable_sizes || "ALL",  // ✅ Load applicable_sizes
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
          spreading: weft.spreading || "AUTOMATIC",  // ✅ Load spreading information
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
        sizes: weft.details.applicable_sizes || "ALL",  // ✅ Load applicable_sizes
        status: weft.details.bagno_ready ? "ready" : "not_ready",
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
          biasExtra: bias.details.extra.toString(),
          rows: []
        };
      }

      // Calculate panel length from usable width: same as usable width but in meters
      const usableWidthCM = bias.details.total_width || 0;
      const panelLength = (usableWidthCM / 100).toFixed(2); // Convert cm to meters

      biasTablesById[tableId].rows.push({
        id: bias.row_id,
        sequenceNumber: bias.sequence_number || 0,
        collarettoName: bias.collaretto,
        pieces: bias.details.pieces,
        usableWidth: bias.details.total_width,
        grossLength: bias.details.gross_length,
        pcsSeamtoSeam: bias.details.pcs_seam,
        collarettoWidth: bias.details.roll_width,
        scrapRoll: bias.details.scrap_rolls,
        rolls: bias.details.rolls_planned,
        panels: bias.details.panels_planned,
        panelLength: panelLength,
        consumption: bias.details.cons_planned,
        bagno: bias.dye_lot,
        sizes: bias.details.applicable_sizes || "ALL",  // ✅ Load applicable_sizes
        status: bias.details.bagno_ready ? "ready" : "not_ready",
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

    // Wait for all production center data to load before setting any tables
    await Promise.all(productionCenterPromises);

    // Process weft table calculations before setting state
    const loadedWeftTables = Object.values(weftTablesById);
    loadedWeftTables.forEach(table => {
      table.rows.forEach(row => {
        // Pre-calculate weft row changes to avoid post-render updates
        if (row.usableWidth) {
          // Apply the same logic as handleWeftRowChange but without triggering state updates
          const usableWidth = parseFloat(row.usableWidth) || 0;
          // Store calculated values directly in the row data
          row.calculatedValues = {
            usableWidth: usableWidth
          };
        }
      });
    });

    // Set all tables in a single batch to minimize re-renders
    setAlongTables(Object.values(alongTablesById));
    setWeftTables(loadedWeftTables);
    setBiasTables(Object.values(biasTablesById));

    // Wait for pad print and brand data to complete
    await Promise.all([padPrintPromise, brandPromise]);

    // Show comment card if there's an existing comment
    if (setShowCommentCard) {
      const hasExistingComment = commentRes.data?.success && commentRes.data?.data?.comment_text;
      setShowCommentCard(!!hasExistingComment);
    }

    setUnsavedChanges(false);

    // Clear loading state after all data is loaded and rendered
    if (setOrderLoading) setOrderLoading(false);
  } catch (error) {
    console.error("❌ Error in parallel fetch:", error);
    setTables([]);
    setAdhesiveTables([]);
    setAlongTables([]);
    setWeftTables([]);
    setBiasTables([]);
    if (setShowCommentCard) setShowCommentCard(false);
    setUnsavedChanges(false);

    // Clear loading state on error
    if (setOrderLoading) setOrderLoading(false);
  }
};

const useHandleOrderChange = (dependencies) => {
  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies)
  };
};

export default useHandleOrderChange;