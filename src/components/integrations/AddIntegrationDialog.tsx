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
  useTheme,
  alpha,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Article as ArticleIcon,
  Notes as NotesIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { GoogleDocsConfig, WordPressConfig, NotionConfig } from '../../types/integrations';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

interface AddIntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const cardVariants = {
  hover: { 
    y: -4,
    boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.15
    }
  }
};

const AddIntegrationDialog: React.FC<AddIntegrationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [integrationType, setIntegrationType] = useState<'google_docs' | 'wordpress' | 'notion'>('google_docs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  // Integration specific states
  const [googleConfig, setGoogleConfig] = useState<Partial<GoogleDocsConfig>>({
    folderId: '',
  });

  const [wordpressConfig, setWordPressConfig] = useState<Partial<WordPressConfig>>({
    siteUrl: '',
    postTypes: ['post'],
  });

  const [notionConfig, setNotionConfig] = useState<Partial<NotionConfig>>({
    accessToken: '',
    databaseId: '',
  });

  const steps = ['Select Integration', 'Configure Settings', 'Connect'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (integrationType) {
        case 'google_docs':
          // Redirect to Google OAuth flow
        window.location.href = '/api/auth/google';
        return;

        case 'wordpress':
          const wpResponse = await fetch('/api/integrations/connect/wordpress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: wordpressConfig }),
          });

          if (!wpResponse.ok) throw new Error('Failed to connect WordPress');
          break;

        case 'notion':
          const notionResponse = await fetch('/api/integrations/connect/notion', {
          method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: notionConfig }),
          });

          if (!notionResponse.ok) throw new Error('Failed to connect Notion');
          break;
        }

        onSuccess();
        onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add integration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="500">
              Choose an Integration Type
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: 'google_docs', label: 'Google Docs', icon: GoogleIcon, description: 'Import content from Google Docs' },
                { value: 'wordpress', label: 'WordPress', icon: ArticleIcon, description: 'Connect with WordPress sites' },
                { value: 'notion', label: 'Notion', icon: NotesIcon, description: 'Sync with Notion pages' }
              ].map((option) => (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => setIntegrationType(option.value as typeof integrationType)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                      integrationType === option.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <option.icon className={`w-8 h-8 ${
                        integrationType === option.value ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <h4 className={`font-medium ${
                        integrationType === option.value ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </h4>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="500">
              Configure Integration Settings
            </Typography>
            <AnimatePresence mode="wait">
              {integrationType === 'google_docs' && (
                <motion.div
                  key="google"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <TextField
                    fullWidth
                    label="Folder ID (Optional)"
                    value={googleConfig.folderId}
                    onChange={(e) => setGoogleConfig({ ...googleConfig, folderId: e.target.value })}
                    helperText="Leave empty to sync from root folder"
                    className="bg-white"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'rgb(37, 99, 235)',
                        },
                      },
                    }}
                  />
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="ml-3 text-sm text-blue-700">
                    You'll be redirected to Google to authorize access to your documents.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {integrationType === 'wordpress' && (
                <motion.div
                  key="wordpress"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <TextField
                    fullWidth
                    required
                    label="WordPress Site URL"
                    value={wordpressConfig.siteUrl}
                    onChange={(e) => setWordPressConfig({ ...wordpressConfig, siteUrl: e.target.value })}
                    helperText="Enter your WordPress site URL (e.g., https://example.com)"
                    className="bg-white"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'rgb(37, 99, 235)',
                        },
                      },
                    }}
                  />
                  <FormControl fullWidth className="bg-white">
                    <InputLabel>Post Types</InputLabel>
                    <Select
                      multiple
                      value={wordpressConfig.postTypes || []}
                      onChange={(e: SelectChangeEvent<string[]>) => 
    setWordPressConfig({
      ...wordpressConfig,
                          postTypes: e.target.value as string[],
                        })
                      }
                      label="Post Types"
                      sx={{
                        '&:hover fieldset': {
                          borderColor: 'rgb(37, 99, 235)',
                        },
                      }}
                    >
                      <MenuItem value="post">Posts</MenuItem>
                      <MenuItem value="page">Pages</MenuItem>
                      <MenuItem value="custom">Custom Post Types</MenuItem>
                    </Select>
                  </FormControl>
                </motion.div>
              )}

              {integrationType === 'notion' && (
                <motion.div
                  key="notion"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <TextField
                    fullWidth
                    required
                    label="Notion Access Token"
                    value={notionConfig.accessToken}
                    onChange={(e) => setNotionConfig({ ...notionConfig, accessToken: e.target.value })}
                    type="password"
                    className="bg-white"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'rgb(37, 99, 235)',
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    required
                    label="Database ID"
                    value={notionConfig.databaseId}
                    onChange={(e) => setNotionConfig({ ...notionConfig, databaseId: e.target.value })}
                    className="bg-white"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'rgb(37, 99, 235)',
                        },
                      },
                    }}
                    helperText={
                      <div className="flex items-center mt-1">
                        <span className="text-gray-600">Find this in your Notion database URL</span>
                        <Tooltip title="The database ID is the string of characters in your Notion database URL after the last slash">
                          <HelpIcon className="ml-1 w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </div>
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="500">
              Review and Connect
            </Typography>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-4">
                  {getIntegrationIcon(integrationType)}
                  <div>
                  <h4 className="text-lg font-medium text-gray-900">
                      {integrationType === 'google_docs' && 'Google Docs'}
                      {integrationType === 'wordpress' && 'WordPress'}
                      {integrationType === 'notion' && 'Notion'}
                  </h4>
                  <p className="text-sm text-gray-500">
                      {integrationType === 'google_docs' && 'Connect to your Google Drive'}
                      {integrationType === 'wordpress' && wordpressConfig.siteUrl}
                      {integrationType === 'notion' && 'Connect to your Notion workspace'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  </div>
                <p className="ml-3 text-sm text-blue-700">
              Click Connect to finalize the integration setup.
                </p>
              </div>
            </div>
          </Box>
        );
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'google_docs':
        return <GoogleIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />;
      case 'wordpress':
        return <ArticleIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />;
      case 'notion':
        return <NotesIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />;
      default:
        return null;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          className: "rounded-2xl overflow-hidden",
          sx: {
            background: 'linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(249, 250, 251) 100%)',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          <div className="px-8 py-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Add New Integration
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Connect your content sources to streamline your workflow
              </p>
            </div>
            <IconButton 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100/80 rounded-full p-2 transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </IconButton>
          </div>

          <DialogContent className="px-8 py-6">
        {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-red-800">
                        Connection Error
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <Stepper 
              activeStep={activeStep} 
              className="mb-10"
              sx={{
                '& .MuiStepLabel-root .Mui-completed': {
                  color: 'rgb(37, 99, 235)',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: 'rgb(37, 99, 235)',
                },
                '& .MuiStepLabel-label': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiStepConnector-line': {
                  borderColor: 'rgb(229, 231, 235)',
                },
                '& .MuiStepIcon-root': {
                  width: '2rem',
                  height: '2rem',
                },
                '& .MuiStepIcon-text': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {activeStep === 0 && (
                  <div>
                    <div className="text-center max-w-2xl mx-auto mb-8">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Choose Your Integration
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Select a platform to connect with your content workflow
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {[
                        { 
                          value: 'google_docs', 
                          label: 'Google Docs', 
                          icon: GoogleIcon,
                          description: 'Import and sync content from Google Docs',
                          features: ['Auto-sync documents', 'Folder organization', 'Real-time updates']
                        },
                        { 
                          value: 'wordpress', 
                          label: 'WordPress', 
                          icon: ArticleIcon,
                          description: 'Connect and manage WordPress sites',
                          features: ['Multiple post types', 'Custom fields', 'Media sync']
                        },
                        { 
                          value: 'notion', 
                          label: 'Notion', 
                          icon: NotesIcon,
                          description: 'Sync with Notion databases',
                          features: ['Database sync', 'Page templates', 'Rich content']
                        }
                      ].map((option) => (
                        <motion.div
                          key={option.value}
                          variants={cardVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <button
                            onClick={() => setIntegrationType(option.value as typeof integrationType)}
                            className={`w-full h-full text-left ${
                              integrationType === option.value
                                ? 'ring-2 ring-blue-600 bg-blue-50/50'
                                : 'ring-1 ring-gray-200 hover:ring-blue-200 bg-white'
                            } rounded-xl p-6 transition-all duration-200`}
                          >
                            <div className="flex flex-col h-full">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                                integrationType === option.value
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <option.icon className="w-6 h-6" />
                              </div>
                              <h4 className={`text-lg font-semibold mb-2 ${
                                integrationType === option.value ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {option.label}
                              </h4>
                              <p className="text-sm text-gray-500 mb-4">
                                {option.description}
                              </p>
                              <div className="mt-auto">
                                <ul className="space-y-2">
                                  {option.features.map((feature, index) => (
                                    <li key={index} className="flex items-center text-sm text-gray-600">
                                      <svg className="w-4 h-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div>
                    <div className="text-center max-w-2xl mx-auto mb-8">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Configure Your Integration
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Provide the necessary details to connect your {
                          integrationType === 'google_docs' ? 'Google Docs' :
                          integrationType === 'wordpress' ? 'WordPress' : 'Notion'
                        } account
                      </p>
                    </div>
                    <div className="max-w-2xl mx-auto">
                      <AnimatePresence mode="wait">
        {integrationType === 'google_docs' && (
                          <motion.div
                            key="google"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                          >
            <TextField
              fullWidth
              label="Folder ID (Optional)"
              value={googleConfig.folderId}
                              onChange={(e) => setGoogleConfig({ ...googleConfig, folderId: e.target.value })}
              helperText="Leave empty to sync from root folder"
                              className="bg-white"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: 'rgb(37, 99, 235)',
                                  },
                                },
                              }}
                            />
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <p className="ml-3 text-sm text-blue-700">
                                  You'll be redirected to Google to authorize access to your documents.
                                </p>
                              </div>
                            </div>
                          </motion.div>
        )}

        {integrationType === 'wordpress' && (
                          <motion.div
                            key="wordpress"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                          >
            <TextField
              fullWidth
              required
              label="WordPress Site URL"
              value={wordpressConfig.siteUrl}
                              onChange={(e) => setWordPressConfig({ ...wordpressConfig, siteUrl: e.target.value })}
              helperText="Enter your WordPress site URL (e.g., https://example.com)"
                              className="bg-white"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: 'rgb(37, 99, 235)',
                                  },
                                },
                              }}
                            />
                            <FormControl fullWidth className="bg-white">
              <InputLabel>Post Types</InputLabel>
              <Select
                multiple
                value={wordpressConfig.postTypes || []}
                                onChange={(e: SelectChangeEvent<string[]>) => 
                                  setWordPressConfig({
                                    ...wordpressConfig,
                                    postTypes: e.target.value as string[],
                                  })
                                }
                label="Post Types"
                                sx={{
                                  '&:hover fieldset': {
                                    borderColor: 'rgb(37, 99, 235)',
                                  },
                                }}
              >
                <MenuItem value="post">Posts</MenuItem>
                <MenuItem value="page">Pages</MenuItem>
                <MenuItem value="custom">Custom Post Types</MenuItem>
              </Select>
            </FormControl>
                          </motion.div>
                        )}

                        {integrationType === 'notion' && (
                          <motion.div
                            key="notion"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                          >
                            <TextField
                              fullWidth
                              required
                              label="Notion Access Token"
                              value={notionConfig.accessToken}
                              onChange={(e) => setNotionConfig({ ...notionConfig, accessToken: e.target.value })}
                              type="password"
                              className="bg-white"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: 'rgb(37, 99, 235)',
                                  },
                                },
                              }}
                            />
                            <TextField
                              fullWidth
                              required
                              label="Database ID"
                              value={notionConfig.databaseId}
                              onChange={(e) => setNotionConfig({ ...notionConfig, databaseId: e.target.value })}
                              className="bg-white"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: 'rgb(37, 99, 235)',
                                  },
                                },
                              }}
                              helperText={
                                <div className="flex items-center mt-1">
                                  <span className="text-gray-600">Find this in your Notion database URL</span>
                                  <Tooltip title="The database ID is the string of characters in your Notion database URL after the last slash">
                                    <HelpIcon className="ml-1 w-4 h-4 text-gray-400" />
                                  </Tooltip>
                                </div>
                              }
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div>
                    <div className="text-center max-w-2xl mx-auto mb-8">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Review and Connect
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Review your integration settings before connecting
                      </p>
                    </div>
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600`}>
                            {getIntegrationIcon(integrationType)}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {integrationType === 'google_docs' && 'Google Docs'}
                              {integrationType === 'wordpress' && 'WordPress'}
                              {integrationType === 'notion' && 'Notion'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {integrationType === 'google_docs' && 'Connect to your Google Drive'}
                              {integrationType === 'wordpress' && wordpressConfig.siteUrl}
                              {integrationType === 'notion' && 'Connect to your Notion workspace'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h5 className="text-sm font-medium text-gray-900 mb-4">Integration Details</h5>
                          <dl className="grid grid-cols-1 gap-4">
                            {integrationType === 'google_docs' && (
                              <div className="flex justify-between py-2 text-sm">
                                <dt className="text-gray-500">Folder ID</dt>
                                <dd className="text-gray-900">{googleConfig.folderId || 'Root folder'}</dd>
                              </div>
                            )}
                            {integrationType === 'wordpress' && (
                              <>
                                <div className="flex justify-between py-2 text-sm">
                                  <dt className="text-gray-500">Site URL</dt>
                                  <dd className="text-gray-900">{wordpressConfig.siteUrl}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm">
                                  <dt className="text-gray-500">Post Types</dt>
                                  <dd className="text-gray-900">{wordpressConfig.postTypes?.join(', ')}</dd>
                                </div>
                              </>
                            )}
                            {integrationType === 'notion' && (
                              <div className="flex justify-between py-2 text-sm">
                                <dt className="text-gray-500">Database ID</dt>
                                <dd className="text-gray-900">{notionConfig.databaseId}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <h5 className="text-sm font-medium text-blue-800">Ready to Connect</h5>
                            <p className="mt-1 text-sm text-blue-700">
                              Click Connect to finalize the integration setup. This will establish a secure connection with your account.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
      </DialogContent>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              {activeStep > 0 && (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back
                </button>
              )}
              {activeStep === steps.length - 1 ? (
                <button
          onClick={handleSubmit}
          disabled={loading}
                  className={`inline-flex items-center px-6 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                  }`}
                >
                  {loading && (
                    <CircularProgress
                      size={16}
                      thickness={4}
                      sx={{ color: 'white', mr: 2 }}
                    />
                  )}
          {loading ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                  <ArrowForwardIcon className="ml-2 w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
    </Dialog>
    </MotionConfig>
  );
};

export default AddIntegrationDialog; 