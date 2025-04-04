import React, { useEffect, useState } from 'react';
import axios from 'utils/axiosInstance';
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Box, TextField, Typography, TablePagination, Button, CheckCircleOutline } from '@mui/material';
import MainCard from '../../ui-component/cards/MainCard';
import { Print } from '@mui/icons-material';
import jsPDF from "jspdf";
import JsBarcode from 'jsbarcode';
import RobotoBold from "../../assets/fonts/Roboto-Bold-bold";
import RobotoRegular from "../../assets/fonts/Roboto-Regular-normal";

// Custom Pagination Component to Disable Scrolling
const CustomPagination = (props) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: 2,
                overflow: 'hidden',
                minHeight: '52px' 
            }}
        >
            <TablePagination
                {...props}
                component="div"
                sx={{
                    overflow: 'hidden',
                    minHeight: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    fontSize: '1.2rem',
                    '.MuiTablePagination-actions button': {
                        fontSize: '1.2rem',
                        minWidth: '48px',
                        padding: '10px'
                    },
                    '.MuiTablePagination-select': {
                        fontSize: '1.2rem'
                    }
                }}
            />
        </Box>
    );
};

const MattressTable = () => {
    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [tableHeight, setTableHeight] = useState(window.innerHeight - 260);
    const [selectedMattresses, setSelectedMattresses] = useState([]);  

    // ✅ Adjust table height dynamically when the window resizes
    useEffect(() => {
        const handleResize = () => {
            setTableHeight(window.innerHeight - 260); // ✅ Adjust based on viewport height
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSelectionChange = (newSelection) => {
        if (!newSelection.length) {
            setSelectedMattresses([]); // ✅ If nothing is selected, clear state
            return;
        }
    
        // ✅ Find selected mattresses from `mattresses` array
        const selected = mattresses.filter(m => newSelection.includes(m.mattress));
    
        console.log("New Selection:", selected); // 🔍 Debugging - shows selected objects
    
        setSelectedMattresses(selected); // ✅ Store selected objects
    };

    const fetchMattresses = () => {
        setLoading(true);
        axios.get('/mattress/all_with_details')
            .then((response) => {
                console.log("API Response:", response.data);
                if (response.data.success) {
                    const updatedMattresses = response.data.data.map(mattress => {
                        const printTravelStatus = mattress.details.length > 0 
                            ? mattress.details[0].print_travel 
                            : false;
    
                        const printMarkerStatus = mattress.details.length > 0 
                            ? mattress.details[0].print_marker 
                            : false;
    
                        return {
                            ...mattress,
                            print_travel: printTravelStatus,
                            print_marker: printMarkerStatus
                        };
                    });
    
                    setMattresses(updatedMattresses);
                } else {
                    console.error("Failed to fetch mattress data.");
                }
            })
            .catch((error) => console.error("Error fetching mattresses:", error))
            .finally(() => setLoading(false));
    };

    // Call fetchMattresses inside useEffect
    useEffect(() => {
        fetchMattresses();
    }, []);

    // Filter data locally
    const filteredMattresses = mattresses.filter(mattress =>
        Object.values(mattress).some(value =>
            value.toString().toLowerCase().includes(filterText.toLowerCase())
        )
    );

    const handlePrint = async () => {
        if (!selectedMattresses || selectedMattresses.length === 0) {
            alert("No mattress selected. Please select a mattress first.");
            return;
        }
    
        for (const mattress of selectedMattresses) {
            try {
                // ✅ Get mattress ID
                const mattressId = mattress.id; // ✅ Now we store the mattress_id for updates
    
                // ✅ Helper function to ensure string conversion
                const ensureString = (value) =>
                    value !== null && value !== undefined ? value.toString() : "N/A";
    
                // ✅ Convert all fields to strings
                const mattressName = ensureString(mattress.mattress);
                const orderCommessa = ensureString(mattress.order_commessa);
                const fabricCode = ensureString(mattress.fabric_code);
                const fabricColor = ensureString(mattress.fabric_color);
                const dyeLot = ensureString(mattress.dye_lot);
                const spreadingMethod = ensureString(mattress.spreading_method);
    
                // ✅ Get mattress details safely
                const mattressDetails = mattress.details?.[0] || {};
                const mattressMarkers = mattress.markers?.[0] || {};
    
                const layers = ensureString(mattressDetails.layers);
                const consPlanned = ensureString(mattressDetails.cons_planned);
                const extra = ensureString(mattressDetails.extra);
                const markerName = ensureString(mattressMarkers.marker_name);
                const markerWidth = ensureString(mattressMarkers.marker_width);
                const markerLength = ensureString(mattressMarkers.marker_length);
    
                // ✅ Fetch marker lines from API
                let markerLines = [];
                try {
                    const response = await axios.get(
                        `/markers/marker_pcs?marker_name=${markerName}`
                    );
                    if (response.data.success) {
                        markerLines = response.data.marker_lines;
                    }
                } catch (error) {
                    console.error("Error fetching marker lines:", error);
                }

                // Variables to hold season, style, and color.
                let season, style, color;

                try {
                // Query the order_lines endpoint using order_commessa.
                const orderLinesResponse = await axios.get(
                    `/orders/order_lines?order_commessa=${encodeURIComponent(orderCommessa)}`
                );

                if (orderLinesResponse.data.success && orderLinesResponse.data.data.length > 0) {
                    // Use the first record from the order_lines.
                    const data = orderLinesResponse.data.data[0];
                    console.log('Order lines data:', data);
                    season = data.season;        
                    style = data.style;
                    color = data.color_code;     
                } else {
                    console.error("No order lines found for order_commessa:", orderCommessa);
                }
                } catch (error) {
                console.error("Error fetching order lines:", error);
                }

                let padPrintData = [];

                try {
                // Query the padprint endpoint using the extracted season, style, and color.
                const padPrintResponse = await axios.get(
                    `/padprint/filter?season=${encodeURIComponent(season)}&style=${encodeURIComponent(style)}&color=${encodeURIComponent(color)}`
                );
                if (padPrintResponse.data.success) {
                    padPrintData = padPrintResponse.data.data; // Array of padprint objects.
                } else {
                    console.error("Padprint API returned a non-success response.");
                }
                } catch (error) {
                console.error("Error fetching padprint data:", error);
                }
    
                // ✅ Define order table (Left Side)
                const orderTable = [
                    { label: "Mattress Name", value: mattressName },
                    { label: "Marker", value: markerName },
                    { label: "Order Commessa", value: orderCommessa },
                    { label: "Spreader", value: "" } // ✅ Empty field
                ];
    
                // ✅ Define fabric table (Below Order Table)
                const fabricTable = [
                    { label: "Overlapping", value: "YES" },
                    { label: "Marker Width [cm]", value: markerWidth },
                    { label: "Marker Length [m]", value: markerLength },
                    { label: "Allowance [m]", value: extra },
                    { label: "Spreading Method", value: spreadingMethod },
                    { label: "Fabric", value: fabricCode },
                    { label: "Color", value: fabricColor },
                    { label: "Dye Lot", value: dyeLot },
                    { label: "Consumption [m]", value: consPlanned }
                ];

                // Define headers for the padprint table.
                const padPrintHeaders = ["Pattern", "PadPrint Color"];
    
                // ✅ Define Layers Table (Right Side)
                const layersTable = [{ planned: layers, actual: "" }]; // ✅ Actual Layer input left blank
    
                const fabricTable2 = [
                    { label: "Fabric", value: fabricCode },
                    { label: "Color", value: fabricColor },
                    { label: "Dye Lot", value: dyeLot }
                ];
    
                // ✅ Setup PDF
                const doc = new jsPDF({
                    orientation: "landscape",
                    unit: "mm",
                    format: "a4"
                });
    
                const startX = 10;
                const startY = 10;
                const rowHeight = 8;
                const firstColumnWidth = 40;
                const secondColumnWidth = 80;
    
                doc.setFontSize(10);
    
                // ✅ Draw Order Table (Left)
                orderTable.forEach((field, index) => {
                    const yPos = startY + index * rowHeight;
    
                    doc.rect(startX, yPos, firstColumnWidth, rowHeight);
                    doc.rect(startX + firstColumnWidth, yPos, secondColumnWidth, rowHeight);
    
                    doc.setFont("helvetica", "bold");
                    doc.text(field.label, startX + 2, yPos + 5);
    
                    doc.setFont("helvetica", "normal");
                    doc.text(field.value, startX + firstColumnWidth + 2, yPos + 5);
                });
    
                // ✅ Fabric Table (Below Order Table)
                const fabricTableStartY = startY + orderTable.length * rowHeight + 8; // ✅ Space after Order Table
    
                fabricTable.forEach((field, index) => {
                    const yPos = fabricTableStartY + index * rowHeight;
    
                    doc.rect(startX, yPos, firstColumnWidth, rowHeight);
                    doc.rect(startX + firstColumnWidth, yPos, secondColumnWidth, rowHeight);
    
                    doc.setFont("helvetica", "bold");
                    doc.text(field.label, startX + 2, yPos + 5);
    
                    doc.setFont("helvetica", "normal");
                    doc.text(field.value, startX + firstColumnWidth + 2, yPos + 5);
                });
    
                // ✅ Layers Table (Right Side)
                const layersStartX = startX + firstColumnWidth + secondColumnWidth + 10; // ✅ Position it further right
                const layersStartY = startY + 24;
    
                doc.setFont("helvetica", "bold");
    
                const columnWidth = 35; // ✅ Reduce width
                const headerHeight = rowHeight; // Keep header height
    
                doc.rect(layersStartX, layersStartY, columnWidth, headerHeight);
                doc.rect(layersStartX + columnWidth, layersStartY, columnWidth, headerHeight);
    
                doc.text(
                    "Planned Layers",
                    layersStartX + columnWidth / 2,
                    layersStartY + headerHeight / 2 + 2,
                    { align: "center" }
                );
                doc.text(
                    "Actual Layers",
                    layersStartX + columnWidth + columnWidth / 2,
                    layersStartY + headerHeight / 2 + 2,
                    { align: "center" }
                );
    
                // ✅ Draw rows with centered text for Layers Table
                layersTable.forEach((field, index) => {
                    const yPos = layersStartY + (index + 1) * rowHeight;
    
                    doc.rect(layersStartX, yPos, columnWidth, rowHeight);
                    doc.rect(layersStartX + columnWidth, yPos, columnWidth, rowHeight);
    
                    doc.setFont("helvetica", "normal");
                    doc.text(
                        field.planned,
                        layersStartX + columnWidth / 2,
                        yPos + rowHeight / 2 + 2,
                        { align: "center" }
                    );
                    doc.text(
                        field.actual,
                        layersStartX + columnWidth + columnWidth / 2,
                        yPos + rowHeight / 2 + 2,
                        { align: "center" }
                    );
                });
    
                // ✅ Position the Spreading & Cutting tables below the Layers Table
                const manualTableStartY = layersStartY + 2 * rowHeight + 8; // Position after Layers Table
    
                const manualEntryTables = [
                    { title: "Spreading", yOffset: 0 },
                    { title: "Cutting", yOffset: 40 } // Space between tables
                ];
    
                manualEntryTables.forEach((section) => {
                    const sectionY = manualTableStartY + section.yOffset;
    
                    // ✅ Title row
                    doc.setFont("helvetica", "bold");
                    doc.rect(layersStartX, sectionY, columnWidth * 2, rowHeight); // Same width as Layers Table
                    doc.text(
                        section.title,
                        layersStartX + columnWidth,
                        sectionY + rowHeight / 2 + 2,
                        { align: "center" }
                    );
    
                    // ✅ Labels
                    const labels = ["Date", "Hour", "Operator"];
                    labels.forEach((label, index) => {
                        const yPos = sectionY + (index + 1) * rowHeight;
    
                        // ✅ Label column
                        doc.setFont("helvetica", "normal");
                        doc.rect(layersStartX, yPos, columnWidth, rowHeight);
                        doc.text(
                            label,
                            layersStartX + columnWidth / 2,
                            yPos + rowHeight / 2 + 2,
                            { align: "center" }
                        );
    
                        // ✅ Empty input space for operator
                        doc.rect(layersStartX + columnWidth, yPos, columnWidth, rowHeight);
                    });
                });

                // Determine the starting Y position for the padprint table (positioned below the marker table).
                const padPrintTableStartY = manualTableStartY + 2 * 40;

                // Draw the header row for the padprint table.
                padPrintHeaders.forEach((header, i) => {
                const cellX = layersStartX + i * columnWidth;
                doc.rect(cellX, padPrintTableStartY, columnWidth, rowHeight);
                doc.setFont("helvetica", "bold");
                doc.text(
                    header,
                    cellX + columnWidth / 2,
                    padPrintTableStartY + rowHeight / 2 + 2,
                    { align: "center" }
                );
                });

                // Draw the padprint data rows.
                padPrintData.forEach((item, index) => {
                const yPos = padPrintTableStartY + (index + 1) * rowHeight;
                // Extract only 'pattern' and 'padprint_color' from each padprint item.
                const rowData = [item.pattern, item.padprint_color];

                rowData.forEach((cell, i) => {
                    const cellX = layersStartX + i * columnWidth;
                    doc.rect(cellX, yPos, columnWidth, rowHeight);
                    doc.setFont("helvetica", "normal");
                    doc.text(
                    cell.toString(),
                    cellX + columnWidth / 2,
                    yPos + rowHeight / 2 + 2,
                    { align: "center" }
                    );
                });
                });
    
                // ✅ Positioning for the comment box
                const commentBoxStartY = padPrintTableStartY + 24; // ✅ Adjusted Y position
                const commentBoxHeight = 37; // ✅ Enough height for writing
                const commentBoxWidth = columnWidth * 2; // ✅ Same width as Spreading & Cutting tables
    
                // ✅ Draw the comment box
                doc.rect(layersStartX, commentBoxStartY, commentBoxWidth, commentBoxHeight);
    
                // ✅ Add "Comments" title
                doc.setFont("helvetica", "bold");
                doc.text(
                    "Comments",
                    layersStartX + commentBoxWidth / 2,
                    commentBoxStartY + 5,
                    { align: "center" }
                );
    
                // ✅ Marker Details Table (Bottom)
                const markerTableStartY = fabricTableStartY + fabricTable.length * rowHeight + 8;
    
                doc.setFont("helvetica", "bold");
                const markerColumnWidth = 40;
    
                // Header Row for Marker Table
                doc.rect(startX, markerTableStartY, markerColumnWidth, rowHeight);
                doc.rect(startX + markerColumnWidth, markerTableStartY, markerColumnWidth, rowHeight);
                doc.rect(
                    startX + markerColumnWidth * 2,
                    markerTableStartY,
                    markerColumnWidth,
                    rowHeight
                );
    
                doc.text(
                    "Style",
                    startX + markerColumnWidth / 2,
                    markerTableStartY + rowHeight / 2 + 2,
                    { align: "center" }
                );
                doc.text(
                    "Size",
                    startX + markerColumnWidth + markerColumnWidth / 2,
                    markerTableStartY + rowHeight / 2 + 2,
                    { align: "center" }
                );
                doc.text(
                    "Pcs per Layer",
                    startX + markerColumnWidth * 2 + markerColumnWidth / 2,
                    markerTableStartY + rowHeight / 2 + 2,
                    { align: "center" }
                );
    
                // Fill Data for Marker Table
                markerLines.forEach((row, index) => {
                    const yPos = markerTableStartY + (index + 1) * rowHeight;
    
                    doc.rect(startX, yPos, markerColumnWidth, rowHeight);
                    doc.rect(startX + markerColumnWidth, yPos, markerColumnWidth, rowHeight);
                    doc.rect(
                        startX + markerColumnWidth * 2,
                        yPos,
                        markerColumnWidth,
                        rowHeight
                    );
    
                    doc.setFont("helvetica", "normal");
                    doc.text(
                        row.style,
                        startX + markerColumnWidth / 2,
                        yPos + rowHeight / 2 + 2,
                        { align: "center" }
                    );
                    doc.text(
                        row.size,
                        startX + markerColumnWidth + markerColumnWidth / 2,
                        yPos + rowHeight / 2 + 2,
                        { align: "center" }
                    );
                    doc.text(
                        row.pcs_on_layer.toString(),
                        startX + markerColumnWidth * 2 + markerColumnWidth / 2,
                        yPos + rowHeight / 2 + 2,
                        { align: "center" }
                    );
                });
    
                // ✅ Position for the vertical line further right
                const separatorX = layersStartX + 80; // Move it further to the right
                const separatorStartY = startY;
                const separatorEndY = 200; // Extends to the bottom
    
                // ✅ Set line style (dotted or dashed)
                doc.setLineDash([1, 1]); // ✅ Dashed line pattern (adjust values for spacing)
                doc.line(separatorX, separatorStartY, separatorX, separatorEndY); // ✅ Draw vertical line
    
                // ✅ Reset line dash after drawing to avoid affecting other elements
                doc.setLineDash([]);
    
                // ✅ Define the rotated table position (Bottom-Right)
                const rotatedStartX = separatorX + 10; // Adjust right position
                const rotatedStartY = startY + 70; // Move it to the bottom
    
                const rotatedRowHeight = 8; // Simulated "column" height
    
                // Loop through orderTable in a rotated manner
                orderTable.forEach((field, index) => {
                    const xPos = rotatedStartX + index * rotatedRowHeight; // Move right (acts like rows)
                    const yPos = rotatedStartY; // Fixed Y position (acts like left margin)
    
                    // Swap width & height to create a rotated effect
                    doc.rect(xPos, yPos, rotatedRowHeight, secondColumnWidth);
                    doc.rect(xPos, yPos + secondColumnWidth, rotatedRowHeight, firstColumnWidth);
    
                    // Draw text in rotated orientation (simulated)
                    doc.setFont("helvetica", "bold");
                    doc.text(field.label, xPos + 5, yPos + 118, { angle: 90 });
    
                    doc.setFont("helvetica", "normal");
                    doc.text(field.value, xPos + 5, yPos + secondColumnWidth - 3, { angle: 90 });
                });
    
                const ColumnWidth = 29.5;
    
                // Loop through fabricTable2 in a rotated manner
                fabricTable2.forEach((field, index) => {
                    const xPos = rotatedStartX + 24 + index * rotatedRowHeight; // Move right (acts like rows)
                    const yPos = startY; // Fixed Y position (acts like left margin)
    
                    // Swap width & height to create a rotated effect
                    doc.rect(xPos, yPos, rotatedRowHeight, ColumnWidth);
                    doc.rect(xPos, yPos + ColumnWidth, rotatedRowHeight, ColumnWidth);
    
                    // Draw text in rotated orientation (simulated)
                    doc.setFont("helvetica", "bold");
                    doc.text(field.label, xPos + 5, yPos + 57, { angle: 90 });
    
                    doc.setFont("helvetica", "normal");
                    doc.text(field.value, xPos + 5, yPos + ColumnWidth - 3, { angle: 90 });
                });

                // ✅ Generate barcode for mattressName
                const barcodeCanvas = document.createElement('canvas');
                document.body.appendChild(barcodeCanvas);

                JsBarcode(barcodeCanvas, mattressName, {
                    format: "CODE128",
                    displayValue: false,   // No text below barcode
                    fontSize: 14,
                    height: 30,
                    width: 2
                });

                // ✅ Convert canvas to image
                const barcodeImg = barcodeCanvas.toDataURL('image/png');

                // ✅ Add the barcode to the PDF (adjust coordinates)
                doc.addImage(barcodeImg, 'PNG', layersStartX, startY, 70, 20);

                doc.addImage(barcodeImg, 'PNG', rotatedStartX + 20, startY + 40, 60, 20, undefined, 'FAST', 90);

                // ✅ Remove the canvas if you want
                document.body.removeChild(barcodeCanvas);
    
                // Save the PDF file
                doc.save(`Mattress_Travel_Doc_${mattressName}.pdf`);
    
                // ✅ API Call to Update Print Status
                await axios.put(`/mattress/update_print_travel`, {
                    mattress_id: mattressId,
                    print_travel: true // ✅ Set as printed
                });
    
                // ✅ Refresh the table to reflect the new status
                fetchMattresses();
            } catch (error) {
                console.error("Error processing mattress", error);
            }
        }
        // ✅ Refresh the table to reflect the new status after processing all
        fetchMattresses();
    };
    
    
    const handlePrintBG = async () => {
        if (!selectedMattresses || selectedMattresses.length === 0) {
            alert("No mattress selected. Please select a mattress first.");
            return;
        }

        for (const mattress of selectedMattresses) {
            try {

                // ✅ Get mattress ID
                const mattressId = mattress.id; // ✅ Now we store the mattress_id for updates
            
                // ✅ Helper function to ensure string conversion
                const ensureString = (value) => (value !== null && value !== undefined ? value.toString() : "N/A");
            
                // ✅ Convert all fields to strings
                const mattressName = ensureString(mattress.mattress);
                const orderCommessa = ensureString(mattress.order_commessa);
                const fabricCode = ensureString(mattress.fabric_code);
                const fabricColor = ensureString(mattress.fabric_color);
                const dyeLot = ensureString(mattress.dye_lot);
                const spreadingMethod = ensureString(mattress.spreading_method);
            
                // ✅ Get mattress details safely
                const mattressDetails = mattress.details?.[0] || {};  
                const mattressMarkers = mattress.markers?.[0] || {};  
            
                const layers = ensureString(mattressDetails.layers);
                const consPlanned = ensureString(mattressDetails.cons_planned);
                const extra = ensureString(mattressDetails.extra);
                const markerName = ensureString(mattressMarkers.marker_name);
                const markerWidth = ensureString(mattressMarkers.marker_width);
                const markerLength = ensureString(mattressMarkers.marker_length);

                // ✅ Fetch marker lines from API
                let markerLines = [];
                try {
                    const response = await axios.get(`/markers/marker_pcs?marker_name=${markerName}`);
                    if (response.data.success) {
                        markerLines = response.data.marker_lines; 
                    }
                } catch (error) {
                    console.error("Error fetching marker lines:", error);
                }

                // Variables to hold season, style, and color.
                let season, style, color;

                try {
                const orderLinesResponse = await axios.get(
                    `/orders/order_lines?order_commessa=${encodeURIComponent(orderCommessa)}`
                );
                if (orderLinesResponse.data.success && orderLinesResponse.data.data.length > 0) {
                    const data = orderLinesResponse.data.data[0];
                    season = data.season;        // Should be "24CC" based on your database
                    style = data.style;
                    color = data.color_code;     // if needed, depending on your field naming
                } else {
                    console.error("No order lines found for order_commessa:", orderCommessa);
                }
                } catch (error) {
                console.error("Error fetching order lines:", error);
                }

                let padPrintData = [];
                try {
                // Query the padprint endpoint using the extracted season, style, and color.
                const padPrintResponse = await axios.get(
                    `/padprint/filter?season=${encodeURIComponent(season)}&style=${encodeURIComponent(style)}&color=${encodeURIComponent(color)}`
                );
                if (padPrintResponse.data.success) {
                    padPrintData = padPrintResponse.data.data; // Array of padprint objects.
                } else {
                    console.error("Padprint API returned a non-success response.");
                }
                } catch (error) {
                console.error("Error fetching padprint data:", error);
                }
            
                // ✅ Define order table (Left Side)
                const orderTable = [
                    { label: "Капак №", value: mattressName },
                    { label: "Модел №", value: markerName },
                    { label: "Поръчка №", value: orderCommessa },
                    { label: "Наст. маш.", value: "" } // ✅ Empty field
                ];
            
                // ✅ Define fabric table (Below Order Table)
                const fabricTable = [
                    { label: "Застъпване", value: "YES" },
                    { label: "Шир. настил [cm]", value: markerWidth },
                    { label: "Дъл. настил [m]", value: markerLength },
                    { label: "Extra [m]", value: extra },
                    { label: "Начин на настилане", value: spreadingMethod },
                    { label: "Плат", value: fabricCode },
                    { label: "Цвят", value: fabricColor },
                    { label: "Баня", value: dyeLot },
                    { label: "Консумация [m]", value: consPlanned }
                ];
            
                // ✅ Define Layers Table (Right Side)
                const layersTable = [
                    { planned: layers, actual: "" } // ✅ Actual Layer input left blank
                ];

                const fabricTable2 = [
                    { label: "Плат", value: fabricCode },
                    { label: "Цвят", value: fabricColor },
                    { label: "Баня", value: dyeLot }
                ];

                // Define headers for the padprint table.
                const padPrintHeaders = ["Падпринт", "Цвят"];
            
                // ✅ Setup PDF
                const doc = new jsPDF({
                    orientation: "landscape",
                    unit: "mm",
                    format: "a4"
                });

                // Register the fonts
                doc.addFileToVFS("Roboto-Bold-bold.ttf", RobotoBold);
                doc.addFont("Roboto-Bold-bold.ttf", "Roboto-Bold", "bold");

                doc.addFileToVFS("Roboto-Regular-normal.ttf", RobotoRegular);
                doc.addFont("Roboto-Regular-normal.ttf", "Roboto-Regular", "normal");
            
                const startX = 10; 
                const startY = 10;
                const rowHeight = 8;
                const firstColumnWidth = 40;
                const secondColumnWidth = 80;
            
                doc.setFontSize(10);
            
                // ✅ Draw Order Table (Left)
                orderTable.forEach((field, index) => {
                    const yPos = startY + index * rowHeight;
            
                    doc.rect(startX, yPos, firstColumnWidth, rowHeight);
                    doc.rect(startX + firstColumnWidth, yPos, secondColumnWidth, rowHeight);
            
                    doc.setFont('Roboto-Bold', 'bold');
                    doc.text(field.label, startX + 2, yPos + 5);
            
                    doc.setFont('Roboto-Regular', 'normal');
                    doc.text(field.value, startX + firstColumnWidth + 2, yPos + 5);
                });
            
                // ✅ Fabric Table (Below Order Table)
                const fabricTableStartY = startY + orderTable.length * rowHeight + 8; // ✅ Space after Order Table
            
                fabricTable.forEach((field, index) => {
                    const yPos = fabricTableStartY + index * rowHeight;
            
                    doc.rect(startX, yPos, firstColumnWidth, rowHeight);
                    doc.rect(startX + firstColumnWidth, yPos, secondColumnWidth, rowHeight);
            
                    doc.setFont('Roboto-Bold', 'bold');
                    doc.text(field.label, startX + 2, yPos + 5);
            
                    doc.setFont('Roboto-Regular', 'normal');
                    doc.text(field.value, startX + firstColumnWidth + 2, yPos + 5);
                });
            
                // ✅ Layers Table (Right Side)
                const layersStartX = startX + firstColumnWidth + secondColumnWidth + 10; // ✅ Position it further right
                const layersStartY = startY + 24; 
            
                doc.setFont('Roboto-Bold', 'bold');
                
                const columnWidth = 35; // ✅ Reduce width
                const headerHeight = rowHeight; // Keep header height

                doc.rect(layersStartX, layersStartY, columnWidth, headerHeight);
                doc.rect(layersStartX + columnWidth, layersStartY, columnWidth, headerHeight);

                doc.text("Планирани катове", layersStartX + columnWidth / 2, layersStartY + headerHeight / 2 + 2, { align: "center" });
                doc.text("Реални катове", layersStartX + columnWidth + columnWidth / 2, layersStartY + headerHeight / 2 + 2, { align: "center" });
            
                // ✅ Draw rows with centered text
                layersTable.forEach((field, index) => {
                    const yPos = layersStartY + (index + 1) * rowHeight;

                    doc.rect(layersStartX, yPos, columnWidth, rowHeight);
                    doc.rect(layersStartX + columnWidth, yPos, columnWidth, rowHeight);

                    doc.setFont('Roboto-Regular', 'normal');
                    doc.text(field.planned, layersStartX + columnWidth / 2, yPos + rowHeight / 2 + 2, { align: "center" });
                    doc.text(field.actual, layersStartX + columnWidth + columnWidth / 2, yPos + rowHeight / 2 + 2, { align: "center" });
                });

                // ✅ Position the Spreading & Cutting tables below the Layers Table
                const manualTableStartY = layersStartY + 2 * rowHeight + 8; // Position after Layers Table

                const manualEntryTables = [
                    { title: "Настилане", yOffset: 0 },
                    { title: "Кроене", yOffset: 40 } // Space between tables
                ];

                manualEntryTables.forEach((section) => {
                    const sectionY = manualTableStartY + section.yOffset;

                    // ✅ Title row
                    doc.setFont('Roboto-Bold', 'bold');
                    doc.rect(layersStartX, sectionY, columnWidth * 2, rowHeight); // Same width as Layers Table
                    doc.text(section.title, layersStartX + columnWidth, sectionY + rowHeight / 2 + 2, { align: "center" });

                    // ✅ Labels
                    const labels = ["Дата", "Час", "Оператор"];
                    labels.forEach((label, index) => {
                        const yPos = sectionY + (index + 1) * rowHeight;

                        // ✅ Label column
                        doc.setFont('Roboto-Regular', 'normal');
                        doc.rect(layersStartX, yPos, columnWidth, rowHeight);
                        doc.text(label, layersStartX + columnWidth / 2, yPos + rowHeight / 2 + 2, { align: "center" });

                        // ✅ Empty input space for operator
                        doc.rect(layersStartX + columnWidth, yPos, columnWidth, rowHeight);
                    });
                });

                // Determine the starting Y position for the padprint table (positioned below the marker table).
                const padPrintTableStartY = manualTableStartY + 2 * 40;

                // Draw the header row for the padprint table.
                padPrintHeaders.forEach((header, i) => {
                const cellX = layersStartX + i * columnWidth;
                doc.rect(cellX, padPrintTableStartY, columnWidth, rowHeight);
                doc.setFont("Roboto-Bold", "bold");
                doc.text(
                    header,
                    cellX + columnWidth / 2,
                    padPrintTableStartY + rowHeight / 2 + 2,
                    { align: "center" }
                );
                });

                // Draw the padprint data rows.
                padPrintData.forEach((item, index) => {
                const yPos = padPrintTableStartY + (index + 1) * rowHeight;
                // Extract only 'pattern' and 'padprint_color' from each padprint item.
                const rowData = [item.pattern, item.padprint_color];

                rowData.forEach((cell, i) => {
                    const cellX = layersStartX + i * columnWidth;
                    doc.rect(cellX, yPos, columnWidth, rowHeight);
                    doc.setFont("Roboto-Regular", "normal");
                    doc.text(
                    cell.toString(),
                    cellX + columnWidth / 2,
                    yPos + rowHeight / 2 + 2,
                    { align: "center" }
                    );
                });
                });

                // ✅ Positioning for the comment box
                const commentBoxStartY = padPrintTableStartY + 24; // ✅ Adjusted Y position
                const commentBoxHeight = 37;  // ✅ Enough height for writing
                const commentBoxWidth = columnWidth * 2;  // ✅ Same width as Spreading & Cutting tables

                // ✅ Draw the comment box
                doc.rect(layersStartX, commentBoxStartY, commentBoxWidth, commentBoxHeight);

                // ✅ Add "Comments" title
                doc.setFont('Roboto-Bold', 'bold');
                doc.text("Коментар", layersStartX + commentBoxWidth / 2, commentBoxStartY + 5, { align: "center" });

                // ✅ Marker Details Table (Bottom)
                const markerTableStartY = fabricTableStartY + fabricTable.length * rowHeight + 8;
                const markerColumnWidth = 40;

                doc.setFont('Roboto-Bold', 'bold');

                // Header Row
                doc.rect(startX, markerTableStartY, markerColumnWidth, rowHeight);
                doc.rect(startX + markerColumnWidth, markerTableStartY, markerColumnWidth, rowHeight);
                doc.rect(startX + markerColumnWidth * 2, markerTableStartY, markerColumnWidth, rowHeight);

                doc.text("Модел", startX + markerColumnWidth / 2, markerTableStartY + rowHeight / 2 + 2, { align: "center" });
                doc.text("Размер", startX + markerColumnWidth + markerColumnWidth / 2, markerTableStartY + rowHeight / 2 + 2, { align: "center" });
                doc.text("Бройки в кат", startX + markerColumnWidth * 2 + markerColumnWidth / 2, markerTableStartY + rowHeight / 2 + 2, { align: "center" });

                // Fill Data
                markerLines.forEach((row, index) => {
                    const yPos = markerTableStartY + (index + 1) * rowHeight;

                    doc.rect(startX, yPos, markerColumnWidth, rowHeight);
                    doc.rect(startX + markerColumnWidth, yPos, markerColumnWidth, rowHeight);
                    doc.rect(startX + markerColumnWidth * 2, yPos, markerColumnWidth, rowHeight);

                    doc.setFont('Roboto-Regular', 'normal');
                    doc.text(row.style, startX + markerColumnWidth / 2, yPos + rowHeight / 2 + 2, { align: "center" });
                    doc.text(row.size, startX + markerColumnWidth + markerColumnWidth / 2, yPos + rowHeight / 2 + 2, { align: "center" });
                    doc.text(row.pcs_on_layer.toString(), startX + markerColumnWidth * 2 + markerColumnWidth / 2, yPos + rowHeight / 2 + 2, { align: "center" });
                });

                // ✅ Position for the vertical line further right
                const separatorX = layersStartX + 80; // Move it further to the right
                const separatorStartY = startY;
                const separatorEndY = 200 // Extends to the bottom

                // ✅ Set line style (dotted or dashed)
                doc.setLineDash([1, 1]); // ✅ Dashed line pattern (adjust values for spacing)
                doc.line(separatorX, separatorStartY, separatorX, separatorEndY); // ✅ Draw vertical line

                // ✅ Reset line dash after drawing to avoid affecting other elements
                doc.setLineDash([]);

                // ✅ Define the rotated table position (Bottom-Right)
                const rotatedStartX = separatorX + 10; // Adjust right position
                const rotatedStartY = startY + 70; // Move it to the bottom

                const rotatedRowHeight = 8;  // Simulated "column" height

                // ✅ Loop through orderTable in a rotated manner
                orderTable.forEach((field, index) => {
                    const xPos = rotatedStartX + index * rotatedRowHeight; // Move **right** (acts like rows)
                    const yPos = rotatedStartY; // Fixed Y position (acts like left margin)

                    // ✅ Swap width & height to create a rotated effect
                    doc.rect(xPos, yPos, rotatedRowHeight, secondColumnWidth);
                    doc.rect(xPos, yPos + secondColumnWidth, rotatedRowHeight, firstColumnWidth);

                    // ✅ Draw text in rotated orientation (simulated)
                    doc.setFont('Roboto-Bold', 'bold');
                    doc.text(field.label, xPos + 5, yPos + 118, { angle: 90 });

                    doc.setFont('Roboto-Regular', 'normal');
                    doc.text(field.value, xPos + 5, yPos + secondColumnWidth - 3, { angle: 90 });
                });

                const ColumnWidth = 29.5;

                // ✅ Loop through orderTable in a rotated manner
                fabricTable2.forEach((field, index) => {
                    const xPos = rotatedStartX + 24 + index * rotatedRowHeight; // Move **right** (acts like rows)
                    const yPos = startY; // Fixed Y position (acts like left margin)

                    // ✅ Swap width & height to create a rotated effect
                    doc.rect(xPos, yPos, rotatedRowHeight, ColumnWidth);
                    doc.rect(xPos, yPos + ColumnWidth, rotatedRowHeight, ColumnWidth);

                    // ✅ Draw text in rotated orientation (simulated)
                    doc.setFont('Roboto-Bold', 'bold');
                    doc.text(field.label, xPos + 5, yPos + 57, { angle: 90 });

                    doc.setFont('Roboto-Regular', 'normal');
                    doc.text(field.value, xPos + 5, yPos + ColumnWidth - 3, { angle: 90 });
                });

                // ✅ Generate barcode for mattressName
                const barcodeCanvas = document.createElement('canvas');
                document.body.appendChild(barcodeCanvas);

                JsBarcode(barcodeCanvas, mattressName, {
                    format: "CODE128",
                    displayValue: false,   // No text below barcode
                    fontSize: 14,
                    height: 30,
                    width: 2
                });

                // ✅ Convert canvas to image
                const barcodeImg = barcodeCanvas.toDataURL('image/png');

                // ✅ Add the barcode to the PDF (adjust coordinates)
                doc.addImage(barcodeImg, 'PNG', layersStartX, startY, 70, 20);

                doc.addImage(barcodeImg, 'PNG', rotatedStartX + 20, startY + 40, 60, 20, undefined, 'FAST', 90);

                // ✅ Remove the canvas if you want
                document.body.removeChild(barcodeCanvas);
            
                doc.save(`Капак_${mattressName}.pdf`);

                
                // ✅ API Call to Update Print Status
                await axios.put(`/mattress/update_print_travel`, {
                    mattress_id: mattressId,
                    print_travel: true // ✅ Set as printed
                });
            
                
            } catch (error) {
                console.error("Error processing mattress", error);
            }
        }
        
        // ✅ Refresh the table to reflect the new status
        fetchMattresses();
    };

    // Table Columns
    const columns = [
        { field: 'mattress', headerName: 'Mattress', width: 250 },
        { field: 'order_commessa', headerName: 'Order Commessa', width: 180 },
        { field: 'fabric_type', headerName: 'Fabric Type', width: 130 },
        { field: 'fabric_code', headerName: 'Fabric Code', width: 140 },
        { field: 'fabric_color', headerName: 'Fabric Color', width: 140 },
        { field: 'dye_lot', headerName: 'Dye Lot', width: 130 },
        { field: 'item_type', headerName: 'Item Type', width: 100 },
        { field: 'spreading_method', headerName: 'Spreading Method', width: 180 },
        { 
            field: 'print_travel', 
            headerName: 'Printed', 
            width: 160, 
            renderCell: (params) => (
                params.value ? "✅ Printed" : ""
            ) 
        }
    ];


    return (
        <MainCard
            title="Mattress Travel Document"
            secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Filter Input */}
                    <TextField
                        label="Filter"
                        variant="outlined"
                        size="small"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        sx={{ '& input': { fontWeight: 'normal' } }}
                    />
    
                    {/* Print Button */}
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handlePrint}// ✅ Calls the print function
                        startIcon={<Print />} // ✅ Uses a Print icon
                    >
                        Print EN
                    </Button>

                    {/* Print Button BG */}
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handlePrintBG}// ✅ Calls the print function
                        startIcon={<Print />} // ✅ Uses a Print icon
                    >
                        Print BG
                    </Button>
                </Box>
            }
        >
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexGrow: 1, minHeight: tableHeight, width: '100%' }}>
                    <DataGrid
                        rows={filteredMattresses} // Use filtered data
                        columns={columns}
                        pageSize={25}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        pagination
                        checkboxSelection
                        disableRowSelectionOnClick
                        onRowSelectionModelChange={handleSelectionChange} // ✅ Correct event listener
                        rowSelectionModel={selectedMattresses.map(m => m.mattress)}
                        getRowId={(row) => row.mattress}
                        disableSelectionOnClick
                        sx={{
                            '& .MuiTablePagination-root': {
                                overflow: 'hidden',
                                minHeight: '52px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                            }
                        }}
                        components={{
                            Pagination: CustomPagination
                        }}
                    />
                </Box>
            )}
        </MainCard>
    );
    
};

export default MattressTable;
