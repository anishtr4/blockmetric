import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/joy';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchAnalyticsData, fetchVisitorDemographics, fetchUserMetrics } from '../services/analyticsService';

export default function Analytics() {
  const selectedWebsite = useSelector((state: RootState) => state.website.selectedWebsite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demographicsData, setDemographicsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedWebsite) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [analytics, demographics, metrics] = await Promise.all([
          fetchAnalyticsData(),
          fetchVisitorDemographics(),
          fetchUserMetrics()
        ]);
        
        setAnalyticsData(analytics);
        setDemographicsData(demographics);
        setUserMetrics(metrics);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedWebsite]); // Re-fetch when selected website changes

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="danger">{error}</Typography>;
  }

  if (!selectedWebsite) {
    return <Typography>Please select a website to view analytics</Typography>;
  }

  const deviceSpeeds = [
    { device: 'Desktop', speed: '1.2s', status: 'good' },
    { device: 'Mobile', speed: '2.8s', status: 'fair' },
    { device: 'Tablet', speed: '1.9s', status: 'good' }
  ];

  const webVitals = [
    { name: 'LCP', value: '2.1s' },
    { name: 'FID', value: '75ms' },
    { name: 'CLS', value: '0.1' }
  ];

  const optimization = [
    { name: 'Compression', status: 'Enabled' },
    { name: 'Minification', status: 'Enabled' },
    { name: 'Cache Status', status: 'Active' }
  ];

  // Use real data from the API response
  const devices = analyticsData?.deviceStats || [];
  const browsers = analyticsData?.browserStats || [];
  const operatingSystems = analyticsData?.osStats || [];

  return (
    <Box sx={{ py: 3 }}>
      <Typography level="h2" sx={{ mb: 3 }}>
        Analytics Overview
      </Typography>

      <Grid container spacing={3}>
        {/* User Metrics Section */}
        <Grid xs={12}>
          <Typography level="h4" sx={{ mb: 2 }}>Usage Metrics</Typography>
          <Grid container spacing={2}>
            <Grid xs={12} sm={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Typography level="h5" sx={{ mb: 2 }}>Monthly Active Users</Typography>
                  <Box>
                    <Typography level="h2" sx={{ mb: 1 }}>{userMetrics?.mau || '0'}</Typography>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                      vs. last month: {userMetrics?.mauChange || '0%'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Typography level="h5" sx={{ mb: 2 }}>Daily Active Users</Typography>
                  <Box>
                    <Typography level="h2" sx={{ mb: 1 }}>{userMetrics?.dau || '0'}</Typography>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                      vs. yesterday: {userMetrics?.dauChange || '0%'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Typography level="h5" sx={{ mb: 2 }}>Hourly Active Users</Typography>
                  <Box>
                    <Typography level="h2" sx={{ mb: 1 }}>{userMetrics?.hau || '0'}</Typography>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                      vs. last hour: {userMetrics?.hauChange || '0%'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Geographic Distribution */}
        <Grid xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Geographic Distribution</Typography>
              {demographicsData?.geographicDistribution?.map((location) => (
                <Box key={location.country} sx={{ mb: 2 }}>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{location.name}</Typography>
                    <Typography>{location.percentage}%</Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: '8px',
                      bgcolor: 'background.level2',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        width: `${location.percentage}%`,
                        height: '100%',
                        bgcolor: 'primary.500'
                      }}
                    />
                  </Box>
                </Box>
              )) || (
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  No geographic data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics and Web Vitals Row */}
        <Grid xs={12} container spacing={2}>
          {/* Performance Metrics */}
          <Grid xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography level="h4" sx={{ mb: 2 }}>Performance Metrics</Typography>
                <Grid container spacing={2}>
                  {deviceSpeeds.map((item) => (
                    <Grid xs={12} md={4} key={item.device}>
                      <Box sx={{ mb: 2 }}>
                        <Typography level="h5" sx={{ mb: 1 }}>{item.device}</Typography>
                        <Typography level="h3" sx={{ mb: 1 }}>{item.speed}</Typography>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={item.status === 'good' ? 'success' : 'warning'}
                        >
                          {item.status}
                        </Chip>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Web Vitals */}
          <Grid xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography level="h4" sx={{ mb: 2 }}>Web Vitals</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {webVitals.map((vital) => (
                    <Box key={vital.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography level="h5">{vital.name}</Typography>
                      <Typography level="h5">{vital.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}