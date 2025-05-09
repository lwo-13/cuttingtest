import React, { useState } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import { Typography, Button, Card, CardContent, Grid, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField,
  Select, MenuItem, InputLabel, FormControl, Snackbar, Alert, CircularProgress
} from '@mui/material';

// project imports
import MainCard from '../../ui-component/cards/MainCard';

//==============================|| IMPORT PAGE ||==============================//

const CombinedImports = () => {
  const [selectedXML, setSelectedXML] = useState(null);
  const [selectedXMLs, setSelectedXMLs] = useState([]);
  const [markerInfo, setMarkerInfo] = useState([]);
  const [batchMarkerInfo, setBatchMarkerInfo] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [hasEdits, setHasEdits] = useState(false);
  const [creationType, setCreationType] = useState('');
  const [batchImportResults, setBatchImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileForEdit, setSelectedFileForEdit] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedFiles, setEditedFiles] = useState(new Set());

  const [openError, setOpenError] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCloseError = () => setOpenError(false);
  const handleCloseSuccess = () => setOpenSuccess(false);

  // Handle Single XML File Selection
  const handleXMLChange = (event) => {
    setSelectedXML(event.target.files[0]);
  };

  // Handle Multiple XML Files Selection
  const handleMultipleXMLChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedXMLs(files);

    // Clear any previous marker info and edited files
    setBatchMarkerInfo({});
    setEditedFiles(new Set());
  };

  // Open batch import dialog
  const handleOpenBatchDialog = () => {
    if (!selectedXMLs.length) {
      alert('Please select XML files first.');
      return;
    }
    setBatchDialogOpen(true);
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
      const extractedData = newVariants.map((variant) => {
        let fullStyle = variant.getElementsByTagName("Model")[0]?.getAttribute("Value") || "N/A";

        // ✅ Extract clean style
        const suffixesToExclude = ['NEW', 'MODIF'];
        const styleParts = fullStyle.split('_');

        // Remove known suffix if present
        if (suffixesToExclude.includes(styleParts.at(-1))) {
          styleParts.pop();
        }

        // Remove season (first part)
        styleParts.shift();

        // Remove second part if there's still more than one part
        if (styleParts.length > 1) {
          styleParts.shift();
        }

        const style = styleParts.join('_');

        // Extract rotation180 value
        const rotation180Elem = variant.getElementsByTagName("Rotation180")[0];
        const rotation180 = rotation180Elem ?
          (rotation180Elem.getAttribute("Value") === "True") : false;

        return {
          style,  // Use the trimmed style
          size: variant.getElementsByTagName("Size")[0]?.getAttribute("Value") || "N/A",
          qty: variant.getElementsByTagName("Quantity")[0]?.getAttribute("Value") || "0",
          rotation180: rotation180
        };
      });

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
      const response = await axios.post("/markers/import_marker", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccessMessage(`✅ ${response.data.msg}`);
        setOpenSuccess(true);
        setTimeout(() => handleDialogClose(), 2000);
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

  const handleBatchDialogClose = () => {
    setBatchDialogOpen(false);
    setBatchImportResults(null);
    setSelectedXMLs([]);
    setCreationType('');
    setBatchMarkerInfo({});
    setEditedFiles(new Set());
  };

  // Parse XML file and extract marker content
  const parseXMLFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const xmlString = e.target.result;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlString, "text/xml");

          // Extract data from <NewVariant> elements inside <MarkerContent>
          const markerContent = xmlDoc.querySelector("MarkerContent");
          if (!markerContent) {
            resolve([]);
            return;
          }

          const newVariants = Array.from(markerContent.getElementsByTagName("NewVariant"));
          const extractedData = newVariants.map((variant) => {
            let fullStyle = variant.getElementsByTagName("Model")[0]?.getAttribute("Value") || "N/A";

            // ✅ Extract clean style
            const suffixesToExclude = ['NEW', 'MODIF'];
            const styleParts = fullStyle.split('_');

            // Remove known suffix if present
            if (suffixesToExclude.includes(styleParts.at(-1))) {
              styleParts.pop();
            }

            // Remove season (first part)
            styleParts.shift();

            // Remove second part if there's still more than one part
            if (styleParts.length > 1) {
              styleParts.shift();
            }

            const style = styleParts.join('_');

            // Extract rotation180 value
            const rotation180Elem = variant.getElementsByTagName("Rotation180")[0];
            const rotation180 = rotation180Elem ?
              (rotation180Elem.getAttribute("Value") === "True") : false;

            return {
              style,  // Use the trimmed style
              size: variant.getElementsByTagName("Size")[0]?.getAttribute("Value") || "N/A",
              qty: variant.getElementsByTagName("Quantity")[0]?.getAttribute("Value") || "0",
              rotation180: rotation180
            };
          });

          resolve(extractedData);
        } catch (error) {
          console.error("Error parsing XML:", error);
          resolve([]);
        }
      };

      reader.onerror = () => {
        console.error("Error reading file");
        resolve([]);
      };

      reader.readAsText(file);
    });
  };

  // Open edit dialog for a specific file
  const handleOpenEditDialog = async (file) => {
    if (!file) return;

    setSelectedFileForEdit(file);

    // Check if we already parsed this file
    if (!batchMarkerInfo[file.name]) {
      const markerData = await parseXMLFile(file);
      setBatchMarkerInfo(prev => ({
        ...prev,
        [file.name]: markerData
      }));
    }

    setEditDialogOpen(true);
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    // Add the file to the edited files set
    if (selectedFileForEdit) {
      setEditedFiles(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedFileForEdit.name);
        return newSet;
      });
    }

    setEditDialogOpen(false);
    setSelectedFileForEdit(null);
  };

  // Summarize marker info for a specific file
  const summarizeBatchMarkerInfo = (fileName) => {
    if (!batchMarkerInfo[fileName] || !batchMarkerInfo[fileName].length) {
      return [];
    }

    const summary = {};
    batchMarkerInfo[fileName].forEach(({ style, size, qty }) => {
      const key = `${style}-${size}`;
      if (!summary[key]) {
        summary[key] = { style, size, qty: 0 };
      }
      summary[key].qty += Number(qty); // Force numeric addition
    });
    return Object.values(summary);
  };

  // Handle field change in batch edit mode
  const handleBatchFieldChange = (fileName, summaryIndex, field, value) => {
    if (!batchMarkerInfo[fileName]) return;

    const summarizedData = summarizeBatchMarkerInfo(fileName);
    const { style: oldStyle, size: oldSize } = summarizedData[summaryIndex];

    const updatedMarkerInfo = batchMarkerInfo[fileName].map((line) => {
      if (line.style === oldStyle && line.size === oldSize) {
        return { ...line, [field]: value };  // Apply the change to RAW data
      }
      return line;
    });

    setBatchMarkerInfo(prev => ({
      ...prev,
      [fileName]: updatedMarkerInfo
    }));
  };

  // Perform batch import of multiple markers
  const handleBatchImport = async () => {
    if (!selectedXMLs.length) {
      alert('Please select XML files first.');
      return;
    }

    if (!creationType) {
      alert('Please select a creation type.');
      return;
    }

    setIsImporting(true);

    const formData = new FormData();
    selectedXMLs.forEach(file => {
      formData.append('files[]', file);
    });
    formData.append('creationType', creationType);

    // Add marker content data if available
    if (Object.keys(batchMarkerInfo).length > 0) {
      formData.append('markerContentData', JSON.stringify(batchMarkerInfo));
    }

    try {
      const response = await axios.post('/markers/batch_import_markers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setBatchImportResults(response.data);

      const { summary } = response.data;
      if (summary.success > 0) {
        if (summary.failure > 0) {
          setSuccessMessage(`✅ Imported ${summary.success} markers successfully. ${summary.failure} markers failed.`);
        } else {
          setSuccessMessage(`✅ All ${summary.success} markers imported successfully!`);
        }
        setOpenSuccess(true);
      } else {
        setErrorMessage(`❌ Failed to import any markers. Please check the error details.`);
        setOpenError(true);
      }
    } catch (error) {
      setErrorMessage(`❌ Batch import failed: ${error.response?.data?.msg || error.message}`);
      setOpenError(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <MainCard title="Imports">
      <Grid container spacing={2} justifyContent="center">
        {/* Single XML Import Section */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" style={{ textAlign: 'center', width: '100%', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Import Single Marker
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

        {/* Multiple XML Import Section */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" style={{ textAlign: 'center', width: '100%', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Batch Import Markers
              </Typography>

              <input
                type="file"
                accept=".xml"
                id="multiple-xml-file-input"
                onChange={handleMultipleXMLChange}
                style={{ display: 'none' }}
                multiple
                key={selectedXMLs.length > 0 ? 'files-selected' : 'no-files'}
              />

              <Button
                variant="outlined"
                component="label"
                htmlFor="multiple-xml-file-input"
                style={{ marginTop: '8px' }}
              >
                Choose Files
              </Button>

              <Box mt={2}>
                <Typography variant="body2" align="center">
                  {selectedXMLs.length > 0
                    ? `${selectedXMLs.length} file${selectedXMLs.length > 1 ? 's' : ''} selected`
                    : 'No files chosen'}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenBatchDialog}
                disabled={selectedXMLs.length === 0}
                style={{ marginTop: '8px' }}
              >
                Import Batch
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

      {/* Batch Import Dialog */}
      <Dialog open={batchDialogOpen} onClose={handleBatchDialogClose} fullWidth maxWidth="md">
        <DialogTitle>Batch Import Markers</DialogTitle>
        <DialogContent>
          {/* Creation Type Dropdown */}
          <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
            <InputLabel>Creation Type</InputLabel>
            <Select
              value={creationType}
              onChange={(e) => setCreationType(e.target.value)}
              label="Creation Type"
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="">Select Creation Type</MenuItem>
              <MenuItem value="Cloud">Cloud</MenuItem>
              <MenuItem value="Cloud Urgent">Cloud Urgent</MenuItem>
              <MenuItem value="Local">Local</MenuItem>
              <MenuItem value="Manual">Manual</MenuItem>
            </Select>
          </FormControl>

          {/* Files with import results */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Files to be imported ({selectedXMLs.length}):
              </Typography>

              {batchImportResults && (
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Typography>
                    <strong>Total:</strong> {batchImportResults.summary.total}
                  </Typography>
                  <Typography color="success.main">
                    <strong>Success:</strong> {batchImportResults.summary.success}
                  </Typography>
                  <Typography color="error.main">
                    <strong>Failed:</strong> {batchImportResults.summary.failure}
                  </Typography>
                </Box>
              )}
            </Box>

            <TableContainer component={Paper} sx={{ height: 350 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="5%"><strong>#</strong></TableCell>
                    <TableCell width="35%"><strong>Filename</strong></TableCell>
                    <TableCell width="45%"><strong>Status / Message</strong></TableCell>
                    <TableCell width="15%"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedXMLs.map((file, index) => {
                    // Find the corresponding result if available
                    const result = batchImportResults?.results.find(r => r.filename === file.name);
                    const isSuccess = result?.success;
                    const message = result?.msg;
                    const hasMarkerInfo = batchMarkerInfo[file.name] && batchMarkerInfo[file.name].length > 0;

                    return (
                      <TableRow
                        key={index}
                        sx={{
                          bgcolor: result ? (isSuccess ? 'success.light' : 'error.light') : 'inherit'
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{file.name}</TableCell>
                        <TableCell>
                          {result ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isSuccess ? (
                                <>
                                  <span>✅</span>
                                  <Typography variant="body2" color="success.main">Success</Typography>
                                </>
                              ) : (
                                <>
                                  <span>❌</span>
                                  <Typography variant="body2" color="error.main">{message}</Typography>
                                </>
                              )}
                            </Box>
                          ) : hasMarkerInfo ? (
                            <Typography variant="body2" color="info.main">
                              <span>ℹ</span> Marker content edited
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {!batchImportResults && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleOpenEditDialog(file)}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Edit Dialog for Marker Content */}
          <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
            <DialogTitle>
              Edit Marker Content: {selectedFileForEdit?.name}
            </DialogTitle>
            <DialogContent>
              {selectedFileForEdit && batchMarkerInfo[selectedFileForEdit.name] ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Summarized by Style and Size
                  </Typography>
                  <TableContainer component={Paper} sx={{ height: 250 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%"><strong>Style</strong></TableCell>
                          <TableCell width="30%"><strong>Size</strong></TableCell>
                          <TableCell width="30%"><strong>Quantity</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summarizeBatchMarkerInfo(selectedFileForEdit.name).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <TextField
                                value={item.style}
                                onChange={(e) => handleBatchFieldChange(selectedFileForEdit.name, index, 'style', e.target.value)}
                                variant="standard"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={item.size}
                                onChange={(e) => handleBatchFieldChange(selectedFileForEdit.name, index, 'size', e.target.value)}
                                variant="standard"
                                fullWidth
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


                </Box>
              ) : (
                <Typography>Loading marker content...</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog} color="primary">
                Done
              </Button>
            </DialogActions>
          </Dialog>
        </DialogContent>

        {!batchImportResults && editedFiles.size !== selectedXMLs.length && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="caption" color="error">
              Please edit all files before importing ({editedFiles.size}/{selectedXMLs.length} edited).
            </Typography>
          </Box>
        )}

        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          {!batchImportResults ? (
            <Button
              onClick={handleBatchImport}
              color="primary"
              variant="contained"
              disabled={isImporting || !creationType || selectedXMLs.length === 0 || editedFiles.size !== selectedXMLs.length}
              startIcon={isImporting ? <CircularProgress size={20} /> : null}
            >
              {isImporting ? 'Importing...' : 'Import All'}
            </Button>
          ) : null}

          <Button
            onClick={handleBatchDialogClose}
            color="secondary"
            variant="outlined"
          >
            {batchImportResults ? 'Close' : 'Cancel'}
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
