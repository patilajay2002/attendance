import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, PhotoCamera } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  course?: Course;
  photo?: string;
}

interface StudentForm {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  course_id: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface FaceDetectionResponse {
  face_detected: boolean;
  confidence?: number;
  face_position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  message?: string;
}

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    course_id: '',
  });
  const [photoDialog, setPhotoDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const photoWebcamRef = useRef<Webcam>(null);
  const [photoFaceDetected, setPhotoFaceDetected] = useState<boolean>(false);
  const [photoFacePosition, setPhotoFacePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading) {
      fetchStudents();
      fetchCourses();
    }
  }, [authLoading]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ results: Student[] }>('/api/students/');
      setStudents(res.data.results);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch students', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get<{ results: Course[] }>('/api/courses/');
      console.log('Courses response:', res.data); // Debug log
      setCourses(res.data.results);
    } catch (error) {
      console.error('Error fetching courses:', error); // Debug log
      setSnackbar({ open: true, message: 'Failed to fetch courses', severity: 'error' });
    }
  };

  const handleOpenDialog = (student: Student | null = null) => {
    setEditStudent(student);
    setForm(
      student
        ? {
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            course_id: student.course?.id.toString() || '',
          }
        : { student_id: '', first_name: '', last_name: '', email: '', course_id: '' }
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditStudent(null);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSaveStudent = async () => {
    try {
      if (editStudent) {
        await axios.put(`/api/students/${editStudent.id}/`, {
          ...form,
          course: form.course_id,
        });
        setSnackbar({ open: true, message: 'Student updated', severity: 'success' });
      } else {
        await axios.post('/api/students/', {
          ...form,
          course: form.course_id,
        });
        setSnackbar({ open: true, message: 'Student added', severity: 'success' });
      }
      fetchStudents();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save student', severity: 'error' });
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(`/api/students/${student.id}/`);
      setSnackbar({ open: true, message: 'Student deleted', severity: 'success' });
      fetchStudents();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete student', severity: 'error' });
    }
  };

  const handleOpenPhotoDialog = (student: Student) => {
    setSelectedStudent(student);
    setPhotoDialog(true);
    setPhotoFaceDetected(false);
    setPhotoFacePosition(null);
  };

  const handleClosePhotoDialog = () => {
    setPhotoDialog(false);
    setSelectedStudent(null);
    setPhotoFaceDetected(false);
    setPhotoFacePosition(null);
  };

  const checkPhotoFaceDetection = async () => {
    if (!photoWebcamRef.current || !photoDialog) return;

    const imageSrc = photoWebcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'check.jpg');

      const response = await axios.post<FaceDetectionResponse>('/api/attendance/check_face/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPhotoFaceDetected(response.data.face_detected);
      if (response.data.face_position) {
        setPhotoFacePosition(response.data.face_position);
      } else {
        setPhotoFacePosition(null);
      }
    } catch (err) {
      setPhotoFaceDetected(false);
      setPhotoFacePosition(null);
    }
  };

  useEffect(() => {
    let interval: number | null = null;
    if (photoDialog) {
      interval = setInterval(checkPhotoFaceDetection, 500);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [photoDialog]);

  const handleUploadPhoto = async () => {
    if (!photoFaceDetected || !selectedStudent) {
       setSnackbar({ open: true, message: 'No face detected in the frame', severity: 'warning' });
       return;
    }

    setUploadingPhoto(true);
    setSnackbar({ open: false, message: '', severity: 'success' });

    try {
      const imageSrc = photoWebcamRef.current?.getScreenshot();
      if (!imageSrc) {
        throw new Error('Could not capture image');
      }

      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('student_id', selectedStudent.student_id);
      formData.append('photo', blob, 'capture.jpg');

      await axios.post('/api/students/upload_photo/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSnackbar({ open: true, message: 'Photo uploaded and face encoded', severity: 'success' });
      fetchStudents();
      handleClosePhotoDialog();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to upload photo', severity: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Students
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        sx={{ mb: 2 }}
        onClick={() => navigate('/register-student')}
      >
        Add Student
      </Button>
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Photo</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        {student.photo ? (
                          <Avatar src={student.photo} alt={student.first_name} />
                        ) : (
                          <Avatar>{student.first_name?.[0]}</Avatar>
                        )}
                      </TableCell>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>{student.first_name} {student.last_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.course?.name}</TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={() => handleOpenDialog(student)}>
                          <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDeleteStudent(student)}>
                          <Delete />
                        </IconButton>
                        <IconButton color="secondary" onClick={() => handleOpenPhotoDialog(student)}>
                          <PhotoCamera />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={students.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Paper>

      {/* Add/Edit Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="student_id"
              label="Student ID"
              value={form.student_id}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              name="first_name"
              label="First Name"
              value={form.first_name}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              name="last_name"
              label="Last Name"
              value={form.last_name}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleFormChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                name="course_id"
                value={form.course_id}
                label="Course"
                onChange={handleFormChange}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveStudent} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialog} onClose={handleClosePhotoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Student Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, alignItems: 'center' }}>
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
               <Webcam
                audio={false}
                ref={photoWebcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: 'user' }}
                style={{ 
                  borderRadius: 8,
                  border: `2px solid ${photoFaceDetected ? '#4caf50' : '#f44336'}`,
                  width: '100%',
                  height: 'auto'
                }}
              />
               {photoFacePosition && (
                <Box
                  sx={{
                    position: 'absolute',
                    border: '2px solid #4caf50',
                    borderRadius: 1,
                    top: `${photoFacePosition.y}px`,
                    left: `${photoFacePosition.x}px`,
                    width: `${photoFacePosition.width}px`,
                    height: `${photoFacePosition.height}px`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
               <Alert severity={photoFaceDetected ? "success" : "warning"}>
                {photoFaceDetected ? "Face detected" : "No face detected"}
              </Alert>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePhotoDialog}>Cancel</Button>
          <Button
            onClick={handleUploadPhoto}
            variant="contained"
            color="primary"
            disabled={uploadingPhoto || !photoFaceDetected}
          >
            {uploadingPhoto ? <CircularProgress size={24} /> : 'Upload Photo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Students; 