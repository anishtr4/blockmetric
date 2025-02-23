import { Grid, Card, CardContent, Typography, Box, Table, Chip } from '@mui/joy';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const visitorData = [
  { time: '12:00', visitors: 400 },
  { time: '13:00', visitors: 300 },
  { time: '14:00', visitors: 500 },
  { time: '15:00', visitors: 450 },
  { time: '16:00', visitors: 600 },
  { time: '17:00', visitors: 550 },
];

const metrics = [
  { title: 'Total Visitors', value: '1.2K', change: '+12.5%' },
  { title: 'Average Session Duration', value: '4m 30s', change: '+8.3%' },
  { title: 'Bounce Rate', value: '32.4%', change: '-3.2%' },
  { title: 'Page Views', value: '4.6K', change: '+15.7%' }
];

const activePages = [
  { page: '/homepage', views: 12453, change: '+5.2%' },
  { page: '/products', views: 8765, change: '+3.1%' },
  { page: '/about', views: 6234, change: '-1.4%' },
  { page: '/contact', views: 4523, change: '+2.8%' }
];

const userActivity = [
  { time: 'Just now', user: 'Anonymous', location: 'New York, US', action: 'Page View', page: '/products' },
  { time: '1m ago', user: 'Anonymous', location: 'London, UK', action: 'Click', page: '/checkout' },
  { time: '2m ago', user: 'Anonymous', location: 'Paris, FR', action: 'Page View', page: '/homepage' }
];

// Add performance metrics data
const performanceMetrics = {
  pageLoad: { time: '1.8s', status: 'Good', average: '2.3s' },
  firstPaint: { time: '2.1s', status: 'Fair', average: '1.8s' },
  interactive: { time: '3.2s', status: 'Good', average: '3.9s' }
};

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

export default function Dashboard() {
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
                <Typography level="body-xs">{metric.title}</Typography>
                <Typography level="h2">{metric.value}</Typography>
                <Typography 
                  level="body-sm" 
                  sx={{ 
                    color: metric.change.startsWith('+') ? 'success.main' : 'danger.main',
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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>
                Visitors Over Time
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={visitorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="visitors" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>
                Top Pages
              </Typography>
              {activePages.map((page) => (
                <Box key={page.page} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, justifyContent: 'space-between' }}>
                  <Box>
                    <Typography level="body-sm">{page.page}</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      {page.views.toLocaleString()} views
                    </Typography>
                  </Box>
                  <Typography 
                    level="body-sm" 
                    sx={{ 
                      color: page.change.startsWith('+') ? 'success.main' : 'danger.main'
                    }}
                  >
                    {page.change}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="body-sm" sx={{ mb: 2 }}>Devices</Typography>
              {devices.map((item) => (
                <Box key={item.type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography level="body-xs">{item.type}</Typography>
                  <Typography level="body-xs">{item.percentage}%</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="body-sm" sx={{ mb: 2 }}>Browsers</Typography>
              {browsers.map((item) => (
                <Box key={item.name} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-xs">{item.name}</Typography>
                    <Typography level="body-xs">{item.percentage}%</Typography>
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
        <Grid xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="body-sm" sx={{ mb: 2 }}>Operating Systems</Typography>
              {operatingSystems.map((item) => (
                <Box key={item.name} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="body-xs">{item.name}</Typography>
                    <Typography level="body-xs">{item.percentage}%</Typography>
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
                        bgcolor: '#9c27b0',
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

      <Card>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2 }}>Recent Activity</Typography>
          <Table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Location</th>
                <th>Action</th>
                <th>Page</th>
              </tr>
            </thead>
            <tbody>
              {userActivity.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.time}</td>
                  <td>{activity.location}</td>
                  <td>{activity.action}</td>
                  <td>{activity.page}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}