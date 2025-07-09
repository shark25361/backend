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
    'http://localhost:3000',
    'https://social-graph-visualizer.vercel.app',
    'https://preview--insta-metrics-dash.lovable.app/',
    /\.lovable\.app$/,
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
// … your existing code …

// Export for Vercel serverless deployment
module.exports = app;

// If this file is run directly (i.e. npm run dev), start the server:
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}
