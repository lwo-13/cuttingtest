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
    setSelectedProductionCenter,
    setSelectedCuttingRoom,
    setSelectedDestination,
    fetchPadPrintInfo,
    fetchBrandForStyle,
    setTables,
    setAlongTables,
    setWeftTables,
    setMarkerOptions,
    setManualPattern,
    setManualColor,
    setUnsavedChanges,
    handleWeftRowChange,
    sortSizes,
    clearBrand,
    clearPadPrintInfo,
    styleTouched
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
    clearBrand();
    clearPadPrintInfo();
    setManualPattern('');
    setManualColor('');
    setUnsavedChanges(false);
    setStyleTouched(false);
    return;
  }

  setSelectedOrder(newValue.id);
  const sizesSorted = sortSizes(newValue.sizes || []);
  setOrderSizes(sizesSorted);
  const sizeNames = sizesSorted.map(size => size.size);
  setOrderSizeNames(sizeNames);
  if (!styleTouched) setSelectedStyle(newValue.style);
  setSelectedSeason(newValue.season);
  setSelectedColorCode(newValue.colorCode);

  try {
    const productionRes = await axios.get(`/orders/production_center/get/${newValue.id}`);
    const prodData = productionRes.data?.data;
    setSelectedProductionCenter(prodData?.production_center || '');
    setSelectedCuttingRoom(prodData?.cutting_room || '');
    setSelectedDestination(prodData?.destination || '');
  } catch (err) {
    console.error("❌ Failed to fetch Production Center info:", err);
    setSelectedProductionCenter('');
    setSelectedCuttingRoom('');
    setSelectedDestination('');
  }

  console.log(`🔍 Fetching mattresses for order: ${newValue.id}`);
  fetchPadPrintInfo(newValue.season, newValue.style, newValue.colorCode);
  fetchBrandForStyle(newValue.style);

  try {
    const [mattressRes, markerRes, alongRes, weftRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${newValue.id}`),
      axios.get(`/markers/marker_headers_planning`, {
        params: { style: newValue.style, sizes: sizeNames.join(',') }
      }),
      axios.get(`/collaretto/get_by_order/${newValue.id}`),
      axios.get(`/collaretto/get_weft_by_order/${newValue.id}`)
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
        expectedConsumption: mattress.cons_planned || "",
        bagno: mattress.dye_lot,
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
        panelLength: weft.details.panel_length,
        collarettoWidth: weft.details.roll_width,
        scrapRoll: weft.details.scrap_rolls,
        rolls: weft.details.rolls_planned,
        panels: weft.details.panels_planned,
        consumption: weft.details.cons_planned,
        bagno: weft.dye_lot
      });
    }
    Object.values(weftTablesById).forEach(table => table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber));
    const loadedWeftTables = Object.values(weftTablesById);
    setWeftTables(loadedWeftTables);
    loadedWeftTables.forEach(table => {
      table.rows.forEach(row => {
        handleWeftRowChange(table.id, row.id, "usableWidth", row.usableWidth || "0");
      });
    });

    setUnsavedChanges(false);
  } catch (error) {
    console.error("❌ Error in parallel fetch:", error);
    setTables([]);
    setAlongTables([]);
    setWeftTables([]);
    setUnsavedChanges(false);
  }
};

const useHandleOrderChange = (dependencies) => {
  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies)
  };
};

export default useHandleOrderChange;