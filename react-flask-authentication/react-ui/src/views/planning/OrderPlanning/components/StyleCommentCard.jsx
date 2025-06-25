import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  Button,
  Grid
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const StyleCommentCard = ({ selectedStyle }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [originalComment, setOriginalComment] = useState('');
  const [maxPiecesInPackage, setMaxPiecesInPackage] = useState('');
  const [originalMaxPieces, setOriginalMaxPieces] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load existing comment and settings when style changes
  useEffect(() => {
    if (selectedStyle) {
      loadStyleData();
    } else {
      setComment('');
      setOriginalComment('');
      setMaxPiecesInPackage('');
      setOriginalMaxPieces('');
      setHasUnsavedChanges(false);
    }
  }, [selectedStyle]);

  // Track changes for internal state management
  useEffect(() => {
    const hasChanges = comment !== originalComment || maxPiecesInPackage !== originalMaxPieces;
    setHasUnsavedChanges(hasChanges);
  }, [comment, originalComment, maxPiecesInPackage, originalMaxPieces]);

  const loadStyleData = async () => {
    setLoading(true);
    try {
      const [commentResponse, settingsResponse] = await Promise.all([
        axios.get(`/orders/style_comments/get/${selectedStyle}`),
        axios.get(`/orders/style_settings/get/${selectedStyle}`)
      ]);

      if (commentResponse.data.success) {
        const commentText = commentResponse.data.data?.comment_text || '';
        setComment(commentText);
        setOriginalComment(commentText);
      }

      if (settingsResponse.data.success) {
        const maxPieces = settingsResponse.data.data?.max_pieces_in_package || '';
        setMaxPiecesInPackage(maxPieces.toString());
        setOriginalMaxPieces(maxPieces.toString());
      }
    } catch (error) {
      console.error('Error loading style data:', error);
      showSnackbar('Error loading style data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [commentResponse, settingsResponse] = await Promise.all([
        axios.post('/orders/style_comments/save', {
          style: selectedStyle,
          comment_text: comment.trim()
        }),
        axios.post('/orders/style_settings/save', {
          style: selectedStyle,
          max_pieces_in_package: maxPiecesInPackage ? parseInt(maxPiecesInPackage) : null
        })
      ]);

      if (commentResponse.data.success && settingsResponse.data.success) {
        setOriginalComment(comment);
        setOriginalMaxPieces(maxPiecesInPackage);
        setHasUnsavedChanges(false);
        showSnackbar('Style data saved successfully', 'success');
      } else {
        showSnackbar('Error saving style data', 'error');
      }
    } catch (error) {
      console.error('Error saving style data:', error);
      showSnackbar('Error saving style data', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };



  const handleMaxPiecesChange = (e) => {
    const value = e.target.value;
    // Allow only positive integers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setMaxPiecesInPackage(value);
    }
  };

  return (
    <>
      <MainCard
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              size="small"
              onClick={toggleCollapse}
              sx={{
                color: 'text.secondary',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ?
                <IconChevronDown stroke={1.5} size="1rem" /> :
                <IconChevronUp stroke={1.5} size="1rem" />
              }
            </IconButton>
            {t('orderPlanning.styleComment', 'Style Comment')}
            {selectedStyle && (
              <Typography variant="caption" color="text.secondary">
                ({selectedStyle})
              </Typography>
            )}
          </Box>
        }
      >
        <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2}>
                {/* Style Comment */}
                <Grid item xs={12} md={8}>
                  <TextField
                    multiline
                    minRows={1}
                    maxRows={10}
                    variant="outlined"
                    label={t('orderPlanning.styleComment', 'Style Comment')}
                    placeholder={t('orderPlanning.styleCommentPlaceholder', 'Add a comment for style {{style}}...', { style: selectedStyle })}
                    value={comment || ''}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={loading || saving}
                    sx={{
                      width: 'fit-content',
                      minWidth: '300px',
                      maxWidth: '100%',
                      '& .MuiInputBase-root': {
                        width: 'auto',
                        minWidth: '300px'
                      }
                    }}
                  />
                </Grid>

                {/* Settings Column */}
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" gap={2} height="100%">
                    {/* Max Pieces in Package */}
                    <TextField
                      label={t('orderPlanning.maxPiecesInPackage', 'Max Pieces in Package')}
                      variant="outlined"
                      value={maxPiecesInPackage}
                      onChange={handleMaxPiecesChange}
                      disabled={loading || saving}
                      type="number"
                      inputProps={{ min: 1 }}
                      sx={{ width: 200, marginTop: '2mm' }}
                    />

                    {/* Save Button */}
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges || saving || !selectedStyle}
                      sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                    >
                      {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Collapse>
      </MainCard>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default StyleCommentCard;
