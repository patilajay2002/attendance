import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#1976d2', '#dc004e'];

interface Stats {
  totalStudents: number;
  totalCourses: number;
  todayAttendance: number;
  totalAttendance: number;
}

interface AttendanceData {
  bar: Array<{ date: string; count: number }>;
  pie: Array<{ name: string; value: number }>;
  raw: Array<{
    date: string;
    status: 'present' | 'absent';
    student: number;
  }>;
}

interface Student {
  id: number;
  name: string;
  roll_number: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalCourses: 0,
    todayAttendance: 0,
    totalAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    bar: [],
    pie: [],
    raw: [],
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentAttendance, setStudentAttendance] = useState<AttendanceData['raw']>([]);

  useEffect(() => {
    fetchStats();
    fetchAttendanceData();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAttendance(selectedStudent);
    } else {
      setStudentAttendance([]);
    }
  }, [selectedStudent]);

  const fetchStats = async () => {
    try {
      const [studentsRes, coursesRes, attendanceRes] = await Promise.all([
        axios.get<{ count: number }>('http://localhost:8000/api/students/'),
        axios.get<{ count: number }>('http://localhost:8000/api/courses/'),
        axios.get<{ count: number; results: AttendanceData['raw'] }>('http://localhost:8000/api/attendance/'),
      ]);
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceRes.data.results.filter(
        (record) => record.date === today
      ).length;
      setStats({
        totalStudents: studentsRes.data.count,
        totalCourses: coursesRes.data.count,
        todayAttendance,
        totalAttendance: attendanceRes.data.count,
      });
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const res = await axios.get<{ results: AttendanceData['raw'] }>('http://localhost:8000/api/attendance/');
      const data = res.data.results;
      // Group by date for bar chart
      const dateMap: Record<string, number> = {};
      let present = 0;
      let absent = 0;
      data.forEach((rec) => {
        if (!dateMap[rec.date]) dateMap[rec.date] = 0;
        dateMap[rec.date] += 1;
        if (rec.status === 'present') present += 1;
        if (rec.status === 'absent') absent += 1;
      });
      setAttendanceData({
        bar: Object.entries(dateMap).map(([date, count]) => ({ date, count })),
        pie: [
          { name: 'Present', value: present },
          { name: 'Absent', value: absent },
        ],
        raw: data,
      });
    } catch (error) {}
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get<{ results: Student[] }>('http://localhost:8000/api/students/');
      setStudents(res.data.results);
    } catch (error) {}
  };

  const fetchStudentAttendance = async (studentId: string) => {
    try {
      const res = await axios.get<{ results: AttendanceData['raw'] }>('http://localhost:8000/api/attendance/', {
        params: { student: studentId },
      });
      setStudentAttendance(res.data.results);
    } catch (error) {}
  };

  const handleStudentChange = (event: SelectChangeEvent<string>) => {
    setSelectedStudent(event.target.value);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.username}!
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Students
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalStudents}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Courses
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalCourses}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Today's Attendance
            </Typography>
            <Typography component="p" variant="h4">
              {stats.todayAttendance}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Attendance Records
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalAttendance}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Analytics Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 340 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Trend (Daily)
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attendanceData.bar} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Present vs Absent
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={attendanceData.pie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  label
                >
                  {attendanceData.pie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Student Attendance Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Student Attendance
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Student</InputLabel>
              <Select
                value={selectedStudent}
                label="Select Student"
                onChange={handleStudentChange}
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name} ({student.roll_number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {studentAttendance.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Attendance Records
                </Typography>
                {studentAttendance.map((record, index) => (
                  <Typography key={index} variant="body2">
                    Date: {record.date} - Status: {record.status}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 