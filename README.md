# Smart College Attendance System

A modern attendance management system using face recognition technology.

## Features

- Face-based attendance marking
- Admin dashboard for student management
- Real-time attendance tracking
- Detailed attendance reports and analytics
- Face recognition using OpenCV and face_recognition

## Tech Stack

- **Frontend**: React.js (Vite), TailwindCSS
- **Backend**: Django, Django REST Framework
- **Database**: SQLite
- **Face Recognition**: OpenCV, face_recognition

## Project Structure

```
smart-attendance/
├── backend/           # Django backend
│   ├── attendance/    # Main Django app
│   ├── api/          # REST API endpoints
│   └── manage.py
├── frontend/         # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── requirements.txt  # Python dependencies
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   cd backend
   python manage.py migrate
   ```

4. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the backend directory with:

```
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## License

MIT 

# Face Recognition System

This is a real-time face recognition system that uses your webcam to detect and recognize faces.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a directory called `known_faces` in the same directory as the script.

3. Add photos of people you want to recognize to the `known_faces` directory. Name the files with the person's name (e.g., `john.jpg`, `sarah.png`). Make sure each photo contains only one face.

## Usage

1. Run the script:
```bash
python face_recognition_system.py
```

2. The system will:
   - Load all known faces from the `known_faces` directory
   - Start your webcam
   - Display a window showing the video feed with face detection boxes
   - Label recognized faces with their names
   - Label unknown faces as "Unknown"

3. Press 'q' to quit the application.

## Features

- Real-time face detection and recognition
- Support for multiple faces in the frame
- Easy addition of new faces by adding photos to the `known_faces` directory
- Visual feedback with bounding boxes and name labels

## Requirements

- Python 3.6 or higher
- Webcam
- Sufficient lighting for face detection 