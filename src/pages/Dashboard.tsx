import { Grid, Card, CardContent, Typography, Box, Table, Chip } from '@mui/joy';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { fetchAnalyticsData, fetchVisitorDemographics } from '../services/analyticsService';
import { useWebsite } from '../contexts/WebsiteContext';

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedWebsite, websites } = useWebsite();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analytics = await fetchAnalyticsData();
        setAnalyticsData(analytics);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedWebsite) {
      fetchData();
    }
  }, [selectedWebsite]);

  if (loading) {
    return <div>Loading analytics data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const metrics = [
    { 
      title: 'Total Visitors', 
      value: analyticsData?.uniqueVisitors?.toLocaleString() || '0', 
      change: analyticsData?.visitorChange || '0%' 
    },
    { 
      title: 'Average Session Duration', 
      value: analyticsData?.averageSessionDuration || '0s', 
      change: analyticsData?.sessionDurationChange || '0%' 
    },
    { 
      title: 'Bounce Rate', 
      value: analyticsData?.bounceRate?.toFixed(1) + '%' || '0%', 
      change: analyticsData?.bounceRateChange || '0%' 
    },
    { 
      title: 'Page Views', 
      value: analyticsData?.pageViews?.toLocaleString() || '0', 
      change: analyticsData?.pageViewsChange || '0%' 
    }
  ];

  const visitorData = analyticsData?.visitorsByTime || [];
  const activePages = analyticsData?.topPages || [];
  const devices = analyticsData?.deviceStats || [];
  const browsers = analyticsData?.browserStats || [];
  const operatingSystems = analyticsData?.osStats || [];
  const userActivity = analyticsData?.userActivity || [];

  return (
    <Box sx={{ py: 2 }}>
      <Typography level="h2" sx={{ mb: 3 }}>
        Overview
      </Typography>
      <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
        Analytics summary for the last 30 days
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metrics.map((metric, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography level="body-sm" sx={{ mb: 1 }}>
                  {metric.title}
                </Typography>
                <Typography level="h3">{metric.value}</Typography>
                <Typography 
                  level="body-sm" 
                  sx={{ 
                    color: metric.change.startsWith('-') ? 'danger.500' : 'success.500'
                  }}
                >
                  {metric.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h3" sx={{ mb: 2 }}>
            Visitor Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visitorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h3" sx={{ mb: 2 }}>
                Top Pages
              </Typography>
              <Table>
                {/* Table content */}
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h3" sx={{ mb: 2 }}>
                User Activity
              </Typography>
              <Table>
                {/* Table content */}
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}