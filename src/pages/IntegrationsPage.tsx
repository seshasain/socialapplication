import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Tab, 
  Tabs, 
  Typography, 
  Paper, 
  useTheme, 
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  alpha,
  Menu,
  MenuItem,
  Badge,
  Divider,
  TextField,
  InputAdornment,
  Drawer,
  Switch,
  FormControlLabel,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  Alert,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  CircularProgress,
  Slider,
  Backdrop
} from '@mui/material';
import IntegrationsList from '../components/integrations/IntegrationsList';
import ContentPostsList from '../components/integrations/ContentPostsList';
import AddIntegrationDialog from '../components/integrations/AddIntegrationDialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Speed as SpeedIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { Plus, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { keyframes } from '@emotion/react';
import { API_URL } from '../config/api';
import api from '../utils/apiClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `integration-tab-${index}`,
    'aria-controls': `integration-tabpanel-${index}`,
  };
}

interface FilterState {
  status: string[];
  type: string[];
  dateRange: 'all' | 'today' | 'week' | 'month';
  syncStatus: string[];
  autoSync?: boolean;
}

interface SortOption {
  field: 'name' | 'lastSync' | 'status' | 'type';
  direction: 'asc' | 'desc';
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  notifyOnError: boolean;
  notifyOnSuccess: boolean;
  retryOnError: boolean;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
}

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const glowAnimation = keyframes`
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.3;
  }
`;

const IntegrationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    failed: 0,
    pending: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    type: [],
    dateRange: 'all',
    syncStatus: []
  });
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'lastSync',
    direction: 'desc'
  });
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [showPremiumAlert, setShowPremiumAlert] = useState(false);
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    autoSync: false,
    syncInterval: 30,
    notifyOnError: true,
    notifyOnSuccess: false,
    retryOnError: true,
    maxRetries: 3,
    priority: 'normal'
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/integrations/stats');
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch integration stats:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple refreshes
    
    setIsRefreshing(true);
    try {
      await api.post('/api/integrations/sync/all');
      await fetchStats();
    } catch (error) {
      console.error('Failed to sync integrations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const isPremium = user?.subscription?.planId === 'pro';

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (filterType: keyof FilterState, value: any) => {
    if (!isPremium && (filterType === 'dateRange' || filterType === 'syncStatus')) {
      setShowPremiumAlert(true);
      return;
    }
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortChange = (field: SortOption['field']) => {
    if (!isPremium && (field === 'status' || field === 'type')) {
      setShowPremiumAlert(true);
      return;
    }
    setSortOption(prev => ({
      field,
      direction: prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc'
    }));
    handleSortClose();
  };

  const handleSyncSettingsChange = (setting: keyof SyncSettings, value: any) => {
    if (!isPremium) {
      setShowPremiumAlert(true);
      return;
    }
    setSyncSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      // Simulated sync progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSyncProgress(i);
      }
      
      await handleRefresh();
      if (syncSettings.notifyOnSuccess) {
        // Show success notification
      }
    } catch (error) {
      if (syncSettings.notifyOnError) {
        // Show error notification
      }
      if (syncSettings.retryOnError) {
        // Implement retry logic
      }
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const renderFilterDrawer = () => (
    <Drawer
      anchor="right"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      PaperProps={{
        sx: {
          width: 320,
          p: 3,
          background: isPremium 
            ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)'
            : undefined
        }
      }}
    >
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Filters
            {isPremium && (
              <Chip
                label="PRO"
                size="small"
                sx={{
                  ml: 1,
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            )}
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box mb={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box mb={3}>
          <FormControl fullWidth>
            <InputLabel>Integration Type</InputLabel>
            <Select
              multiple
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="google_docs">Google Docs</MenuItem>
              <MenuItem value="wordpress">WordPress</MenuItem>
              <MenuItem value="notion">Notion</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isPremium && (
          <>
            <Box mb={3}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box mb={3}>
              <FormControl fullWidth>
                <InputLabel>Sync Status</InputLabel>
                <Select
                  multiple
                  value={filters.syncStatus}
                  onChange={(e) => handleFilterChange('syncStatus', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box mb={3}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={filters.autoSync} 
                    onChange={(e) => handleFilterChange('autoSync', e.target.checked)}
                  />
                }
                label="Auto-sync enabled"
              />
            </Box>
          </>
        )}

        {!isPremium && (
          <Alert 
            severity="info" 
            sx={{ mt: 2 }}
            action={
              <Button color="primary" size="small" onClick={() => {/* Handle upgrade */}}>
                Upgrade
              </Button>
            }
          >
            Upgrade to PRO for advanced filters
          </Alert>
        )}
      </Box>
    </Drawer>
  );

  const renderSortMenu = () => (
    <Popover
      open={Boolean(sortAnchorEl)}
      anchorEl={sortAnchorEl}
      onClose={handleSortClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          mt: 1,
          boxShadow: theme.shadows[8],
          '& .MuiMenuItem-root': {
            py: 1.5,
          },
        },
      }}
    >
      <MenuItem 
        onClick={() => handleSortChange('name')}
        selected={sortOption.field === 'name'}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <span>Name</span>
          {sortOption.field === 'name' && (
            <ArrowUpwardIcon 
              sx={{ 
                ml: 2, 
                fontSize: 18,
                transform: sortOption.direction === 'desc' ? 'rotate(180deg)' : 'none'
              }} 
            />
          )}
        </Box>
      </MenuItem>
      <MenuItem 
        onClick={() => handleSortChange('lastSync')}
        selected={sortOption.field === 'lastSync'}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <span>Last Synced</span>
          {sortOption.field === 'lastSync' && (
            <ArrowUpwardIcon 
              sx={{ 
                ml: 2, 
                fontSize: 18,
                transform: sortOption.direction === 'desc' ? 'rotate(180deg)' : 'none'
              }} 
            />
          )}
        </Box>
      </MenuItem>
      {isPremium && (
        <>
          <MenuItem 
            onClick={() => handleSortChange('status')}
            selected={sortOption.field === 'status'}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <span>Status</span>
              {sortOption.field === 'status' && (
                <ArrowUpwardIcon 
                  sx={{ 
                    ml: 2, 
                    fontSize: 18,
                    transform: sortOption.direction === 'desc' ? 'rotate(180deg)' : 'none'
                  }} 
                />
              )}
            </Box>
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortChange('type')}
            selected={sortOption.field === 'type'}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <span>Integration Type</span>
              {sortOption.field === 'type' && (
                <ArrowUpwardIcon 
                  sx={{ 
                    ml: 2, 
                    fontSize: 18,
                    transform: sortOption.direction === 'desc' ? 'rotate(180deg)' : 'none'
                  }} 
                />
              )}
            </Box>
          </MenuItem>
        </>
      )}
    </Popover>
  );

  const renderSyncSettingsDialog = () => (
    <Dialog
      open={syncSettingsOpen}
      onClose={() => setSyncSettingsOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: isPremium 
            ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)'
            : undefined
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SyncIcon />
          <Typography variant="h6">Sync Settings</Typography>
          {isPremium && (
            <Chip
              label="PRO"
              size="small"
              sx={{
                ml: 1,
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <List>
          <ListItem>
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText
              primary="Auto-sync"
              secondary="Automatically sync content at regular intervals"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={syncSettings.autoSync}
                onChange={(e) => handleSyncSettingsChange('autoSync', e.target.checked)}
                disabled={!isPremium}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          {syncSettings.autoSync && (
            <ListItem>
              <ListItemIcon>
                <SpeedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Sync Interval"
                secondary={`${syncSettings.syncInterval} minutes`}
              />
              <ListItemSecondaryAction sx={{ width: '120px' }}>
                <Slider
                  value={syncSettings.syncInterval}
                  onChange={(_, value) => handleSyncSettingsChange('syncInterval', value)}
                  min={5}
                  max={120}
                  step={5}
                  disabled={!isPremium}
                />
              </ListItemSecondaryAction>
            </ListItem>
          )}

          <ListItem>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Notifications"
              secondary="Get notified about sync status"
            />
            <ListItemSecondaryAction>
              <FormControlLabel
                control={
                  <Switch
                    checked={syncSettings.notifyOnError}
                    onChange={(e) => handleSyncSettingsChange('notifyOnError', e.target.checked)}
                    disabled={!isPremium}
                  />
                }
                label="Errors"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={syncSettings.notifyOnSuccess}
                    onChange={(e) => handleSyncSettingsChange('notifyOnSuccess', e.target.checked)}
                    disabled={!isPremium}
                  />
                }
                label="Success"
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText
              primary="Auto-retry"
              secondary={`Retry failed syncs up to ${syncSettings.maxRetries} times`}
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={syncSettings.retryOnError}
                onChange={(e) => handleSyncSettingsChange('retryOnError', e.target.checked)}
                disabled={!isPremium}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        {!isPremium && (
          <Alert 
            severity="info" 
            sx={{ mt: 2 }}
            action={
              <Button color="primary" size="small" onClick={() => {/* Handle upgrade */}}>
                Upgrade to PRO
              </Button>
            }
          >
            Upgrade to PRO for advanced sync settings
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSyncSettingsOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            setSyncSettingsOpen(false);
            // Save sync settings to backend
          }}
          disabled={!isPremium}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderMenu = () => (
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          mt: 1,
          '& .MuiMenuItem-root': {
            py: 1,
            px: 2,
          },
        },
      }}
    >
      <MenuItem onClick={() => {
        handleMenuClose();
        setSyncSettingsOpen(true);
      }}>
        <SyncIcon sx={{ mr: 2, fontSize: 20 }} />
        Sync Settings
        {isPremium && (
          <Chip
            label="PRO"
            size="small"
            sx={{
              ml: 1,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        )}
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
        Integration Settings
      </MenuItem>
      <Divider />
      <MenuItem 
        onClick={() => {
          handleMenuClose();
          handleSync();
        }}
      >
        <Box display="flex" alignItems="center" width="100%">
          <SyncIcon sx={{ mr: 2, fontSize: 20 }} />
          Sync Now
          {isSyncing && (
            <CircularProgress 
              size={16} 
              sx={{ ml: 'auto' }} 
              variant={syncProgress > 0 ? "determinate" : "indeterminate"}
              value={syncProgress}
            />
          )}
        </Box>
      </MenuItem>
    </Menu>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-8 py-6 space-y-8"
      >
        {/* Premium Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow-xl">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  Integrations Hub
                  {isPremium && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                      <Zap className="w-4 h-4 mr-1" />
                      PRO
                    </span>
                  )}
                </h1>
                <p className="text-lg text-white/80 max-w-2xl">
                  {isPremium 
                    ? 'Unlock the full potential of your content with premium integrations and advanced automation'
                    : 'Connect and manage your content sources in one centralized dashboard'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Tooltip title="Refresh">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                      padding: '10px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  sx={{
                    background: 'white',
                    color: 'rgb(37, 99, 235)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    padding: '8px 20px',
                    borderRadius: '12px',
                    textTransform: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      background: 'rgb(255, 255, 255)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.15), 0 3px 6px -2px rgba(0, 0, 0, 0.1)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                    },
                    '.MuiButton-startIcon': {
                      marginRight: '8px',
                    }
                  }}
                  startIcon={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: 'rgb(37, 99, 235)',
                        color: 'white',
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Box>
                  }
                >
                  Add Integration
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-indigo-600/50" />
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              title: 'Total Integrations', 
              value: stats.total, 
              bgColor: 'rgb(239, 246, 255)',
              iconColor: 'rgb(37, 99, 235)',
              icon: <DashboardIcon />
            },
            { 
              title: 'Active', 
              value: stats.active, 
              bgColor: 'rgb(240, 253, 244)',
              iconColor: 'rgb(22, 163, 74)',
              icon: <CheckCircleIcon />
            },
            { 
              title: 'Failed', 
              value: stats.failed, 
              bgColor: 'rgb(254, 242, 242)',
              iconColor: 'rgb(220, 38, 38)',
              icon: <ErrorIcon />
            },
            { 
              title: 'Pending', 
              value: stats.pending, 
              bgColor: 'rgb(254, 249, 195)',
              iconColor: 'rgb(234, 179, 8)',
              icon: <SyncIcon />
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 group">
                <div className="flex items-center justify-between">
                  <div style={{ backgroundColor: stat.bgColor }} className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <span style={{ color: stat.iconColor }}>{stat.icon}</span>
                  </div>
                  <span style={{ color: stat.iconColor }} className="text-sm font-medium">
                    {index === 0 ? 'Last 30 days' : ''}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-600">{stat.title}</h3>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-blue-500 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isRefreshing && (
            <div className="h-1">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
          )}
          
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center px-6">
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                className="min-h-[64px]"
                sx={{
                  '& .MuiTab-root': {
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    fontWeight: 500,
                    color: 'rgb(75, 85, 99)',
                    '&.Mui-selected': {
                      color: 'rgb(37, 99, 235)',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 2,
                    backgroundColor: 'rgb(37, 99, 235)',
                  },
                }}
              >
                <Tab 
                  label={
                    <div className="flex items-center space-x-2">
                      <span>Content Sources</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {stats.total}
                      </span>
                    </div>
                  }
                  {...a11yProps(0)}
                />
                <Tab 
                  label={
                    <div className="flex items-center space-x-2">
                      <span>Content Posts</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        24
                      </span>
                    </div>
                  }
                  {...a11yProps(1)}
                />
              </Tabs>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <TextField
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={handleSearch}
                    variant="outlined"
                    size="small"
                    className="w-64"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon className="text-gray-400" />
                        </InputAdornment>
                      ),
                      className: "bg-gray-50 border-0 rounded-lg",
                    }}
                  />
                </div>
                <Tooltip title="Filter">
                  <IconButton
                    onClick={() => setFilterDrawerOpen(true)}
                    className="hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FilterListIcon className="text-gray-600" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sort">
                  <IconButton
                    onClick={handleSortClick}
                    className="hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <SortIcon className="text-gray-600" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          </div>

          <TabPanel value={tabValue} index={0}>
            <div className="p-6">
              <IntegrationsList
                onSourceSelect={(sourceId) => {
                  setSelectedSourceId(sourceId);
                  setTabValue(1);
                }}
              />
            </div>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <div className="p-6">
              <ContentPostsList sourceId={selectedSourceId} />
            </div>
          </TabPanel>
        </div>
      </motion.div>

      {/* Modals and Dialogs */}
      {renderMenu()}
      {renderFilterDrawer()}
      {renderSortMenu()}
      {renderSyncSettingsDialog()}
      
      <Collapse in={showPremiumAlert}>
        <div className="mx-8 mt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <BoltIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-700 font-medium">
                    Unlock premium features with our Pro plan
                  </p>
                  <p className="text-sm text-blue-600/80 mt-0.5">
                    Get access to advanced filters, automation, and more
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {/* Handle upgrade */}}
                variant="contained"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                startIcon={<Zap className="w-4 h-4" />}
              >
                Upgrade to Pro
              </Button>
            </div>
          </motion.div>
        </div>
      </Collapse>

      <AddIntegrationDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          setAddDialogOpen(false);
          fetchStats();
        }}
      />

      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(4px)'
        }}
        open={isSyncing}
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 flex flex-col items-center space-y-4">
          <CircularProgress color="inherit" />
          <Typography>Syncing your integrations...</Typography>
        </div>
      </Backdrop>
    </div>
  );
};

export default IntegrationsPage; 