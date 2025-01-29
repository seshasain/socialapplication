import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Chip,
  Dialog,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { ContentSource, SyncStatus } from '../../types/integrations';
import { formatDistanceToNow } from 'date-fns';
import AddIntegrationDialog from './AddIntegrationDialog';

interface IntegrationsListProps {
  onAddIntegration?: () => void;
  onSourceSelect?: (sourceId: string) => void;
}

const IntegrationsList: React.FC<IntegrationsListProps> = ({
  onAddIntegration,
  onSourceSelect,
}) => {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/integrations/sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      setSources(data.sources);
    } catch (err) {
      setError('Failed to load integrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSync = async (sourceId: string) => {
    setSyncingSource(sourceId);
    try {
      const response = await fetch(`/api/integrations/sync/${sourceId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync source');
      await fetchSources(); // Refresh the list after sync
    } catch (err) {
      setError('Failed to sync content');
      console.error(err);
    } finally {
      setSyncingSource(null);
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    
    try {
      const response = await fetch(`/api/integrations/sources/${sourceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete source');
      await fetchSources(); // Refresh the list after deletion
    } catch (err) {
      setError('Failed to disconnect integration');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'in_progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Content Sources
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Integration
        </Button>
      </Box>

      {error && (
        <Box mb={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {sources.map((source) => (
          <Grid item xs={12} md={6} lg={4} key={source.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="h3">
                    {source.name}
                  </Typography>
                  <Box>
                    <IconButton
                      onClick={() => onSourceSelect?.(source.id)}
                      color="primary"
                      title="View Posts"
                    >
                      <ViewListIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleSync(source.id)}
                      disabled={syncingSource === source.id}
                    >
                      {syncingSource === source.id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <RefreshIcon />
                      )}
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(source.id)}
                      color="error"
                      disabled={syncingSource === source.id}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Chip
                    label={source.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={source.connected ? 'Connected' : 'Disconnected'}
                    size="small"
                    color={source.connected ? 'success' : 'error'}
                    sx={{ ml: 1 }}
                  />
                </Box>

                {source.lastSync && (
                  <Typography variant="body2" color="textSecondary">
                    Last synced: {formatDistanceToNow(new Date(source.lastSync))} ago
                  </Typography>
                )}

                {source.syncStatus?.[0] && (
                  <Box mt={1}>
                    <Chip
                      label={`Last sync: ${source.syncStatus[0].status}`}
                      size="small"
                      color={getStatusColor(source.syncStatus[0].status)}
                    />
                    {source.syncStatus[0].itemsProcessed > 0 && (
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        {source.syncStatus[0].itemsProcessed} items processed
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <AddIntegrationDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          setAddDialogOpen(false);
          fetchSources();
          onAddIntegration?.();
        }}
      />
    </Box>
  );
};

export default IntegrationsList; 