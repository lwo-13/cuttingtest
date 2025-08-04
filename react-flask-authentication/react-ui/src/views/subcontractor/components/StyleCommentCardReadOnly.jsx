import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, CircularProgress, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'utils/axiosInstance';
import MainCard from 'ui-component/cards/MainCard';

const StyleCommentCardReadOnly = ({ selectedStyle }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [maxPiecesInPackage, setMaxPiecesInPackage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing comment and settings when style changes
  useEffect(() => {
    if (selectedStyle) {
      loadStyleData();
    } else {
      setComment('');
      setMaxPiecesInPackage('');
    }
  }, [selectedStyle]);

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
      }

      if (settingsResponse.data.success) {
        const maxPieces = settingsResponse.data.data?.max_pieces_in_package || '';
        setMaxPiecesInPackage(maxPieces.toString());
      }
    } catch (error) {
      console.error('Error loading style data:', error);
    } finally {
      setLoading(false);
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
                value={comment || ''}
                InputProps={{
                  readOnly: true,
                }}
                InputLabelProps={{
                  style: { fontWeight: 'normal' }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    minHeight: '120px',
                    backgroundColor: '#f5f5f5'
                  },
                  '& .MuiInputBase-input': {
                    cursor: 'default'
                  }
                }}
                placeholder={comment ? '' : t('subcontractor.noStyleComment', 'No style comment available')}
              />
            </Grid>

            {/* Max Pieces in Package - 1/4 width */}
            <Grid item xs={12} md={3}>
              <Box display="flex" flexDirection="column" height="100%">
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('orderPlanning.maxPiecesInPackage', 'Max Pieces in Package')}
                  value={maxPiecesInPackage || ''}
                  InputProps={{
                    readOnly: true,
                  }}
                  InputLabelProps={{
                    style: { fontWeight: 'normal' }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#f5f5f5'
                    },
                    '& .MuiInputBase-input': {
                      cursor: 'default'
                    }
                  }}
                  placeholder={maxPiecesInPackage ? '' : t('common.notSet', 'Not set')}
                />

                {/* Read-only indicator */}
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('subcontractor.readOnlyInfo', 'Read-only view')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </MainCard>
  );
};

export default StyleCommentCardReadOnly;
