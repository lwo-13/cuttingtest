import React, { useState, useEffect } from 'react';
import { Box, TextField, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'utils/axiosInstance';
import MainCard from 'ui-component/cards/MainCard';

const OrderCommentCardReadOnly = ({ selectedOrder, selectedCombination }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing order comment when order or combination changes
  useEffect(() => {
    if (selectedOrder?.id && selectedCombination?.combination_id) {
      loadOrderComment();
    } else {
      setComment('');
    }
  }, [selectedOrder?.id, selectedCombination?.combination_id]);

  const loadOrderComment = async () => {
    setLoading(true);
    try {
      const combinationId = selectedCombination?.combination_id;
      const url = combinationId
        ? `/orders/comments/get/${selectedOrder.id}/${combinationId}`
        : `/orders/comments/get/${selectedOrder.id}`;

      const response = await axios.get(url);
      if (response.data.success) {
        const commentText = response.data.data?.comment_text || '';
        setComment(commentText);
      }
    } catch (error) {
      console.error('Error loading comment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only render if there's actual comment content
  if (!selectedOrder || !selectedCombination || (!comment?.trim() && !loading)) {
    return null;
  }

  return (
    <MainCard title={t('orderPlanning.orderComment', 'Order Comment')}>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
          <Box ml={2}>Loading comment...</Box>
        </Box>
      ) : (
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={15}
          variant="outlined"
          value={comment || ''}
          InputProps={{
            readOnly: true,
          }}
          sx={{
            '& .MuiInputBase-root': {
              minHeight: '120px',
              backgroundColor: '#f5f5f5'
            },
            '& .MuiInputBase-input': {
              cursor: 'default',
              fontWeight: 'normal'
            }
          }}
          placeholder={comment ? '' : `No order comment available for combination ${selectedCombination?.combination_id}`}
        />
      )}
    </MainCard>
  );
};

export default OrderCommentCardReadOnly;
