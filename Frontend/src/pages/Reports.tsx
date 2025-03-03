import { Box, Card, CardContent, Typography, FormControl, FormLabel, Input, Select, Option, Checkbox, Button, Table, Grid } from '@mui/joy';
import { useState } from 'react';

export default function Reports() {
  const [reportName, setReportName] = useState('');
  const [dateRange, setDateRange] = useState('7');
  const [format, setFormat] = useState('PDF');
  const [metrics, setMetrics] = useState({
    pageViews: true,
    uniqueVisitors: true,
    bounceRate: true,
    conversionRate: false
  });

  const handleGenerateReport = () => {
    // Implement report generation logic
    console.log('Generating report with:', { reportName, dateRange, format, metrics });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography level="h2" sx={{ mb: 1 }}>
        Reports
      </Typography>
      <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
        Generate and schedule custom analytics reports
      </Typography>

      <Grid container spacing={2}>
        <Grid xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography level="h4" component="h3" sx={{ mb: 3 }}>
                Create New Report
              </Typography>
              
              <FormControl sx={{ mb: 2 }}>
                <FormLabel>Report Name</FormLabel>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Monthly Traffic Overview"
                />
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Date Range</FormLabel>
                  <Select value={dateRange} onChange={(e, value) => setDateRange(value || '7')}>
                    <Option value="7">Last 7 days</Option>
                    <Option value="30">Last 30 days</Option>
                    <Option value="90">Last 90 days</Option>
                    <Option value="365">Last 365 days</Option>
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Format</FormLabel>
                  <Select value={format} onChange={(e, value) => setFormat(value || 'PDF')}>
                    <Option value="PDF">PDF</Option>
                    <Option value="CSV">CSV</Option>
                    <Option value="EXCEL">Excel</Option>
                  </Select>
                </FormControl>
              </Box>

              <Typography level="body-sm" sx={{ mb: 1 }}>Metrics to Include</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Checkbox
                  label="Page Views"
                  checked={metrics.pageViews}
                  onChange={(e) => setMetrics({ ...metrics, pageViews: e.target.checked })}
                />
                <Checkbox
                  label="Unique Visitors"
                  checked={metrics.uniqueVisitors}
                  onChange={(e) => setMetrics({ ...metrics, uniqueVisitors: e.target.checked })}
                />
                <Checkbox
                  label="Bounce Rate"
                  checked={metrics.bounceRate}
                  onChange={(e) => setMetrics({ ...metrics, bounceRate: e.target.checked })}
                />
                <Checkbox
                  label="Conversion Rate"
                  checked={metrics.conversionRate}
                  onChange={(e) => setMetrics({ ...metrics, conversionRate: e.target.checked })}
                />
              </Box>

              <Button
                variant="solid"
                color="primary"
                onClick={handleGenerateReport}
              >
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography level="h4" component="h3" sx={{ mb: 2 }}>
                Scheduled Reports
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: 'sm', mb: 1 }}>
                  <Typography level="body-sm" fontWeight="bold">Weekly Traffic Report</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    Every Monday at 9:00 AM
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: 'sm' }}>
                  <Typography level="body-sm" fontWeight="bold">Monthly Performance</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    1st of every month
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                color="neutral"
                fullWidth
              >
                Add Schedule
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography level="h4" component="h3" sx={{ mb: 2 }}>
                Recent Reports
              </Typography>

              <Table>
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Date Range</th>
                    <th>Generated</th>
                    <th>Format</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Q4 Performance Report</td>
                    <td>Oct 1 - Dec 31</td>
                    <td>Jan 1, 2024</td>
                    <td>PDF</td>
                    <td>
                      <Button
                        size="sm"
                        variant="plain"
                        color="primary"
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>User Behavior Analysis</td>
                    <td>Dec 1 - Dec 31</td>
                    <td>Jan 2, 2024</td>
                    <td>Excel</td>
                    <td>
                      <Button
                        size="sm"
                        variant="plain"
                        color="primary"
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>Traffic Sources Summary</td>
                    <td>Dec 15 - Jan 15</td>
                    <td>Jan 16, 2024</td>
                    <td>CSV</td>
                    <td>
                      <Button
                        size="sm"
                        variant="plain"
                        color="primary"
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}