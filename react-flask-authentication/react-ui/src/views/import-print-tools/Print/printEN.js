import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import axios from 'utils/axiosInstance';


// Export the function so it can be reused
const printMattressEN = async (selectedMattresses, fetchMattresses) => {
    if (!selectedMattresses || selectedMattresses.length === 0) {
        alert("No mattress selected. Please select a mattress first.");
        return;
    }

    // Create a single PDF document for all mattresses
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    let isFirstPage = true;
    const mattressIds = []; // Store IDs for batch update

    for (const mattress of selectedMattresses) {
        try {
            // Add new page for each mattress except the first one
            if (!isFirstPage) {
                doc.addPage();
            }
            isFirstPage = false;

            // ✅ Get mattress ID
            const mattressId = mattress.id; // ✅ Now we store the mattress_id for updates
            mattressIds.push(mattressId);

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
                    if (padPrintData.length === 0) {
                        padPrintData = [{ pattern: "NO", padprint_color: "NO" }];
                    }
                } else {
                    console.error("Padprint API returned a non-success response.");
                    padPrintData = [{ pattern: "NO", padprint_color: "NO" }];
                }
            } catch (error) {
                console.error("Error fetching padprint data:", error);
                padPrintData = [{ pattern: "NO", padprint_color: "NO" }];
            }

            // Padprint GetImage Helper
            const getImageBase64WithDimensions = async (url) => {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
            
                    const img = new Image();
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.src = base64;
                    });
            
                    return {
                        base64,
                        width: img.width,
                        height: img.height
                    };
                } catch (err) {
                    console.error("Error loading image with dimensions:", err);
                    return null;
                }
            };
            
            let padPrintImage = null;

            if (padPrintData.length > 0 && padPrintData[0].pattern !== "NO") {
                const pattern = padPrintData[0].pattern.toLowerCase();
                // Use axios instance to get correct base URL (works with VPN proxy)
                const imageUrl = `${axios.defaults.baseURL}padprint/image/${pattern}.jpg`;
                padPrintImage = await getImageBase64WithDimensions(imageUrl);
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

            const boxWidth = columnWidth * 2;
            const boxHeight = 40;
            const boxX = layersStartX;
            const boxY = padPrintTableStartY + 20;

            if (padPrintImage) {
                const { base64, width, height } = padPrintImage;
            
                // Calculate scale to fit within the box
                const scale = Math.min(boxWidth / width, boxHeight / height);
                const imgWidth = width * scale;
                const imgHeight = height * scale;
            
                // Center image in the box
                const offsetX = boxX + (boxWidth - imgWidth) / 2;
                const offsetY = boxY + (boxHeight - imgHeight) / 2;
            
                doc.addImage(base64, 'JPEG', offsetX, offsetY, imgWidth, imgHeight);
            }            

            if (!padPrintImage) {

                // ✅ Positioning for the comment box
                const commentBoxStartY = padPrintTableStartY + 24; // ✅ Adjusted Y position
                const commentBoxHeight = 37;  // ✅ Enough height for writing
                const commentBoxWidth = columnWidth * 2;  // ✅ Same width as Spreading & Cutting tables

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

            }

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

        } catch (error) {
            console.error("Error processing mattress", error);
        }
    }

    // Save single PDF file with all mattresses
    if (selectedMattresses.length === 1) {
        doc.save(`Mattress_Travel_Doc_${selectedMattresses[0].mattress}.pdf`);
    } else {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        doc.save(`Mattress_Travel_Doc_Multiple_${timestamp}.pdf`);
    }

    // Batch update all mattress print statuses
    try {
        for (const mattressId of mattressIds) {
            await axios.put(`/mattress/update_print_travel`, {
                mattress_id: mattressId,
                print_travel: true // ✅ Set as printed
            });
        }
    } catch (error) {
        console.error("Error updating print statuses", error);
    }

    // ✅ Refresh the table to reflect the new status after processing all
    fetchMattresses();
};

export default printMattressEN;