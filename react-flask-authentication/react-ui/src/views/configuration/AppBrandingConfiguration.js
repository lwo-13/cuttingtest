import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider
} from '@mui/material';
import { Refresh, Save } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import Logo from 'ui-component/Logo';
import { AVAILABLE_LANGUAGES, DEFAULT_ENABLED_LANGUAGES } from 'utils/languageConfig';

const AppBrandingConfiguration = () => {
  const [form, setForm] = useState({
    logoVariant: 'default',
    enabledLanguages: DEFAULT_ENABLED_LANGUAGES
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [logoInfo, setLogoInfo] = useState({ hasCustom: false, url: '' });
  const [faviconInfo, setFaviconInfo] = useState({ hasCustom: false, url: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    fetchBrandingConfig();
  }, []);

  const fetchBrandingConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/config/branding');
      if (response.data.success) {
        const data = response.data.data || {};

        const availableCodes = new Set(AVAILABLE_LANGUAGES.map((lang) => lang.code));
        let enabledLanguagesFromApi = Array.isArray(data.enabledLanguages)
          ? data.enabledLanguages
          : DEFAULT_ENABLED_LANGUAGES;
        enabledLanguagesFromApi = enabledLanguagesFromApi.filter((code) => availableCodes.has(code));
        if (!enabledLanguagesFromApi.length) {
          enabledLanguagesFromApi = DEFAULT_ENABLED_LANGUAGES;
        }

        setForm({
          logoVariant: data.logoVariant || 'default',
          enabledLanguages: enabledLanguagesFromApi
        });

        setLogoInfo({
          hasCustom: Boolean(data.customLogoUrl),
          url: data.customLogoUrl || ''
        });

        setFaviconInfo({
          hasCustom: Boolean(data.customFaviconUrl),
          url: data.customFaviconUrl || ''
        });
      } else {
        showSnackbar('Failed to load branding configuration', 'error');
      }
    } catch (error) {
      console.error('Error fetching branding configuration:', error);
      showSnackbar('Error loading branding configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveBrandingConfig = async () => {
    try {
      setSaving(true);
      const response = await axios.post('/config/branding', form);
      if (response.data.success) {
        showSnackbar('Branding configuration saved successfully!', 'success');
        fetchBrandingConfig();
      } else {
        showSnackbar('Failed to save branding configuration', 'error');
      }
    } catch (error) {
      console.error('Error saving branding configuration:', error);
      showSnackbar('Error saving branding configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleLanguageToggle = (code) => {
    setForm((prev) => {
      const current = Array.isArray(prev.enabledLanguages) ? prev.enabledLanguages : [];
      const set = new Set(current);
      if (set.has(code)) {
        set.delete(code);
      } else {
        set.add(code);
      }
      const next = Array.from(set);
      return { ...prev, enabledLanguages: next.length ? next : DEFAULT_ENABLED_LANGUAGES };
    });
  };

  const handleLogoFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/config/branding/logo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        showSnackbar('Logo uploaded successfully', 'success');
        fetchBrandingConfig();
      } else {
        showSnackbar(response.data?.msg || 'Failed to upload logo', 'error');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showSnackbar('Error uploading logo', 'error');
    } finally {
      setUploadingLogo(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleFaviconFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      setUploadingFavicon(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/config/branding/favicon/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        showSnackbar('Favicon uploaded successfully', 'success');
        fetchBrandingConfig();
      } else {
        showSnackbar(response.data?.msg || 'Failed to upload favicon', 'error');
      }
    } catch (error) {
      console.error('Error uploading favicon:', error);
      showSnackbar('Error uploading favicon', 'error');
    } finally {
      setUploadingFavicon(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    try {
      setUploadingLogo(true);
      const response = await axios.delete('/config/branding/logo');

      if (response.data && response.data.success) {
        showSnackbar('Logo deleted successfully', 'success');
        fetchBrandingConfig();
      } else {
        showSnackbar(response.data?.msg || 'Failed to delete logo', 'error');
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      showSnackbar('Error deleting logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteFavicon = async () => {
    try {
      setUploadingFavicon(true);
      const response = await axios.delete('/config/branding/favicon');

      if (response.data && response.data.success) {
        showSnackbar('Favicon deleted successfully', 'success');
        fetchBrandingConfig();
      } else {
        showSnackbar(response.data?.msg || 'Failed to delete favicon', 'error');
      }
    } catch (error) {
      console.error('Error deleting favicon:', error);
      showSnackbar('Error deleting favicon', 'error');
    } finally {
      setUploadingFavicon(false);
    }
  };


  if (loading) {
    return (
      <MainCard title="Branding">
        <Typography>Loading branding configuration...</Typography>
      </MainCard>
    );
  }

  return (
    <MainCard
      title="Branding"
      secondary={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="text"
            onClick={fetchBrandingConfig}
            size="small"
            sx={{ minWidth: 'auto', p: 1 }}
            title="Reload"
          >
            <Refresh />
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveBrandingConfig}
            disabled={saving}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              fontSize: '0.875rem',
              py: 0.75,
              px: 2,
              minHeight: '36px',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              '&:disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      }
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Logo Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which logo variant is used in the application header.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="logo-variant-label">Logo Variant</InputLabel>
              <Select
                labelId="logo-variant-label"
                value={form.logoVariant}
                label="Logo Variant"
                onChange={handleChange('logoVariant')}
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="zalli">ZALLI</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Preview
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Logo />
              </Box>
            </Box>
          </Stack>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Custom Logo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Upload a custom logo image. If none is uploaded, the selected logo variant will be used.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                onClick={() => logoInputRef.current && logoInputRef.current.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </Button>
              {logoInfo.hasCustom && (
                <>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Current custom logo
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={logoInfo.url}
                        alt="Custom logo preview"
                        style={{ maxHeight: 50, maxWidth: 160, objectFit: 'contain' }}
                      />
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleDeleteLogo}
                    disabled={uploadingLogo}
                  >
                    Delete Logo
                  </Button>
                </>
              )}
            </Stack>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoFileChange}
            />
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Favicon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This icon is shown in the browser tab.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => faviconInputRef.current && faviconInputRef.current.click()}
              disabled={uploadingFavicon}
            >
              {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
            </Button>
            {faviconInfo.hasCustom ? (
              <>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current custom favicon
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={faviconInfo.url}
                      alt="Custom favicon preview"
                      style={{ width: 32, height: 32, objectFit: 'contain' }}
                    />
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleDeleteFavicon}
                  disabled={uploadingFavicon}
                >
                  Delete Favicon
                </Button>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Using the default application favicon.
              </Typography>
            )}
          </Stack>
          <input
            ref={faviconInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFaviconFileChange}
          />
        </Box>

        <Divider />

        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Languages in Profile Menu
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which languages are available to users when they click the profile icon.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {AVAILABLE_LANGUAGES.map((lang) => {
              const selected = Array.isArray(form.enabledLanguages)
                ? form.enabledLanguages.includes(lang.code)
                : false;

              return (
                <Button
                  key={lang.code}
                  variant={selected ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleLanguageToggle(lang.code)}
                  sx={{ textTransform: 'none', mb: 1 }}
                >
                  {lang.flag ? `${lang.flag} ${lang.label}` : lang.label}
                </Button>
              );
            })}
          </Stack>
        </Box>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
};

export default AppBrandingConfiguration;

