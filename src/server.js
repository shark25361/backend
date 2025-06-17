const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const insightsRouter = require('./routes/insights');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://social-graph-visualizer.vercel.app',
    /\.vercel\.app$/  // Allow all Vercel preview deployments
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Use the insights router
app.use('/', insightsRouter);

// Export for Vercel serverless deployment
module.exports = app;