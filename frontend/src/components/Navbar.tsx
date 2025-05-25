import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useAuth } from '../contexts/AuthContext';

interface Page {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const pages: Page[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'Students', path: '/students', icon: <PeopleIcon /> },
  { title: 'Courses', path: '/courses', icon: <SchoolIcon /> },
  { title: 'Attendance', path: '/attendance', icon: <EventNoteIcon /> },
];

const settings: string[] = ['Profile', 'Logout'];

const Navbar: React.FC = () => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleUserMenuClick = (setting: string) => {
    handleCloseUserMenu();
    if (setting === 'Logout') {
      logout();
      navigate('/login');
    }
  };

  if (!user) {
    return (
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'transparent',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h5"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                display: { xs: 'none', sm: 'block' },
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Smart Attendance
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Login
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'transparent',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Smart Attendance
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="primary"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  mt: 1.5,
                  minWidth: 180,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
              }}
            >
              {pages.map((page) => (
                <MenuItem 
                  key={page.title} 
                  onClick={() => {
                    handleCloseNavMenu();
                    navigate(page.path);
                  }}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {page.icon}
                    <Typography textAlign="center">{page.title}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Smart Attendance
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {pages.map((page) => (
              <Button
                key={page.title}
                onClick={() => navigate(page.path)}
                startIcon={page.icon}
                sx={{
                  my: 2,
                  color: location.pathname === page.path ? theme.palette.primary.main : 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateY(-1px)',
                  },
                  ...(location.pathname === page.path && {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    fontWeight: 600,
                  }),
                }}
              >
                {page.title}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton 
                onClick={handleOpenUserMenu} 
                sx={{ 
                  p: 0,
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Avatar 
                  alt={user.username} 
                  src="/static/images/avatar/2.jpg"
                  sx={{
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{
                mt: '45px',
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
              }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem 
                  key={setting} 
                  onClick={() => handleUserMenuClick(setting)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 