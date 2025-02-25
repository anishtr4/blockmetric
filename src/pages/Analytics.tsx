import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/joy';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchAnalyticsData, fetchVisitorDemographics } from '../services/analyticsService';

export default function Analytics() {
  const selectedWebsite = useSelector((state: RootState) => state.website.selectedWebsite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demographicsData, setDemographicsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedWebsite) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [analytics, demographics] = await Promise.all([
          fetchAnalyticsData(),
          fetchVisitorDemographics()
        ]);
        
        setAnalyticsData(analytics);
        setDemographicsData(demographics);
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

  const resourceLoading = [
    { type: 'HTML', time: '0.3s' },
    { type: 'CSS', time: '0.5s' },
    { type: 'JavaScript', time: '1.2s' },
    { type: 'Images', time: '2.1s' }
  ];

  const serverMetrics = [
    { name: 'TTFB', value: '180ms' },
    { name: 'DNS Lookup', value: '45ms' },
    { name: 'TCP Connection', value: '120ms' }
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

  const visitorDemographics = [
    { ageGroup: '18-24', percentage: 35 },
    { ageGroup: '25-34', percentage: 45 },
    { ageGroup: '35-44', percentage: 20 }
  ];

  const geographicDistribution = [
    { country: 'United States', visitors: 45234 },
    { country: 'United Kingdom', visitors: 32651 },
    { country: 'Germany', visitors: 24856 }
  ];

  const devices = [
    { type: 'Mobile', percentage: 65 },
    { type: 'Desktop', percentage: 30 },
    { type: 'Tablet', percentage: 5 }
  ];

  const browsers = [
    { name: 'Chrome', percentage: 60 },
    { name: 'Safari', percentage: 25 },
    { name: 'Firefox', percentage: 15 }
  ];

  const operatingSystems = [
    { name: 'iOS', percentage: 40 },
    { name: 'Android', percentage: 35 },
    { name: 'Windows', percentage: 25 }
  ];

  return (
    <Box sx={{ py: 2 }}>
      <Typography level="h2" sx={{ mb: 3 }}>
        Performance Metrics
      </Typography>
      <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
        Website speed and performance analysis
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {performanceMetrics && Object.entries(performanceMetrics).map(([key, data]) => (
          <Grid xs={12} md={4} key={key}>
            <Card>
              <CardContent>
                <Typography level="body-sm" sx={{ mb: 1 }}>
                  {key === 'pageLoad' ? 'Page Load Time' :
                   key === 'firstPaint' ? 'First Contentful Paint' :
                   'Time to Interactive'}
                </Typography>
                <Typography level="h2" sx={{ mb: 1 }}>{data.time}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={data.status === 'Good' ? 'success' : 'warning'}
                  >
                    {data.status}
                  </Chip>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    vs. {data.average} industry average
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography level="h2" sx={{ mb: 3 }}>
        Visitor Demographics
      </Typography>
      <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
        Detailed visitor demographics and behavior analysis
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Age Distribution</Typography>
              {visitorDemographics.map((item) => (
                <Box key={item.ageGroup} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-sm">{item.ageGroup}</Typography>
                    <Typography level="body-sm">{item.percentage}%</Typography>
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
                        width: `${item.percentage}%`,
                        height: '100%',
                        bgcolor: '#2196f3',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Geographic Distribution</Typography>
              {geographicDistribution.map((item) => (
                <Box key={item.country} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-sm">{item.country}</Typography>
                    <Typography level="body-sm">{item.visitors.toLocaleString()}</Typography>
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
                        width: `${(item.visitors / Math.max(...geographicDistribution.map(x => x.visitors)) * 100)}%`,
                        height: '100%',
                        bgcolor: '#4caf50',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography level="h2" sx={{ mb: 3 }}>
        Technical Performance
      </Typography>
      <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
        Detailed technical metrics and performance analysis
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Page Speed by Device</Typography>
              {deviceSpeeds.map((device) => (
                <Box key={device.device} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-sm">{device.device}</Typography>
                    <Typography level="body-sm">{device.speed}</Typography>
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
                        width: device.device === 'Desktop' ? '80%' : device.device === 'Mobile' ? '60%' : '70%',
                        height: '100%',
                        bgcolor: device.status === 'good' ? 'success.500' : 'warning.500',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Resource Loading</Typography>
              {resourceLoading.map((resource) => (
                <Box
                  key={resource.type}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography level="body-sm">{resource.type}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography level="body-sm">{resource.time}</Typography>
                    <Box
                      sx={{
                        width: '100px',
                        height: '8px',
                        bgcolor: 'background.level2',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: resource.type === 'HTML' ? '90%' : 
                                resource.type === 'CSS' ? '85%' : 
                                resource.type === 'JavaScript' ? '70%' : '50%',
                          height: '100%',
                          bgcolor: resource.type === 'HTML' ? '#2196f3' : 
                                  resource.type === 'CSS' ? '#2196f3' : 
                                  resource.type === 'JavaScript' ? '#ffc107' : '#f44336',
                          transition: 'width 0.5s ease-in-out'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Server Response</Typography>
              {serverMetrics.map((metric) => (
                <Box
                  key={metric.name}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography level="body-sm">{metric.name}</Typography>
                  <Typography level="body-sm">{metric.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Core Web Vitals</Typography>
              {webVitals.map((vital) => (
                <Box
                  key={vital.name}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography level="body-sm">{vital.name}</Typography>
                  <Typography level="body-sm">{vital.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Asset Optimization</Typography>
              {optimization.map((opt) => (
                <Box
                  key={opt.name}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography level="body-sm">{opt.name}</Typography>
                  <Typography
                    level="body-sm"
                    sx={{ color: 'success.main' }}
                  >
                    {opt.status}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}