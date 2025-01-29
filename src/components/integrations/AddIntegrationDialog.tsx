import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { GoogleDocsConfig, WordPressConfig } from '../../types/integrations';

interface AddIntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddIntegrationDialog: React.FC<AddIntegrationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [integrationType, setIntegrationType] = useState<'google_docs' | 'wordpress'>('google_docs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Docs specific state
  const [googleConfig, setGoogleConfig] = useState<Partial<GoogleDocsConfig>>({
    folderId: '',
  });

  // WordPress specific state
  const [wordpressConfig, setWordPressConfig] = useState<Partial<WordPressConfig>>({
    siteUrl: '',
    postTypes: ['post'],
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (integrationType === 'google_docs') {
        // For Google Docs, we'll need to handle OAuth flow
        window.location.href = '/api/auth/google';
        return;
      } else if (integrationType === 'wordpress') {
        response = await fetch('/api/integrations/connect/wordpress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: wordpressConfig,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to connect WordPress');
        }

        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add integration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationTypeChange = (event: SelectChangeEvent<string>) => {
    setIntegrationType(event.target.value as 'google_docs' | 'wordpress');
  };

  const handleWordPressUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWordPressConfig({ ...wordpressConfig, siteUrl: event.target.value });
  };

  const handleWordPressPostTypesChange = (event: SelectChangeEvent<string[]>) => {
    setWordPressConfig({
      ...wordpressConfig,
      postTypes: event.target.value as string[],
    });
  };

  const handleGoogleFolderIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleConfig({ ...googleConfig, folderId: event.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Integration</DialogTitle>
      <DialogContent>
        {error && (
          <Box mb={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <Box mb={3}>
          <FormControl fullWidth>
            <InputLabel>Integration Type</InputLabel>
            <Select
              value={integrationType}
              onChange={handleIntegrationTypeChange}
              label="Integration Type"
            >
              <MenuItem value="google_docs">Google Docs</MenuItem>
              <MenuItem value="wordpress">WordPress</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {integrationType === 'google_docs' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Connect your Google Docs account to import and sync your documents.
            </Typography>
            <TextField
              fullWidth
              label="Folder ID (Optional)"
              value={googleConfig.folderId}
              onChange={handleGoogleFolderIdChange}
              helperText="Leave empty to sync from root folder"
              margin="normal"
            />
          </Box>
        )}

        {integrationType === 'wordpress' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Connect your WordPress site to import and sync your posts.
            </Typography>
            <TextField
              fullWidth
              required
              label="WordPress Site URL"
              value={wordpressConfig.siteUrl}
              onChange={handleWordPressUrlChange}
              helperText="Enter your WordPress site URL (e.g., https://example.com)"
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Post Types</InputLabel>
              <Select
                multiple
                value={wordpressConfig.postTypes || []}
                onChange={handleWordPressPostTypesChange}
                label="Post Types"
              >
                <MenuItem value="post">Posts</MenuItem>
                <MenuItem value="page">Pages</MenuItem>
                <MenuItem value="custom">Custom Post Types</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddIntegrationDialog; 