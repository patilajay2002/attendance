import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  Grid,
} from '@mui/material';
import axios from 'axios';

interface Student {
  first_name: string;
  last_name: string;
  email: string;
  photo?: string;
  course?: {
    name: string;
  };
}

interface AttendanceResult {
  student?: Student;
  date: string;
  time_in: string;
  status: string;
  confidence_score?: number;
}

interface ErrorResponse {
  error: string;
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

const InstantAttendance: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [capturing, setCapturing] = useState<boolean>(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [facePosition, setFacePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Function to check if face is detected in the webcam feed
  const checkFaceDetection = async () => {
    if (!webcamRef.current) return;
    
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
      }
    } catch (err) {
      setFaceDetected(false);
      setFacePosition(null);
    }
  };

  // Check for face every 500ms
  useEffect(() => {
    const interval = setInterval(checkFaceDetection, 500);
    return () => clearInterval(interval);
  }, []);

  const capture = async (): Promise<void> => {
    if (!faceDetected) {
      setError('Please position your face in the frame');
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError('Could not capture image.');
      setLoading(false);
      return;
    }

    // Log imageSrc
    console.log('Instant Attendance - Image source captured:', imageSrc ? 'Valid' : 'Null');

    // Convert base64 to blob
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append('image', blob, 'capture.jpg');

    // Log formData content (keys)
    console.log('Instant Attendance - FormData keys:', Array.from(formData.keys()));

    try {
      const response = await axios.post<AttendanceResult>('/api/attendance/mark_attendance/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const axiosError = err as { response?: { data?: ErrorResponse } };
        setError(axiosError.response?.data?.error || 'Face not recognized or attendance already marked.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Instant Face Attendance
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Position your face in the frame and click "Capture & Mark Attendance"
        </Typography>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            videoConstraints={{ facingMode: 'user' }}
            style={{ 
              borderRadius: 8, 
              border: `2px solid ${faceDetected ? '#4caf50' : '#f44336'}`,
              position: 'relative'
            }}
          />
          {facePosition && (
            <Box
              sx={{
                position: 'absolute',
                border: '2px solid #4caf50',
                borderRadius: 1,
                top: facePosition.y,
                left: facePosition.x,
                width: facePosition.width,
                height: facePosition.height,
                pointerEvents: 'none',
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Alert severity={faceDetected ? "success" : "warning"}>
            {faceDetected ? "Face detected" : "No face detected"}
          </Alert>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={capture}
          disabled={loading || !faceDetected}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Capture & Mark Attendance'}
        </Button>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {result && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert severity="success">
              Attendance marked for <b>{result.student?.first_name} {result.student?.last_name}</b><br />
              <b>Date:</b> {result.date} <b>Time:</b> {result.time_in && new Date(result.time_in).toLocaleTimeString()}<br />
              <b>Status:</b> {result.status} <b>Confidence:</b> {result.confidence_score ? (result.confidence_score * 100).toFixed(1) + '%' : ''}
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              {result.student?.photo && (
                <Avatar src={result.student.photo} sx={{ width: 80, height: 80, mb: 1 }} />
              )}
              <Typography variant="body2">{result.student?.email}</Typography>
              <Typography variant="body2">{result.student?.course?.name}</Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default InstantAttendance; 