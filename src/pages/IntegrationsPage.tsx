import React, { useState } from 'react';
import { Container, Box, Tab, Tabs } from '@mui/material';
import IntegrationsList from '../components/integrations/IntegrationsList';
import ContentPostsList from '../components/integrations/ContentPostsList';

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

const IntegrationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="integration tabs"
          >
            <Tab label="Content Sources" {...a11yProps(0)} />
            <Tab label="Content Posts" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <IntegrationsList
            onSourceSelect={(sourceId) => {
              setSelectedSourceId(sourceId);
              setTabValue(1);
            }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ContentPostsList sourceId={selectedSourceId} />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default IntegrationsPage; 