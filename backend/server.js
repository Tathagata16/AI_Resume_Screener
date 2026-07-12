const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Allow requests from the frontend URL
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve local upload files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resume'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/comparisons', require('./routes/comparison'));
app.use('/api/ai', require('./routes/ai'));

// Root path health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'AI Resume Screener Backend API is running' 
  });
});

// Fallback Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
