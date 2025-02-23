import { Box, Card, CardContent, Typography, FormControl, FormLabel, Input, Switch, Select, Option, Button, Sheet, Avatar } from '@mui/joy';

export default function Settings() {
  return (
    <Box sx={{ py: 2 }}>
      <Typography level="h2" sx={{ mb: 1 }}>
        Settings
      </Typography>
      <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
        Manage your analytics preferences and configurations
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" component="h3" sx={{ mb: 2 }}>
            API Access
          </Typography>
          <FormControl sx={{ mb: 3 }}>
            <FormLabel>API Key</FormLabel>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Input
                value="sk_live_xxxxxxxxxxxxxxxx"
                sx={{ flexGrow: 1 }}
                readOnly
              />
              <Button variant="solid" color="primary">
                Copy
              </Button>
            </Box>
          </FormControl>
          <FormControl>
            <FormLabel>Webhook URL</FormLabel>
            <Input
              value="https://api.example.com/webhook"
              sx={{ fontFamily: 'monospace' }}
              readOnly
            />
          </FormControl>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
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

      <Card sx={{ mb: 3 }}>
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

      <Card sx={{ mb: 3 }}>
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

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography level="h4" component="h3" sx={{ mb: 2 }}>
              User Access
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar size="sm" />
              <Box sx={{ flex: 1 }}>
                <Typography level="body-sm">John Doe</Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  Admin
                </Typography>
              </Box>
              <Button variant="plain" color="neutral" size="sm">
                Edit
              </Button>
            </Box>
            <Button
              variant="outlined"
              color="neutral"
              fullWidth
            >
              Add User
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography level="h4" component="h3" sx={{ mb: 2 }}>
              Danger Zone
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                color="danger"
                variant="solid"
                fullWidth
              >
                Delete All Data
              </Button>
              <Button
                color="danger"
                variant="outlined"
                fullWidth
              >
                Remove Website
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}