import { Box, Card, CardContent, Typography, FormControl, FormLabel, Input, Switch, Select, Option, Button, Sheet, Avatar, Grid } from '@mui/joy';
import ApiKeyManager from '../components/ApiKeyManager';

export default function Settings() {
  return (
    <Box sx={{ py: 2 }}>
      <Typography level="h2" sx={{ mb: 1 }}>
        Settings
      </Typography>
      <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
        Manage your analytics preferences and configurations
      </Typography>

      <Grid container spacing={2}>
        <Grid xs={12}>
          <Card>
            <CardContent>
              <ApiKeyManager />
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h4" component="h3" sx={{ mb: 2 }}>
                Website Tracking
              </Typography>
              <FormControl sx={{ mb: 3 }}>
                <FormLabel>Tracking ID</FormLabel>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Input
                    value="UA-XXXXXXXXX-X"
                    sx={{ flexGrow: 1 }}
                    readOnly
                  />
                  <Button variant="solid" color="primary">
                    Copy
                  </Button>
                </Box>
              </FormControl>
              <FormControl>
                <FormLabel>Tracking Script</FormLabel>
                <Input
                  value="<script src=\"https://analytics.example.com/tracker.js\"></script>"
                  sx={{ fontFamily: 'monospace' }}
                  readOnly
                />
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h4" component="h3" sx={{ mb: 2 }}>
                Data Collection
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography level="body-sm">Page Views</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      Track individual page views
                    </Typography>
                  </Box>
                  <Switch defaultChecked />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography level="body-sm">User Sessions</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      Track user session duration
                    </Typography>
                  </Box>
                  <Switch />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography level="body-sm">Event Tracking</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      Track custom events and interactions
                    </Typography>
                  </Box>
                  <Switch defaultChecked />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography level="h4" component="h3" sx={{ mb: 2 }}>
                Data Retention
              </Typography>
              <FormControl>
                <FormLabel>Retention Period</FormLabel>
                <Select defaultValue="14">
                  <Option value="7">7 days</Option>
                  <Option value="14">14 months</Option>
                  <Option value="30">30 days</Option>
                  <Option value="90">90 days</Option>
                  <Option value="365">1 year</Option>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}