import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const StyleCommentCard = ({ selectedStyle, onDataChange }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [originalComment, setOriginalComment] = useState('');
  const [maxPiecesInPackage, setMaxPiecesInPackage] = useState('');
  const [originalMaxPieces, setOriginalMaxPieces] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // Track changes and notify parent component
  useEffect(() => {
    // Only check for changes if we're not currently loading and original values have been set
    if (!loading && originalComment !== undefined && originalMaxPieces !== undefined) {
      const hasChanges = comment !== originalComment || maxPiecesInPackage !== originalMaxPieces;
      setHasUnsavedChanges(hasChanges);

      // Notify parent component about data changes
      if (onDataChange) {
        onDataChange({
          comment: comment.trim(),
          maxPiecesInPackage: maxPiecesInPackage ? parseInt(maxPiecesInPackage) : null,
          hasUnsavedChanges: hasChanges,
          selectedStyle
        });
      }
    }
  }, [comment, originalComment, maxPiecesInPackage, originalMaxPieces, selectedStyle, onDataChange, loading]);

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
    } finally {
      setLoading(false);
    }
  };

  // Expose save function to parent component
  const saveStyleData = async () => {
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
        return { success: true };
      } else {
        return { success: false, error: 'Error saving style data' };
      }
    } catch (error) {
      console.error('Error saving style data:', error);
      return { success: false, error: error.message || 'Error saving style data' };
    }
  };

  // Expose save function to parent via callback
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        comment: comment.trim(),
        maxPiecesInPackage: maxPiecesInPackage ? parseInt(maxPiecesInPackage) : null,
        hasUnsavedChanges,
        selectedStyle,
        saveFunction: saveStyleData
      });
    }
  }, [comment, maxPiecesInPackage, hasUnsavedChanges, selectedStyle]);



  const handleMaxPiecesChange = (e) => {
    const value = e.target.value;
    // Allow only positive integers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setMaxPiecesInPackage(value);
    }
  };

  return (
    <MainCard
        sx={{ width: '100%', height: '100%' }}
        title={
          <Box display="flex" alignItems="center" gap={1}>
            {t('orderPlanning.styleComment', 'Style Comment')}
            {selectedStyle && (
              <Typography variant="caption" color="text.secondary">
                ({selectedStyle})
              </Typography>
            )}
          </Box>
        }
      >
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box>
            <Grid container spacing={2}>
              {/* Style Comment - 3/4 width */}
              <Grid item xs={12} md={9}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={15}
                  variant="outlined"
                  label={t('orderPlanning.styleComment', 'Style Comment')}
                  placeholder={t('orderPlanning.styleCommentPlaceholder', 'Add a comment for style {{style}}...', { style: selectedStyle })}
                  value={comment || ''}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={loading}
                  InputLabelProps={{
                    style: { fontWeight: 'normal' }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      minHeight: '120px'
                    },
                    '& .MuiInputBase-input': {
                      fontWeight: 'normal'
                    }
                  }}
                />
              </Grid>

              {/* Settings Column - 1/4 width */}
              <Grid item xs={12} md={3}>
                <Box display="flex" flexDirection="column" gap={2} height="100%">
                  {/* Max Pieces in Package */}
                  <TextField
                    fullWidth
                    label={t('orderPlanning.maxPiecesInPackage', 'Max Pieces in Package')}
                    variant="outlined"
                    value={maxPiecesInPackage}
                    onChange={handleMaxPiecesChange}
                    disabled={loading}
                    type="number"
                    inputProps={{ min: 1 }}
                    InputLabelProps={{
                      style: { fontWeight: 'normal' }
                    }}
                    sx={{
                      marginTop: '2mm',
                      '& .MuiInputBase-input': {
                        fontWeight: 'normal'
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
    </MainCard>
  );
};

export default StyleCommentCard;
