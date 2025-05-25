import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  School as SchoolIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get<{ results: Course[] }>('/api/courses/');
      setCourses(response.data.results);
      setError(null);
    } catch (err) {
      setError('Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} thickness={4} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ fontSize: '1.1rem' }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Courses
        </Typography>
        <Button
          variant="contained"
          startIcon={<SchoolIcon />}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          }}
        >
          Add Course
        </Button>
      </Box>

      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon sx={{ fontSize: 40, color: '#2196F3', mr: 1 }} />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    {course.name}
                  </Typography>
                </Box>
                
                <Chip
                  icon={<CodeIcon />}
                  label={course.code}
                  sx={{ 
                    mb: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    color: 'white',
                  }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <DescriptionIcon sx={{ color: '#666', mr: 1, mt: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {course.description || 'No description available'}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Tooltip title="Edit Course">
                  <IconButton color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Course">
                  <IconButton color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Courses; 