import { Grid, Card, CardContent, Typography, Box, Table, Chip } from '@mui/joy';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { fetchAnalyticsData, fetchVisitorTrends, TimeRange } from '../services/analyticsService';
import { useWebsite } from '../contexts/WebsiteContext';
import { Select, Option } from '@mui/joy';

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [visitorTrendData, setVisitorTrendData] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  const { selectedWebsite } = useWebsite();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analytics = await fetchAnalyticsData();
        setAnalyticsData(analytics);
        // Fetch initial visitor trends
        const trends = await fetchVisitorTrends(timeRange);
        setVisitorTrendData(trends);
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

  const handleTimeRangeChange = async (newRange: TimeRange) => {
    try {
      setLoadingTrends(true);
      setTimeRange(newRange);
      const trends = await fetchVisitorTrends(newRange);
      setVisitorTrendData(trends);
    } catch (err) {
      console.error('Error fetching visitor trends:', err);
    } finally {
      setLoadingTrends(false);
    }
  };

  if (loading) {
    return <div>Loading analytics data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const metrics = [
    { 
      title: 'Total Visitors', 
      value: analyticsData?.currentPeriod?.uniqueVisitors?.toLocaleString() || '0', 
      change: analyticsData?.changes?.uniqueVisitors + '%' || '0%' 
    },
    { 
      title: 'Average Session Duration', 
      value: `${analyticsData?.currentPeriod?.avgSessionDuration || '0'}s`, 
      change: '0%' 
    },
    { 
      title: 'Bounce Rate', 
      value: `${analyticsData?.currentPeriod?.bounceRate || '0'}%`, 
      change: '0%' 
    },
    { 
      title: 'Page Views', 
      value: analyticsData?.currentPeriod?.totalPageViews?.toLocaleString() || '0', 
      change: analyticsData?.changes?.totalPageViews + '%' || '0%' 
    }
  ];

  const visitorData = analyticsData?.visitorsByTime || [];
  const activePages = analyticsData?.topPages || [];
  const devices = analyticsData?.deviceAnalytics?.deviceDistribution || [];
  const browsers = analyticsData?.deviceAnalytics?.browserUsage || [];
  const operatingSystems = analyticsData?.deviceAnalytics?.operatingSystems || [];
  const recentActivity = analyticsData?.recentActivity || [];

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
            <Card variant="outlined" sx={{
              height: '100%',
              transition: 'none'
            }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography level="body-sm" sx={{ mb: 0.5, color: 'text.secondary' }}>
                  {metric.title}
                </Typography>
                <Typography level="h3" sx={{ mb: 0.5, fontWeight: 700 }}>{metric.value}</Typography>
                <Typography 
                  level="body-sm" 
                  sx={{ 
                    color: metric.change.startsWith('-') ? 'danger.500' : 'success.500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {metric.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ mb: 2, overflow: 'hidden', borderRadius: '8px' }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Typography level="h3">Visitor Trends</Typography>
            <Select
              value={timeRange}
              onChange={(_, value) => value && handleTimeRangeChange(value as TimeRange)}
              size="sm"
              sx={{
                minWidth: 150,
                bgcolor: 'background.level1'
              }}
            >
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
              <Option value="yearly">Yearly</Option>
            </Select>
          </Box>
          {loadingTrends ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography>Loading trend data...</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={visitorTrendData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--joy-palette-neutral-200)" opacity={0.5} />
                <XAxis
                  dataKey="time"
                  stroke="var(--joy-palette-text-secondary)"
                  tick={{ fill: 'var(--joy-palette-text-secondary)' }}
                  tickFormatter={(time) => time}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  stroke="var(--joy-palette-text-secondary)"
                  tick={{ fill: 'var(--joy-palette-text-secondary)' }}
                  tickFormatter={(value) => value.toLocaleString()}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--joy-palette-background-surface)',
                    border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                  formatter={(value) => [value.toLocaleString(), 'Visitors']}
                  labelFormatter={(time) => `Time: ${time}`}
                  cursor={{ stroke: 'var(--joy-palette-primary-500)', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="var(--joy-palette-primary-500)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: 'var(--joy-palette-background-surface)',
                    stroke: 'var(--joy-palette-primary-500)',
                    strokeWidth: 2
                  }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h3" sx={{ mb: 2, fontWeight: 700 }}>
                Top Pages
              </Typography>
              <Table
                sx={{
                  '--TableCell-paddingX': '6px',
                  '--TableCell-paddingY': '6px',
                  '& th': {
                    fontWeight: 600,
                    color: 'text.secondary',
                    backgroundColor: 'background.level1',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    fontSize: 'sm'
                  },
                  '& td': {
                    borderColor: 'divider',
                    fontSize: 'sm'
                  }
                }}
              >
                <thead>
                  <tr>
                    <th>Page</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Views</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activePages.map((page, index) => (
                    <tr key={index}>
                      <td>
                        <Typography level="body-sm" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {page.url}
                        </Typography>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Typography level="body-sm">
                          {page.views.toLocaleString()}
                        </Typography>
                        {/* <Typography level="body-xs" sx={{ color: page.change.startsWith('-') ? 'danger.500' : 'success.500' }}>
                          {page.change}
                        </Typography> */}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                          {page.avgTimeOnPage || '0s'}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      
        <Grid xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h3" sx={{ mb: 2, fontWeight: 700 }}>
                User Activity
              </Typography>
              <Table
                sx={{
                  '--TableCell-paddingX': '6px',
                  '--TableCell-paddingY': '6px',
                  '& th': {
                    fontWeight: 600,
                    color: 'text.secondary',
                    backgroundColor: 'background.level1',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    fontSize: 'sm'
                  },
                  '& td': {
                    borderColor: 'divider',
                    fontSize: 'sm'
                  }
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Time</th>
                    <th style={{ width: '100px' }}>Type</th>
                    <th>Action</th>
                    <th>Page</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity, index) => (
                    <tr key={index}>
                      <td>
                        <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                          {activity.timestamp}
                        </Typography>
                      </td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={activity.type ? (activity.type === 'page_view' ? 'primary' : activity.type === 'click' ? 'success' : 'neutral') : 'neutral'}
                          sx={{ fontSize: 'xs' }}
                        >
                          {activity.type || 'page_view'}
                        </Chip>
                      </td>
                      <td>
                        <Typography level="body-sm" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                          {activity.action}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-sm" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {activity.page}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h3" sx={{ mb: 2, fontWeight: 700 }}>
                Device Distribution
              </Typography>
              {devices.map((device, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>{device.type}</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 600 }}>{device.percentage}%</Typography>
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
                        width: `${device.percentage}%`,
                        height: '100%',
                        bgcolor: 'primary.500'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h3" sx={{ mb: 2, fontWeight: 700 }}>
                Browser Usage
              </Typography>
              {browsers.map((browser, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>{browser.name}</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 600 }}>{browser.percentage}%</Typography>
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
                        width: `${browser.percentage}%`,
                        height: '100%',
                        bgcolor: 'success.500'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h3" sx={{ mb: 2, fontWeight: 700 }}>
                Operating Systems
              </Typography>
              {operatingSystems.map((os, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>{os.name}</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 600 }}>{os.percentage}%</Typography>
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
                        width: `${os.percentage}%`,
                        height: '100%',
                        bgcolor: 'warning.500'
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}