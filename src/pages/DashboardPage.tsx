import React from 'react';
import { Box, Typography } from '@mui/material';

const DashboardPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        Welcome to your social media dashboard. Here you'll find an overview of your content and performance.
      </Typography>
    </Box>
  );
};

export default DashboardPage; 