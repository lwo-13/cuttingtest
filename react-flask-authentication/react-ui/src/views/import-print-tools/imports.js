import React, { useState } from 'react';
import axios from 'axios';

// material-ui
import { Typography, Button, Card, CardContent, Grid, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField,
  Select, MenuItem, InputLabel, FormControl, Snackbar, Alert
} from '@mui/material';

// project imports
import MainCard from '../../ui-component/cards/MainCard';

//==============================|| IMPORT PAGE ||==============================//

const CombinedImports = () => {
  const [selectedXML, setSelectedXML] = useState(null);
  const [markerInfo, setMarkerInfo] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [hasEdits, setHasEdits] = useState(false);
  const [creationType, setCreationType] = useState('');

  const [openError, setOpenError] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCloseError = () => setOpenError(false);
  const handleCloseSuccess = () => setOpenSuccess(false);

  // Handle XML File Selection
  const handleXMLChange = (event) => {
    setSelectedXML(event.target.files[0]);
  };

  // Parse XML and Open Dialog
  const handleOpenDialog = () => {
    if (!selectedXML) {
      alert('Please select an XML file first.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const xmlString = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // Extract data from <NewVariant> elements inside <MarkerContent>
      const newVariants = Array.from(xmlDoc.getElementsByTagName("NewVariant"));
      const extractedData = newVariants.map((variant) => ({
        style: variant.getElementsByTagName("Model")[0]?.getAttribute("Value") || "N/A", // Extract Model as Style
        size: variant.getElementsByTagName("Size")[0]?.getAttribute("Value") || "N/A",
        qty: variant.getElementsByTagName("Quantity")[0]?.getAttribute("Value") || "0"
      }));

      setMarkerInfo(extractedData);
      setDialogOpen(true);
    };

    reader.readAsText(selectedXML);
  };

  // Handle updates to editable fields
  const handleFieldChange = (summaryIndex, field, value, isSummary = false) => {
    if (isSummary) {
      const summarizedData = summarizeMarkerInfo();
      const { style: oldStyle, size: oldSize } = summarizedData[summaryIndex];
  
      const updatedMarkerInfo = markerInfo.map((line) => {
        if (line.style === oldStyle && line.size === oldSize) {
          return { ...line, [field]: value };  // Apply the change to RAW data
        }
        return line;
      });
  
      setMarkerInfo(updatedMarkerInfo);
    } else {
      // Optional raw line edit (if you ever allow raw editing)
      const updatedMarkerInfo = [...markerInfo];
      updatedMarkerInfo[summaryIndex][field] = value;
      setMarkerInfo(updatedMarkerInfo);
    }
    setHasEdits(true);
  };
  

  // Handle Creation Type Change
  const handleCreationTypeChange = (event) => {
    setCreationType(event.target.value);
  };

  // Display summarized table but send RAW data
  const summarizeMarkerInfo = () => {
    const summary = {};
    markerInfo.forEach(({ style, size, qty }) => {
      const key = `${style}-${size}`;
      if (!summary[key]) {
        summary[key] = { style, size, qty: 0 };
      }
      summary[key].qty += Number(qty); // Force numeric addition
    });
    return Object.values(summary);
  };

  // Perform the actual import when clicking "Import" inside the dialog
  const handleXMLImport = async () => {
    if (!selectedXML) return alert('Please select an XML file first.');

    const formData = new FormData();
    formData.append("file", selectedXML);
    formData.append("updatedData", JSON.stringify(markerInfo)); // RAW Data
    formData.append("hasEdits", hasEdits);
    formData.append("creationType", creationType);

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/markers/import_marker", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccessMessage(`✅ ${response.data.msg}`);
        setOpenSuccess(true);
        setTimeout(() => handleDialogClose(), 3000);
      } else {
        setErrorMessage(`⚠️ ${response.data.msg}`);
        setOpenError(true);
      }
    } catch (error) {
      setErrorMessage(`❌ Upload failed: ${error.response?.data?.msg || error.message}`);
      setOpenError(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setMarkerInfo([]);
    setImportStatus("");
    setHasEdits(false); // Reset edit flag
    setSelectedXML(null);
    setCreationType('');
  };

  return (
    <MainCard title="Imports">
      <Grid container spacing={2} justifyContent="center">
        {/* XML Import Section */}
        <Grid item xs={12}>
          <Card variant="outlined" style={{ textAlign: 'center', width: '100%'  }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Import Marker (<strong>XML</strong> file)
              </Typography>

              <input
                type="file"
                accept=".xml"
                id="xml-file-input"
                onChange={handleXMLChange}
                style={{ display: 'none' }}
                key={selectedXML ? selectedXML.name : ''} 
              />

              <Button
                variant="outlined"
                component="label"
                htmlFor="xml-file-input"
                style={{ marginTop: '8px' }}
              >
                Choose File
              </Button>

              <Box mt={2}>
                <Typography variant="body2" align="center">
                  {selectedXML ? `${selectedXML.name}` : 'No file chosen'}
                </Typography>
              </Box>

              {/* ✅ This button now opens the dialog after parsing XML */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenDialog}
                disabled={!selectedXML}
                style={{ marginTop: '8px' }}
              >
                Import
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog with Editable Table and Import Button */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogContent>
          {importStatus && (
            <Typography color={importStatus.includes('✅') ? 'green' : 'red'}>
              {importStatus}
            </Typography>
          )}
          {/* Creation Type Dropdown */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Select
              value={creationType}
              onChange={(e) => setCreationType(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="">
                <em>Select Creation Type</em>
              </MenuItem>
              <MenuItem value="Cloud">Cloud</MenuItem>
              <MenuItem value="Cloud Urgent">Cloud Urgent</MenuItem>
              <MenuItem value="Local">Local</MenuItem>
              <MenuItem value="Manual">Manual</MenuItem>
            </Select>
          </FormControl>

          {markerInfo.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '40%' }}><strong>Style</strong></TableCell>
                    <TableCell sx={{ width: '30%' }}><strong>Size</strong></TableCell>
                    <TableCell sx={{ width: '30%' }}><strong>Quantity</strong></TableCell>
                  </TableRow>
                </TableHead>
                  <TableBody>
                    {summarizeMarkerInfo().map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            value={item.style}
                            onChange={(e) => handleFieldChange(index, 'style', e.target.value, true)} // true means summarized edit
                            variant="standard"
                            sx={{ width: '150px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={item.size}
                            onChange={(e) => handleFieldChange(index, 'size', e.target.value, true)}
                            variant="standard"
                            sx={{ width: '80px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography>{item.qty}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ mt: 2 }}>No data extracted yet.</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', mb: 2  }}>
          {/* Actual Import happens here */}
          <Button
            onClick={handleXMLImport}
            color="primary"
            variant="contained"
            sx={{ mx: 1 }}
            disabled={!creationType || importStatus.includes("already exists")}
          >
            Import
          </Button>

          <Button
            onClick={handleDialogClose}
            color="secondary"
            variant="outlined"
            sx={{ mx: 1 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Success Snackbar */}
      <Snackbar 
        open={openSuccess} 
        autoHideDuration={5000} 
        onClose={handleCloseSuccess} 
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* ❌ Error Snackbar */}
      <Snackbar 
        open={openError} 
        autoHideDuration={5000} 
        onClose={handleCloseError} 
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

    </MainCard>
  );
};

export default CombinedImports;
