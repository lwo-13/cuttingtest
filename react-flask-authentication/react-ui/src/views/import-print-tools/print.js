import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Checkbox } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Print = () => {
    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPDF, setLoadingPDF] = useState(false);  // New state for loading PDF
    const [orderFilter, setOrderFilter] = useState('');
    const [mattressFilter, setMattressFilter] = useState('');
    const [selectedItems, setSelectedItems] = useState({}); // State to track selected items (order + mattress)

    // Fetch the mattress list (without details)
    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/mattress/all') // API route to get all mattresses
            .then(response => {
                if (response.data.success) {
                    setMattresses(response.data.data);
                } else {
                    console.error("Failed to fetch mattresses");
                }
            })
            .catch(error => {
                console.error("Error fetching mattress data:", error);
            })
            .finally(() => setLoading(false));
    }, []);

    // Generate a unique key for each item (order + mattress)
    const getUniqueKey = (order, mattress) => `${order}-${mattress}`;

    // Handle checkbox selection
    const handleSelectItem = (order, mattress) => {
        const key = getUniqueKey(order, mattress);
        setSelectedItems((prevSelected) => ({
            ...prevSelected,
            [key]: !prevSelected[key], // Toggle selection
        }));
    };

    // Generate PDF function
const generatePDF = () => {
    setLoadingPDF(true);

    axios.get('http://127.0.0.1:5000/api/mattress/all_with_details')
        .then(response => {
            if (response.data.success) {
                const mattressesWithDetails = response.data.data;
                const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

                // Title
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.text("Mattress Report", 105, 15, { align: "center" });

                // Add separator line
                doc.setLineWidth(0.5);
                doc.line(10, 20, 200, 20);

                // Filter mattresses based on selection
                const filteredMattresses = mattresses.filter(mattress =>
                    mattress.order_commessa.includes(orderFilter) &&
                    mattress.mattress.includes(mattressFilter) &&
                    selectedItems[getUniqueKey(mattress.order_commessa, mattress.mattress)]
                );

                // Table Data
                const tableData = filteredMattresses.map((mattress, index) => [
                    index + 1,
                    mattress.mattress,
                    mattress.order_commessa,
                    mattress.fabric_type,
                    mattress.fabric_code,
                    mattress.fabric_color,
                    mattress.dye_lot,
                    mattress.item_type,
                    mattress.spreading_method,
                    mattress.created_at
                ]);

                    // Mattress Table (Top Table)
autoTable(doc, {
    startY: 25,
    head: [[
        "#", "Mattress", "Order", "Fabric Type", "Fabric Code",
        "Color", "Dye Lot", "Item Type", "Spreading", "Created At"
    ]],
    body: tableData,
    styles: {
        fontSize: 9,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [44, 62, 80],
        lineWidth: 0.5,
        halign: "center",
    },
    headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        cellPadding: 2,
    },
    alternateRowStyles: {
        fillColor: [245, 245, 245],
    },
    columnStyles: {
        0: { cellWidth: 5 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
        8: { cellWidth: 25 },
        9: { cellWidth: 25 },
    },
    margin: { left: (doc.internal.pageSize.width - 200) / 2 }, // Center the table
});
                let yOffset = doc.lastAutoTable.finalY + 10;

                // Loop through each mattress and add details
                filteredMattresses.forEach((mattress) => {
                    const mattressDetails = mattressesWithDetails.find(m => 
                        m.mattress === mattress.mattress && m.order_commessa === mattress.order_commessa
                    );

                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.text(`Mattress: ${mattress.mattress} (${mattress.order_commessa})`, 10, yOffset);
                    yOffset += 6;

                    if (mattressDetails) {
                        doc.setFontSize(10);
                        doc.setFont("helvetica", "normal");

                        // Mattress Details
                        if (mattressDetails.details && mattressDetails.details.length > 0) {
                            autoTable(doc, {
                                startY: yOffset,
                                head: [["Layer", "Planned Consumption", "Actual Consumption"]],
                                body: mattressDetails.details.map(detail => [
                                    detail.layers,
                                    detail.cons_planned,
                                    detail.cons_actual !== null ? detail.cons_actual : "Not Available"
                                ]),
                                styles: { fontSize: 10, cellPadding: 2 },
                                alternateRowStyles: { fillColor: [245, 245, 245] },
                            });
                            yOffset = doc.lastAutoTable.finalY + 10;
                        }

                        // Mattress Markers
                        if (mattressDetails.markers && mattressDetails.markers.length > 0) {
                            doc.setFontSize(11);
                            doc.setFont("helvetica", "bold");
                            doc.text("Markers:", 10, yOffset);
                            yOffset += 6;

                            autoTable(doc, {
                                startY: yOffset,
                                head: [["Marker Name", "Width", "Length"]],
                                body: mattressDetails.markers.map(marker => [
                                    marker.marker_name,
                                    marker.marker_width,
                                    marker.marker_length
                                ]),
                                styles: { fontSize: 10, cellPadding: 2 },
                                alternateRowStyles: { fillColor: [245, 245, 245] },
                            });

                            yOffset = doc.lastAutoTable.finalY + 10;
                        }
                    }
                });

                // Footer
                doc.setFontSize(8);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yOffset, { align: "center" });

                // Save the PDF
                doc.save("mattresses_report_with_details.pdf");
            } else {
                console.error("Failed to fetch mattress details");
            }
        })
        .catch(error => {
            console.error("Error fetching mattress details:", error);
        })
        .finally(() => setLoadingPDF(false));
};




    const filteredMattresses = mattresses.filter(mattress =>
        mattress.order_commessa.includes(orderFilter) &&
        mattress.mattress.includes(mattressFilter)
    );

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Mattress Report</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    label="Filter by Order"
                    variant="outlined"
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                />
                <TextField
                    label="Filter by Mattress"
                    variant="outlined"
                    value={mattressFilter}
                    onChange={(e) => setMattressFilter(e.target.value)}
                />
                <Button variant="contained" color="primary" onClick={generatePDF} disabled={loadingPDF}>
                    {loadingPDF ? "Generating PDF..." : "Generate PDF"}
                </Button>
            </Box>
            {loading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Select</TableCell>
                                <TableCell>#</TableCell>
                                <TableCell>Mattress</TableCell>
                                <TableCell>Order</TableCell>
                                <TableCell>Fabric Type</TableCell>
                                <TableCell>Fabric Code</TableCell>
                                <TableCell>Color</TableCell>
                                <TableCell>Dye Lot</TableCell>
                                <TableCell>Item Type</TableCell>
                                <TableCell>Spreading</TableCell>
                                <TableCell>Created At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredMattresses.map((mattress, index) => {
                                const uniqueKey = getUniqueKey(mattress.order_commessa, mattress.mattress);
                                return (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Checkbox
                                                checked={!!selectedItems[uniqueKey]} // Check if item is selected
                                                onChange={() => handleSelectItem(mattress.order_commessa, mattress.mattress)} // Toggle selection
                                            />
                                        </TableCell>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{mattress.mattress}</TableCell>
                                        <TableCell>{mattress.order_commessa}</TableCell>
                                        <TableCell>{mattress.fabric_type}</TableCell>
                                        <TableCell>{mattress.fabric_code}</TableCell>
                                        <TableCell>{mattress.fabric_color}</TableCell>
                                        <TableCell>{mattress.dye_lot}</TableCell>
                                        <TableCell>{mattress.item_type}</TableCell>
                                        <TableCell>{mattress.spreading_method}</TableCell>
                                        <TableCell>{mattress.created_at}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};
export default Print; 