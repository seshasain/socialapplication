export const generateMockAnalytics = (timeRange: string) => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const platforms = ['instagram', 'facebook'];
    const analytics = [];
  
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
  
      platforms.forEach(platform => {
        analytics.push({
          date: date.toISOString(),
          platform,
          reach: Math.floor(Math.random() * 10000) + 1000,
          impressions: Math.floor(Math.random() * 15000) + 2000,
          engagement: Math.floor(Math.random() * 5000) + 500,
          shares: Math.floor(Math.random() * 1000) + 100
        });
      });
    }
  
    const totals = analytics.reduce((acc, curr) => ({
      reach: acc.reach + curr.reach,
      impressions: acc.impressions + curr.impressions,
      engagement: acc.engagement + curr.engagement,
      shares: acc.shares + curr.shares
    }), { reach: 0, impressions: 0, engagement: 0, shares: 0 });
  
    return {
      timeRange,
      analytics,
      totals
    };
  };
  