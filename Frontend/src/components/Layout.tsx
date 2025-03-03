import { Box, Sheet, List, ListItem, ListItemButton, ListItemDecorator, Typography, IconButton, Switch } from '@mui/joy';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useColorScheme } from '@mui/joy/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useWebsite } from '../contexts/WebsiteContext';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import LanguageIcon from '@mui/icons-material/Language';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { mode, setMode } = useColorScheme();
  const { selectedWebsite, setSelectedWebsite } = useWebsite();

  const { websites, loading } = useWebsite();
  
  const websiteOptions = [
    { id: 'all', name: 'All Websites' },
    ...websites.map(site => ({
      id: site.id,
      name: site.domain
    }))
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Sheet
        sx={{
          width: 240,
          p: 2,
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 1000,
          bgcolor: 'background.surface',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Typography
          level="h4"
          component="div"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: 'primary.main',
            letterSpacing: '0.5px'
          }}
        >
          BlockMetric
        </Typography>

        <Select
          placeholder="Select Website"
          value={selectedWebsite?.id}
          onChange={(_, value) => setSelectedWebsite(value as string)}
          startDecorator={<LanguageIcon />}
          sx={{ mb: 2 }}
        >
          {websites.map((website) => (
            <Option key={website.id} value={website.id}>
              {website.name}
            </Option>
          ))}
        </Select>
        <List
          sx={{
            '--ListItem-radius': '8px',
            '--ListItemDecorator-size': '32px',
            gap: 0.5
          }}
        >
          <ListItem>
            <ListItemButton
              selected={location.pathname === '/'}
              onClick={() => navigate('/')}
              sx={{
                fontWeight: location.pathname === '/' ? 'bold' : 'normal',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'background.level1' }
              }}
            >
              <ListItemDecorator>
                <DashboardIcon />
              </ListItemDecorator>
              Dashboard
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              selected={location.pathname === '/analytics'}
              onClick={() => navigate('/analytics')}
              sx={{
                fontWeight: location.pathname === '/analytics' ? 'bold' : 'normal',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'background.level1' }
              }}
            >
              <ListItemDecorator>
                <TimelineIcon />
              </ListItemDecorator>
              Analytics
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              selected={location.pathname === '/reports'}
              onClick={() => navigate('/reports')}
              sx={{
                fontWeight: location.pathname === '/reports' ? 'bold' : 'normal',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'background.level1' }
              }}
            >
              <ListItemDecorator>
                <AssessmentIcon />
              </ListItemDecorator>
              Reports
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              selected={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
              sx={{
                fontWeight: location.pathname === '/settings' ? 'bold' : 'normal',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'background.level1' }
              }}
            >
              <ListItemDecorator>
                <SettingsIcon />
              </ListItemDecorator>
              Settings
            </ListItemButton>
          </ListItem>
        </List>
        <Box sx={{ mt: 'auto', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              mb: 1
            }}
          >
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Theme
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DarkModeIcon
                sx={{
                  fontSize: '1rem',
                  color: mode === 'dark' ? 'primary.main' : 'text.tertiary'
                }}
              />
              <Switch
                checked={mode === 'dark'}
                onChange={() => setMode(mode === 'light' ? 'dark' : 'light')}
                sx={{
                  '--Switch-track-width': '32px',
                  '--Switch-thumb-size': '12px',
                  '--Switch-track-background': 'background.level3'
                }}
                size="sm"
              />
              <LightModeIcon
                sx={{
                  fontSize: '1rem',
                  color: mode === 'light' ? 'primary.main' : 'text.tertiary'
                }}
              />
            </Box>
          </Box>
          <ListItem>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                color: 'danger.plainColor',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                p: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                '&:hover': { 
                  bgcolor: 'danger.softHoverBg',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: 'none'
                }
              }}
            >
              <ListItemDecorator
                sx={{
                  color: 'inherit',
                  minWidth: 'auto'
                }}
              >
                <LogoutIcon />
              </ListItemDecorator>
              <Typography
                level="body-sm"
                sx={{
                  fontWeight: 'inherit',
                  color: 'inherit'
                }}
              >
                Logout
              </Typography>
            </ListItemButton>
          </ListItem>
        </Box>
      </Sheet>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.body',
          p: 3,
          ml: '240px',
          minHeight: '100vh',
          width: 'calc(100% - 240px)'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}