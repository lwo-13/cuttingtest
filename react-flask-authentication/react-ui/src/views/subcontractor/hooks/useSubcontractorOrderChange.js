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
  fetchPadPrintInfo,
  fetchBrandForStyle,
  setTables,
  setAdhesiveTables,
  setAlongTables,
  setWeftTables,
  setMarkerOptions,
  sortSizes,
  clearBrand,
  clearPadPrintInfo,
  cuttingRoom
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
    setTables([]);
    setAdhesiveTables([]);
    setAlongTables([]);
    setWeftTables([]);
    setMarkerOptions([]);
    clearBrand();
    clearPadPrintInfo();
    return;
  }

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

    // Extract order info from the first line
    const firstLine = orderLines[0];
    const style = firstLine.style;
    const season = firstLine.season;
    const colorCode = firstLine.color_code;

    setSelectedStyle(style);
    setSelectedSeason(season);
    setSelectedColorCode(colorCode);

    // Extract and sort sizes
    const sizes = orderLines.map(line => ({
      size: line.size,
      qty: parseFloat(line.quantity.toString().replace(",", "")) || 0
    }));

    const sizesSorted = sortSizes(sizes);
    setOrderSizes(sizesSorted);

    // Fetch brand and pad print info
    fetchBrandForStyle(style);
    fetchPadPrintInfo(season, style, colorCode);

    const sizeNames = sizesSorted.map(s => s.size);

    const [allMattressRes, markerRes] = await Promise.all([
      axios.get(`/mattress/get_by_order/${newValue.id}`, {
        params: cuttingRoom ? { cutting_room: cuttingRoom } : {}
      }),
      axios.get(`/markers/marker_headers_planning`, {
        params: { style: style, sizes: sizeNames.join(',') }
      })
    ]);

    console.log(`📊 Fetching mattresses for order ${newValue.id} with cutting room filter: ${cuttingRoom}`);

    const markersMap = (markerRes.data?.data || []).reduce((acc, m) => {
      acc[m.marker_name] = m;
      return acc;
    }, {});

    // Separate mattress and adhesive data from the single API response
    const allData = allMattressRes.data?.data || [];
    const mattressData = allData.filter(item => ['AS', 'MS', 'CWAS', 'CWMS'].includes(item.item_type));
    const adhesiveData = allData.filter(item => ['ASA', 'MSA'].includes(item.item_type));

    // Process mattress tables
    const tablesById = {};
    for (const mattress of mattressData) {
      const tableId = mattress.table_id;
      if (!tablesById[tableId]) {
        tablesById[tableId] = {
          id: tableId,
          fabricType: mattress.fabric_type,
          fabricCode: mattress.fabric_code,
          fabricColor: mattress.fabric_color,
          spreadingMethod: mattress.spreading_method,
          allowance: parseFloat(mattress.allowance) || 0,
          spreading: (mattress.item_type === "MS" || mattress.item_type === "CWMS") ? "MANUAL" : "AUTOMATIC",
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
        expectedConsumption: mattress.cons_planned || "", // Planned consumption from DB
        layers_a: mattress.layers_a || "",
        cons_actual: mattress.cons_actual || "",
        cons_real: mattress.cons_real || "",
        bagno: mattress.dye_lot,
        sequenceNumber: mattress.sequence_number || 0
      });
    }
    Object.values(tablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );
    setTables(Object.values(tablesById));

    // Process adhesive tables
    const adhesiveTablesById = {};
    for (const adhesive of adhesiveData) {
      const tableId = adhesive.table_id;
      if (!adhesiveTablesById[tableId]) {
        adhesiveTablesById[tableId] = {
          id: tableId,
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
        width: marker?.marker_width || "",
        markerName: adhesive.marker_name,
        markerLength: marker?.marker_length || "",
        efficiency: marker?.efficiency || "",
        piecesPerSize: marker?.size_quantities || {},
        layers: adhesive.layers || "",
        expectedConsumption: adhesive.cons_actual || "",
        bagno: adhesive.dye_lot,
        sequenceNumber: adhesive.sequence_number || 0
      });
    }
    Object.values(adhesiveTablesById).forEach(table =>
      table.rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    );
    setAdhesiveTables(Object.values(adhesiveTablesById));

    // Marker options not needed for read-only subcontractor view

  } catch (error) {
    console.error("❌ Error fetching subcontractor data:", error);
    setTables([]);
    setAdhesiveTables([]);
  }
};

const useSubcontractorOrderChange = (dependencies) => {
  return {
    onOrderChange: (value) => handleOrderChange(value, dependencies)
  };
};

export default useSubcontractorOrderChange;
