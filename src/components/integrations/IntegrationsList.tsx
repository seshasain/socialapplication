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
  Tooltip,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  Google as GoogleIcon,
  Article as ArticleIcon,
  Notes as NotesIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ContentSource, SyncStatus } from '../../types/integrations';
import { formatDistanceToNow } from 'date-fns';
import AddIntegrationDialog from './AddIntegrationDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config/api';
import api from '../../utils/apiClient';

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
      const response = await api.get('/api/integrations/sources');
      if (response.data) {
        setSources(response.data.sources);
      }
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
      await api.post(`/api/integrations/sync/${sourceId}`);
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
      await api.delete(`/api/integrations/sources/${sourceId}`);
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
    <AnimatePresence mode="wait">
      <motion.div key="integrations-list">
        <Grid container spacing={4}>
          {sources.map((source, index) => (
            <Grid item xs={12} md={6} lg={4} key={source.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className="group"
                  sx={{
                    borderRadius: 3,
                    background: 'white',
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      borderColor: 'transparent',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box 
                          sx={{ 
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.15),
                            }
                          }}
                        >
                          {getIntegrationIcon(source.type)}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight="600" gutterBottom>
                            {source.name}
                          </Typography>
                          <Chip
                            label={source.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 500,
                              borderRadius: '6px',
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Posts">
                          <IconButton
                            onClick={() => onSourceSelect?.(source.id)}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            <ViewListIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sync Now">
                          <IconButton
                            onClick={() => handleSync(source.id)}
                            disabled={syncingSource === source.id}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            {syncingSource === source.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <RefreshIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Integration">
                          <IconButton
                            onClick={() => handleDelete(source.id)}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.2),
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Status Section */}
                    <Box 
                      sx={{ 
                        mt: 3,
                        p: 2, 
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Chip
                          icon={source.connected ? <CheckCircleIcon /> : <ErrorIcon />}
                          label={source.connected ? 'Connected' : 'Disconnected'}
                          size="small"
                          sx={{
                            backgroundColor: source.connected 
                              ? alpha(theme.palette.success.main, 0.1)
                              : alpha(theme.palette.error.main, 0.1),
                            color: source.connected
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            fontWeight: 500,
                            borderRadius: '6px',
                            '& .MuiChip-icon': {
                              fontSize: '16px',
                            },
                          }}
                        />
                        {source.lastSync && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <ScheduleIcon sx={{ fontSize: 14 }} />
                            {formatDistanceToNow(new Date(source.lastSync))} ago
                          </Typography>
                        )}
                      </Box>

                      {source.syncStatus?.[0] && (
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              Last sync status:
                            </Typography>
                            <Chip
                              label={source.syncStatus[0].status}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getStatusColor(source.syncStatus[0].status), 0.1),
                                color: getStatusColor(source.syncStatus[0].status),
                                fontWeight: 500,
                                borderRadius: '6px',
                                height: '20px',
                              }}
                            />
                          </Box>
                          
                          {source.syncStatus[0].itemsProcessed > 0 && (
                            <Box>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ mb: 1, display: 'block' }}
                              >
                                Items processed
                              </Typography>
                              <Box position="relative" sx={{ height: '6px', borderRadius: '3px', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    height: '100%',
                                    width: `${(source.syncStatus[0].itemsProcessed / source.syncStatus[0].totalItems) * 100}%`,
                                    borderRadius: '3px',
                                    backgroundColor: theme.palette.primary.main,
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
                              >
                                {source.syncStatus[0].itemsProcessed} / {source.syncStatus[0].totalItems}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
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
      </motion.div>
    </AnimatePresence>
  );
};

export default IntegrationsList; 