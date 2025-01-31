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
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  Google as GoogleIcon,
  Article as ArticleIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { ContentSource, SyncStatus } from '../../types/integrations';
import { formatDistanceToNow } from 'date-fns';
import AddIntegrationDialog from './AddIntegrationDialog';
import { motion, AnimatePresence } from 'framer-motion';

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
  const theme = useTheme();

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
      await fetchSources();
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
      await fetchSources();
    } catch (err) {
      setError('Failed to disconnect integration');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'in_progress':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'google_docs':
        return <GoogleIcon />;
      case 'wordpress':
        return <ArticleIcon />;
      case 'notion':
        return <NotesIcon />;
      default:
        return null;
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
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: 'background.paper',
          py: 2,
        }}
      >
        <Typography variant="h6" component="h2" fontWeight="500">
          Available Integrations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1,
            boxShadow: theme.shadows[2],
            '&:hover': {
              boxShadow: theme.shadows[4],
            },
          }}
        >
          Add Integration
        </Button>
      </Box>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Box 
            mb={3} 
            p={2} 
            bgcolor={alpha(theme.palette.error.main, 0.1)}
            borderRadius={2}
            border={`1px solid ${theme.palette.error.main}`}
          >
            <Typography color="error">{error}</Typography>
          </Box>
        </motion.div>
      )}

      <AnimatePresence>
        <Grid container spacing={3}>
          {sources.map((source, index) => (
            <Grid item xs={12} md={6} lg={4} key={source.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center">
                        <Box 
                          sx={{ 
                            mr: 2,
                            color: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {getIntegrationIcon(source.type)}
                        </Box>
                        <Typography variant="h6" component="h3">
                          {source.name}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          onClick={() => onSourceSelect?.(source.id)}
                          color="primary"
                          title="View Posts"
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        >
                          <ViewListIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleSync(source.id)}
                          disabled={syncingSource === source.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
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
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box mb={2}>
                      <Chip
                        label={source.type.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                          borderRadius: 1,
                        }}
                      />
                      <Chip
                        label={source.connected ? 'Connected' : 'Disconnected'}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: source.connected 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                          color: source.connected
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          fontWeight: 500,
                          borderRadius: 1,
                        }}
                      />
                    </Box>

                    {source.lastSync && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Box 
                          component="span" 
                          sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            backgroundColor: theme.palette.success.main,
                            display: 'inline-block',
                          }} 
                        />
                        Last synced: {formatDistanceToNow(new Date(source.lastSync))} ago
                      </Typography>
                    )}

                    {source.syncStatus?.[0] && (
                      <Box mt={2}>
                        <Chip
                          label={`Last sync: ${source.syncStatus[0].status}`}
                          size="small"
                          sx={{
                            backgroundColor: alpha(getStatusColor(source.syncStatus[0].status), 0.1),
                            color: getStatusColor(source.syncStatus[0].status),
                            fontWeight: 500,
                            borderRadius: 1,
                          }}
                        />
                        {source.syncStatus[0].itemsProcessed > 0 && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              mt: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Box 
                              component="span" 
                              sx={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: theme.palette.info.main,
                                display: 'inline-block',
                              }} 
                            />
                            {source.syncStatus[0].itemsProcessed} items processed
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </AnimatePresence>

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