import React from 'react';
import { Box, Typography } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1">
        Configure your account settings, notifications, and platform preferences.
      </Typography>
    </Box>
  );
};

export default SettingsPage; 