import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Collapse
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const CommentCard = ({ selectedOrder, selectedCombination, onRemove, setUnsavedChanges, onCommentChange, onCommentExists }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [originalComment, setOriginalComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load existing order comment when order or combination changes
  useEffect(() => {
    if (selectedOrder?.id) {
      loadOrderComment();
    } else {
      setComment('');
      setOriginalComment('');
      setHasUnsavedChanges(false);
    }
  }, [selectedOrder?.id, selectedCombination?.combination_id]);

  // Track changes and update parent unsaved state
  useEffect(() => {
    const hasChanges = comment !== originalComment;
    setHasUnsavedChanges(hasChanges);
    // Only set unsaved changes to true if there are comment changes
    // Don't set it to false as that would override other unsaved changes
    if (setUnsavedChanges && hasChanges) {
      setUnsavedChanges(true);
    }
  }, [comment, originalComment, setUnsavedChanges]);

  // Pass comment data to parent (separate effect to avoid conflicts)
  useEffect(() => {
    if (onCommentChange) {
      onCommentChange({
        comment_text: comment.trim(),
        combination_id: selectedCombination?.combination_id,
        hasChanges: hasUnsavedChanges,
        resetState: resetCommentState
      });
    }
  }, [comment, hasUnsavedChanges, selectedCombination?.combination_id]); // Removed onCommentChange from dependencies to prevent infinite loops

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
        setOriginalComment(commentText);

        // Notify parent if there's existing comment data
        if (onCommentExists && commentText.trim()) {
          onCommentExists(true);
        }
      }
    } catch (error) {
      console.error('Error loading comment:', error);
      showSnackbar('Error loading comment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to reset comment state after successful save
  const resetCommentState = () => {
    setOriginalComment(comment);
    setHasUnsavedChanges(false);
    // Don't clear global unsaved changes here as there might be other unsaved changes
    // The main save function will handle clearing global unsaved changes
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleRemove = () => {
    // Remove confirmation dialog to eliminate delay
    onRemove();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!selectedOrder) {
    return null;
  }

  return (
    <>
      <MainCard
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
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
              {t('orderPlanning.orderComment', 'Order Comment')}
            </Box>
            <IconButton
              onClick={handleRemove}
              color="error"
              size="small"
              title="Remove Comment"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        }
      >
        <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              placeholder={t('orderPlanning.addComment', 'Add a comment for this order...')}
              value={comment || ''}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiInputBase-input': {
                  fontWeight: 'normal'
                }
              }}
            />
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

export default CommentCard;
