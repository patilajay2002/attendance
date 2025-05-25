import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Navbar from './components/Navbar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Students from './pages/Students.tsx';
import Courses from './pages/Courses.tsx';
import Attendance from './pages/Attendance.tsx';
import Login from './pages/Login.tsx';
import InstantAttendance from './pages/InstantAttendance.tsx';
import StudentRegistration from './pages/StudentRegistration.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#5b21b6',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #2563eb 30%, #7c3aed 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1d4ed8 30%, #5b21b6 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            }}
          >
            <Navbar />
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1, 
                p: { xs: 2, sm: 3, md: 4 },
                maxWidth: '1400px',
                width: '100%',
                mx: 'auto',
                mt: { xs: 2, sm: 3 },
              }}
            >
              <Routes>
                <Route path="/" element={<InstantAttendance />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register-student" element={<StudentRegistration />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 