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
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { AddAPhoto } from '@mui/icons-material';
import axios from 'axios';
import Webcam from 'react-webcam';

interface Course {
  id: number;
  name: string;
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

interface AttendanceRecord {
  id: number;
  student?: Student;
  date: string;
  time_in?: string;
  status: 'present' | 'absent';
  confidence_score?: number;
}

interface Filters {
  student: string;
  course: string;
  date: string;
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

const Attendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<Filters>({ student: '', course: '', date: '' });
  const [markDialog, setMarkDialog] = useState(false);
  const [markStudent, setMarkStudent] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  
  const webcamRef = useRef<Webcam>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [facePosition, setFacePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [markLoading, setMarkLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchAttendance = async (params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get<{ results: AttendanceRecord[] }>('/api/attendance/', { params });
      setAttendance(res.data.results);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch attendance', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get<{ results: Student[] }>('/api/students/');
      setStudents(res.data.results);
    } catch (error) {}
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

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name as string]: value }));
  };

  const handleApplyFilters = () => {
    fetchAttendance({
      student: filters.student,
      course: filters.course,
      date: filters.date,
    });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenMarkDialog = () => {
    setMarkDialog(true);
    setMarkStudent('');
    setFaceDetected(false);
    setFacePosition(null);
  };

  const handleCloseMarkDialog = () => {
    setMarkDialog(false);
    setMarkStudent('');
    setFaceDetected(false);
    setFacePosition(null);
  };

  const checkFaceDetection = async () => {
    if (!webcamRef.current || !markDialog) return; // Only check when dialog is open

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'check.jpg');

      const response = await axios.post<FaceDetectionResponse>('/api/attendance/check_face/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFaceDetected(response.data.face_detected);
      if (response.data.face_position) {
        setFacePosition(response.data.face_position);
      } else {
        setFacePosition(null);
      }
    } catch (err) {
      setFaceDetected(false);
      setFacePosition(null);
    }
  };

  useEffect(() => {
    let interval: number | null = null;
    if (markDialog) {
      interval = setInterval(checkFaceDetection, 500);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [markDialog]);

  const handleMarkAttendance = async () => {
    if (!faceDetected) {
      setSnackbar({ open: true, message: 'No face detected in the frame', severity: 'warning' });
      return;
    }

    setMarkLoading(true);
    setSnackbar({ open: false, message: '', severity: 'success' });

    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        throw new Error('Could not capture image');
      }

      // Log to confirm imageSrc is captured
      console.log('Image source captured for mark attendance:', imageSrc ? 'Valid' : 'Null');

      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');
      if (markStudent) formData.append('student_id', markStudent);

      await axios.post('/api/attendance/mark_attendance/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSnackbar({ open: true, message: 'Attendance marked successfully', severity: 'success' });
      fetchAttendance(); // Refresh attendance list
      handleCloseMarkDialog();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to mark attendance', severity: 'error' });
    } finally {
      setMarkLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Attendance
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 180 }} size="small">
            <InputLabel id="student-label">Student</InputLabel>
            <Select
              labelId="student-label"
              name="student"
              value={filters.student}
              label="Student"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }} size="small">
            <InputLabel id="course-label">Course</InputLabel>
            <Select
              labelId="course-label"
              name="course"
              value={filters.course}
              label="Course"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="date"
            label="Date"
            type="date"
            size="small"
            value={filters.date}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={handleApplyFilters} sx={{ minWidth: 120 }}>
            Filter
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<AddAPhoto />}
            color="secondary"
            onClick={handleOpenMarkDialog}
          >
            Mark Attendance
          </Button>
        </Box>
      </Paper>
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
                    <TableCell>Student</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time In</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.student ? `${record.student.first_name} ${record.student.last_name}` : 'N/A'}</TableCell>
                      <TableCell>{record.student?.course?.name || 'N/A'}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.time_in || 'N/A'}</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>{record.confidence_score !== undefined ? record.confidence_score.toFixed(2) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={attendance.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Paper>

      {/* Mark Attendance Dialog */}
      <Dialog open={markDialog} onClose={handleCloseMarkDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, alignItems: 'center' }}>
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
               <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: 'user' }}
                style={{ 
                  borderRadius: 8,
                  border: `2px solid ${faceDetected ? '#4caf50' : '#f44336'}`,
                  width: '100%',
                  height: 'auto'
                }}
              />
               {facePosition && (
                <Box
                  sx={{
                    position: 'absolute',
                    border: '2px solid #4caf50',
                    borderRadius: 1,
                    top: `${facePosition.y}px`,
                    left: `${facePosition.x}px`,
                    width: `${facePosition.width}px`,
                    height: `${facePosition.height}px`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
               <Alert severity={faceDetected ? "success" : "warning"}>
                {faceDetected ? "Face detected" : "No face detected"}
              </Alert>
            </Box>
             <FormControl fullWidth size="small">
              <InputLabel id="mark-student-label">Select Student (Optional)</InputLabel>
              <Select
                labelId="mark-student-label"
                value={markStudent}
                label="Select Student (Optional)"
                onChange={(e) => setMarkStudent(e.target.value as string)}
              >
                <MenuItem value="">Anyone</MenuItem>
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.student_id}>
                    {student.first_name} {student.last_name} ({student.student_id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMarkDialog}>Cancel</Button>
          <Button
            onClick={handleMarkAttendance}
            variant="contained"
            color="primary"
            disabled={markLoading || !faceDetected}
          >
            {markLoading ? <CircularProgress size={24} /> : 'Mark Attendance'}
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

export default Attendance;