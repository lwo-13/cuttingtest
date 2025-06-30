import { useState, useEffect } from 'react';
import { TextField, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'utils/axiosInstance';

const useOrderAuditInfo = (orderCommessa) => {
  const { t } = useTranslation();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAuditData = async () => {
    if (!orderCommessa) return;

    console.log(`🔍 Fetching audit data for order: ${orderCommessa}`);
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/orders/audit/${orderCommessa}`);
      if (response.data.success) {
        console.log(`✅ Audit data fetched successfully for order: ${orderCommessa}`, response.data.data);
        setAuditData(response.data.data);
      } else {
        console.log(`⚠️ No audit data found for order: ${orderCommessa}`);
        setError('No audit data found');
        setAuditData(null);
      }
    } catch (error) {
      console.warn(`❌ Failed to fetch audit data for order: ${orderCommessa}`, error);
      setError('Failed to load audit data');
      setAuditData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderCommessa) {
      fetchAuditData();
    } else {
      setAuditData(null);
      setError(null);
    }
  }, [orderCommessa]);

  // Expose refetch function for external use
  const refetchAuditData = () => {
    console.log(`🔄 Refetch audit data called for order: ${orderCommessa}`);
    if (orderCommessa) {
      fetchAuditData();
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';

    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return dateTimeString;
    }
  };

  if (!orderCommessa) {
    return { createdBy: null, lastModifiedBy: null, refetchAuditData };
  }

  if (loading) {
    return {
      createdBy: (
        <Tooltip title={t('audit.loadingAuditInfo', 'Loading audit info...')}>
          <TextField
            label={t('audit.createdBy', 'Created by')}
            variant="outlined"
            value={t('audit.loadingAuditInfo', 'Loading...')}
            slotProps={{ input: { readOnly: true } }}
            sx={{ width: '100%', minWidth: '120px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Tooltip>
      ),
      lastModifiedBy: (
        <Tooltip title={t('audit.loadingAuditInfo', 'Loading audit info...')}>
          <TextField
            label={t('audit.lastModifiedBy', 'Last modified by')}
            variant="outlined"
            value={t('audit.loadingAuditInfo', 'Loading...')}
            slotProps={{ input: { readOnly: true } }}
            sx={{ width: '100%', minWidth: '120px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Tooltip>
      ),
      refetchAuditData
    };
  }

  if (error || !auditData) {
    return {
      createdBy: (
        <Tooltip title={t('audit.noAuditData', 'No audit information available for this order')}>
          <TextField
            label={t('audit.createdBy', 'Created by')}
            variant="outlined"
            value=""
            slotProps={{ input: { readOnly: true } }}
            sx={{ width: '100%', minWidth: '120px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Tooltip>
      ),
      lastModifiedBy: (
        <Tooltip title={t('audit.noAuditData', 'No audit information available for this order')}>
          <TextField
            label={t('audit.lastModifiedBy', 'Last modified by')}
            variant="outlined"
            value=""
            slotProps={{ input: { readOnly: true } }}
            sx={{ width: '100%', minWidth: '120px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
          />
        </Tooltip>
      ),
      refetchAuditData
    };
  }

  return {
    createdBy: (
      <Tooltip title={`${t('audit.createdBy', 'Created by')} ${auditData.created_by} ${t('audit.createdOn', 'on')} ${formatDateTime(auditData.created_at)}`}>
        <TextField
          label={t('audit.createdBy', 'Created by')}
          variant="outlined"
          value={auditData.created_by || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '120px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Tooltip>
    ),
    lastModifiedBy: (
      <Tooltip title={`${t('audit.lastModifiedBy', 'Last modified by')} ${auditData.last_modified_by} ${t('audit.lastModifiedOn', 'on')} ${formatDateTime(auditData.last_modified_at)}`}>
        <TextField
          label={t('audit.lastModifiedBy', 'Last modified by')}
          variant="outlined"
          value={auditData.last_modified_by || ""}
          slotProps={{ input: { readOnly: true } }}
          sx={{ width: '100%', minWidth: '120px', "& .MuiInputBase-input": { fontWeight: 'normal' } }}
        />
      </Tooltip>
    ),
    refetchAuditData
  };
};

export default useOrderAuditInfo;
